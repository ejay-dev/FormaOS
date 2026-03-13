/** @jest-environment node */

/**
 * Tests for lib/billing/nightly-reconciliation.ts
 *
 * Covers:
 * - canAutoFixStatus logic via shouldAutoCancelMissingStripe (already in invariants)
 * - runBillingReconciliation: status/plan/period-end mismatch detection
 * - Auto-fix behavior
 * - Missing Stripe subscription handling
 * - Error propagation
 */

// ---- Mocks ----

let mockSubscriptions: Array<Record<string, unknown>> = [];
let mockStripeSubscriptions: Record<string, Record<string, unknown>> = {};
let dbUpdates: Array<{ table: string; data: unknown; filter: Record<string, unknown> }> = [];
let dbInserts: Array<{ table: string; data: unknown }> = [];
let mockSubError: { message: string } | null = null;
let mockUpdateErrors: Record<string, { message: string } | null> = {};

function resetMocks() {
  mockSubscriptions = [];
  mockStripeSubscriptions = {};
  dbUpdates = [];
  dbInserts = [];
  mockSubError = null;
  mockUpdateErrors = {};
}

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => ({
      select: (columns: string) => ({
        not: (col: string, op: string, val: unknown) => {
          if (table === 'org_subscriptions') {
            return {
              data: mockSubError ? null : mockSubscriptions,
              error: mockSubError,
            };
          }
          return { data: [], error: null };
        },
      }),
      update: (data: unknown) => ({
        eq: (col: string, val: unknown) => {
          const filter = { [col]: val };
          dbUpdates.push({ table, data, filter });
          const key = `${table}.update`;
          if (mockUpdateErrors[key]) return { error: mockUpdateErrors[key] };
          return { error: null };
        },
      }),
      insert: (data: unknown) => ({
        then: (cb: (result: { error: null }) => void) => {
          dbInserts.push({ table, data });
          cb({ error: null });
        },
      }),
    }),
  }),
}));

const mockSyncEntitlements = jest.fn();
jest.mock('@/lib/billing/entitlements', () => ({
  syncEntitlementsForPlan: (...args: unknown[]) => mockSyncEntitlements(...args),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  billingLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

let mockStripeClient: {
  subscriptions: {
    retrieve: jest.Mock;
  };
} | null = null;

jest.mock('@/lib/billing/stripe', () => ({
  getStripeClient: () => mockStripeClient,
  resolvePlanKeyFromPriceId: (priceId: string | null) => {
    if (priceId === 'price_basic') return 'basic';
    if (priceId === 'price_pro') return 'pro';
    if (priceId === 'price_enterprise') return 'enterprise';
    return null;
  },
}));

import {
  runBillingReconciliation,
  shouldAutoCancelMissingStripe,
} from '@/lib/billing/nightly-reconciliation';

beforeEach(() => {
  resetMocks();
  mockSyncEntitlements.mockReset();
  mockStripeClient = {
    subscriptions: {
      retrieve: jest.fn(),
    },
  };
});

describe('runBillingReconciliation', () => {
  describe('early exits', () => {
    it('returns early with error when Stripe is not configured', async () => {
      mockStripeClient = null;

      const result = await runBillingReconciliation();

      expect(result.checked).toBe(0);
      expect(result.errors).toContain('Stripe not configured');
    });

    it('returns early when subscription fetch fails', async () => {
      mockSubError = { message: 'DB connection failed' };

      const result = await runBillingReconciliation();

      expect(result.checked).toBe(0);
      expect(result.errors[0]).toContain('DB connection failed');
    });

    it('returns clean result when no subscriptions exist', async () => {
      mockSubscriptions = [];

      const result = await runBillingReconciliation();

      expect(result.checked).toBe(0);
      expect(result.discrepancies).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('status mismatch detection', () => {
    it('detects status mismatch between local and Stripe', async () => {
      mockSubscriptions = [
        {
          organization_id: 'org-1',
          plan_key: 'pro',
          status: 'trialing',
          stripe_subscription_id: 'sub_123',
          current_period_end: null,
          organizations: { name: 'Test Org' },
        },
      ];

      mockStripeClient!.subscriptions.retrieve.mockResolvedValue({
        status: 'active',
        items: { data: [{ price: { id: 'price_pro' } }] },
        current_period_end: null,
      });

      const result = await runBillingReconciliation();

      expect(result.checked).toBe(1);
      expect(result.discrepancies).toHaveLength(1);
      expect(result.discrepancies[0].discrepancyType).toBe('status_mismatch');
      expect(result.discrepancies[0].localValue).toBe('trialing');
      expect(result.discrepancies[0].stripeValue).toBe('active');
    });

    it('auto-fixes trialing -> active status', async () => {
      mockSubscriptions = [
        {
          organization_id: 'org-1',
          plan_key: 'pro',
          status: 'trialing',
          stripe_subscription_id: 'sub_123',
          current_period_end: null,
          organizations: null,
        },
      ];

      mockStripeClient!.subscriptions.retrieve.mockResolvedValue({
        status: 'active',
        items: { data: [{ price: { id: 'price_pro' } }] },
        current_period_end: null,
      });

      const result = await runBillingReconciliation();

      expect(result.autoFixed).toBe(1);
      expect(result.discrepancies[0].autoFixed).toBe(true);
      expect(dbUpdates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            table: 'org_subscriptions',
            data: expect.objectContaining({ status: 'active' }),
          }),
        ]),
      );
    });
  });

  describe('plan mismatch detection', () => {
    it('detects plan mismatch and auto-fixes', async () => {
      mockSubscriptions = [
        {
          organization_id: 'org-1',
          plan_key: 'basic',
          status: 'active',
          stripe_subscription_id: 'sub_123',
          current_period_end: null,
          organizations: null,
        },
      ];

      mockStripeClient!.subscriptions.retrieve.mockResolvedValue({
        status: 'active',
        items: { data: [{ price: { id: 'price_pro' } }] },
        current_period_end: null,
      });

      const result = await runBillingReconciliation();

      const planMismatch = result.discrepancies.find(
        d => d.discrepancyType === 'plan_mismatch',
      );
      expect(planMismatch).toBeDefined();
      expect(planMismatch!.localValue).toBe('basic');
      expect(planMismatch!.stripeValue).toBe('pro');
      expect(planMismatch!.autoFixed).toBe(true);

      // Should sync entitlements after plan fix
      expect(mockSyncEntitlements).toHaveBeenCalledWith('org-1', 'pro');
    });
  });

  describe('period end mismatch detection', () => {
    it('detects period end mismatch beyond 1-day tolerance', async () => {
      const localEnd = new Date('2026-03-10T00:00:00Z');
      const stripeEnd = new Date('2026-03-15T00:00:00Z');

      mockSubscriptions = [
        {
          organization_id: 'org-1',
          plan_key: 'pro',
          status: 'active',
          stripe_subscription_id: 'sub_123',
          current_period_end: localEnd.toISOString(),
          organizations: null,
        },
      ];

      mockStripeClient!.subscriptions.retrieve.mockResolvedValue({
        status: 'active',
        items: { data: [{ price: { id: 'price_pro' } }] },
        current_period_end: Math.floor(stripeEnd.getTime() / 1000),
      });

      const result = await runBillingReconciliation();

      const periodMismatch = result.discrepancies.find(
        d => d.discrepancyType === 'period_end_mismatch',
      );
      expect(periodMismatch).toBeDefined();
      expect(periodMismatch!.autoFixed).toBe(true);
    });

    it('ignores period end differences within 1-day tolerance', async () => {
      const now = Date.now();
      const localEnd = new Date(now);
      const stripeEnd = new Date(now + 12 * 60 * 60 * 1000); // 12 hours later

      mockSubscriptions = [
        {
          organization_id: 'org-1',
          plan_key: 'pro',
          status: 'active',
          stripe_subscription_id: 'sub_123',
          current_period_end: localEnd.toISOString(),
          organizations: null,
        },
      ];

      mockStripeClient!.subscriptions.retrieve.mockResolvedValue({
        status: 'active',
        items: { data: [{ price: { id: 'price_pro' } }] },
        current_period_end: Math.floor(stripeEnd.getTime() / 1000),
      });

      const result = await runBillingReconciliation();

      const periodMismatch = result.discrepancies.find(
        d => d.discrepancyType === 'period_end_mismatch',
      );
      expect(periodMismatch).toBeUndefined();
    });
  });

  describe('missing Stripe subscription', () => {
    it('detects missing Stripe subscription', async () => {
      mockSubscriptions = [
        {
          organization_id: 'org-1',
          plan_key: 'pro',
          status: 'past_due',
          stripe_subscription_id: 'sub_deleted',
          current_period_end: null,
          organizations: { name: 'Gone Org' },
        },
      ];

      const resourceError = new Error('No such subscription');
      (resourceError as Error & { code: string }).code = 'resource_missing';
      mockStripeClient!.subscriptions.retrieve.mockRejectedValue(resourceError);

      const result = await runBillingReconciliation();

      const missing = result.discrepancies.find(
        d => d.discrepancyType === 'missing_stripe_subscription',
      );
      expect(missing).toBeDefined();
      expect(missing!.autoFixed).toBe(true);
    });

    it('does NOT auto-cancel active subscriptions with missing Stripe', async () => {
      mockSubscriptions = [
        {
          organization_id: 'org-1',
          plan_key: 'pro',
          status: 'active',
          stripe_subscription_id: 'sub_deleted',
          current_period_end: null,
          organizations: null,
        },
      ];

      const resourceError = new Error('No such subscription');
      (resourceError as Error & { code: string }).code = 'resource_missing';
      mockStripeClient!.subscriptions.retrieve.mockRejectedValue(resourceError);

      const result = await runBillingReconciliation();

      const missing = result.discrepancies.find(
        d => d.discrepancyType === 'missing_stripe_subscription',
      );
      expect(missing).toBeDefined();
      // shouldAutoCancelMissingStripe('active') returns false
      expect(missing!.autoFixed).toBe(false);
    });
  });

  describe('non-Stripe errors', () => {
    it('records errors for non-resource-missing Stripe errors', async () => {
      mockSubscriptions = [
        {
          organization_id: 'org-1',
          plan_key: 'pro',
          status: 'active',
          stripe_subscription_id: 'sub_123',
          current_period_end: null,
          organizations: null,
        },
      ];

      mockStripeClient!.subscriptions.retrieve.mockRejectedValue(
        new Error('Stripe API rate limited'),
      );

      const result = await runBillingReconciliation();

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Stripe API rate limited'),
        ]),
      );
      expect(result.discrepancies).toHaveLength(0);
    });
  });

  describe('result shape', () => {
    it('returns correct result shape with no discrepancies', async () => {
      mockSubscriptions = [
        {
          organization_id: 'org-1',
          plan_key: 'pro',
          status: 'active',
          stripe_subscription_id: 'sub_123',
          current_period_end: new Date().toISOString(),
          organizations: null,
        },
      ];

      mockStripeClient!.subscriptions.retrieve.mockResolvedValue({
        status: 'active',
        items: { data: [{ price: { id: 'price_pro' } }] },
        current_period_end: Math.floor(Date.now() / 1000),
      });

      const result = await runBillingReconciliation();

      expect(result).toMatchObject({
        checked: 1,
        discrepancies: [],
        autoFixed: 0,
        requiresManual: 0,
        errors: [],
      });
      expect(typeof result.duration).toBe('number');
    });
  });
});

/**
 * Tests for lib/billing/nightly-reconciliation.ts
 *
 * Exports: shouldAutoCancelMissingStripe, runBillingReconciliation
 */

jest.mock('server-only', () => ({}));

function createBuilder(result = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
    'then',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

const mockStripe = {
  subscriptions: {
    retrieve: jest.fn(),
  },
};

jest.mock('@/lib/billing/stripe', () => ({
  getStripeClient: jest.fn(() => mockStripe),
  resolvePlanKeyFromPriceId: jest.fn((priceId: string) =>
    priceId === 'price_pro' ? 'pro' : 'starter',
  ),
}));

jest.mock('@/lib/billing/entitlements', () => ({
  syncEntitlementsForPlan: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/plans', () => ({
  resolvePlanKey: jest.fn((key: string) => key),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  billingLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import {
  shouldAutoCancelMissingStripe,
  runBillingReconciliation,
} from '@/lib/billing/nightly-reconciliation';

beforeEach(() => jest.clearAllMocks());

describe('shouldAutoCancelMissingStripe', () => {
  it('returns false for active status', () => {
    expect(shouldAutoCancelMissingStripe('active')).toBe(false);
  });

  it('returns false for trialing status', () => {
    expect(shouldAutoCancelMissingStripe('trialing')).toBe(false);
  });

  it('returns true for past_due status', () => {
    expect(shouldAutoCancelMissingStripe('past_due')).toBe(true);
  });

  it('returns true for canceled status', () => {
    expect(shouldAutoCancelMissingStripe('canceled')).toBe(true);
  });

  it('returns false for null/empty status', () => {
    expect(shouldAutoCancelMissingStripe(null)).toBe(false);
    expect(shouldAutoCancelMissingStripe('')).toBe(false);
  });
});

describe('runBillingReconciliation', () => {
  it('returns early when Stripe is not configured', async () => {
    const { getStripeClient } = require('@/lib/billing/stripe');
    getStripeClient.mockReturnValueOnce(null);

    const result = await runBillingReconciliation();
    expect(result.checked).toBe(0);
    expect(result.errors).toContain('Stripe not configured');
  });

  it('returns error when subscription fetch fails', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'DB error' } }),
    );

    const result = await runBillingReconciliation();
    expect(result.checked).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('reports no discrepancies when everything matches', async () => {
    const subs = [
      {
        organization_id: 'org-1',
        plan_key: 'pro',
        status: 'active',
        stripe_subscription_id: 'sub_123',
        stripe_customer_id: 'cus_123',
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        organizations: { name: 'Acme' },
      },
    ];

    getClient().from.mockImplementation(() =>
      createBuilder({ data: subs, error: null }),
    );

    mockStripe.subscriptions.retrieve.mockResolvedValueOnce({
      status: 'active',
      items: { data: [{ price: { id: 'price_pro' } }] },
      current_period_end: Math.floor((Date.now() + 30 * 86400000) / 1000),
    });

    const result = await runBillingReconciliation();
    expect(result.checked).toBe(1);
    expect(result.discrepancies).toHaveLength(0);
  });

  it('detects status mismatch and auto-fixes', async () => {
    const subs = [
      {
        organization_id: 'org-1',
        plan_key: 'pro',
        status: 'trialing',
        stripe_subscription_id: 'sub_123',
        stripe_customer_id: 'cus_123',
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        organizations: { name: 'Acme' },
      },
    ];

    getClient().from.mockImplementation(() =>
      createBuilder({ data: subs, error: null }),
    );

    mockStripe.subscriptions.retrieve.mockResolvedValueOnce({
      status: 'active',
      items: { data: [{ price: { id: 'price_pro' } }] },
      current_period_end: Math.floor((Date.now() + 30 * 86400000) / 1000),
    });

    const result = await runBillingReconciliation();
    expect(result.discrepancies.length).toBeGreaterThanOrEqual(1);
    expect(result.discrepancies[0].discrepancyType).toBe('status_mismatch');
  });

  it('handles missing Stripe subscription', async () => {
    const subs = [
      {
        organization_id: 'org-1',
        plan_key: 'pro',
        status: 'past_due',
        stripe_subscription_id: 'sub_deleted',
        stripe_customer_id: 'cus_123',
        current_period_end: null,
        organizations: { name: 'Acme' },
      },
    ];

    getClient().from.mockImplementation(() =>
      createBuilder({ data: subs, error: null }),
    );

    const stripeError = new Error('No such subscription') as Error & {
      code?: string;
    };
    stripeError.code = 'resource_missing';
    mockStripe.subscriptions.retrieve.mockRejectedValueOnce(stripeError);

    const result = await runBillingReconciliation();
    expect(result.discrepancies.length).toBeGreaterThanOrEqual(1);
    expect(result.discrepancies[0].discrepancyType).toBe(
      'missing_stripe_subscription',
    );
  });

  it('handles generic Stripe error', async () => {
    const subs = [
      {
        organization_id: 'org-1',
        plan_key: 'pro',
        status: 'active',
        stripe_subscription_id: 'sub_123',
        stripe_customer_id: 'cus_123',
        current_period_end: null,
        organizations: null,
      },
    ];

    getClient().from.mockImplementation(() =>
      createBuilder({ data: subs, error: null }),
    );
    mockStripe.subscriptions.retrieve.mockRejectedValueOnce(
      new Error('Network timeout'),
    );

    const result = await runBillingReconciliation();
    expect(result.errors).toContain('Error checking org-1: Network timeout');
  });

  it('processes empty subscription list', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );

    const result = await runBillingReconciliation();
    expect(result.checked).toBe(0);
    expect(result.discrepancies).toHaveLength(0);
  });
});

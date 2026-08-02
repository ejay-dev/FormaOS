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

/**
 * Records every `from(table)` call together with the builder handed back, so
 * a test can assert on the corrective write (`update` on org_subscriptions)
 * rather than only on the reported discrepancy.
 */
let fromCalls: Array<{ table: string; builder: any }> = [];

function mockFrom(impl: (table: string, index: number) => any) {
  fromCalls = [];
  getClient().from.mockImplementation((table: string) => {
    const builder = impl(table, fromCalls.length);
    fromCalls.push({ table, builder });
    return builder;
  });
}

function buildersFor(table: string) {
  return fromCalls.filter((c) => c.table === table).map((c) => c.builder);
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

// Entitlement drift has its own unit suite; stub it here so the reconciler's
// discrepancy list is deterministic and `discrepancies[0]` means what the
// test says it means.
jest.mock('@/lib/billing/entitlement-drift-detector', () => ({
  detectEntitlementDrift: jest.fn().mockResolvedValue({
    hasDrift: false,
    expected: {},
    actual: {},
    corrections: [],
    autoFixed: false,
  }),
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

  // Audit 2026-08-02: the old single test was named "detects status mismatch
  // and auto-fixes" but asserted only that a discrepancy was reported. The
  // reconciler could log the drift and skip the corrective write entirely and
  // it still passed. AUTO_FIX_ENABLED is read from BILLING_AUTO_FIX at module
  // load, so the two halves need separate module instances.
  const mismatchedSub = () => ({
    organization_id: 'org-1',
    plan_key: 'pro',
    status: 'trialing',
    stripe_subscription_id: 'sub_123',
    stripe_customer_id: 'cus_123',
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    organizations: { name: 'Acme' },
  });

  const activeStripeSub = () => ({
    status: 'active',
    items: { data: [{ price: { id: 'price_pro' } }] },
    current_period_end: Math.floor((Date.now() + 30 * 86400000) / 1000),
  });

  it('reports a status mismatch but writes nothing when BILLING_AUTO_FIX is off', async () => {
    const subs = [mismatchedSub()];
    mockFrom(() => createBuilder({ data: subs, error: null }));
    mockStripe.subscriptions.retrieve.mockResolvedValueOnce(activeStripeSub());

    const result = await runBillingReconciliation();

    expect(result.discrepancies).toHaveLength(1);
    expect(result.discrepancies[0].discrepancyType).toBe('status_mismatch');
    expect(result.discrepancies[0].localValue).toBe('trialing');
    expect(result.discrepancies[0].stripeValue).toBe('active');
    expect(result.discrepancies[0].autoFixed).toBe(false);
    expect(result.autoFixed).toBe(0);
    expect(result.requiresManual).toBe(1);

    // No corrective write may happen while auto-fix is disabled.
    for (const builder of buildersFor('org_subscriptions')) {
      expect(builder.update).not.toHaveBeenCalled();
    }
  });

  it('auto-fixes the local status from Stripe when BILLING_AUTO_FIX=true', async () => {
    const subs = [mismatchedSub()];
    mockStripe.subscriptions.retrieve.mockResolvedValueOnce(activeStripeSub());

    const previous = process.env.BILLING_AUTO_FIX;
    process.env.BILLING_AUTO_FIX = 'true';

    let pending: Promise<any>;
    const calls: Array<{ table: string; builder: any }> = [];
    try {
      jest.isolateModules(() => {
        const admin = require('@/lib/supabase/admin').__client;
        admin.from.mockImplementation((table: string) => {
          const builder = createBuilder({ data: subs, error: null });
          calls.push({ table, builder });
          return builder;
        });
        const {
          runBillingReconciliation: run,
        } = require('@/lib/billing/nightly-reconciliation');
        pending = run();
      });
      const result = await pending!;

      expect(result.discrepancies).toHaveLength(1);
      expect(result.discrepancies[0].discrepancyType).toBe('status_mismatch');
      expect(result.discrepancies[0].autoFixed).toBe(true);
      expect(result.autoFixed).toBe(1);
      expect(result.requiresManual).toBe(0);

      // The corrective write is the whole point of the nightly job.
      const updated = calls
        .filter((c) => c.table === 'org_subscriptions')
        .map((c) => c.builder)
        .filter((b) => b.update.mock.calls.length > 0);
      expect(updated).toHaveLength(1);
      expect(updated[0].update).toHaveBeenCalledWith({
        status: 'active',
        updated_at: expect.any(String),
      });
      expect(updated[0].eq).toHaveBeenCalledWith('organization_id', 'org-1');
    } finally {
      if (previous === undefined) {
        delete process.env.BILLING_AUTO_FIX;
      } else {
        process.env.BILLING_AUTO_FIX = previous;
      }
    }
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

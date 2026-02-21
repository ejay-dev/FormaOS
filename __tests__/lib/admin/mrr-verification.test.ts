/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

jest.mock('@/lib/billing/stripe', () => ({
  getStripeClient: jest.fn(),
}));

import { verifyMrr } from '@/lib/admin/mrr-verification';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getStripeClient } from '@/lib/billing/stripe';

describe('verifyMrr', () => {
  const mockSupabaseAdmin = createSupabaseAdminClient as jest.Mock;
  const mockGetStripeClient = getStripeClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
  });

  it('returns correct structure when Stripe is not configured', async () => {
    const mockOrgs = [];
    const mockSubs = [];
    const mockPlans = [];

    // Mock Supabase responses with proper Promise support
    mockSupabaseAdmin.mockReturnValue({
      from: jest.fn((table: string) => {
        const mockData: any = {
          organizations: mockOrgs,
          org_subscriptions: mockSubs,
          plans: mockPlans,
        };

        return {
          select: jest.fn(() => Promise.resolve({ data: mockData[table] || [], error: null })),
        };
      }),
    });

    // Stripe not configured
    mockGetStripeClient.mockReturnValue(null);

    const result = await verifyMrr();

    expect(result).toMatchObject({
      stripe_configured: false,
      stripe_key_mode: 'unknown',
      db_mrr_cents: 0,
      stripe_mrr_cents: 0,
      delta_cents: 0,
      match: false,
      db_active_count: 0,
      stripe_active_count: 0,
      currency: 'unknown',
      billing_intervals_found: [],
      per_subscription: [],
      stripe_only: [],
      db_only: [],
    });

    expect(result.errors).toContain('Stripe is not configured (missing STRIPE_SECRET_KEY)');
    expect(result.verified_at).toBeDefined();
    expect(result.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('detects live Stripe key mode', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_live_test123';

    const mockOrgs = [];
    const mockSubs = [];
    const mockPlans = [];

    mockSupabaseAdmin.mockReturnValue({
      from: jest.fn((table: string) => {
        const mockData: any = {
          organizations: mockOrgs,
          org_subscriptions: mockSubs,
          plans: mockPlans,
        };

        return {
          select: jest.fn(() => Promise.resolve({ data: mockData[table] || [], error: null })),
        };
      }),
    });

    mockGetStripeClient.mockReturnValue(null);

    const result = await verifyMrr();

    expect(result.stripe_key_mode).toBe('live');
  });

  it('detects test Stripe key mode', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_test123';

    const mockOrgs = [];
    const mockSubs = [];
    const mockPlans = [];

    mockSupabaseAdmin.mockReturnValue({
      from: jest.fn((table: string) => {
        const mockData: any = {
          organizations: mockOrgs,
          org_subscriptions: mockSubs,
          plans: mockPlans,
        };

        return {
          select: jest.fn(() => Promise.resolve({ data: mockData[table] || [], error: null })),
        };
      }),
    });

    mockGetStripeClient.mockReturnValue(null);

    const result = await verifyMrr();

    expect(result.stripe_key_mode).toBe('test');
  });

  it('computes DB MRR correctly with active subscriptions', async () => {
    const mockOrgs = [
      { id: 'org-1', name: 'Real Org 1' },
      { id: 'org-2', name: 'Real Org 2' },
      { id: 'org-3', name: 'e2e test org' }, // Should be filtered out
    ];

    const mockSubs = [
      { organization_id: 'org-1', status: 'active', plan_key: 'basic', stripe_subscription_id: 'sub_1' },
      { organization_id: 'org-2', status: 'active', plan_key: 'pro', stripe_subscription_id: 'sub_2' },
      { organization_id: 'org-3', status: 'active', plan_key: 'basic', stripe_subscription_id: 'sub_3' }, // Synthetic org
    ];

    const mockPlans = [
      { key: 'basic', price_cents: 39900 },
      { key: 'pro', price_cents: 120000 },
    ];

    mockSupabaseAdmin.mockReturnValue({
      from: jest.fn((table: string) => {
        const mockData: any = {
          organizations: mockOrgs,
          org_subscriptions: mockSubs,
          plans: mockPlans,
        };

        return {
          select: jest.fn(() => Promise.resolve({ data: mockData[table] || [], error: null })),
        };
      }),
    });

    mockGetStripeClient.mockReturnValue(null);

    const result = await verifyMrr();

    // Only org-1 and org-2 should be counted (org-3 is synthetic)
    expect(result.db_mrr_cents).toBe(39900 + 120000); // 159900
    expect(result.db_active_count).toBe(2);
  });

  it('filters out synthetic orgs correctly', async () => {
    const mockOrgs = [
      { id: 'org-1', name: 'Real Org' },
      { id: 'org-2', name: 'e2e Test Org' },
      { id: 'org-3', name: 'QA Smoke Test' },
      { id: 'org-4', name: 'test@test.formaos.local' },
    ];

    const mockSubs = [
      { organization_id: 'org-1', status: 'active', plan_key: 'basic', stripe_subscription_id: null },
      { organization_id: 'org-2', status: 'active', plan_key: 'basic', stripe_subscription_id: null },
      { organization_id: 'org-3', status: 'active', plan_key: 'basic', stripe_subscription_id: null },
      { organization_id: 'org-4', status: 'active', plan_key: 'basic', stripe_subscription_id: null },
    ];

    const mockPlans = [
      { key: 'basic', price_cents: 39900 },
    ];

    mockSupabaseAdmin.mockReturnValue({
      from: jest.fn((table: string) => {
        const mockData: any = {
          organizations: mockOrgs,
          org_subscriptions: mockSubs,
          plans: mockPlans,
        };

        return {
          select: jest.fn(() => Promise.resolve({ data: mockData[table] || [], error: null })),
        };
      }),
    });

    mockGetStripeClient.mockReturnValue(null);

    const result = await verifyMrr();

    // Only org-1 should be counted (others are synthetic)
    expect(result.db_active_count).toBe(1);
    expect(result.db_mrr_cents).toBe(39900);
  });

  it('identifies DB-only subscriptions (no stripe_subscription_id)', async () => {
    const mockOrgs = [
      { id: 'org-1', name: 'Real Org' },
    ];

    const mockSubs = [
      { organization_id: 'org-1', status: 'active', plan_key: 'basic', stripe_subscription_id: null },
    ];

    const mockPlans = [
      { key: 'basic', price_cents: 39900 },
    ];

    mockSupabaseAdmin.mockReturnValue({
      from: jest.fn((table: string) => {
        const mockData: any = {
          organizations: mockOrgs,
          org_subscriptions: mockSubs,
          plans: mockPlans,
        };

        return {
          select: jest.fn(() => Promise.resolve({ data: mockData[table] || [], error: null })),
        };
      }),
    });

    mockGetStripeClient.mockReturnValue(null);

    const result = await verifyMrr();

    expect(result.db_only).toHaveLength(1);
    expect(result.db_only[0]).toMatchObject({
      organization_id: 'org-1',
      plan_key: 'basic',
      db_status: 'active',
      db_amount_cents: 39900,
    });
  });
});

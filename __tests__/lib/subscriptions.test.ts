/**
 * @jest-environment node
 */

import { syncEntitlementsForPlan } from '@/lib/billing/entitlements';

const mockMaybeSingle = jest.fn();
const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockFrom = jest.fn().mockImplementation((table: string) => {
  if (table === 'org_subscriptions') {
    return { select: mockSelect, upsert: mockUpsert };
  }
  if (table === 'organizations') {
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { name: 'Test Org', created_by: 'user-1' },
          }),
        }),
      }),
    };
  }
  if (table === 'orgs') {
    return { upsert: jest.fn().mockResolvedValue({ error: null }) };
  }
  return { select: mockSelect, upsert: mockUpsert };
});

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));

jest.mock('@/lib/billing/entitlements', () => ({
  syncEntitlementsForPlan: jest.fn(),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  billingLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { ensureSubscription } from '@/lib/billing/subscriptions';

describe('ensureSubscription', () => {
  const orgId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it('syncs entitlements and does NOT create new subscription when active subscription exists', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        status: 'active',
        plan_key: 'pro',
        trial_expires_at: null,
      },
    });

    await ensureSubscription(orgId, 'pro');

    expect(syncEntitlementsForPlan).toHaveBeenCalledWith(orgId, 'pro');
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('creates subscription with trialing status when no existing subscription', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null });

    await ensureSubscription(orgId, 'basic');

    expect(mockUpsert).toHaveBeenCalled();
    const upsertPayload = mockUpsert.mock.calls[0][0];
    expect(upsertPayload).toMatchObject({
      organization_id: orgId,
      plan_key: 'basic',
      status: 'trialing',
    });
    expect(syncEntitlementsForPlan).toHaveBeenCalledWith(orgId, 'basic');
  });

  it('defaults to basic plan when planKey is null', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null });

    await ensureSubscription(orgId, null);

    expect(mockUpsert).toHaveBeenCalled();
    const upsertPayload = mockUpsert.mock.calls[0][0];
    expect(upsertPayload).toMatchObject({
      plan_key: 'basic',
    });
    expect(syncEntitlementsForPlan).toHaveBeenCalledWith(orgId, 'basic');
  });

  it('creates fresh subscription when trial is expired', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
    mockMaybeSingle.mockResolvedValue({
      data: {
        status: 'trialing',
        plan_key: 'basic',
        trial_expires_at: pastDate,
      },
    });

    await ensureSubscription(orgId, 'basic');

    expect(mockUpsert).toHaveBeenCalled();
    const upsertPayload = mockUpsert.mock.calls[0][0];
    expect(upsertPayload).toMatchObject({
      organization_id: orgId,
      plan_key: 'basic',
      status: 'trialing',
    });
  });

  it('always calls syncEntitlementsForPlan at the end', async () => {
    // Case 1: existing active subscription
    mockMaybeSingle.mockResolvedValue({
      data: { status: 'active', plan_key: 'pro', trial_expires_at: null },
    });
    await ensureSubscription(orgId, 'pro');
    expect(syncEntitlementsForPlan).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    // Case 2: no existing subscription
    mockMaybeSingle.mockResolvedValue({ data: null });
    mockUpsert.mockResolvedValue({ error: null });
    await ensureSubscription(orgId, 'basic');
    expect(syncEntitlementsForPlan).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    // Case 3: expired trial
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    mockMaybeSingle.mockResolvedValue({
      data: { status: 'trialing', plan_key: 'basic', trial_expires_at: pastDate },
    });
    mockUpsert.mockResolvedValue({ error: null });
    await ensureSubscription(orgId, 'basic');
    expect(syncEntitlementsForPlan).toHaveBeenCalledTimes(1);
  });
});

/**
 * @jest-environment node
 */

import { bootstrapOrganizationAtomic } from '@/lib/supabase/transaction';

const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });
const mockInsertSelectSingle = jest.fn();
const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSelectSingle });
const mockInsert = jest.fn();
const mockUpsert = jest.fn();

const mockFrom = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    from: mockFrom,
  }),
}));

function setupMocks(overrides: {
  orgResult?: { data: any; error: any };
  legacyResult?: { error: any };
  memberResult?: { error: any };
  onboardingResult?: { error: any };
  subscriptionResult?: { error: any };
} = {}) {
  const defaults = {
    orgResult: { data: { id: 'org-123' }, error: null },
    legacyResult: { error: null },
    memberResult: { error: null },
    onboardingResult: { error: null },
    subscriptionResult: { error: null },
  };
  const cfg = { ...defaults, ...overrides };

  mockInsertSelectSingle.mockResolvedValue(cfg.orgResult);
  mockInsert.mockImplementation(() => {
    // Track which table insert was called for
    const lastTable = mockFrom.mock.calls[mockFrom.mock.calls.length - 1]?.[0];
    if (lastTable === 'org_members') return Promise.resolve(cfg.memberResult);
    if (lastTable === 'org_onboarding_status') return Promise.resolve(cfg.onboardingResult);
    // fallback for organizations (handled via select chain)
    return { select: mockInsertSelect };
  });
  mockUpsert.mockImplementation(() => {
    const lastTable = mockFrom.mock.calls[mockFrom.mock.calls.length - 1]?.[0];
    if (lastTable === 'orgs') return Promise.resolve(cfg.legacyResult);
    if (lastTable === 'org_subscriptions') return Promise.resolve(cfg.subscriptionResult);
    return Promise.resolve({ error: null });
  });

  mockFrom.mockImplementation((table: string) => {
    if (table === 'organizations') {
      return {
        insert: jest.fn().mockReturnValue({ select: mockInsertSelect }),
        delete: mockDelete,
      };
    }
    if (table === 'orgs') {
      return {
        upsert: mockUpsert,
        delete: mockDelete,
      };
    }
    if (table === 'org_members') {
      return {
        insert: jest.fn().mockImplementation(() => Promise.resolve(cfg.memberResult)),
        delete: mockDelete,
      };
    }
    if (table === 'org_onboarding_status') {
      return {
        insert: jest.fn().mockImplementation(() => Promise.resolve(cfg.onboardingResult)),
        delete: mockDelete,
      };
    }
    if (table === 'org_subscriptions') {
      return {
        upsert: jest.fn().mockImplementation(() => Promise.resolve(cfg.subscriptionResult)),
        delete: mockDelete,
      };
    }
    return {
      insert: mockInsert,
      upsert: mockUpsert,
      delete: mockDelete,
    };
  });
}

const baseParams = {
  userId: 'user-abc',
  userEmail: 'test@example.com',
  orgName: 'Test Org',
  planKey: 'pro',
};

describe('bootstrapOrganizationAtomic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should successfully bootstrap an organization with all fields set', async () => {
    setupMocks();

    const result = await bootstrapOrganizationAtomic(baseParams);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      organizationId: 'org-123',
      membershipCreated: true,
      subscriptionCreated: true,
      onboardingCreated: true,
    });

    // Verify organizations table was called
    expect(mockFrom).toHaveBeenCalledWith('organizations');
    // Verify legacy orgs table was called
    expect(mockFrom).toHaveBeenCalledWith('orgs');
    // Verify membership was created
    expect(mockFrom).toHaveBeenCalledWith('org_members');
    // Verify onboarding status was created
    expect(mockFrom).toHaveBeenCalledWith('org_onboarding_status');
    // Verify subscription was created
    expect(mockFrom).toHaveBeenCalledWith('org_subscriptions');
  });

  it('should return error when organization creation fails (no rollback needed)', async () => {
    setupMocks({
      orgResult: { data: null, error: { message: 'duplicate key' } },
    });

    const result = await bootstrapOrganizationAtomic(baseParams);

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error!.message).toContain('Organization creation failed');
    expect(result.error!.message).toContain('duplicate key');

    // No rollback deletes should happen since orgId was never set
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('should return error and rollback when membership creation fails', async () => {
    setupMocks({
      memberResult: { error: { message: 'FK constraint violation' } },
    });

    const result = await bootstrapOrganizationAtomic(baseParams);

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error!.message).toContain('Membership creation failed');

    // Rollback should delete in reverse order
    const deletedTables = mockFrom.mock.calls
      .filter((_call: any, idx: number) => {
        const returnVal = mockFrom.mock.results[idx]?.value;
        return returnVal && typeof returnVal.delete === 'function' &&
          mockFrom.mock.calls[idx][0] !== 'organizations' || false;
      })
      .map((call: any) => call[0]);

    // Should attempt to clean up org_onboarding_status, org_subscriptions, org_members, orgs, organizations
    expect(mockFrom).toHaveBeenCalledWith('org_onboarding_status');
    expect(mockFrom).toHaveBeenCalledWith('org_subscriptions');
    expect(mockFrom).toHaveBeenCalledWith('org_members');
    expect(mockFrom).toHaveBeenCalledWith('orgs');
    expect(mockFrom).toHaveBeenCalledWith('organizations');

    // Verify delete was called with the correct org id
    expect(mockDeleteEq).toHaveBeenCalledWith('organization_id', 'org-123');
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'org-123');
  });

  it('should map planKey "basic" to plan_code "starter" in subscription', async () => {
    const subscriptionUpsertSpy = jest.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'org-456' },
                error: null,
              }),
            }),
          }),
          delete: mockDelete,
        };
      }
      if (table === 'orgs') {
        return {
          upsert: jest.fn().mockResolvedValue({ error: null }),
          delete: mockDelete,
        };
      }
      if (table === 'org_members') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
          delete: mockDelete,
        };
      }
      if (table === 'org_onboarding_status') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
          delete: mockDelete,
        };
      }
      if (table === 'org_subscriptions') {
        return {
          upsert: subscriptionUpsertSpy,
          delete: mockDelete,
        };
      }
      return { insert: jest.fn(), upsert: jest.fn(), delete: mockDelete };
    });

    const result = await bootstrapOrganizationAtomic({
      ...baseParams,
      planKey: 'basic',
    });

    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();

    // Verify subscription upsert was called with plan_code 'starter'
    expect(subscriptionUpsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_key: 'basic',
        plan_code: 'starter',
        status: 'trialing',
      }),
      { onConflict: 'organization_id' },
    );
  });
});

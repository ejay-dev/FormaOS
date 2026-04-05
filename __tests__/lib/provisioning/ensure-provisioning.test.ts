/**
 * Tests for lib/provisioning/ensure-provisioning.ts
 */
jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null }) {
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
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  const c = {
    from: jest.fn(() => createBuilder()),
    auth: {
      admin: { getUserById: jest.fn().mockResolvedValue({ data: null }) },
    },
  };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});
function getClient() {
  return require('@/lib/supabase/admin').__client;
}

jest.mock('@/lib/billing/subscriptions', () => ({
  ensureSubscription: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/plans', () => ({
  resolvePlanKey: jest.fn((input: any) => input || 'basic'),
}));

import {
  ensureOrgProvisioning,
  ensureUserProvisioning,
} from '@/lib/provisioning/ensure-provisioning';

describe('provisioning/ensure-provisioning', () => {
  beforeEach(() => jest.clearAllMocks());

  const fakeOrg = {
    id: 'org1',
    name: 'TestOrg',
    plan_key: 'pro',
    created_by: 'u1',
  };

  describe('ensureOrgProvisioning', () => {
    it('provisions existing org successfully', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return createBuilder({ data: fakeOrg, error: null }); // org lookup
        return createBuilder({ data: null, error: null }); // legacy/onboarding/sub
      });
      const result = await ensureOrgProvisioning({ orgId: 'org1' });
      expect(result.ok).toBe(true);
      expect(result.orgId).toBe('org1');
    });

    it('creates org when not found and owner provided', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return createBuilder({ data: null, error: null }); // not found
        if (callIdx === 2) return createBuilder({ data: fakeOrg, error: null }); // insert
        return createBuilder({ data: null, error: null }); // rest
      });
      const result = await ensureOrgProvisioning({
        orgId: 'org1',
        ownerUserId: 'u1',
        orgName: 'NewOrg',
      });
      expect(result.ok).toBe(true);
      expect(result.actions).toContain('org_created');
    });

    it('returns error when not found and no owner', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );
      const result = await ensureOrgProvisioning({ orgId: 'org1' });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('organization_not_found');
    });

    it('returns error when org creation fails', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return createBuilder({ data: null, error: null });
        return createBuilder({ data: null, error: { message: 'fail' } });
      });
      const result = await ensureOrgProvisioning({
        orgId: 'org1',
        ownerUserId: 'u1',
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('organization_create_failed');
    });

    it('backfills plan when missing', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: { ...fakeOrg, plan_key: null },
            error: null,
          });
        return createBuilder({ data: null, error: null });
      });
      const result = await ensureOrgProvisioning({ orgId: 'org1' });
      expect(result.ok).toBe(true);
      expect(result.actions).toContain('plan_backfilled');
    });
  });

  describe('ensureUserProvisioning', () => {
    it('creates org and membership for user with no memberships', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        // 1: memberships lookup (empty)
        if (callIdx === 1) return createBuilder({ data: [], error: null });
        // 2: create org -> returns id
        if (callIdx === 2)
          return createBuilder({
            data: { id: 'new-org', name: 'Org' },
            error: null,
          });
        // 3: create membership
        if (callIdx === 3) return createBuilder({ data: null, error: null });
        // rest: ensureOrgProvisioning queries
        if (callIdx === 4)
          return createBuilder({
            data: {
              id: 'new-org',
              name: 'Org',
              plan_key: 'basic',
              created_by: 'u1',
            },
            error: null,
          });
        return createBuilder({ data: null, error: null });
      });
      getClient().auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            email: 'test@test.com',
            user_metadata: { full_name: 'Test User' },
          },
        },
      });

      const result = await ensureUserProvisioning({ userId: 'u1' });
      expect(result.ok).toBe(true);
      expect(result.actions).toContain('org_created');
      expect(result.actions).toContain('membership_created');
    });

    it('uses existing membership', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: [{ organization_id: 'org1', role: 'admin' }],
            error: null,
          });
        // ensureOrgProvisioning: org lookup
        if (callIdx === 2) return createBuilder({ data: fakeOrg, error: null });
        return createBuilder({ data: null, error: null });
      });
      const result = await ensureUserProvisioning({ userId: 'u1' });
      expect(result.ok).toBe(true);
    });

    it('backfills role for member without role', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: [{ organization_id: 'org1', role: null }],
            error: null,
          });
        if (callIdx === 2) return createBuilder({ data: null, error: null }); // role backfill
        if (callIdx === 3) return createBuilder({ data: fakeOrg, error: null }); // org lookup
        return createBuilder({ data: null, error: null });
      });
      const result = await ensureUserProvisioning({ userId: 'u1' });
      expect(result.ok).toBe(true);
      expect(result.actions).toContain('role_backfilled');
    });

    it('returns error when membership creation fails', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return createBuilder({ data: [], error: null }); // no memberships
        if (callIdx === 2)
          return createBuilder({
            data: { id: 'org-new', name: 'Org' },
            error: null,
          }); // org created
        return createBuilder({ data: null, error: { message: 'dup' } }); // membership fail
      });
      getClient().auth.admin.getUserById.mockResolvedValue({ data: null });
      const result = await ensureUserProvisioning({ userId: 'u1' });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('membership_create_failed');
    });

    it('handles auth.admin failure gracefully', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return createBuilder({ data: [], error: null });
        if (callIdx === 2)
          return createBuilder({
            data: { id: 'org-new', name: 'Org' },
            error: null,
          });
        if (callIdx === 3) return createBuilder({ data: null, error: null }); // membership ok
        if (callIdx === 4)
          return createBuilder({
            data: {
              id: 'org-new',
              name: 'Org',
              plan_key: 'basic',
              created_by: 'u1',
            },
            error: null,
          });
        return createBuilder({ data: null, error: null });
      });
      getClient().auth.admin.getUserById.mockRejectedValue(
        new Error('no admin'),
      );
      const result = await ensureUserProvisioning({ userId: 'u1' });
      expect(result.ok).toBe(true);
    });
  });
});

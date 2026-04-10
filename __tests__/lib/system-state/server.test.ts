/** @jest-environment node */

/* ------------------------------------------------------------------ */
/*  Mocks – must come before any import that depends on them          */
/* ------------------------------------------------------------------ */

jest.mock('server-only', () => ({}));
jest.mock('react', () => ({ cache: (fn: any) => fn }));
jest.mock('next/cache', () => ({
  unstable_cache: (fn: any) => () => fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));
jest.mock('@/lib/plans', () => ({
  resolvePlanKey: jest.fn((v: string | null) => {
    if (!v) return null;
    const n = v.toLowerCase();
    if (['basic', 'pro', 'enterprise'].includes(n)) return n;
    return null;
  }),
}));
jest.mock('@/app/app/actions/rbac', () => ({
  normalizeRole: jest.fn((role?: string | null) => {
    if (!role) return 'STAFF';
    const key = role.toLowerCase();
    const aliases: Record<string, string> = {
      owner: 'OWNER',
      admin: 'COMPLIANCE_OFFICER',
      compliance_officer: 'COMPLIANCE_OFFICER',
      manager: 'MANAGER',
      staff: 'STAFF',
      auditor: 'AUDITOR',
      viewer: 'VIEWER',
    };
    return aliases[key] || 'STAFF';
  }),
}));
jest.mock('@/lib/provisioning/ensure-provisioning', () => ({
  ensureOrgProvisioning: jest.fn().mockResolvedValue(undefined),
  ensureUserProvisioning: jest.fn().mockResolvedValue(undefined),
}));

/* ------------------------------------------------------------------ */
/*  Imports                                                           */
/* ------------------------------------------------------------------ */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  mapPlanKeyToTier,
  mapRoleKeyToUserRole,
  mapUserRoleToRoleKey,
  getSubscriptionData,
  getEntitlements,
  getMembershipData,
  fetchSystemState,
  calculateModuleState,
  calculateAllModuleStates,
  validateModuleAccess,
  validatePermission,
} from '@/lib/system-state/server';
import {
  ensureOrgProvisioning,
  ensureUserProvisioning,
} from '@/lib/provisioning/ensure-provisioning';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function mockChain(result: unknown = { data: null, error: null }) {
  const c: Record<string, any> = {};
  c.select = jest.fn().mockReturnValue(c);
  c.eq = jest.fn().mockReturnValue(c);
  c.neq = jest.fn().mockReturnValue(c);
  c.in = jest.fn().mockReturnValue(c);
  c.gte = jest.fn().mockReturnValue(c);
  c.lte = jest.fn().mockReturnValue(c);
  c.lt = jest.fn().mockReturnValue(c);
  c.order = jest.fn().mockReturnValue(c);
  c.limit = jest.fn().mockReturnValue(c);
  c.range = jest.fn().mockReturnValue(c);
  c.match = jest.fn().mockReturnValue(c);
  c.is = jest.fn().mockReturnValue(c);
  c.not = jest.fn().mockReturnValue(c);
  c.insert = jest.fn().mockReturnValue(c);
  c.upsert = jest.fn().mockReturnValue(c);
  c.update = jest.fn().mockReturnValue(c);
  c.delete = jest.fn().mockReturnValue(c);
  c.maybeSingle = jest.fn().mockResolvedValue(result);
  c.single = jest.fn().mockResolvedValue(result);
  c.then = (resolve: any, reject: any) =>
    Promise.resolve(result).then(resolve, reject);
  return c;
}

function makeAdmin(fromResult?: Record<string, unknown>) {
  const chain = mockChain(fromResult);
  const admin = { from: jest.fn().mockReturnValue(chain) };
  (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);
  return { admin, chain };
}

function makeServer(fromResult?: Record<string, unknown>) {
  const chain = mockChain(fromResult);
  const auth = {
    getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
  };
  const server = { from: jest.fn().mockReturnValue(chain), auth };
  (createSupabaseServerClient as jest.Mock).mockResolvedValue(server);
  return { server, chain };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('system-state/server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.FOUNDER_EMAILS;
    delete process.env.FOUNDER_USER_IDS;
  });

  // ── mapPlanKeyToTier ───────────────────────────────────────

  describe('mapPlanKeyToTier', () => {
    it('returns trial for null/undefined/empty', () => {
      expect(mapPlanKeyToTier(null)).toBe('trial');
      expect(mapPlanKeyToTier(undefined)).toBe('trial');
      expect(mapPlanKeyToTier('')).toBe('trial');
    });
    it('maps basic', () => expect(mapPlanKeyToTier('basic')).toBe('basic'));
    it('maps pro', () => expect(mapPlanKeyToTier('pro')).toBe('pro'));
    it('maps enterprise', () =>
      expect(mapPlanKeyToTier('enterprise')).toBe('enterprise'));
    it('returns trial for unknown', () =>
      expect(mapPlanKeyToTier('random')).toBe('trial'));
  });

  // ── mapRoleKeyToUserRole ───────────────────────────────────

  describe('mapRoleKeyToUserRole', () => {
    it('OWNER → owner', () =>
      expect(mapRoleKeyToUserRole('OWNER')).toBe('owner'));
    it('COMPLIANCE_OFFICER → admin', () =>
      expect(mapRoleKeyToUserRole('COMPLIANCE_OFFICER')).toBe('admin'));
    it('MANAGER → admin', () =>
      expect(mapRoleKeyToUserRole('MANAGER')).toBe('admin'));
    it('STAFF → member', () =>
      expect(mapRoleKeyToUserRole('STAFF')).toBe('member'));
    it('AUDITOR → member', () =>
      expect(mapRoleKeyToUserRole('AUDITOR')).toBe('member'));
    it('VIEWER → viewer', () =>
      expect(mapRoleKeyToUserRole('VIEWER')).toBe('viewer'));
    it('unknown → member', () =>
      expect(mapRoleKeyToUserRole('MYSTERY' as any)).toBe('member'));
  });

  // ── mapUserRoleToRoleKey ───────────────────────────────────

  describe('mapUserRoleToRoleKey', () => {
    it('owner → OWNER', () =>
      expect(mapUserRoleToRoleKey('owner')).toBe('OWNER'));
    it('admin → COMPLIANCE_OFFICER', () =>
      expect(mapUserRoleToRoleKey('admin')).toBe('COMPLIANCE_OFFICER'));
    it('member → STAFF', () =>
      expect(mapUserRoleToRoleKey('member')).toBe('STAFF'));
    it('viewer → VIEWER', () =>
      expect(mapUserRoleToRoleKey('viewer')).toBe('VIEWER'));
  });

  // ── getSubscriptionData ────────────────────────────────────

  describe('getSubscriptionData', () => {
    it('returns null on DB error', async () => {
      const { chain } = makeAdmin();
      chain.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'fail' },
      });
      expect(await getSubscriptionData('org-1')).toBeNull();
    });

    it('returns null when no data', async () => {
      const { chain } = makeAdmin();
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });
      expect(await getSubscriptionData('org-1')).toBeNull();
    });

    it('returns subscription with active trial', async () => {
      const future = new Date(Date.now() + 7 * 86400000).toISOString();
      const { chain } = makeAdmin();
      chain.maybeSingle.mockResolvedValue({
        data: {
          plan_key: 'pro',
          status: 'trialing',
          stripe_customer_id: 'cus_1',
          stripe_subscription_id: 'sub_1',
          current_period_end: future,
          trial_started_at: new Date().toISOString(),
          trial_expires_at: future,
        },
        error: null,
      });
      const r = await getSubscriptionData('org-1');
      expect(r!.planTier).toBe('pro');
      expect(r!.trialActive).toBe(true);
      expect(r!.trialDaysRemaining).toBeGreaterThan(0);
    });

    it('returns subscription with expired trial', async () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      const { chain } = makeAdmin();
      chain.maybeSingle.mockResolvedValue({
        data: {
          plan_key: 'pro',
          status: 'trialing',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          current_period_end: null,
          trial_started_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          trial_expires_at: past,
        },
        error: null,
      });
      const r = await getSubscriptionData('org-1');
      expect(r!.trialActive).toBe(false);
      expect(r!.trialDaysRemaining).toBe(0);
    });

    it('handles active non-trial status', async () => {
      const { chain } = makeAdmin();
      chain.maybeSingle.mockResolvedValue({
        data: {
          plan_key: 'enterprise',
          status: 'active',
          stripe_customer_id: 'cus_x',
          stripe_subscription_id: 'sub_x',
          current_period_end: new Date().toISOString(),
          trial_started_at: null,
          trial_expires_at: null,
        },
        error: null,
      });
      const r = await getSubscriptionData('org-1');
      expect(r!.planTier).toBe('enterprise');
      expect(r!.trialActive).toBe(false);
      expect(r!.status).toBe('active');
    });

    it('defaults status to pending when falsy', async () => {
      const { chain } = makeAdmin();
      chain.maybeSingle.mockResolvedValue({
        data: {
          plan_key: 'basic',
          status: '',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          current_period_end: null,
          trial_started_at: null,
          trial_expires_at: null,
        },
        error: null,
      });
      const r = await getSubscriptionData('org-1');
      expect(r!.status).toBe('pending');
    });

    it('handles trialing with null trial_expires_at', async () => {
      const { chain } = makeAdmin();
      chain.maybeSingle.mockResolvedValue({
        data: {
          plan_key: 'pro',
          status: 'trialing',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          current_period_end: null,
          trial_started_at: null,
          trial_expires_at: null,
        },
        error: null,
      });
      const r = await getSubscriptionData('org-1');
      expect(r!.trialActive).toBe(false);
      expect(r!.trialDaysRemaining).toBe(0);
    });
  });

  // ── getEntitlements ────────────────────────────────────────

  describe('getEntitlements', () => {
    it('returns empty on error', async () => {
      const { chain } = makeAdmin();
      chain.then = (res: any, rej: any) =>
        Promise.resolve({ data: null, error: { message: 'fail' } }).then(
          res,
          rej,
        );
      expect(await getEntitlements('org-1')).toEqual([]);
    });

    it('maps rows with defaults', async () => {
      const rows = [
        { feature_key: 'tasks', enabled: true, limit_value: 100 },
        { feature_key: 'vault', enabled: false, limit_value: null },
        { feature_key: 'controls' },
      ];
      const { chain } = makeAdmin();
      chain.then = (res: any, rej: any) =>
        Promise.resolve({ data: rows, error: null }).then(res, rej);
      const r = await getEntitlements('org-1');
      expect(r).toHaveLength(3);
      expect(r[0]).toEqual({
        featureKey: 'tasks',
        enabled: true,
        limitValue: 100,
      });
      expect(r[2]).toEqual({
        featureKey: 'controls',
        enabled: false,
        limitValue: null,
      });
    });
  });

  // ── getMembershipData ──────────────────────────────────────

  describe('getMembershipData', () => {
    it('returns null when no user', async () => {
      makeServer();
      expect(await getMembershipData()).toBeNull();
    });

    it('returns null when no memberships anywhere', async () => {
      const { server, chain } = makeServer();
      server.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      chain.then = (r: any) =>
        Promise.resolve({ data: [], error: null }).then(r);
      const aChain = mockChain();
      aChain.then = (r: any) =>
        Promise.resolve({ data: [], error: null }).then(r);
      (createSupabaseAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(aChain),
      });
      expect(await getMembershipData()).toBeNull();
    });

    it('returns membership with preloaded user', async () => {
      const row = {
        organization_id: 'org-1',
        role: 'OWNER',
        organizations: {
          name: 'Acme',
          onboarding_completed: true,
          industry: 'tech',
        },
      };
      const { chain } = makeServer();
      chain.then = (r: any) =>
        Promise.resolve({ data: [row], error: null }).then(r);
      const result = await getMembershipData({ id: 'u1' });
      expect(result!.orgId).toBe('org-1');
      expect(result!.userRole).toBe('owner');
    });

    it('handles array organizations', async () => {
      const row = {
        organization_id: 'org-1',
        role: 'VIEWER',
        organizations: [
          { name: 'ArrOrg', onboarding_completed: false, industry: null },
        ],
      };
      const { chain } = makeServer();
      chain.then = (r: any) =>
        Promise.resolve({ data: [row], error: null }).then(r);
      const result = await getMembershipData({ id: 'u1' });
      expect(result!.organizationName).toBe('ArrOrg');
    });

    it('falls back to admin client', async () => {
      const { server, chain: sc } = makeServer();
      server.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      sc.then = (r: any) => Promise.resolve({ data: [], error: null }).then(r);
      const adminRow = {
        organization_id: 'org-2',
        role: 'STAFF',
        organizations: {
          name: 'Fallback',
          onboarding_completed: false,
          industry: null,
        },
      };
      const aC = mockChain();
      aC.then = (r: any) =>
        Promise.resolve({ data: [adminRow], error: null }).then(r);
      (createSupabaseAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(aC),
      });
      const result = await getMembershipData();
      expect(result!.orgId).toBe('org-2');
    });

    it('returns null with null organization_id', async () => {
      const row = { organization_id: null, role: 'STAFF', organizations: null };
      const { chain } = makeServer();
      chain.then = (r: any) =>
        Promise.resolve({ data: [row], error: null }).then(r);
      const aC = mockChain();
      aC.then = (r: any) =>
        Promise.resolve({ data: [row], error: null }).then(r);
      (createSupabaseAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(aC),
      });
      expect(await getMembershipData({ id: 'u1' })).toBeNull();
    });

    it('picks highest-weight role', async () => {
      const rows = [
        { organization_id: 'a', role: 'STAFF', organizations: { name: 'A' } },
        { organization_id: 'b', role: 'OWNER', organizations: { name: 'B' } },
      ];
      const { chain } = makeServer();
      chain.then = (r: any) =>
        Promise.resolve({ data: rows, error: null }).then(r);
      const result = await getMembershipData({ id: 'u1' });
      expect(result!.orgId).toBe('b');
    });

    it('handles null organizations gracefully', async () => {
      const row = {
        organization_id: 'org-1',
        role: 'STAFF',
        organizations: null,
      };
      const { chain } = makeServer();
      chain.then = (r: any) =>
        Promise.resolve({ data: [row], error: null }).then(r);
      const result = await getMembershipData({ id: 'u1' });
      expect(result!.organizationName).toBe('Unknown Organization');
    });

    it('logs error when both RLS and admin lookups fail', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { server, chain: sc } = makeServer();
      server.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      sc.then = (r: any) =>
        Promise.resolve({ data: [], error: { message: 'rls fail' } }).then(r);
      const aC = mockChain();
      aC.then = (r: any) =>
        Promise.resolve({ data: [], error: { message: 'admin fail' } }).then(r);
      (createSupabaseAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(aC),
      });
      const result = await getMembershipData();
      expect(result).toBeNull();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ── calculateModuleState ───────────────────────────────────

  describe('calculateModuleState', () => {
    const baseEnt = {
      plan: 'pro' as const,
      role: 'member' as const,
      trialActive: false,
      trialDaysRemaining: 0,
      enabledModules: [] as any[],
      permissions: {
        canCreatePolicies: true,
        canManageTeam: false,
        canViewAudit: true,
        canExportReports: true,
        canManageBilling: false,
        canAccessAdmin: false,
        canEditSettings: false,
      },
    };

    it('locked for unknown module', () =>
      expect(calculateModuleState('zzz' as any, baseEnt)).toBe('locked'));
    it('active for founder', () =>
      expect(calculateModuleState('admin', baseEnt, undefined, true)).toBe(
        'active',
      ));
    it('restricted for past_due', () =>
      expect(calculateModuleState('controls', baseEnt, 'past_due')).toBe(
        'restricted',
      ));
    it('locked for canceled', () =>
      expect(calculateModuleState('controls', baseEnt, 'canceled')).toBe(
        'locked',
      ));
    it('locked for pending', () =>
      expect(calculateModuleState('controls', baseEnt, 'pending')).toBe(
        'locked',
      ));
    it('locked for blocked', () =>
      expect(calculateModuleState('controls', baseEnt, 'blocked')).toBe(
        'locked',
      ));
    it('locked when trial + 0 days', () => {
      expect(
        calculateModuleState(
          'controls',
          { ...baseEnt, trialActive: true, trialDaysRemaining: 0 },
          'active',
        ),
      ).toBe('locked');
    });
    it('locked when module not in plan', () => {
      expect(
        calculateModuleState(
          'audits',
          { ...baseEnt, plan: 'trial' as const },
          'active',
        ),
      ).toBe('locked');
    });
    it('restricted when role too low', () => {
      expect(
        calculateModuleState(
          'evidence',
          { ...baseEnt, plan: 'enterprise' as const, role: 'viewer' as const },
          'active',
        ),
      ).toBe('restricted');
    });
    it('active when all OK', () =>
      expect(calculateModuleState('controls', baseEnt, 'active')).toBe(
        'active',
      ));
    it('active with trialing and days > 0', () => {
      expect(
        calculateModuleState(
          'controls',
          { ...baseEnt, trialActive: true, trialDaysRemaining: 5 },
          'trialing',
        ),
      ).toBe('active');
    });
  });

  // ── calculateAllModuleStates ───────────────────────────────

  describe('calculateAllModuleStates', () => {
    it('returns Map for all modules', () => {
      const ent = {
        plan: 'enterprise' as const,
        role: 'owner' as const,
        trialActive: false,
        trialDaysRemaining: 0,
        enabledModules: [] as any[],
        permissions: {
          canCreatePolicies: true,
          canManageTeam: true,
          canViewAudit: true,
          canExportReports: true,
          canManageBilling: true,
          canAccessAdmin: true,
          canEditSettings: true,
        },
      };
      const states = calculateAllModuleStates(ent, 'active');
      expect(states.size).toBeGreaterThan(0);
      expect(states.get('controls')).toBe('active');
    });

    it('everything active for founder', () => {
      const ent = {
        plan: 'trial' as const,
        role: 'viewer' as const,
        trialActive: false,
        trialDaysRemaining: 0,
        enabledModules: [] as any[],
        permissions: {
          canCreatePolicies: false,
          canManageTeam: false,
          canViewAudit: false,
          canExportReports: false,
          canManageBilling: false,
          canAccessAdmin: false,
          canEditSettings: false,
        },
      };
      const states = calculateAllModuleStates(ent, 'active', true);
      states.forEach((v) => expect(v).toBe('active'));
    });
  });

  // ── fetchSystemState ───────────────────────────────────────

  describe('fetchSystemState', () => {
    function setupFull(opts?: { isFounder?: boolean }) {
      const sc = mockChain();
      const authUser = {
        id: 'u1',
        email: 'test@test.com',
        user_metadata: { full_name: 'Test User' },
      };
      const server = {
        from: jest.fn().mockReturnValue(sc),
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: authUser } }),
        },
      };
      (createSupabaseServerClient as jest.Mock).mockResolvedValue(server);

      const memberRow = {
        organization_id: 'org-1',
        role: 'OWNER',
        organizations: {
          name: 'TestOrg',
          onboarding_completed: true,
          industry: 'compliance',
        },
      };
      sc.then = (r: any) =>
        Promise.resolve({ data: [memberRow], error: null }).then(r);

      const ac = mockChain();
      (createSupabaseAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(ac),
      });
      ac.maybeSingle.mockResolvedValue({
        data: {
          plan_key: 'pro',
          status: 'active',
          stripe_customer_id: 'cus_1',
          stripe_subscription_id: 'sub_1',
          current_period_end: new Date().toISOString(),
          trial_started_at: null,
          trial_expires_at: null,
        },
        error: null,
      });
      ac.then = (r: any) =>
        Promise.resolve({
          data: [{ feature_key: 'controls', enabled: true, limit_value: null }],
          error: null,
        }).then(r);

      if (opts?.isFounder) process.env.FOUNDER_EMAILS = 'test@test.com';
      return { server, sc, ac };
    }

    it('returns null when no user', async () => {
      makeServer();
      makeAdmin();
      expect(await fetchSystemState()).toBeNull();
    });

    it('returns full state for regular user', async () => {
      setupFull();
      const r = await fetchSystemState({
        id: 'u1',
        email: 'test@test.com',
        user_metadata: { full_name: 'Test User' },
      });
      expect(r!.user.id).toBe('u1');
      expect(r!.organization.id).toBe('org-1');
      expect(r!.isFounder).toBe(false);
    });

    it('grants founder privileges', async () => {
      setupFull({ isFounder: true });
      const r = await fetchSystemState({
        id: 'u1',
        email: 'test@test.com',
        user_metadata: { full_name: 'Test User' },
      });
      expect(r!.isFounder).toBe(true);
      expect(r!.entitlements.plan).toBe('enterprise');
      expect(r!.entitlements.permissions.canAccessAdmin).toBe(true);
    });

    it('grants founder via FOUNDER_USER_IDS', async () => {
      setupFull();
      process.env.FOUNDER_USER_IDS = 'u1';
      const r = await fetchSystemState({
        id: 'u1',
        email: 'test@test.com',
        user_metadata: { full_name: 'Test User' },
      });
      expect(r!.isFounder).toBe(true);
    });

    it('calls ensureUserProvisioning when no membership', async () => {
      const { server, chain } = makeServer();
      server.auth.getUser.mockResolvedValue({
        data: { user: { id: 'u1', email: 't@t.com' } },
      });
      chain.then = (r: any) =>
        Promise.resolve({ data: [], error: null }).then(r);
      const aC = mockChain();
      aC.then = (r: any) => Promise.resolve({ data: [], error: null }).then(r);
      (createSupabaseAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(aC),
      });
      await fetchSystemState();
      expect(ensureUserProvisioning).toHaveBeenCalled();
    });

    it('handles user with no email and no full_name', async () => {
      const sc = mockChain();
      (createSupabaseServerClient as jest.Mock).mockResolvedValue({
        from: jest.fn().mockReturnValue(sc),
        auth: { getUser: jest.fn() },
      });
      const memberRow = {
        organization_id: 'org-1',
        role: 'STAFF',
        organizations: { name: 'Org' },
      };
      sc.then = (r: any) =>
        Promise.resolve({ data: [memberRow], error: null }).then(r);
      const ac = mockChain();
      ac.maybeSingle.mockResolvedValue({
        data: {
          plan_key: 'basic',
          status: 'active',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          current_period_end: null,
          trial_started_at: null,
          trial_expires_at: null,
        },
        error: null,
      });
      ac.then = (r: any) => Promise.resolve({ data: [], error: null }).then(r);
      (createSupabaseAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(ac),
      });
      const r = await fetchSystemState({ id: 'u2', user_metadata: {} });
      expect(r!.user.name).toBe('User');
      expect(r!.user.email).toBe('');
    });

    it('repairs when subscription null', async () => {
      const sc = mockChain();
      (createSupabaseServerClient as jest.Mock).mockResolvedValue({
        from: jest.fn().mockReturnValue(sc),
        auth: { getUser: jest.fn() },
      });
      const memberRow = {
        organization_id: 'org-1',
        role: 'OWNER',
        organizations: { name: 'Org', onboarding_completed: true },
      };
      sc.then = (r: any) =>
        Promise.resolve({ data: [memberRow], error: null }).then(r);
      const ac = mockChain();
      ac.maybeSingle.mockResolvedValue({ data: null, error: null });
      ac.then = (r: any) => Promise.resolve({ data: [], error: null }).then(r);
      (createSupabaseAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(ac),
      });
      await fetchSystemState({
        id: 'u1',
        email: 'u@o.com',
        user_metadata: { full_name: 'Bob' },
      });
      expect(ensureOrgProvisioning).toHaveBeenCalled();
    });

    it('filters out disabled entitlement modules', async () => {
      const sc = mockChain();
      (createSupabaseServerClient as jest.Mock).mockResolvedValue({
        from: jest.fn().mockReturnValue(sc),
        auth: { getUser: jest.fn() },
      });
      const memberRow = {
        organization_id: 'org-1',
        role: 'OWNER',
        organizations: { name: 'Org', onboarding_completed: true },
      };
      sc.then = (r: any) =>
        Promise.resolve({ data: [memberRow], error: null }).then(r);
      const ac = mockChain();
      ac.maybeSingle.mockResolvedValue({
        data: {
          plan_key: 'pro',
          status: 'active',
          stripe_customer_id: 'c',
          stripe_subscription_id: 's',
          current_period_end: new Date().toISOString(),
          trial_started_at: null,
          trial_expires_at: null,
        },
        error: null,
      });
      // Return a disabled entitlement for "controls"
      ac.then = (r: any) =>
        Promise.resolve({
          data: [
            { feature_key: 'controls', enabled: false, limit_value: null },
          ],
          error: null,
        }).then(r);
      (createSupabaseAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(ac),
      });
      const r = await fetchSystemState({
        id: 'u1',
        email: 'u@o.com',
        user_metadata: { full_name: 'Bob' },
      });
      expect(r!.entitlements.enabledModules).not.toContain('controls');
    });

    it('handles ensureOrgProvisioning failure gracefully', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const sc = mockChain();
      (createSupabaseServerClient as jest.Mock).mockResolvedValue({
        from: jest.fn().mockReturnValue(sc),
        auth: { getUser: jest.fn() },
      });
      const memberRow = {
        organization_id: 'org-1',
        role: 'OWNER',
        organizations: { name: 'Org', onboarding_completed: true },
      };
      sc.then = (r: any) =>
        Promise.resolve({ data: [memberRow], error: null }).then(r);
      const ac = mockChain();
      ac.maybeSingle.mockResolvedValue({ data: null, error: null });
      ac.then = (r: any) => Promise.resolve({ data: [], error: null }).then(r);
      (createSupabaseAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(ac),
      });
      (ensureOrgProvisioning as jest.Mock).mockRejectedValueOnce(
        new Error('provision fail'),
      );
      await fetchSystemState({ id: 'u1', email: 'u@o.com', user_metadata: {} });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('handles ensureUserProvisioning failure gracefully', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { server, chain } = makeServer();
      server.auth.getUser.mockResolvedValue({
        data: { user: { id: 'u1', email: 't@t.com' } },
      });
      chain.then = (r: any) =>
        Promise.resolve({ data: [], error: null }).then(r);
      const aC = mockChain();
      aC.then = (r: any) => Promise.resolve({ data: [], error: null }).then(r);
      (createSupabaseAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(aC),
      });
      (ensureUserProvisioning as jest.Mock).mockRejectedValueOnce(
        new Error('prov fail'),
      );
      await fetchSystemState();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('uses email prefix as name when full_name is not string', async () => {
      const sc = mockChain();
      (createSupabaseServerClient as jest.Mock).mockResolvedValue({
        from: jest.fn().mockReturnValue(sc),
        auth: { getUser: jest.fn() },
      });
      const memberRow = {
        organization_id: 'org-1',
        role: 'STAFF',
        organizations: { name: 'O' },
      };
      sc.then = (r: any) =>
        Promise.resolve({ data: [memberRow], error: null }).then(r);
      const ac = mockChain();
      ac.maybeSingle.mockResolvedValue({
        data: {
          plan_key: 'basic',
          status: 'active',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          current_period_end: null,
          trial_started_at: null,
          trial_expires_at: null,
        },
        error: null,
      });
      ac.then = (r: any) => Promise.resolve({ data: [], error: null }).then(r);
      (createSupabaseAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(ac),
      });
      const r = await fetchSystemState({
        id: 'u1',
        email: 'alice@acme.com',
        user_metadata: { full_name: 42 },
      });
      expect(r!.user.name).toBe('alice');
    });
  });

  // ── validateModuleAccess ───────────────────────────────────

  describe('validateModuleAccess', () => {
    it('returns not authenticated when no state', async () => {
      makeServer();
      makeAdmin();
      const r = await validateModuleAccess('controls');
      expect(r.allowed).toBe(false);
      expect(r.reason).toBe('Not authenticated');
    });
  });

  // ── validatePermission ─────────────────────────────────────

  describe('validatePermission', () => {
    it('returns not authenticated when no state', async () => {
      makeServer();
      makeAdmin();
      const r = await validatePermission('canManageTeam');
      expect(r.allowed).toBe(false);
      expect(r.reason).toBe('Not authenticated');
    });
  });
});

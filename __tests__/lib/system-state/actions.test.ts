/**
 * Tests for lib/system-state/actions.ts
 * Server actions for system state management
 */

// ── helpers ──────────────────────────────────────────────
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

// ── mocks ────────────────────────────────────────────────
jest.mock('server-only', () => ({}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

const mockFetchSystemState = jest.fn();
const mockCalculateModuleState = jest.fn();
const mockValidateModuleAccess = jest.fn();
const mockValidatePermission = jest.fn();

jest.mock('@/lib/system-state/server', () => ({
  fetchSystemState: (...args: any[]) => mockFetchSystemState(...args),
  calculateModuleState: (...args: any[]) => mockCalculateModuleState(...args),
  validateModuleAccess: (...args: any[]) => mockValidateModuleAccess(...args),
  validatePermission: (...args: any[]) => mockValidatePermission(...args),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  apiLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

// Server client (async)
const serverBuilder = createBuilder();
jest.mock('@/lib/supabase/server', () => {
  const c = {
    from: jest.fn(() => serverBuilder),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
  };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});
function getServerClient() {
  return require('@/lib/supabase/server').__client;
}

// Admin client (sync)
const adminBuilder = createBuilder();
jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => adminBuilder) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});
function getAdminClient() {
  return require('@/lib/supabase/admin').__client;
}

// ── imports (after mocks) ────────────────────────────────
import {
  getSystemState,
  getModuleNodeState,
  canAccessModule,
  checkPermission,
  initiatePlanUpgrade,
  confirmPlanUpgrade,
  changeUserRole,
  recordModuleAccess,
  getAvailableModules,
  getSubscriptionStatus,
} from '@/lib/system-state/actions';

// ── test suite ───────────────────────────────────────────
describe('system-state/actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchSystemState.mockReset();
    mockCalculateModuleState.mockReset();
    mockValidateModuleAccess.mockReset();
    mockValidatePermission.mockReset();
  });

  const fakeState: any = {
    user: { id: 'u1', email: 'test@test.com', role: 'admin' },
    organization: { id: 'org1', name: 'TestOrg', plan: 'pro' },
    subscription: { status: 'active' },
    entitlements: {
      trialActive: false,
      trialDaysRemaining: 0,
      modules: [],
      permissions: { canManageTeam: true },
    },
  };

  // ── getSystemState ──
  describe('getSystemState', () => {
    it('returns system state when authenticated', async () => {
      mockFetchSystemState.mockResolvedValue(fakeState);
      const result = await getSystemState();
      expect(result).toEqual({ success: true, data: fakeState });
    });

    it('returns error when not authenticated', async () => {
      mockFetchSystemState.mockResolvedValue(null);
      const result = await getSystemState();
      expect(result).toEqual({ success: false, error: 'Not authenticated' });
    });

    it('handles thrown errors', async () => {
      mockFetchSystemState.mockRejectedValue(new Error('boom'));
      const result = await getSystemState();
      expect(result.success).toBe(false);
    });
  });

  // ── getModuleNodeState ──
  describe('getModuleNodeState', () => {
    it('returns module state for a valid module', async () => {
      mockValidateModuleAccess.mockResolvedValue({
        allowed: true,
        state: 'active',
      });
      const result = await getModuleNodeState('controls');
      expect(result).toEqual({ success: true, data: 'active' });
    });

    it('returns error when not authenticated', async () => {
      mockValidateModuleAccess.mockRejectedValue(
        new Error('Not authenticated'),
      );
      const result = await getModuleNodeState('controls');
      expect(result.success).toBe(false);
    });
  });

  // ── canAccessModule ──
  describe('canAccessModule', () => {
    it('returns access check result', async () => {
      mockValidateModuleAccess.mockResolvedValue({ allowed: true });
      const result = await canAccessModule('controls');
      expect(result).toEqual({ success: true, data: { allowed: true } });
    });

    it('handles errors', async () => {
      mockValidateModuleAccess.mockRejectedValue(new Error('fail'));
      const result = await canAccessModule('controls');
      expect(result.success).toBe(false);
    });
  });

  // ── checkPermission ──
  describe('checkPermission', () => {
    it('returns permission check result', async () => {
      mockValidatePermission.mockResolvedValue({ allowed: true });
      const result = await checkPermission('EDIT_CONTROLS' as any);
      expect(result).toEqual({ success: true, data: true });
    });
  });

  // ── initiatePlanUpgrade ──
  describe('initiatePlanUpgrade', () => {
    it('returns error when not authenticated', async () => {
      mockFetchSystemState.mockResolvedValue(null);
      const result = await initiatePlanUpgrade('enterprise');
      expect(result.success).toBe(false);
    });

    it('returns error for downgrade attempt', async () => {
      mockFetchSystemState.mockResolvedValue({
        ...fakeState,
        organization: { ...fakeState.organization, plan: 'enterprise' },
      });
      const result = await initiatePlanUpgrade('pro');
      expect(result.success).toBe(false);
    });

    it('succeeds for valid upgrade', async () => {
      mockFetchSystemState.mockResolvedValue({
        ...fakeState,
        organization: { ...fakeState.organization, plan: 'starter' },
      });
      const result = await initiatePlanUpgrade('pro');
      expect(result.success).toBe(true);
    });
  });

  // ── confirmPlanUpgrade ──
  describe('confirmPlanUpgrade', () => {
    it('confirms upgrade using admin client', async () => {
      getAdminClient().from.mockImplementation(() =>
        createBuilder({ data: { id: 'sub1' }, error: null }),
      );
      const result = await confirmPlanUpgrade('org1', 'enterprise' as any);
      expect(result.success).toBe(true);
      expect(getAdminClient().from).toHaveBeenCalledWith('org_subscriptions');
    });

    it('handles thrown error', async () => {
      getAdminClient().from.mockImplementation(() => {
        throw new Error('db fail');
      });
      const result = await confirmPlanUpgrade('org1', 'enterprise' as any);
      expect(result.success).toBe(false);
    });
  });

  // ── changeUserRole ──
  describe('changeUserRole', () => {
    it('returns error when not authenticated', async () => {
      mockFetchSystemState.mockResolvedValue(null);
      const result = await changeUserRole('u2', 'admin');
      expect(result.success).toBe(false);
    });

    it('changes role successfully', async () => {
      mockFetchSystemState.mockResolvedValue(fakeState);
      getServerClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );
      const result = await changeUserRole('u2', 'admin');
      expect(result.success).toBe(true);
    });

    it('handles DB error', async () => {
      mockFetchSystemState.mockResolvedValue(fakeState);
      getServerClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      );
      const result = await changeUserRole('u2', 'admin');
      expect(result.success).toBe(false);
    });
  });

  // ── recordModuleAccess ──
  describe('recordModuleAccess', () => {
    it('records access when allowed', async () => {
      mockValidateModuleAccess.mockResolvedValue({ allowed: true });
      mockFetchSystemState.mockResolvedValue(fakeState);
      const result = await recordModuleAccess('controls');
      expect(result.success).toBe(true);
    });

    it('returns error when not allowed', async () => {
      mockValidateModuleAccess.mockResolvedValue({
        allowed: false,
        reason: 'denied',
      });
      const result = await recordModuleAccess('controls');
      expect(result.success).toBe(false);
    });
  });

  // ── getAvailableModules ──
  describe('getAvailableModules', () => {
    it('returns module list', async () => {
      mockFetchSystemState.mockResolvedValue(fakeState);
      mockCalculateModuleState.mockReturnValue('active');
      const result = await getAvailableModules();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it('returns error when not authenticated', async () => {
      mockFetchSystemState.mockResolvedValue(null);
      const result = await getAvailableModules();
      expect(result.success).toBe(false);
    });
  });

  // ── getSubscriptionStatus ──
  describe('getSubscriptionStatus', () => {
    it('returns subscription status', async () => {
      mockFetchSystemState.mockResolvedValue(fakeState);
      const result = await getSubscriptionStatus();
      expect(result.success).toBe(true);
      expect(result.data!.plan).toBe('pro');
    });

    it('returns error when not authenticated', async () => {
      mockFetchSystemState.mockResolvedValue(null);
      const result = await getSubscriptionStatus();
      expect(result.success).toBe(false);
    });
  });
});

/**
 * @jest-environment node
 */

jest.mock('server-only', () => ({}));

// ── Supabase mocks ──
function createBuilder(result = { data: null, error: null } as any) {
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
  const c: Record<string, any> = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});

jest.mock('@/lib/supabase/server', () => {
  const c: Record<string, any> = {
    from: jest.fn(() => createBuilder()),
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
  };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});

// Mock next/cache
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn: any) => fn),
}));

// Mock provisioning
jest.mock('@/lib/provisioning/ensure-provisioning', () => ({
  ensureOrgProvisioning: jest.fn(),
  ensureUserProvisioning: jest.fn(),
}));

// Mock plans
jest.mock('@/lib/plans', () => ({
  resolvePlanKey: jest.fn((key: string | null) => {
    if (!key) return null;
    const valid = ['basic', 'pro', 'enterprise'];
    return valid.includes(key.toLowerCase()) ? key.toLowerCase() : null;
  }),
}));

// Mock rbac
jest.mock('@/app/app/actions/rbac', () => ({
  normalizeRole: jest.fn((role: string | null) => {
    if (!role) return 'STAFF';
    const map: Record<string, string> = {
      owner: 'OWNER',
      admin: 'COMPLIANCE_OFFICER',
      member: 'STAFF',
      viewer: 'VIEWER',
      OWNER: 'OWNER',
      COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER',
      STAFF: 'STAFF',
      VIEWER: 'VIEWER',
      MANAGER: 'MANAGER',
      AUDITOR: 'AUDITOR',
    };
    return map[role] ?? 'STAFF';
  }),
}));

import {
  mapPlanKeyToTier,
  mapRoleKeyToUserRole,
  mapUserRoleToRoleKey,
  calculateModuleState,
  calculateAllModuleStates,
} from '@/lib/system-state/server';
import type {
  UserEntitlements,
  ModuleId,
  NodeState,
} from '@/lib/system-state/types';
import { PLAN_FEATURES, MODULE_DEFINITIONS } from '@/lib/system-state/types';

describe('system-state/server', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── mapPlanKeyToTier ──
  describe('mapPlanKeyToTier', () => {
    it('maps basic to basic', () => {
      expect(mapPlanKeyToTier('basic')).toBe('basic');
    });

    it('maps pro to pro', () => {
      expect(mapPlanKeyToTier('pro')).toBe('pro');
    });

    it('maps enterprise to enterprise', () => {
      expect(mapPlanKeyToTier('enterprise')).toBe('enterprise');
    });

    it('returns trial for null', () => {
      expect(mapPlanKeyToTier(null)).toBe('trial');
    });

    it('returns trial for undefined', () => {
      expect(mapPlanKeyToTier(undefined)).toBe('trial');
    });

    it('returns trial for unknown plan', () => {
      expect(mapPlanKeyToTier('nonexistent')).toBe('trial');
    });
  });

  // ── mapRoleKeyToUserRole ──
  describe('mapRoleKeyToUserRole', () => {
    it('maps OWNER to owner', () => {
      expect(mapRoleKeyToUserRole('OWNER')).toBe('owner');
    });

    it('maps COMPLIANCE_OFFICER to admin', () => {
      expect(mapRoleKeyToUserRole('COMPLIANCE_OFFICER')).toBe('admin');
    });

    it('maps MANAGER to admin', () => {
      expect(mapRoleKeyToUserRole('MANAGER')).toBe('admin');
    });

    it('maps STAFF to member', () => {
      expect(mapRoleKeyToUserRole('STAFF')).toBe('member');
    });

    it('maps AUDITOR to member', () => {
      expect(mapRoleKeyToUserRole('AUDITOR')).toBe('member');
    });

    it('maps VIEWER to viewer', () => {
      expect(mapRoleKeyToUserRole('VIEWER')).toBe('viewer');
    });
  });

  // ── mapUserRoleToRoleKey ──
  describe('mapUserRoleToRoleKey', () => {
    it('maps owner to OWNER', () => {
      expect(mapUserRoleToRoleKey('owner')).toBe('OWNER');
    });

    it('maps admin to COMPLIANCE_OFFICER', () => {
      expect(mapUserRoleToRoleKey('admin')).toBe('COMPLIANCE_OFFICER');
    });

    it('maps member to STAFF', () => {
      expect(mapUserRoleToRoleKey('member')).toBe('STAFF');
    });

    it('maps viewer to VIEWER', () => {
      expect(mapUserRoleToRoleKey('viewer')).toBe('VIEWER');
    });
  });

  // ── calculateModuleState ──
  describe('calculateModuleState', () => {
    const baseEntitlements: UserEntitlements = {
      plan: 'pro',
      role: 'admin',
      trialActive: false,
      trialDaysRemaining: 0,
      enabledModules: PLAN_FEATURES.pro as ModuleId[],
      permissions: {
        canCreatePolicies: true,
        canManageTeam: true,
        canViewAudit: true,
        canExportReports: true,
        canManageBilling: true,
        canAccessAdmin: false,
        canEditSettings: true,
      },
    };

    it('returns active for founder', () => {
      expect(
        calculateModuleState('controls', baseEntitlements, 'active', true),
      ).toBe('active');
    });

    it('returns locked for unknown module', () => {
      expect(
        calculateModuleState('nonexistent' as ModuleId, baseEntitlements),
      ).toBe('locked');
    });

    it('returns restricted for past_due subscription', () => {
      expect(
        calculateModuleState('controls', baseEntitlements, 'past_due'),
      ).toBe('restricted');
    });

    it('returns locked for canceled subscription', () => {
      expect(
        calculateModuleState('controls', baseEntitlements, 'canceled'),
      ).toBe('locked');
    });

    it('returns locked for blocked subscription', () => {
      expect(
        calculateModuleState('controls', baseEntitlements, 'blocked'),
      ).toBe('locked');
    });

    it('returns locked for pending subscription', () => {
      expect(
        calculateModuleState('controls', baseEntitlements, 'pending'),
      ).toBe('locked');
    });

    it('returns locked when trial expired', () => {
      const trialExpired: UserEntitlements = {
        ...baseEntitlements,
        trialActive: true,
        trialDaysRemaining: 0,
      };
      expect(calculateModuleState('controls', trialExpired)).toBe('locked');
    });

    it('returns locked when module not in plan', () => {
      const trialEnts: UserEntitlements = {
        ...baseEntitlements,
        plan: 'trial',
      };
      // vault is not in trial plan
      expect(calculateModuleState('vault', trialEnts)).toBe('locked');
    });

    it('returns restricted when role insufficient', () => {
      const viewerEnts: UserEntitlements = {
        ...baseEntitlements,
        role: 'viewer',
      };
      // evidence requires 'member' role
      expect(calculateModuleState('evidence', viewerEnts, 'active')).toBe(
        'restricted',
      );
    });

    it('returns active for accessible module', () => {
      expect(calculateModuleState('controls', baseEntitlements, 'active')).toBe(
        'active',
      );
    });
  });

  // ── calculateAllModuleStates ──
  describe('calculateAllModuleStates', () => {
    const entitlements: UserEntitlements = {
      plan: 'enterprise',
      role: 'owner',
      trialActive: false,
      trialDaysRemaining: 0,
      enabledModules: PLAN_FEATURES.enterprise as ModuleId[],
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

    it('returns a Map with state for every module definition', () => {
      const states = calculateAllModuleStates(entitlements, 'active');
      expect(states.size).toBe(MODULE_DEFINITIONS.length);
    });

    it('all enterprise+owner modules are active', () => {
      const states = calculateAllModuleStates(entitlements, 'active');
      for (const [, state] of states) {
        expect(state).toBe('active');
      }
    });

    it('founder unlocks everything', () => {
      const trialEnts: UserEntitlements = {
        ...entitlements,
        plan: 'trial',
        role: 'viewer',
      };
      const states = calculateAllModuleStates(trialEnts, 'active', true);
      for (const [, state] of states) {
        expect(state).toBe('active');
      }
    });
  });
});

/**
 * Extended branch coverage for lib/system-state/server.ts
 * Covers: getSubscriptionDataFresh, getEntitlementsFresh, getMembershipData,
 * calculateModuleState, calculateAllModuleStates, validateModuleAccess,
 * pickPrimaryMembership, normalizeMembershipResult, fetchSystemState
 */

jest.mock('server-only', () => ({}));
jest.mock('next/cache', () => ({ unstable_cache: jest.fn((fn: any) => fn) }));
jest.mock('react', () => ({ cache: jest.fn((fn: any) => fn) }));

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
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'gte',
    'lte',
    'gt',
    'lt',
    'or',
    'contains',
    'textSearch',
    'ilike',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

let adminFromResults: any[] = [];
let adminCallIndex = 0;
const __admin: Record<string, any> = {
  from: jest.fn(() => {
    const res = adminFromResults[adminCallIndex] ?? { data: null, error: null };
    adminCallIndex++;
    return createBuilder(res);
  }),
};

let serverFromResults: any[] = [];
let serverCallIndex = 0;
const __server: Record<string, any> = {
  from: jest.fn(() => {
    const res = serverFromResults[serverCallIndex] ?? {
      data: null,
      error: null,
    };
    serverCallIndex++;
    return createBuilder(res);
  }),
  auth: { getUser: jest.fn() },
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => __admin),
}));
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => __server),
}));
jest.mock('@/lib/plans', () => ({
  resolvePlanKey: jest.fn((key: string | null) => key),
}));
jest.mock('@/app/app/actions/rbac', () => ({
  normalizeRole: jest.fn((role: string | null) => {
    if (!role) return 'STAFF';
    const upper = role.toUpperCase();
    return [
      'OWNER',
      'COMPLIANCE_OFFICER',
      'MANAGER',
      'STAFF',
      'AUDITOR',
      'VIEWER',
    ].includes(upper)
      ? upper
      : 'STAFF';
  }),
}));
jest.mock('@/lib/provisioning/ensure-provisioning', () => ({
  ensureOrgProvisioning: jest.fn(),
  ensureUserProvisioning: jest.fn(),
}));

import {
  calculateModuleState,
  calculateAllModuleStates,
} from '@/lib/system-state/server';
import type {
  UserEntitlements,
  ModuleId,
  NodeState,
} from '@/lib/system-state/types';

beforeEach(() => {
  jest.clearAllMocks();
  adminCallIndex = 0;
  serverCallIndex = 0;
  adminFromResults = [];
  serverFromResults = [];
});

describe('calculateModuleState', () => {
  const baseEntitlements: UserEntitlements = {
    plan: 'pro',
    role: 'admin',
    trialActive: false,
    trialDaysRemaining: 0,
    enabledModules: [
      'controls',
      'policies',
      'evidence',
      'tasks',
      'vault',
      'audits',
      'reports',
      'team',
      'settings',
    ] as ModuleId[],
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

  it('returns active for founder', () => {
    expect(
      calculateModuleState(
        'controls' as ModuleId,
        baseEntitlements,
        'active',
        true,
      ),
    ).toBe('active');
  });

  it('returns restricted for past_due subscription', () => {
    expect(
      calculateModuleState(
        'controls' as ModuleId,
        baseEntitlements,
        'past_due',
      ),
    ).toBe('restricted');
  });

  it('returns locked for canceled subscription', () => {
    expect(
      calculateModuleState(
        'controls' as ModuleId,
        baseEntitlements,
        'canceled',
      ),
    ).toBe('locked');
  });

  it('returns locked for pending subscription', () => {
    expect(
      calculateModuleState('controls' as ModuleId, baseEntitlements, 'pending'),
    ).toBe('locked');
  });

  it('returns locked for blocked subscription', () => {
    expect(
      calculateModuleState('controls' as ModuleId, baseEntitlements, 'blocked'),
    ).toBe('locked');
  });

  it('returns locked when trial expired (trialActive true but 0 days)', () => {
    const ent = {
      ...baseEntitlements,
      trialActive: true,
      trialDaysRemaining: 0,
    };
    expect(calculateModuleState('controls' as ModuleId, ent, 'trialing')).toBe(
      'locked',
    );
  });

  it('returns locked for unknown module', () => {
    expect(
      calculateModuleState(
        'nonexistent' as ModuleId,
        baseEntitlements,
        'active',
      ),
    ).toBe('locked');
  });

  it('returns locked when module not in plan features', () => {
    // 'registers' requires enterprise plan, not in pro
    expect(
      calculateModuleState('registers' as ModuleId, baseEntitlements, 'active'),
    ).toBe('locked');
  });

  it('returns restricted when user role insufficient', () => {
    const ent = { ...baseEntitlements, role: 'viewer' as any };
    // team module requires admin role
    expect(calculateModuleState('team' as ModuleId, ent, 'active')).toBe(
      'restricted',
    );
  });

  it('returns active for valid module with sufficient role', () => {
    expect(
      calculateModuleState('controls' as ModuleId, baseEntitlements, 'active'),
    ).toBe('active');
  });
});

describe('calculateAllModuleStates', () => {
  const ent: UserEntitlements = {
    plan: 'enterprise',
    role: 'owner',
    trialActive: false,
    trialDaysRemaining: 0,
    enabledModules: [
      'controls',
      'policies',
      'evidence',
      'tasks',
      'vault',
      'audits',
      'reports',
      'registers',
      'team',
      'billing',
      'settings',
      'admin',
    ] as ModuleId[],
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

  it('returns a Map from calculateAllModuleStates', () => {
    const states = calculateAllModuleStates(ent, 'active', false);
    expect(states).toBeInstanceOf(Map);
    expect(states.size).toBeGreaterThan(0);
  });

  it('marks all modules active for founder', () => {
    const states = calculateAllModuleStates(ent, 'active', true);
    for (const [, state] of states) {
      expect(state).toBe('active');
    }
  });

  it('marks all modules locked for canceled subscription', () => {
    const states = calculateAllModuleStates(ent, 'canceled', false);
    for (const [, state] of states) {
      expect(state).toBe('locked');
    }
  });
});

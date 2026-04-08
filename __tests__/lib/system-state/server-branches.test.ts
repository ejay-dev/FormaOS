/**
 * Additional branch coverage for lib/system-state/server.ts
 * Tests mapping functions and subscription data branches
 */

jest.mock('server-only', () => ({}));
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn: any) => fn),
}));
jest.mock('react', () => ({
  cache: jest.fn((fn: any) => fn),
}));

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

const __admin: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
};

const __server: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: null } })),
  },
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
    const validRoles = [
      'OWNER',
      'COMPLIANCE_OFFICER',
      'MANAGER',
      'STAFF',
      'AUDITOR',
      'VIEWER',
    ];
    return validRoles.includes(upper) ? upper : 'STAFF';
  }),
}));

jest.mock('@/lib/provisioning/ensure-provisioning', () => ({
  ensureOrgProvisioning: jest.fn(),
  ensureUserProvisioning: jest.fn(),
}));

import {
  mapPlanKeyToTier,
  mapRoleKeyToUserRole,
  mapUserRoleToRoleKey,
} from '@/lib/system-state/server';

describe('mapPlanKeyToTier (branches)', () => {
  it.each([
    ['basic', 'basic'],
    ['pro', 'pro'],
    ['enterprise', 'enterprise'],
    [null, 'trial'],
    [undefined, 'trial'],
    ['unknown', 'trial'],
    ['', 'trial'],
  ])('maps %s to %s', (input, expected) => {
    expect(mapPlanKeyToTier(input as any)).toBe(expected);
  });
});

describe('mapRoleKeyToUserRole (branches)', () => {
  it.each([
    ['OWNER', 'owner'],
    ['COMPLIANCE_OFFICER', 'admin'],
    ['MANAGER', 'admin'],
    ['STAFF', 'member'],
    ['AUDITOR', 'member'],
    ['VIEWER', 'viewer'],
    ['RANDOM', 'member'],
  ])('maps %s to %s', (input, expected) => {
    expect(mapRoleKeyToUserRole(input as any)).toBe(expected);
  });
});

describe('mapUserRoleToRoleKey (branches)', () => {
  it.each([
    ['owner', 'OWNER'],
    ['admin', 'COMPLIANCE_OFFICER'],
    ['member', 'STAFF'],
    ['viewer', 'VIEWER'],
  ])('maps %s to %s', (input, expected) => {
    expect(mapUserRoleToRoleKey(input as any)).toBe(expected);
  });
});

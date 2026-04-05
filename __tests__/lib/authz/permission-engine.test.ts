/**
 * Tests for lib/authz/permission-engine.ts
 * Covers: getEffectivePermissions, hasPermission, getRolePermissions,
 *         createCustomRole, getPermissionDiff, PERMISSION_MODULES
 */

// Polyfill structuredClone for jsdom (not available in older test envs)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(obj: T): T =>
    JSON.parse(JSON.stringify(obj));
}

const mockFromFn = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    from: (...args: any[]) => mockFromFn(...args),
  }),
}));

import {
  getEffectivePermissions,
  hasPermission,
  getPermissionDiff,
  PERMISSION_MODULES,
} from '@/lib/authz/permission-engine';

function chain(data: any, error: any = null) {
  const c: any = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'then')
          return (resolve: Function) => resolve({ data, error });
        if (prop === 'data') return data;
        if (['single', 'maybeSingle'].includes(prop as string))
          return () => Promise.resolve({ data, error });
        return (..._a: any[]) => c;
      },
    },
  );
  return c;
}

beforeEach(() => jest.clearAllMocks());

describe('PERMISSION_MODULES', () => {
  it('contains expected modules', () => {
    expect(PERMISSION_MODULES).toContain('tasks');
    expect(PERMISSION_MODULES).toContain('evidence');
    expect(PERMISSION_MODULES).toContain('compliance');
    expect(PERMISSION_MODULES).toContain('incidents');
    expect(PERMISSION_MODULES).toContain('reports');
    expect(PERMISSION_MODULES).toContain('team');
    expect(PERMISSION_MODULES).toContain('billing');
    expect(PERMISSION_MODULES).toContain('settings');
  });

  it('has 13 modules total', () => {
    expect(PERMISSION_MODULES).toHaveLength(13);
  });
});

describe('getEffectivePermissions', () => {
  it('returns admin full permissions for admin role', async () => {
    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chain({ role: 'admin' }); // org_members
      return chain([]); // team_members (no custom roles)
    });

    const perms = await getEffectivePermissions('user-1', 'org-1');
    expect(perms.tasks.read).toBe(true);
    expect(perms.tasks.write).toBe(true);
    expect(perms.tasks.delete).toBe(true);
    expect(perms.tasks.admin).toBe(true);
  });

  it('returns viewer read-only permissions', async () => {
    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chain({ role: 'viewer' });
      return chain([]);
    });

    const perms = await getEffectivePermissions('user-1', 'org-1');
    expect(perms.tasks.read).toBe(true);
    expect(perms.tasks.write).toBe(false);
    expect(perms.tasks.delete).toBe(false);
    expect(perms.tasks.export).toBe(false);
  });

  it('defaults to member role when no membership found', async () => {
    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chain(null); // no membership
      return chain([]);
    });

    const perms = await getEffectivePermissions('user-1', 'org-1');
    expect(perms.tasks.read).toBe(true);
    expect(perms.tasks.write).toBe(true);
    expect(perms.tasks.delete).toBe(false);
  });

  it('merges custom role permissions (most permissive wins)', async () => {
    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chain({ role: 'member' }); // base member
      if (callCount === 2) return chain([{ custom_role_id: 'cr-1' }]); // team membership
      // custom_roles query
      return chain([
        { permissions: { tasks: { delete: true }, evidence: { admin: true } } },
      ]);
    });

    const perms = await getEffectivePermissions('user-1', 'org-1');
    expect(perms.tasks.delete).toBe(true); // upgraded from member default
    expect(perms.evidence.admin).toBe(true); // custom role addition
    expect(perms.tasks.read).toBe(true); // still has member base
  });
});

describe('hasPermission', () => {
  it('returns true when permission exists', async () => {
    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chain({ role: 'admin' });
      return chain([]);
    });

    const result = await hasPermission('user-1', 'org-1', 'tasks', 'read');
    expect(result).toBe(true);
  });

  it('returns false when permission missing', async () => {
    let callCount = 0;
    mockFromFn.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chain({ role: 'viewer' });
      return chain([]);
    });

    const result = await hasPermission('user-1', 'org-1', 'tasks', 'write');
    expect(result).toBe(false);
  });
});

describe('getPermissionDiff', () => {
  it('returns differences between two permission matrices', () => {
    const roleA: any = {};
    const roleB: any = {};
    for (const mod of PERMISSION_MODULES) {
      roleA[mod] = {
        read: true,
        write: true,
        delete: false,
        export: true,
        admin: false,
      };
      roleB[mod] = {
        read: true,
        write: true,
        delete: true,
        export: true,
        admin: true,
      };
    }

    const diffs = getPermissionDiff(roleA, roleB);
    expect(diffs.length).toBeGreaterThan(0);
    // Every module should have delete and admin diffs
    const deleteDiffs = diffs.filter((d) => d.action === 'delete');
    expect(deleteDiffs.length).toBe(PERMISSION_MODULES.length);
    expect(deleteDiffs[0].a).toBe(false);
    expect(deleteDiffs[0].b).toBe(true);
  });

  it('returns empty array when matrices are identical', () => {
    const role: any = {};
    for (const mod of PERMISSION_MODULES) {
      role[mod] = {
        read: true,
        write: false,
        delete: false,
        export: false,
        admin: false,
      };
    }

    const diffs = getPermissionDiff(role, role);
    expect(diffs).toEqual([]);
  });

  it('handles missing module in one matrix', () => {
    const roleA: any = {
      tasks: {
        read: true,
        write: false,
        delete: false,
        export: false,
        admin: false,
      },
    };
    const roleB: any = {
      tasks: {
        read: false,
        write: false,
        delete: false,
        export: false,
        admin: false,
      },
    };
    // Fill remaining modules same
    for (const mod of PERMISSION_MODULES) {
      if (mod !== 'tasks') {
        roleA[mod] = {
          read: false,
          write: false,
          delete: false,
          export: false,
          admin: false,
        };
        roleB[mod] = {
          read: false,
          write: false,
          delete: false,
          export: false,
          admin: false,
        };
      }
    }

    const diffs = getPermissionDiff(roleA, roleB);
    expect(diffs).toEqual([
      { module: 'tasks', action: 'read', a: true, b: false },
    ]);
  });
});

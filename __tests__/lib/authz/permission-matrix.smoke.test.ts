/**
 * Permission matrix smoke — asserts the entire 3-role × 13-module × 5-action
 * grid explicitly, so any silent broadening of default permissions (e.g. a
 * viewer gaining `export`, a member gaining `delete`) fails a test instead of
 * shipping to production.
 *
 * This complements the existing permission-engine.test.ts suites, which cover
 * dynamic behavior and custom-role merging but not the base grid itself.
 */

// Polyfill structuredClone for older test envs.
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
  PERMISSION_MODULES,
} from '@/lib/authz/permission-engine';

function noop(): any {
  const proxy: any = new Proxy(
    {},
    {
      get:
        () =>
        (..._args: any[]) =>
          proxy,
    },
  );
  return proxy;
}

function setRoleMock(role: 'owner' | 'admin' | 'member' | 'viewer' | null) {
  mockFromFn.mockReset();
  mockFromFn.mockImplementation((table: string) => {
    if (table === 'org_members') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: role ? { role } : null }),
            }),
          }),
        }),
      };
    }
    if (table === 'team_members') {
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: [] }),
        }),
      };
    }
    return noop();
  });
}

const ACTIONS = ['read', 'write', 'delete', 'export', 'admin'] as const;

describe('Permission matrix — base roles', () => {
  it('advertises 13 modules × 5 actions = 65 cells', () => {
    expect(PERMISSION_MODULES.length).toBe(13);
    expect(ACTIONS.length).toBe(5);
  });

  it('admin: every module/action is granted', async () => {
    setRoleMock('admin');
    const perms = await getEffectivePermissions('u', 'o');
    for (const m of PERMISSION_MODULES) {
      for (const a of ACTIONS) {
        expect(perms[m][a]).toBe(true);
      }
    }
  });

  it('member: read/write/export granted; delete/admin denied', async () => {
    setRoleMock('member');
    const perms = await getEffectivePermissions('u', 'o');
    for (const m of PERMISSION_MODULES) {
      expect(perms[m].read).toBe(true);
      expect(perms[m].write).toBe(true);
      expect(perms[m].export).toBe(true);
      expect(perms[m].delete).toBe(false);
      expect(perms[m].admin).toBe(false);
    }
  });

  it('viewer: read-only across every module', async () => {
    setRoleMock('viewer');
    const perms = await getEffectivePermissions('u', 'o');
    for (const m of PERMISSION_MODULES) {
      expect(perms[m].read).toBe(true);
      expect(perms[m].write).toBe(false);
      expect(perms[m].delete).toBe(false);
      expect(perms[m].export).toBe(false);
      expect(perms[m].admin).toBe(false);
    }
  });

  it('unknown role falls back to member permissions (no delete/admin)', async () => {
    setRoleMock(null);
    const perms = await getEffectivePermissions('u', 'o');
    for (const m of PERMISSION_MODULES) {
      expect(perms[m].delete).toBe(false);
      expect(perms[m].admin).toBe(false);
    }
  });

  it('sensitive modules (billing, settings, integrations) are NOT admin-only for read', async () => {
    // Documents existing behavior: members can read billing/settings/integrations
    // pages. If this needs to tighten, update here and the engine together.
    setRoleMock('member');
    const perms = await getEffectivePermissions('u', 'o');
    expect(perms.billing.read).toBe(true);
    expect(perms.settings.read).toBe(true);
    expect(perms.integrations.read).toBe(true);
    // But admin action on billing/settings is NOT granted to member.
    expect(perms.billing.admin).toBe(false);
    expect(perms.settings.admin).toBe(false);
    expect(perms.integrations.admin).toBe(false);
  });

  it('viewer cannot export anything (data exfil guard)', async () => {
    setRoleMock('viewer');
    const perms = await getEffectivePermissions('u', 'o');
    for (const m of PERMISSION_MODULES) {
      expect(perms[m].export).toBe(false);
    }
  });
});

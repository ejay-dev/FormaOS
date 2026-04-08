/**
 * Tests for lib/scim/scim-groups.ts
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
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
    'in',
    'order',
    'limit',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');

import {
  inferRoleMapping,
  getGroupById,
  getGroupMembers,
  syncGroupMembership,
  upsertScimGroup,
} from '@/lib/scim/scim-groups';

beforeEach(() => jest.clearAllMocks());

describe('inferRoleMapping', () => {
  it('maps owner', () => expect(inferRoleMapping('owner')).toBe('owner'));
  it('maps admin', () => expect(inferRoleMapping('admin')).toBe('admin'));
  it('maps administrator', () =>
    expect(inferRoleMapping('administrator team')).toBe('admin'));
  it('maps auditor', () =>
    expect(inferRoleMapping('Auditor Group')).toBe('auditor'));
  it('maps viewer', () => expect(inferRoleMapping('viewer')).toBe('viewer'));
  it('maps read_only', () =>
    expect(inferRoleMapping('Read Only')).toBe('viewer'));
  it('maps readonly', () =>
    expect(inferRoleMapping('readonly-users')).toBe('viewer'));
  it('maps member', () => expect(inferRoleMapping('member')).toBe('member'));
  it('maps employee', () =>
    expect(inferRoleMapping('employee')).toBe('member'));
  it('returns null for unknown', () =>
    expect(inferRoleMapping('custom-group')).toBeNull());
  it('uses explicit role over displayName', () =>
    expect(inferRoleMapping('custom-name', 'admin')).toBe('admin'));
  it('uses null explicit role falls back to display name', () =>
    expect(inferRoleMapping('admin team', null)).toBe('admin'));
});

describe('getGroupById', () => {
  it('returns group', async () => {
    const group = {
      id: 'g1',
      organization_id: 'org-1',
      display_name: 'Admins',
    };
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => createBuilder({ data: group, error: null })),
    });
    const result = await getGroupById('org-1', 'g1');
    expect(result!.display_name).toBe('Admins');
  });

  it('returns null when not found', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    });
    const result = await getGroupById('org-1', 'g1');
    expect(result).toBeNull();
  });

  it('throws on error', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      ),
    });
    await expect(getGroupById('org-1', 'g1')).rejects.toThrow('fail');
  });
});

describe('getGroupMembers', () => {
  it('returns user and group members', async () => {
    const userMembers = [{ user_id: 'u1' }, { user_id: 'u2' }];
    const nestedGroups = [{ child_group_id: 'g2' }];
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: userMembers, error: null });
        return createBuilder({ data: nestedGroups, error: null });
      }),
    });
    const result = await getGroupMembers('g1');
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('User');
    expect(result[2].type).toBe('Group');
  });

  it('handles null data', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    });
    const result = await getGroupMembers('g1');
    expect(result).toHaveLength(0);
  });
});

describe('syncGroupMembership', () => {
  it('syncs users and nested groups', async () => {
    // After sync, getGroupById is called for role assignment
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        // 1,2: delete old members  3: upsert users  4: upsert groups
        // 5: getGroupById  6,7: listResolvedUserIds  8: update roles
        if (callCount === 5)
          return createBuilder({
            data: { id: 'g1', role_mapping: 'admin' },
            error: null,
          });
        if (callCount === 6)
          return createBuilder({ data: [{ user_id: 'u1' }], error: null });
        if (callCount === 7) return createBuilder({ data: [], error: null });
        return createBuilder({ data: null, error: null });
      }),
    });

    await syncGroupMembership({
      orgId: 'org-1',
      groupId: 'g1',
      members: [
        { value: 'u1', type: 'User' },
        { value: 'g2', type: 'Group' },
      ],
    });
    expect(createSupabaseAdminClient).toHaveBeenCalled();
  });

  it('handles empty members', async () => {
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 3) return createBuilder({ data: null, error: null }); // getGroupById returns null -> no role_mapping
        return createBuilder({ data: null, error: null });
      }),
    });

    await syncGroupMembership({
      orgId: 'org-1',
      groupId: 'g1',
      members: [],
    });
    expect(createSupabaseAdminClient).toHaveBeenCalled();
  });
});

describe('upsertScimGroup', () => {
  it('creates group with inferred role', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => createBuilder({ data: { id: 'g1' }, error: null })),
    });
    const result = await upsertScimGroup({
      orgId: 'org-1',
      displayName: 'Admin Team',
    });
    expect(result).toBeDefined();
  });
});

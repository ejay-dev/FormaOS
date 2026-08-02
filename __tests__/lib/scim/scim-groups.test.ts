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

/**
 * Records every `from(<table>)` builder handed to the code under test so the
 * write sequence (deletes, upserts, role update) can be asserted instead of
 * merely asserting that the admin client was constructed. `responses` queues
 * per-table results in call order.
 */
function mockAdmin(responses: Record<string, any[]> = {}) {
  const calls: Array<{ table: string; builder: Record<string, any> }> = [];
  const counters: Record<string, number> = {};
  const from = jest.fn((table: string) => {
    const index = counters[table] ?? 0;
    counters[table] = index + 1;
    const builder = createBuilder(
      responses[table]?.[index] ?? { data: null, error: null },
    );
    calls.push({ table, builder });
    return builder;
  });
  createSupabaseAdminClient.mockReturnValue({ from });
  return {
    from,
    calls,
    for: (table: string) =>
      calls.filter((call) => call.table === table).map((call) => call.builder),
  };
}

import {
  inferRoleMapping,
  getGroupById,
  getGroupMembers,
  syncGroupMembership,
  upsertScimGroup,
} from '@/lib/scim/scim-groups';

beforeEach(() => jest.clearAllMocks());

describe('inferRoleMapping', () => {
  // Exact-match only (hardened): role names must match exactly (incl. common
  // plurals + "Read Only"/spacing variants that normalise to a key). This
  // prevents the substring privilege-escalation where a group merely
  // CONTAINING "admin" (e.g. "non-admin") was mapped to the admin role.
  it('maps owner', () => expect(inferRoleMapping('owner')).toBe('owner'));
  it('maps admin', () => expect(inferRoleMapping('admin')).toBe('admin'));
  it('maps administrator', () =>
    expect(inferRoleMapping('administrator')).toBe('admin'));
  it('maps plural admins', () =>
    expect(inferRoleMapping('Admins')).toBe('admin'));
  it('maps auditor', () =>
    expect(inferRoleMapping('Auditor')).toBe('auditor'));
  it('maps viewer', () => expect(inferRoleMapping('viewer')).toBe('viewer'));
  it('maps read_only', () =>
    expect(inferRoleMapping('Read Only')).toBe('viewer'));
  it('maps readonly', () =>
    expect(inferRoleMapping('readonly')).toBe('viewer'));
  it('maps member', () => expect(inferRoleMapping('member')).toBe('member'));
  it('maps employee', () =>
    expect(inferRoleMapping('employee')).toBe('member'));
  it('returns null for unknown', () =>
    expect(inferRoleMapping('custom-group')).toBeNull());
  it('uses explicit role over displayName', () =>
    expect(inferRoleMapping('custom-name', 'admin')).toBe('admin'));
  // Security: names that merely CONTAIN a role keyword must NOT map (fail safe).
  it('does NOT map substring/multi-word names to a role', () => {
    expect(inferRoleMapping('non-admin')).toBeNull();
    expect(inferRoleMapping('app-admin-readers')).toBeNull();
    expect(inferRoleMapping('admin team')).toBeNull();
    expect(inferRoleMapping('Auditor Group')).toBeNull();
  });
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
    // Per-table call order:
    //   scim_group_members: 0 delete, 1 upsert, 2 select(g1), 3 select(g2)
    //   scim_group_links:   0 delete, 1 upsert, 2 select(g1), 3 select(g2)
    //   scim_groups:        0 getGroupById   org_members: 0 role update
    const admin = mockAdmin({
      scim_groups: [{ data: { id: 'g1', role_mapping: 'admin' }, error: null }],
      scim_group_members: [
        { data: null, error: null },
        { data: null, error: null },
        { data: [{ user_id: 'u1' }], error: null },
        { data: [{ user_id: 'u2' }], error: null },
      ],
      scim_group_links: [
        { data: null, error: null },
        { data: null, error: null },
        { data: [{ child_group_id: 'g2' }], error: null },
        { data: [], error: null },
      ],
    });

    await syncGroupMembership({
      orgId: 'org-1',
      groupId: 'g1',
      members: [
        { value: 'u1', type: 'User' },
        { value: 'g2', type: 'Group' },
      ],
    });

    // Stale membership is cleared before the new set is written.
    const memberBuilders = admin.for('scim_group_members');
    expect(memberBuilders[0].delete).toHaveBeenCalled();
    expect(memberBuilders[0].eq).toHaveBeenCalledWith('group_id', 'g1');
    const linkBuilders = admin.for('scim_group_links');
    expect(linkBuilders[0].delete).toHaveBeenCalled();
    expect(linkBuilders[0].eq).toHaveBeenCalledWith('parent_group_id', 'g1');

    // Direct users and nested groups are both persisted.
    expect(memberBuilders[1].upsert).toHaveBeenCalledWith(
      [{ group_id: 'g1', user_id: 'u1' }],
      { onConflict: 'group_id,user_id' },
    );
    expect(linkBuilders[1].upsert).toHaveBeenCalledWith(
      [{ parent_group_id: 'g1', child_group_id: 'g2' }],
      { onConflict: 'parent_group_id,child_group_id' },
    );

    // Authz-critical: the group's role_mapping is granted to every resolved
    // member, including users reached through the nested group.
    const orgMemberBuilders = admin.for('org_members');
    expect(orgMemberBuilders).toHaveLength(1);
    expect(orgMemberBuilders[0].update).toHaveBeenCalledWith({ role: 'admin' });
    expect(orgMemberBuilders[0].eq).toHaveBeenCalledWith(
      'organization_id',
      'org-1',
    );
    expect(orgMemberBuilders[0].in).toHaveBeenCalledWith('user_id', [
      'u1',
      'u2',
    ]);
  });

  it('handles empty members', async () => {
    // scim_groups returns null -> group has no role_mapping.
    const admin = mockAdmin();

    await syncGroupMembership({
      orgId: 'org-1',
      groupId: 'g1',
      members: [],
    });

    // Deletes still run, but nothing is upserted for an empty member list.
    const memberBuilders = admin.for('scim_group_members');
    const linkBuilders = admin.for('scim_group_links');
    expect(memberBuilders[0].delete).toHaveBeenCalled();
    expect(linkBuilders[0].delete).toHaveBeenCalled();
    expect(
      memberBuilders.every((b) => b.upsert.mock.calls.length === 0),
    ).toBe(true);
    expect(linkBuilders.every((b) => b.upsert.mock.calls.length === 0)).toBe(
      true,
    );

    // No role_mapping -> org roles must not be touched.
    expect(admin.from).not.toHaveBeenCalledWith('org_members');
  });

  it('does not grant roles when the group has no role_mapping', async () => {
    const admin = mockAdmin({
      scim_groups: [
        { data: { id: 'g1', role_mapping: null }, error: null },
      ],
      scim_group_members: [
        { data: null, error: null },
        { data: null, error: null },
      ],
    });

    await syncGroupMembership({
      orgId: 'org-1',
      groupId: 'g1',
      members: [{ value: 'u1', type: 'User' }],
    });

    expect(admin.from).toHaveBeenCalledWith('scim_group_members');
    expect(admin.from).not.toHaveBeenCalledWith('org_members');
  });

  it('propagates a role-assignment failure', async () => {
    mockAdmin({
      scim_groups: [{ data: { id: 'g1', role_mapping: 'admin' }, error: null }],
      scim_group_members: [
        { data: null, error: null },
        { data: null, error: null },
        { data: [{ user_id: 'u1' }], error: null },
      ],
      org_members: [{ data: null, error: { message: 'role update failed' } }],
    });

    await expect(
      syncGroupMembership({
        orgId: 'org-1',
        groupId: 'g1',
        members: [{ value: 'u1', type: 'User' }],
      }),
    ).rejects.toThrow('role update failed');
  });
});

describe('upsertScimGroup', () => {
  it('creates group with inferred role', async () => {
    const admin = mockAdmin({
      scim_groups: [{ data: { id: 'g1' }, error: null }],
    });
    const result = await upsertScimGroup({
      orgId: 'org-1',
      displayName: 'Admins',
    });

    expect(admin.from).toHaveBeenCalledWith('scim_groups');
    expect(admin.for('scim_groups')[0].upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        display_name: 'Admins',
        role_mapping: 'admin',
        external_id: null,
        team_slug: null,
      }),
      { onConflict: 'organization_id,display_name' },
    );
    expect(result).toEqual({ id: 'g1' });
  });

  it('persists a null role for a name that only contains a role keyword', async () => {
    const admin = mockAdmin({
      scim_groups: [{ data: { id: 'g1' }, error: null }],
    });
    await upsertScimGroup({ orgId: 'org-1', displayName: 'Admin Team' });

    expect(admin.for('scim_groups')[0].upsert).toHaveBeenCalledWith(
      expect.objectContaining({ role_mapping: null }),
      expect.anything(),
    );
  });
});

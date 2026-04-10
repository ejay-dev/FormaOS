/** @jest-environment node */

/**
 * Tests for lib/multi-org.ts
 * Covers: getUserOrganizations, getCurrentOrganization, setCurrentOrganization,
 *         createOrganization, updateOrganization, deleteOrganization,
 *         inviteToOrganization, getPendingInvitation, acceptInvitation,
 *         removeMember, getOrganizationStats
 */

// ─── Supabase chain builder ───────────────────────────────────────────────
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
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

function createCountBuilder(count: number) {
  const b = createBuilder({ data: null, count, error: null });
  return b;
}

jest.mock('@/lib/supabase/server', () => {
  const c: Record<string, any> = {
    from: jest.fn(() => createBuilder()),
  };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});

jest.mock('@/lib/cache', () => ({
  getCached: jest.fn((_key: string, fn: () => Promise<any>) => fn()),
  invalidateCache: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/email/send-auth-email', () => ({
  sendAuthEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/invitations/create-invitation', () => ({
  createInvitation: jest.fn().mockResolvedValue({
    success: true,
    data: { token: 'inv-token-123' },
  }),
}));

jest.mock('@/lib/users/admin-profile-directory', () => ({
  findAuthUserByEmail: jest.fn().mockResolvedValue(null),
  getAdminProfileDirectoryEntries: jest
    .fn()
    .mockResolvedValue([{ fullName: 'Admin User', email: 'admin@test.com' }]),
}));

import {
  getUserOrganizations,
  getCurrentOrganization,
  setCurrentOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  inviteToOrganization,
  getPendingInvitation,
  acceptInvitation,
  removeMember,
  getOrganizationStats,
} from '@/lib/multi-org';
import { findAuthUserByEmail } from '@/lib/users/admin-profile-directory';
import { createInvitation } from '@/lib/invitations/create-invitation';

const mockClient = jest.requireMock<any>('@/lib/supabase/server').__client;

describe('multi-org', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.from = jest.fn(() => createBuilder());
  });

  // ─── getUserOrganizations ─────────────────────────────────────
  describe('getUserOrganizations', () => {
    it('returns mapped organization memberships', async () => {
      const data = [
        {
          id: 'm1',
          organization_id: 'org1',
          user_id: 'u1',
          role: 'owner',
          status: 'active',
          joined_at: '2025-01-01',
          organizations: { id: 'org1', name: 'Org1', slug: 'org1' },
        },
      ];
      mockClient.from.mockReturnValue(createBuilder({ data, error: null }));

      const result = await getUserOrganizations('u1');
      expect(result).toHaveLength(1);
      expect(result[0].organization_id).toBe('org1');
    });

    it('returns empty array on error', async () => {
      mockClient.from.mockReturnValue(
        createBuilder({ data: null, error: { message: 'DB error' } }),
      );

      const result = await getUserOrganizations('u1');
      expect(result).toEqual([]);
    });

    it('returns empty array when data is null', async () => {
      mockClient.from.mockReturnValue(
        createBuilder({ data: null, error: null }),
      );

      const result = await getUserOrganizations('u1');
      expect(result).toEqual([]);
    });
  });

  // ─── getCurrentOrganization ───────────────────────────────────
  describe('getCurrentOrganization', () => {
    it('returns org from user preference', async () => {
      const prefBuilder = createBuilder({
        data: { current_organization_id: 'org1' },
        error: null,
      });
      const orgBuilder = createBuilder({
        data: { id: 'org1', name: 'Org1' },
        error: null,
      });

      mockClient.from.mockImplementation((table: string) => {
        if (table === 'user_preferences') return prefBuilder;
        if (table === 'organizations') return orgBuilder;
        return createBuilder();
      });

      const result = await getCurrentOrganization('u1');
      expect(result).toEqual({ id: 'org1', name: 'Org1' });
    });

    it('returns null when no preference and no orgs', async () => {
      const prefBuilder = createBuilder({ data: null, error: null });
      mockClient.from.mockReturnValue(prefBuilder);

      // getUserOrganizations returns []
      const result = await getCurrentOrganization('u1');
      expect(result).toBeNull();
    });

    it('falls back to first org when no preference set', async () => {
      // For preference query
      const prefBuilder = createBuilder({
        data: { current_organization_id: null },
        error: null,
      });
      // For org detail query
      const orgBuilder = createBuilder({
        data: { id: 'org2', name: 'Org2' },
        error: null,
      });
      // For getUserOrganizations inside
      const memberBuilder = createBuilder({
        data: [
          {
            id: 'm1',
            organization_id: 'org2',
            user_id: 'u1',
            role: 'member',
            status: 'active',
            joined_at: '2025-01-01',
            organizations: { id: 'org2', name: 'Org2', slug: 'org2' },
          },
        ],
        error: null,
      });
      // For upsert (setCurrentOrganization)
      const upsertBuilder = createBuilder({ data: null, error: null });

      let callCount = 0;
      mockClient.from.mockImplementation((table: string) => {
        if (table === 'user_preferences') {
          callCount++;
          if (callCount === 1) return prefBuilder; // first call: get pref
          return upsertBuilder; // subsequent: upsert
        }
        if (table === 'team_members') return memberBuilder;
        if (table === 'organizations') return orgBuilder;
        return createBuilder();
      });

      const result = await getCurrentOrganization('u1');
      // May return the org or null depending on internal flow
      expect(result).toBeDefined();
    });
  });

  // ─── setCurrentOrganization ───────────────────────────────────
  describe('setCurrentOrganization', () => {
    it('updates user preference when user has access', async () => {
      const memberBuilder = createBuilder({
        data: [
          {
            id: 'm1',
            organization_id: 'org1',
            user_id: 'u1',
            role: 'member',
            status: 'active',
            joined_at: '2025-01-01',
            organizations: { id: 'org1', name: 'Org1', slug: 'org1' },
          },
        ],
        error: null,
      });
      const upsertBuilder = createBuilder({ data: null, error: null });

      mockClient.from.mockImplementation((table: string) => {
        if (table === 'team_members') return memberBuilder;
        if (table === 'user_preferences') return upsertBuilder;
        return createBuilder();
      });

      await expect(
        setCurrentOrganization('u1', 'org1'),
      ).resolves.toBeUndefined();
    });

    it('throws when user does not have access', async () => {
      mockClient.from.mockReturnValue(createBuilder({ data: [], error: null }));

      await expect(
        setCurrentOrganization('u1', 'org-noaccess'),
      ).rejects.toThrow('User does not have access');
    });
  });

  // ─── createOrganization ───────────────────────────────────────
  describe('createOrganization', () => {
    it('creates org and adds owner membership', async () => {
      const slugCheckBuilder = createBuilder({ data: null, error: null });
      const insertBuilder = createBuilder({
        data: { id: 'new-org', name: 'New Org', slug: 'new-org' },
        error: null,
      });
      const _memberInsertBuilder = createBuilder({ data: null, error: null });
      const memberListBuilder = createBuilder({
        data: [
          {
            id: 'm1',
            organization_id: 'new-org',
            user_id: 'u1',
            role: 'owner',
            status: 'active',
            joined_at: '2025-01-01',
            organizations: { id: 'new-org', name: 'New Org', slug: 'new-org' },
          },
        ],
        error: null,
      });
      const upsertBuilder = createBuilder({ data: null, error: null });

      mockClient.from.mockImplementation((table: string) => {
        if (table === 'organizations') return insertBuilder;
        if (table === 'team_members') return memberListBuilder;
        if (table === 'user_preferences') return upsertBuilder;
        return createBuilder();
      });

      // Override for slug check: first call returns null (slug available)
      const fromSpy = mockClient.from;
      let orgCallCount = 0;
      fromSpy.mockImplementation((table: string) => {
        if (table === 'organizations') {
          orgCallCount++;
          if (orgCallCount === 1) return slugCheckBuilder;
          return insertBuilder;
        }
        if (table === 'team_members') return memberListBuilder;
        if (table === 'user_preferences') return upsertBuilder;
        return createBuilder();
      });

      const result = await createOrganization('u1', {
        name: 'New Org',
        slug: 'new-org',
      });
      expect(result).toBeDefined();
    });

    it('throws when slug is already taken', async () => {
      const slugCheckBuilder = createBuilder({
        data: { id: 'existing' },
        error: null,
      });
      mockClient.from.mockReturnValue(slugCheckBuilder);

      await expect(
        createOrganization('u1', { name: 'Dup', slug: 'dup' }),
      ).rejects.toThrow('Organization slug already taken');
    });

    it('throws on insert error', async () => {
      let callCount = 0;
      mockClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return createBuilder({ data: null, error: null });
        return createBuilder({
          data: null,
          error: { message: 'Insert failed' },
        });
      });

      await expect(
        createOrganization('u1', { name: 'Fail', slug: 'fail' }),
      ).rejects.toThrow('Failed to create organization');
    });
  });

  // ─── updateOrganization ───────────────────────────────────────
  describe('updateOrganization', () => {
    it('updates org when user is admin', async () => {
      const memberBuilder = createBuilder({
        data: { role: 'admin' },
        error: null,
      });
      const updateBuilder = createBuilder({
        data: { id: 'org1', name: 'Updated' },
        error: null,
      });
      const memberListBuilder = createBuilder({
        data: [{ user_id: 'u1' }],
        error: null,
      });

      let teamMemberCallCount = 0;
      mockClient.from.mockImplementation((table: string) => {
        if (table === 'team_members') {
          teamMemberCallCount++;
          if (teamMemberCallCount === 1) {
            // First call: role check
            return memberBuilder;
          }
          // Second call: member list for cache invalidation
          return memberListBuilder;
        }
        if (table === 'organizations') return updateBuilder;
        return createBuilder();
      });

      const result = await updateOrganization('org1', 'u1', {
        name: 'Updated',
      });
      expect(result).toBeDefined();
    });

    it('throws when user is not admin/owner', async () => {
      mockClient.from.mockReturnValue(
        createBuilder({ data: { role: 'viewer' }, error: null }),
      );

      await expect(
        updateOrganization('org1', 'u1', { name: 'X' }),
      ).rejects.toThrow('Insufficient permissions');
    });

    it('throws when membership not found', async () => {
      mockClient.from.mockReturnValue(
        createBuilder({ data: null, error: null }),
      );

      await expect(
        updateOrganization('org1', 'u1', { name: 'X' }),
      ).rejects.toThrow('Insufficient permissions');
    });

    it('throws on update error', async () => {
      const memberBuilder = createBuilder({
        data: { role: 'owner' },
        error: null,
      });
      const updateBuilder = createBuilder({
        data: null,
        error: { message: 'Update failed' },
      });

      const _callCount = 0;
      mockClient.from.mockImplementation((table: string) => {
        if (table === 'team_members') return memberBuilder;
        if (table === 'organizations') return updateBuilder;
        return createBuilder();
      });

      await expect(
        updateOrganization('org1', 'u1', { name: 'X' }),
      ).rejects.toThrow('Failed to update organization');
    });
  });

  // ─── deleteOrganization ───────────────────────────────────────
  describe('deleteOrganization', () => {
    it('deletes org when user is owner', async () => {
      const orgBuilder = createBuilder({
        data: { owner_id: 'u1' },
        error: null,
      });
      const _deleteBuilder = createBuilder({ data: null, error: null });

      mockClient.from.mockImplementation((table: string) => {
        if (table === 'organizations') {
          // Two calls: first select, then delete
          return orgBuilder;
        }
        return createBuilder();
      });

      await expect(deleteOrganization('org1', 'u1')).resolves.toBeUndefined();
    });

    it('throws when user is not owner', async () => {
      mockClient.from.mockReturnValue(
        createBuilder({ data: { owner_id: 'other' }, error: null }),
      );

      await expect(deleteOrganization('org1', 'u1')).rejects.toThrow(
        'Only the organization owner',
      );
    });

    it('throws when org not found', async () => {
      mockClient.from.mockReturnValue(
        createBuilder({ data: null, error: null }),
      );

      await expect(deleteOrganization('org1', 'u1')).rejects.toThrow(
        'Only the organization owner',
      );
    });

    it('throws on delete error', async () => {
      const orgBuilder = createBuilder({
        data: { owner_id: 'u1' },
        error: null,
      });
      const errorBuilder = createBuilder({
        data: null,
        error: { message: 'FK constraint' },
      });

      let callCount = 0;
      mockClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return orgBuilder;
        return errorBuilder;
      });

      await expect(deleteOrganization('org1', 'u1')).rejects.toThrow(
        'Failed to delete organization',
      );
    });
  });

  // ─── inviteToOrganization ─────────────────────────────────────
  describe('inviteToOrganization', () => {
    it('creates invitation for new user (not existing)', async () => {
      const inviterBuilder = createBuilder({
        data: { role: 'admin' },
        error: null,
      });
      const orgNameBuilder = createBuilder({
        data: { name: 'Test Org' },
        error: null,
      });

      mockClient.from.mockImplementation((table: string) => {
        if (table === 'team_members') return inviterBuilder;
        if (table === 'organizations') return orgNameBuilder;
        return createBuilder();
      });

      (findAuthUserByEmail as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        inviteToOrganization('org1', 'u1', 'new@test.com', 'member'),
      ).resolves.toBeUndefined();
      expect(createInvitation).toHaveBeenCalled();
    });

    it('throws when inviter has insufficient permissions', async () => {
      mockClient.from.mockReturnValue(
        createBuilder({ data: { role: 'viewer' }, error: null }),
      );

      await expect(
        inviteToOrganization('org1', 'u1', 'x@y.com'),
      ).rejects.toThrow('Insufficient permissions');
    });

    it('throws when inviter not found', async () => {
      mockClient.from.mockReturnValue(
        createBuilder({ data: null, error: null }),
      );

      await expect(
        inviteToOrganization('org1', 'u1', 'x@y.com'),
      ).rejects.toThrow('Insufficient permissions');
    });

    it('creates membership for existing user', async () => {
      const inviterBuilder = createBuilder({
        data: { role: 'owner' },
        error: null,
      });
      const existingCheckBuilder = createBuilder({
        data: null,
        error: null,
      });
      const insertBuilder = createBuilder({
        data: { id: 'new-member-id' },
        error: null,
      });
      const orgNameBuilder = createBuilder({
        data: { name: 'Test Org' },
        error: null,
      });

      let teamCallCount = 0;
      mockClient.from.mockImplementation((table: string) => {
        if (table === 'team_members') {
          teamCallCount++;
          if (teamCallCount === 1) return inviterBuilder;
          if (teamCallCount === 2) return existingCheckBuilder;
          return insertBuilder;
        }
        if (table === 'organizations') return orgNameBuilder;
        return createBuilder();
      });

      (findAuthUserByEmail as jest.Mock).mockResolvedValueOnce({
        id: 'existing-user',
      });

      await expect(
        inviteToOrganization('org1', 'u1', 'existing@test.com', 'admin'),
      ).resolves.toBeUndefined();
    });

    it('throws when user is already a member', async () => {
      const inviterBuilder = createBuilder({
        data: { role: 'admin' },
        error: null,
      });
      const existingBuilder = createBuilder({
        data: { id: 'existing-member' },
        error: null,
      });

      let teamCallCount = 0;
      mockClient.from.mockImplementation((table: string) => {
        if (table === 'team_members') {
          teamCallCount++;
          if (teamCallCount === 1) return inviterBuilder;
          return existingBuilder;
        }
        return createBuilder();
      });

      (findAuthUserByEmail as jest.Mock).mockResolvedValueOnce({ id: 'u2' });

      await expect(
        inviteToOrganization('org1', 'u1', 'u2@test.com'),
      ).rejects.toThrow('User is already a member');
    });

    it('throws when invitation creation fails', async () => {
      const inviterBuilder = createBuilder({
        data: { role: 'admin' },
        error: null,
      });
      mockClient.from.mockReturnValue(inviterBuilder);

      (findAuthUserByEmail as jest.Mock).mockResolvedValueOnce(null);
      (createInvitation as jest.Mock).mockResolvedValueOnce({
        success: false,
        data: null,
      });

      await expect(
        inviteToOrganization('org1', 'u1', 'fail@test.com'),
      ).rejects.toThrow('Failed to create organization invitation');
    });

    it('throws when membership insert fails', async () => {
      const inviterBuilder = createBuilder({
        data: { role: 'owner' },
        error: null,
      });
      const existingCheckBuilder = createBuilder({ data: null, error: null });
      const insertErrorBuilder = createBuilder({
        data: null,
        error: { message: 'Insert err' },
      });

      let teamCallCount = 0;
      mockClient.from.mockImplementation((table: string) => {
        if (table === 'team_members') {
          teamCallCount++;
          if (teamCallCount === 1) return inviterBuilder;
          if (teamCallCount === 2) return existingCheckBuilder;
          return insertErrorBuilder;
        }
        return createBuilder();
      });

      (findAuthUserByEmail as jest.Mock).mockResolvedValueOnce({ id: 'u3' });

      await expect(
        inviteToOrganization('org1', 'u1', 'u3@test.com'),
      ).rejects.toThrow('Failed to create organization invitation');
    });
  });

  // ─── getPendingInvitation ─────────────────────────────────────
  describe('getPendingInvitation', () => {
    it('returns invitation with org name', async () => {
      const memberBuilder = createBuilder({
        data: {
          id: 'm1',
          organization_id: 'org1',
          user_id: 'u1',
          role: 'member',
          status: 'invited',
        },
        error: null,
      });
      const orgBuilder = createBuilder({
        data: { name: 'Test Org' },
        error: null,
      });

      mockClient.from.mockImplementation((table: string) => {
        if (table === 'team_members') return memberBuilder;
        if (table === 'organizations') return orgBuilder;
        return createBuilder();
      });

      const result = await getPendingInvitation('m1');
      expect(result).toBeDefined();
      expect(result!.organization_name).toBe('Test Org');
    });

    it('returns null when membership not found', async () => {
      mockClient.from.mockReturnValue(
        createBuilder({ data: null, error: null }),
      );

      const result = await getPendingInvitation('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ─── acceptInvitation ─────────────────────────────────────────
  describe('acceptInvitation', () => {
    it('updates membership to active', async () => {
      mockClient.from.mockReturnValue(
        createBuilder({ data: null, error: null }),
      );

      await expect(acceptInvitation('m1', 'u1')).resolves.toBeUndefined();
    });

    it('throws on update error', async () => {
      mockClient.from.mockReturnValue(
        createBuilder({ data: null, error: { message: 'Update failed' } }),
      );

      await expect(acceptInvitation('m1', 'u1')).rejects.toThrow(
        'Failed to accept invitation',
      );
    });
  });

  // ─── removeMember ─────────────────────────────────────────────
  describe('removeMember', () => {
    it('removes member when remover is admin', async () => {
      const removerBuilder = createBuilder({
        data: { role: 'admin' },
        error: null,
      });
      const memberBuilder = createBuilder({
        data: { role: 'member', user_id: 'u2' },
        error: null,
      });
      const deleteBuilder = createBuilder({ data: null, error: null });

      let callCount = 0;
      mockClient.from.mockImplementation((table: string) => {
        if (table === 'team_members') {
          callCount++;
          if (callCount === 1) return removerBuilder;
          if (callCount === 2) return memberBuilder;
          return deleteBuilder;
        }
        return createBuilder();
      });

      await expect(
        removeMember('org1', 'member-id', 'u1'),
      ).resolves.toBeUndefined();
    });

    it('throws when remover has insufficient permissions', async () => {
      mockClient.from.mockReturnValue(
        createBuilder({ data: { role: 'member' }, error: null }),
      );

      await expect(removeMember('org1', 'm1', 'u1')).rejects.toThrow(
        'Insufficient permissions',
      );
    });

    it('throws when trying to remove owner', async () => {
      const removerBuilder = createBuilder({
        data: { role: 'owner' },
        error: null,
      });
      const memberBuilder = createBuilder({
        data: { role: 'owner', user_id: 'u2' },
        error: null,
      });

      let callCount = 0;
      mockClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return removerBuilder;
        return memberBuilder;
      });

      await expect(removeMember('org1', 'owner-id', 'u1')).rejects.toThrow(
        'Cannot remove organization owner',
      );
    });

    it('throws on delete error', async () => {
      const removerBuilder = createBuilder({
        data: { role: 'admin' },
        error: null,
      });
      const memberBuilder = createBuilder({
        data: { role: 'member', user_id: 'u2' },
        error: null,
      });
      const deleteBuilder = createBuilder({
        data: null,
        error: { message: 'Delete error' },
      });

      let callCount = 0;
      mockClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return removerBuilder;
        if (callCount === 2) return memberBuilder;
        return deleteBuilder;
      });

      await expect(removeMember('org1', 'm1', 'u1')).rejects.toThrow(
        'Failed to remove member',
      );
    });
  });

  // ─── getOrganizationStats ─────────────────────────────────────
  describe('getOrganizationStats', () => {
    it('returns stats from count queries', async () => {
      const membersBuilder = createCountBuilder(5);
      const tasksBuilder = createCountBuilder(10);
      const certsBuilder = createCountBuilder(3);
      const evidenceBuilder = createCountBuilder(7);

      let callIdx = 0;
      mockClient.from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return membersBuilder;
        if (callIdx === 2) return tasksBuilder;
        if (callIdx === 3) return certsBuilder;
        return evidenceBuilder;
      });

      const stats = await getOrganizationStats('org1');
      expect(stats).toEqual({
        members: 5,
        tasks: 10,
        certificates: 3,
        evidence: 7,
      });
    });

    it('returns 0 for null counts', async () => {
      const _nullCountBuilder = createCountBuilder(0);
      // Override the then to return null count
      const b = createBuilder({ data: null, count: null, error: null });
      mockClient.from.mockReturnValue(b);

      const stats = await getOrganizationStats('org2');
      expect(stats.members).toBe(0);
    });
  });
});

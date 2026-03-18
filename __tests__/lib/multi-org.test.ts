/** @jest-environment node */

import {
  createOrganization,
  getUserOrganizations,
  inviteToOrganization,
  removeMember,
  setCurrentOrganization,
  updateOrganization,
} from '@/lib/multi-org';
import { mockSupabase } from '@/tests/helpers';

const supabase = mockSupabase();
const getCached = jest.fn(
  async (_key: string, fetcher: () => Promise<unknown>) => fetcher(),
);
const invalidateCache = jest.fn(async () => undefined);

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => supabase.client),
}));

const sendAuthEmail = jest.fn(async () => ({ success: true, id: 'email-1' }));

jest.mock('@/lib/cache', () => ({
  getCached: (...args: unknown[]) => getCached(...args),
  invalidateCache: (...args: unknown[]) => invalidateCache(...args),
}));

jest.mock('@/lib/email/send-auth-email', () => ({
  sendAuthEmail: (...args: unknown[]) => sendAuthEmail(...args),
}));

describe('multi-org', () => {
  beforeEach(() => {
    supabase.reset();
    getCached.mockClear();
    invalidateCache.mockClear();
    sendAuthEmail.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads active organizations for a user and maps nested organization data', async () => {
    supabase.queueResponse({
      match: { table: 'team_members', action: 'select', expects: 'many' },
      response: {
        data: [
          {
            id: 'membership-1',
            organization_id: 'org-1',
            user_id: 'user-1',
            role: 'admin',
            status: 'active',
            joined_at: '2026-03-10T00:00:00.000Z',
            invited_by: 'owner-1',
            organizations: {
              id: 'org-1',
              name: 'Acme',
              slug: 'acme',
              created_at: '2026-03-01T00:00:00.000Z',
              owner_id: 'owner-1',
            },
          },
        ],
        error: null,
      },
    });

    await expect(getUserOrganizations('user-1')).resolves.toEqual([
      expect.objectContaining({
        organization_id: 'org-1',
        role: 'admin',
        organization: expect.objectContaining({ name: 'Acme' }),
      }),
    ]);
    expect(getCached).toHaveBeenCalledWith(
      'user:user-1:organizations',
      expect.any(Function),
      300,
    );
  });

  it('persists the current organization only when the user has access', async () => {
    supabase.queueResponse({
      match: { table: 'team_members', action: 'select', expects: 'many' },
      response: {
        data: [
          {
            id: 'membership-1',
            organization_id: 'org-2',
            user_id: 'user-1',
            role: 'member',
            status: 'active',
            organizations: { id: 'org-2', name: 'Beta' },
          },
        ],
        error: null,
      },
    });
    supabase.queueResponse({
      match: { table: 'user_preferences', action: 'upsert', expects: 'many' },
      response: { data: null, error: null },
    });

    await expect(setCurrentOrganization('user-1', 'org-2')).resolves.toBeUndefined();

    const upsert = supabase.operations.find(
      (operation) =>
        operation.table === 'user_preferences' && operation.action === 'upsert',
    );
    expect(upsert?.values).toEqual(
      expect.objectContaining({
        user_id: 'user-1',
        current_organization_id: 'org-2',
      }),
    );
    expect(invalidateCache).toHaveBeenCalledWith('user:user-1:organizations');
  });

  it('rejects organization switching when the user lacks membership', async () => {
    supabase.queueResponse({
      match: { table: 'team_members', action: 'select', expects: 'many' },
      response: {
        data: [
          {
            id: 'membership-1',
            organization_id: 'org-1',
            user_id: 'user-1',
            role: 'member',
            status: 'active',
            organizations: { id: 'org-1', name: 'Acme' },
          },
        ],
        error: null,
      },
    });

    await expect(
      setCurrentOrganization('user-1', 'org-missing'),
    ).rejects.toThrow('User does not have access to this organization');
  });

  it('creates a new organization, owner membership, and default preference', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'organizations' && operation.action === 'select') {
        return { data: null, error: null };
      }
      if (operation.table === 'organizations' && operation.action === 'insert') {
        return {
          data: {
            id: 'org-new',
            owner_id: 'user-1',
            ...(operation.values as Record<string, unknown>),
          },
          error: null,
        };
      }
      if (operation.table === 'team_members' && operation.action === 'insert') {
        return { data: null, error: null };
      }
      if (operation.table === 'team_members' && operation.action === 'select') {
        return {
          data: [
            {
              id: 'membership-1',
              organization_id: 'org-new',
              user_id: 'user-1',
              role: 'owner',
              status: 'active',
              organizations: { id: 'org-new', name: 'New Org' },
            },
          ],
          error: null,
        };
      }
      if (operation.table === 'user_preferences' && operation.action === 'upsert') {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });

    const organization = await createOrganization('user-1', {
      name: 'New Org',
      slug: 'new-org',
      description: 'Fresh org',
    });

    expect(organization.id).toBe('org-new');
    expect(
      supabase.operations.some(
        (operation) =>
          operation.table === 'team_members' &&
          operation.action === 'insert' &&
          (operation.values as Record<string, unknown>).role === 'owner',
      ),
    ).toBe(true);
    expect(invalidateCache).toHaveBeenCalledWith('user:user-1:organizations');
  });

  it('updates organizations only for admin-capable users and invalidates member caches', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'team_members' && operation.action === 'select') {
        if (
          operation.filters.some(
            (filter) => filter.column === 'user_id' && filter.value === 'admin-1',
          )
        ) {
          return { data: { role: 'admin' }, error: null };
        }
        return {
          data: [{ user_id: 'admin-1' }, { user_id: 'member-1' }],
          error: null,
        };
      }
      if (operation.table === 'organizations' && operation.action === 'update') {
        return {
          data: { id: 'org-1', name: 'Updated Org' },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    await expect(
      updateOrganization('org-1', 'admin-1', { name: 'Updated Org' }),
    ).resolves.toEqual(expect.objectContaining({ name: 'Updated Org' }));

    expect(invalidateCache).toHaveBeenCalledWith('user:admin-1:organizations');
    expect(invalidateCache).toHaveBeenCalledWith('user:member-1:organizations');
  });

  it('creates invited memberships for known users and sends an invite email', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'team_members' && operation.action === 'select') {
        if (
          operation.filters.some(
            (filter) => filter.column === 'user_id' && filter.value === 'admin-1',
          )
        ) {
          return { data: { role: 'admin' }, error: null };
        }
        if (
          operation.filters.some(
            (filter) => filter.column === 'user_id' && filter.value === 'user-2',
          )
        ) {
          return { data: null, error: null };
        }
      }
      if (operation.table === 'profiles') {
        if (
          operation.filters.some(
            (filter) => filter.column === 'email' && filter.value === 'user2@example.com',
          )
        ) {
          return { data: { id: 'user-2' }, error: null };
        }
        if (
          operation.filters.some(
            (filter) => filter.column === 'id' && filter.value === 'admin-1',
          )
        ) {
          return {
            data: { full_name: 'Admin User', email: 'admin@example.com' },
            error: null,
          };
        }
      }
      if (operation.table === 'organizations') {
        return { data: { name: 'Acme Org' }, error: null };
      }
      if (operation.table === 'team_members' && operation.action === 'insert') {
        return { data: { id: 'membership-2' }, error: null };
      }
      return { data: null, error: null };
    });

    await expect(
      inviteToOrganization('org-1', 'admin-1', 'user2@example.com', 'viewer'),
    ).resolves.toBeUndefined();

    const insert = supabase.operations.find(
      (operation) =>
        operation.table === 'team_members' && operation.action === 'insert',
    );
    expect(insert?.values).toEqual(
      expect.objectContaining({
        organization_id: 'org-1',
        user_id: 'user-2',
        role: 'viewer',
        status: 'invited',
      }),
    );
    expect(sendAuthEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user2@example.com',
        template: 'invite',
        organizationName: 'Acme Org',
      }),
    );
  });

  it('creates a token invitation for unknown users and emails the signup link', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'team_members' && operation.action === 'select') {
        if (
          operation.filters.some(
            (filter) => filter.column === 'user_id' && filter.value === 'admin-1',
          )
        ) {
          return { data: { role: 'admin' }, error: null };
        }
      }
      if (
        operation.table === 'profiles' &&
        operation.filters.some(
          (filter) =>
            filter.column === 'email' && filter.value === 'new.user@example.com',
        )
      ) {
        return { data: null, error: null };
      }
      if (
        operation.table === 'team_invitations' &&
        operation.action === 'select'
      ) {
        return { data: null, error: null };
      }
      if (
        operation.table === 'team_invitations' &&
        operation.action === 'insert'
      ) {
        return {
          data: { id: 'invite-1', token: 'token-1', email: 'new.user@example.com' },
          error: null,
        };
      }
      if (
        operation.table === 'profiles' &&
        operation.filters.some(
          (filter) => filter.column === 'id' && filter.value === 'admin-1',
        )
      ) {
        return {
          data: { full_name: 'Admin User', email: 'admin@example.com' },
          error: null,
        };
      }
      if (operation.table === 'organizations') {
        return { data: { name: 'Acme Org' }, error: null };
      }
      return { data: null, error: null };
    });

    await expect(
      inviteToOrganization('org-1', 'admin-1', 'new.user@example.com', 'member'),
    ).resolves.toBeUndefined();

    const tokenInvite = supabase.operations.find(
      (operation) =>
        operation.table === 'team_invitations' &&
        operation.action === 'insert',
    );
    expect(tokenInvite?.values).toEqual(
      expect.objectContaining({
        organization_id: 'org-1',
        email: 'new.user@example.com',
        role: 'member',
        status: 'pending',
      }),
    );
    expect(sendAuthEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'new.user@example.com',
        template: 'invite',
        actionLink: expect.stringContaining('/accept-invite/token-1'),
        organizationName: 'Acme Org',
      }),
    );
  });

  it('prevents removing owners and invalidates removed member caches', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'team_members' && operation.action === 'select') {
        if (
          operation.filters.some(
            (filter) => filter.column === 'user_id' && filter.value === 'admin-1',
          ) &&
          operation.filters.some(
            (filter) => filter.column === 'organization_id' && filter.value === 'org-1',
          )
        ) {
          return { data: { role: 'admin' }, error: null };
        }
        if (operation.filters.some((filter) => filter.column === 'id')) {
          return { data: { role: 'member', user_id: 'user-9' }, error: null };
        }
      }
      if (operation.table === 'team_members' && operation.action === 'delete') {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });

    await expect(removeMember('org-1', 'member-1', 'admin-1')).resolves.toBeUndefined();
    expect(invalidateCache).toHaveBeenCalledWith('user:user-9:organizations');
  });
});

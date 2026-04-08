/**
 * Branch-coverage tests for lib/multi-org.ts
 * Targets uncovered branches in getUserOrganizations, getCurrentOrganization,
 * setCurrentOrganization, createOrganization, updateOrganization
 */

jest.mock('server-only', () => ({}));

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
    'filter',
    'match',
    'or',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

let callCount = 0;
let buildersByCall: any[] = [];
const mockFrom = jest.fn(() => {
  const idx = callCount++;
  return buildersByCall[idx] || createBuilder();
});

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    from: mockFrom,
  })),
}));

jest.mock('@/lib/cache', () => ({
  getCached: jest.fn(async (_key: string, fn: () => Promise<any>) => fn()),
  invalidateCache: jest.fn(async () => {}),
}));

jest.mock('@/lib/email/send-auth-email', () => ({
  sendAuthEmail: jest.fn(),
}));

jest.mock('@/lib/invitations/create-invitation', () => ({
  createInvitation: jest.fn(),
}));

jest.mock('@/lib/users/admin-profile-directory', () => ({
  findAuthUserByEmail: jest.fn(),
  getAdminProfileDirectoryEntries: jest.fn(),
}));

import {
  getUserOrganizations,
  getCurrentOrganization,
  setCurrentOrganization,
  createOrganization,
  updateOrganization,
} from '@/lib/multi-org';

describe('getUserOrganizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    callCount = 0;
    buildersByCall = [];
  });

  it('returns mapped memberships', async () => {
    buildersByCall = [
      createBuilder({
        data: [
          {
            id: 'm1',
            organization_id: 'org1',
            user_id: 'u1',
            role: 'owner',
            status: 'active',
            joined_at: '2024-01-01',
            invited_by: null,
            organizations: { id: 'org1', name: 'Test Org' },
          },
        ],
        error: null,
      }),
    ];
    const result = await getUserOrganizations('u1');
    expect(result.length).toBe(1);
    expect(result[0].organization).toEqual({ id: 'org1', name: 'Test Org' });
  });

  it('returns empty on error', async () => {
    buildersByCall = [
      createBuilder({ data: null, error: { message: 'fail' } }),
    ];
    const result = await getUserOrganizations('u1');
    expect(result).toEqual([]);
  });

  it('handles null data', async () => {
    buildersByCall = [createBuilder({ data: null, error: null })];
    const result = await getUserOrganizations('u1');
    expect(result).toEqual([]);
  });
});

describe('getCurrentOrganization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    callCount = 0;
    buildersByCall = [];
  });

  it('returns org from user preference', async () => {
    buildersByCall = [
      // user_preferences query
      createBuilder({ data: { current_organization_id: 'org1' }, error: null }),
      // organizations query
      createBuilder({ data: { id: 'org1', name: 'My Org' }, error: null }),
    ];
    const result = await getCurrentOrganization('u1');
    expect(result?.id).toBe('org1');
  });

  it('falls back to first org when no preference', async () => {
    buildersByCall = [
      // user_preferences (no preference)
      createBuilder({ data: null, error: null }),
      // getUserOrganizations → team_members query
      createBuilder({
        data: [
          {
            id: 'm1',
            organization_id: 'org2',
            user_id: 'u1',
            role: 'member',
            status: 'active',
            organizations: { id: 'org2' },
          },
        ],
        error: null,
      }),
      // setCurrentOrganization → getUserOrganizations again
      createBuilder({
        data: [
          {
            id: 'm1',
            organization_id: 'org2',
            user_id: 'u1',
            role: 'member',
            status: 'active',
            organizations: { id: 'org2' },
          },
        ],
        error: null,
      }),
      // setCurrentOrganization → user_preferences upsert
      createBuilder({ data: null, error: null }),
      // organizations query
      createBuilder({
        data: { id: 'org2', name: 'Fallback Org' },
        error: null,
      }),
    ];
    const result = await getCurrentOrganization('u1');
    expect(result?.id).toBe('org2');
  });

  it('returns null when no orgs', async () => {
    buildersByCall = [
      // user_preferences (no preference)
      createBuilder({ data: null, error: null }),
      // getUserOrganizations → empty
      createBuilder({ data: [], error: null }),
    ];
    const result = await getCurrentOrganization('u1');
    expect(result).toBeNull();
  });
});

describe('setCurrentOrganization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    callCount = 0;
    buildersByCall = [];
  });

  it('updates user preference', async () => {
    buildersByCall = [
      // getUserOrganizations
      createBuilder({
        data: [
          {
            id: 'm1',
            organization_id: 'org1',
            user_id: 'u1',
            role: 'member',
            status: 'active',
            organizations: {},
          },
        ],
        error: null,
      }),
      // user_preferences upsert
      createBuilder({ data: null, error: null }),
    ];
    await setCurrentOrganization('u1', 'org1');
  });

  it('throws when no access', async () => {
    buildersByCall = [createBuilder({ data: [], error: null })];
    await expect(setCurrentOrganization('u1', 'no-access')).rejects.toThrow(
      'User does not have access',
    );
  });
});

describe('createOrganization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    callCount = 0;
    buildersByCall = [];
  });

  it('creates org and adds creator as owner', async () => {
    buildersByCall = [
      // slug check
      createBuilder({ data: null, error: null }),
      // organizations insert
      createBuilder({
        data: { id: 'new-org', name: 'New', slug: 'new-org' },
        error: null,
      }),
      // team_members insert (add owner)
      createBuilder({ data: null, error: null }),
      // setCurrentOrganization → getUserOrganizations
      createBuilder({
        data: [
          {
            id: 'm1',
            organization_id: 'new-org',
            user_id: 'u1',
            role: 'owner',
            status: 'active',
            organizations: {},
          },
        ],
        error: null,
      }),
      // setCurrentOrganization → user_preferences upsert
      createBuilder({ data: null, error: null }),
    ];
    const org = await createOrganization('u1', {
      name: 'New',
      slug: 'new-org',
    });
    expect(org.id).toBe('new-org');
  });

  it('throws when slug taken', async () => {
    buildersByCall = [createBuilder({ data: { id: 'existing' }, error: null })];
    await expect(
      createOrganization('u1', { name: 'Dup', slug: 'taken' }),
    ).rejects.toThrow('slug already taken');
  });

  it('throws on insert error', async () => {
    buildersByCall = [
      createBuilder({ data: null, error: null }),
      createBuilder({ data: null, error: { message: 'DB error' } }),
    ];
    await expect(
      createOrganization('u1', { name: 'Fail', slug: 'fail-org' }),
    ).rejects.toThrow('Failed to create organization');
  });
});

describe('updateOrganization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    callCount = 0;
    buildersByCall = [];
  });

  it('updates org as owner', async () => {
    buildersByCall = [
      // membership check
      createBuilder({ data: { role: 'owner' }, error: null }),
      // organizations update
      createBuilder({ data: { id: 'org1', name: 'Updated' }, error: null }),
      // get all members for cache invalidation
      createBuilder({ data: [{ user_id: 'u1' }], error: null }),
    ];
    const org = await updateOrganization('org1', 'u1', { name: 'Updated' });
    expect(org.name).toBe('Updated');
  });

  it('updates org as admin', async () => {
    buildersByCall = [
      createBuilder({ data: { role: 'admin' }, error: null }),
      createBuilder({
        data: { id: 'org1', name: 'Admin Updated' },
        error: null,
      }),
      createBuilder({ data: [], error: null }),
    ];
    const org = await updateOrganization('org1', 'u1', {
      name: 'Admin Updated',
    });
    expect(org.name).toBe('Admin Updated');
  });

  it('throws for member role', async () => {
    buildersByCall = [createBuilder({ data: { role: 'member' }, error: null })];
    await expect(
      updateOrganization('org1', 'u1', { name: 'No' }),
    ).rejects.toThrow('Insufficient permissions');
  });

  it('throws when no membership', async () => {
    buildersByCall = [createBuilder({ data: null, error: null })];
    await expect(
      updateOrganization('org1', 'u1', { name: 'No' }),
    ).rejects.toThrow('Insufficient permissions');
  });

  it('throws on update error', async () => {
    buildersByCall = [
      createBuilder({ data: { role: 'owner' }, error: null }),
      createBuilder({ data: null, error: { message: 'Update fail' } }),
    ];
    await expect(
      updateOrganization('org1', 'u1', { name: 'Fail' }),
    ).rejects.toThrow('Failed to update organization');
  });
});

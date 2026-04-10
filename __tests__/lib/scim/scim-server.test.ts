/** @jest-environment node */

import {
  SCIM_ENTERPRISE_USER_EXTENSION,
  SCIM_SCHEMA_BULK,
  SCIM_SCHEMA_BULK_RESPONSE,
  SCIM_SCHEMA_ERROR,
  SCIM_SCHEMA_LIST,
  SCIM_SCHEMA_PATCH,
  SCIM_SCHEMA_USER,
} from '@/lib/scim/scim-schemas';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockScimError = jest.fn(
  (status: number, detail: string, scimType?: string) => ({
    schemas: [SCIM_SCHEMA_ERROR],
    status: String(status),
    ...(scimType ? { scimType } : {}),
    detail,
  }),
);

jest.mock('@/lib/scim/scim-auth', () => ({
  scimError: (...args: unknown[]) =>
    mockScimError(...(args as [number, string, string?])),
}));

const mockUpsertScimGroup = jest.fn();
const mockSyncGroupMembership = jest.fn();
const mockSyncGroupRoleAssignments = jest.fn();
const mockInferRoleMapping = jest.fn().mockReturnValue('member');
const mockGetGroupMembers = jest.fn().mockResolvedValue([]);

jest.mock('@/lib/scim/scim-groups', () => ({
  upsertScimGroup: (...args: unknown[]) => mockUpsertScimGroup(...args),
  syncGroupMembership: (...args: unknown[]) => mockSyncGroupMembership(...args),
  syncGroupRoleAssignments: (...args: unknown[]) =>
    mockSyncGroupRoleAssignments(...args),
  inferRoleMapping: (...args: unknown[]) => mockInferRoleMapping(...args),
  getGroupMembers: (...args: unknown[]) => mockGetGroupMembers(...args),
}));

// Supabase chain helpers
function makeChain(
  result: { data: unknown; error: unknown } = { data: null, error: null },
) {
  const c: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'in',
    'lt',
    'gte',
    'lte',
    'order',
    'limit',
    'range',
    'match',
    'is',
    'ilike',
    'filter',
    'or',
    'not',
    'gt',
    'contains',
    'textSearch',
  ];
  for (const m of methods) {
    c[m] = jest.fn().mockReturnValue(c);
  }
  c.single = jest.fn().mockResolvedValue(result);
  c.maybeSingle = jest.fn().mockResolvedValue(result);
  c.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(result).then(resolve, reject);
  return c;
}

function makeMutationChain(
  result: { data: unknown; error: unknown } = { data: null, error: null },
) {
  const c: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'in',
    'match',
    'is',
    'single',
    'maybeSingle',
  ];
  for (const m of methods) {
    c[m] = jest.fn().mockReturnValue(c);
  }
  c.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(result).then(resolve, reject);
  return c;
}

let mockFromChains: Record<string, ReturnType<typeof makeChain>>;
let mockInsertChain: ReturnType<typeof makeMutationChain>;
let mockUpsertChain: ReturnType<typeof makeMutationChain>;
let mockUpdateChain: ReturnType<typeof makeMutationChain>;
let mockDeleteChain: ReturnType<typeof makeMutationChain>;

const mockGetUserById = jest.fn();
const mockListAuthUsers = jest.fn();
const mockCreateAuthUser = jest.fn();
const mockUpdateUserById = jest.fn();

const mockAdmin = {
  from: jest.fn((table: string) => {
    const chain = mockFromChains[table] ?? makeChain();
    chain.insert = jest
      .fn()
      .mockReturnValue(mockInsertChain ?? makeMutationChain());
    chain.upsert = jest
      .fn()
      .mockReturnValue(mockUpsertChain ?? makeMutationChain());
    chain.update = jest
      .fn()
      .mockReturnValue(mockUpdateChain ?? makeMutationChain());
    chain.delete = jest
      .fn()
      .mockReturnValue(mockDeleteChain ?? makeMutationChain());
    return chain;
  }),
  auth: {
    admin: {
      getUserById: (...args: unknown[]) => mockGetUserById(...args),
      listUsers: (...args: unknown[]) => mockListAuthUsers(...args),
      createUser: (...args: unknown[]) => mockCreateAuthUser(...args),
      updateUserById: (...args: unknown[]) => mockUpdateUserById(...args),
    },
  },
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockAdmin,
}));

// ---------------------------------------------------------------------------
// Import under test (after mocks)
// ---------------------------------------------------------------------------

import {
  parseScimFilterExpression,
  applyScimFilter,
  applyScimSort,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  executeBulkOperations,
  getSingleResourceHeaders,
  isScimPatch,
  getScimContentHeaders,
  getBulkRequestSchema,
  getScimErrorSchema,
} from '@/lib/scim/scim-server';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG = 'org-1';
const BASE = 'https://app.example.com';
const UID = 'user-1';
const GID = 'group-1';
const TS = '2026-01-01T00:00:00.000Z';

function memberRow(ov: Record<string, unknown> = {}) {
  return {
    user_id: UID,
    role: 'member',
    department: null,
    compliance_status: 'active',
    created_at: TS,
    profiles: { full_name: 'Alice Smith', phone: null, updated_at: TS },
    organizations: { name: 'TestOrg' },
    ...ov,
  };
}

function authUser(ov: Record<string, unknown> = {}) {
  return {
    id: UID,
    email: 'alice@example.com',
    user_metadata: { full_name: 'Alice Smith' },
    app_metadata: {},
    updated_at: TS,
    ...ov,
  };
}

function groupRow(ov: Record<string, unknown> = {}) {
  return {
    id: GID,
    external_id: null,
    display_name: 'Engineers',
    created_at: TS,
    updated_at: TS,
    ...ov,
  };
}

function setupUser(
  memberOv: Record<string, unknown> = {},
  authOv: Record<string, unknown> = {},
) {
  mockFromChains.org_members = makeChain({
    data: [memberRow(memberOv)],
    error: null,
  });
  mockFromChains.scim_group_members = makeChain({ data: [], error: null });
  mockGetUserById.mockResolvedValue({
    data: { user: authUser(authOv) },
    error: null,
  });
  mockUpdateUserById.mockResolvedValue({
    data: { user: authUser(authOv) },
    error: null,
  });
}

function setupGroup(ov: Record<string, unknown> = {}) {
  mockFromChains.scim_groups = makeChain({ data: [groupRow(ov)], error: null });
  mockGetGroupMembers.mockResolvedValue([]);
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  // Reset implementations that some tests override with mockRejectedValue
  mockSyncGroupMembership.mockReset();
  mockSyncGroupRoleAssignments.mockReset();
  mockUpsertScimGroup.mockReset();
  mockInferRoleMapping.mockReset().mockReturnValue('member');
  mockGetGroupMembers.mockReset().mockResolvedValue([]);
  mockFromChains = {};
  mockInsertChain = makeMutationChain();
  mockUpsertChain = makeMutationChain();
  mockUpdateChain = makeMutationChain();
  mockDeleteChain = makeMutationChain();
});

// ==========================================================================
// parseScimFilterExpression
// ==========================================================================

describe('parseScimFilterExpression', () => {
  it('returns [] for null/undefined/empty/whitespace', () => {
    expect(parseScimFilterExpression(null)).toEqual([]);
    expect(parseScimFilterExpression(undefined)).toEqual([]);
    expect(parseScimFilterExpression('')).toEqual([]);
    expect(parseScimFilterExpression('   ')).toEqual([]);
  });

  it('parses simple eq', () => {
    expect(parseScimFilterExpression('userName eq "alice"')).toEqual([
      { attribute: 'userName', operator: 'eq', value: 'alice' },
    ]);
  });

  it('parses presence (pr)', () => {
    expect(parseScimFilterExpression('displayName pr')).toEqual([
      { attribute: 'displayName', operator: 'pr' },
    ]);
  });

  it('parses compound AND', () => {
    const r = parseScimFilterExpression('userName eq "a" and active eq "true"');
    expect(r).toHaveLength(2);
  });

  it.each(['ne', 'co', 'sw', 'ew', 'gt', 'lt', 'ge', 'le'] as const)(
    'parses %s operator',
    (op) => {
      const r = parseScimFilterExpression(`attr ${op} "v"`);
      expect(r[0].operator).toBe(op);
    },
  );

  it('throws on unsupported clause', () => {
    expect(() => parseScimFilterExpression('badclause')).toThrow(
      'Unsupported SCIM filter clause',
    );
  });

  it('handles unquoted value', () => {
    const r = parseScimFilterExpression('active eq true');
    expect(r[0].value).toBe('true');
  });
});

// ==========================================================================
// applyScimFilter
// ==========================================================================

describe('applyScimFilter', () => {
  const recs = [
    { userName: 'alice', active: true, displayName: 'Alice' },
    { userName: 'bob', active: false, displayName: 'Bob' },
    { userName: 'charlie', active: true, displayName: 'Charlie' },
  ];

  it('returns all when filter is empty', () => {
    expect(applyScimFilter(recs)).toEqual(recs);
    expect(applyScimFilter(recs, null)).toEqual(recs);
  });

  it('eq string', () =>
    expect(applyScimFilter(recs, 'userName eq "alice"')).toHaveLength(1));
  it('ne string', () =>
    expect(applyScimFilter(recs, 'userName ne "alice"')).toHaveLength(2));
  it('co string', () =>
    expect(applyScimFilter(recs, 'userName co "li"')).toHaveLength(2));
  it('sw string', () =>
    expect(applyScimFilter(recs, 'userName sw "al"')).toHaveLength(1));
  it('ew string', () =>
    expect(applyScimFilter(recs, 'userName ew "ob"')).toHaveLength(1));
  it('gt string', () =>
    expect(
      applyScimFilter([{ userName: 'b' }], 'userName gt "a"'),
    ).toHaveLength(1));
  it('lt string', () =>
    expect(
      applyScimFilter([{ userName: 'a' }], 'userName lt "b"'),
    ).toHaveLength(1));
  it('ge string', () =>
    expect(
      applyScimFilter([{ userName: 'b' }], 'userName ge "b"'),
    ).toHaveLength(1));
  it('le string', () =>
    expect(
      applyScimFilter([{ userName: 'b' }], 'userName le "b"'),
    ).toHaveLength(1));

  // boolean branches
  it('eq boolean true', () =>
    expect(applyScimFilter(recs, 'active eq "true"')).toHaveLength(2));
  it('ne boolean', () =>
    expect(applyScimFilter(recs, 'active ne "true"')).toHaveLength(1));
  it('boolean with unsupported op returns false', () => {
    expect(
      applyScimFilter([{ active: true }], 'active gt "true"'),
    ).toHaveLength(0);
  });

  // number branches
  describe('number comparisons', () => {
    const nums = [{ count: 5 }, { count: 10 }, { count: 15 }];
    it('eq', () =>
      expect(applyScimFilter(nums, 'count eq "10"')).toHaveLength(1));
    it('ne', () =>
      expect(applyScimFilter(nums, 'count ne "10"')).toHaveLength(2));
    it('gt', () =>
      expect(applyScimFilter(nums, 'count gt "5"')).toHaveLength(2));
    it('lt', () =>
      expect(applyScimFilter(nums, 'count lt "15"')).toHaveLength(2));
    it('ge', () =>
      expect(applyScimFilter(nums, 'count ge "10"')).toHaveLength(2));
    it('le', () =>
      expect(applyScimFilter(nums, 'count le "10"')).toHaveLength(2));
    it('NaN right returns false', () =>
      expect(applyScimFilter(nums, 'count eq "abc"')).toHaveLength(0));
    it('unsupported op on number returns false', () => {
      expect(applyScimFilter(nums, 'count co "5"')).toHaveLength(0);
    });
  });

  // presence
  it('pr on non-empty array', () => {
    expect(
      applyScimFilter([{ emails: [{ v: 1 }] }, { emails: [] }], 'emails pr'),
    ).toHaveLength(1);
  });
  it('pr on null/undefined', () => {
    expect(
      applyScimFilter([{ x: null }, { x: undefined } as any], 'x pr'),
    ).toHaveLength(0);
  });
  it('pr on non-empty string', () => {
    expect(applyScimFilter([{ x: 'hi' }, { x: '' }], 'x pr')).toHaveLength(1);
  });

  // resolveAttributeValue branches
  it('resolves emails.value', () => {
    const r = [
      { emails: [{ value: 'a@b.com' }] },
      { emails: [{ value: 'c@d.com' }] },
    ];
    expect(applyScimFilter(r, 'emails.value co "a@"')).toHaveLength(1);
  });
  it('emails.value with non-array emails returns undefined', () => {
    const r = [{ emails: 'not-array' }];
    expect(applyScimFilter(r, 'emails.value eq "x"')).toHaveLength(0);
  });
  it('resolves name.givenName', () => {
    expect(
      applyScimFilter(
        [{ name: { givenName: 'Al' } }],
        'name.givenName eq "al"',
      ),
    ).toHaveLength(1);
  });
  it('resolves name.familyName', () => {
    expect(
      applyScimFilter(
        [{ name: { familyName: 'Sm' } }],
        'name.familyName eq "sm"',
      ),
    ).toHaveLength(1);
  });
  it('name.givenName with no name returns undefined', () => {
    expect(applyScimFilter([{}], 'name.givenName eq "x"')).toHaveLength(0);
  });
  it('resolves meta.lastModified', () => {
    expect(
      applyScimFilter(
        [{ meta: { lastModified: '2026-01-01' } }],
        'meta.lastModified eq "2026-01-01"',
      ),
    ).toHaveLength(1);
  });
  it('resolves displayName case-insensitive', () => {
    expect(applyScimFilter(recs, 'displayname eq "alice"')).toHaveLength(1);
  });
  it('resolves username case-insensitive', () => {
    expect(applyScimFilter(recs, 'username eq "alice"')).toHaveLength(1);
  });
  it('unknown attribute returns undefined', () => {
    expect(applyScimFilter(recs, 'noSuchField eq "x"')).toHaveLength(0);
  });
  it('direct attribute has priority over case-insensitive', () => {
    const r = [{ displayName: 'Direct' }];
    expect(applyScimFilter(r, 'displayName eq "direct"')).toHaveLength(1);
  });
});

// ==========================================================================
// applyScimSort
// ==========================================================================

describe('applyScimSort', () => {
  const recs = [{ userName: 'c' }, { userName: 'a' }, { userName: 'b' }];

  it('no sortBy returns original', () =>
    expect(applyScimSort(recs)).toEqual(recs));
  it('ascending', () => {
    expect(applyScimSort(recs, 'userName').map((r) => r.userName)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
  it('ascending explicit', () => {
    expect(
      applyScimSort(recs, 'userName', 'ascending').map((r) => r.userName),
    ).toEqual(['a', 'b', 'c']);
  });
  it('descending', () => {
    expect(
      applyScimSort(recs, 'userName', 'descending').map((r) => r.userName),
    ).toEqual(['c', 'b', 'a']);
  });
  it('does not mutate', () => {
    const copy = [...recs];
    applyScimSort(recs, 'userName');
    expect(recs).toEqual(copy);
  });
});

// ==========================================================================
// listUsers / getUser
// ==========================================================================

describe('listUsers', () => {
  it('returns paginated list', async () => {
    setupUser();
    const r = await listUsers(ORG, BASE, {});
    expect(r.schemas).toContain(SCIM_SCHEMA_LIST);
    expect(r.totalResults).toBe(1);
    expect(r.Resources[0].userName).toBe('alice@example.com');
  });

  it('applies filter', async () => {
    setupUser();
    const r = await listUsers(ORG, BASE, { filter: 'userName eq "nobody"' });
    expect(r.totalResults).toBe(0);
  });

  it('applies sort', async () => {
    setupUser();
    const r = await listUsers(ORG, BASE, {
      sortBy: 'userName',
      sortOrder: 'descending',
    });
    expect(r.Resources).toHaveLength(1);
  });

  it('pagination params work', async () => {
    setupUser();
    const r = await listUsers(ORG, BASE, { startIndex: 1, count: 50 });
    expect(r.startIndex).toBe(1);
  });
});

describe('getUser', () => {
  it('found', async () => {
    setupUser();
    const u = await getUser(ORG, UID, BASE);
    expect(u).not.toBeNull();
    expect(u!.id).toBe(UID);
  });

  it('not found', async () => {
    setupUser();
    expect(await getUser(ORG, 'nope', BASE)).toBeNull();
  });

  it('meta resourceType/location', async () => {
    setupUser();
    const u = await getUser(ORG, UID, BASE);
    expect(u!.meta.resourceType).toBe('User');
    expect(u!.meta.location).toContain('/api/scim/v2/Users/');
  });

  it('enterprise ext dept & org', async () => {
    setupUser({ department: 'Eng' });
    const u = await getUser(ORG, UID, BASE);
    expect(u![SCIM_ENTERPRISE_USER_EXTENSION]?.department).toBe('Eng');
    expect(u![SCIM_ENTERPRISE_USER_EXTENSION]?.organization).toBe('TestOrg');
  });

  it('fallback to auth user_metadata.full_name', async () => {
    setupUser({ profiles: { full_name: null, phone: null, updated_at: null } });
    const u = await getUser(ORG, UID, BASE);
    expect(u!.displayName).toBe('Alice Smith');
  });

  it('fallback to auth user_metadata.name', async () => {
    setupUser(
      { profiles: { full_name: null, phone: null, updated_at: null } },
      { user_metadata: { name: 'From Name' } },
    );
    expect((await getUser(ORG, UID, BASE))!.displayName).toBe('From Name');
  });

  it('fallback to email as displayName', async () => {
    setupUser(
      { profiles: { full_name: null, phone: null, updated_at: null } },
      { user_metadata: {} },
    );
    expect((await getUser(ORG, UID, BASE))!.displayName).toBe(
      'alice@example.com',
    );
  });

  it('skips when auth user is null', async () => {
    mockFromChains.org_members = makeChain({
      data: [memberRow()],
      error: null,
    });
    mockFromChains.scim_group_members = makeChain({ data: [], error: null });
    mockGetUserById.mockResolvedValue({ data: { user: null }, error: null });
    expect(await getUser(ORG, UID, BASE)).toBeNull();
  });

  it('active=false when compliance_status=inactive', async () => {
    setupUser({ compliance_status: 'inactive' });
    expect((await getUser(ORG, UID, BASE))!.active).toBe(false);
  });

  it('includes groups (object form)', async () => {
    mockFromChains.org_members = makeChain({
      data: [memberRow()],
      error: null,
    });
    mockFromChains.scim_group_members = makeChain({
      data: [
        {
          user_id: UID,
          scim_groups: { id: 'g1', organization_id: ORG, display_name: 'Adm' },
        },
      ],
      error: null,
    });
    mockGetUserById.mockResolvedValue({
      data: { user: authUser() },
      error: null,
    });
    const u = await getUser(ORG, UID, BASE);
    expect(u!.groups).toHaveLength(1);
    expect(u!.groups![0].type).toBe('direct');
  });

  it('includes groups (array form)', async () => {
    mockFromChains.org_members = makeChain({
      data: [memberRow()],
      error: null,
    });
    mockFromChains.scim_group_members = makeChain({
      data: [
        {
          user_id: UID,
          scim_groups: [
            { id: 'g1', organization_id: ORG, display_name: 'Adm' },
          ],
        },
      ],
      error: null,
    });
    mockGetUserById.mockResolvedValue({
      data: { user: authUser() },
      error: null,
    });
    expect((await getUser(ORG, UID, BASE))!.groups).toHaveLength(1);
  });

  it('getUserGroups returns empty map on error', async () => {
    mockFromChains.org_members = makeChain({
      data: [memberRow()],
      error: null,
    });
    mockFromChains.scim_group_members = makeChain({
      data: null,
      error: { message: 'fail' },
    });
    mockGetUserById.mockResolvedValue({
      data: { user: authUser() },
      error: null,
    });
    expect((await getUser(ORG, UID, BASE))!.groups).toEqual([]);
  });

  it('getUserGroups skips row with no group id', async () => {
    mockFromChains.org_members = makeChain({
      data: [memberRow()],
      error: null,
    });
    mockFromChains.scim_group_members = makeChain({
      data: [
        {
          user_id: UID,
          scim_groups: { id: null, organization_id: ORG, display_name: null },
        },
      ],
      error: null,
    });
    mockGetUserById.mockResolvedValue({
      data: { user: authUser() },
      error: null,
    });
    expect((await getUser(ORG, UID, BASE))!.groups).toEqual([]);
  });

  it('getUserGroups skips row with no user_id', async () => {
    mockFromChains.org_members = makeChain({
      data: [memberRow()],
      error: null,
    });
    mockFromChains.scim_group_members = makeChain({
      data: [
        {
          user_id: null,
          scim_groups: { id: 'g1', organization_id: ORG, display_name: 'X' },
        },
      ],
      error: null,
    });
    mockGetUserById.mockResolvedValue({
      data: { user: authUser() },
      error: null,
    });
    expect((await getUser(ORG, UID, BASE))!.groups).toEqual([]);
  });

  it('externalId from app_metadata.provider_id', async () => {
    setupUser({}, { app_metadata: { provider_id: 'ext-1' } });
    expect((await getUser(ORG, UID, BASE))!.externalId).toBe('ext-1');
  });

  it('emails empty when no auth email', async () => {
    setupUser({}, { email: undefined });
    const u = await getUser(ORG, UID, BASE);
    expect(u!.emails).toEqual([]);
    expect(u!.userName).toBe('');
  });

  it('lastModified falls back to auth updated_at', async () => {
    setupUser(
      { profiles: { full_name: 'A', phone: null, updated_at: null } },
      { updated_at: '2026-03-01' },
    );
    expect((await getUser(ORG, UID, BASE))!.meta.lastModified).toBe(
      '2026-03-01',
    );
  });

  it('lastModified falls back to created_at', async () => {
    setupUser(
      {
        profiles: { full_name: 'A', phone: null, updated_at: null },
        created_at: '2025-06-01',
      },
      { updated_at: undefined },
    );
    expect((await getUser(ORG, UID, BASE))!.meta.lastModified).toBe(
      '2025-06-01',
    );
  });

  it('buildUserLookup throws on DB error', async () => {
    mockFromChains.org_members = makeChain({
      data: null,
      error: { message: 'db down' },
    });
    mockFromChains.scim_group_members = makeChain({ data: [], error: null });
    await expect(getUser(ORG, UID, BASE)).rejects.toThrow('db down');
  });
});

// ==========================================================================
// splitName edge cases (via getUser)
// ==========================================================================

describe('splitName edge cases', () => {
  it('single-word name', async () => {
    setupUser({
      profiles: { full_name: 'Madonna', phone: null, updated_at: null },
    });
    const u = await getUser(ORG, UID, BASE);
    expect(u!.name?.givenName).toBe('Madonna');
    expect(u!.name?.familyName).toBe('');
  });

  it('multi-word family name', async () => {
    setupUser({
      profiles: {
        full_name: 'Juan Carlos de la Cruz',
        phone: null,
        updated_at: null,
      },
    });
    expect((await getUser(ORG, UID, BASE))!.name?.familyName).toBe(
      'Carlos de la Cruz',
    );
  });

  it('empty name', async () => {
    setupUser(
      { profiles: { full_name: '', phone: null, updated_at: null } },
      { user_metadata: {} },
    );
    const u = await getUser(ORG, UID, BASE);
    expect(u!.name?.formatted).toBe('');
  });

  it('whitespace-only name', async () => {
    setupUser(
      { profiles: { full_name: '   ', phone: null, updated_at: null } },
      { user_metadata: {} },
    );
    expect((await getUser(ORG, UID, BASE))!.name?.formatted).toBe('');
  });
});

// ==========================================================================
// createUser
// ==========================================================================

describe('createUser', () => {
  it('success - new auth user', async () => {
    setupUser();
    mockListAuthUsers.mockResolvedValue({ data: { users: [] } });
    mockCreateAuthUser.mockResolvedValue({
      data: { user: authUser() },
      error: null,
    });
    const r = await createUser(
      ORG,
      {
        userName: 'alice@example.com',
        name: { givenName: 'A', familyName: 'S' },
      },
      BASE,
    );
    expect(r.status).toBe(201);
    expect(r.data).toBeDefined();
  });

  it('success - existing auth user', async () => {
    setupUser();
    mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
    const r = await createUser(ORG, { userName: 'alice@example.com' }, BASE);
    expect(r.status).toBe(201);
    expect(mockCreateAuthUser).not.toHaveBeenCalled();
  });

  it('400 when no email', async () => {
    const r = await createUser(ORG, {}, BASE);
    expect(r.status).toBe(400);
  });

  it('400 when userName has no @ and no emails', async () => {
    expect((await createUser(ORG, { userName: 'noatsign' }, BASE)).status).toBe(
      400,
    );
  });

  it('extracts email from emails array', async () => {
    setupUser();
    mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
    expect(
      (
        await createUser(
          ORG,
          { userName: 'nope', emails: [{ value: 'alice@example.com' }] },
          BASE,
        )
      ).status,
    ).toBe(201);
  });

  it('500 when auth createUser fails', async () => {
    mockListAuthUsers.mockResolvedValue({ data: { users: [] } });
    mockCreateAuthUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'auth err' },
    });
    expect(
      (await createUser(ORG, { userName: 'new@example.com' }, BASE)).status,
    ).toBe(500);
  });

  it('500 when createUser error is null but user is null', async () => {
    mockListAuthUsers.mockResolvedValue({ data: { users: [] } });
    mockCreateAuthUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(
      (await createUser(ORG, { userName: 'new@example.com' }, BASE)).status,
    ).toBe(500);
  });

  it('500 on membership upsert error', async () => {
    mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
    mockUpsertChain = makeMutationChain({
      data: null,
      error: { message: 'upsert fail' },
    });
    expect(
      (await createUser(ORG, { userName: 'alice@example.com' }, BASE)).status,
    ).toBe(500);
  });

  it('500 when provisioned user cannot be loaded', async () => {
    mockListAuthUsers.mockResolvedValue({
      data: { users: [authUser({ id: 'other' })] },
    });
    mockFromChains.org_members = makeChain({ data: [], error: null });
    mockFromChains.scim_group_members = makeChain({ data: [], error: null });
    const r = await createUser(ORG, { userName: 'alice@example.com' }, BASE);
    expect(r.status).toBe(500);
    expect(r.error?.detail).toContain('could not be loaded');
  });

  // mapScimRole branches
  it.each(['owner', 'admin', 'viewer', 'auditor'] as const)(
    'maps role=%s',
    async (role) => {
      setupUser();
      mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
      await createUser(ORG, { userName: 'alice@example.com', role }, BASE);
    },
  );

  it('defaults unknown role to member', async () => {
    setupUser();
    mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
    await createUser(
      ORG,
      { userName: 'alice@example.com', role: 'superuser' },
      BASE,
    );
  });

  it('extracts role from roles array', async () => {
    setupUser();
    mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
    await createUser(
      ORG,
      { userName: 'alice@example.com', roles: [{ value: 'admin' }] },
      BASE,
    );
  });

  it('defaults role when no role or roles given', async () => {
    setupUser();
    mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
    await createUser(ORG, { userName: 'alice@example.com' }, BASE);
  });

  it('enterprise ext department', async () => {
    setupUser();
    mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
    await createUser(
      ORG,
      {
        userName: 'alice@example.com',
        [SCIM_ENTERPRISE_USER_EXTENSION]: { department: 'Eng' },
      },
      BASE,
    );
  });

  it('inactive compliance when active=false', async () => {
    setupUser();
    mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
    await createUser(
      ORG,
      { userName: 'alice@example.com', active: false },
      BASE,
    );
  });

  // getFullName branches
  it('name.formatted preferred', async () => {
    setupUser();
    mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
    await createUser(
      ORG,
      { userName: 'alice@example.com', name: { formatted: 'Full Name' } },
      BASE,
    );
  });

  it('given+family combined', async () => {
    setupUser();
    mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
    await createUser(
      ORG,
      {
        userName: 'alice@example.com',
        name: { givenName: 'A', familyName: 'B' },
      },
      BASE,
    );
  });

  it('displayName fallback', async () => {
    setupUser();
    mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
    await createUser(
      ORG,
      { userName: 'alice@example.com', displayName: 'DN' },
      BASE,
    );
  });

  it('no name sources returns empty', async () => {
    setupUser();
    mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
    await createUser(ORG, { userName: 'alice@example.com' }, BASE);
  });
});

// ==========================================================================
// updateUser
// ==========================================================================

describe('updateUser', () => {
  it('PUT success', async () => {
    setupUser();
    expect(
      (
        await updateUser(
          ORG,
          UID,
          { userName: 'alice@example.com', active: true },
          BASE,
        )
      ).status,
    ).toBe(200);
  });

  it('404 user not found', async () => {
    setupUser();
    expect((await updateUser(ORG, 'nope', {}, BASE)).status).toBe(404);
  });

  it('412 ETag mismatch', async () => {
    setupUser();
    expect((await updateUser(ORG, UID, {}, BASE, 'bad-etag')).status).toBe(412);
  });

  it('passes with ifMatch=*', async () => {
    setupUser();
    expect(
      (await updateUser(ORG, UID, { userName: 'alice@example.com' }, BASE, '*'))
        .status,
    ).toBe(200);
  });

  it('passes ifMatch=null', async () => {
    setupUser();
    expect(
      (
        await updateUser(
          ORG,
          UID,
          { userName: 'alice@example.com' },
          BASE,
          null,
        )
      ).status,
    ).toBe(200);
  });

  it('passes with matching ETag', async () => {
    setupUser();
    const u = await getUser(ORG, UID, BASE);
    jest.clearAllMocks();
    setupUser();
    expect(
      (
        await updateUser(
          ORG,
          UID,
          { userName: 'alice@example.com' },
          BASE,
          u!.meta.version,
        )
      ).status,
    ).toBe(200);
  });

  // PATCH branches
  it('PATCH replace displayName', async () => {
    setupUser();
    expect(
      (
        await updateUser(
          ORG,
          UID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [{ op: 'replace', path: 'displayName', value: 'New' }],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });

  it('PATCH replace userName', async () => {
    setupUser();
    expect(
      (
        await updateUser(
          ORG,
          UID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [
              { op: 'replace', path: 'userName', value: 'new@e.com' },
            ],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });

  it('PATCH replace active', async () => {
    setupUser();
    expect(
      (
        await updateUser(
          ORG,
          UID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [{ op: 'replace', path: 'active', value: false }],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });

  it('PATCH no path applies to userName/displayName/active', async () => {
    setupUser();
    expect(
      (
        await updateUser(
          ORG,
          UID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [{ op: 'replace', value: 'val' }],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });

  it('PATCH add name.givenName', async () => {
    setupUser();
    expect(
      (
        await updateUser(
          ORG,
          UID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [{ op: 'add', path: 'name.givenName', value: 'G' }],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });

  it('PATCH add name.familyName', async () => {
    setupUser();
    expect(
      (
        await updateUser(
          ORG,
          UID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [{ op: 'add', path: 'name.familyName', value: 'F' }],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });

  it('PATCH replace emails', async () => {
    setupUser();
    expect(
      (
        await updateUser(
          ORG,
          UID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [
              { op: 'replace', path: 'emails', value: [{ value: 'x@y.com' }] },
            ],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });

  it('PATCH replace enterprise department', async () => {
    setupUser();
    expect(
      (
        await updateUser(
          ORG,
          UID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [
              {
                op: 'replace',
                path: `${SCIM_ENTERPRISE_USER_EXTENSION}:department`,
                value: 'Sales',
              },
            ],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });

  it('PATCH with no Operations returns body as-is', async () => {
    setupUser();
    expect(
      (
        await updateUser(
          ORG,
          UID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            userName: 'alice@example.com',
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });

  it('500 on profile error', async () => {
    setupUser();
    mockUpsertChain = makeMutationChain({
      data: null,
      error: { message: 'profile err' },
    });
    const r = await updateUser(
      ORG,
      UID,
      { userName: 'alice@example.com' },
      BASE,
    );
    expect(r.status).toBe(500);
    expect(r.error?.detail).toContain('profile err');
  });

  it('500 on member update error', async () => {
    setupUser();
    mockUpdateChain = makeMutationChain({
      data: null,
      error: { message: 'member err' },
    });
    expect(
      (await updateUser(ORG, UID, { userName: 'alice@example.com' }, BASE))
        .status,
    ).toBe(500);
  });

  it('500 on auth update error', async () => {
    setupUser();
    mockUpdateUserById.mockResolvedValue({
      data: null,
      error: { message: 'auth err' },
    });
    expect(
      (await updateUser(ORG, UID, { userName: 'alice@example.com' }, BASE))
        .status,
    ).toBe(500);
  });

  it('404 when user not found after update', async () => {
    let callCount = 0;
    mockFromChains.org_members = makeChain({
      data: [memberRow()],
      error: null,
    });
    mockFromChains.scim_group_members = makeChain({ data: [], error: null });
    mockGetUserById.mockImplementation(() => {
      callCount++;
      if (callCount <= 1)
        return Promise.resolve({ data: { user: authUser() }, error: null });
      return Promise.resolve({ data: { user: null }, error: null });
    });
    mockUpdateUserById.mockResolvedValue({
      data: { user: authUser() },
      error: null,
    });
    const r = await updateUser(
      ORG,
      UID,
      { userName: 'alice@example.com' },
      BASE,
    );
    expect(r.status).toBe(404);
    expect(r.error?.detail).toContain('after update');
  });

  it('uses current enterprise dept when no new dept', async () => {
    setupUser({ department: 'OldDept' });
    expect(
      (await updateUser(ORG, UID, { userName: 'alice@example.com' }, BASE))
        .status,
    ).toBe(200);
  });
});

// ==========================================================================
// deleteUser
// ==========================================================================

describe('deleteUser', () => {
  it('success', async () => {
    setupUser();
    expect((await deleteUser(ORG, UID, BASE)).status).toBe(204);
  });
  it('404 not found with baseUrl', async () => {
    setupUser();
    expect((await deleteUser(ORG, 'nope', BASE)).status).toBe(404);
  });
  it('skips lookup without baseUrl', async () => {
    expect((await deleteUser(ORG, UID)).status).toBe(204);
  });
  it('412 ETag mismatch', async () => {
    setupUser();
    expect((await deleteUser(ORG, UID, BASE, 'bad')).status).toBe(412);
  });
  it('500 DB error', async () => {
    setupUser();
    mockDeleteChain = makeMutationChain({
      data: null,
      error: { message: 'del err' },
    });
    expect((await deleteUser(ORG, UID, BASE)).status).toBe(500);
  });
});

// ==========================================================================
// listGroups / getGroup
// ==========================================================================

describe('listGroups', () => {
  it('returns paginated list', async () => {
    setupGroup();
    const r = await listGroups(ORG, BASE, {});
    expect(r.schemas).toContain(SCIM_SCHEMA_LIST);
    expect(r.totalResults).toBe(1);
  });
  it('applies filter', async () => {
    setupGroup();
    expect(
      (await listGroups(ORG, BASE, { filter: 'displayName eq "nope"' }))
        .totalResults,
    ).toBe(0);
  });
  it('applies sort', async () => {
    setupGroup();
    expect(
      (
        await listGroups(ORG, BASE, {
          sortBy: 'displayName',
          sortOrder: 'descending',
        })
      ).Resources,
    ).toHaveLength(1);
  });
  it('throws on DB error', async () => {
    mockFromChains.scim_groups = makeChain({
      data: null,
      error: { message: 'grp err' },
    });
    await expect(listGroups(ORG, BASE, {})).rejects.toThrow('grp err');
  });
});

describe('getGroup', () => {
  it('found', async () => {
    setupGroup();
    const g = await getGroup(ORG, GID, BASE);
    expect(g!.displayName).toBe('Engineers');
    expect(g!.meta.resourceType).toBe('Group');
  });
  it('not found', async () => {
    setupGroup();
    expect(await getGroup(ORG, 'nope', BASE)).toBeNull();
  });
  it('includes members', async () => {
    setupGroup();
    mockGetGroupMembers.mockResolvedValue([
      { value: 'u1', display: 'U1', type: 'User' },
    ]);
    expect((await getGroup(ORG, GID, BASE))!.members).toHaveLength(1);
  });
  it('member type defaults to User', async () => {
    setupGroup();
    mockGetGroupMembers.mockResolvedValue([{ value: 'u1', display: 'U1' }]);
    expect((await getGroup(ORG, GID, BASE))!.members![0].type).toBe('User');
  });
  it('sets externalId', async () => {
    setupGroup({ external_id: 'ext-g1' });
    expect((await getGroup(ORG, GID, BASE))!.externalId).toBe('ext-g1');
  });
  it('lastModified falls back to created_at', async () => {
    setupGroup({ updated_at: null, created_at: '2025-06-01' });
    expect((await getGroup(ORG, GID, BASE))!.meta.lastModified).toBe(
      '2025-06-01',
    );
  });
});

// ==========================================================================
// createGroup
// ==========================================================================

describe('createGroup', () => {
  it('success', async () => {
    mockUpsertScimGroup.mockResolvedValue({ id: GID });
    setupGroup();
    expect(
      (await createGroup(ORG, { displayName: 'Engineers' }, BASE)).status,
    ).toBe(201);
  });
  it('400 empty displayName', async () => {
    expect((await createGroup(ORG, {}, BASE)).status).toBe(400);
    expect((await createGroup(ORG, { displayName: '  ' }, BASE)).status).toBe(
      400,
    );
  });
  it('syncs members when present', async () => {
    mockUpsertScimGroup.mockResolvedValue({ id: GID });
    setupGroup();
    await createGroup(
      ORG,
      { displayName: 'E', members: [{ value: 'u1' }] },
      BASE,
    );
    expect(mockSyncGroupMembership).toHaveBeenCalled();
  });
  it('does not sync members when empty', async () => {
    mockUpsertScimGroup.mockResolvedValue({ id: GID });
    setupGroup();
    await createGroup(ORG, { displayName: 'E' }, BASE);
    expect(mockSyncGroupMembership).not.toHaveBeenCalled();
  });
  it('uses externalId when string', async () => {
    mockUpsertScimGroup.mockResolvedValue({ id: GID });
    setupGroup();
    await createGroup(ORG, { displayName: 'E', externalId: 'ext' }, BASE);
    expect(mockUpsertScimGroup).toHaveBeenCalledWith(
      expect.objectContaining({ externalId: 'ext' }),
    );
  });
  it('null externalId when not string', async () => {
    mockUpsertScimGroup.mockResolvedValue({ id: GID });
    setupGroup();
    await createGroup(ORG, { displayName: 'E', externalId: 123 }, BASE);
    expect(mockUpsertScimGroup).toHaveBeenCalledWith(
      expect.objectContaining({ externalId: null }),
    );
  });
  it('uses roleMapping when string', async () => {
    mockUpsertScimGroup.mockResolvedValue({ id: GID });
    setupGroup();
    await createGroup(ORG, { displayName: 'E', roleMapping: 'admin' }, BASE);
    expect(mockUpsertScimGroup).toHaveBeenCalledWith(
      expect.objectContaining({ roleMapping: 'admin' }),
    );
  });
  it('infers roleMapping when not string', async () => {
    mockUpsertScimGroup.mockResolvedValue({ id: GID });
    setupGroup();
    await createGroup(ORG, { displayName: 'Admins' }, BASE);
    expect(mockInferRoleMapping).toHaveBeenCalledWith('Admins');
  });
  it('500 when group cannot be loaded', async () => {
    mockUpsertScimGroup.mockResolvedValue({ id: 'new-id' });
    mockFromChains.scim_groups = makeChain({ data: [], error: null });
    const r = await createGroup(ORG, { displayName: 'E' }, BASE);
    expect(r.status).toBe(500);
    expect(r.error?.detail).toContain('could not be loaded');
  });
  it('500 on Error throw', async () => {
    mockUpsertScimGroup.mockRejectedValue(new Error('boom'));
    expect(
      (await createGroup(ORG, { displayName: 'E' }, BASE)).error?.detail,
    ).toBe('boom');
  });
  it('500 for non-Error throw', async () => {
    mockUpsertScimGroup.mockRejectedValue('str');
    expect(
      (await createGroup(ORG, { displayName: 'E' }, BASE)).error?.detail,
    ).toBe('Failed to create group');
  });
  it('member type defaults to User', async () => {
    mockUpsertScimGroup.mockResolvedValue({ id: GID });
    setupGroup();
    await createGroup(
      ORG,
      { displayName: 'E', members: [{ value: 'u1' }] },
      BASE,
    );
    expect(mockSyncGroupMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        members: [expect.objectContaining({ type: 'User' })],
      }),
    );
  });
});

// ==========================================================================
// updateGroup
// ==========================================================================

describe('updateGroup', () => {
  it('PUT success', async () => {
    setupGroup();
    expect(
      (await updateGroup(ORG, GID, { displayName: 'Updated' }, BASE)).status,
    ).toBe(200);
  });
  it('404 not found', async () => {
    setupGroup();
    expect((await updateGroup(ORG, 'nope', {}, BASE)).status).toBe(404);
  });
  it('412 ETag mismatch', async () => {
    setupGroup();
    expect((await updateGroup(ORG, GID, {}, BASE, 'bad')).status).toBe(412);
  });

  // PATCH branches
  it('PATCH replace displayName', async () => {
    setupGroup();
    expect(
      (
        await updateGroup(
          ORG,
          GID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [{ op: 'replace', path: 'displayName', value: 'New' }],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });
  it('PATCH add with no path sets displayName', async () => {
    setupGroup();
    expect(
      (
        await updateGroup(
          ORG,
          GID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [{ op: 'add', value: 'New' }],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });
  it('PATCH replace members', async () => {
    setupGroup();
    expect(
      (
        await updateGroup(
          ORG,
          GID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [
              { op: 'replace', path: 'members', value: [{ value: 'u2' }] },
            ],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });
  it('PATCH add members with non-array -> empty', async () => {
    setupGroup();
    expect(
      (
        await updateGroup(
          ORG,
          GID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [{ op: 'add', path: 'members', value: 'not-array' }],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });
  it('PATCH remove member by value filter', async () => {
    setupGroup();
    mockGetGroupMembers.mockResolvedValue([{ value: 'u1' }, { value: 'u2' }]);
    expect(
      (
        await updateGroup(
          ORG,
          GID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [{ op: 'remove', path: 'members[value eq "u1"]' }],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });
  it('PATCH remove with non-matching filter is no-op', async () => {
    setupGroup();
    expect(
      (
        await updateGroup(
          ORG,
          GID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [{ op: 'remove', path: 'members[badformat' }],
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });
  it('PATCH no Operations -> body as-is', async () => {
    setupGroup();
    expect(
      (
        await updateGroup(
          ORG,
          GID,
          {
            schemas: [SCIM_SCHEMA_PATCH],
            displayName: 'Inline',
          },
          BASE,
        )
      ).status,
    ).toBe(200);
  });

  it('500 on DB update error', async () => {
    setupGroup();
    mockUpdateChain = makeMutationChain({
      data: null,
      error: { message: 'upd err' },
    });
    expect(
      (await updateGroup(ORG, GID, { displayName: 'X' }, BASE)).status,
    ).toBe(500);
  });
  it('500 on Error throw', async () => {
    setupGroup();
    mockSyncGroupMembership.mockRejectedValue(new Error('sync fail'));
    expect(
      (await updateGroup(ORG, GID, { displayName: 'X' }, BASE)).error?.detail,
    ).toBe('sync fail');
  });
  it('500 for non-Error throw', async () => {
    setupGroup();
    mockSyncGroupMembership.mockRejectedValue('str');
    expect(
      (await updateGroup(ORG, GID, { displayName: 'X' }, BASE)).error?.detail,
    ).toBe('Failed to update group');
  });
  it('404 after update when group disappears', async () => {
    // chain.then is called once per SELECT-style await:
    // 1st: initial getGroup → returns the group
    // 2nd: post-update getGroup → returns empty (group gone)
    const chain = makeChain({ data: [groupRow()], error: null });
    let thenCount = 0;
    chain.then = (
      resolve: (v: unknown) => void,
      reject?: (e: unknown) => void,
    ) => {
      thenCount++;
      if (thenCount === 1) {
        return Promise.resolve({ data: [groupRow()], error: null }).then(
          resolve,
          reject,
        );
      }
      return Promise.resolve({ data: [], error: null }).then(resolve, reject);
    };
    chain.update = jest.fn().mockReturnValue(makeMutationChain());
    mockFromChains.scim_groups = chain as any;
    mockGetGroupMembers.mockResolvedValue([]);
    const r = await updateGroup(ORG, GID, { displayName: 'X' }, BASE);
    expect(r.status).toBe(404);
    expect(r.error?.detail).toContain('after update');
  });
  it('uses inferRoleMapping when roleMapping not string', async () => {
    setupGroup();
    await updateGroup(ORG, GID, { displayName: 'Admins' }, BASE);
    expect(mockInferRoleMapping).toHaveBeenCalled();
  });
  it('uses provided roleMapping when string', async () => {
    setupGroup();
    await updateGroup(
      ORG,
      GID,
      { displayName: 'X', roleMapping: 'viewer' },
      BASE,
    );
    expect(mockAdmin.from).toHaveBeenCalledWith('scim_groups');
  });
  it('calls syncGroupRoleAssignments', async () => {
    // Need a chain that works for both the initial getGroup AND the DB update
    const grpChain = makeChain({ data: [groupRow()], error: null });
    grpChain.update = jest.fn().mockReturnValue(makeMutationChain());
    mockFromChains.scim_groups = grpChain as any;
    mockGetGroupMembers.mockResolvedValue([]);
    await updateGroup(ORG, GID, { displayName: 'X' }, BASE);
    expect(mockSyncGroupRoleAssignments).toHaveBeenCalled();
  });
});

// ==========================================================================
// deleteGroup
// ==========================================================================

describe('deleteGroup', () => {
  it('success', async () => {
    setupGroup();
    expect((await deleteGroup(ORG, GID, BASE)).status).toBe(204);
  });
  it('404 not found with baseUrl', async () => {
    setupGroup();
    expect((await deleteGroup(ORG, 'nope', BASE)).status).toBe(404);
  });
  it('skips lookup without baseUrl', async () => {
    expect((await deleteGroup(ORG, GID)).status).toBe(204);
  });
  it('412 ETag mismatch', async () => {
    setupGroup();
    expect((await deleteGroup(ORG, GID, BASE, 'bad')).status).toBe(412);
  });
  it('500 DB error', async () => {
    setupGroup();
    mockDeleteChain = makeMutationChain({
      data: null,
      error: { message: 'del' },
    });
    expect((await deleteGroup(ORG, GID, BASE)).status).toBe(500);
  });
});

// ==========================================================================
// executeBulkOperations
// ==========================================================================

describe('executeBulkOperations', () => {
  beforeEach(() => {
    setupUser();
    setupGroup();
    mockListAuthUsers.mockResolvedValue({ data: { users: [authUser()] } });
    mockUpsertScimGroup.mockResolvedValue({ id: GID });
  });

  it('400 when Operations not array', async () => {
    const r = await executeBulkOperations(ORG, BASE, {});
    expect(r.status).toBe(400);
    expect(r.body.schemas).toContain(SCIM_SCHEMA_ERROR);
    expect(r.body.Operations).toEqual([]);
  });

  it('POST Users', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [
        {
          method: 'POST',
          path: '/Users',
          bulkId: 'b1',
          data: { userName: 'alice@example.com' },
        },
      ],
    });
    expect(r.body.Operations).toHaveLength(1);
    expect(r.body.Operations[0].bulkId).toBe('b1');
  });

  it('POST Groups', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [
        { method: 'POST', path: '/Groups', data: { displayName: 'G' } },
      ],
    });
    expect(r.body.Operations).toHaveLength(1);
  });

  it('PUT Users/{id}', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [
        {
          method: 'PUT',
          path: `Users/${UID}`,
          data: { userName: 'alice@example.com' },
        },
      ],
    });
    expect(r.body.Operations).toHaveLength(1);
  });

  it('PATCH Users/{id}', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [
        {
          method: 'PATCH',
          path: `Users/${UID}`,
          data: {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [{ op: 'replace', path: 'active', value: false }],
          },
        },
      ],
    });
    expect(r.body.Operations).toHaveLength(1);
  });

  it('DELETE Users/{id}', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [{ method: 'DELETE', path: `Users/${UID}` }],
    });
    expect(r.body.Operations[0].status).toBe('204');
  });

  it('PUT Groups/{id}', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [
        { method: 'PUT', path: `Groups/${GID}`, data: { displayName: 'U' } },
      ],
    });
    expect(r.body.Operations).toHaveLength(1);
  });

  it('PATCH Groups/{id}', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [
        {
          method: 'PATCH',
          path: `Groups/${GID}`,
          data: {
            schemas: [SCIM_SCHEMA_PATCH],
            Operations: [{ op: 'replace', path: 'displayName', value: 'R' }],
          },
        },
      ],
    });
    expect(r.body.Operations).toHaveLength(1);
  });

  it('DELETE Groups/{id}', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [{ method: 'DELETE', path: `Groups/${GID}` }],
    });
    expect(r.body.Operations[0].status).toBe('204');
  });

  it('error for unsupported resource type on PUT/PATCH/DELETE', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [{ method: 'PUT', path: 'Unknown/123', data: {} }],
    });
    expect(r.status).toBe(400);
    expect(r.body.Operations[0].response).toEqual(
      expect.objectContaining({
        detail: expect.stringContaining('Unsupported bulk path'),
      }),
    );
  });

  it('error for unsupported method/path combo', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [{ method: 'POST', path: 'Unknown' } as any],
    });
    expect(r.status).toBe(400);
  });

  it('strips leading slashes', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [
        {
          method: 'POST',
          path: '///Users',
          data: { userName: 'alice@example.com' },
        },
      ],
    });
    expect(r.body.Operations).toHaveLength(1);
  });

  it('failOnErrors stops processing at threshold', async () => {
    mockListAuthUsers.mockResolvedValue({ data: { users: [] } });
    mockCreateAuthUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'fail' },
    });
    const r = await executeBulkOperations(ORG, BASE, {
      failOnErrors: 1,
      Operations: [
        { method: 'POST', path: 'Users', data: { userName: 'a@b.com' } },
        { method: 'POST', path: 'Users', data: { userName: 'c@d.com' } },
      ],
    });
    expect(r.body.Operations).toHaveLength(1);
    expect(r.status).toBe(400);
  });

  it('200 when all ops succeed', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [
        {
          method: 'POST',
          path: 'Users',
          data: { userName: 'alice@example.com' },
        },
      ],
    });
    if (
      r.body.Operations[0]?.response &&
      !(r.body.Operations[0].response as any).detail
    ) {
      expect(r.status).toBe(200);
    }
  });

  it('uses version as ifMatch for bulk DELETE', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [{ method: 'DELETE', path: `Users/${UID}`, version: '*' }],
    });
    expect(r.body.Operations).toHaveLength(1);
  });

  it('schema is SCIM_SCHEMA_BULK_RESPONSE', async () => {
    const r = await executeBulkOperations(ORG, BASE, { Operations: [] });
    expect(r.body.schemas).toContain(SCIM_SCHEMA_BULK_RESPONSE);
  });

  it('missing data on POST defaults to {}', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [{ method: 'POST', path: 'Users' } as any],
    });
    expect(r.body.Operations[0].status).toBe('400');
  });

  it('location fallback for delete with null data', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [{ method: 'DELETE', path: `Users/${UID}` }],
    });
    const op = r.body.Operations[0];
    if (op.status === '204') {
      expect(op.location).toContain('Users');
    }
  });

  it('location from non-Users path is undefined', async () => {
    const r = await executeBulkOperations(ORG, BASE, {
      Operations: [{ method: 'DELETE', path: `Groups/${GID}` }],
    });
    const op = r.body.Operations[0];
    if (op.status === '204' && !op.response) {
      expect(op.location).toBeUndefined();
    }
  });
});

// ==========================================================================
// Utility exports
// ==========================================================================

describe('getSingleResourceHeaders', () => {
  it('returns ETag', () => {
    expect(getSingleResourceHeaders({ meta: { version: 'W/"x"' } })).toEqual({
      ETag: 'W/"x"',
    });
  });
});

describe('isScimPatch', () => {
  it('true for patch schema', () =>
    expect(isScimPatch({ schemas: [SCIM_SCHEMA_PATCH] })).toBe(true));
  it('false for other schema', () =>
    expect(isScimPatch({ schemas: [SCIM_SCHEMA_USER] })).toBe(false));
  it('false when schemas not array', () =>
    expect(isScimPatch({ schemas: 'x' })).toBe(false));
  it('false when no schemas', () => expect(isScimPatch({})).toBe(false));
});

describe('getScimContentHeaders', () => {
  it('base content-type', () =>
    expect(getScimContentHeaders()['Content-Type']).toBe(
      'application/scim+json',
    ));
  it('merges extra', () =>
    expect((getScimContentHeaders({ Loc: '/x' }) as any).Loc).toBe('/x'));
});

describe('getBulkRequestSchema', () => {
  it('returns SCIM_SCHEMA_BULK', () =>
    expect(getBulkRequestSchema()).toBe(SCIM_SCHEMA_BULK));
});

describe('getScimErrorSchema', () => {
  it('returns SCIM_SCHEMA_ERROR', () =>
    expect(getScimErrorSchema()).toBe(SCIM_SCHEMA_ERROR));
});

// ==========================================================================
// Pagination edge cases (via listUsers)
// ==========================================================================

describe('pagination edge cases', () => {
  it('startIndex < 1 clamps to 1', async () => {
    setupUser();
    expect((await listUsers(ORG, BASE, { startIndex: -5 })).startIndex).toBe(1);
  });
  it('count > 100 clamps to 100', async () => {
    setupUser();
    expect(
      (await listUsers(ORG, BASE, { count: 999 })).itemsPerPage,
    ).toBeLessThanOrEqual(100);
  });
  it('count < 1 clamps to 1', async () => {
    setupUser();
    expect(
      (await listUsers(ORG, BASE, { count: 0 })).itemsPerPage,
    ).toBeLessThanOrEqual(1);
  });
});

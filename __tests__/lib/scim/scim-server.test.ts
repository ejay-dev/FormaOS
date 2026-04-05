/**
 * Tests for SCIM Server - Pure filter/sort functions + async handlers
 */

jest.mock('@/lib/supabase/admin', () => {
  const c = {
    from: jest.fn(() => {
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
        'textSearch',
      ].forEach((m) => {
        b[m] = jest.fn(() => b);
      });
      b.then = (resolve: any) => resolve({ data: null, error: null });
      return b;
    }),
    auth: {
      admin: {
        getUserById: jest.fn().mockResolvedValue({ data: { user: null } }),
        listUsers: jest.fn().mockResolvedValue({ data: { users: [] } }),
        createUser: jest
          .fn()
          .mockResolvedValue({ data: { user: null }, error: null }),
        updateUserById: jest
          .fn()
          .mockResolvedValue({ data: { user: {} }, error: null }),
      },
    },
  };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});
function getClient() {
  return require('@/lib/supabase/admin').__client;
}

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
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: any) => resolve(result);
  return b;
}
jest.mock('@/lib/scim/scim-groups', () => ({
  getGroupMembers: jest.fn().mockResolvedValue([]),
  inferRoleMapping: jest.fn(),
  syncGroupMembership: jest.fn(),
  syncGroupRoleAssignments: jest.fn(),
  upsertScimGroup: jest.fn(),
}));
jest.mock('@/lib/scim/scim-auth', () => ({
  scimError: jest.fn((status: number, detail: string) => ({ status, detail })),
}));

import {
  parseScimFilterExpression,
  applyScimFilter,
  applyScimSort,
  deleteUser,
  deleteGroup,
  createUser,
  createGroup,
  executeBulkOperations,
  getSingleResourceHeaders,
  isScimPatch,
  getScimContentHeaders,
  getBulkRequestSchema,
  getScimErrorSchema,
  listUsers,
  getUser,
  listGroups,
  getGroup,
} from '@/lib/scim/scim-server';

describe('parseScimFilterExpression', () => {
  it('returns empty array for null/undefined/empty', () => {
    expect(parseScimFilterExpression(null)).toEqual([]);
    expect(parseScimFilterExpression(undefined)).toEqual([]);
    expect(parseScimFilterExpression('')).toEqual([]);
    expect(parseScimFilterExpression('  ')).toEqual([]);
  });

  it('parses eq operator', () => {
    const result = parseScimFilterExpression('userName eq "john@test.com"');
    expect(result).toEqual([
      { attribute: 'userName', operator: 'eq', value: 'john@test.com' },
    ]);
  });

  it('parses co operator', () => {
    const result = parseScimFilterExpression('displayName co "John"');
    expect(result).toEqual([
      { attribute: 'displayName', operator: 'co', value: 'John' },
    ]);
  });

  it('parses sw operator', () => {
    const result = parseScimFilterExpression('userName sw "admin"');
    expect(result).toEqual([
      { attribute: 'userName', operator: 'sw', value: 'admin' },
    ]);
  });

  it('parses ew operator', () => {
    const result = parseScimFilterExpression('userName ew "@example.com"');
    expect(result).toEqual([
      { attribute: 'userName', operator: 'ew', value: '@example.com' },
    ]);
  });

  it('parses pr (presence) operator', () => {
    const result = parseScimFilterExpression('emails pr');
    expect(result).toEqual([{ attribute: 'emails', operator: 'pr' }]);
  });

  it('parses ne operator', () => {
    const result = parseScimFilterExpression('active ne "false"');
    expect(result).toEqual([
      { attribute: 'active', operator: 'ne', value: 'false' },
    ]);
  });

  it('parses gt/lt/ge/le operators', () => {
    expect(
      parseScimFilterExpression('meta.lastModified gt "2024-01-01"')?.[0]
        ?.operator,
    ).toBe('gt');
    expect(
      parseScimFilterExpression('meta.lastModified lt "2024-01-01"')?.[0]
        ?.operator,
    ).toBe('lt');
    expect(
      parseScimFilterExpression('meta.lastModified ge "2024-01-01"')?.[0]
        ?.operator,
    ).toBe('ge');
    expect(
      parseScimFilterExpression('meta.lastModified le "2024-01-01"')?.[0]
        ?.operator,
    ).toBe('le');
  });

  it('parses compound filter with AND', () => {
    const result = parseScimFilterExpression(
      'userName eq "john" and active eq "true"',
    );
    expect(result).toHaveLength(2);
    expect(result[0].attribute).toBe('userName');
    expect(result[1].attribute).toBe('active');
  });

  it('throws on unsupported clause', () => {
    expect(() => parseScimFilterExpression('bad filter clause')).toThrow(
      'Unsupported SCIM filter clause',
    );
  });
});

describe('applyScimFilter', () => {
  const records = [
    {
      userName: 'alice@test.com',
      displayName: 'Alice Smith',
      active: true,
      emails: [{ value: 'alice@test.com' }],
    },
    {
      userName: 'bob@test.com',
      displayName: 'Bob Jones',
      active: false,
      emails: [{ value: 'bob@test.com' }],
    },
    {
      userName: 'charlie@test.com',
      displayName: 'Charlie Brown',
      active: true,
      emails: [],
    },
  ];

  it('returns all records with no filter', () => {
    expect(applyScimFilter(records)).toEqual(records);
    expect(applyScimFilter(records, null)).toEqual(records);
    expect(applyScimFilter(records, '')).toEqual(records);
  });

  it('filters by eq on userName', () => {
    const result = applyScimFilter(records, 'userName eq "alice@test.com"');
    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe('alice@test.com');
  });

  it('filters by co (contains)', () => {
    const result = applyScimFilter(records, 'displayName co "Jones"');
    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('Bob Jones');
  });

  it('filters by sw (starts with)', () => {
    const result = applyScimFilter(records, 'displayName sw "charlie"');
    expect(result).toHaveLength(1);
  });

  it('filters by ew (ends with)', () => {
    const result = applyScimFilter(records, 'userName ew "@test.com"');
    expect(result).toHaveLength(3);
  });

  it('filters by ne (not equal)', () => {
    const result = applyScimFilter(records, 'userName ne "alice@test.com"');
    expect(result).toHaveLength(2);
  });

  it('filters by active boolean eq', () => {
    const result = applyScimFilter(records, 'active eq "true"');
    expect(result).toHaveLength(2);
  });

  it('filters by pr (presence) for array field', () => {
    const result = applyScimFilter(records, 'emails pr');
    // alice and bob have non-empty emails, charlie has empty array
    expect(result).toHaveLength(2);
  });

  it('applies compound AND filter', () => {
    const result = applyScimFilter(
      records,
      'active eq "true" and displayName co "Alice"',
    );
    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe('alice@test.com');
  });
});

describe('applyScimSort', () => {
  const records = [
    { userName: 'charlie@test.com', displayName: 'Charlie' },
    { userName: 'alice@test.com', displayName: 'Alice' },
    { userName: 'bob@test.com', displayName: 'Bob' },
  ];

  it('returns records unchanged when no sortBy', () => {
    expect(applyScimSort(records)).toEqual(records);
    expect(applyScimSort(records, null)).toEqual(records);
  });

  it('sorts ascending by userName', () => {
    const result = applyScimSort(records, 'userName');
    expect(result[0].userName).toBe('alice@test.com');
    expect(result[2].userName).toBe('charlie@test.com');
  });

  it('sorts descending by displayName', () => {
    const result = applyScimSort(records, 'displayName', 'descending');
    expect(result[0].displayName).toBe('Charlie');
    expect(result[2].displayName).toBe('Alice');
  });

  it('defaults to ascending order', () => {
    const result = applyScimSort(records, 'userName', 'ascending');
    expect(result[0].userName).toBe('alice@test.com');
  });

  it('does not mutate original array', () => {
    const original = [...records];
    applyScimSort(records, 'userName');
    expect(records).toEqual(original);
  });
});

// ── CRUD operations ──
describe('deleteUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes user by org + userId', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await deleteUser('org1', 'u1');
    expect(result.status).toBe(204);
  });

  it('returns 500 on DB error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    const result = await deleteUser('org1', 'u1');
    expect(result.status).toBe(500);
  });
});

describe('deleteGroup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes group by org + groupId', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await deleteGroup('org1', 'g1');
    expect(result.status).toBe(204);
  });

  it('returns 500 on DB error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    const result = await deleteGroup('org1', 'g1');
    expect(result.status).toBe(500);
  });
});

describe('createUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when no email provided', async () => {
    const result = await createUser('org1', {}, 'https://example.com');
    expect(result.status).toBe(400);
  });

  it('returns 500 when auth.admin.createUser fails', async () => {
    getClient().auth.admin.listUsers.mockResolvedValue({ data: { users: [] } });
    getClient().auth.admin.createUser.mockResolvedValue({
      error: { message: 'fail' },
      data: { user: null },
    });
    const result = await createUser(
      'org1',
      { userName: 'new@test.com' },
      'https://example.com',
    );
    expect(result.status).toBe(500);
  });
});

describe('createGroup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when no displayName', async () => {
    const result = await createGroup('org1', {}, 'https://example.com');
    expect(result.status).toBe(400);
  });

  it('returns 400 for empty displayName', async () => {
    const result = await createGroup(
      'org1',
      { displayName: '  ' },
      'https://example.com',
    );
    expect(result.status).toBe(400);
  });
});

// ── Helper exports ──
describe('getSingleResourceHeaders', () => {
  it('returns ETag header', () => {
    expect(getSingleResourceHeaders({ meta: { version: 'W/"abc"' } })).toEqual({
      ETag: 'W/"abc"',
    });
  });
});

describe('isScimPatch', () => {
  it('returns true for SCIM Patch schema', () => {
    expect(
      isScimPatch({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
      }),
    ).toBe(true);
  });

  it('returns false for other schemas', () => {
    expect(isScimPatch({ schemas: ['other'] })).toBe(false);
    expect(isScimPatch({})).toBe(false);
  });
});

describe('getScimContentHeaders', () => {
  it('returns content-type header', () => {
    expect(getScimContentHeaders()['Content-Type']).toBe(
      'application/scim+json',
    );
  });

  it('merges extra headers', () => {
    expect(getScimContentHeaders({ 'X-Custom': 'v' })['X-Custom']).toBe('v');
  });
});

describe('getBulkRequestSchema', () => {
  it('returns bulk request schema URI', () => {
    expect(getBulkRequestSchema()).toContain('BulkRequest');
  });
});

describe('getScimErrorSchema', () => {
  it('returns error schema URI', () => {
    expect(getScimErrorSchema()).toContain('Error');
  });
});

describe('executeBulkOperations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when Operations is not an array', async () => {
    const result = await executeBulkOperations('org1', 'https://e.com', {});
    expect(result.status).toBe(400);
  });

  it('handles unsupported method/path combo', async () => {
    const result = await executeBulkOperations('org1', 'https://e.com', {
      Operations: [{ method: 'GET', path: '/Users' }],
    });
    expect(result.body.Operations).toHaveLength(1);
    expect(result.body.Operations[0].status).toBe('400');
  });
});

describe('listUsers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated empty list', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await listUsers('org1', 'https://e.com', {});
    expect(result).toHaveProperty('totalResults', 0);
    expect(result).toHaveProperty('Resources');
  });
});

describe('getUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when user not found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await getUser('org1', 'missing', 'https://e.com');
    expect(result).toBeNull();
  });
});

describe('listGroups', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated empty list', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await listGroups('org1', 'https://e.com', {});
    expect(result).toHaveProperty('totalResults', 0);
  });
});

describe('getGroup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when group not found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await getGroup('org1', 'missing', 'https://e.com');
    expect(result).toBeNull();
  });
});

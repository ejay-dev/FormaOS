/**
 * Branch-coverage supplement for lib/scim/scim-server.ts
 * Targets exported pure functions: parseScimFilterExpression, applyScimFilter,
 * applyScimSort, isScimPatch, getScimContentHeaders, getSingleResourceHeaders,
 * getBulkRequestSchema, getScimErrorSchema
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({ from: jest.fn() })),
}));
jest.mock('@/lib/scim/scim-groups', () => ({
  getGroupMembers: jest.fn(),
  inferRoleMapping: jest.fn(),
  syncGroupMembership: jest.fn(),
  syncGroupRoleAssignments: jest.fn(),
  upsertScimGroup: jest.fn(),
}));
jest.mock('@/lib/scim/scim-auth', () => ({
  scimError: jest.fn((status: number, msg: string) => ({
    status,
    detail: msg,
  })),
}));

import {
  parseScimFilterExpression,
  applyScimFilter,
  applyScimSort,
  isScimPatch,
  getScimContentHeaders,
  getSingleResourceHeaders,
  getBulkRequestSchema,
  getScimErrorSchema,
} from '@/lib/scim/scim-server';

describe('parseScimFilterExpression', () => {
  it('returns empty array for null/undefined', () => {
    expect(parseScimFilterExpression(null)).toEqual([]);
    expect(parseScimFilterExpression(undefined)).toEqual([]);
  });

  it('returns empty array for blank string', () => {
    expect(parseScimFilterExpression('')).toEqual([]);
    expect(parseScimFilterExpression('   ')).toEqual([]);
  });

  it('parses simple eq filter', () => {
    const nodes = parseScimFilterExpression('userName eq "john"');
    expect(nodes).toEqual([
      { attribute: 'userName', operator: 'eq', value: 'john' },
    ]);
  });

  it('parses ne filter', () => {
    const nodes = parseScimFilterExpression('active ne "true"');
    expect(nodes).toEqual([
      { attribute: 'active', operator: 'ne', value: 'true' },
    ]);
  });

  it('parses co (contains) filter', () => {
    const nodes = parseScimFilterExpression('userName co "test"');
    expect(nodes).toEqual([
      { attribute: 'userName', operator: 'co', value: 'test' },
    ]);
  });

  it('parses sw (startsWith) filter', () => {
    const nodes = parseScimFilterExpression('emails.value sw "admin"');
    expect(nodes).toEqual([
      { attribute: 'emails.value', operator: 'sw', value: 'admin' },
    ]);
  });

  it('parses ew (endsWith) filter', () => {
    const nodes = parseScimFilterExpression('userName ew "com"');
    expect(nodes).toEqual([
      { attribute: 'userName', operator: 'ew', value: 'com' },
    ]);
  });

  it('parses gt/lt/ge/le filters', () => {
    expect(
      parseScimFilterExpression('meta.lastModified gt "2024-01-01"'),
    ).toEqual([
      { attribute: 'meta.lastModified', operator: 'gt', value: '2024-01-01' },
    ]);
    expect(
      parseScimFilterExpression('meta.lastModified lt "2024-12-31"'),
    ).toEqual([
      { attribute: 'meta.lastModified', operator: 'lt', value: '2024-12-31' },
    ]);
    expect(
      parseScimFilterExpression('meta.lastModified ge "2024-01-01"'),
    ).toEqual([
      { attribute: 'meta.lastModified', operator: 'ge', value: '2024-01-01' },
    ]);
    expect(
      parseScimFilterExpression('meta.lastModified le "2024-12-31"'),
    ).toEqual([
      { attribute: 'meta.lastModified', operator: 'le', value: '2024-12-31' },
    ]);
  });

  it('parses pr (presence) filter', () => {
    const nodes = parseScimFilterExpression('displayName pr');
    expect(nodes).toEqual([{ attribute: 'displayName', operator: 'pr' }]);
  });

  it('parses compound "and" filter', () => {
    const nodes = parseScimFilterExpression(
      'userName eq "john" and active eq "true"',
    );
    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toEqual({
      attribute: 'userName',
      operator: 'eq',
      value: 'john',
    });
    expect(nodes[1]).toEqual({
      attribute: 'active',
      operator: 'eq',
      value: 'true',
    });
  });

  it('throws on unsupported filter clause', () => {
    expect(() => parseScimFilterExpression('invalid clause format')).toThrow(
      /Unsupported SCIM filter/,
    );
  });

  it('parses filter without quotes', () => {
    const nodes = parseScimFilterExpression('active eq true');
    expect(nodes).toEqual([
      { attribute: 'active', operator: 'eq', value: 'true' },
    ]);
  });
});

describe('applyScimFilter', () => {
  const records = [
    { userName: 'alice@test.com', displayName: 'Alice Smith', active: true },
    { userName: 'bob@test.com', displayName: 'Bob Jones', active: false },
    {
      userName: 'charlie@test.com',
      displayName: 'Charlie Brown',
      active: true,
    },
  ];

  it('returns all records when no filter', () => {
    expect(applyScimFilter(records, null)).toEqual(records);
    expect(applyScimFilter(records, undefined)).toEqual(records);
    expect(applyScimFilter(records, '')).toEqual(records);
  });

  it('filters by eq', () => {
    const result = applyScimFilter(records, 'userName eq "alice@test.com"');
    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe('alice@test.com');
  });

  it('filters by ne', () => {
    const result = applyScimFilter(records, 'userName ne "alice@test.com"');
    expect(result).toHaveLength(2);
  });

  it('filters by co (contains)', () => {
    const result = applyScimFilter(records, 'displayName co "Jones"');
    expect(result).toHaveLength(1);
  });

  it('filters by sw (startsWith)', () => {
    const result = applyScimFilter(records, 'displayName sw "Alice"');
    expect(result).toHaveLength(1);
  });

  it('filters by ew (endsWith)', () => {
    const result = applyScimFilter(records, 'userName ew "test.com"');
    expect(result).toHaveLength(3);
  });

  it('filters by pr (presence)', () => {
    const result = applyScimFilter(records, 'displayName pr');
    expect(result).toHaveLength(3);
  });

  it('filters boolean values with eq', () => {
    const result = applyScimFilter(records, 'active eq "true"');
    expect(result).toHaveLength(2);
  });

  it('filters boolean values with ne', () => {
    const result = applyScimFilter(records, 'active ne "true"');
    expect(result).toHaveLength(1);
  });

  it('handles compound and filter', () => {
    const result = applyScimFilter(
      records,
      'active eq "true" and displayName co "Alice"',
    );
    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe('alice@test.com');
  });

  it('resolves nested attribute emails.value', () => {
    const recordsWithEmails = [
      { userName: 'a', emails: [{ value: 'a@test.com' }] },
      { userName: 'b', emails: [{ value: 'b@test.com' }] },
    ];
    const result = applyScimFilter(recordsWithEmails, 'emails.value co "a@"');
    expect(result).toHaveLength(1);
  });

  it('resolves name.givenName', () => {
    const recordsWithName = [
      { userName: 'a', name: { givenName: 'Alice', familyName: 'Smith' } },
      { userName: 'b', name: { givenName: 'Bob', familyName: 'Jones' } },
    ];
    const result = applyScimFilter(
      recordsWithName,
      'name.givenName eq "Alice"',
    );
    expect(result).toHaveLength(1);
  });

  it('resolves name.familyName', () => {
    const recordsWithName = [
      { userName: 'a', name: { givenName: 'Alice', familyName: 'Smith' } },
      { userName: 'b', name: { givenName: 'Bob', familyName: 'Jones' } },
    ];
    const result = applyScimFilter(
      recordsWithName,
      'name.familyName eq "jones"',
    );
    expect(result).toHaveLength(1);
  });

  it('handles numeric comparison (gt/lt)', () => {
    const numRecords = [
      { userName: 'a', age: 25 },
      { userName: 'b', age: 35 },
      { userName: 'c', age: 45 },
    ];
    expect(applyScimFilter(numRecords, 'age gt "30"')).toHaveLength(2);
    expect(applyScimFilter(numRecords, 'age lt "30"')).toHaveLength(1);
    expect(applyScimFilter(numRecords, 'age ge "35"')).toHaveLength(2);
    expect(applyScimFilter(numRecords, 'age le "35"')).toHaveLength(2);
    expect(applyScimFilter(numRecords, 'age eq "35"')).toHaveLength(1);
    expect(applyScimFilter(numRecords, 'age ne "35"')).toHaveLength(2);
  });

  it('handles NaN numeric comparison', () => {
    const numRecords = [{ userName: 'a', age: 25 }];
    expect(applyScimFilter(numRecords, 'age gt "notanumber"')).toHaveLength(0);
  });

  it('pr returns false for null/undefined/empty-string', () => {
    const testRecords = [
      { userName: 'a', displayName: null },
      { userName: 'b', displayName: undefined },
      { userName: 'c', displayName: '' },
      { userName: 'd', displayName: 'Valid' },
    ];
    const result = applyScimFilter(testRecords, 'displayName pr');
    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe('d');
  });

  it('pr returns true for non-empty arrays', () => {
    const testRecords = [
      { userName: 'a', emails: [{ value: 'x@y.com' }] },
      { userName: 'b', emails: [] },
    ];
    const result = applyScimFilter(testRecords, 'emails pr');
    expect(result).toHaveLength(1);
  });

  it('handles unknown attribute returning undefined', () => {
    const result = applyScimFilter(records, 'nonExistentField eq "value"');
    expect(result).toHaveLength(0);
  });

  it('string gt/lt/ge/le comparisons', () => {
    const strRecords = [
      { userName: 'apple' },
      { userName: 'banana' },
      { userName: 'cherry' },
    ];
    expect(applyScimFilter(strRecords, 'userName gt "banana"')).toHaveLength(1);
    expect(applyScimFilter(strRecords, 'userName lt "banana"')).toHaveLength(1);
    expect(applyScimFilter(strRecords, 'userName ge "banana"')).toHaveLength(2);
    expect(applyScimFilter(strRecords, 'userName le "banana"')).toHaveLength(2);
  });

  it('handles unsupported operator falling through to false', () => {
    // Boolean with non-eq/ne operator
    const boolRecords = [{ userName: 'a', active: true }];
    const result = applyScimFilter(boolRecords, 'active gt "true"');
    expect(result).toHaveLength(0);
  });

  it('handles numeric with unsupported operator', () => {
    const numRecords = [{ userName: 'a', count: 5 }];
    // co/sw/ew etc. won't match in the numeric path - fallthrough
    const result = applyScimFilter(numRecords, 'count co "5"');
    expect(result).toHaveLength(0);
  });

  it('resolves meta.lastModified', () => {
    const metaRecords = [
      { userName: 'a', meta: { lastModified: '2024-01-01' } },
      { userName: 'b', meta: { lastModified: '2024-06-01' } },
    ];
    const result = applyScimFilter(
      metaRecords,
      'meta.lastModified gt "2024-03-01"',
    );
    expect(result).toHaveLength(1);
  });
});

describe('applyScimSort', () => {
  const records = [
    { userName: 'charlie' },
    { userName: 'alice' },
    { userName: 'bob' },
  ];

  it('returns unsorted when no sortBy', () => {
    expect(applyScimSort(records, null)).toEqual(records);
    expect(applyScimSort(records, undefined)).toEqual(records);
  });

  it('sorts ascending by default', () => {
    const result = applyScimSort(records, 'userName');
    expect(result.map((r) => r.userName)).toEqual(['alice', 'bob', 'charlie']);
  });

  it('sorts ascending explicitly', () => {
    const result = applyScimSort(records, 'userName', 'ascending');
    expect(result.map((r) => r.userName)).toEqual(['alice', 'bob', 'charlie']);
  });

  it('sorts descending', () => {
    const result = applyScimSort(records, 'userName', 'descending');
    expect(result.map((r) => r.userName)).toEqual(['charlie', 'bob', 'alice']);
  });

  it('does not mutate original array', () => {
    const original = [...records];
    applyScimSort(records, 'userName');
    expect(records).toEqual(original);
  });
});

describe('utility functions', () => {
  it('isScimPatch returns true for patch schema', () => {
    expect(
      isScimPatch({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
      }),
    ).toBe(true);
  });

  it('isScimPatch returns false for non-patch', () => {
    expect(
      isScimPatch({ schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'] }),
    ).toBe(false);
    expect(isScimPatch({ schemas: [] })).toBe(false);
    expect(isScimPatch({})).toBe(false);
  });

  it('getScimContentHeaders returns correct content-type', () => {
    const headers = getScimContentHeaders();
    expect(headers['Content-Type']).toBe('application/scim+json');
  });

  it('getScimContentHeaders merges extra headers', () => {
    const headers = getScimContentHeaders({ 'X-Custom': 'value' });
    expect(headers['Content-Type']).toBe('application/scim+json');
    expect(headers['X-Custom']).toBe('value');
  });

  it('getSingleResourceHeaders returns ETag', () => {
    const headers = getSingleResourceHeaders({ meta: { version: 'W/"abc"' } });
    expect(headers.ETag).toBe('W/"abc"');
  });

  it('getBulkRequestSchema returns schema string', () => {
    expect(getBulkRequestSchema()).toBeDefined();
    expect(typeof getBulkRequestSchema()).toBe('string');
  });

  it('getScimErrorSchema returns schema string', () => {
    expect(getScimErrorSchema()).toBeDefined();
    expect(typeof getScimErrorSchema()).toBe('string');
  });
});

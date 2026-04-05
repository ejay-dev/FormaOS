import {
  parseScimFilterExpression,
  applyScimFilter,
  applyScimSort,
} from '@/lib/scim/scim-utils';

describe('parseScimFilterExpression', () => {
  it('returns empty array for null/undefined/empty', () => {
    expect(parseScimFilterExpression(null)).toEqual([]);
    expect(parseScimFilterExpression(undefined)).toEqual([]);
    expect(parseScimFilterExpression('')).toEqual([]);
    expect(parseScimFilterExpression('   ')).toEqual([]);
  });

  it('parses eq operator', () => {
    const result = parseScimFilterExpression('userName eq "john"');
    expect(result).toEqual([
      { attribute: 'userName', operator: 'eq', value: 'john' },
    ]);
  });

  it('parses ne operator', () => {
    const result = parseScimFilterExpression('active ne "true"');
    expect(result).toEqual([
      { attribute: 'active', operator: 'ne', value: 'true' },
    ]);
  });

  it('parses co operator', () => {
    const result = parseScimFilterExpression('displayName co "smith"');
    expect(result).toEqual([
      { attribute: 'displayName', operator: 'co', value: 'smith' },
    ]);
  });

  it('parses sw operator', () => {
    const result = parseScimFilterExpression('userName sw "j"');
    expect(result).toEqual([
      { attribute: 'userName', operator: 'sw', value: 'j' },
    ]);
  });

  it('parses ew operator', () => {
    const result = parseScimFilterExpression('emails.value ew "example.com"');
    expect(result).toEqual([
      { attribute: 'emails.value', operator: 'ew', value: 'example.com' },
    ]);
  });

  it('parses pr (presence) operator', () => {
    const result = parseScimFilterExpression('displayName pr');
    expect(result).toEqual([{ attribute: 'displayName', operator: 'pr' }]);
  });

  it('parses comparison operators gt, lt, ge, le', () => {
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
      parseScimFilterExpression('meta.lastModified ge "2024-06-01"'),
    ).toEqual([
      { attribute: 'meta.lastModified', operator: 'ge', value: '2024-06-01' },
    ]);
    expect(
      parseScimFilterExpression('meta.lastModified le "2024-06-30"'),
    ).toEqual([
      { attribute: 'meta.lastModified', operator: 'le', value: '2024-06-30' },
    ]);
  });

  it('parses compound filter with "and"', () => {
    const result = parseScimFilterExpression(
      'userName eq "john" and active eq "true"',
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      attribute: 'userName',
      operator: 'eq',
      value: 'john',
    });
    expect(result[1]).toEqual({
      attribute: 'active',
      operator: 'eq',
      value: 'true',
    });
  });

  it('throws on unsupported filter clause', () => {
    expect(() => parseScimFilterExpression('badfilter')).toThrow(
      'Unsupported SCIM filter clause',
    );
  });
});

describe('applyScimFilter', () => {
  const records = [
    {
      userName: 'alice',
      displayName: 'Alice Smith',
      active: true,
      emails: [{ value: 'alice@example.com' }],
    },
    {
      userName: 'bob',
      displayName: 'Bob Jones',
      active: false,
      emails: [{ value: 'bob@test.com' }],
    },
    {
      userName: 'charlie',
      displayName: 'Charlie Brown',
      active: true,
      emails: [{ value: 'charlie@example.com' }],
    },
  ];

  it('returns all records when filter is null/empty', () => {
    expect(applyScimFilter(records, null)).toEqual(records);
    expect(applyScimFilter(records, '')).toEqual(records);
  });

  it('filters by eq on string', () => {
    const result = applyScimFilter(records, 'userName eq "alice"');
    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe('alice');
  });

  it('filters by eq on boolean', () => {
    const result = applyScimFilter(records, 'active eq "true"');
    expect(result).toHaveLength(2);
  });

  it('filters by ne', () => {
    const result = applyScimFilter(records, 'active ne "true"');
    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe('bob');
  });

  it('filters by co (contains)', () => {
    const result = applyScimFilter(records, 'displayName co "smith"');
    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe('alice');
  });

  it('filters by sw (starts with)', () => {
    const result = applyScimFilter(records, 'displayName sw "bob"');
    expect(result).toHaveLength(1);
  });

  it('filters by ew (ends with)', () => {
    const result = applyScimFilter(records, 'displayName ew "brown"');
    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe('charlie');
  });

  it('filters by pr (presence)', () => {
    const result = applyScimFilter(records, 'displayName pr');
    expect(result).toHaveLength(3);
  });

  it('filters by emails.value', () => {
    const result = applyScimFilter(records, 'emails.value co "example.com"');
    expect(result).toHaveLength(2);
  });

  it('supports compound filter with and', () => {
    const result = applyScimFilter(
      records,
      'active eq "true" and displayName co "alice"',
    );
    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe('alice');
  });

  it('filters by nested name attributes', () => {
    const namedRecords = [
      { userName: 'a', name: { givenName: 'John', familyName: 'Doe' } },
      { userName: 'b', name: { givenName: 'Jane', familyName: 'Smith' } },
    ];
    const result = applyScimFilter(namedRecords, 'name.familyName eq "doe"');
    expect(result).toHaveLength(1);
    expect(result[0].userName).toBe('a');
  });

  it('handles numeric comparisons', () => {
    const numRecords = [
      { userName: 'a', score: 10 },
      { userName: 'b', score: 50 },
      { userName: 'c', score: 90 },
    ];
    expect(applyScimFilter(numRecords, 'score gt "40"')).toHaveLength(2);
    expect(applyScimFilter(numRecords, 'score lt "50"')).toHaveLength(1);
    expect(applyScimFilter(numRecords, 'score ge "50"')).toHaveLength(2);
    expect(applyScimFilter(numRecords, 'score le "50"')).toHaveLength(2);
  });
});

describe('applyScimSort', () => {
  const records = [
    { userName: 'charlie', displayName: 'Charlie' },
    { userName: 'alice', displayName: 'Alice' },
    { userName: 'bob', displayName: 'Bob' },
  ];

  it('returns records unchanged when sortBy is null', () => {
    expect(applyScimSort(records, null)).toEqual(records);
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

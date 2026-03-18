import {
  applyScimFilter,
  applyScimSort,
  parseScimFilterExpression,
} from '@/lib/scim/scim-utils';

describe('SCIM helpers', () => {
  const users = [
    {
      userName: 'john@example.com',
      displayName: 'John Stone',
      active: true,
      name: { givenName: 'John', familyName: 'Stone' },
      meta: { lastModified: '2026-03-14T00:00:00.000Z' },
    },
    {
      userName: 'jane@example.com',
      displayName: 'Jane Carter',
      active: false,
      name: { givenName: 'Jane', familyName: 'Carter' },
      meta: { lastModified: '2026-03-13T00:00:00.000Z' },
    },
  ];

  it('parses supported SCIM filter clauses', () => {
    expect(parseScimFilterExpression('userName eq "john@example.com"')).toEqual([
      {
        attribute: 'userName',
        operator: 'eq',
        value: 'john@example.com',
      },
    ]);
  });

  it('filters by equality and presence', () => {
    expect(applyScimFilter(users, 'userName eq "john@example.com"')).toHaveLength(1);
    expect(applyScimFilter(users, 'displayName pr')).toHaveLength(2);
  });

  it('sorts resources by a SCIM attribute', () => {
    const sorted = applyScimSort(users, 'displayName', 'descending');
    expect(sorted[0].displayName).toBe('John Stone');
    expect(sorted[1].displayName).toBe('Jane Carter');
  });
});

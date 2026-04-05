import {
  createOrgGroup,
  getGroupRollup,
  getOrgComparison,
} from '@/lib/executive/multi-org-rollup';

const mockQuery: any = {};

function resetMock() {
  mockQuery.from = jest.fn().mockReturnValue(mockQuery);
  mockQuery.select = jest.fn().mockReturnValue(mockQuery);
  mockQuery.insert = jest.fn().mockReturnValue(mockQuery);
  mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
  mockQuery.gte = jest.fn().mockReturnValue(mockQuery);
  mockQuery.single = jest.fn().mockReturnValue(mockQuery);
  mockQuery.then = jest.fn((resolve: any) =>
    resolve({ data: null, error: null, count: 0 }),
  );
}

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockQuery,
}));

describe('createOrgGroup', () => {
  beforeEach(resetMock);

  it('creates a group and returns its id', async () => {
    mockQuery.then = jest
      .fn()
      // insert + select + single for org_groups
      .mockImplementationOnce((resolve: any) =>
        resolve({ data: { id: 'group-123' }, error: null }),
      )
      // insert for org_group_members
      .mockImplementationOnce((resolve: any) =>
        resolve({ data: null, error: null }),
      );

    const groupId = await createOrgGroup(
      'parent-1',
      'Test Group',
      ['org-a', 'org-b'],
      'user-1',
    );

    expect(groupId).toBe('group-123');
    expect(mockQuery.from).toHaveBeenCalledWith('org_groups');
  });

  it('throws when insert fails', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: null, error: { message: 'insert failed' } }),
    );

    await expect(
      createOrgGroup('parent-1', 'Group', [], 'user-1'),
    ).rejects.toThrow('Failed to create org group');
  });

  it('skips member insert when no member org ids', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: { id: 'group-1' }, error: null }),
    );

    const groupId = await createOrgGroup(
      'parent-1',
      'Empty Group',
      [],
      'user-1',
    );
    expect(groupId).toBe('group-1');
    // Only org_groups insert, no org_group_members
    expect(mockQuery.from).toHaveBeenCalledTimes(1);
  });
});

describe('getGroupRollup', () => {
  beforeEach(resetMock);

  it('returns empty result when no members', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );

    const result = await getGroupRollup('group-empty');
    expect(result).toEqual({ orgs: [], combined: null });
  });

  it('returns rollup with org scores', async () => {
    let callCount = 0;
    mockQuery.then = jest.fn((resolve: any) => {
      callCount++;
      switch (callCount) {
        case 1: // org_group_members
          return resolve({
            data: [
              { organization_id: 'org-a', organizations: { name: 'Org A' } },
            ],
            error: null,
          });
        case 2: // org_controls for org-a
          return resolve({
            data: [
              { status: 'satisfied' },
              { status: 'satisfied' },
              { status: 'not_satisfied' },
            ],
            error: null,
          });
        case 3: // org_evidence count
          return resolve({ data: null, error: null, count: 5 });
        case 4: // org_incidents count
          return resolve({ data: null, error: null, count: 2 });
        default:
          return resolve({ data: [], error: null, count: 0 });
      }
    });

    const result = await getGroupRollup('group-1');

    expect(result.orgs.length).toBe(1);
    expect(result.orgs[0].orgName).toBe('Org A');
    expect(result.orgs[0].totalControls).toBe(3);
    expect(result.orgs[0].satisfiedControls).toBe(2);
    expect(result.orgs[0].complianceScore).toBe(67); // 2/3 ≈ 66.67 → 67
    expect(result.orgs[0].evidenceCount).toBe(5);
    expect(result.orgs[0].incidentCount).toBe(2);
    expect(result.combined).not.toBeNull();
    expect(result.combined!.avgComplianceScore).toBe(67);
  });
});

describe('getOrgComparison', () => {
  beforeEach(resetMock);

  it('returns orgs sorted by compliance score descending', async () => {
    let callCount = 0;
    mockQuery.then = jest.fn((resolve: any) => {
      callCount++;
      switch (callCount) {
        case 1: // members
          return resolve({
            data: [
              { organization_id: 'org-a', organizations: { name: 'Low' } },
              { organization_id: 'org-b', organizations: { name: 'High' } },
            ],
            error: null,
          });
        // org-a controls
        case 2:
          return resolve({ data: [{ status: 'not_satisfied' }], error: null });
        case 3: // evidence
          return resolve({ data: null, count: 0, error: null });
        case 4: // incidents
          return resolve({ data: null, count: 0, error: null });
        // org-b controls
        case 5:
          return resolve({ data: [{ status: 'satisfied' }], error: null });
        case 6: // evidence
          return resolve({ data: null, count: 10, error: null });
        case 7: // incidents
          return resolve({ data: null, count: 0, error: null });
        default:
          return resolve({ data: [], error: null, count: 0 });
      }
    });

    const result = await getOrgComparison('group-1');
    expect(result.length).toBe(2);
    expect(result[0].complianceScore).toBeGreaterThanOrEqual(
      result[1].complianceScore,
    );
  });
});

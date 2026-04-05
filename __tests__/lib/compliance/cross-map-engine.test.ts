/**
 * Tests for lib/compliance/cross-map-engine.ts
 * Covers: getMappedControls, getControlGroup, getDeduplicationOpportunities, getCrossMapCoverage
 */

function mockChain(data: any) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data }),
    maybeSingle: jest.fn().mockResolvedValue({ data }),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  // When resolved as a promise directly (no .single()), return data
  chain.then = (resolve: Function) => resolve({ data });
  return chain;
}

let fromMap: Record<string, any> = {};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => fromMap[table] || mockChain(null),
  }),
}));

import {
  getMappedControls,
  getControlGroup,
  getDeduplicationOpportunities,
  getCrossMapCoverage,
} from '@/lib/compliance/cross-map-engine';

beforeEach(() => {
  jest.clearAllMocks();
  fromMap = {};
});

// --- getMappedControls ---

describe('getMappedControls', () => {
  it('returns forward and reverse mappings', async () => {
    const forwardData = [
      {
        target_framework: 'iso27001',
        target_control_id: 'A.9.1',
        mapping_strength: 'exact',
        notes: null,
      },
    ];
    const reverseData = [
      {
        source_framework: 'hipaa',
        source_control_id: 'H-164',
        mapping_strength: 'partial',
        notes: 'Partial overlap',
      },
    ];

    // Two queries on same table: forward then reverse
    let callCount = 0;
    fromMap['framework_control_mappings'] = {
      select: jest.fn().mockImplementation(() => {
        callCount++;
        const chain: any = {
          eq: jest.fn().mockReturnThis(),
        };
        chain.eq.mockReturnValue(chain);
        // After second eq, resolve
        let eqCallCount = 0;
        chain.eq = jest.fn().mockImplementation(() => {
          eqCallCount++;
          if (eqCallCount >= 2) {
            chain.then = (resolve: Function) =>
              resolve({ data: callCount === 1 ? forwardData : reverseData });
          }
          return chain;
        });
        return chain;
      }),
    };

    const results = await getMappedControls('soc2', 'CC6.1');
    expect(results).toHaveLength(2);
    expect(results[0].targetFramework).toBe('iso27001');
    expect(results[0].strength).toBe('exact');
    expect(results[1].targetFramework).toBe('hipaa');
    expect(results[1].strength).toBe('partial');
  });

  it('returns empty array when no mappings exist', async () => {
    fromMap['framework_control_mappings'] = {
      select: jest.fn().mockImplementation(() => {
        const chain: any = {
          eq: jest.fn().mockReturnThis(),
        };
        chain.eq.mockReturnValue(chain);
        chain.then = (resolve: Function) => resolve({ data: [] });
        let eqCallCount = 0;
        chain.eq = jest.fn().mockImplementation(() => {
          eqCallCount++;
          if (eqCallCount >= 2) {
            chain.then = (resolve: Function) => resolve({ data: [] });
          }
          return chain;
        });
        return chain;
      }),
    };

    const results = await getMappedControls('soc2', 'CC6.1');
    expect(results).toEqual([]);
  });
});

// --- getControlGroup ---

describe('getControlGroup', () => {
  it('returns null when no membership found', async () => {
    fromMap['control_group_members'] = mockChain(null);
    const result = await getControlGroup('soc2', 'CC6.1');
    expect(result).toBeNull();
  });

  it('returns group with members when found', async () => {
    const membershipData = { group_id: 'grp-1' };
    const groupData = {
      id: 'grp-1',
      name: 'Access Controls',
      description: 'Access control standards',
      category: 'Security',
    };
    const membersData = [
      { framework: 'soc2', control_id: 'CC6.1' },
      { framework: 'iso27001', control_id: 'A.9.1' },
    ];

    let callCount = 0;
    fromMap['control_group_members'] = {
      select: jest.fn().mockImplementation(() => {
        callCount++;
        const chain: any = {
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn(),
        };
        chain.eq.mockReturnValue(chain);
        chain.limit.mockReturnValue(chain);
        if (callCount === 1) {
          chain.single.mockResolvedValue({ data: membershipData });
        } else {
          // Third call for members list
          chain.then = (resolve: Function) => resolve({ data: membersData });
          chain.eq.mockImplementation(() => {
            chain.then = (resolve: Function) => resolve({ data: membersData });
            return chain;
          });
        }
        return chain;
      }),
    };

    fromMap['control_groups'] = mockChain(groupData);

    const result = await getControlGroup('soc2', 'CC6.1');
    expect(result).toBeTruthy();
    expect(result!.name).toBe('Access Controls');
    expect(result!.members).toHaveLength(2);
  });
});

// --- getCrossMapCoverage ---

describe('getCrossMapCoverage', () => {
  it('returns empty object when no org controls', async () => {
    fromMap['org_controls'] = mockChain(null);
    const result = await getCrossMapCoverage('org-1');
    expect(result).toEqual({});
  });

  it('calculates isolated and cross-mapped scores', async () => {
    const controls = [
      { framework: 'soc2', control_id: 'c1', status: 'satisfied' },
      { framework: 'soc2', control_id: 'c2', status: 'not_met' },
      { framework: 'iso27001', control_id: 'c3', status: 'met' },
    ];

    // Need to make eq chain work correctly
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockImplementation(() => {
      chain.then = (resolve: Function) => resolve({ data: controls });
      return chain;
    });
    fromMap['org_controls'] = chain;

    const result = await getCrossMapCoverage('org-1');
    // soc2: 1/2 = 50% isolated, 55% cross-mapped
    expect(result['soc2']).toEqual({ isolated: 50, crossMapped: 55 });
    // iso27001: 1/1 = 100% isolated, 100% cross-mapped (capped)
    expect(result['iso27001']).toEqual({ isolated: 100, crossMapped: 100 });
  });
});

// --- getDeduplicationOpportunities ---

describe('getDeduplicationOpportunities', () => {
  it('returns empty array when no org controls', async () => {
    fromMap['org_controls'] = mockChain(null);
    const result = await getDeduplicationOpportunities('org-1');
    expect(result).toEqual([]);
  });

  it('returns empty array when org controls is empty', async () => {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    chain.eq.mockImplementation(() => {
      chain.then = (resolve: Function) => resolve({ data: [] });
      return chain;
    });
    fromMap['org_controls'] = chain;

    const result = await getDeduplicationOpportunities('org-1');
    expect(result).toEqual([]);
  });
});

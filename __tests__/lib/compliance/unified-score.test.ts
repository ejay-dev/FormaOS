/**
 * Tests for lib/compliance/unified-score.ts
 * Covers: getUnifiedComplianceScore, getFrameworkScores, getScoreImpact
 */

// Mock supabase admin before imports
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    from: mockFrom,
  }),
}));

import {
  getUnifiedComplianceScore,
  getFrameworkScores,
  getScoreImpact,
} from '@/lib/compliance/unified-score';

function setupMockChain(data: any) {
  mockEq.mockReturnValue({ data });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// --- getUnifiedComplianceScore ---

describe('getUnifiedComplianceScore', () => {
  it('returns 0 when no controls exist', async () => {
    setupMockChain(null);
    expect(await getUnifiedComplianceScore('org-1')).toBe(0);
  });

  it('returns 0 when controls array is empty', async () => {
    setupMockChain([]);
    expect(await getUnifiedComplianceScore('org-1')).toBe(0);
  });

  it('calculates 100% when all controls are satisfied', async () => {
    setupMockChain([
      { status: 'satisfied' },
      { status: 'met' },
      { status: 'satisfied' },
    ]);
    expect(await getUnifiedComplianceScore('org-1')).toBe(100);
  });

  it('calculates 0% when no controls are satisfied', async () => {
    setupMockChain([
      { status: 'not_met' },
      { status: 'pending' },
      { status: 'in_progress' },
    ]);
    expect(await getUnifiedComplianceScore('org-1')).toBe(0);
  });

  it('calculates correct percentage for mixed statuses', async () => {
    setupMockChain([
      { status: 'satisfied' },
      { status: 'met' },
      { status: 'not_met' },
      { status: 'pending' },
    ]);
    // 2 out of 4 = 50%
    expect(await getUnifiedComplianceScore('org-1')).toBe(50);
  });

  it('rounds to nearest integer', async () => {
    setupMockChain([
      { status: 'satisfied' },
      { status: 'not_met' },
      { status: 'not_met' },
    ]);
    // 1/3 = 33.33... → 33
    expect(await getUnifiedComplianceScore('org-1')).toBe(33);
  });

  it('passes orgId to supabase query', async () => {
    setupMockChain([]);
    await getUnifiedComplianceScore('org-xyz');
    expect(mockFrom).toHaveBeenCalledWith('org_controls');
    expect(mockSelect).toHaveBeenCalledWith('status');
    expect(mockEq).toHaveBeenCalledWith('organization_id', 'org-xyz');
  });
});

// --- getFrameworkScores ---

describe('getFrameworkScores', () => {
  it('returns empty array when no controls exist', async () => {
    setupMockChain(null);
    expect(await getFrameworkScores('org-1')).toEqual([]);
  });

  it('returns empty array when controls array is empty', async () => {
    setupMockChain([]);
    expect(await getFrameworkScores('org-1')).toEqual([]);
  });

  it('groups controls by framework and calculates score', async () => {
    setupMockChain([
      { framework: 'soc2', status: 'satisfied' },
      { framework: 'soc2', status: 'not_met' },
      { framework: 'iso27001', status: 'met' },
      { framework: 'iso27001', status: 'met' },
    ]);

    const scores = await getFrameworkScores('org-1');
    expect(scores).toHaveLength(2);

    const soc2 = scores.find((s) => s.framework === 'soc2');
    expect(soc2).toEqual({
      framework: 'soc2',
      score: 50,
      total: 2,
      satisfied: 1,
    });

    const iso = scores.find((s) => s.framework === 'iso27001');
    expect(iso).toEqual({
      framework: 'iso27001',
      score: 100,
      total: 2,
      satisfied: 2,
    });
  });

  it('handles single framework with all satisfied', async () => {
    setupMockChain([
      { framework: 'hipaa', status: 'satisfied' },
      { framework: 'hipaa', status: 'met' },
    ]);

    const scores = await getFrameworkScores('org-1');
    expect(scores).toEqual([
      { framework: 'hipaa', score: 100, total: 2, satisfied: 2 },
    ]);
  });

  it('recognizes both "satisfied" and "met" as passing', async () => {
    setupMockChain([
      { framework: 'soc2', status: 'satisfied' },
      { framework: 'soc2', status: 'met' },
      { framework: 'soc2', status: 'partial' },
    ]);

    const scores = await getFrameworkScores('org-1');
    expect(scores[0].satisfied).toBe(2);
    expect(scores[0].score).toBe(67); // 2/3 rounded
  });

  it('queries correct supabase columns', async () => {
    setupMockChain([]);
    await getFrameworkScores('org-1');
    expect(mockSelect).toHaveBeenCalledWith('framework, status');
  });
});

// --- getScoreImpact ---

describe('getScoreImpact', () => {
  it('returns empty array when no frameworks exist', async () => {
    setupMockChain([]);
    expect(await getScoreImpact('org-1')).toEqual([]);
  });

  it('adds cross-map boost of up to 5 points', async () => {
    setupMockChain([
      { framework: 'soc2', status: 'satisfied' },
      { framework: 'soc2', status: 'not_met' },
    ]);

    const impact = await getScoreImpact('org-1');
    expect(impact).toHaveLength(1);
    expect(impact[0].isolatedScore).toBe(50);
    expect(impact[0].crossMappedScore).toBe(55);
    expect(impact[0].delta).toBe(5);
  });

  it('caps cross-mapped score at 100', async () => {
    setupMockChain([
      { framework: 'soc2', status: 'satisfied' },
      { framework: 'soc2', status: 'met' },
    ]);

    const impact = await getScoreImpact('org-1');
    expect(impact[0].isolatedScore).toBe(100);
    expect(impact[0].crossMappedScore).toBe(100);
    expect(impact[0].delta).toBe(0); // min(5, 100-100)
  });

  it('caps delta at remaining headroom', async () => {
    // 98% score → delta should be 2 (not 5)
    setupMockChain([
      { framework: 'fw', status: 'satisfied' },
      { framework: 'fw', status: 'satisfied' },
      { framework: 'fw', status: 'satisfied' },
      ...[...Array(47)].map(() => ({ framework: 'fw', status: 'satisfied' })),
      { framework: 'fw', status: 'not_met' },
    ]);

    const impact = await getScoreImpact('org-1');
    expect(impact[0].crossMappedScore).toBeLessThanOrEqual(100);
    expect(impact[0].delta).toBeLessThanOrEqual(5);
  });
});

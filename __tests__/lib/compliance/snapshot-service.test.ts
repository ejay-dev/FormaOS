/**
 * Tests for lib/compliance/snapshot-service.ts
 * Covers: captureComplianceSnapshot, getSnapshotHistory,
 *         detectScoreRegression, getImprovementSinceLastAudit
 */

const mockAdminFrom = jest.fn();
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    from: mockAdminFrom,
  }),
}));

jest.mock('@/lib/audit/readiness-calculator', () => ({
  calculateFrameworkReadiness: jest.fn(),
}));

import {
  captureComplianceSnapshot,
  getSnapshotHistory,
  detectScoreRegression,
  getImprovementSinceLastAudit,
} from '@/lib/compliance/snapshot-service';

import { calculateFrameworkReadiness } from '@/lib/audit/readiness-calculator';

const mockCalculate = calculateFrameworkReadiness as jest.MockedFunction<
  typeof calculateFrameworkReadiness
>;

function mockTableChain(data: any, error: any = null) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
    upsert: jest.fn().mockResolvedValue({ data: null, error }),
    then: undefined as any,
  };
  // Resolve as awaitable
  chain.then = (resolve: Function) => resolve({ data, error });
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// --- detectScoreRegression ---

describe('detectScoreRegression', () => {
  it('returns null when fewer than 2 snapshots exist', async () => {
    mockAdminFrom.mockReturnValue(
      mockTableChain([{ compliance_score: 80, snapshot_date: '2026-04-01' }]),
    );
    const result = await detectScoreRegression('org-1', 'soc2');
    expect(result).toBeNull();
  });

  it('returns null when no snapshots exist', async () => {
    mockAdminFrom.mockReturnValue(mockTableChain(null));
    const result = await detectScoreRegression('org-1', 'soc2');
    expect(result).toBeNull();
  });

  it('detects regression when score drops more than 10%', async () => {
    mockAdminFrom.mockReturnValue(
      mockTableChain([
        { compliance_score: 60, snapshot_date: '2026-04-05' }, // most recent
        { compliance_score: 80, snapshot_date: '2026-04-04' }, // previous
      ]),
    );

    const result = await detectScoreRegression('org-1', 'soc2');
    expect(result).toBeTruthy();
    expect(result!.hasRegression).toBe(true);
    expect(result!.currentScore).toBe(60);
    expect(result!.previousScore).toBe(80);
    expect(result!.drop).toBe(25); // (80-60)/80*100 = 25%
  });

  it('reports no regression for small score change', async () => {
    mockAdminFrom.mockReturnValue(
      mockTableChain([
        { compliance_score: 77, snapshot_date: '2026-04-05' },
        { compliance_score: 80, snapshot_date: '2026-04-04' },
      ]),
    );

    const result = await detectScoreRegression('org-1', 'soc2');
    expect(result).toBeTruthy();
    expect(result!.hasRegression).toBe(false);
    expect(result!.drop).toBe(4); // (80-77)/80*100 = 3.75 → 4 rounded
  });

  it('reports no regression for improving score', async () => {
    mockAdminFrom.mockReturnValue(
      mockTableChain([
        { compliance_score: 90, snapshot_date: '2026-04-05' },
        { compliance_score: 85, snapshot_date: '2026-04-04' },
      ]),
    );

    const result = await detectScoreRegression('org-1', 'soc2');
    expect(result).toBeTruthy();
    expect(result!.hasRegression).toBe(false);
  });
});

// --- getImprovementSinceLastAudit ---

describe('getImprovementSinceLastAudit', () => {
  it('calculates improvement correctly', async () => {
    let callCount = 0;
    mockAdminFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // baseline query
        return mockTableChain({ compliance_score: 60 });
      }
      // current query
      return mockTableChain({ compliance_score: 85 });
    });

    const result = await getImprovementSinceLastAudit(
      'org-1',
      'soc2',
      '2026-01-01',
    );
    expect(result.improvement).toBe(25);
    expect(result.current).toBe(85);
    expect(result.baseline).toBe(60);
  });

  it('returns 0 baseline when no audit snapshot exists', async () => {
    let callCount = 0;
    mockAdminFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockTableChain(null); // no baseline
      return mockTableChain({ compliance_score: 75 });
    });

    const result = await getImprovementSinceLastAudit(
      'org-1',
      'soc2',
      '2026-01-01',
    );
    expect(result.baseline).toBe(0);
    expect(result.current).toBe(75);
    expect(result.improvement).toBe(75);
  });

  it('returns 0 current when no current snapshot exists', async () => {
    let callCount = 0;
    mockAdminFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockTableChain({ compliance_score: 50 });
      return mockTableChain(null); // no current
    });

    const result = await getImprovementSinceLastAudit(
      'org-1',
      'soc2',
      '2026-01-01',
    );
    expect(result.baseline).toBe(50);
    expect(result.current).toBe(0);
    expect(result.improvement).toBe(-50);
  });
});

// --- getSnapshotHistory ---

describe('getSnapshotHistory', () => {
  it('returns empty array on error', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockAdminFrom.mockReturnValue(
      mockTableChain(null, { message: 'table missing' }),
    );

    const result = await getSnapshotHistory('org-1', 'soc2');
    expect(result).toEqual([]);
    consoleError.mockRestore();
  });

  it('returns snapshot data when available', async () => {
    const snapshots = [
      { id: 's1', compliance_score: 70, snapshot_date: '2026-04-01' },
      { id: 's2', compliance_score: 75, snapshot_date: '2026-04-02' },
    ];
    mockAdminFrom.mockReturnValue(mockTableChain(snapshots));

    const result = await getSnapshotHistory('org-1', 'soc2');
    expect(result).toHaveLength(2);
    expect(result[0].compliance_score).toBe(70);
  });

  it('defaults to 30 days lookback', async () => {
    const chain = mockTableChain([]);
    mockAdminFrom.mockReturnValue(chain);

    await getSnapshotHistory('org-1', 'soc2');
    // Verify gte was called (date filtering)
    expect(chain.gte).toHaveBeenCalled();
  });

  it('respects custom days parameter', async () => {
    const chain = mockTableChain([]);
    mockAdminFrom.mockReturnValue(chain);

    await getSnapshotHistory('org-1', 'soc2', 90);
    expect(chain.gte).toHaveBeenCalled();
  });
});

// --- captureComplianceSnapshot ---

describe('captureComplianceSnapshot', () => {
  it('returns error when no frameworks enabled', async () => {
    mockCalculate.mockResolvedValue([]);
    const result = await captureComplianceSnapshot('org-1');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('No frameworks enabled');
  });

  it('captures snapshot for enabled frameworks', async () => {
    mockCalculate.mockResolvedValue([
      {
        frameworkId: 'fw-soc2',
        frameworkCode: 'SOC2',
        frameworkTitle: 'SOC 2',
        readinessScore: 80,
        totalControls: 10,
        satisfiedControls: 8,
        partialControls: 1,
        missingControls: 1,
        evaluatedAt: '2026-04-05',
      },
    ]);

    const upsertChain = mockTableChain(null, null);
    const evidenceChain = mockTableChain([{ id: 'e1' }, { id: 'e2' }]);
    const tasksChain = mockTableChain([
      { status: 'completed' },
      { status: 'in_progress' },
      { status: 'completed' },
    ]);

    const _callCount = 0;
    mockAdminFrom.mockImplementation((table: string) => {
      switch (table) {
        case 'org_evidence':
          return evidenceChain;
        case 'org_tasks':
          return tasksChain;
        case 'compliance_score_snapshots':
          return upsertChain;
        default:
          return mockTableChain(null);
      }
    });

    const result = await captureComplianceSnapshot('org-1');
    expect(result.ok).toBe(true);
    expect(result.snapshots).toBe(1);
  });

  it('handles DB upsert error', async () => {
    mockCalculate.mockResolvedValue([
      {
        frameworkId: 'fw-soc2',
        frameworkCode: 'SOC2',
        frameworkTitle: 'SOC 2',
        readinessScore: 80,
        totalControls: 10,
        satisfiedControls: 8,
        partialControls: 1,
        missingControls: 1,
        evaluatedAt: '2026-04-05',
      },
    ]);

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'compliance_score_snapshots') {
        return mockTableChain(null, { message: 'conflict' });
      }
      return mockTableChain([]);
    });

    const result = await captureComplianceSnapshot('org-1');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('conflict');
  });

  it('filters by specific framework slug', async () => {
    mockCalculate.mockResolvedValue([
      {
        frameworkId: 'fw-soc2',
        frameworkCode: 'SOC2',
        frameworkTitle: 'SOC 2',
        readinessScore: 80,
        totalControls: 10,
        satisfiedControls: 8,
        partialControls: 1,
        missingControls: 1,
        evaluatedAt: '2026-04-05',
      },
      {
        frameworkId: 'fw-iso27001',
        frameworkCode: 'ISO27001',
        frameworkTitle: 'ISO 27001',
        readinessScore: 60,
        totalControls: 20,
        satisfiedControls: 12,
        partialControls: 4,
        missingControls: 4,
        evaluatedAt: '2026-04-05',
      },
    ]);

    mockAdminFrom.mockReturnValue(mockTableChain(null, null));

    const result = await captureComplianceSnapshot('org-1', 'soc2');
    expect(result.ok).toBe(true);
    expect(result.snapshots).toBe(1); // only SOC2
  });
});

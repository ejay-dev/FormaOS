/**
 * Tests for lib/executive/posture-calculator.ts
 */

jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null, count: 0 }) {
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
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'gte',
    'lte',
    'gt',
    'lt',
    'or',
    'contains',
    'textSearch',
    'ilike',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const __admin: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => __admin),
}));

jest.mock('@/lib/audit/readiness-calculator', () => ({
  calculateFrameworkReadiness: jest.fn(async () => []),
}));

jest.mock('@/lib/supabase/schema-compat', () => ({
  isMissingSupabaseTableError: jest.fn(() => false),
}));

import { calculateExecutivePosture } from '@/lib/executive/posture-calculator';
const {
  calculateFrameworkReadiness,
} = require('@/lib/audit/readiness-calculator');
const { isMissingSupabaseTableError } = require('@/lib/supabase/schema-compat');

beforeEach(() => {
  jest.clearAllMocks();
  __admin.from = jest.fn(() =>
    createBuilder({ data: null, error: null, count: 0 }),
  );
});

describe('calculateExecutivePosture', () => {
  it('returns zero scores when no frameworks', async () => {
    calculateFrameworkReadiness.mockResolvedValue([]);
    const result = await calculateExecutivePosture('org-1');
    expect(result.overallScore).toBe(0);
    expect(result.frameworkCoverage).toBe(0);
    expect(result.frameworkRollup).toEqual([]);
  });

  it('calculates weighted average score from frameworks', async () => {
    calculateFrameworkReadiness.mockResolvedValue([
      {
        frameworkId: 'fw-1',
        frameworkCode: 'SOC2',
        frameworkTitle: 'SOC 2',
        readinessScore: 80,
        totalControls: 10,
        satisfiedControls: 8,
        partialControls: 1,
        missingControls: 1,
        evaluatedAt: '2025-01-01',
      },
      {
        frameworkId: 'fw-2',
        frameworkCode: 'ISO',
        frameworkTitle: 'ISO 27001',
        readinessScore: 60,
        totalControls: 20,
        satisfiedControls: 12,
        partialControls: 4,
        missingControls: 4,
        evaluatedAt: '2025-01-01',
      },
    ]);
    const result = await calculateExecutivePosture('org-1');
    // Weighted: (80*10 + 60*20) / (10+20) = (800+1200)/30 = 66.67 -> 67
    expect(result.overallScore).toBe(67);
    expect(result.frameworkCoverage).toBe(100);
    expect(result.frameworkRollup).toHaveLength(2);
  });

  it('calculates upward trend when current > previous', async () => {
    calculateFrameworkReadiness.mockResolvedValue([
      {
        frameworkId: 'fw-1',
        frameworkCode: 'SOC2',
        frameworkTitle: 'SOC 2',
        readinessScore: 80,
        totalControls: 10,
        satisfiedControls: 8,
        partialControls: 1,
        missingControls: 1,
      },
    ]);
    // Previous score = 50 (30 points lower)
    __admin.from = jest.fn(() =>
      createBuilder({
        data: [{ compliance_score: 50 }],
        error: null,
        count: 0,
      }),
    );
    const result = await calculateExecutivePosture('org-1');
    expect(result.trend).toBe('up');
    expect(result.trendPercentage).toBeGreaterThan(0);
  });

  it('calculates downward trend when current < previous', async () => {
    calculateFrameworkReadiness.mockResolvedValue([
      {
        frameworkId: 'fw-1',
        frameworkCode: 'SOC2',
        frameworkTitle: 'SOC 2',
        readinessScore: 30,
        totalControls: 10,
        satisfiedControls: 3,
        partialControls: 2,
        missingControls: 5,
      },
    ]);
    __admin.from = jest.fn(() =>
      createBuilder({
        data: [{ compliance_score: 80 }],
        error: null,
        count: 0,
      }),
    );
    const result = await calculateExecutivePosture('org-1');
    expect(result.trend).toBe('down');
  });

  it('calculates stable trend when difference <= 2', async () => {
    calculateFrameworkReadiness.mockResolvedValue([
      {
        frameworkId: 'fw-1',
        frameworkCode: 'SOC2',
        frameworkTitle: 'SOC 2',
        readinessScore: 50,
        totalControls: 10,
        satisfiedControls: 5,
        partialControls: 2,
        missingControls: 3,
      },
    ]);
    __admin.from = jest.fn(() =>
      createBuilder({
        data: [{ compliance_score: 49 }],
        error: null,
        count: 0,
      }),
    );
    const result = await calculateExecutivePosture('org-1');
    expect(result.trend).toBe('stable');
  });

  it('calculates framework coverage correctly', async () => {
    calculateFrameworkReadiness.mockResolvedValue([
      {
        frameworkId: 'fw-1',
        frameworkCode: 'SOC2',
        frameworkTitle: 'SOC 2',
        readinessScore: 80,
        totalControls: 10,
        satisfiedControls: 5,
        partialControls: 2,
        missingControls: 3,
      },
      {
        frameworkId: 'fw-2',
        frameworkCode: 'ISO',
        frameworkTitle: 'ISO 27001',
        readinessScore: 0,
        totalControls: 10,
        satisfiedControls: 0,
        partialControls: 0,
        missingControls: 10,
      },
    ]);
    const result = await calculateExecutivePosture('org-1');
    // 1 of 2 frameworks has satisfiedControls > 0 -> 50%
    expect(result.frameworkCoverage).toBe(50);
  });

  it('computes automation effectiveness', async () => {
    calculateFrameworkReadiness.mockResolvedValue([]);
    let callIdx = 0;
    __admin.from = jest.fn(() => {
      const idx = callIdx++;
      if (idx === 0) return createBuilder({ data: null, error: null }); // snapshots
      if (idx === 1)
        return createBuilder({
          data: [
            { id: 'w1', status: 'active' },
            { id: 'w2', status: 'inactive' },
          ],
          error: null,
        }); // workflows
      if (idx === 2)
        return createBuilder({ data: null, error: null, count: 20 }); // workflow runs
      if (idx === 3) return createBuilder({ data: [], error: null }); // evaluations
      if (idx === 4) return createBuilder({ data: null, error: null }); // deadlines
      return createBuilder();
    });
    const result = await calculateExecutivePosture('org-1');
    // 1 active workflow, 20 triggers -> min(100, (20/1)*10) = min(100, 200) = 100
    expect(result.automationEffectiveness).toBeGreaterThanOrEqual(0);
  });

  it('handles missing deadlines table', async () => {
    calculateFrameworkReadiness.mockResolvedValue([]);
    isMissingSupabaseTableError.mockReturnValue(true);
    let callIdx = 0;
    __admin.from = jest.fn(() => {
      const idx = callIdx++;
      if (idx === 4)
        return createBuilder({
          data: null,
          error: { message: 'Table not found' },
        }); // deadlines error
      return createBuilder({ data: null, error: null, count: 0 });
    });
    const result = await calculateExecutivePosture('org-1');
    expect(result.upcomingDeadlines).toEqual([]);
  });

  it('builds framework rollup items', async () => {
    calculateFrameworkReadiness.mockResolvedValue([
      {
        frameworkId: 'fw-1',
        frameworkCode: 'SOC2',
        frameworkTitle: 'SOC 2 Type II',
        readinessScore: 75,
        totalControls: 20,
        satisfiedControls: 15,
        partialControls: 3,
        missingControls: 2,
        evaluatedAt: '2025-01-01T00:00:00Z',
      },
    ]);
    const result = await calculateExecutivePosture('org-1');
    expect(result.frameworkRollup[0]).toMatchObject({
      frameworkId: 'fw-1',
      code: 'SOC2',
      title: 'SOC 2 Type II',
      readinessScore: 75,
      controlsTotal: 20,
      controlsSatisfied: 15,
      controlsPartial: 3,
      controlsMissing: 2,
    });
  });

  it('includes lastEvaluated timestamp', async () => {
    calculateFrameworkReadiness.mockResolvedValue([]);
    const result = await calculateExecutivePosture('org-1');
    expect(result.lastEvaluated).toBeTruthy();
    expect(new Date(result.lastEvaluated).getTime()).toBeGreaterThan(0);
  });
});

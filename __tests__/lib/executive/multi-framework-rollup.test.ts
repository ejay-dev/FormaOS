/** @jest-environment node */
jest.mock('server-only', () => ({}));

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
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});

jest.mock('@/lib/audit/readiness-calculator', () => ({
  calculateFrameworkReadiness: jest.fn().mockResolvedValue([
    {
      frameworkId: 'fw-1',
      frameworkCode: 'SOC2',
      frameworkTitle: 'SOC 2 Type II',
      readinessScore: 65,
      totalControls: 100,
      satisfiedControls: 60,
      partialControls: 10,
      missingControls: 30,
      evaluatedAt: '2024-06-01T00:00:00Z',
    },
    {
      frameworkId: 'fw-2',
      frameworkCode: 'ISO_27001',
      frameworkTitle: 'ISO 27001',
      readinessScore: 45,
      totalControls: 80,
      satisfiedControls: 30,
      partialControls: 15,
      missingControls: 35,
      evaluatedAt: '2024-06-01T00:00:00Z',
    },
  ]),
}));

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

import {
  getMultiFrameworkRollup,
  calculateAuditForecast,
} from '@/lib/executive/multi-framework-rollup';

beforeEach(() => jest.clearAllMocks());

describe('getMultiFrameworkRollup', () => {
  it('returns rollup items with trend data', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          { framework_slug: 'SOC2', compliance_score: 55 },
          { framework_slug: 'ISO-27001', compliance_score: 40 },
        ],
        error: null,
      }),
    );
    const result = await getMultiFrameworkRollup('org-1');
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty('code', 'SOC2');
    expect(result[0]).toHaveProperty('trendDirection');
    expect(result[0].trend).toBe(65 - 55); // current - historical
  });

  it('uses current score when no historical data', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await getMultiFrameworkRollup('org-1');
    expect(result.length).toBe(2);
    expect(result[0].trend).toBe(0); // no change
    expect(result[0].trendDirection).toBe('stable');
  });
});

describe('calculateAuditForecast', () => {
  it('returns forecast with improvement rate', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) {
        // historical snapshots
        return createBuilder({
          data: [
            { compliance_score: 40, captured_at: '2024-05-01' },
            { compliance_score: 50, captured_at: '2024-05-15' },
            { compliance_score: 60, captured_at: '2024-06-01' },
          ],
          error: null,
        });
      }
      if (callIdx === 2) {
        // control evaluations for blockers
        return createBuilder({
          data: [
            {
              control_id: 'c1',
              framework_id: 'fw-1',
              compliance_score: 20,
              gap_description: 'Missing evidence',
            },
          ],
          error: null,
        });
      }
      // compliance_controls for blocker details
      return createBuilder({
        data: [{ id: 'c1', code: 'CC-1.1', title: 'Access Control' }],
        error: null,
      });
    });

    const forecast = await calculateAuditForecast('org-1');
    expect(forecast).toHaveProperty('readinessScore');
    expect(forecast).toHaveProperty('targetScore', 80);
    expect(forecast).toHaveProperty('improvementRate');
    expect(forecast).toHaveProperty('recommendations');
    expect(forecast.recommendations.length).toBeGreaterThan(0);
  });

  it('handles already-ready score', async () => {
    const readinessCalc = require('@/lib/audit/readiness-calculator');
    readinessCalc.calculateFrameworkReadiness.mockResolvedValueOnce([
      {
        frameworkId: 'fw-1',
        frameworkCode: 'SOC2',
        frameworkTitle: 'SOC 2',
        readinessScore: 90,
        totalControls: 100,
        satisfiedControls: 90,
        partialControls: 5,
        missingControls: 5,
        evaluatedAt: '2024-06-01T00:00:00Z',
      },
    ]);

    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) {
        return createBuilder({
          data: [
            { compliance_score: 85, captured_at: '2024-05-01' },
            { compliance_score: 88, captured_at: '2024-06-01' },
          ],
          error: null,
        });
      }
      return createBuilder({ data: [], error: null });
    });

    const forecast = await calculateAuditForecast('org-1');
    expect(forecast.readinessScore).toBe(90);
    expect(forecast.weeksTillReady).toBe(0);
  });

  it('returns zero forecast when no frameworks enabled', async () => {
    const readinessCalc = require('@/lib/audit/readiness-calculator');
    readinessCalc.calculateFrameworkReadiness.mockResolvedValueOnce([]);

    const forecast = await calculateAuditForecast('org-1');
    expect(forecast.readinessScore).toBe(0);
    expect(forecast.recommendations).toContain(
      'Enable at least one compliance framework to track audit readiness.',
    );
  });

  it('filters by target framework code', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      return createBuilder({ data: [], error: null });
    });

    const forecast = await calculateAuditForecast('org-1', 'SOC2');
    expect(forecast).toHaveProperty('readinessScore');
  });
});

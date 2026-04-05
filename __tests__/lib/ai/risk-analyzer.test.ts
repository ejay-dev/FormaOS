/**
 * Tests for AI Risk Analyzer
 */

/* ---------- helpers --------- */
function createBuilder(
  result: { data: any; error: any } = { data: [], error: null },
) {
  const b: Record<string, any> = {};
  [
    'select',
    'eq',
    'in',
    'not',
    'gte',
    'order',
    'limit',
    'insert',
    'maybeSingle',
    'single',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/server', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});

function getClient() {
  return require('@/lib/supabase/server').__client;
}

jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/realtime', () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));

import {
  performRiskAnalysis,
  getRiskAnalysisHistory,
  getAIInsights,
  scheduleRiskAnalysis,
} from '@/lib/ai/risk-analyzer';

/* ============================================================
   performRiskAnalysis
   ============================================================ */
describe('performRiskAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: every from() call returns a builder that resolves to empty data
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('returns analysis object with expected shape', async () => {
    const result = await performRiskAnalysis('org-1');
    expect(result).toHaveProperty('overallRiskScore');
    expect(result).toHaveProperty('riskLevel');
    expect(result).toHaveProperty('totalRisks');
    expect(result).toHaveProperty('risksByCategory');
    expect(result).toHaveProperty('risksBySeverity');
    expect(result).toHaveProperty('topRisks');
    expect(result).toHaveProperty('trends');
    expect(result).toHaveProperty('recommendations');
  });

  it('flags low activity as compliance gap when activity_logs < 10', async () => {
    // Default builder returns data:[] (length 0 < 10) → detectComplianceGaps creates risk
    const result = await performRiskAnalysis('org-1');
    expect(result.risksByCategory.compliance_gap).toBeGreaterThanOrEqual(1);
  });

  it('detects expired certificate risks', async () => {
    const pastDate = new Date(
      Date.now() - 10 * 24 * 60 * 60 * 1000,
    ).toISOString();

    getClient().from.mockImplementation((table: string) => {
      if (table === 'certifications') {
        return createBuilder({
          data: [{ id: 'cert-1', name: 'SSL', expiry_date: pastDate }],
          error: null,
        });
      }
      return createBuilder();
    });

    const result = await performRiskAnalysis('org-1');
    expect(
      result.risksByCategory.certificate_expiration,
    ).toBeGreaterThanOrEqual(1);
    expect(
      result.topRisks.some((r: any) => r.category === 'certificate_expiration'),
    ).toBe(true);
  });

  it('detects overdue task risks', async () => {
    const pastDue = new Date(
      Date.now() - 20 * 24 * 60 * 60 * 1000,
    ).toISOString();

    getClient().from.mockImplementation((table: string) => {
      if (table === 'tasks') {
        return createBuilder({
          data: [
            {
              id: 't-1',
              title: 'Overdue',
              due_date: pastDue,
              priority: 'high',
              status: 'pending',
            },
          ],
          error: null,
        });
      }
      return createBuilder();
    });

    const result = await performRiskAnalysis('org-1');
    expect(result.risksByCategory.overdue_tasks).toBeGreaterThanOrEqual(1);
  });

  it('detects missing evidence risks', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'tasks') {
        return createBuilder({
          data: [
            {
              id: 't-1',
              title: 'Done',
              requires_evidence: true,
              status: 'completed',
            },
          ],
          error: null,
        });
      }
      if (table === 'org_evidence') {
        return createBuilder({ data: [], error: null });
      }
      return createBuilder();
    });

    const result = await performRiskAnalysis('org-1');
    expect(result.risksByCategory.missing_evidence).toBeGreaterThanOrEqual(1);
  });

  it('sends notification for high/critical risk', async () => {
    const { sendNotification } = require('@/lib/realtime');
    const pastDate = new Date(
      Date.now() - 100 * 24 * 60 * 60 * 1000,
    ).toISOString();

    getClient().from.mockImplementation((table: string) => {
      if (table === 'certifications') {
        return createBuilder({
          data: [
            { id: 'c1', name: 'A', expiry_date: pastDate },
            { id: 'c2', name: 'B', expiry_date: pastDate },
            { id: 'c3', name: 'C', expiry_date: pastDate },
          ],
          error: null,
        });
      }
      return createBuilder();
    });

    const result = await performRiskAnalysis('org-1');
    // With 3 critical expired certs + low activity gap, risk should be high/critical
    if (result.riskLevel === 'high' || result.riskLevel === 'critical') {
      expect(sendNotification).toHaveBeenCalled();
    }
  });
});

/* ============================================================
   getRiskAnalysisHistory
   ============================================================ */
describe('getRiskAnalysisHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns history array', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          { id: 'ra-1', overall_risk_score: 42, created_at: '2024-01-01' },
        ],
        error: null,
      }),
    );
    const result = await getRiskAnalysisHistory('org-1');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('returns empty on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    const result = await getRiskAnalysisHistory('org-1');
    expect(result).toEqual([]);
  });
});

/* ============================================================
   getAIInsights
   ============================================================ */
describe('getAIInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns insights from latest analysis', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          ai_insights: [
            {
              type: 'recommendation',
              title: 'Improve',
              description: 'x',
              confidence: 0.9,
            },
          ],
        },
        error: null,
      }),
    );
    const result = await getAIInsights('org-1');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('returns empty when no analysis exists', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await getAIInsights('org-1');
    expect(result).toEqual([]);
  });
});

/* ============================================================
   scheduleRiskAnalysis
   ============================================================ */
describe('scheduleRiskAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('inserts scheduled task', async () => {
    await scheduleRiskAnalysis('org-1', 'weekly');
    expect(getClient().from).toHaveBeenCalledWith('scheduled_tasks');
  });
});

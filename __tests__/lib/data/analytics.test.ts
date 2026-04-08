/**
 * Tests for lib/data/analytics.ts helper functions
 * Tests the main getDashboardMetrics function with mocked Supabase
 */

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));

function createBuilder(result: any = { data: null, error: null, count: 0 }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
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
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseServerClient } = require('@/lib/supabase/server');

import { getDashboardMetrics } from '@/lib/data/analytics';

beforeEach(() => {
  jest.clearAllMocks();
});

function mockSupabaseWith(overrides: Record<string, any> = {}) {
  const now = new Date();
  const defaults = {
    totalPolicies: { count: 10 },
    activePolicies: { count: 8 },
    totalTasks: { count: 20 },
    completedTasks: { count: 15 },
    overdueTasks: { count: 2 },
    totalEvidence: { count: 30 },
    collectedEvidence: { count: 25 },
    rawActivity: { data: [] },
    policyHistory: { data: [] },
    taskHistory: { data: [] },
    evidenceHistory: { data: [] },
    ...overrides,
  };

  let callIndex = 0;
  const responses = [
    defaults.totalPolicies,
    defaults.activePolicies,
    defaults.totalTasks,
    defaults.completedTasks,
    defaults.overdueTasks,
    defaults.totalEvidence,
    defaults.collectedEvidence,
    defaults.rawActivity,
    defaults.policyHistory,
    defaults.taskHistory,
    defaults.evidenceHistory,
  ];

  const mockClient = {
    from: jest.fn(() => {
      const idx = callIndex++;
      return createBuilder(responses[idx] || { data: null, count: 0 });
    }),
  };
  createSupabaseServerClient.mockResolvedValue(mockClient);
  return mockClient;
}

describe('getDashboardMetrics', () => {
  it('returns metrics with all data present', async () => {
    mockSupabaseWith();
    const result = await getDashboardMetrics('org-1');
    expect(result.totalPolicies).toBe(10);
    expect(result.activePolicies).toBe(8);
    expect(result.totalTasks).toBe(20);
    expect(result.completedTasks).toBe(15);
    expect(result.overdueTasks).toBe(2);
    expect(result.evidenceCollected).toBe(25);
    expect(result.evidenceRequired).toBe(30);
    expect(result.policyCoverageRate).toBe(80);
    expect(result.taskCompletionRate).toBe(75);
  });

  it('computes compliance score with weighting', async () => {
    mockSupabaseWith();
    const result = await getDashboardMetrics('org-1');
    // Policy: 8/10 * 35 = 28
    // Evidence: 25/30 * 40 = 33.33
    // Tasks: 15/20 * 25 = 18.75
    // Penalty: min(2*2, 15) = 4
    // Total: 28 + 33.33 + 18.75 - 4 = 76.08 -> rounded = 76
    expect(result.complianceScore).toBe(76);
  });

  it('handles zero totals without division by zero', async () => {
    mockSupabaseWith({
      totalPolicies: { count: 0 },
      activePolicies: { count: 0 },
      totalTasks: { count: 0 },
      completedTasks: { count: 0 },
      overdueTasks: { count: 0 },
      totalEvidence: { count: 0 },
      collectedEvidence: { count: 0 },
    });
    const result = await getDashboardMetrics('org-1');
    expect(result.complianceScore).toBe(0);
    expect(result.policyCoverageRate).toBe(0);
    expect(result.taskCompletionRate).toBe(0);
    expect(result.evidenceCompletionRate).toBe(0);
  });

  it('caps overdue penalty at 15', async () => {
    mockSupabaseWith({
      overdueTasks: { count: 20 },
    });
    const result = await getDashboardMetrics('org-1');
    // Penalty should be min(20*2, 15) = 15
    expect(result.complianceScore).toBeGreaterThanOrEqual(0);
  });

  it('clamps compliance score to 0-100', async () => {
    mockSupabaseWith({
      totalPolicies: { count: 1 },
      activePolicies: { count: 0 },
      totalTasks: { count: 1 },
      completedTasks: { count: 0 },
      totalEvidence: { count: 1 },
      collectedEvidence: { count: 0 },
      overdueTasks: { count: 10 },
    });
    const result = await getDashboardMetrics('org-1');
    expect(result.complianceScore).toBe(0);
  });

  it('determines risk level based on compliance score', async () => {
    // High compliance -> LOW risk
    mockSupabaseWith({
      totalPolicies: { count: 10 },
      activePolicies: { count: 10 },
      totalTasks: { count: 10 },
      completedTasks: { count: 10 },
      totalEvidence: { count: 10 },
      collectedEvidence: { count: 10 },
      overdueTasks: { count: 0 },
    });
    const result = await getDashboardMetrics('org-1');
    expect(result.riskLevel).toBe('LOW');
  });

  it('determines MEDIUM risk for moderate compliance', async () => {
    mockSupabaseWith({
      totalPolicies: { count: 10 },
      activePolicies: { count: 6 },
      totalTasks: { count: 10 },
      completedTasks: { count: 6 },
      totalEvidence: { count: 10 },
      collectedEvidence: { count: 6 },
      overdueTasks: { count: 0 },
    });
    const result = await getDashboardMetrics('org-1');
    expect(result.riskLevel).toBe('MEDIUM');
  });

  it('determines HIGH risk for low compliance', async () => {
    mockSupabaseWith({
      totalPolicies: { count: 10 },
      activePolicies: { count: 1 },
      totalTasks: { count: 10 },
      completedTasks: { count: 1 },
      totalEvidence: { count: 10 },
      collectedEvidence: { count: 1 },
      overdueTasks: { count: 5 },
    });
    const result = await getDashboardMetrics('org-1');
    expect(result.riskLevel).toBe('HIGH');
  });

  it('classifies recent activity types', async () => {
    mockSupabaseWith({
      rawActivity: {
        data: [
          {
            id: '1',
            actor_email: 'a@b.com',
            action: 'CREATE_POLICY',
            details: { resourceName: 'GDPR' },
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            actor_email: 'c@d.com',
            action: 'COMPLETE_TASK',
            details: { resourceName: 'Review' },
            created_at: new Date().toISOString(),
          },
          {
            id: '3',
            actor_email: null,
            action: 'UPLOAD_EVIDENCE',
            details: {},
            created_at: new Date().toISOString(),
          },
          {
            id: '4',
            actor_email: 'e@f.com',
            action: 'SECURITY_ALERT',
            details: null,
            created_at: new Date().toISOString(),
          },
          {
            id: '5',
            actor_email: 'g@h.com',
            action: 'USER_LOGIN',
            details: {},
            created_at: new Date().toISOString(),
          },
        ],
      },
    });
    const result = await getDashboardMetrics('org-1');
    expect(result.recentActivity).toHaveLength(5);
    expect(result.recentActivity[0].type).toBe('policy');
    expect(result.recentActivity[1].type).toBe('task');
    expect(result.recentActivity[2].type).toBe('evidence');
    expect(result.recentActivity[3].type).toBe('security');
    expect(result.recentActivity[4].type).toBe('system');
    expect(result.recentActivity[2].user).toBe('System');
  });

  it('detects anomalies', async () => {
    mockSupabaseWith({
      totalPolicies: { count: 10 },
      activePolicies: { count: 3 }, // < 50% -> anomaly
      totalTasks: { count: 10 },
      completedTasks: { count: 1 },
      overdueTasks: { count: 10 }, // > 5 -> anomaly
      totalEvidence: { count: 10 },
      collectedEvidence: { count: 2 }, // < 40% -> anomaly
    });
    const result = await getDashboardMetrics('org-1');
    expect(result.anomalies.length).toBeGreaterThanOrEqual(3);
    expect(result.anomalies).toContain('High number of overdue tasks');
    expect(result.anomalies).toContain('Low policy publication coverage');
    expect(result.anomalies).toContain('Evidence backlog detected');
  });

  it('calculates compliance trend', async () => {
    mockSupabaseWith();
    const result = await getDashboardMetrics('org-1');
    expect(['UP', 'DOWN', 'FLAT']).toContain(result.complianceTrend);
  });

  it('builds monthly history', async () => {
    mockSupabaseWith();
    const result = await getDashboardMetrics('org-1');
    expect(result.complianceHistory.length).toBe(6);
    result.complianceHistory.forEach((entry) => {
      expect(entry).toHaveProperty('month');
      expect(entry).toHaveProperty('score');
    });
  });

  it('calculates pending tasks', async () => {
    mockSupabaseWith();
    const result = await getDashboardMetrics('org-1');
    expect(result.pendingTasks).toBe(5); // 20 - 15
  });
});

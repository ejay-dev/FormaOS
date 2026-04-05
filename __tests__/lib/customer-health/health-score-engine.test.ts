import {
  getHealthStatus,
  calculateHealthScore,
} from '@/lib/customer-health/health-score-engine';
import type { HealthScoreInput } from '@/lib/customer-health/health-types';

function makeInput(
  overrides: Partial<HealthScoreInput> = {},
): HealthScoreInput {
  return {
    orgId: 'org-1',
    orgName: 'Acme',
    industry: 'tech',
    plan: 'pro',
    memberCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
    loginCountLast7Days: 5,
    loginCountLast30Days: 20,
    featuresUsed: ['compliance', 'workflows', 'reports', 'evidence'],
    totalFeatures: 5,
    currentComplianceScore: 80,
    previousComplianceScore: 70,
    complianceTrendDays: 30,
    workflowsConfigured: 3,
    workflowsTriggeredLast30Days: 40,
    overdueTasksCount: 0,
    overdueEvidenceCount: 0,
    overdueReviewsCount: 0,
    lastLoginAt: '2024-06-01T00:00:00Z',
    isTrialing: false,
    trialDaysRemaining: null,
    ...overrides,
  };
}

describe('getHealthStatus', () => {
  it('returns Healthy for 75+', () => {
    expect(getHealthStatus(75)).toBe('Healthy');
    expect(getHealthStatus(100)).toBe('Healthy');
  });

  it('returns Warning for 50-74', () => {
    expect(getHealthStatus(50)).toBe('Warning');
    expect(getHealthStatus(74)).toBe('Warning');
  });

  it('returns At Risk for 25-49', () => {
    expect(getHealthStatus(25)).toBe('At Risk');
    expect(getHealthStatus(49)).toBe('At Risk');
  });

  it('returns Critical for 0-24', () => {
    expect(getHealthStatus(0)).toBe('Critical');
    expect(getHealthStatus(24)).toBe('Critical');
  });
});

describe('calculateHealthScore', () => {
  describe('loginFrequency factor', () => {
    it('scores 25 for daily active (5+ logins in 7 days)', () => {
      const result = calculateHealthScore(
        makeInput({ loginCountLast7Days: 5 }),
      );
      expect(result.factors.loginFrequency.score).toBe(25);
    });

    it('scores 15 for weekly active (3-4 logins in 7 days)', () => {
      const result = calculateHealthScore(
        makeInput({ loginCountLast7Days: 3, loginCountLast30Days: 10 }),
      );
      expect(result.factors.loginFrequency.score).toBe(15);
    });

    it('scores 10 for biweekly (4+ logins in 30 days)', () => {
      const result = calculateHealthScore(
        makeInput({ loginCountLast7Days: 1, loginCountLast30Days: 4 }),
      );
      expect(result.factors.loginFrequency.score).toBe(10);
    });

    it('scores 5 for monthly (1+ logins in 30 days)', () => {
      const result = calculateHealthScore(
        makeInput({ loginCountLast7Days: 0, loginCountLast30Days: 1 }),
      );
      expect(result.factors.loginFrequency.score).toBe(5);
    });

    it('scores 0 for inactive (no logins)', () => {
      const result = calculateHealthScore(
        makeInput({ loginCountLast7Days: 0, loginCountLast30Days: 0 }),
      );
      expect(result.factors.loginFrequency.score).toBe(0);
    });
  });

  describe('featureAdoption factor', () => {
    it('scores max for 80%+ adoption', () => {
      const result = calculateHealthScore(
        makeInput({ featuresUsed: ['a', 'b', 'c', 'd'], totalFeatures: 5 }),
      );
      expect(result.factors.featureAdoption.score).toBe(20);
      expect(result.factors.featureAdoption.description).toContain(
        'Power user',
      );
    });

    it('scores proportionally with low adoption', () => {
      const result = calculateHealthScore(
        makeInput({ featuresUsed: ['a'], totalFeatures: 10 }),
      );
      expect(result.factors.featureAdoption.score).toBe(3); // Math.round(0.1*25) = 3
    });

    it('handles zero total features', () => {
      const result = calculateHealthScore(
        makeInput({ featuresUsed: [], totalFeatures: 0 }),
      );
      expect(result.factors.featureAdoption.score).toBe(0);
    });
  });

  describe('complianceTrend factor', () => {
    it('scores 25 for large improvement (>5 points)', () => {
      const result = calculateHealthScore(
        makeInput({ currentComplianceScore: 80, previousComplianceScore: 70 }),
      );
      expect(result.factors.complianceTrend.score).toBe(25);
      expect(result.factors.complianceTrend.trend).toBe('up');
    });

    it('scores 20 for small improvement (0<=x<=5)', () => {
      const result = calculateHealthScore(
        makeInput({ currentComplianceScore: 73, previousComplianceScore: 70 }),
      );
      expect(result.factors.complianceTrend.score).toBe(20);
    });

    it('scores 15 for stable (-2 to 0)', () => {
      const result = calculateHealthScore(
        makeInput({ currentComplianceScore: 69, previousComplianceScore: 70 }),
      );
      expect(result.factors.complianceTrend.score).toBe(15);
      expect(result.factors.complianceTrend.trend).toBe('stable');
    });

    it('scores 10 for moderate decline (-10 to -2)', () => {
      const result = calculateHealthScore(
        makeInput({ currentComplianceScore: 65, previousComplianceScore: 70 }),
      );
      expect(result.factors.complianceTrend.score).toBe(10);
      expect(result.factors.complianceTrend.trend).toBe('down');
    });

    it('scores 5 for significant decline (>10)', () => {
      const result = calculateHealthScore(
        makeInput({ currentComplianceScore: 50, previousComplianceScore: 70 }),
      );
      expect(result.factors.complianceTrend.score).toBe(5);
    });
  });

  describe('automationUsage factor', () => {
    it('scores 0 when no workflows configured', () => {
      const result = calculateHealthScore(
        makeInput({ workflowsConfigured: 0, workflowsTriggeredLast30Days: 0 }),
      );
      expect(result.factors.automationUsage.score).toBe(0);
    });

    it('scores 15 for excellent (trigger rate >=10)', () => {
      const result = calculateHealthScore(
        makeInput({ workflowsConfigured: 3, workflowsTriggeredLast30Days: 40 }),
      );
      expect(result.factors.automationUsage.score).toBe(15);
    });

    it('scores 12 for good (trigger rate 5-9)', () => {
      const result = calculateHealthScore(
        makeInput({ workflowsConfigured: 3, workflowsTriggeredLast30Days: 20 }),
      );
      expect(result.factors.automationUsage.score).toBe(12);
    });

    it('scores 8 for moderate (trigger rate 1-4)', () => {
      const result = calculateHealthScore(
        makeInput({ workflowsConfigured: 3, workflowsTriggeredLast30Days: 5 }),
      );
      expect(result.factors.automationUsage.score).toBe(8);
    });

    it('scores 4 for low (trigger rate <1)', () => {
      const result = calculateHealthScore(
        makeInput({ workflowsConfigured: 5, workflowsTriggeredLast30Days: 1 }),
      );
      expect(result.factors.automationUsage.score).toBe(4);
    });
  });

  describe('overdueCompliance factor', () => {
    it('scores 10 with no overdue items', () => {
      const result = calculateHealthScore(makeInput());
      expect(result.factors.overdueCompliance.score).toBe(10);
    });

    it('applies -2 penalty per overdue item', () => {
      const result = calculateHealthScore(
        makeInput({ overdueTasksCount: 2, overdueEvidenceCount: 1 }),
      );
      expect(result.factors.overdueCompliance.score).toBe(4); // 10 - min(6,10)
    });

    it('caps penalty at -10', () => {
      const result = calculateHealthScore(
        makeInput({ overdueTasksCount: 10, overdueEvidenceCount: 5 }),
      );
      expect(result.factors.overdueCompliance.score).toBe(0);
    });
  });

  describe('overall score', () => {
    it('returns clamped 0-100 score', () => {
      const result = calculateHealthScore(makeInput());
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('sums all factor scores', () => {
      const result = calculateHealthScore(makeInput());
      const sum =
        result.factors.loginFrequency.score +
        result.factors.featureAdoption.score +
        result.factors.complianceTrend.score +
        result.factors.automationUsage.score +
        result.factors.overdueCompliance.score;
      expect(result.score).toBe(sum);
    });

    it('includes orgId and orgName', () => {
      const result = calculateHealthScore(makeInput());
      expect(result.orgId).toBe('org-1');
      expect(result.orgName).toBe('Acme');
    });
  });

  describe('alerts', () => {
    it('generates critical login alert when inactive', () => {
      const result = calculateHealthScore(
        makeInput({ loginCountLast7Days: 0, loginCountLast30Days: 0 }),
      );
      expect(
        result.alerts.some(
          (a) => a.category === 'login_activity' && a.type === 'critical',
        ),
      ).toBe(true);
    });

    it('generates warning login alert for low activity', () => {
      const result = calculateHealthScore(
        makeInput({ loginCountLast7Days: 0, loginCountLast30Days: 1 }),
      );
      expect(
        result.alerts.some(
          (a) => a.category === 'login_activity' && a.type === 'warning',
        ),
      ).toBe(true);
    });

    it('generates feature adoption warning when <25%', () => {
      const result = calculateHealthScore(
        makeInput({ featuresUsed: ['a'], totalFeatures: 10 }),
      );
      expect(result.alerts.some((a) => a.category === 'feature_usage')).toBe(
        true,
      );
    });

    it('generates compliance decline alert when trending down', () => {
      const result = calculateHealthScore(
        makeInput({ currentComplianceScore: 50, previousComplianceScore: 70 }),
      );
      expect(
        result.alerts.some((a) => a.category === 'compliance_decline'),
      ).toBe(true);
    });

    it('generates critical overdue alert for 5+ items', () => {
      const result = calculateHealthScore(
        makeInput({ overdueTasksCount: 3, overdueEvidenceCount: 2 }),
      );
      expect(
        result.alerts.some(
          (a) => a.category === 'overdue_items' && a.type === 'critical',
        ),
      ).toBe(true);
    });

    it('generates warning overdue alert for 2-4 items', () => {
      const result = calculateHealthScore(makeInput({ overdueTasksCount: 2 }));
      expect(
        result.alerts.some(
          (a) => a.category === 'overdue_items' && a.type === 'warning',
        ),
      ).toBe(true);
    });

    it('generates trial expiring alert', () => {
      const result = calculateHealthScore(
        makeInput({ isTrialing: true, trialDaysRemaining: 2 }),
      );
      expect(result.alerts.some((a) => a.category === 'trial_expiring')).toBe(
        true,
      );
    });

    it('no alerts for healthy input', () => {
      const result = calculateHealthScore(makeInput());
      expect(result.alerts).toHaveLength(0);
    });
  });

  describe('recommendations', () => {
    it('recommends engagement when low login frequency', () => {
      const result = calculateHealthScore(
        makeInput({ loginCountLast7Days: 0, loginCountLast30Days: 1 }),
      );
      expect(
        result.recommendedActions.some(
          (r) => r.includes('check-in') || r.includes('re-engagement'),
        ),
      ).toBe(true);
    });

    it('recommends onboarding for low feature adoption', () => {
      const result = calculateHealthScore(
        makeInput({ featuresUsed: ['a'], totalFeatures: 10 }),
      );
      expect(
        result.recommendedActions.some((r) => r.includes('onboarding')),
      ).toBe(true);
    });

    it('recommends workflow setup when none configured', () => {
      const result = calculateHealthScore(
        makeInput({ workflowsConfigured: 0, workflowsTriggeredLast30Days: 0 }),
      );
      expect(
        result.recommendedActions.some((r) => r.includes('workflow')),
      ).toBe(true);
    });

    it('recommends addressing overdue items', () => {
      const result = calculateHealthScore(makeInput({ overdueTasksCount: 3 }));
      expect(result.recommendedActions.some((r) => r.includes('overdue'))).toBe(
        true,
      );
    });

    it('recommends trial conversion', () => {
      const result = calculateHealthScore(makeInput({ isTrialing: true }));
      expect(result.recommendedActions.some((r) => r.includes('trial'))).toBe(
        true,
      );
    });
  });
});

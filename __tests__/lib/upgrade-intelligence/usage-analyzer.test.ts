/**
 * Tests for lib/upgrade-intelligence/usage-analyzer.ts
 * Focuses on pure function: getUsagePercentage
 * Plus analyzeUsage and buildUpgradeContext with mocked DB
 */

jest.mock('server-only', () => ({}));

function createBuilder(result = { data: null, error: null, count: null }) {
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

const mockAdmin: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => mockAdmin),
}));

import {
  getUsagePercentage,
  analyzeUsage,
  buildUpgradeContext,
} from '@/lib/upgrade-intelligence/usage-analyzer';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getUsagePercentage', () => {
  it('returns 0 for Infinity limit', () => {
    expect(getUsagePercentage(50, Infinity)).toBe(0);
  });

  it('returns 0 for zero limit', () => {
    expect(getUsagePercentage(50, 0)).toBe(0);
  });

  it('calculates percentage correctly', () => {
    expect(getUsagePercentage(5, 10)).toBe(50);
    expect(getUsagePercentage(3, 10)).toBe(30);
    expect(getUsagePercentage(10, 10)).toBe(100);
  });

  it('caps at 100%', () => {
    expect(getUsagePercentage(15, 10)).toBe(100);
  });

  it('rounds the result', () => {
    expect(getUsagePercentage(1, 3)).toBe(33);
  });
});

describe('analyzeUsage', () => {
  it('returns metrics with default trial limits', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: [], error: null, count: 0 }),
    );

    const result = await analyzeUsage('org-1');
    expect(result.teamMemberLimit).toBe(5);
    expect(result.evidenceLimit).toBe(50);
    expect(result.frameworkLimit).toBe(1);
    expect(result.workflowLimit).toBe(2);
  });

  it('returns metrics with pro limits', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: [], error: null, count: 0 }),
    );

    const result = await analyzeUsage('org-1', 'pro');
    expect(result.teamMemberLimit).toBe(50);
    expect(result.evidenceLimit).toBe(1000);
  });

  it('detects approaching limits', async () => {
    // Simulate: 4 team members out of 5 limit = 80% = high urgency
    let callIndex = 0;
    mockAdmin.from = jest.fn(() => {
      callIndex++;
      if (callIndex === 1) {
        // org_members
        return createBuilder({ data: null, error: null, count: 4 });
      }
      return createBuilder({ data: [], error: null, count: 0 });
    });

    const result = await analyzeUsage('org-1', 'trial');
    const teamLimit = result.approachingLimits.find(
      (l) => l.resource === 'Team Members',
    );
    expect(teamLimit).toBeTruthy();
    expect(teamLimit!.percentage).toBe(80);
    expect(teamLimit!.urgency).toBe('medium');
  });

  it('detects critical approaching limits at 100%', async () => {
    let callIndex = 0;
    mockAdmin.from = jest.fn(() => {
      callIndex++;
      if (callIndex === 1) {
        // org_members
        return createBuilder({ data: null, error: null, count: 5 });
      }
      return createBuilder({ data: [], error: null, count: 0 });
    });

    const result = await analyzeUsage('org-1', 'trial');
    const teamLimit = result.approachingLimits.find(
      (l) => l.resource === 'Team Members',
    );
    expect(teamLimit).toBeTruthy();
    expect(teamLimit!.urgency).toBe('critical');
  });

  it('skips approaching limits below 50%', async () => {
    let callIndex = 0;
    mockAdmin.from = jest.fn(() => {
      callIndex++;
      if (callIndex === 1) {
        // org_members - 1 of 5 = 20%
        return createBuilder({ data: null, error: null, count: 1 });
      }
      return createBuilder({ data: [], error: null, count: 0 });
    });

    const result = await analyzeUsage('org-1', 'trial');
    const teamLimit = result.approachingLimits.find(
      (l) => l.resource === 'Team Members',
    );
    expect(teamLimit).toBeUndefined();
  });

  it('extracts unique features from audit logs', async () => {
    let callIndex = 0;
    mockAdmin.from = jest.fn(() => {
      callIndex++;
      if (callIndex === 7) {
        // activity result
        return createBuilder({
          data: [
            { action: 'task.create' },
            { action: 'evidence.upload' },
            { action: 'task.update' },
            { action: undefined },
          ],
          error: null,
          count: 0,
        });
      }
      return createBuilder({ data: [], error: null, count: 0 });
    });

    const result = await analyzeUsage('org-1', 'trial');
    expect(result.featuresUsed).toContain('task');
    expect(result.featuresUsed).toContain('evidence');
  });

  it('does not track approaching limits for enterprise (Infinity)', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: null, error: null, count: 100 }),
    );

    const result = await analyzeUsage('org-1', 'enterprise');
    expect(result.approachingLimits.length).toBe(0);
  });
});

describe('buildUpgradeContext', () => {
  it('recommends enterprise for SSO feature', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: [], error: null, count: 0 }),
    );

    const context = await buildUpgradeContext('org-1', 'sso-saml');
    expect(context.recommendedPlan).toBe('enterprise');
  });

  it('recommends enterprise for team-unlimited feature', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: [], error: null, count: 0 }),
    );

    const context = await buildUpgradeContext('org-1', 'team-unlimited');
    expect(context.recommendedPlan).toBe('enterprise');
  });

  it('defaults to pro for non-enterprise features', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: [], error: null, count: 0 }),
    );

    const context = await buildUpgradeContext('org-1', 'reports');
    expect(context.recommendedPlan).toBe('pro');
  });

  it('returns low urgency when no approaching limits', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: [], error: null, count: 0 }),
    );

    const context = await buildUpgradeContext('org-1', 'reports');
    expect(context.urgencyLevel).toBe('low');
  });

  it('adds personalized benefits for high usage', async () => {
    let callIndex = 0;
    mockAdmin.from = jest.fn(() => {
      callIndex++;
      if (callIndex === 5) {
        // tasks completed
        return createBuilder({ data: null, error: null, count: 25 });
      }
      if (callIndex === 6) {
        // logins
        return createBuilder({ data: null, error: null, count: 60 });
      }
      return createBuilder({ data: [], error: null, count: 0 });
    });

    const context = await buildUpgradeContext('org-1', 'reports');
    expect(context.personalizedBenefits.length).toBeGreaterThan(0);
  });
});

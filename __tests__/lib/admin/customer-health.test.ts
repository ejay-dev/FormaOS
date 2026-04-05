import { getAdminOrgHealthSnapshot } from '@/lib/admin/customer-health';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock activation telemetry
jest.mock('@/lib/analytics/activation-telemetry', () => ({
  calculateActivationScore: jest.fn((milestones: Record<string, boolean>) => {
    const total = Object.keys(milestones).length;
    const completed = Object.values(milestones).filter(Boolean).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }),
  getActivationStatus: jest.fn((score: number) => ({
    label: score >= 80 ? 'Activated' : score >= 40 ? 'Progressing' : 'New',
    color: score >= 80 ? 'green' : score >= 40 ? 'yellow' : 'gray',
    description: `Score: ${score}`,
  })),
}));

// Mock schema-compat
jest.mock('@/lib/supabase/schema-compat', () => ({
  isMissingSupabaseColumnError: jest.fn(() => false),
}));

// Build a flexible mock that handles the parallel queries
function createAdminMock(
  overrides: {
    organization?: any;
    subscription?: any;
    cachedHealth?: any;
    memberCount?: number;
    evidenceCount?: number;
    policyCount?: number;
    controlCount?: number;
    reportExportCount?: number;
    complianceExportCount?: number;
  } = {},
) {
  const {
    organization = {
      id: 'org-1',
      created_at: '2025-01-01',
      frameworks: ['soc2'],
      onboarding_completed: true,
      lifecycle_status: 'active',
    },
    subscription = {
      status: 'active',
      trial_expires_at: null,
      current_period_end: null,
      payment_failures: 0,
      grace_period_end: null,
    },
    cachedHealth = null,
    memberCount = 3,
    evidenceCount = 5,
    policyCount = 2,
    controlCount = 10,
    reportExportCount = 1,
    complianceExportCount = 0,
  } = overrides;

  let callIndex = 0;
  const responses = [
    { data: organization, error: null }, // organizations
    { data: subscription, error: null }, // org_subscriptions
    { data: cachedHealth, error: null }, // org_health_scores
    { data: null, error: null, count: memberCount }, // org_members
    { data: null, error: null, count: evidenceCount }, // org_evidence
    { data: null, error: null, count: policyCount }, // org_policies
    { data: null, error: null, count: controlCount }, // org_control_evaluations
    { data: null, error: null, count: reportExportCount }, // report_export_jobs
    { data: null, error: null, count: complianceExportCount }, // compliance_export_jobs
  ];

  const chain: any = {};
  chain.from = jest.fn().mockReturnValue(chain);
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.maybeSingle = jest.fn().mockReturnValue(chain);
  chain.then = jest.fn((resolve: any) => {
    const response = responses[callIndex] || {
      data: null,
      error: null,
      count: 0,
    };
    callIndex++;
    return resolve(response);
  });

  return chain;
}

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

describe('getAdminOrgHealthSnapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns complete snapshot with healthy org', async () => {
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    createSupabaseAdminClient.mockReturnValue(createAdminMock());

    const result = await getAdminOrgHealthSnapshot('org-1');

    expect(result.activation).toBeDefined();
    expect(result.activation.onboardingCompleted).toBe(true);
    expect(result.activation.score).toBeGreaterThan(0);
    expect(result.activation.label).toBeDefined();

    expect(result.billingRisk.level).toBe('low');
    expect(result.billingRisk.reasons).toEqual([]);

    expect(result.metrics.memberCount).toBe(3);
    expect(result.metrics.evidenceCount).toBe(5);
    expect(result.metrics.policyCount).toBe(2);
    expect(result.metrics.controlCount).toBe(10);
    expect(result.metrics.exportCount).toBe(1);
  });

  it('calculates milestones correctly', async () => {
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    createSupabaseAdminClient.mockReturnValue(
      createAdminMock({
        organization: {
          id: 'org-1',
          created_at: '2025-01-01',
          frameworks: ['soc2'],
          onboarding_completed: true,
          lifecycle_status: 'active',
        },
        memberCount: 3,
        evidenceCount: 5,
        policyCount: 2,
        controlCount: 10,
        reportExportCount: 1,
      }),
    );

    const result = await getAdminOrgHealthSnapshot('org-1');

    expect(result.activation.milestones.frameworkEnabled).toBe(true);
    expect(result.activation.milestones.evidenceMapped).toBe(true);
    expect(result.activation.milestones.policyCreated).toBe(true);
    expect(result.activation.milestones.teamInvited).toBe(true);
    expect(result.activation.milestones.reportGenerated).toBe(true);
    expect(result.activation.milestones.controlMapped).toBe(true);
    expect(result.activation.missingMilestones).toEqual([]);
  });

  it('identifies missing milestones', async () => {
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    createSupabaseAdminClient.mockReturnValue(
      createAdminMock({
        organization: {
          id: 'org-1',
          created_at: '2025-01-01',
          frameworks: [],
          onboarding_completed: false,
          lifecycle_status: 'active',
        },
        memberCount: 1,
        evidenceCount: 0,
        policyCount: 0,
        controlCount: 0,
        reportExportCount: 0,
        complianceExportCount: 0,
      }),
    );

    const result = await getAdminOrgHealthSnapshot('org-1');

    expect(result.activation.milestones.frameworkEnabled).toBe(false);
    expect(result.activation.milestones.evidenceMapped).toBe(false);
    expect(result.activation.milestones.teamInvited).toBe(false);
    expect(result.activation.missingMilestones.length).toBeGreaterThan(0);
  });

  it('detects billing risk for past_due subscription', async () => {
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    createSupabaseAdminClient.mockReturnValue(
      createAdminMock({
        subscription: {
          status: 'past_due',
          trial_expires_at: null,
          current_period_end: null,
          payment_failures: 0,
          grace_period_end: null,
        },
      }),
    );

    const result = await getAdminOrgHealthSnapshot('org-1');
    expect(result.billingRisk.level).toBe('high');
    expect(result.billingRisk.reasons.length).toBeGreaterThan(0);
  });

  it('detects billing risk for payment failures', async () => {
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    createSupabaseAdminClient.mockReturnValue(
      createAdminMock({
        subscription: {
          status: 'active',
          trial_expires_at: null,
          current_period_end: null,
          payment_failures: 2,
          grace_period_end: null,
        },
      }),
    );

    const result = await getAdminOrgHealthSnapshot('org-1');
    expect(result.billingRisk.level).toBe('watch');
    expect(result.billingRisk.reasons).toEqual(
      expect.arrayContaining([expect.stringContaining('payment failure')]),
    );
  });

  it('detects trial expiring soon', async () => {
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    createSupabaseAdminClient.mockReturnValue(
      createAdminMock({
        subscription: {
          status: 'trialing',
          trial_expires_at: tomorrow,
          current_period_end: null,
          payment_failures: 0,
          grace_period_end: null,
        },
      }),
    );

    const result = await getAdminOrgHealthSnapshot('org-1');
    expect(result.billingRisk.trialDaysRemaining).toBeLessThanOrEqual(2);
  });

  it('detects retired lifecycle status', async () => {
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    createSupabaseAdminClient.mockReturnValue(
      createAdminMock({
        organization: {
          id: 'org-1',
          created_at: '2025-01-01',
          frameworks: ['soc2'],
          onboarding_completed: true,
          lifecycle_status: 'retired',
        },
      }),
    );

    const result = await getAdminOrgHealthSnapshot('org-1');
    expect(result.billingRisk.level).toBe('high');
    expect(result.billingRisk.reasons).toEqual(
      expect.arrayContaining([expect.stringContaining('retired')]),
    );
    expect(result.nextBestActions).toEqual(
      expect.arrayContaining([expect.stringContaining('retirement')]),
    );
  });

  it('detects suspended lifecycle status', async () => {
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    createSupabaseAdminClient.mockReturnValue(
      createAdminMock({
        organization: {
          id: 'org-1',
          created_at: '2025-01-01',
          frameworks: ['soc2'],
          onboarding_completed: true,
          lifecycle_status: 'suspended',
        },
      }),
    );

    const result = await getAdminOrgHealthSnapshot('org-1');
    expect(result.billingRisk.level).toBe('high');
    expect(result.nextBestActions).toEqual(
      expect.arrayContaining([expect.stringContaining('suspension')]),
    );
  });

  it('suggests next best actions for incomplete onboarding', async () => {
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    createSupabaseAdminClient.mockReturnValue(
      createAdminMock({
        organization: {
          id: 'org-1',
          created_at: '2025-01-01',
          frameworks: [],
          onboarding_completed: false,
          lifecycle_status: 'active',
        },
        memberCount: 1,
        evidenceCount: 0,
        policyCount: 0,
        controlCount: 0,
        reportExportCount: 0,
      }),
    );

    const result = await getAdminOrgHealthSnapshot('org-1');
    expect(result.nextBestActions.length).toBeGreaterThan(0);
    expect(result.nextBestActions).toEqual(
      expect.arrayContaining([expect.stringContaining('onboarding')]),
    );
  });

  it('includes health score when cached data exists', async () => {
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    createSupabaseAdminClient.mockReturnValue(
      createAdminMock({
        cachedHealth: {
          score: 85,
          status: 'healthy',
          alerts: ['alert1'],
          recommended_actions: ['action1', 'action2'],
          last_login_at: '2025-01-15T10:00:00Z',
          calculated_at: '2025-01-15T12:00:00Z',
        },
      }),
    );

    const result = await getAdminOrgHealthSnapshot('org-1');
    expect(result.healthScore).not.toBeNull();
    expect(result.healthScore!.score).toBe(85);
    expect(result.healthScore!.status).toBe('healthy');
    expect(result.healthScore!.alertsCount).toBe(1);
    expect(result.healthScore!.recommendedActions).toEqual([
      'action1',
      'action2',
    ]);
  });

  it('returns null healthScore when no cached data', async () => {
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    createSupabaseAdminClient.mockReturnValue(
      createAdminMock({ cachedHealth: null }),
    );

    const result = await getAdminOrgHealthSnapshot('org-1');
    expect(result.healthScore).toBeNull();
  });
});

/**
 * Usage Analyzer Service
 * Analyzes user/org usage patterns to inform upgrade messaging
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface UsageMetrics {
  teamMembers: number;
  teamMemberLimit: number;
  evidenceCount: number;
  evidenceLimit: number;
  frameworksEnabled: number;
  frameworkLimit: number;
  workflowsCreated: number;
  workflowLimit: number;
  tasksCompleted: number;
  loginsLast30Days: number;
  featuresUsed: string[];
  approachingLimits: ApproachingLimit[];
}

export interface ApproachingLimit {
  resource: string;
  current: number;
  limit: number;
  percentage: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface UpgradeContext {
  triggeredByFeature: string;
  usageMetrics: UsageMetrics;
  recommendedPlan: 'basic' | 'pro' | 'enterprise';
  personalizedBenefits: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Plan limits configuration
 */
const PLAN_LIMITS = {
  trial: {
    teamMembers: 5,
    evidence: 50,
    frameworks: 1,
    workflows: 2,
  },
  basic: {
    teamMembers: 10,
    evidence: 200,
    frameworks: 2,
    workflows: 5,
  },
  pro: {
    teamMembers: 50,
    evidence: 1000,
    frameworks: 10,
    workflows: 25,
  },
  enterprise: {
    teamMembers: Infinity,
    evidence: Infinity,
    frameworks: Infinity,
    workflows: Infinity,
  },
};

/**
 * Analyze usage metrics for an organization
 */
export async function analyzeUsage(
  orgId: string,
  currentPlan: 'trial' | 'basic' | 'pro' | 'enterprise' = 'trial'
): Promise<UsageMetrics> {
  const admin = createSupabaseAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Parallel queries for efficiency
  const [
    memberResult,
    evidenceResult,
    frameworkResult,
    workflowResult,
    taskResult,
    loginResult,
    activityResult,
  ] = await Promise.all([
    admin
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('org_evidence')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('org_frameworks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId),
    admin
      .from('org_workflows')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('org_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'completed'),
    admin
      .from('org_audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('action', 'user.login')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    admin
      .from('org_audit_logs')
      .select('action')
      .eq('organization_id', orgId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .limit(200),
  ]);

  const limits = PLAN_LIMITS[currentPlan];

  const teamMembers = memberResult.count || 0;
  const evidenceCount = evidenceResult.count || 0;
  const frameworksEnabled = frameworkResult.count || 0;
  const workflowsCreated = workflowResult.count || 0;
  const tasksCompleted = taskResult.count || 0;
  const loginsLast30Days = loginResult.count || 0;

  // Extract unique features used
  const featuresUsed = new Set<string>();
  activityResult.data?.forEach((log: { action?: string }) => {
    const action = log.action?.split('.')[0];
    if (action) featuresUsed.add(action);
  });

  // Calculate approaching limits
  const approachingLimits: ApproachingLimit[] = [];

  const checkLimit = (
    resource: string,
    current: number,
    limit: number
  ) => {
    if (limit === Infinity) return;
    const percentage = (current / limit) * 100;
    if (percentage >= 50) {
      approachingLimits.push({
        resource,
        current,
        limit,
        percentage: Math.round(percentage),
        urgency:
          percentage >= 100
            ? 'critical'
            : percentage >= 90
            ? 'high'
            : percentage >= 75
            ? 'medium'
            : 'low',
      });
    }
  };

  checkLimit('Team Members', teamMembers, limits.teamMembers);
  checkLimit('Evidence Items', evidenceCount, limits.evidence);
  checkLimit('Frameworks', frameworksEnabled, limits.frameworks);
  checkLimit('Workflows', workflowsCreated, limits.workflows);

  return {
    teamMembers,
    teamMemberLimit: limits.teamMembers,
    evidenceCount,
    evidenceLimit: limits.evidence,
    frameworksEnabled,
    frameworkLimit: limits.frameworks,
    workflowsCreated,
    workflowLimit: limits.workflows,
    tasksCompleted,
    loginsLast30Days,
    featuresUsed: Array.from(featuresUsed),
    approachingLimits: approachingLimits.sort((a, b) => b.percentage - a.percentage),
  };
}

/**
 * Build upgrade context based on usage and triggered feature
 */
export async function buildUpgradeContext(
  orgId: string,
  triggeredByFeature: string,
  currentPlan: 'trial' | 'basic' | 'pro' | 'enterprise' = 'trial'
): Promise<UpgradeContext> {
  const usageMetrics = await analyzeUsage(orgId, currentPlan);

  // Determine recommended plan based on usage and feature
  let recommendedPlan: 'basic' | 'pro' | 'enterprise' = 'pro';

  // If approaching team limits, recommend enterprise
  const teamLimit = usageMetrics.approachingLimits.find(
    (l) => l.resource === 'Team Members'
  );
  if (teamLimit && teamLimit.percentage >= 80) {
    recommendedPlan = 'enterprise';
  }

  // If feature requires enterprise, recommend enterprise
  const enterpriseFeatures = ['team-unlimited', 'sso-saml', 'api-access'];
  if (enterpriseFeatures.includes(triggeredByFeature)) {
    recommendedPlan = 'enterprise';
  }

  // Generate personalized benefits based on usage
  const personalizedBenefits: string[] = [];

  if (usageMetrics.loginsLast30Days > 50) {
    personalizedBenefits.push('Your team is actively using FormaOS');
  }

  if (usageMetrics.tasksCompleted > 20) {
    personalizedBenefits.push(
      `You've completed ${usageMetrics.tasksCompleted} compliance tasks`
    );
  }

  if (usageMetrics.frameworksEnabled > 0) {
    personalizedBenefits.push(
      `Track unlimited frameworks (currently ${usageMetrics.frameworksEnabled})`
    );
  }

  if (usageMetrics.evidenceCount > 30) {
    personalizedBenefits.push(
      `Protect ${usageMetrics.evidenceCount} evidence items with advanced security`
    );
  }

  // Add limit-based benefits
  for (const limit of usageMetrics.approachingLimits) {
    if (limit.urgency === 'high' || limit.urgency === 'critical') {
      personalizedBenefits.push(
        `Expand your ${limit.resource.toLowerCase()} limit (${limit.current}/${limit.limit} used)`
      );
    }
  }

  // Determine urgency level
  const hasHighLimits = usageMetrics.approachingLimits.some(
    (l) => l.urgency === 'high' || l.urgency === 'critical'
  );
  const hasCriticalLimits = usageMetrics.approachingLimits.some(
    (l) => l.urgency === 'critical'
  );

  const urgencyLevel = hasCriticalLimits
    ? 'critical'
    : hasHighLimits
    ? 'high'
    : usageMetrics.approachingLimits.length > 0
    ? 'medium'
    : 'low';

  return {
    triggeredByFeature,
    usageMetrics,
    recommendedPlan,
    personalizedBenefits: personalizedBenefits.slice(0, 4),
    urgencyLevel,
  };
}

/**
 * Get usage percentage for a specific resource
 */
export function getUsagePercentage(
  current: number,
  limit: number
): number {
  if (limit === Infinity || limit === 0) return 0;
  return Math.min(100, Math.round((current / limit) * 100));
}

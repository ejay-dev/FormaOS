import 'server-only';

import {
  calculateActivationScore,
  getActivationStatus,
} from '@/lib/analytics/activation-telemetry';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isMissingSupabaseColumnError } from '@/lib/supabase/schema-compat';

type RiskLevel = 'low' | 'watch' | 'high';

export type AdminOrgHealthSnapshot = {
  activation: {
    score: number;
    label: string;
    color: string;
    description: string;
    onboardingCompleted: boolean;
    milestones: Record<string, boolean>;
    missingMilestones: string[];
  };
  healthScore: {
    score: number;
    status: string;
    alertsCount: number;
    lastLoginAt: string | null;
    calculatedAt: string;
    recommendedActions: string[];
  } | null;
  billingRisk: {
    level: RiskLevel;
    reasons: string[];
    trialDaysRemaining: number | null;
  };
  metrics: {
    memberCount: number;
    evidenceCount: number;
    policyCount: number;
    controlCount: number;
    exportCount: number;
  };
  nextBestActions: string[];
};

function uniquePush(target: string[], value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized || target.includes(normalized)) return;
  target.push(normalized);
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function getTrialDaysRemaining(trialEnd: string | null | undefined) {
  if (!trialEnd) return null;
  const trialDate = new Date(trialEnd);
  if (Number.isNaN(trialDate.getTime())) return null;
  return Math.max(
    0,
    Math.ceil((trialDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
}

export async function getAdminOrgHealthSnapshot(
  orgId: string,
): Promise<AdminOrgHealthSnapshot> {
  const admin = createSupabaseAdminClient();
  const organizationQuery = admin
    .from('organizations')
    .select('id, created_at, frameworks, onboarding_completed, lifecycle_status')
    .eq('id', orgId)
    .maybeSingle();

  const [
    organizationResult,
    { data: subscription },
    { data: cachedHealth },
    { count: memberCount },
    { count: evidenceCount },
    { count: policyCount },
    { count: controlCount },
    { count: reportExportCount },
    { count: complianceExportCount },
  ] = await Promise.all([
    organizationQuery,
    admin
      .from('org_subscriptions')
      .select(
        'status, trial_expires_at, current_period_end, payment_failures, grace_period_end',
      )
      .eq('organization_id', orgId)
      .maybeSingle(),
    admin
      .from('org_health_scores')
      .select(
        'score, status, alerts, recommended_actions, last_login_at, calculated_at',
      )
      .eq('organization_id', orgId)
      .maybeSingle(),
    admin
      .from('org_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('org_evidence')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('org_policies')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('org_control_evaluations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('report_export_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('compliance_export_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
  ]);

  const organization = (
    isMissingSupabaseColumnError(
      organizationResult.error,
      'organizations',
      'lifecycle_status',
    )
      ? (
          await admin
            .from('organizations')
            .select('id, created_at, frameworks, onboarding_completed')
            .eq('id', orgId)
            .maybeSingle()
        ).data
      : organizationResult.data
  ) as
    | {
        id?: string;
        created_at?: string | null;
        frameworks?: unknown;
        onboarding_completed?: boolean | null;
        lifecycle_status?: string | null;
      }
    | null;

  const milestones = {
    frameworkEnabled: asArray(organization?.frameworks).length > 0,
    evidenceMapped: (evidenceCount ?? 0) > 0,
    policyCreated: (policyCount ?? 0) > 0,
    teamInvited: (memberCount ?? 0) > 1,
    reportGenerated:
      (reportExportCount ?? 0) + (complianceExportCount ?? 0) > 0,
    controlMapped: (controlCount ?? 0) > 0,
  };

  const activationScore = calculateActivationScore(milestones);
  const activationStatus = getActivationStatus(activationScore);
  const missingMilestones = Object.entries(milestones)
    .filter(([, done]) => !done)
    .map(([key]) => key);

  const billingReasons: string[] = [];
  const trialDaysRemaining = getTrialDaysRemaining(
    subscription?.trial_expires_at ?? subscription?.current_period_end,
  );
  let billingRisk: RiskLevel = 'low';

  if ((organization?.lifecycle_status ?? 'active') === 'suspended') {
    billingRisk = 'high';
    uniquePush(
      billingReasons,
      'Organization is suspended and requires explicit restore before recovery.',
    );
  }
  if (subscription?.status === 'past_due' || subscription?.status === 'unpaid') {
    billingRisk = 'high';
    uniquePush(
      billingReasons,
      'Billing is in a delinquent state and needs operator intervention.',
    );
  } else if ((subscription?.payment_failures ?? 0) > 0) {
    billingRisk = billingRisk === 'high' ? 'high' : 'watch';
    uniquePush(
      billingReasons,
      `${subscription?.payment_failures} payment failure(s) recorded.`,
    );
  }
  if (trialDaysRemaining !== null && trialDaysRemaining <= 3) {
    billingRisk =
      trialDaysRemaining <= 1
        ? 'high'
        : billingRisk === 'high'
          ? 'high'
          : 'watch';
    uniquePush(
      billingReasons,
      `Trial expires in ${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'}.`,
    );
  }
  if (
    !organization?.onboarding_completed &&
    organization?.created_at &&
    Date.now() - new Date(organization.created_at).getTime() >
      7 * 24 * 60 * 60 * 1000
  ) {
    billingRisk = billingRisk === 'high' ? 'high' : 'watch';
    uniquePush(
      billingReasons,
      'Onboarding is still incomplete more than 7 days after organization creation.',
    );
  }

  const recommendedActions = asArray(cachedHealth?.recommended_actions)
    .filter((action): action is string => typeof action === 'string')
    .slice(0, 3);

  const nextBestActions: string[] = [];
  if (!organization?.onboarding_completed) {
    uniquePush(
      nextBestActions,
      'Review onboarding state and complete the remaining activation steps.',
    );
  }
  if (!milestones.frameworkEnabled) {
    uniquePush(nextBestActions, 'Enable the primary compliance framework.');
  }
  if (!milestones.evidenceMapped) {
    uniquePush(nextBestActions, 'Map the first evidence artifact to a control.');
  }
  if (!milestones.teamInvited) {
    uniquePush(nextBestActions, 'Invite at least one additional team member.');
  }
  if (!milestones.reportGenerated) {
    uniquePush(
      nextBestActions,
      'Generate a compliance or executive report to prove first value.',
    );
  }
  if (billingRisk !== 'low') {
    uniquePush(
      nextBestActions,
      'Resolve billing or trial risk before it becomes an access incident.',
    );
  }
  for (const action of recommendedActions) {
    uniquePush(nextBestActions, action);
  }

  return {
    activation: {
      score: activationScore,
      label: activationStatus.label,
      color: activationStatus.color,
      description: activationStatus.description,
      onboardingCompleted: Boolean(organization?.onboarding_completed),
      milestones,
      missingMilestones,
    },
    healthScore: cachedHealth
      ? {
          score: cachedHealth.score,
          status: cachedHealth.status,
          alertsCount: asArray(cachedHealth.alerts).length,
          lastLoginAt: cachedHealth.last_login_at ?? null,
          calculatedAt: cachedHealth.calculated_at,
          recommendedActions,
        }
      : null,
    billingRisk: {
      level: billingRisk,
      reasons: billingReasons,
      trialDaysRemaining,
    },
    metrics: {
      memberCount: memberCount ?? 0,
      evidenceCount: evidenceCount ?? 0,
      policyCount: policyCount ?? 0,
      controlCount: controlCount ?? 0,
      exportCount: (reportExportCount ?? 0) + (complianceExportCount ?? 0),
    },
    nextBestActions,
  };
}

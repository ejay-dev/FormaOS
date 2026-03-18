import 'server-only';

import { unstable_cache } from 'next/cache';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type AdminOverviewMetrics = {
  totalOrgs: number;
  activeByPlan: Record<string, number>;
  trialsActive: number;
  trialsExpiring: number;
  mrrCents: number;
  failedPayments: number;
  orgsByDay: Array<{ date: string; count: number }>;
  planPrices: Record<string, number>;
  excludedSyntheticOrgs: number;
  suspendedOrgs: number;
  activationAtRisk: number;
  pendingApprovals: number;
  openSecurityAlerts: number;
  failedExports: number;
  highRiskAdminActions7d: number;
};

function isSyntheticOrgName(name: string | null | undefined): boolean {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  return (
    normalized.startsWith('e2e ') ||
    normalized.includes('e2e test org') ||
    normalized.startsWith('qa smoke ') ||
    normalized.endsWith('@test.formaos.local')
  );
}

async function fetchOverviewMetricsFromDb(): Promise<AdminOverviewMetrics> {
  const admin = createSupabaseAdminClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    orgsResult,
    subsResult,
    plansResult,
    healthScoresResult,
    pendingApprovalsResult,
    openSecurityAlertsResult,
    failedComplianceExportsResult,
    failedReportExportsResult,
    highRiskActionsResult,
  ] = await Promise.all([
    admin
      .from('organizations')
      .select('id, name, created_at, onboarding_completed, lifecycle_status'),
    admin
      .from('org_subscriptions')
      .select(
        'organization_id, status, plan_key, current_period_end, trial_expires_at, payment_failures',
      ),
    admin.from('plans').select('key, price_cents'),
    admin.from('org_health_scores').select('organization_id, status'),
    admin
      .from('platform_change_approvals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    admin
      .from('security_alerts')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'acknowledged']),
    admin
      .from('compliance_export_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed'),
    admin
      .from('report_export_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed'),
    admin
      .from('platform_admin_audit_feed')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo)
      .in('action', [
        'org_lock',
        'org_suspend',
        'trial_reset',
        'user_lock',
        'session_revoke',
        'emergency_lockdown',
      ]),
  ]);

  if (orgsResult.error || subsResult.error) {
    console.error('[admin/metrics] DB query error', {
      organizations: orgsResult.error?.message,
      subscriptions: subsResult.error?.message,
    });
  }

  const organizations = orgsResult.data ?? [];
  const filteredOrgs = organizations.filter(
    (org: any) => !isSyntheticOrgName(org.name),
  );
  const filteredOrgIds = new Set(filteredOrgs.map((org: any) => org.id));
  const excludedSyntheticOrgs = organizations.length - filteredOrgs.length;
  const healthByOrg = new Map<string, string>();
  (healthScoresResult.data ?? []).forEach((row: any) => {
    if (filteredOrgIds.has(row.organization_id)) {
      healthByOrg.set(row.organization_id, row.status ?? '');
    }
  });

  const subscriptions = (subsResult.data ?? []).filter((row: any) =>
    filteredOrgIds.has(row.organization_id),
  );

  const plans = plansResult.data ?? [];
  const planPriceMap = new Map<string, number>();
  plans.forEach((plan: any) => {
    planPriceMap.set(plan.key, plan.price_cents ?? 0);
  });

  const nowMs = Date.now();
  const sevenDaysMs = nowMs + 7 * 24 * 60 * 60 * 1000;

  const activeByPlan: Record<string, number> = {};
  let trialsActive = 0;
  let trialsExpiring = 0;
  let failedPayments = 0;
  let mrrCents = 0;
  const suspendedOrgs = filteredOrgs.filter(
    (org: any) => org.lifecycle_status === 'suspended',
  ).length;
  const activationAtRisk = filteredOrgs.filter((org: any) => {
    const healthStatus = healthByOrg.get(org.id) ?? '';
    return (
      !org.onboarding_completed ||
      healthStatus === 'at_risk' ||
      healthStatus === 'critical'
    );
  }).length;

  for (const subscription of subscriptions) {
    const status = (subscription.status ?? '').toLowerCase();

    if (status === 'trialing') {
      trialsActive += 1;
      const trialEnd =
        subscription.trial_expires_at ?? subscription.current_period_end;
      if (trialEnd) {
        const trialEndMs = new Date(trialEnd).getTime();
        if (!Number.isNaN(trialEndMs) && trialEndMs <= sevenDaysMs) {
          trialsExpiring += 1;
        }
      }
    }

    if (status === 'active') {
      const planKey = subscription.plan_key ?? 'unknown';
      activeByPlan[planKey] = (activeByPlan[planKey] ?? 0) + 1;
      mrrCents += planPriceMap.get(planKey) ?? 0;
    }

    const hasFailedState = ['past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'payment_failed'].includes(status);
    const hasFailureCount = Number(subscription.payment_failures ?? 0) > 0;
    if (hasFailedState || hasFailureCount) {
      failedPayments += 1;
    }
  }

  const dayCounts: Record<string, number> = {};
  for (const org of filteredOrgs) {
    if (!org.created_at) continue;
    const created = new Date(org.created_at);
    if (Number.isNaN(created.getTime())) continue;
    const dateKey = created.toISOString().slice(0, 10);
    dayCounts[dateKey] = (dayCounts[dateKey] ?? 0) + 1;
  }

  const orgsByDay = Array.from({ length: 7 }).map((_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    const dateKey = day.toISOString().slice(0, 10);
    return {
      date: dateKey,
      count: dayCounts[dateKey] ?? 0,
    };
  });

  return {
    totalOrgs: filteredOrgs.length,
    activeByPlan,
    trialsActive,
    trialsExpiring,
    mrrCents,
    failedPayments,
    orgsByDay,
    planPrices: Object.fromEntries(planPriceMap),
    excludedSyntheticOrgs,
    suspendedOrgs,
    activationAtRisk,
    pendingApprovals: pendingApprovalsResult.count ?? 0,
    openSecurityAlerts: openSecurityAlertsResult.count ?? 0,
    failedExports:
      (failedComplianceExportsResult.count ?? 0) +
      (failedReportExportsResult.count ?? 0),
    highRiskAdminActions7d: highRiskActionsResult.count ?? 0,
  };
}

const getCachedOverviewMetrics = unstable_cache(
  fetchOverviewMetricsFromDb,
  ['admin-overview-metrics-v2'],
  { revalidate: 60 },
);

export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
  return getCachedOverviewMetrics();
}

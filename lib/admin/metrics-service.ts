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

  const [orgsResult, subsResult, plansResult] = await Promise.all([
    admin.from('organizations').select('id, name, created_at'),
    admin
      .from('org_subscriptions')
      .select(
        'organization_id, status, plan_key, current_period_end, trial_expires_at, payment_failures',
      ),
    admin.from('plans').select('key, price_cents'),
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

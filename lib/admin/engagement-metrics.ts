import 'server-only';

import { unstable_cache } from 'next/cache';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type EngagementMetrics = {
  totalUsers: number;
  newUsersLast7d: number;
  newUsersLast30d: number;
  avgEngagementScore: number;
  highEngagementOrgs: number;
  lowEngagementOrgs: number;
  healthDistribution: {
    healthy: number;
    warning: number;
    atRisk: number;
    critical: number;
  };
  conversionRate: number;
  avgRevenuePerOrg: number;
  activeUsersLast7d: number;
};

async function fetchEngagementMetricsFromDb(): Promise<EngagementMetrics> {
  const admin = createSupabaseAdminClient();
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  // --- Total users ---
  let totalUsers = 0;
  try {
    const { count } = await admin
      .from('org_members')
      .select('id', { count: 'exact', head: true });
    totalUsers = count ?? 0;
  } catch {
    // table may not exist
  }

  // --- New users (7d / 30d) ---
  let newUsersLast7d = 0;
  let newUsersLast30d = 0;
  try {
    const { count: count7 } = await admin
      .from('org_members')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo);
    newUsersLast7d = count7 ?? 0;
  } catch {
    // column may not exist
  }
  try {
    const { count: count30 } = await admin
      .from('org_members')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo);
    newUsersLast30d = count30 ?? 0;
  } catch {
    // column may not exist
  }

  // --- Engagement scores from org_usage_summaries ---
  let avgEngagementScore = 0;
  let highEngagementOrgs = 0;
  let lowEngagementOrgs = 0;
  try {
    const { data: usageRows } = await admin
      .from('org_usage_summaries')
      .select('engagement_score');
    if (usageRows && usageRows.length > 0) {
      const scores = usageRows.map(
        (r: { engagement_score: number | null }) => r.engagement_score ?? 0,
      );
      avgEngagementScore = Math.round(
        scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
      );
      highEngagementOrgs = scores.filter((s: number) => s >= 70).length;
      lowEngagementOrgs = scores.filter((s: number) => s < 30).length;
    }
  } catch {
    // table may not exist
  }

  // --- Health distribution from org_health_scores ---
  const healthDistribution = { healthy: 0, warning: 0, atRisk: 0, critical: 0 };
  try {
    const { data: healthRows } = await admin
      .from('org_health_scores')
      .select('status');
    if (healthRows) {
      for (const row of healthRows) {
        const s = (row as { status: string }).status;
        if (s === 'healthy') healthDistribution.healthy++;
        else if (s === 'warning') healthDistribution.warning++;
        else if (s === 'at_risk') healthDistribution.atRisk++;
        else if (s === 'critical') healthDistribution.critical++;
      }
    }
  } catch {
    // table may not exist
  }

  // --- Conversion rate from org_subscriptions ---
  let conversionRate = 0;
  let activeSubCount = 0;
  try {
    const { data: subRows } = await admin
      .from('org_subscriptions')
      .select('status');
    if (subRows && subRows.length > 0) {
      const active = subRows.filter(
        (r: { status: string }) => r.status === 'active',
      ).length;
      const trialing = subRows.filter(
        (r: { status: string }) => r.status === 'trialing',
      ).length;
      activeSubCount = active;
      const denominator = active + trialing;
      conversionRate =
        denominator > 0 ? Math.round((active / denominator) * 100) : 0;
    }
  } catch {
    // table may not exist
  }

  // --- Active users (7d) – approximate via org_members.updated_at ---
  let activeUsersLast7d = 0;
  try {
    const { count } = await admin
      .from('org_members')
      .select('id', { count: 'exact', head: true })
      .gte('updated_at', sevenDaysAgo);
    activeUsersLast7d = count ?? 0;
  } catch {
    // column may not exist
  }

  return {
    totalUsers,
    newUsersLast7d,
    newUsersLast30d,
    avgEngagementScore,
    highEngagementOrgs,
    lowEngagementOrgs,
    healthDistribution,
    conversionRate,
    avgRevenuePerOrg: activeSubCount,
    activeUsersLast7d,
  };
}

export const getEngagementMetrics = unstable_cache(
  fetchEngagementMetricsFromDb,
  ['admin-engagement-metrics'],
  { revalidate: 120 },
);

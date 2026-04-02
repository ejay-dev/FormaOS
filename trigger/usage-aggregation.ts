import { schedules } from '@trigger.dev/sdk/v3';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { computeEngagementScore } from '@/lib/analytics/usage-tracker';

export const usageAggregationTask = schedules.task({
  id: 'usage-aggregation-daily',
  cron: '0 3 * * *', // Daily at 3 AM UTC
  run: async () => {
    const db = createSupabaseAdminClient();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const periodStart = yesterday.toISOString().slice(0, 10);

    // Get all orgs with activity
    const { data: orgIds } = await db
      .from('org_usage_events')
      .select('org_id')
      .gte('created_at', `${periodStart}T00:00:00Z`)
      .lt('created_at', `${periodStart}T23:59:59Z`);

    const uniqueOrgs = [...new Set((orgIds || []).map((e) => e.org_id))];
    let processed = 0;

    for (const orgId of uniqueOrgs) {
      // Count events
      const { count: totalEvents } = await db
        .from('org_usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', `${periodStart}T00:00:00Z`)
        .lt('created_at', `${periodStart}T23:59:59Z`);

      // Count active users
      const { data: users } = await db
        .from('org_usage_events')
        .select('user_id')
        .eq('org_id', orgId)
        .gte('created_at', `${periodStart}T00:00:00Z`)
        .lt('created_at', `${periodStart}T23:59:59Z`);
      const activeUsers = new Set((users || []).map((u) => u.user_id)).size;

      // Feature usage
      const { data: features } = await db
        .from('org_usage_events')
        .select('event_type')
        .eq('org_id', orgId)
        .gte('created_at', `${periodStart}T00:00:00Z`)
        .lt('created_at', `${periodStart}T23:59:59Z`);

      const featureUsage: Record<string, number> = {};
      for (const f of features || []) {
        featureUsage[f.event_type] = (featureUsage[f.event_type] || 0) + 1;
      }

      const engagementScore = await computeEngagementScore(orgId);

      await db.from('org_usage_summaries').upsert(
        {
          org_id: orgId,
          period_start: periodStart,
          period_end: periodStart,
          period_type: 'daily',
          active_users: activeUsers,
          total_events: totalEvents || 0,
          feature_usage: featureUsage,
          engagement_score: engagementScore,
        },
        { onConflict: 'org_id,period_start,period_type' },
      );

      processed++;
    }

    return { message: `Aggregated usage for ${processed} orgs` };
  },
});

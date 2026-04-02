import { schedules } from '@trigger.dev/sdk';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { captureSnapshot } from '@/lib/analytics/snapshot-engine';

export const dailyAnalyticsSnapshot = schedules.task({
  id: 'daily-analytics-snapshot',
  cron: '0 0 * * *', // midnight UTC daily
  run: async () => {
    const db = createSupabaseAdminClient();

    // Get all active orgs
    const { data: orgs } = await db
      .from('organizations')
      .select('id')
      .eq('lifecycle_status', 'active');

    const results = { success: 0, failed: 0 };

    for (const org of orgs ?? []) {
      try {
        await captureSnapshot(db, org.id);
        results.success++;
      } catch {
        results.failed++;
      }
    }

    // Cleanup old snapshots (> 2 years)
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 2);
    await db
      .from('org_analytics_snapshots')
      .delete()
      .lt('snapshot_date', cutoff.toISOString().slice(0, 10));

    return results;
  },
});

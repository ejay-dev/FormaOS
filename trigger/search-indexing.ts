import { task, schedules } from '@trigger.dev/sdk';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { fullReindex } from '@/lib/search/indexer';
import { pruneOrphans, getIndexHealth } from '@/lib/search/maintenance';

/** Manually trigger a full org reindex */
export const reindexOrgTask = task({
  id: 'search-reindex-org',
  run: async ({ orgId }: { orgId: string }) => {
    await fullReindex(orgId);
    return { orgId, status: 'complete' };
  },
});

/** Weekly search index maintenance: prune orphans, log health */
export const searchMaintenanceTask = schedules.task({
  id: 'search-weekly-maintenance',
  cron: '0 3 * * 0', // Every Sunday 3 AM
  run: async () => {
    const db = createSupabaseAdminClient();
    const { data: orgs } = await db
      .from('organizations')
      .select('id')
      .eq('status', 'active');

    for (const org of orgs ?? []) {
      const pruneResult = await pruneOrphans(org.id);
      const health = await getIndexHealth(org.id);

      console.log(
        `[search-maintenance] org=${org.id} pruned=${pruneResult.pruned} coverage=${health.overallCoverage}%`,
      );
    }
  },
});

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type HealthTrendPoint = {
  snapshot_at: string;
  overall_score: number;
};

/**
 * Read the latest N weekly snapshots for an org. Ordered oldest → newest
 * so a sparkline can iterate index-to-x without re-sorting.
 */
export async function getOrgHealthTrend(
  orgId: string,
  limit = 12,
): Promise<HealthTrendPoint[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('org_compliance_health_snapshots')
    .select('snapshot_at, overall_score')
    .eq('organization_id', orgId)
    .order('snapshot_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  return (data as HealthTrendPoint[]).slice().reverse();
}

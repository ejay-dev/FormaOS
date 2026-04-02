import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type DateRange = { from: string; to: string };
type Granularity = 'day' | 'week' | 'month';

export async function getIncidentStats(orgId: string, dateRange: DateRange) {
  const db = createSupabaseAdminClient();

  const { data: incidents } = await db
    .from('org_incidents')
    .select('id, type, severity, status, created_at, resolved_at')
    .eq('organization_id', orgId)
    .gte('created_at', dateRange.from)
    .lte('created_at', dateRange.to);

  if (!incidents?.length)
    return { byType: {}, bySeverity: {}, byStatus: {}, total: 0 };

  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  for (const inc of incidents) {
    byType[inc.type] = (byType[inc.type] ?? 0) + 1;
    bySeverity[inc.severity] = (bySeverity[inc.severity] ?? 0) + 1;
    byStatus[inc.status] = (byStatus[inc.status] ?? 0) + 1;
  }

  return { byType, bySeverity, byStatus, total: incidents.length };
}

export async function getIncidentTrend(
  orgId: string,
  dateRange: DateRange,
  granularity: Granularity,
) {
  const db = createSupabaseAdminClient();

  const { data: incidents } = await db
    .from('org_incidents')
    .select('id, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', dateRange.from)
    .lte('created_at', dateRange.to)
    .order('created_at');

  if (!incidents?.length) return [];

  const buckets: Record<string, number> = {};

  for (const inc of incidents) {
    const d = new Date(inc.created_at);
    let key: string;
    if (granularity === 'day') {
      key = d.toISOString().slice(0, 10);
    } else if (granularity === 'week') {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      key = weekStart.toISOString().slice(0, 10);
    } else {
      key = d.toISOString().slice(0, 7);
    }
    buckets[key] = (buckets[key] ?? 0) + 1;
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, count]) => ({ period, count }));
}

export async function getMTTR(orgId: string, dateRange: DateRange) {
  const db = createSupabaseAdminClient();

  const { data: incidents } = await db
    .from('org_incidents')
    .select('severity, created_at, resolved_at')
    .eq('organization_id', orgId)
    .eq('status', 'resolved')
    .not('resolved_at', 'is', null)
    .gte('created_at', dateRange.from)
    .lte('created_at', dateRange.to);

  if (!incidents?.length) return {};

  const bySeverity: Record<string, number[]> = {};

  for (const inc of incidents) {
    const created = new Date(inc.created_at).getTime();
    const resolved = new Date(inc.resolved_at).getTime();
    const hours = (resolved - created) / (1000 * 60 * 60);
    if (!bySeverity[inc.severity]) bySeverity[inc.severity] = [];
    bySeverity[inc.severity].push(hours);
  }

  const mttr: Record<string, number> = {};
  for (const [sev, times] of Object.entries(bySeverity)) {
    mttr[sev] = Math.round(times.reduce((s, t) => s + t, 0) / times.length);
  }

  return mttr;
}

export async function detectPatterns(orgId: string, dateRange: DateRange) {
  const db = createSupabaseAdminClient();

  const { data: incidents } = await db
    .from('org_incidents')
    .select('type, location, participant_id')
    .eq('organization_id', orgId)
    .gte('created_at', dateRange.from)
    .lte('created_at', dateRange.to);

  if (!incidents?.length) return [];

  // Group by type + location
  const patterns: Record<
    string,
    { type: string; location: string | null; count: number }
  > = {};
  for (const inc of incidents) {
    const key = `${inc.type}::${inc.location ?? 'unknown'}`;
    if (!patterns[key])
      patterns[key] = { type: inc.type, location: inc.location, count: 0 };
    patterns[key].count++;
  }

  const threshold = 3;
  return Object.values(patterns)
    .filter((p) => p.count >= threshold)
    .sort((a, b) => b.count - a.count);
}

export async function getIncidentHeatmap(orgId: string, dateRange: DateRange) {
  const db = createSupabaseAdminClient();

  const { data: incidents } = await db
    .from('org_incidents')
    .select('created_at')
    .eq('organization_id', orgId)
    .gte('created_at', dateRange.from)
    .lte('created_at', dateRange.to);

  if (!incidents?.length) return [];

  // day-of-week × hour grid
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const inc of incidents) {
    const d = new Date(inc.created_at);
    grid[d.getDay()][d.getHours()]++;
  }

  return grid;
}

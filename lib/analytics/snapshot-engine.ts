/**
 * Analytics Snapshot Engine - Captures daily org metrics for trend analysis
 */

import { SupabaseClient } from '@supabase/supabase-js';

export async function captureSnapshot(db: SupabaseClient, orgId: string) {
  const today = new Date().toISOString().slice(0, 10);

  // Gather metrics in parallel
  const [controlStats, evidenceStats, taskStats, incidentCount, memberStats] =
    await Promise.all([
      getControlStats(db, orgId),
      getEvidenceStats(db, orgId),
      getTaskStats(db, orgId),
      getIncidentCount(db, orgId),
      getMemberStats(db, orgId),
    ]);

  const metrics = {
    compliance_score: controlStats.complianceScore,
    controls_total: controlStats.total,
    controls_satisfied: controlStats.satisfied,
    controls_not_met: controlStats.notMet,
    evidence_total: evidenceStats.total,
    evidence_fresh: evidenceStats.fresh,
    evidence_stale: evidenceStats.stale,
    tasks_total: taskStats.total,
    tasks_completed: taskStats.completed,
    tasks_overdue: taskStats.overdue,
    tasks_open: taskStats.open,
    incidents_this_month: incidentCount,
    members_active: memberStats.active,
    members_total: memberStats.total,
    captured_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from('org_analytics_snapshots')
    .upsert(
      { org_id: orgId, snapshot_date: today, metrics },
      { onConflict: 'org_id,snapshot_date' },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getSnapshots(
  db: SupabaseClient,
  orgId: string,
  dateRange: { from: string; to: string },
) {
  const { data } = await db
    .from('org_analytics_snapshots')
    .select('snapshot_date, metrics')
    .eq('org_id', orgId)
    .gte('snapshot_date', dateRange.from)
    .lte('snapshot_date', dateRange.to)
    .order('snapshot_date', { ascending: true });

  return data ?? [];
}

export async function getTrend(
  db: SupabaseClient,
  orgId: string,
  metric: string,
  dateRange: { from: string; to: string },
) {
  const snapshots = await getSnapshots(db, orgId, dateRange);
  return snapshots.map((s) => ({
    date: s.snapshot_date,
    value: (s.metrics as Record<string, number>)[metric] ?? 0,
  }));
}

export async function compareSnapshots(
  db: SupabaseClient,
  orgId: string,
  date1: string,
  date2: string,
) {
  const [snap1, snap2] = await Promise.all([
    db
      .from('org_analytics_snapshots')
      .select('metrics')
      .eq('org_id', orgId)
      .eq('snapshot_date', date1)
      .single(),
    db
      .from('org_analytics_snapshots')
      .select('metrics')
      .eq('org_id', orgId)
      .eq('snapshot_date', date2)
      .single(),
  ]);

  const m1 = (snap1.data?.metrics ?? {}) as Record<string, number>;
  const m2 = (snap2.data?.metrics ?? {}) as Record<string, number>;

  const allKeys = new Set([...Object.keys(m1), ...Object.keys(m2)]);
  const deltas: Record<
    string,
    { before: number; after: number; change: number }
  > = {};
  for (const key of allKeys) {
    const before = m1[key] ?? 0;
    const after = m2[key] ?? 0;
    deltas[key] = { before, after, change: after - before };
  }

  return { date1, date2, deltas };
}

export async function getMetricSummary(
  db: SupabaseClient,
  orgId: string,
  metric: string,
  dateRange: { from: string; to: string },
) {
  const trend = await getTrend(db, orgId, metric, dateRange);
  if (!trend.length) return { min: 0, max: 0, avg: 0, current: 0, change: 0 };

  const values = trend.map((t) => t.value);
  const current = values[values.length - 1];
  const first = values[0];

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    current,
    change: current - first,
  };
}

// ---- Internal metric gatherers ----

async function getControlStats(db: SupabaseClient, orgId: string) {
  const { data } = await db
    .from('org_controls')
    .select('status')
    .eq('org_id', orgId);

  const controls = data ?? [];
  const total = controls.length;
  const satisfied = controls.filter(
    (c) => c.status === 'satisfied' || c.status === 'compliant',
  ).length;
  const notMet = controls.filter(
    (c) => c.status === 'not_met' || c.status === 'non_compliant',
  ).length;
  const complianceScore = total > 0 ? Math.round((satisfied / total) * 100) : 0;

  return { total, satisfied, notMet, complianceScore };
}

async function getEvidenceStats(db: SupabaseClient, orgId: string) {
  const { data } = await db
    .from('org_evidence')
    .select('id, created_at')
    .eq('org_id', orgId);

  const items = data ?? [];
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const fresh = items.filter((e) => e.created_at > thirtyDaysAgo).length;

  return { total: items.length, fresh, stale: items.length - fresh };
}

async function getTaskStats(db: SupabaseClient, orgId: string) {
  const { data } = await db
    .from('org_tasks')
    .select('status, due_date')
    .eq('org_id', orgId);

  const tasks = data ?? [];
  const now = new Date().toISOString();
  const completed = tasks.filter(
    (t) => t.status === 'completed' || t.status === 'done',
  ).length;
  const overdue = tasks.filter(
    (t) =>
      t.due_date &&
      t.due_date < now &&
      t.status !== 'completed' &&
      t.status !== 'done',
  ).length;
  const open = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'done',
  ).length;

  return { total: tasks.length, completed, overdue, open };
}

async function getIncidentCount(db: SupabaseClient, orgId: string) {
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).toISOString();
  const { count } = await db
    .from('org_incidents')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('created_at', monthStart);

  return count ?? 0;
}

async function getMemberStats(db: SupabaseClient, orgId: string) {
  const { data } = await db
    .from('org_members')
    .select('status')
    .eq('org_id', orgId);

  const members = data ?? [];
  const active = members.filter((m) => m.status === 'active').length;

  return { total: members.length, active };
}

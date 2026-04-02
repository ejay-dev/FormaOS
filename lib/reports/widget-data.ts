/**
 * Report Widget Data Resolvers - Provides data for custom report widgets
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getSnapshots, getTrend } from '@/lib/analytics/snapshot-engine';

export type WidgetType =
  | 'score_trend'
  | 'framework_comparison'
  | 'gap_table'
  | 'task_status'
  | 'evidence_freshness'
  | 'member_activity'
  | 'incident_trend'
  | 'certificate_timeline'
  | 'custom_kpi'
  | 'compliance_snapshot';

interface WidgetConfig {
  type: WidgetType;
  dateRange: { from: string; to: string };
  filters?: Record<string, unknown>;
  comparisonPeriod?: { from: string; to: string };
}

export async function resolveWidgetData(
  db: SupabaseClient,
  orgId: string,
  config: WidgetConfig,
): Promise<Record<string, unknown>> {
  switch (config.type) {
    case 'score_trend':
      return resolveScoreTrend(db, orgId, config);
    case 'framework_comparison':
      return resolveFrameworkComparison(db, orgId);
    case 'gap_table':
      return resolveGapTable(db, orgId);
    case 'task_status':
      return resolveTaskStatus(db, orgId);
    case 'evidence_freshness':
      return resolveEvidenceFreshness(db, orgId);
    case 'member_activity':
      return resolveMemberActivity(db, orgId, config);
    case 'incident_trend':
      return resolveIncidentTrend(db, orgId, config);
    case 'certificate_timeline':
      return resolveCertificateTimeline(db, orgId);
    case 'custom_kpi':
      return resolveCustomKPI(db, orgId, config);
    case 'compliance_snapshot':
      return resolveComplianceSnapshot(db, orgId, config);
    default:
      return {};
  }
}

async function resolveScoreTrend(
  db: SupabaseClient,
  orgId: string,
  config: WidgetConfig,
) {
  const trend = await getTrend(db, orgId, 'compliance_score', config.dateRange);
  return { type: 'line_chart', data: trend, label: 'Compliance Score' };
}

async function resolveFrameworkComparison(db: SupabaseClient, orgId: string) {
  const { data } = await db
    .from('org_compliance_frameworks')
    .select('framework_id, name, score')
    .eq('org_id', orgId)
    .eq('status', 'active');

  return {
    type: 'bar_chart',
    data: (data ?? []).map((f) => ({ label: f.name, value: f.score ?? 0 })),
    label: 'Framework Scores',
  };
}

async function resolveGapTable(db: SupabaseClient, orgId: string) {
  const { data } = await db
    .from('org_controls')
    .select('id, control_id, title, status, framework_id')
    .eq('org_id', orgId)
    .in('status', ['not_met', 'non_compliant', 'partial']);

  return {
    type: 'table',
    columns: ['Control ID', 'Title', 'Status', 'Framework'],
    rows: (data ?? []).map((c) => [
      c.control_id,
      c.title,
      c.status,
      c.framework_id,
    ]),
    label: 'Control Gaps',
  };
}

async function resolveTaskStatus(db: SupabaseClient, orgId: string) {
  const { data } = await db
    .from('org_tasks')
    .select('status')
    .eq('org_id', orgId);

  const counts: Record<string, number> = {};
  for (const t of data ?? []) {
    counts[t.status] = (counts[t.status] ?? 0) + 1;
  }

  return {
    type: 'pie_chart',
    data: Object.entries(counts).map(([label, value]) => ({ label, value })),
    label: 'Task Status Distribution',
  };
}

async function resolveEvidenceFreshness(db: SupabaseClient, orgId: string) {
  const { data } = await db
    .from('org_evidence')
    .select('id, title, created_at, updated_at')
    .eq('org_id', orgId);

  const now = Date.now();
  const buckets = { fresh: 0, aging: 0, stale: 0, expired: 0 };
  for (const e of data ?? []) {
    const age = now - new Date(e.updated_at ?? e.created_at).getTime();
    const days = age / (1000 * 60 * 60 * 24);
    if (days < 30) buckets.fresh++;
    else if (days < 90) buckets.aging++;
    else if (days < 180) buckets.stale++;
    else buckets.expired++;
  }

  return {
    type: 'bar_chart',
    data: Object.entries(buckets).map(([label, value]) => ({ label, value })),
    label: 'Evidence Freshness',
  };
}

async function resolveMemberActivity(
  db: SupabaseClient,
  orgId: string,
  config: WidgetConfig,
) {
  const { data } = await db
    .from('org_audit_log')
    .select('actor_id, action')
    .eq('org_id', orgId)
    .gte('created_at', config.dateRange.from)
    .lte('created_at', config.dateRange.to)
    .limit(1000);

  const byActor: Record<string, number> = {};
  for (const entry of data ?? []) {
    if (entry.actor_id) {
      byActor[entry.actor_id] = (byActor[entry.actor_id] ?? 0) + 1;
    }
  }

  return {
    type: 'bar_chart',
    data: Object.entries(byActor)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([label, value]) => ({ label, value })),
    label: 'Member Activity',
  };
}

async function resolveIncidentTrend(
  db: SupabaseClient,
  orgId: string,
  config: WidgetConfig,
) {
  const { data } = await db
    .from('org_incidents')
    .select('severity, created_at')
    .eq('org_id', orgId)
    .gte('created_at', config.dateRange.from)
    .lte('created_at', config.dateRange.to);

  const byMonth: Record<string, number> = {};
  for (const inc of data ?? []) {
    const month = inc.created_at.slice(0, 7);
    byMonth[month] = (byMonth[month] ?? 0) + 1;
  }

  return {
    type: 'line_chart',
    data: Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value })),
    label: 'Incidents Over Time',
  };
}

async function resolveCertificateTimeline(db: SupabaseClient, orgId: string) {
  const { data } = await db
    .from('org_certificates')
    .select('id, name, issued_date, expiry_date, status')
    .eq('org_id', orgId)
    .order('expiry_date', { ascending: true });

  return {
    type: 'timeline',
    data: (data ?? []).map((c) => ({
      label: c.name,
      start: c.issued_date,
      end: c.expiry_date,
      status: c.status,
    })),
    label: 'Certificate Timeline',
  };
}

async function resolveCustomKPI(
  db: SupabaseClient,
  orgId: string,
  config: WidgetConfig,
) {
  const metric = (config.filters?.metric as string) ?? 'compliance_score';
  const snapshots = await getSnapshots(db, orgId, config.dateRange);

  const values = snapshots.map(
    (s) => (s.metrics as Record<string, number>)[metric] ?? 0,
  );
  const current = values.length > 0 ? values[values.length - 1] : 0;
  const previous = values.length > 1 ? values[values.length - 2] : current;

  return {
    type: 'kpi',
    value: current,
    previousValue: previous,
    change: current - previous,
    trend: current > previous ? 'up' : current < previous ? 'down' : 'flat',
    label: metric.replace(/_/g, ' '),
  };
}

async function resolveComplianceSnapshot(
  db: SupabaseClient,
  orgId: string,
  config: WidgetConfig,
) {
  const [current, comparison] = await Promise.all([
    getSnapshots(db, orgId, {
      from: config.dateRange.to,
      to: config.dateRange.to,
    }),
    config.comparisonPeriod
      ? getSnapshots(db, orgId, {
          from: config.comparisonPeriod.to,
          to: config.comparisonPeriod.to,
        })
      : Promise.resolve([]),
  ]);

  return {
    type: 'comparison',
    current: current[0]?.metrics ?? {},
    comparison: comparison[0]?.metrics ?? {},
    label: 'Compliance Snapshot Comparison',
  };
}

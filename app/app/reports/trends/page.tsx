import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ReportsTabs } from '../ReportsTabs';

export const metadata = { title: 'Trend Analytics | FormaOS' };

const RANGE_PRESETS = [
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 180, label: '6 months' },
] as const;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function formatDay(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const sp = await searchParams;
  const db = await createSupabaseServerClient();

  // Default to last 6 months
  const to = sp.to ?? new Date().toISOString().slice(0, 10);
  const from = sp.from ?? isoDaysAgo(180);

  const { data: snapshots } = await db
    .from('org_analytics_snapshots')
    .select('snapshot_date, metrics')
    .eq('org_id', state.organization.id)
    .gte('snapshot_date', from)
    .lte('snapshot_date', to)
    .order('snapshot_date', { ascending: true });

  const data = snapshots ?? [];
  const latestMetrics =
    data.length > 0
      ? (data[data.length - 1].metrics as Record<string, number>)
      : ({} as Record<string, number>);
  const previousMetrics =
    data.length > 1
      ? (data[data.length - 2].metrics as Record<string, number>)
      : latestMetrics;

  const metrics = [
    { key: 'compliance_score', label: 'Compliance Score', suffix: '%' },
    { key: 'tasks_completed', label: 'Tasks Completed', suffix: '' },
    { key: 'tasks_overdue', label: 'Overdue Tasks', suffix: '' },
    { key: 'evidence_total', label: 'Total Evidence', suffix: '' },
    { key: 'incidents_this_month', label: 'Incidents', suffix: '' },
    { key: 'members_active', label: 'Active Members', suffix: '' },
  ];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trends</h1>
          <p className="page-description">
            Compliance posture from {formatDay(from)} to {formatDay(to)}.
          </p>
        </div>
        <ReportsTabs current="/app/reports/trends" />
      </div>

      <div className="page-content space-y-4">
      <div className="flex flex-wrap items-center gap-1">
        {RANGE_PRESETS.map((preset) => {
          const presetFrom = isoDaysAgo(preset.days);
          const isActive = from === presetFrom && to === today;
          return (
            <Link
              key={preset.days}
              href={`/app/reports/trends?from=${presetFrom}&to=${today}`}
              aria-current={isActive ? 'page' : undefined}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                isActive
                  ? 'bg-accent/50 font-semibold text-foreground'
                  : 'font-medium text-muted-foreground hover:bg-accent/30 hover:text-foreground'
              }`}
            >
              {preset.label}
            </Link>
          );
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => {
          const current = latestMetrics[m.key] ?? 0;
          const prev = previousMetrics[m.key] ?? current;
          const change = current - prev;
          return (
            <div
              key={m.key}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-2xl font-semibold">
                  {current}
                  {m.suffix}
                </span>
                {change !== 0 && (
                  <span
                    className={`flex items-center gap-0.5 text-sm ${
                      change > 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {change > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {change > 0 ? '+' : ''}
                    {change}
                    {m.suffix}
                  </span>
                )}
                {change === 0 && (
                  <span className="flex items-center gap-0.5 text-sm text-muted-foreground">
                    <Minus className="h-3.5 w-3.5" /> No change
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Points Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">
            Snapshot history ({data.length} day{data.length === 1 ? '' : 's'})
          </h2>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                  Score
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                  Controls
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                  Evidence
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                  Tasks Open
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                  Overdue
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                  Incidents
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data
                .slice()
                .reverse()
                .map((s) => {
                  const m = s.metrics as Record<string, number>;
                  return (
                    <tr key={s.snapshot_date} className="hover:bg-muted/30">
                      <td className="px-4 py-2">
                        {formatDay(s.snapshot_date)}
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {m.compliance_score ?? 0}%
                      </td>
                      <td className="px-4 py-2 text-right">
                        {m.controls_satisfied ?? 0}/{m.controls_total ?? 0}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {m.evidence_total ?? 0}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {m.tasks_open ?? 0}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span
                          className={
                            (m.tasks_overdue ?? 0) > 0 ? 'text-destructive' : ''
                          }
                        >
                          {m.tasks_overdue ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {m.incidents_this_month ?? 0}
                      </td>
                    </tr>
                  );
                })}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No snapshot data yet. Daily snapshots are captured
                    automatically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

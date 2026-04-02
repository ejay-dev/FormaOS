import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

export const metadata = { title: 'Trend Analytics | FormaOS' };

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const sp = await searchParams;
  const db = await createSupabaseServerClient();

  // Default to last 6 months
  const to = sp.to ?? new Date().toISOString().slice(0, 10);
  const from =
    sp.from ??
    new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

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

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trend Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your compliance posture over time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {from} — {to}
          </span>
        </div>
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
                      change > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
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
            Daily Snapshots ({data.length} data points)
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
                      <td className="px-4 py-2">{s.snapshot_date}</td>
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
                            (m.tasks_overdue ?? 0) > 0
                              ? 'text-red-600 dark:text-red-400'
                              : ''
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
  );
}

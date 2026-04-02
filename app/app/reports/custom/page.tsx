import { redirect } from 'next/navigation';
import Link from 'next/link';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Plus, Clock, Calendar, FileBarChart } from 'lucide-react';

export const metadata = { title: 'My Reports | FormaOS' };

export default async function CustomReportsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = await createSupabaseServerClient();

  const { data: reports } = await db
    .from('org_saved_reports')
    .select('id, name, description, type, schedule, created_at, updated_at')
    .eq('org_id', state.organization.id)
    .order('updated_at', { ascending: false });

  const items = reports ?? [];
  const scheduled = items.filter((r) => r.schedule != null);
  const custom = items.filter((r) => r.type === 'custom');

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Reports</h1>
          <p className="text-sm text-muted-foreground">
            Build custom reports and schedule automated delivery.
          </p>
        </div>
        <Link
          href="/app/reports/custom/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Report
        </Link>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2">
        <Link
          href="/app/reports"
          className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          Standard Reports
        </Link>
        <span className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-foreground">
          My Reports
        </span>
        <Link
          href="/app/reports/trends"
          className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          Trends
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileBarChart className="h-4 w-4" />
            <span className="text-xs font-medium">Total Reports</span>
          </div>
          <p className="mt-1 text-2xl font-semibold">{items.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Scheduled</span>
          </div>
          <p className="mt-1 text-2xl font-semibold">{scheduled.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium">Custom</span>
          </div>
          <p className="mt-1 text-2xl font-semibold">{custom.length}</p>
        </div>
      </div>

      {/* Reports List */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">All Reports</h2>
        </div>
        <div className="divide-y divide-border">
          {items.map((r) => (
            <Link
              key={r.id}
              href={`/app/reports/custom/${r.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/30"
            >
              <div>
                <p className="text-sm font-medium">{r.name}</p>
                {r.description && (
                  <p className="text-xs text-muted-foreground">
                    {r.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {r.schedule && (
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                    Scheduled
                  </span>
                )}
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                  {r.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.updated_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
          {items.length === 0 && (
            <div className="px-4 py-12 text-center text-muted-foreground">
              <FileBarChart className="mx-auto h-8 w-8 opacity-50" />
              <p className="mt-2 text-sm">
                No reports yet. Create your first custom report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

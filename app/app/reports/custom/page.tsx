import { redirect } from 'next/navigation';
import Link from 'next/link';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isMissingSupabaseTableError } from '@/lib/supabase/schema-compat';
import { Plus, Clock, Calendar, FileBarChart, Lock } from 'lucide-react';
import { ReportsTabs } from '../ReportsTabs';

export const metadata = { title: 'My Reports | FormaOS' };

export default async function CustomReportsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const db = createSupabaseAdminClient();
  const { data: entitlement } = await db
    .from('org_entitlements')
    .select('enabled')
    .eq('organization_id', state.organization.id)
    .eq('feature_key', 'custom_reports')
    .maybeSingle();
  const customReportsEnabled = entitlement?.enabled === true;

  const { data: reports, error: reportsError } = await db
    .from('org_saved_reports')
    .select('id, name, description, type, schedule, created_at, updated_at')
    .eq('org_id', state.organization.id)
    .order('updated_at', { ascending: false });

  const reportsUnavailable = isMissingSupabaseTableError(
    reportsError,
    'org_saved_reports',
  );

  const items = reports ?? [];
  const scheduled = items.filter((r) => r.schedule != null);
  const custom = items.filter((r) => r.type === 'custom');

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">My reports</h1>
          <p className="page-description">
            Build custom reports and schedule automated delivery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ReportsTabs current="/app/reports/custom" />
          {reportsUnavailable || !customReportsEnabled ? (
            <button
              type="button"
              disabled
              data-testid="custom-reports-schema-disabled"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-muted-foreground"
            >
              <Lock className="h-3.5 w-3.5" />
              {customReportsEnabled
                ? 'Custom reports unavailable'
                : 'Not on your plan'}
            </button>
          ) : (
            <Link
              href="/app/reports/custom/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              New report
            </Link>
          )}
        </div>
      </div>

      <div className="page-content space-y-4">
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
          <h2 className="font-semibold">All reports</h2>
        </div>
        <div className="divide-y divide-border">
          {(reportsUnavailable || !customReportsEnabled) && (
            <div className="px-4 py-12 text-center text-muted-foreground">
              <Lock className="mx-auto h-8 w-8 opacity-50" />
              {customReportsEnabled ? (
                <>
                  <p className="mt-2 text-sm">
                    Custom report storage is not enabled for this workspace yet.
                  </p>
                  <p className="mt-1 text-xs">
                    Creating and scheduling reports stays switched off until it
                    is. Contact support to turn it on.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm">
                  Custom reports are available on the Growth and Enterprise
                  plans.
                </p>
              )}
            </div>
          )}
          {!reportsUnavailable && customReportsEnabled && items.map((r) => (
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
                  <span className="rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info">
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
          {!reportsUnavailable && customReportsEnabled && items.length === 0 && (
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
    </div>
  );
}

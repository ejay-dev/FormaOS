import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isMissingSupabaseTableError } from '@/lib/supabase/schema-compat';
import { requireEntitlement } from '@/lib/billing/entitlements';

export const metadata = { title: 'New Custom Report | FormaOS' };

async function createCustomReport(formData: FormData) {
  'use server';
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');
  try {
    await requireEntitlement(state.organization.id, 'custom_reports');
  } catch {
    redirect('/app/reports/custom/new?error=custom-reports-entitlement-required');
  }

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const dataset = String(formData.get('dataset') ?? 'controls');

  if (!name) redirect('/app/reports/custom/new?error=name-required');

  const db = createSupabaseAdminClient();
  const { error } = await db.from('org_saved_reports').insert({
    org_id: state.organization.id,
    name,
    description: description || null,
    config: { dataset, filters: {}, columns: [] },
    created_by: state.user.id,
  });

  if (error)
    redirect(`/app/reports/custom/new?error=${encodeURIComponent(error.message)}`);
  redirect('/app/reports/custom');
}

export default async function NewCustomReportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');
  const { error } = await searchParams;
  const db = createSupabaseAdminClient();
  const { data: entitlement } = await db
    .from('org_entitlements')
    .select('enabled')
    .eq('organization_id', state.organization.id)
    .eq('feature_key', 'custom_reports')
    .maybeSingle();
  const customReportsEnabled = entitlement?.enabled === true;
  const { error: schemaError } = await db
    .from('org_saved_reports')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', state.organization.id);
  const reportsUnavailable = isMissingSupabaseTableError(
    schemaError,
    'org_saved_reports',
  );

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link
            href="/app/reports/custom"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div>
            <h1 className="page-title">New Custom Report</h1>
            <p className="page-description">
              Define a reusable report over your compliance data
            </p>
          </div>
        </div>
      </div>

      <div className="page-content max-w-2xl">
        {(reportsUnavailable || !customReportsEnabled) && (
          <div
            className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground"
            data-testid="custom-report-create-disabled"
          >
            {customReportsEnabled
              ? 'Custom report creation is unavailable until the reporting storage schema is provisioned for this workspace.'
              : 'Custom report creation requires a Growth or Enterprise entitlement.'}
          </div>
        )}
        {!reportsUnavailable && customReportsEnabled && error && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {!reportsUnavailable && customReportsEnabled && <form
          action={createCustomReport}
          className="space-y-4 rounded-lg border border-border bg-card p-5"
        >
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Report name <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. SOC 2 control status — Q2"
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="What this report shows and who reviews it"
            />
          </div>
          <div>
            <label htmlFor="dataset" className="mb-1 block text-sm font-medium">
              Primary dataset
            </label>
            <select
              id="dataset"
              name="dataset"
              defaultValue="controls"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="controls">Controls</option>
              <option value="evidence">Evidence</option>
              <option value="incidents">Incidents</option>
              <option value="tasks">Tasks</option>
              <option value="audit_logs">Audit logs</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              You can refine filters and columns after creation.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Link
              href="/app/reports/custom"
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Report
            </button>
          </div>
        </form>}
      </div>
    </div>
  );
}

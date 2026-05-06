import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, FileBarChart, Play } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireEntitlement } from '@/lib/billing/entitlements';
import { scheduleReport, unscheduleReport } from '@/lib/reports/scheduler';
import { logAuditEvent } from '@/app/app/actions/audit-events';

export const metadata = { title: 'Custom Report | FormaOS' };

function fmtDate(value?: string | null) {
  if (!value) return 'Not generated yet';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'Not generated yet';
  }
}

function getDataset(config: unknown) {
  if (!config || typeof config !== 'object') return 'controls';
  const dataset = (config as { dataset?: unknown }).dataset;
  return typeof dataset === 'string' && dataset.length > 0 ? dataset : 'controls';
}

async function fetchCustomReportRows(
  db: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
  dataset: string,
) {
  const tableByDataset: Record<string, { table: string; orgColumn: string }> = {
    controls: { table: 'org_control_evaluations', orgColumn: 'organization_id' },
    evidence: { table: 'org_evidence', orgColumn: 'organization_id' },
    incidents: { table: 'org_incidents', orgColumn: 'organization_id' },
    tasks: { table: 'org_tasks', orgColumn: 'organization_id' },
    audit_logs: { table: 'org_audit_logs', orgColumn: 'organization_id' },
  };
  const source = tableByDataset[dataset] ?? tableByDataset.controls;

  const { data, error } = await db
    .from(source.table)
    .select('*')
    .eq(source.orgColumn, orgId)
    .order('created_at', { ascending: false })
    .limit(250);

  if (error) {
    return {
      rows: [],
      warning: `${source.table}: ${error.message}`,
    };
  }

  return {
    rows: (data ?? []) as Array<Record<string, unknown>>,
    warning: null,
  };
}

async function generateCustomReportSnapshot(formData: FormData) {
  'use server';
  const state = await fetchSystemState();
  if (!state) redirect('/signin');
  await requireEntitlement(state.organization.id, 'custom_reports');

  const reportId = String(formData.get('reportId') ?? '');
  const format = String(formData.get('format') ?? 'json');
  if (!reportId) redirect('/app/reports/custom?error=missing-report');

  const db = createSupabaseAdminClient();
  const { data: report } = await db
    .from('org_saved_reports')
    .select('id, name, config')
    .eq('id', reportId)
    .eq('org_id', state.organization.id)
    .maybeSingle();

  if (!report) redirect('/app/reports/custom?error=report-not-found');

  const dataset = getDataset(report.config);
  const snapshot = await fetchCustomReportRows(db, state.organization.id, dataset);
  const payload = {
    reportId,
    reportName: report.name,
    dataset,
    generatedAt: new Date().toISOString(),
    rowCount: snapshot.rows.length,
    warning: snapshot.warning,
    preview: snapshot.rows.slice(0, 20),
  };
  const size = Buffer.byteLength(JSON.stringify(payload), 'utf8');
  const generatedAt = new Date().toISOString();

  await db.from('org_report_generations').insert({
    report_id: reportId,
    org_id: state.organization.id,
    generated_by: state.user.id,
    format,
    file_url: null,
    file_size_bytes: size,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  await db
    .from('org_saved_reports')
    .update({ last_generated_at: generatedAt })
    .eq('id', reportId)
    .eq('org_id', state.organization.id);

  await logAuditEvent({
    organizationId: state.organization.id,
    actorUserId: state.user.id,
    actorRole: state.role,
    entityType: 'report',
    entityId: reportId,
    actionType: 'CUSTOM_REPORT_GENERATED',
    afterState: {
      dataset,
      format,
      rowCount: snapshot.rows.length,
      warning: snapshot.warning,
    },
    reason: 'generate',
  });

  redirect(`/app/reports/custom/${reportId}?generated=1`);
}

async function scheduleCustomReportDelivery(formData: FormData) {
  'use server';
  const state = await fetchSystemState();
  if (!state) redirect('/signin');
  await requireEntitlement(state.organization.id, 'custom_reports');

  const reportId = String(formData.get('reportId') ?? '');
  const frequency = String(formData.get('frequency') ?? 'weekly');
  const format = String(formData.get('format') ?? 'csv') as
    | 'pdf'
    | 'csv'
    | 'xlsx';
  const hour = Number(formData.get('hour') ?? 8);
  const recipients = String(formData.get('recipients') ?? '')
    .split(/[\n, ]+/)
    .map((email) => email.trim())
    .filter(Boolean);

  if (!reportId) redirect('/app/reports/custom?error=missing-report');
  if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
    redirect(`/app/reports/custom/${reportId}?error=invalid-frequency`);
  }
  if (!['pdf', 'csv', 'xlsx'].includes(format)) {
    redirect(`/app/reports/custom/${reportId}?error=invalid-format`);
  }

  const db = createSupabaseAdminClient();
  await scheduleReport(db, reportId, state.organization.id, {
    frequency: frequency as 'daily' | 'weekly' | 'monthly',
    recipients,
    format,
    hour: Number.isFinite(hour) ? Math.min(Math.max(hour, 0), 23) : 8,
  });

  await logAuditEvent({
    organizationId: state.organization.id,
    actorUserId: state.user.id,
    actorRole: state.role,
    entityType: 'report',
    entityId: reportId,
    actionType: 'CUSTOM_REPORT_SCHEDULED',
    afterState: { frequency, format, recipients: recipients.length },
    reason: 'schedule',
  });

  redirect(`/app/reports/custom/${reportId}?scheduled=1`);
}

async function unscheduleCustomReportDelivery(formData: FormData) {
  'use server';
  const state = await fetchSystemState();
  if (!state) redirect('/signin');
  await requireEntitlement(state.organization.id, 'custom_reports');

  const reportId = String(formData.get('reportId') ?? '');
  if (!reportId) redirect('/app/reports/custom?error=missing-report');

  const db = createSupabaseAdminClient();
  await unscheduleReport(db, reportId, state.organization.id);

  await logAuditEvent({
    organizationId: state.organization.id,
    actorUserId: state.user.id,
    actorRole: state.role,
    entityType: 'report',
    entityId: reportId,
    actionType: 'CUSTOM_REPORT_UNSCHEDULED',
    reason: 'unschedule',
  });

  redirect(`/app/reports/custom/${reportId}?unscheduled=1`);
}

export default async function CustomReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    generated?: string;
    scheduled?: string;
    unscheduled?: string;
    error?: string;
  }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const { id } = await params;
  await requireEntitlement(state.organization.id, 'custom_reports');
  const notices = await searchParams;
  const db = createSupabaseAdminClient();
  const [{ data: report }, { data: generations }] = await Promise.all([
    db
    .from('org_saved_reports')
    .select('id, name, description, type, config, schedule, last_generated_at, created_at, updated_at')
    .eq('id', id)
    .eq('org_id', state.organization.id)
      .maybeSingle(),
    db
      .from('org_report_generations')
      .select('id, format, generated_at, file_size_bytes')
      .eq('report_id', id)
      .eq('org_id', state.organization.id)
      .order('generated_at', { ascending: false })
      .limit(5),
  ]);

  if (!report) notFound();

  const dataset = getDataset(report.config);
  const schedule = report.schedule as
    | {
        frequency?: string;
        format?: string;
        recipients?: string[];
        next_send_at?: string;
      }
    | null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/app/reports/custom"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{report.name}</h1>
          <p className="text-sm text-muted-foreground">
            Custom report configuration
          </p>
        </div>
      </div>

      {notices.generated || notices.scheduled || notices.unscheduled || notices.error ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            notices.error
              ? 'border-destructive/40 bg-destructive/5 text-destructive'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          {notices.error
            ? notices.error.replaceAll('-', ' ')
            : notices.generated
              ? 'Report snapshot generated.'
              : notices.scheduled
                ? 'Report delivery schedule saved.'
                : 'Report delivery schedule removed.'}
        </div>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileBarChart className="h-4 w-4 text-muted-foreground" />
          Report summary
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Dataset
            </dt>
            <dd className="mt-1 capitalize">{dataset.replaceAll('_', ' ')}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Type
            </dt>
            <dd className="mt-1 capitalize">{report.type}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Last generated
            </dt>
            <dd className="mt-1">{fmtDate(report.last_generated_at)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Updated
            </dt>
            <dd className="mt-1">{fmtDate(report.updated_at)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Schedule
            </dt>
            <dd className="mt-1">
              {schedule?.frequency
                ? `${schedule.frequency} ${schedule.next_send_at ? `- next ${fmtDate(schedule.next_send_at)}` : ''}`
                : 'Not scheduled'}
            </dd>
          </div>
        </dl>
        <div className="mt-6">
          <h2 className="text-sm font-semibold">Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {report.description || 'No description recorded.'}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <Play className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold">In-app generation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a real report snapshot from the selected dataset and
              record it in the generation ledger.
            </p>
            <form
              action={generateCustomReportSnapshot}
              className="mt-4 flex flex-wrap items-end gap-3"
            >
              <input type="hidden" name="reportId" value={report.id} />
              <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>Format</span>
                <select
                  name="format"
                  defaultValue="json"
                  className="block rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground"
                >
                  <option value="json">JSON snapshot</option>
                  <option value="csv">CSV snapshot</option>
                </select>
              </label>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Generate Now
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="w-full">
            <h2 className="text-sm font-semibold">Scheduled delivery</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Save an automated delivery cadence for this report.
            </p>
            <form
              action={scheduleCustomReportDelivery}
              className="mt-4 grid gap-3 sm:grid-cols-4"
            >
              <input type="hidden" name="reportId" value={report.id} />
              <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>Frequency</span>
                <select
                  name="frequency"
                  defaultValue={schedule?.frequency ?? 'weekly'}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>Format</span>
                <select
                  name="format"
                  defaultValue={schedule?.format ?? 'csv'}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground"
                >
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                  <option value="xlsx">XLSX</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>Hour UTC</span>
                <input
                  type="number"
                  name="hour"
                  min={0}
                  max={23}
                  defaultValue={8}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground"
                />
              </label>
              <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:col-span-4">
                <span>Recipients</span>
                <textarea
                  name="recipients"
                  rows={2}
                  defaultValue={(schedule?.recipients ?? []).join('\n')}
                  placeholder="ops@example.com, compliance@example.com"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground"
                />
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-4">
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Save Schedule
                </button>
              </div>
            </form>
            {schedule ? (
              <form action={unscheduleCustomReportDelivery} className="mt-3">
                <input type="hidden" name="reportId" value={report.id} />
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Remove Schedule
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Recent generations</h2>
        <div className="mt-3 divide-y divide-border">
          {(generations ?? []).length > 0 ? (
            (generations ?? []).map(
              (generation: {
                id: string;
                format: string;
                generated_at: string;
                file_size_bytes: number | null;
              }) => (
                <div
                  key={generation.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="capitalize">{generation.format}</span>
                  <span className="text-muted-foreground">
                    {fmtDate(generation.generated_at)}
                  </span>
                  <span className="text-muted-foreground">
                    {generation.file_size_bytes ?? 0} bytes
                  </span>
                </div>
              ),
            )
          ) : (
            <p className="py-3 text-sm text-muted-foreground">
              No generation snapshots yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileBarChart, Lock } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

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

export default async function CustomReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const { id } = await params;
  const db = createSupabaseAdminClient();
  const { data: report } = await db
    .from('org_saved_reports')
    .select('id, name, description, type, config, schedule, last_generated_at, created_at, updated_at')
    .eq('id', id)
    .eq('org_id', state.organization.id)
    .maybeSingle();

  if (!report) notFound();

  const dataset = getDataset(report.config);

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
          <Lock className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold">In-app generation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Custom report generation is available through the API for
              configured API-key clients. In-app generation and scheduling are
              not enabled in this workspace UI yet.
            </p>
            <button
              type="button"
              disabled
              className="mt-4 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
              data-testid="custom-report-generation-disabled"
            >
              Generate in app unavailable
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/system-state/server';
import {
  Search,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { InvestigationAnalysisPanel } from '@/components/incidents/investigation-analysis-panel';

export const metadata = { title: 'Investigation' };

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}

async function startInvestigation(formData: FormData) {
  'use server';
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const incidentId = String(formData.get('incidentId') ?? '').trim();
  if (!incidentId) redirect('/app/incidents');

  const leadRaw = String(formData.get('lead_investigator_id') ?? '').trim();
  const methodologyRaw = String(formData.get('methodology') ?? '').trim();
  const dueDateRaw = String(formData.get('due_date') ?? '').trim();
  const findingsRaw = String(formData.get('findings') ?? '').trim();

  const db = await createSupabaseServerClient();

  const { data: incident } = await db
    .from('org_incidents')
    .select('id')
    .eq('id', incidentId)
    .eq('organization_id', state.organization.id)
    .maybeSingle();

  if (!incident) {
    redirect('/app/incidents');
  }

  const payload: Record<string, unknown> = {
    organization_id: state.organization.id,
    incident_id: incidentId,
    status: 'assigned',
  };
  if (leadRaw) payload.lead_investigator_id = leadRaw;
  if (dueDateRaw) payload.due_date = dueDateRaw;
  if (methodologyRaw) payload.methodology = methodologyRaw;
  if (findingsRaw) payload.findings = findingsRaw;

  const { error } = await db.from('org_investigations').insert(payload);

  if (error) {
    const msg = encodeURIComponent(error.message);
    redirect(`/app/incidents/${incidentId}/investigation?error=${msg}`);
  }

  await db
    .from('org_incidents')
    .update({ status: 'investigating' })
    .eq('id', incidentId)
    .eq('organization_id', state.organization.id);

  revalidatePath(`/app/incidents/${incidentId}`);
  revalidatePath(`/app/incidents/${incidentId}/investigation`);
  redirect(`/app/incidents/${incidentId}/investigation`);
}

export default async function InvestigationPage({
  params,
  searchParams,
}: PageProps) {
  const { id: incidentId } = await params;
  const { error: formError } = (await searchParams) ?? {};
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const db = await createSupabaseServerClient();

  const { data: incident } = await db
    .from('org_incidents')
    .select('id, incident_type, severity, status, description, created_at')
    .eq('id', incidentId)
    .eq('organization_id', state.organization.id)
    .single();

  if (!incident) redirect('/app/incidents');

  const incidentLabel =
    (incident.description as string | null)?.slice(0, 60) ||
    (incident.incident_type as string | null) ||
    'Incident';

  const { data: investigation } = await db
    .from('org_investigations')
    .select('*')
    .eq('incident_id', incidentId)
    .maybeSingle();

  const { data: members } = await db
    .from('org_members')
    .select('user_id, role')
    .eq('organization_id', state.organization.id);

  const memberOptions = (members ?? []).map((m) => ({
    id: m.user_id as string,
    label: (m.role as string) ?? 'member',
  }));

  const statusIcons: Record<string, typeof CheckCircle2> = {
    assigned: Clock,
    in_progress: AlertCircle,
    findings_ready: FileText,
    review: Search,
    closed: CheckCircle2,
  };

  const StatusIcon = investigation
    ? (statusIcons[investigation.status] ?? Clock)
    : Clock;

  // Structured RCA: only available once a methodology has been chosen.
  const RCA_METHODOLOGIES = [
    '5_whys',
    'fishbone',
    'timeline_analysis',
    'barrier_analysis',
  ] as const;
  const rcaMethodology =
    investigation &&
    RCA_METHODOLOGIES.includes(
      investigation.methodology as (typeof RCA_METHODOLOGIES)[number],
    )
      ? (investigation.methodology as (typeof RCA_METHODOLOGIES)[number])
      : null;
  const rcaAnalysis = (investigation?.analysis_data ?? {}) as {
    whys?: string[];
    fishbone?: Record<string, string[]>;
    timeline?: Array<{ time: string; event: string }>;
    barriers?: Array<{ barrier: string; status: string }>;
  };
  const rcaInitialData = {
    rootCause: (investigation?.root_cause as string | null) ?? undefined,
    contributingFactors:
      (investigation?.contributing_factors as string[] | null) ?? undefined,
    whys: rcaAnalysis.whys,
    fishbone: rcaAnalysis.fishbone,
    timeline: rcaAnalysis.timeline,
    barriers: rcaAnalysis.barriers,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app/incidents" className="hover:underline">
          Incidents
        </Link>
        <span>/</span>
        <Link href={`/app/incidents/${incidentId}`} className="hover:underline">
          {incidentLabel}
        </Link>
        <span>/</span>
        <span>Investigation</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Investigation</h1>
        <p className="text-muted-foreground">
          {incidentLabel} — {incident.incident_type} ({incident.severity})
        </p>
      </div>

      {investigation ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted">
              <StatusIcon className="h-3.5 w-3.5" />
              {investigation.status.replace(/_/g, ' ')}
            </span>
            <span className="text-sm text-muted-foreground">
              Methodology:{' '}
              <span className="font-medium">
                {investigation.methodology?.replace(/_/g, ' ') ?? 'Not set'}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <User className="h-4 w-4 text-muted-foreground" /> Lead
                Investigator
              </div>
              <p className="text-sm">
                {investigation.lead_investigator_id ?? 'Not assigned'}
              </p>
            </div>
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" /> Due Date
              </div>
              <p className="text-sm">
                {investigation.due_date
                  ? new Date(investigation.due_date).toLocaleDateString()
                  : 'Not set'}
              </p>
            </div>
          </div>

          {investigation.findings && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-medium mb-2">Findings</h3>
              <p className="text-sm whitespace-pre-wrap">
                {investigation.findings}
              </p>
            </div>
          )}

          {investigation.root_cause && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-medium mb-2">Root Cause</h3>
              <p className="text-sm whitespace-pre-wrap">
                {investigation.root_cause}
              </p>
            </div>
          )}

          {rcaMethodology && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-medium mb-4">
                Root-Cause Analysis —{' '}
                {rcaMethodology.replace(/_/g, ' ')}
              </h3>
              <InvestigationAnalysisPanel
                incidentId={incidentId}
                methodology={rcaMethodology}
                initialData={rcaInitialData}
              />
            </div>
          )}

          {investigation.interviews &&
            (investigation.interviews as unknown[]).length > 0 && (
              <div className="border border-border rounded-lg p-4 bg-card">
                <h3 className="text-sm font-medium mb-2">Interview Log</h3>
                <div className="space-y-2">
                  {(
                    investigation.interviews as Array<{
                      interviewee: string;
                      date: string;
                      notes: string;
                    }>
                  ).map((iv, i) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-3">
                      <p className="text-sm font-medium">{iv.interviewee}</p>
                      <p className="text-xs text-muted-foreground">{iv.date}</p>
                      <p className="text-sm mt-0.5">{iv.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {investigation.recommendations && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-medium mb-2">Recommendations</h3>
              <p className="text-sm whitespace-pre-wrap">
                {investigation.recommendations}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-lg p-6 bg-card">
          <div className="flex items-start gap-3 mb-4">
            <Search className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-medium">Start Investigation</h3>
              <p className="text-sm text-muted-foreground">
                Assign a lead investigator and establish the methodology to
                begin root-cause analysis.
              </p>
            </div>
          </div>

          {formError && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          )}

          <form action={startInvestigation} className="space-y-4">
            <input type="hidden" name="incidentId" value={incidentId} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="lead_investigator_id"
                  className="mb-1 block text-sm font-medium"
                >
                  Lead investigator
                </label>
                <select
                  id="lead_investigator_id"
                  name="lead_investigator_id"
                  defaultValue=""
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Unassigned</option>
                  {memberOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id.slice(0, 8)} ({m.label})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="due_date"
                  className="mb-1 block text-sm font-medium"
                >
                  Target completion date
                </label>
                <input
                  id="due_date"
                  name="due_date"
                  type="date"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="methodology"
                className="mb-1 block text-sm font-medium"
              >
                Methodology
              </label>
              <select
                id="methodology"
                name="methodology"
                defaultValue=""
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Not decided</option>
                <option value="5_whys">5 Whys</option>
                <option value="fishbone">Fishbone (Ishikawa)</option>
                <option value="timeline_analysis">Timeline analysis</option>
                <option value="barrier_analysis">Barrier analysis</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="findings"
                className="mb-1 block text-sm font-medium"
              >
                Initial notes
              </label>
              <textarea
                id="findings"
                name="findings"
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Known facts, immediate actions taken, witnesses, etc."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Link
                href={`/app/incidents/${incidentId}`}
                className="inline-flex min-h-[44px] md:min-h-0 items-center justify-center rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex min-h-[44px] md:min-h-0 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Start investigation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

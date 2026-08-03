import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/system-state/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CalendarClock,
  ClipboardList,
  ClipboardCheck,
  NotebookPen,
  Pencil,
  Phone,
  Pill,
  ShieldAlert,
  User,
} from 'lucide-react';
import { severityLabel } from '@/components/care/severity-badge';
import { normalizeRole } from '@/app/app/actions/rbac';
import {
  createProgressNote,
  signOffProgressNote,
} from '@/app/app/actions/progress-notes';
import { startShift, endShift } from '@/app/app/actions/patients';
import { createTask } from '@/app/app/actions/tasks';
import { logAuditEvent } from '@/app/app/actions/audit-events';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/app/participants/[id]');

function getEntityLabel(industry: string | null): string {
  switch (industry) {
    case 'ndis':
      return 'Participant';
    case 'healthcare':
      return 'Patient';
    case 'aged_care':
      return 'Resident';
    default:
      return 'Client';
  }
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}

type ParticipantRow = {
  id: string;
  full_name: string;
  preferred_name: string | null;
  external_id: string | null;
  date_of_birth: string | null;
  care_status: string;
  risk_level: string;
  emergency_flag: boolean;
  phone: string | null;
  email: string | null;
  address: string | null;
  funding_type: string | null;
  primary_diagnosis: string | null;
  ndis_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  communication_needs: string | null;
  cultural_considerations: string | null;
  created_at: string;
  updated_at: string;
};

const NOTE_TAGS = [
  { value: 'routine', label: 'Routine' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'incident', label: 'Incident' },
  { value: 'risk', label: 'Risk' },
];

export default async function ParticipantDetailPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const participantId = resolvedParams?.id ?? '';
  if (!participantId) redirect('/app/participants');

  const systemState = await fetchSystemState();
  if (!systemState) redirect('/auth/signin');

  const orgId = systemState.organization.id;
  const label = getEntityLabel(systemState.organization.industry);
  const supabase = await createSupabaseServerClient();

  const [
    { data: participant },
    { data: recentVisits },
    { data: recentIncidents },
    { data: carePlans },
    { data: membership },
    { count: activeMedications },
    { data: progressNotes },
    { data: linkedTasks },
    { data: shifts },
  ] = await Promise.all([
    supabase
      .from('org_patients')
      .select(
        `
          id,
          full_name,
          preferred_name,
          external_id,
          date_of_birth,
          care_status,
          risk_level,
          emergency_flag,
          phone,
          email,
          address,
          funding_type,
          primary_diagnosis,
          ndis_number,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          communication_needs,
          cultural_considerations,
          created_at,
          updated_at
        `,
      )
      .eq('organization_id', orgId)
      .eq('id', participantId)
      .maybeSingle(),
    supabase
      .from('org_visits')
      .select('id, status, scheduled_start, visit_type')
      .eq('organization_id', orgId)
      .eq('client_id', participantId)
      .order('scheduled_start', { ascending: false })
      .limit(6),
    supabase
      .from('org_incidents')
      .select('id, severity, status, occurred_at, incident_type')
      .eq('organization_id', orgId)
      .eq('patient_id', participantId)
      .order('occurred_at', { ascending: false })
      .limit(6),
    supabase
      .from('org_care_plans')
      .select('id, title, status, review_date, goals')
      .eq('organization_id', orgId)
      .eq('client_id', participantId)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('org_members')
      .select('role')
      .eq('user_id', systemState.user.id)
      .eq('organization_id', orgId)
      .maybeSingle(),
    // org_medications scopes by `org_id` / `participant_id`, unlike the
    // rest of the care tables — see the medication chart and administer route.
    supabase
      .from('org_medications')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('participant_id', participantId)
      .eq('status', 'active'),
    supabase
      .from('org_progress_notes')
      .select(
        'id, note_text, status_tag, created_at, signed_off_by, signed_off_at',
      )
      .eq('organization_id', orgId)
      .eq('patient_id', participantId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('org_tasks')
      .select('id, title, status, due_date, priority')
      .eq('organization_id', orgId)
      .eq('patient_id', participantId)
      .order('due_date', { ascending: true })
      .limit(10),
    supabase
      .from('org_shifts')
      .select('id, status, started_at, ended_at, staff_user_id')
      .eq('organization_id', orgId)
      .eq('patient_id', participantId)
      .order('started_at', { ascending: false })
      .limit(6),
  ]);

  const profile = participant as ParticipantRow | null;
  if (!profile) notFound();

  const roleKey = normalizeRole(membership?.role ?? null);
  // Same gates the server actions enforce: staff and above can record,
  // manager and above can sign off and raise tasks.
  const canWrite = ['OWNER', 'COMPLIANCE_OFFICER', 'MANAGER', 'STAFF'].includes(
    roleKey,
  );
  const canAdmin = ['OWNER', 'COMPLIANCE_OFFICER', 'MANAGER'].includes(roleKey);

  const notes = (progressNotes ?? []) as Array<{
    id: string;
    note_text: string;
    status_tag: string | null;
    created_at: string;
    signed_off_by: string | null;
  }>;
  const tasks = (linkedTasks ?? []) as Array<{
    id: string;
    title: string;
    status: string | null;
    due_date: string | null;
    priority: string | null;
  }>;
  const shiftRows = (shifts ?? []) as Array<{
    id: string;
    status: string;
    started_at: string;
    ended_at: string | null;
    staff_user_id: string;
  }>;

  const activeShift = shiftRows.find(
    (shift) =>
      shift.status === 'active' && shift.staff_user_id === systemState.user.id,
  );

  // HIPAA §164.312(b) requires a read event on PHI, and this page loads full
  // demographics, diagnosis, medications and incident history. Fire-and-forget
  // so a slow audit insert never delays render, but a failed write is itself a
  // compliance signal, so it is logged loudly rather than swallowed.
  void logAuditEvent({
    organizationId: orgId,
    actorUserId: systemState.user.id,
    actorRole: roleKey,
    entityType: 'patient',
    entityId: profile.id,
    actionType: 'PATIENT_VIEWED',
    afterState: {
      view: 'detail',
      notes_loaded: notes.length,
      tasks_loaded: tasks.length,
      incidents_loaded: (recentIncidents ?? []).length,
    },
    reason: 'phi_read',
  }).catch((err) => {
    log.error(
      {
        err,
        organizationId: orgId,
        actorUserId: systemState.user.id,
        entityId: profile.id,
        actionType: 'PATIENT_VIEWED',
      },
      'HIPAA PHI-read audit emission failed — compliance evidence missing',
    );
  });

  const openIncidents = (recentIncidents ?? []).filter(
    (item: { status?: string }) => item.status === 'open',
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/app/participants"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {label.toLowerCase()} list
          </Link>
          <h1 className="page-title">{profile.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            {label} profile and linked operations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/app/participants/${participantId}/edit`}
            className="min-h-[44px] md:min-h-0 inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-accent transition-colors"
            data-testid="edit-participant-btn"
          >
            <Pencil className="h-4 w-4" />
            Edit details
          </Link>
          <Link
            href={`/app/visits/new?client_id=${participantId}`}
            className="min-h-[44px] md:min-h-0 inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            <CalendarClock className="h-4 w-4" />
            Schedule Visit
          </Link>
          <Link
            href={`/app/incidents/new?client_id=${participantId}`}
            className="min-h-[44px] md:min-h-0 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            Report Incident
          </Link>
        </div>
      </div>

      {profile.emergency_flag || profile.risk_level === 'critical' ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-4">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-destructive">
            <ShieldAlert className="h-4 w-4" />
            Elevated risk profile
          </div>
          <p className="mt-1 text-xs text-foreground">
            This {label.toLowerCase()} has emergency or critical-risk markers.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Active Incidents
          </p>
          <p className="mt-1 text-2xl font-semibold">{openIncidents}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Recent Visits
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {recentVisits?.length ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Care Status
          </p>
          <p className="mt-1 text-2xl font-semibold capitalize">
            {profile.care_status}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <User className="h-4 w-4" />
            Profile
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Preferred Name</dt>
              <dd>{profile.preferred_name || 'N/A'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">External ID</dt>
              <dd>{profile.external_id || profile.ndis_number || 'N/A'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Date of Birth</dt>
              <dd>{profile.date_of_birth || 'N/A'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Funding</dt>
              <dd className="capitalize">{profile.funding_type || 'N/A'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Diagnosis</dt>
              <dd>{profile.primary_diagnosis || 'N/A'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Updated</dt>
              <dd>{formatDateTime(profile.updated_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Phone className="h-4 w-4" />
            Contact & Safety
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{profile.phone || 'N/A'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{profile.email || 'N/A'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Emergency Contact</dt>
              <dd>{profile.emergency_contact_name || 'N/A'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Emergency Phone</dt>
              <dd>{profile.emergency_contact_phone || 'N/A'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Relationship</dt>
              <dd>{profile.emergency_contact_relationship || 'N/A'}</dd>
            </div>
            <div className="text-xs text-muted-foreground">
              {profile.address || 'No address provided'}
            </div>
          </dl>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            Recent Visits
          </h2>
          <div className="mt-4 space-y-2">
            {(recentVisits ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No visits recorded.
              </p>
            ) : (
              (recentVisits ?? []).map(
                (visit: {
                  id: string;
                  visit_type?: string;
                  status?: string;
                  scheduled_start?: string;
                }) => (
                  <Link
                    key={visit.id}
                    href={`/app/visits/${visit.id}`}
                    className="min-h-[44px] md:min-h-0 block rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="capitalize">
                        {visit.visit_type || 'service'}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {visit.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(visit.scheduled_start)}
                    </div>
                  </Link>
                ),
              )
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <ClipboardList className="h-4 w-4" />
            Recent Incidents
          </h2>
          <div className="mt-4 space-y-2">
            {(recentIncidents ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No incidents recorded.
              </p>
            ) : (
              (recentIncidents ?? []).map(
                (incident: {
                  id: string;
                  incident_type?: string;
                  severity?: string;
                  status?: string;
                  created_at?: string;
                  occurred_at?: string;
                }) => (
                  <Link
                    key={incident.id}
                    href={`/app/incidents/${incident.id}`}
                    className="min-h-[44px] md:min-h-0 block rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="capitalize">
                        {incident.incident_type || 'general'}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {incident.severity} · {incident.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(incident.occurred_at)}
                    </div>
                  </Link>
                ),
              )
            )}
          </div>
        </section>
      </div>

      <section
        className="rounded-xl border border-border bg-card p-5"
        data-testid="participant-care-plans"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <ClipboardCheck className="h-4 w-4" />
            Care Plans
          </h2>
          <Link
            href={`/app/care-plans/new?client_id=${participantId}`}
            className="text-xs text-primary hover:underline"
          >
            + New care plan
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {(carePlans ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No care plans linked to this {label.toLowerCase()} yet.
            </p>
          ) : (
            (carePlans ?? []).map(
              (plan: {
                id: string;
                title: string | null;
                status: string;
                review_date: string | null;
                goals: unknown;
              }) => {
                const goalsCount = Array.isArray(plan.goals)
                  ? plan.goals.length
                  : 0;
                return (
                  <Link
                    key={plan.id}
                    href={`/app/care-plans/${plan.id}`}
                    className="min-h-[44px] md:min-h-0 block rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">
                        {plan.title ?? 'Untitled plan'}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {plan.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {goalsCount} goal{goalsCount === 1 ? '' : 's'}
                      {plan.review_date
                        ? ` · Review ${new Date(plan.review_date).toLocaleDateString()}`
                        : ''}
                    </div>
                  </Link>
                );
              },
            )
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Pill className="h-4 w-4" />
              Medications
            </h2>
            <Link
              href={`/app/participants/${participantId}/medications`}
              className="text-xs text-primary hover:underline"
            >
              Medication chart
            </Link>
          </div>
          <p className="mt-4 text-2xl font-semibold">{activeMedications ?? 0}</p>
          <p className="text-sm text-muted-foreground">
            {(activeMedications ?? 0) === 1
              ? 'active medication'
              : 'active medications'}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Dosages, as-needed rules, and the administration record are on the
            chart.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Shifts
          </h2>
          {canWrite ? (
            <div className="mt-4">
              {activeShift ? (
                <div className="rounded-lg border border-border px-3 py-3">
                  <p className="text-sm">
                    Your shift started {formatDateTime(activeShift.started_at)}
                  </p>
                  <form
                    action={async (fd: FormData) => {
                      'use server';
                      await endShift(fd);
                    }}
                    className="mt-3"
                  >
                    <input
                      type="hidden"
                      name="shiftId"
                      value={activeShift.id}
                    />
                    <button
                      type="submit"
                      className="min-h-[44px] md:min-h-0 inline-flex items-center rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      End shift
                    </button>
                  </form>
                </div>
              ) : (
                <form
                  action={async (fd: FormData) => {
                    'use server';
                    await startShift(fd);
                  }}
                >
                  <input type="hidden" name="patientId" value={profile.id} />
                  <button
                    type="submit"
                    className="min-h-[44px] md:min-h-0 inline-flex items-center rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    Start shift
                  </button>
                </form>
              )}
            </div>
          ) : null}
          <div className="mt-4 space-y-2">
            {shiftRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No shifts logged yet.
              </p>
            ) : (
              shiftRows.map((shift) => (
                <div
                  key={shift.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="capitalize">{shift.status}</span>
                    <span className="text-xs text-muted-foreground">
                      {shift.ended_at ? 'Ended' : 'Started'}{' '}
                      {formatDateTime(shift.ended_at ?? shift.started_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <NotebookPen className="h-4 w-4" />
              Progress Notes
            </h2>
            <Link
              href="/app/progress-notes"
              className="text-xs text-primary hover:underline"
            >
              All notes
            </Link>
          </div>
          {canWrite ? (
            <form
              action={async (fd: FormData) => {
                'use server';
                await createProgressNote(fd);
              }}
              className="mt-4 grid gap-3"
            >
              <input type="hidden" name="patientId" value={profile.id} />
              <div>
                <label
                  htmlFor="participant-note-tag"
                  className="block text-sm font-medium mb-1"
                >
                  Status tag
                </label>
                <select
                  id="participant-note-tag"
                  name="statusTag"
                  defaultValue="routine"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  {NOTE_TAGS.map((tag) => (
                    <option key={tag.value} value={tag.value}>
                      {tag.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="participant-note-text"
                  className="block text-sm font-medium mb-1"
                >
                  Note
                </label>
                <textarea
                  id="participant-note-text"
                  name="noteText"
                  rows={3}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  placeholder="Document the interaction, outcome, or required follow-up."
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="min-h-[44px] md:min-h-0 inline-flex items-center rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  Save note
                </button>
              </div>
            </form>
          ) : null}
          <div className="mt-4 space-y-2">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No progress notes yet.
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="capitalize">
                      {(note.status_tag ?? 'routine').replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(note.created_at)}
                    </span>
                  </div>
                  <p className="mt-2">{note.note_text}</p>
                  <div className="mt-2 flex items-center gap-3">
                    {note.signed_off_by ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <BadgeCheck className="h-3 w-3" />
                        Signed off
                      </span>
                    ) : null}
                    {canAdmin && !note.signed_off_by ? (
                      <form
                        action={async (fd: FormData) => {
                          'use server';
                          await signOffProgressNote(fd);
                        }}
                      >
                        <input type="hidden" name="noteId" value={note.id} />
                        <button
                          type="submit"
                          className="text-xs text-primary hover:underline"
                        >
                          Sign off
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              Tasks
            </h2>
            <Link
              href="/app/tasks"
              className="text-xs text-primary hover:underline"
            >
              All tasks
            </Link>
          </div>
          {canAdmin ? (
            <form
              action={async (fd: FormData) => {
                'use server';
                await createTask(fd);
              }}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <input type="hidden" name="patientId" value={profile.id} />
              <input type="hidden" name="recurrenceDays" value="0" />
              <div className="sm:col-span-2">
                <label
                  htmlFor="participant-task-title"
                  className="block text-sm font-medium mb-1"
                >
                  Task
                </label>
                <input
                  id="participant-task-title"
                  name="title"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  placeholder={`What needs doing for this ${label.toLowerCase()}`}
                />
              </div>
              <div>
                <label
                  htmlFor="participant-task-priority"
                  className="block text-sm font-medium mb-1"
                >
                  Priority
                </label>
                <select
                  id="participant-task-priority"
                  name="priority"
                  defaultValue="medium"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="participant-task-due"
                  className="block text-sm font-medium mb-1"
                >
                  Due date
                </label>
                <input
                  id="participant-task-due"
                  type="date"
                  name="dueDate"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="min-h-[44px] md:min-h-0 inline-flex items-center rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  Add task
                </button>
              </div>
            </form>
          ) : null}
          <div className="mt-4 space-y-2">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks linked to this {label.toLowerCase()}.
              </p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {(task.status ?? 'pending').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {task.due_date
                      ? `Due ${new Date(task.due_date).toLocaleDateString('en-AU')}`
                      : 'No due date'}
                    {task.priority
                      ? ` · ${severityLabel(task.priority)} priority`
                      : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {profile.communication_needs || profile.cultural_considerations ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Care Context
          </h2>
          <div className="mt-3 space-y-3 text-sm">
            {profile.communication_needs ? (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Communication Needs
                </p>
                <p className="mt-1">{profile.communication_needs}</p>
              </div>
            ) : null}
            {profile.cultural_considerations ? (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Cultural Considerations
                </p>
                <p className="mt-1">{profile.cultural_considerations}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  HeartPulse,
  CalendarDays,
  ShieldAlert,
  BadgeCheck,
  NotebookPen,
} from 'lucide-react';
import { normalizeRole } from '@/app/app/actions/rbac';
import {
  createProgressNote,
  signOffProgressNote,
} from '@/app/app/actions/progress-notes';
import {
  createIncident,
  resolveIncident,
  startShift,
  endShift,
  updatePatient,
} from '@/app/app/actions/patients';
import { createTask } from '@/app/app/actions/tasks';

type PatientRow = {
  id: string;
  full_name: string;
  external_id: string | null;
  date_of_birth: string | null;
  care_status: string;
  risk_level: string;
  emergency_flag: boolean;
  created_at: string;
  updated_at: string;
};

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  priority: string | null;
};

type NoteRow = {
  id: string;
  note_text: string;
  status_tag: string;
  created_at: string;
  signed_off_by: string | null;
  signed_off_at: string | null;
};

type IncidentRow = {
  id: string;
  severity: string;
  status: string;
  description: string;
  occurred_at: string;
  resolved_at: string | null;
};

type ShiftRow = {
  id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  staff_user_id: string;
};

type EvidenceRow = {
  id: string;
  file_name: string;
  verification_status: string | null;
  created_at: string;
  task_id: string | null;
};

function fmtDate(value?: string | null) {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'N/A';
  }
}

const NOTE_TAGS = [
  { value: 'routine', label: 'Routine' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'incident', label: 'Incident' },
  { value: 'risk', label: 'Risk' },
];

export default async function PatientDetailPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const patientId = resolvedParams?.id ?? '';
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin');

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.organization_id) redirect('/onboarding');

  const roleKey = normalizeRole(membership.role ?? null);
  const canWrite = ['OWNER', 'COMPLIANCE_OFFICER', 'MANAGER', 'STAFF'].includes(
    roleKey,
  );
  const canAdmin = ['OWNER', 'COMPLIANCE_OFFICER', 'MANAGER'].includes(roleKey);

  if (!patientId) {
    redirect('/app/patients');
  }

  const [
    { data: patientData },
    { data: tasksData },
    { data: notesData },
    { data: incidentsData },
    { data: shiftsData },
    { data: evidenceData },
  ] = await Promise.all([
    supabase
      .from('org_patients')
      .select(
        'id, full_name, external_id, date_of_birth, care_status, risk_level, emergency_flag, created_at, updated_at',
      )
      .eq('id', patientId)
      .eq('organization_id', membership.organization_id)
      .maybeSingle(),
    supabase
      .from('org_tasks')
      .select('id, title, status, due_date, priority')
      .eq('organization_id', membership.organization_id)
      .eq('patient_id', patientId)
      .order('due_date', { ascending: true })
      .limit(12),
    supabase
      .from('org_progress_notes')
      .select(
        'id, note_text, status_tag, created_at, signed_off_by, signed_off_at',
      )
      .eq('organization_id', membership.organization_id)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('org_incidents')
      .select('id, severity, status, description, occurred_at, resolved_at')
      .eq('organization_id', membership.organization_id)
      .eq('patient_id', patientId)
      .order('occurred_at', { ascending: false })
      .limit(8),
    supabase
      .from('org_shifts')
      .select('id, status, started_at, ended_at, staff_user_id')
      .eq('organization_id', membership.organization_id)
      .eq('patient_id', patientId)
      .order('started_at', { ascending: false })
      .limit(8),
    supabase
      .from('org_evidence')
      .select('id, file_name, verification_status, created_at, task_id')
      .eq('organization_id', membership.organization_id)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const patient = patientData as PatientRow | null;
  const tasks = tasksData as TaskRow[] | null;
  const notes = notesData as NoteRow[] | null;
  const incidents = incidentsData as IncidentRow[] | null;
  const shifts = shiftsData as ShiftRow[] | null;
  const evidence = evidenceData as EvidenceRow[] | null;

  if (!patient) {
    redirect('/app/patients');
  }

  const nowIso = new Date().toISOString();
  const overdueTasks = (tasks ?? []).filter(
    (task) =>
      task.due_date && task.status !== 'completed' && task.due_date < nowIso,
  );
  const escalationNeeded =
    patient.emergency_flag ||
    patient.risk_level === 'critical' ||
    (incidents ?? []).some(
      (incident) =>
        incident.status === 'open' &&
        (incident.severity === 'high' || incident.severity === 'critical'),
    );

  const activeShift = (shifts ?? []).find(
    (shift) => shift.status === 'active' && shift.staff_user_id === user.id,
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
            {patient.full_name}
          </h1>
          <p className="text-sm text-slate-400">
            Care status {patient.care_status} • Risk {patient.risk_level}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/progress-notes"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/15"
          >
            View Notes
          </Link>
          <Link
            href="/app/tasks"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/15"
          >
            View Tasks
          </Link>
        </div>
      </div>

      {escalationNeeded && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
          <span className="inline-flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4" />
            Escalation required. High-risk indicators detected for this patient.
          </span>
        </div>
      )}

      {overdueTasks.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-sm text-amber-200">
          <span className="inline-flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            {overdueTasks.length} overdue task
            {overdueTasks.length === 1 ? '' : 's'} linked to this patient.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <HeartPulse className="h-4 w-4 text-emerald-300" />
            Patient Profile
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-300">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                External ID
              </div>
              <div className="text-slate-100">
                {patient.external_id || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                Date of Birth
              </div>
              <div className="text-slate-100">
                {patient.date_of_birth || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                Care Status
              </div>
              <div className="text-slate-100">{patient.care_status}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                Risk Level
              </div>
              <div className="text-slate-100">{patient.risk_level}</div>
            </div>
          </div>

          {canWrite && (
            <form
              action={updatePatient}
              className="mt-6 grid gap-4 md:grid-cols-4"
            >
              <input type="hidden" name="patientId" value={patient.id} />
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500">
                  Full Name
                </label>
                <input
                  name="fullName"
                  defaultValue={patient.full_name}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500">
                  Status
                </label>
                <select
                  name="careStatus"
                  defaultValue={patient.care_status}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="discharged">Discharged</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500">
                  Risk
                </label>
                <select
                  name="riskLevel"
                  defaultValue={patient.risk_level}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 md:col-span-2">
                <input
                  type="checkbox"
                  name="emergencyFlag"
                  defaultChecked={patient.emergency_flag}
                  className="h-4 w-4 rounded border-white/20 bg-white/10"
                />
                Emergency flag
              </label>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/15"
                >
                  Update Profile
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <CalendarDays className="h-4 w-4 text-sky-300" />
            Shift Tracking
          </div>
          <div className="mt-4 space-y-3 text-xs text-slate-300">
            {activeShift ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[10px] uppercase tracking-widest text-slate-400">
                  Active
                </div>
                <div className="text-sm text-slate-100">
                  Started {fmtDate(activeShift.started_at)}
                </div>
                <form action={endShift} className="mt-3">
                  <input type="hidden" name="shiftId" value={activeShift.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:bg-white/15"
                  >
                    End shift
                  </button>
                </form>
              </div>
            ) : (
              <form action={startShift}>
                <input type="hidden" name="patientId" value={patient.id} />
                <button
                  type="submit"
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/15"
                >
                  Start shift
                </button>
              </form>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {(shifts ?? []).length === 0 ? (
              <p className="text-xs text-slate-400">No shifts logged yet.</p>
            ) : (
              (shifts ?? []).map((shift) => (
                <div
                  key={shift.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div className="text-[10px] uppercase tracking-widest text-slate-400">
                    {shift.status}
                  </div>
                  <div className="text-xs text-slate-300">
                    Start {fmtDate(shift.started_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <NotebookPen className="h-4 w-4 text-indigo-300" />
            Progress Notes
          </div>
          {canWrite && (
            <form action={createProgressNote} className="mt-4 grid gap-3">
              <input type="hidden" name="patientId" value={patient.id} />
              <select
                name="statusTag"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
                defaultValue="routine"
              >
                {NOTE_TAGS.map((tag) => (
                  <option key={tag.value} value={tag.value}>
                    {tag.label}
                  </option>
                ))}
              </select>
              <textarea
                name="noteText"
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
                placeholder="Document this interaction."
                required
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/15"
              >
                Add note
              </button>
            </form>
          )}
          <div className="mt-4 space-y-3">
            {(notes ?? []).length === 0 ? (
              <p className="text-xs text-slate-400">No progress notes yet.</p>
            ) : (
              (notes ?? []).map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-400">
                    <span>{note.status_tag}</span>
                    <span>{fmtDate(note.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-100">
                    {note.note_text}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    {note.signed_off_by ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                        <BadgeCheck className="h-3 w-3" />
                        Signed off
                      </span>
                    ) : null}
                    {canAdmin && !note.signed_off_by && (
                      <form action={signOffProgressNote}>
                        <input type="hidden" name="noteId" value={note.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:bg-white/15"
                        >
                          Sign off
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <AlertTriangle className="h-4 w-4 text-rose-300" />
            Incident Log
          </div>
          {canWrite && (
            <form action={createIncident} className="mt-4 grid gap-3">
              <input type="hidden" name="patientId" value={patient.id} />
              <select
                name="severity"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
                defaultValue="low"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <textarea
                name="description"
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
                placeholder="Describe the incident and immediate actions taken."
                required
              />
              <input
                type="datetime-local"
                name="occurredAt"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/15"
              >
                Report incident
              </button>
            </form>
          )}
          <div className="mt-4 space-y-3">
            {(incidents ?? []).length === 0 ? (
              <p className="text-xs text-slate-400">No incidents recorded.</p>
            ) : (
              (incidents ?? []).map((incident) => (
                <div
                  key={incident.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-400">
                    <span>{incident.severity}</span>
                    <span>{incident.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">
                    {incident.description}
                  </p>
                  <div className="mt-2 text-xs text-slate-400">
                    Occurred {fmtDate(incident.occurred_at)}
                  </div>
                  {canAdmin && incident.status === 'open' && (
                    <form action={resolveIncident} className="mt-3">
                      <input
                        type="hidden"
                        name="incidentId"
                        value={incident.id}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:bg-white/15"
                      >
                        Mark resolved
                      </button>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <ClipboardCheck className="h-4 w-4 text-sky-300" />
          Patient Tasks
        </div>
        {canAdmin && (
          <form action={createTask} className="mt-4 grid gap-3 md:grid-cols-4">
            <input type="hidden" name="patientId" value={patient.id} />
            <input
              name="title"
              placeholder="Task title"
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none md:col-span-2"
              required
            />
            <select
              name="priority"
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
              defaultValue="standard"
            >
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <input
              type="date"
              name="dueDate"
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
            />
            <input type="hidden" name="recurrenceDays" value="0" />
            <button
              type="submit"
              className="md:col-span-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/15"
            >
              Add task
            </button>
          </form>
        )}
        <div className="mt-4 space-y-3">
          {(tasks ?? []).length === 0 ? (
            <p className="text-xs text-slate-400">
              No tasks linked to this patient.
            </p>
          ) : (
            (tasks ?? []).map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex items-center justify-between text-sm text-slate-100">
                  <span className="font-semibold">{task.title}</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">
                    {task.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Due{' '}
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <FileText className="h-4 w-4 text-indigo-300" />
          Linked Evidence
        </div>
        <div className="mt-4 space-y-3">
          {(evidence ?? []).length === 0 ? (
            <p className="text-xs text-slate-400">
              No evidence linked to this patient yet.
            </p>
          ) : (
            (evidence ?? []).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex items-center justify-between text-sm text-slate-100">
                  <span className="font-semibold">{item.file_name}</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">
                    {item.verification_status || 'pending'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Uploaded {fmtDate(item.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

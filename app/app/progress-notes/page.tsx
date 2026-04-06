import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  createProgressNote,
  signOffProgressNote,
} from '@/app/app/actions/progress-notes';
import { normalizeRole } from '@/app/app/actions/rbac';
import { NotebookPen, UserCircle2, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

type PatientRow = {
  id: string;
  full_name: string;
};

type NoteRow = {
  id: string;
  patient_id: string;
  note_text: string;
  status_tag: string;
  created_at: string;
  signed_off_by: string | null;
  signed_off_at: string | null;
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

export default async function ProgressNotesPage() {
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
  const canSignOff = ['OWNER', 'COMPLIANCE_OFFICER', 'MANAGER'].includes(
    roleKey,
  );

  const [{ data: notesData }, { data: patientsData }] = await Promise.all([
    supabase
      .from('org_progress_notes')
      .select(
        'id, patient_id, note_text, status_tag, created_at, signed_off_by, signed_off_at',
      )
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('org_patients')
      .select('id, full_name')
      .eq('organization_id', membership.organization_id)
      .order('full_name', { ascending: true }),
  ]);

  const notes: NoteRow[] = notesData ?? [];
  const patients: PatientRow[] = patientsData ?? [];
  const patientMap = new Map(
    patients.map((patient) => [patient.id, patient.full_name]),
  );

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Progress Notes</h1>
          <p className="page-description">
            Capture care updates, follow-ups, and compliance-relevant notes
          </p>
        </div>
      </div>

      <div className="page-content space-y-4">
      {canWrite && (
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <NotebookPen className="h-3.5 w-3.5 text-muted-foreground" />
            New Progress Note
          </div>
          <form
            action={createProgressNote}
            className="mt-3 grid gap-3 md:grid-cols-3"
          >
            <div className="md:col-span-1">
              <label htmlFor="field-209" className="text-xs font-medium text-muted-foreground">
                Patient
              </label>
              <select
                name="patientId"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                required
                defaultValue=""
                disabled={(patients ?? []).length === 0}
              >
                <option value="" disabled>
                  Select patient
                </option>
                {(patients ?? []).map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="field-208" className="text-xs font-medium text-muted-foreground">
                Status Tag
              </label>
              <select
                name="statusTag"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                defaultValue="routine"
              >
                {NOTE_TAGS.map((tag) => (
                  <option key={tag.value} value={tag.value}>
                    {tag.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label htmlFor="field-207" className="text-xs font-medium text-muted-foreground">
                Note
              </label>
              <textarea
                name="noteText"
                rows={4}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                placeholder="Document the interaction, outcome, or required follow-up."
                required
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent/30 transition-colors"
                disabled={(patients ?? []).length === 0}
              >
                Save Note
              </button>
            </div>
          </form>
          {(patients ?? []).length === 0 && (
            <p className="mt-3 text-xs text-amber-200">
              Add a patient first before logging progress notes.
            </p>
          )}
        </section>
      )}

      <section className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/50">
          <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">Recent Notes</span>
        </div>
        <div className="divide-y divide-border">
          {(notes ?? []).length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground text-center">
              No notes recorded yet.
            </div>
          ) : (
            (notes ?? []).map((note) => {
              const patientName =
                patientMap.get(note.patient_id) ?? 'Unknown patient';
              return (
                <div key={note.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {patientName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fmtDate(note.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="status-pill status-pill-blue">
                        {note.status_tag}
                      </span>
                      {note.signed_off_by ? (
                        <span className="status-pill status-pill-green">
                          <BadgeCheck className="h-3 w-3" />
                          Signed off
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-foreground/70">
                    {note.note_text}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <Link
                      href={`/app/patients/${note.patient_id}`}
                      className="text-sky-300 hover:underline"
                    >
                      View patient record
                    </Link>
                    {canSignOff && !note.signed_off_by && (
                      <form action={signOffProgressNote}>
                        <input type="hidden" name="noteId" value={note.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent/30 transition-colors"
                        >
                          Sign off
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

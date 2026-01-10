import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createProgressNote, signOffProgressNote } from "@/app/app/actions/progress-notes";
import { normalizeRole } from "@/app/app/actions/rbac";
import { NotebookPen, UserCircle2, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

const NOTE_TAGS = [
  { value: "routine", label: "Routine" },
  { value: "follow_up", label: "Follow-up" },
  { value: "incident", label: "Incident" },
  { value: "risk", label: "Risk" },
];

export default async function ProgressNotesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.organization_id) redirect("/onboarding");

  const roleKey = normalizeRole(membership.role ?? null);
  const canWrite = ["OWNER", "COMPLIANCE_OFFICER", "MANAGER", "STAFF"].includes(roleKey);
  const canSignOff = ["OWNER", "COMPLIANCE_OFFICER", "MANAGER"].includes(roleKey);

  const [{ data: notesData }, { data: patientsData }] = await Promise.all([
    supabase
      .from("org_progress_notes")
      .select("id, patient_id, note_text, status_tag, created_at, signed_off_by, signed_off_at")
      .eq("organization_id", membership.organization_id)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("org_patients")
      .select("id, full_name")
      .eq("organization_id", membership.organization_id)
      .order("full_name", { ascending: true }),
  ]);

  const notes: NoteRow[] = notesData ?? [];
  const patients: PatientRow[] = patientsData ?? [];
  const patientMap = new Map(patients.map((patient) => [patient.id, patient.full_name]));

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Progress Notes</h1>
          <p className="text-sm text-slate-400">
            Capture care updates, follow-ups, and compliance-relevant notes.
          </p>
        </div>
      </div>

      {canWrite && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <NotebookPen className="h-4 w-4 text-indigo-300" />
            New Progress Note
          </div>
          <form action={createProgressNote} className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Patient
              </label>
              <select
                name="patientId"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
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
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Status Tag
              </label>
              <select
                name="statusTag"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
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
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Note
              </label>
              <textarea
                name="noteText"
                rows={4}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
                placeholder="Document the interaction, outcome, or required follow-up."
                required
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/15"
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

      <section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4 text-xs font-semibold text-slate-200">
          <UserCircle2 className="h-4 w-4 text-emerald-300" />
          Recent Notes
        </div>
        <div className="divide-y divide-white/10">
          {(notes ?? []).length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-400">No notes recorded yet.</div>
          ) : (
            (notes ?? []).map((note) => {
              const patientName = patientMap.get(note.patient_id) ?? "Unknown patient";
              return (
                <div key={note.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{patientName}</div>
                      <div className="text-xs text-slate-400">{fmtDate(note.created_at)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-300">
                        {note.status_tag}
                      </span>
                      {note.signed_off_by ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                          <BadgeCheck className="h-3 w-3" />
                          Signed off
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{note.note_text}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <Link href={`/app/patients/${note.patient_id}`} className="text-sky-300 hover:underline">
                      View patient record
                    </Link>
                    {canSignOff && !note.signed_off_by && (
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
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

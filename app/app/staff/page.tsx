import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, AlertTriangle, FileText, Users, ArrowRight, CalendarDays } from "lucide-react";
import { normalizeRole } from "@/app/app/actions/rbac";

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "—";
  }
}

export default async function StaffDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.organization_id) {
    redirect("/onboarding");
  }

  const roleKey = normalizeRole(membership.role ?? null);
  if (roleKey !== "STAFF") {
    redirect("/app");
  }

  const orgId = membership.organization_id;
  const nowIso = new Date().toISOString();

  const [{ data: tasks }, { data: patients }, { data: notes }, { data: incidents }, { data: shifts }] =
    await Promise.all([
      supabase
        .from("org_tasks")
        .select("id,title,status,due_date,patient_id")
        .eq("organization_id", orgId)
        .eq("assigned_to", user.id)
        .order("due_date", { ascending: true })
        .limit(8),
      supabase
        .from("org_patients")
        .select("id, full_name, care_status, risk_level, emergency_flag")
        .eq("organization_id", orgId)
        .order("full_name", { ascending: true })
        .limit(6),
      supabase
        .from("org_progress_notes")
        .select("id, patient_id, status_tag, created_at")
        .eq("organization_id", orgId)
        .eq("staff_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("org_incidents")
        .select("id, severity, status, occurred_at, patient_id")
        .eq("organization_id", orgId)
        .eq("status", "open")
        .order("occurred_at", { ascending: false })
        .limit(5),
      supabase
        .from("org_shifts")
        .select("id, status, started_at, patient_id")
        .eq("organization_id", orgId)
        .eq("staff_user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(4),
    ]);

  const overdueTasks = (tasks ?? []).filter(
    (task) => task.due_date && task.status !== "completed" && task.due_date < nowIso
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Field Operations</h1>
          <p className="text-sm text-slate-400">
            Your assigned work, patient updates, and required documentation.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/progress-notes"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/15"
          >
            New Progress Note
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/app/tasks"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/15"
          >
            View Tasks
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {overdueTasks.length > 0 && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
          <span className="inline-flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            {overdueTasks.length} overdue task{overdueTasks.length === 1 ? "" : "s"} require attention.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <ClipboardCheck className="h-4 w-4 text-sky-300" />
            Assigned Tasks
          </div>
          <div className="mt-4 space-y-3">
            {(tasks ?? []).length === 0 ? (
              <p className="text-xs text-slate-400">No tasks assigned.</p>
            ) : (
              (tasks ?? []).map((task) => (
                <div key={task.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-100">{task.title}</div>
                  <div className="text-xs text-slate-400">
                    Due {fmtDate(task.due_date)} • {task.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Users className="h-4 w-4 text-emerald-300" />
            Patient Caseload
          </div>
          <div className="mt-4 space-y-3">
            {(patients ?? []).length === 0 ? (
              <p className="text-xs text-slate-400">No patients assigned.</p>
            ) : (
              (patients ?? []).map((patient) => (
                <Link
                  key={patient.id}
                  href={`/app/patients/${patient.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 hover:bg-white/10"
                >
                  <span>{patient.full_name}</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">
                    {patient.care_status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <FileText className="h-4 w-4 text-indigo-300" />
            Recent Notes
          </div>
          <div className="mt-4 space-y-3">
            {(notes ?? []).length === 0 ? (
              <p className="text-xs text-slate-400">No notes logged yet.</p>
            ) : (
              (notes ?? []).map((note) => (
                <div key={note.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-widest text-slate-400">
                    {note.status_tag}
                  </div>
                  <div className="text-xs text-slate-300">Logged {fmtDate(note.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <AlertTriangle className="h-4 w-4 text-rose-300" />
            Open Incidents
          </div>
          <div className="mt-4 space-y-3">
            {(incidents ?? []).length === 0 ? (
              <p className="text-xs text-slate-400">No active incidents.</p>
            ) : (
              (incidents ?? []).map((incident) => (
                <div key={incident.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-widest text-rose-300">
                    {incident.severity}
                  </div>
                  <div className="text-xs text-slate-300">
                    Reported {fmtDate(incident.occurred_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <CalendarDays className="h-4 w-4 text-sky-300" />
            Recent Shifts
          </div>
          <div className="mt-4 space-y-3">
            {(shifts ?? []).length === 0 ? (
              <p className="text-xs text-slate-400">No shifts logged.</p>
            ) : (
              (shifts ?? []).map((shift) => (
                <div key={shift.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-widest text-slate-400">
                    {shift.status}
                  </div>
                  <div className="text-xs text-slate-300">
                    Started {fmtDate(shift.started_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

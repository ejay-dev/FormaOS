import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPatient } from "@/app/app/actions/patients";
import { normalizeRole } from "@/app/app/actions/rbac";
import Link from "next/link";
import { Users, AlertTriangle, Plus } from "lucide-react";

type PatientRow = {
  id: string;
  full_name: string;
  care_status: string;
  risk_level: string;
  emergency_flag: boolean;
};

export default async function PatientsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.organization_id) return null;

  const roleKey = normalizeRole(membership.role ?? null);
  const canWrite = ["OWNER", "COMPLIANCE_OFFICER", "MANAGER", "STAFF"].includes(roleKey);

  const { data: patients } = await supabase
    .from("org_patients")
    .select("id, full_name, care_status, risk_level, emergency_flag")
    .eq("organization_id", membership.organization_id)
    .order("full_name", { ascending: true });
  const patientRows: PatientRow[] = patients ?? [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Patients & Clients</h1>
          <p className="text-sm text-muted-foreground">Track care status, risks, and documentation.</p>
        </div>
        {canWrite && (
          <form action={createPatient} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="careStatus" value="active" />
            <input type="hidden" name="riskLevel" value="low" />
            <input
              name="fullName"
              placeholder="New patient name"
              className="w-56 rounded-xl border border-white/10 bg-glass-strong px-3 py-2 text-sm text-foreground outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-glass-strong px-4 py-2 text-xs font-semibold text-foreground hover:bg-white/15"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </form>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4 text-xs font-semibold text-foreground/90">
          <Users className="h-4 w-4 text-emerald-300" />
          Active Patients
        </div>
        <div className="divide-y divide-white/10">
          {patientRows.length === 0 ? (
            <div className="px-6 py-10 text-sm text-muted-foreground">No patients created yet.</div>
          ) : (
            patientRows.map((patient) => (
              <Link
                key={patient.id}
                href={`/app/patients/${patient.id}`}
                className="flex items-center justify-between px-6 py-4 text-sm text-foreground hover:bg-glass-strong"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{patient.full_name}</span>
                  {patient.emergency_flag ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-200">
                      <AlertTriangle className="h-3 w-3" />
                      Emergency
                    </span>
                  ) : null}
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {patient.care_status} • {patient.risk_level}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

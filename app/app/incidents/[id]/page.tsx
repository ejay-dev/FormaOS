import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSystemState } from "@/lib/system-state/server";
import { resolveIncident } from "@/app/app/actions/care-operations";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardCheck } from "lucide-react";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
}

type IncidentRow = {
  id: string;
  severity: string;
  status: string;
  incident_type: string | null;
  description: string | null;
  location: string | null;
  occurred_at: string | null;
  resolved_at: string | null;
  follow_up_required: boolean;
  follow_up_due_date: string | null;
  immediate_actions: string | null;
  root_cause: string | null;
  preventive_measures: string | null;
  created_at: string;
  patient: { id: string; full_name: string } | null;
  reporter: { id: string; email: string | null } | null;
};

export default async function IncidentDetailPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const incidentId = resolvedParams?.id ?? "";
  if (!incidentId) redirect("/app/incidents");

  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");
  const orgId = systemState.organization.id;

  const supabase = await createSupabaseServerClient();
  const { data: incidentData } = await supabase
    .from("org_incidents")
    .select(
      `
      id,
      severity,
      status,
      incident_type,
      description,
      location,
      occurred_at,
      resolved_at,
      follow_up_required,
      follow_up_due_date,
      immediate_actions,
      root_cause,
      preventive_measures,
      created_at,
      patient:patient_id(id, full_name),
      reporter:reported_by(id, email)
    `,
    )
    .eq("organization_id", orgId)
    .eq("id", incidentId)
    .maybeSingle();

  const incident = incidentData as IncidentRow | null;
  if (!incident) notFound();

  const isOpen = incident.status === "open";
  const resolveAction = resolveIncident.bind(null, incident.id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/app/incidents"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to incidents
        </Link>
        <h1 className="text-3xl font-black tracking-tight">Incident Detail</h1>
        <p className="text-sm text-muted-foreground">
          Case status, controls, and closure details.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Severity</p>
          <p className="mt-1 text-2xl font-black capitalize">{incident.severity}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
          <p className="mt-1 text-2xl font-black capitalize">{incident.status}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Type</p>
          <p className="mt-1 text-lg font-semibold capitalize">
            {(incident.incident_type || "general").replace("_", " ")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Occurred</p>
          <p className="mt-1 text-sm font-semibold">{formatDateTime(incident.occurred_at)}</p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Incident Context
        </h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Related Client</dt>
            <dd>{incident.patient?.full_name || "N/A"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Reported By</dt>
            <dd>{incident.reporter?.email || "N/A"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Location</dt>
            <dd>{incident.location || "N/A"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Follow-up Required</dt>
            <dd>{incident.follow_up_required ? "Yes" : "No"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Follow-up Due</dt>
            <dd>{incident.follow_up_due_date || "N/A"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Resolved At</dt>
            <dd>{formatDateTime(incident.resolved_at)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Description
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm">{incident.description || "No description provided."}</p>
        <div className="mt-4 rounded-lg border border-border bg-background p-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Immediate Actions</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{incident.immediate_actions || "No immediate actions logged."}</p>
        </div>
      </section>

      {(incident.root_cause || incident.preventive_measures) ? (
        <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-200">
            <ClipboardCheck className="h-4 w-4" />
            Resolution Record
          </h2>
          {incident.root_cause ? (
            <div className="mt-3 text-sm text-emerald-100">
              <p className="text-xs uppercase tracking-wider text-emerald-300">Root Cause</p>
              <p className="mt-1 whitespace-pre-wrap">{incident.root_cause}</p>
            </div>
          ) : null}
          {incident.preventive_measures ? (
            <div className="mt-3 text-sm text-emerald-100">
              <p className="text-xs uppercase tracking-wider text-emerald-300">Preventive Measures</p>
              <p className="mt-1 whitespace-pre-wrap">{incident.preventive_measures}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {isOpen ? (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            Resolve Incident
          </h2>
          <form action={resolveAction} className="mt-4 space-y-3">
            <div>
              <label htmlFor="field-8" className="text-xs uppercase tracking-wider text-amber-200">Root Cause</label>
              <textarea id="field-8"
                name="root_cause"
                rows={3}
                required
                className="mt-1 w-full rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-50 outline-none"
                placeholder="Describe root cause analysis..."
              />
            </div>
            <div>
              <label htmlFor="field-7" className="text-xs uppercase tracking-wider text-amber-200">Preventive Measures</label>
              <textarea id="field-7"
                name="preventive_measures"
                rows={3}
                required
                className="mt-1 w-full rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-50 outline-none"
                placeholder="Document preventive actions..."
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Resolved
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}

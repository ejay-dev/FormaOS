import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSystemState } from "@/lib/system-state/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Phone,
  ShieldAlert,
  User,
} from "lucide-react";

function getEntityLabel(industry: string | null): string {
  switch (industry) {
    case "ndis":
      return "Participant";
    case "healthcare":
      return "Patient";
    case "aged_care":
      return "Resident";
    default:
      return "Client";
  }
}

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

export default async function ParticipantDetailPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const participantId = resolvedParams?.id ?? "";
  if (!participantId) redirect("/app/participants");

  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");

  const orgId = systemState.organization.id;
  const label = getEntityLabel(systemState.organization.industry);
  const supabase = await createSupabaseServerClient();

  const [{ data: participant }, { data: recentVisits }, { data: recentIncidents }] =
    await Promise.all([
      supabase
        .from("org_patients")
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
        .eq("organization_id", orgId)
        .eq("id", participantId)
        .maybeSingle(),
      supabase
        .from("org_visits")
        .select("id, status, scheduled_start, visit_type")
        .eq("organization_id", orgId)
        .eq("client_id", participantId)
        .order("scheduled_start", { ascending: false })
        .limit(6),
      supabase
        .from("org_incidents")
        .select("id, severity, status, occurred_at, incident_type")
        .eq("organization_id", orgId)
        .eq("patient_id", participantId)
        .order("occurred_at", { ascending: false })
        .limit(6),
    ]);

  const profile = participant as ParticipantRow | null;
  if (!profile) notFound();

  const openIncidents = (recentIncidents ?? []).filter((item: any) => item.status === "open").length;

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
          <h1 className="text-3xl font-black tracking-tight">{profile.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            {label} profile and linked operations
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/visits/new"
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            <CalendarClock className="h-4 w-4" />
            Schedule Visit
          </Link>
          <Link
            href="/app/incidents/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            Report Incident
          </Link>
        </div>
      </div>

      {profile.emergency_flag || profile.risk_level === "critical" ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-4 text-rose-100">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4" />
            Elevated risk profile
          </div>
          <p className="mt-1 text-xs text-rose-200">
            This {label.toLowerCase()} has emergency or critical-risk markers.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Active Incidents</p>
          <p className="mt-1 text-2xl font-black">{openIncidents}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent Visits</p>
          <p className="mt-1 text-2xl font-black">{recentVisits?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Care Status</p>
          <p className="mt-1 text-2xl font-black capitalize">{profile.care_status}</p>
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
              <dd>{profile.preferred_name || "N/A"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">External ID</dt>
              <dd>{profile.external_id || profile.ndis_number || "N/A"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Date of Birth</dt>
              <dd>{profile.date_of_birth || "N/A"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Funding</dt>
              <dd className="capitalize">{profile.funding_type || "N/A"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Diagnosis</dt>
              <dd>{profile.primary_diagnosis || "N/A"}</dd>
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
              <dd>{profile.phone || "N/A"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{profile.email || "N/A"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Emergency Contact</dt>
              <dd>{profile.emergency_contact_name || "N/A"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Emergency Phone</dt>
              <dd>{profile.emergency_contact_phone || "N/A"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Relationship</dt>
              <dd>{profile.emergency_contact_relationship || "N/A"}</dd>
            </div>
            <div className="text-xs text-muted-foreground">
              {profile.address || "No address provided"}
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
              <p className="text-sm text-muted-foreground">No visits recorded.</p>
            ) : (
              (recentVisits ?? []).map((visit: any) => (
                <Link
                  key={visit.id}
                  href={`/app/visits/${visit.id}`}
                  className="block rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="capitalize">{visit.visit_type || "service"}</span>
                    <span className="text-xs text-muted-foreground capitalize">{visit.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(visit.scheduled_start)}</div>
                </Link>
              ))
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
              <p className="text-sm text-muted-foreground">No incidents recorded.</p>
            ) : (
              (recentIncidents ?? []).map((incident: any) => (
                <Link
                  key={incident.id}
                  href={`/app/incidents/${incident.id}`}
                  className="block rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="capitalize">{incident.incident_type || "general"}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {incident.severity} · {incident.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(incident.occurred_at)}</div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {(profile.communication_needs || profile.cultural_considerations) ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Care Context</h2>
          <div className="mt-3 space-y-3 text-sm">
            {profile.communication_needs ? (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Communication Needs</p>
                <p className="mt-1">{profile.communication_needs}</p>
              </div>
            ) : null}
            {profile.cultural_considerations ? (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Cultural Considerations</p>
                <p className="mt-1">{profile.cultural_considerations}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

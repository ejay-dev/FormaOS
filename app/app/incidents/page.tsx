/**
 * Incidents Page
 * List and manage incidents with filtering and export
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, AlertTriangle, Search, Filter, Download, CheckCircle, Clock } from "lucide-react";
import { fetchSystemState } from "@/lib/system-state/server";

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    case "high":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    default:
      return "bg-green-500/10 text-green-600 border-green-500/20";
  }
}

export default async function IncidentsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");

  const { organization } = systemState;

  // Fetch incidents with client info
  const { data: incidents, error } = await supabase
    .from("org_incidents")
    .select(`
      id,
      severity,
      status,
      incident_type,
      description,
      occurred_at,
      resolved_at,
      location,
      follow_up_required,
      follow_up_due_date,
      created_at,
      patient:patient_id (
        id,
        full_name
      ),
      reporter:reported_by (
        id,
        email
      )
    `)
    .eq("organization_id", organization.id)
    .order("occurred_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[IncidentsPage] Error fetching incidents:", error);
  }

  type Incident = NonNullable<typeof incidents>[number];
  const stats = {
    total: incidents?.length ?? 0,
    open: incidents?.filter((i: Incident) => i.status === "open").length ?? 0,
    resolved: incidents?.filter((i: Incident) => i.status === "resolved").length ?? 0,
    critical: incidents?.filter((i: Incident) => i.severity === "critical" || i.severity === "high").length ?? 0,
    pendingFollowUp: incidents?.filter((i: Incident) => i.follow_up_required && !i.resolved_at).length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="incidents-title">
            Incidents
          </h1>
          <p className="text-muted-foreground">
            Report, track, and manage incidents
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
            data-testid="export-incidents-btn"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <Link
            href="/app/incidents/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            data-testid="report-incident-btn"
          >
            <Plus className="h-4 w-4" />
            Report Incident
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Incidents</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{stats.open}</p>
              <p className="text-sm text-muted-foreground">Open</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.resolved}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.critical}</p>
              <p className="text-sm text-muted-foreground">Critical/High</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.pendingFollowUp}</p>
              <p className="text-sm text-muted-foreground">Pending Follow-up</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search incidents..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full" data-testid="incidents-table">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Severity</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">Client</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">Occurred</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden xl:table-cell">Follow-up</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {incidents?.map((incident: Incident) => (
              <tr key={incident.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                      incident.severity
                    )}`}
                  >
                    {incident.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm capitalize">
                    {incident.incident_type?.replace("_", " ") || "General"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="font-medium">
                    {(incident.patient as any)?.full_name || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-sm">{formatDate(incident.occurred_at)}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      incident.status === "resolved"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {incident.status === "resolved" ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {incident.status}
                  </span>
                </td>
                <td className="px-4 py-3 hidden xl:table-cell">
                  {incident.follow_up_required ? (
                    <span className="text-sm text-orange-600">
                      Due: {incident.follow_up_due_date || "TBD"}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/app/incidents/${incident.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {(!incidents || incidents.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No incidents reported</p>
                  <p className="text-sm mt-1">Incidents will appear here when reported</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Visits / Service Delivery Page
 * Track visits, appointments, and service delivery logs
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { fetchSystemState } from "@/lib/system-state/server";

function formatDateTime(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "cancelled":
    case "missed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
  }
}

function getVisitLabel(industry: string | null): string {
  switch (industry) {
    case "ndis":
      return "Service Delivery";
    case "healthcare":
      return "Appointments";
    case "aged_care":
      return "Service Logs";
    default:
      return "Visits";
  }
}

export default async function VisitsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");

  const { organization } = systemState;
  const label = getVisitLabel(organization.industry);

  // Fetch visits with client info
  const { data: visits, error } = await supabase
    .from("org_visits")
    .select(`
      id,
      visit_type,
      service_category,
      scheduled_start,
      scheduled_end,
      actual_start,
      actual_end,
      status,
      notes,
      location_type,
      address,
      created_at,
      client:client_id (
        id,
        full_name
      ),
      staff:staff_id (
        id,
        email
      )
    `)
    .eq("organization_id", organization.id)
    .order("scheduled_start", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[VisitsPage] Error fetching visits:", error);
  }

  type Visit = NonNullable<typeof visits>[number];
  const stats = {
    total: visits?.length ?? 0,
    scheduled: visits?.filter((v: Visit) => v.status === "scheduled").length ?? 0,
    completed: visits?.filter((v: Visit) => v.status === "completed").length ?? 0,
    missed: visits?.filter((v: Visit) => v.status === "missed" || v.status === "cancelled").length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="visits-title">
            {label}
          </h1>
          <p className="text-muted-foreground">
            Track and manage {label.toLowerCase()}
          </p>
        </div>
        <Link
          href="/app/visits/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          data-testid="add-visit-btn"
        >
          <Plus className="h-4 w-4" />
          New Visit
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Visits</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
              <p className="text-sm text-muted-foreground">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.missed}</p>
              <p className="text-sm text-muted-foreground">Missed/Cancelled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full" data-testid="visits-table">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Client</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">Scheduled</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">Staff</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden xl:table-cell">Location</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visits?.map((visit: Visit) => (
              <tr key={visit.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(visit.status)}
                    <span className="text-sm capitalize">{visit.status.replace("_", " ")}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">
                    {(visit.client as any)?.full_name || "Unassigned"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-sm">{formatDateTime(visit.scheduled_start)}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-sm capitalize">
                    {visit.visit_type?.replace("_", " ") || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {(visit.staff as any)?.email?.split("@")[0] || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden xl:table-cell">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {visit.location_type?.replace("_", " ") || "-"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/app/visits/${visit.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {(!visits || visits.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No visits scheduled yet</p>
                  <Link
                    href="/app/visits/new"
                    className="text-primary hover:underline mt-2 inline-block"
                  >
                    Schedule your first visit
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

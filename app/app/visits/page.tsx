/**
 * Visits / Service Delivery Page
 * Track visits, appointments, and service delivery logs
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAdminProfileDirectoryEntries } from '@/lib/users/admin-profile-directory';
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, Search, Filter } from "lucide-react";
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

export default async function VisitsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim();
  const qLower = q.toLowerCase();
  const statusFilter = (params.status ?? "").trim().toLowerCase();
  const hasFilters = q.length > 0 || statusFilter.length > 0;

  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");

  const { organization } = systemState;
  const label = getVisitLabel(organization.industry);
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  // Fetch visits and resolve related labels explicitly so schema-cache FK drift
  // does not break the whole page.
  const { data: visits, error } = await supabase
    .from("org_visits")
    .select(`
      id,
      client_id,
      staff_id,
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
      created_at
    `)
    .eq("organization_id", organization.id)
    .order("scheduled_start", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[VisitsPage] Error fetching visits:", error);
  }

  type VisitRow = NonNullable<typeof visits>[number];
  type Visit = VisitRow & {
    client: { full_name?: string | null } | null;
    staff: { email?: string | null } | null;
  };

  const visitRows = (visits ?? []) as VisitRow[];
  const clientIds = Array.from(
    new Set(
      visitRows
        .map((visit) => visit.client_id as string | null | undefined)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const staffIds = Array.from(
    new Set(
      visitRows
        .map((visit) => visit.staff_id as string | null | undefined)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [{ data: clients }, staffProfiles] = await Promise.all([
    clientIds.length
      ? supabase.from('org_patients').select('id, full_name').in('id', clientIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null }> }),
    staffIds.length
      ? getAdminProfileDirectoryEntries(staffIds, admin)
      : Promise.resolve([]),
  ]);

  const clientNameById = new Map(
    (clients ?? []).map((client) => [
      client.id as string,
      (client.full_name as string | null | undefined) ?? null,
    ]),
  );
  const staffEmailById = new Map(
    staffProfiles.map((profile) => [profile.userId, profile.email ?? null]),
  );

  const enrichedVisits: Visit[] = visitRows.map((visit) => ({
    ...visit,
    client: visit.client_id
      ? { full_name: clientNameById.get(visit.client_id as string) ?? null }
      : null,
    staff: visit.staff_id
      ? { email: staffEmailById.get(visit.staff_id as string) ?? null }
      : null,
  }));

  const filteredVisits = enrichedVisits.filter((visit: Visit) => {
    if (statusFilter && visit.status.toLowerCase() !== statusFilter) return false;
    if (!qLower) return true;

    const clientName = ((visit.client as { full_name?: string } | null)?.full_name ?? "").toLowerCase();
    const visitType = (visit.visit_type ?? "").toLowerCase();
    const serviceCategory = (visit.service_category ?? "").toLowerCase();
    const locationType = (visit.location_type ?? "").toLowerCase();

    return (
      clientName.includes(qLower) ||
      visitType.includes(qLower) ||
      serviceCategory.includes(qLower) ||
      locationType.includes(qLower)
    );
  });

  const stats = {
    total: filteredVisits.length,
    scheduled: filteredVisits.filter((v: Visit) => v.status === "scheduled").length,
    completed: filteredVisits.filter((v: Visit) => v.status === "completed").length,
    missed: filteredVisits.filter((v: Visit) => v.status === "missed" || v.status === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" data-testid="visits-title">
            {label}
          </h1>
          <p className="text-sm text-muted-foreground">
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

      <form method="GET" className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by client, visit type, or service..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background"
          />
        </div>
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="missed">Missed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
        >
          <Filter className="h-4 w-4" />
          Apply
        </button>
        {hasFilters ? (
          <Link
            href="/app/visits"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-transparent text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </Link>
        ) : null}
      </form>

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
            {filteredVisits.map((visit: Visit) => (
              <tr key={visit.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(visit.status)}
                    <span className="text-sm capitalize">{visit.status.replace("_", " ")}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">
                    {(visit.client as { full_name?: string } | null)?.full_name || "Unassigned"}
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
                    {(visit.staff as { email?: string } | null)?.email?.split("@")[0] || "-"}
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
            {filteredVisits.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {hasFilters ? (
                    <>
                      <p>No visits matched your filters</p>
                      <Link
                        href="/app/visits"
                        className="text-primary hover:underline mt-2 inline-block"
                      >
                        Clear filters
                      </Link>
                    </>
                  ) : (
                    <>
                      <p>No visits scheduled yet</p>
                      <Link
                        href="/app/visits/new"
                        className="text-primary hover:underline mt-2 inline-block"
                      >
                        Schedule your first visit
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

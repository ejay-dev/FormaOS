/**
 * Participants/Clients/Patients Page
 * Industry-aware naming: NDIS=Participants, Healthcare=Patients, Aged Care=Residents
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Filter, AlertTriangle, Users } from "lucide-react";
import { fetchSystemState } from "@/lib/system-state/server";

// Get industry-appropriate label
function getEntityLabel(industry: string | null): { singular: string; plural: string } {
  switch (industry) {
    case "ndis":
      return { singular: "Participant", plural: "Participants" };
    case "healthcare":
      return { singular: "Patient", plural: "Patients" };
    case "aged_care":
      return { singular: "Resident", plural: "Residents" };
    default:
      return { singular: "Client", plural: "Clients" };
  }
}

export default async function ParticipantsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Fetch user's organization membership and industry (same pattern as dashboard)
  let orgId: string = "";
  let industry: string | null = null;

  try {
    const { data } = await supabase
      .from("org_members")
      .select("organization_id, organizations(industry)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      orgId = data.organization_id as string;
      const orgs = data.organizations as any;
      industry = Array.isArray(orgs) ? orgs?.[0]?.industry : orgs?.industry;
    }
  } catch (err) {
    console.error("[ParticipantsPage] Error fetching membership:", err);
  }

  if (!orgId) {
    redirect("/onboarding");
  }

  const labels = getEntityLabel(industry);

  // Fetch participants/patients
  let participants: any[] | null = null;
  try {
    const { data, error } = await supabase
      .from("org_patients")
      .select(`
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
        ndis_number,
        funding_type,
        primary_diagnosis,
        created_at
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ParticipantsPage] Error fetching participants:", error);
    } else {
      participants = data;
    }
  } catch (err) {
    console.error("[ParticipantsPage] Error in query:", err);
  }

  type Participant = NonNullable<typeof participants>[number];
  const stats = {
    total: participants?.length ?? 0,
    active: participants?.filter((p: Participant) => p.care_status === "active").length ?? 0,
    highRisk: participants?.filter((p: Participant) => p.risk_level === "high" || p.risk_level === "critical").length ?? 0,
    emergency: participants?.filter((p: Participant) => p.emergency_flag).length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="participants-title">
            {labels.plural}
          </h1>
          <p className="text-muted-foreground">
            Manage {labels.plural.toLowerCase()} and their care records
          </p>
        </div>
        <Link
          href="/app/participants/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          data-testid="add-participant-btn"
        >
          <Plus className="h-4 w-4" />
          Add {labels.singular}
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total {labels.plural}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{stats.highRisk}</p>
              <p className="text-sm text-muted-foreground">High Risk</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.emergency}</p>
              <p className="text-sm text-muted-foreground">Emergency Flag</p>
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
            placeholder={`Search ${labels.plural.toLowerCase()}...`}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background"
            data-testid="search-participants"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full" data-testid="participants-table">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">ID</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">Risk</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden xl:table-cell">Funding</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {participants?.map((participant: Participant) => (
              <tr key={participant.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {participant.emergency_flag && (
                      <span className="flex h-2 w-2 rounded-full bg-red-500" title="Emergency Flag" />
                    )}
                    <div>
                      <p className="font-medium">{participant.full_name}</p>
                      {participant.preferred_name && (
                        <p className="text-sm text-muted-foreground">({participant.preferred_name})</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-sm font-mono text-muted-foreground">
                    {participant.external_id || participant.ndis_number || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      participant.care_status === "active"
                        ? "bg-green-500/10 text-green-600"
                        : participant.care_status === "paused"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-gray-500/10 text-gray-600"
                    }`}
                  >
                    {participant.care_status}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      participant.risk_level === "critical"
                        ? "bg-red-500/10 text-red-600"
                        : participant.risk_level === "high"
                        ? "bg-orange-500/10 text-orange-600"
                        : participant.risk_level === "medium"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-green-500/10 text-green-600"
                    }`}
                  >
                    {participant.risk_level}
                  </span>
                </td>
                <td className="px-4 py-3 hidden xl:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {participant.funding_type?.toUpperCase() || "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/app/participants/${participant.id}`}
                    className="text-sm text-primary hover:underline"
                    data-testid={`view-participant-${participant.id}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {(!participants || participants.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No {labels.plural.toLowerCase()} yet</p>
                  <Link
                    href="/app/participants/new"
                    className="text-primary hover:underline mt-2 inline-block"
                  >
                    Add your first {labels.singular.toLowerCase()}
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

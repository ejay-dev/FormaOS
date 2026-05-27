import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSystemState } from "@/lib/system-state/server";

export const metadata = {
  title: "Behaviour Support Plans | FormaOS",
};

const PLAN_TYPE_LABELS: Record<string, string> = {
  interim: "Interim (≤1 month)",
  comprehensive: "Comprehensive (≤6 months)",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-muted-foreground bg-muted/30" },
  submitted: { label: "Submitted", color: "text-blue-700 bg-blue-500/10" },
  authorised: { label: "Authorised", color: "text-emerald-700 bg-emerald-500/10" },
  active: { label: "Active", color: "text-emerald-700 bg-emerald-500/10" },
  expired: { label: "Expired", color: "text-red-600 bg-red-500/10" },
  withdrawn: { label: "Withdrawn", color: "text-muted-foreground bg-muted/50" },
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Plan = {
  id: string;
  plan_type: string;
  status: string;
  first_restrictive_practice_at: string | null;
  authorised_at: string | null;
  effective_from: string | null;
  expires_at: string | null;
  sbs_provider_name: string | null;
  notes: string | null;
  participant_id: string | null;
  participant?: { id: string; full_name: string } | null;
};

export default async function BehaviourSupportPlansPage() {
  const state = await fetchSystemState();
  if (!state) redirect("/auth/signin");

  const supabase = await createSupabaseServerClient();

  const { data: plans, error } = await supabase
    .from("org_behaviour_support_plans")
    .select(
      `id, plan_type, status, first_restrictive_practice_at, authorised_at,
       effective_from, expires_at, sbs_provider_name, notes, participant_id`,
    )
    .eq("organization_id", state.organization.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[BehaviourSupportPlansPage] load error:", error.message);
  }

  // Hydrate participant labels separately (the FK is loosely-typed per
  // migration 20260624067 — not all orgs use org_patients).
  const participantIds = (plans ?? [])
    .map((p) => p.participant_id)
    .filter((id): id is string => typeof id === "string");
  let participantMap = new Map<string, { id: string; full_name: string }>();
  if (participantIds.length > 0) {
    const { data: participants } = await supabase
      .from("org_patients")
      .select("id, full_name")
      .eq("organization_id", state.organization.id)
      .in("id", participantIds);
    participantMap = new Map(
      (participants ?? []).map((p: { id: string; full_name: string }) => [p.id, p]),
    );
  }

  const enriched: Plan[] = (plans ?? []).map((p) => ({
    ...p,
    participant: p.participant_id
      ? participantMap.get(p.participant_id) ?? null
      : null,
  }));

  const now = Date.now();
  const stats = {
    total: enriched.length,
    active: enriched.filter((p) => p.status === "active").length,
    drafts: enriched.filter((p) => p.status === "draft").length,
    expiringSoon: enriched.filter((p) => {
      if (!p.expires_at) return false;
      const expires = new Date(p.expires_at).getTime();
      if (Number.isNaN(expires)) return false;
      const daysUntil = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 30;
    }).length,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title" data-testid="bsp-page-title">
            Behaviour Support Plans
          </h1>
          <p className="page-description">
            Track interim and comprehensive BSPs per the NDIS Restrictive Practices and
            Behaviour Support Rules 2018 (F2018L00632).
          </p>
        </div>
        <Link
          href="/app/behaviour-support-plans/new"
          className="min-h-[44px] md:min-h-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          data-testid="create-bsp-btn"
        >
          <Plus className="h-3.5 w-3.5" />
          New BSP
        </Link>
      </div>

      <div className="page-content space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="metric-card metric-card-neutral">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </p>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="metric-card metric-card-success">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Active
              </p>
            </div>
            <p className="text-2xl font-bold">{stats.active}</p>
          </div>
          <div className="metric-card metric-card-neutral">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Drafts
              </p>
            </div>
            <p className="text-2xl font-bold">{stats.drafts}</p>
          </div>
          <div
            className={`metric-card ${
              stats.expiringSoon > 0 ? "metric-card-warning" : "metric-card-success"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Expires ≤30d
              </p>
            </div>
            <p className="text-2xl font-bold">{stats.expiringSoon}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
          <table className="min-w-[700px] w-full" data-testid="bsp-table">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Participant</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Plan type</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">
                  Effective from
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">
                  Expires
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">
                  Provider
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enriched.map((plan) => {
                const status = STATUS_LABELS[plan.status] ?? STATUS_LABELS.draft;
                return (
                  <tr key={plan.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">
                      {plan.participant?.full_name ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {PLAN_TYPE_LABELS[plan.plan_type] ?? plan.plan_type}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">
                      {formatDate(plan.effective_from)}
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">
                      {formatDate(plan.expires_at)}
                    </td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell text-muted-foreground">
                      {plan.sbs_provider_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/app/behaviour-support-plans/${plan.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {enriched.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No behaviour support plans yet. Use{" "}
                    <Link href="/app/behaviour-support-plans/new" className="text-primary hover:underline">
                      New BSP
                    </Link>{" "}
                    to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

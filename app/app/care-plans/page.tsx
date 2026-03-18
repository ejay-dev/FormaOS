/**
 * Care Plans Page
 * Manage individualised care/support plans, goals, and review dates
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, AlertTriangle, CheckCircle, Clock, User, Calendar, Target } from "lucide-react";
import { fetchSystemState } from "@/lib/system-state/server";

export const metadata = {
  title: "Care Plans | FormaOS",
};

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getReviewStatus(reviewDate: string | null): { label: string; color: string; urgent: boolean } {
  if (!reviewDate) return { label: "No Review", color: "text-muted-foreground", urgent: false };

  const review = new Date(reviewDate);
  const now = new Date();
  const daysUntil = Math.ceil((review.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return { label: "Overdue", color: "text-red-600 bg-red-500/10", urgent: true };
  } else if (daysUntil <= 14) {
    return { label: `${daysUntil}d`, color: "text-orange-600 bg-orange-500/10", urgent: true };
  } else if (daysUntil <= 30) {
    return { label: `${daysUntil}d`, color: "text-amber-600 bg-amber-500/10", urgent: false };
  }
  return { label: "On Track", color: "text-green-600 bg-green-500/10", urgent: false };
}

function getCarePlanLabel(industry: string | null): string {
  switch (industry) {
    case "ndis": return "Support Plans";
    case "healthcare": return "Clinical Plans";
    case "childcare": return "Learning Plans";
    default: return "Care Plans";
  }
}

function getClientLabel(industry: string | null): string {
  switch (industry) {
    case "ndis": return "Participant";
    case "healthcare": return "Patient";
    case "childcare": return "Child";
    default: return "Resident";
  }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-slate-600 bg-slate-500/10" },
  active: { label: "Active", color: "text-green-600 bg-green-500/10" },
  under_review: { label: "Under Review", color: "text-blue-600 bg-blue-500/10" },
  expired: { label: "Expired", color: "text-red-600 bg-red-500/10" },
  archived: { label: "Archived", color: "text-muted-foreground bg-muted/50" },
};

const PLAN_TYPE_LABELS: Record<string, string> = {
  support: "Support Plan",
  ndis: "NDIS Plan",
  chsp: "CHSP Plan",
  clinical: "Clinical Plan",
  behavioral: "Behavioural Plan",
};

export default async function CarePlansPage() {
  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");

  const { organization } = systemState;
  const label = getCarePlanLabel(organization.industry);
  const clientLabel = getClientLabel(organization.industry);
  const supabase = await createSupabaseServerClient();

  // Fetch care plans with client info
  const { data: carePlans, error } = await supabase
    .from("org_care_plans")
    .select(`
      id,
      plan_type,
      title,
      description,
      start_date,
      end_date,
      review_date,
      status,
      goals,
      supports,
      client_consented,
      created_at,
      client:client_id (
        id,
        full_name
      )
    `)
    .eq("organization_id", organization.id)
    .order("review_date", { ascending: true, nullsFirst: false })
    .limit(200);

  if (error) {
    console.error("[CarePlansPage] Error fetching care plans:", error);
  }

  // Calculate stats
  type CarePlan = NonNullable<typeof carePlans>[number];
  const now = new Date();
  const stats = {
    total: carePlans?.length ?? 0,
    active: carePlans?.filter((p: CarePlan) => p.status === "active").length ?? 0,
    drafts: carePlans?.filter((p: CarePlan) => p.status === "draft").length ?? 0,
    reviewDue: carePlans?.filter((p: CarePlan) => {
      if (!p.review_date) return false;
      const review = new Date(p.review_date);
      const daysUntil = Math.ceil((review.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 14;
    }).length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" data-testid="care-plans-title">
            {label}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage individualised plans, goals, and review schedules
          </p>
        </div>
        <Link
          href="/app/care-plans/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          data-testid="create-care-plan-btn"
        >
          <Plus className="h-4 w-4" />
          New Plan
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Plans</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-2xl font-bold">{stats.drafts}</p>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.reviewDue}</p>
              <p className="text-sm text-muted-foreground">Review Due</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review alert */}
      {stats.reviewDue > 0 && (
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-600">Reviews Due</p>
              <p className="text-sm text-orange-600/80">
                {stats.reviewDue} plan(s) need review within the next 14 days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full" data-testid="care-plans-table">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">{clientLabel}</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Plan</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">Goals</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Review Date</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {carePlans?.map((plan: CarePlan) => {
              const reviewStatus = getReviewStatus(plan.review_date);
              const statusStyle = STATUS_LABELS[plan.status] || STATUS_LABELS.draft;
              const goalsCount = Array.isArray(plan.goals) ? plan.goals.length : 0;
              return (
                <tr
                  key={plan.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    reviewStatus.urgent ? "bg-orange-500/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {(plan.client as { full_name?: string } | null)?.full_name || "Unassigned"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium">{plan.title}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {PLAN_TYPE_LABELS[plan.plan_type] || plan.plan_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{goalsCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(plan.review_date)}</span>
                      {reviewStatus.urgent && (
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${reviewStatus.color}`}>
                          {reviewStatus.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusStyle.color}`}>
                      {statusStyle.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/care-plans/${plan.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(!carePlans || carePlans.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No care plans created yet</p>
                  <Link
                    href="/app/care-plans/new"
                    className="text-primary hover:underline mt-2 inline-block"
                  >
                    Create your first plan
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

import { createSupabaseServerClient } from "@/lib/supabase/server";

/* ===========================
   TYPES
=========================== */

export interface DashboardMetrics {
  complianceScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  complianceTrend: "UP" | "DOWN" | "FLAT";

  totalPolicies: number;
  activePolicies: number;
  policyCoverageRate: number;

  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;

  evidenceCollected: number;
  evidenceRequired: number;
  evidenceCompletionRate: number;

  recentActivity: ActivityItem[];
  complianceHistory: { month: string; score: number }[];

  anomalies: string[];
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: "policy" | "task" | "evidence" | "security" | "system";
}

/* ===========================
   CORE FUNCTION
=========================== */

export async function getDashboardMetrics(orgId: string): Promise<DashboardMetrics> {
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();

  /* ===========================
     1️⃣ PARALLEL AGGREGATION
  =========================== */

  const [
    { count: totalPolicies },
    { count: activePolicies },
    { count: totalTasks },
    { count: completedTasks },
    { count: overdueTasks },
    { count: totalEvidence },
    { count: collectedEvidence },
    { data: rawActivity },
    { data: policyHistory },
    { data: taskHistory },
    { data: evidenceHistory }
  ] = await Promise.all([
    supabase.from("org_policies").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("org_policies").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "published"),

    supabase.from("org_tasks").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("org_tasks").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "completed"),
    supabase.from("org_tasks")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .lt("due_date", now)
      .neq("status", "completed"),

    supabase.from("org_evidence").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("org_evidence").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "approved"),

    supabase.from("org_audit_logs")
      .select("id, actor_email, action, details, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(12),

    /* Monthly history: last 6 months */
    supabase.from("org_policies")
      .select("created_at")
      .eq("organization_id", orgId)
      .gte("created_at", getMonthsAgo(6)),

    supabase.from("org_tasks")
      .select("created_at, status")
      .eq("organization_id", orgId)
      .gte("created_at", getMonthsAgo(6)),

    supabase.from("org_evidence")
      .select("created_at, status")
      .eq("organization_id", orgId)
      .gte("created_at", getMonthsAgo(6))
  ]);

  /* ===========================
     2️⃣ SAFE NORMALIZATION
  =========================== */

  const TP = totalPolicies || 0;
  const AP = activePolicies || 0;
  const TT = totalTasks || 0;
  const CT = completedTasks || 0;
  const OT = overdueTasks || 0;
  const TE = totalEvidence || 0;
  const CE = collectedEvidence || 0;

  const policyCoverageRate = TP ? round((AP / TP) * 100) : 0;
  const taskCompletionRate = TT ? round((CT / TT) * 100) : 0;
  const evidenceCompletionRate = TE ? round((CE / TE) * 100) : 0;

  /* ===========================
     3️⃣ COMPLIANCE ENGINE
     Weighting:
     - Policies: 35%
     - Evidence: 40%
     - Tasks: 25%
     Penalty for overdue tasks
  =========================== */

  const policyScore = TP ? (AP / TP) * 35 : 0;
  const evidenceScore = TE ? (CE / TE) * 40 : 0;
  const taskScore = TT ? (CT / TT) * 25 : 0;

  const overduePenalty = OT > 0 ? Math.min(OT * 2, 15) : 0;

  let complianceScore = round(policyScore + evidenceScore + taskScore - overduePenalty);
  complianceScore = Math.max(0, Math.min(100, complianceScore));

  /* ===========================
     4️⃣ RISK MODEL
  =========================== */

  const riskLevel =
    complianceScore >= 80 ? "LOW" :
    complianceScore >= 55 ? "MEDIUM" :
    "HIGH";

  /* ===========================
     5️⃣ ACTIVITY PIPELINE
  =========================== */

  const recentActivity: ActivityItem[] = rawActivity?.map((log: any) => ({
    id: log.id,
    user: log.actor_email?.split("@")[0] || "System",
    action: log.action,
    target: log.details?.resourceName || "Unknown",
    timestamp: log.created_at,
    type: classifyActivity(log.action)
  })) || [];

  /* ===========================
     6️⃣ REAL COMPLIANCE HISTORY
  =========================== */

  const complianceHistory = buildMonthlyHistory(policyHistory || [], taskHistory || [], evidenceHistory || []);

  const complianceTrend = calculateTrend(complianceHistory);

  /* ===========================
     7️⃣ ANOMALY DETECTION
  =========================== */

  const anomalies: string[] = [];

  if (OT > 5) anomalies.push("High number of overdue tasks");
  if (policyCoverageRate < 50) anomalies.push("Low policy publication coverage");
  if (evidenceCompletionRate < 40) anomalies.push("Evidence backlog detected");
  if (complianceScore < 50) anomalies.push("Critical compliance score");

  /* ===========================
     8️⃣ FINAL OUTPUT
  =========================== */

  return {
    complianceScore,
    riskLevel,
    complianceTrend,

    totalPolicies: TP,
    activePolicies: AP,
    policyCoverageRate,

    totalTasks: TT,
    completedTasks: CT,
    pendingTasks: TT - CT,
    overdueTasks: OT,
    taskCompletionRate,

    evidenceCollected: CE,
    evidenceRequired: TE,
    evidenceCompletionRate,

    recentActivity,
    complianceHistory,
    anomalies
  };
}

/* ===========================
   HELPERS
=========================== */

function round(value: number) {
  return Math.round(value);
}

function getMonthsAgo(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

function classifyActivity(action: string): ActivityItem["type"] {
  if (action.includes("POLICY")) return "policy";
  if (action.includes("TASK")) return "task";
  if (action.includes("EVIDENCE")) return "evidence";
  if (action.includes("SECURITY")) return "security";
  return "system";
}

function buildMonthlyHistory(policies: any[], tasks: any[], evidence: any[]) {
  const months = getLastMonths(6);

  return months.map(month => {
    const policyCount = policies.filter(p => p.created_at.startsWith(month)).length;
    const completedTasks = tasks.filter(t => t.created_at.startsWith(month) && t.status === "completed").length;
    const totalTasks = tasks.filter(t => t.created_at.startsWith(month)).length;
    const approvedEvidence = evidence.filter(e => e.created_at.startsWith(month) && e.status === "approved").length;
    const totalEvidence = evidence.filter(e => e.created_at.startsWith(month)).length;

    const policyScore = policyCount ? 35 : 0;
    const taskScore = totalTasks ? (completedTasks / totalTasks) * 25 : 0;
    const evidenceScore = totalEvidence ? (approvedEvidence / totalEvidence) * 40 : 0;

    return {
      month,
      score: round(policyScore + taskScore + evidenceScore)
    };
  });
}

function getLastMonths(count: number) {
  const months: string[] = [];
  const d = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(m.toISOString().slice(0, 7));
  }

  return months;
}

function calculateTrend(history: { month: string; score: number }[]) {
  if (history.length < 2) return "FLAT";

  const last = history[history.length - 1].score;
  const prev = history[history.length - 2].score;

  if (last > prev) return "UP";
  if (last < prev) return "DOWN";
  return "FLAT";
}
"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server";

type TaskRow = {
  status: string | null;
  priority: string | null;
  evidence?: Array<{ count: number }> | null;
};

export async function getComplianceStats() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) return null;
  const orgId = membership.organization_id;

  // 1. Fetch Tasks with Evidence count
  const { data: tasks } = await supabase
    .from("org_tasks")
    .select(`
      status,
      priority,
      evidence:org_evidence(count)
    `)
    .eq("organization_id", orgId);

  const allTasks: TaskRow[] = tasks || [];
  const total = allTasks.length;
  
  if (total === 0) return { score: 0, total: 0, completed: 0, verified: 0 };

  // 2. Calculate Advanced Metrics
  const completed = allTasks.filter((t) => t.status === "completed").length;
  
  // "Verified" means a task is completed AND has at least 1 evidence file
  const verified = allTasks.filter(
    (t) => t.status === "completed" && (t.evidence?.[0]?.count || 0) > 0
  ).length;

  // 3. Weighted Score Logic (Critical tasks are worth more)
  const score = Math.round((verified / total) * 100);

  return {
    score,
    total,
    completed,
    verified,
    criticalPending: allTasks.filter(
      (t) => t.priority === "critical" && t.status !== "completed"
    ).length,
  };
}

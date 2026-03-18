"use server";

import { requirePermission } from "@/app/app/actions/rbac";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PeopleOverviewMember {
  id: string;
  user_id: string;
  role: string | null;
  department: string | null;
  start_date: string | null;
  compliance_status: string | null;
  created_at: string;
  taskCount: number;
  evidenceCount: number;
}

export interface PeopleOverviewPayload {
  members: PeopleOverviewMember[];
}

type RawOrgMemberRow = {
  id: string;
  user_id: string | null;
  role: string | null;
  department: string | null;
  start_date: string | null;
  compliance_status: string | null;
  created_at: string | null;
};

export async function fetchPeopleOverview(): Promise<PeopleOverviewPayload> {
  const { orgId } = await requirePermission("VIEW_CONTROLS");
  const supabase = await createSupabaseServerClient();

  const [{ data: memberRows }, { data: taskRows }, { data: evidenceRows }] =
    await Promise.all([
      supabase
        .from("org_members")
        .select(
          "id, user_id, role, department, start_date, compliance_status, created_at",
        )
        .eq("organization_id", orgId)
        .order("created_at", { ascending: true }),
      supabase
        .from("org_tasks")
        .select("assigned_to")
        .eq("organization_id", orgId)
        .not("assigned_to", "is", null),
      supabase
        .from("org_evidence")
        .select("uploaded_by")
        .eq("organization_id", orgId)
        .not("uploaded_by", "is", null),
    ]);

  const taskCounts = new Map<string, number>();
  for (const task of taskRows ?? []) {
    const assignee = task.assigned_to as string | null;
    if (!assignee) continue;
    taskCounts.set(assignee, (taskCounts.get(assignee) ?? 0) + 1);
  }

  const evidenceCounts = new Map<string, number>();
  for (const evidence of evidenceRows ?? []) {
    const uploader = evidence.uploaded_by as string | null;
    if (!uploader) continue;
    evidenceCounts.set(uploader, (evidenceCounts.get(uploader) ?? 0) + 1);
  }

  const members: PeopleOverviewMember[] = ((memberRows ?? []) as RawOrgMemberRow[])
    .filter((member) => Boolean(member.user_id))
    .map((member) => ({
      id: member.id,
      user_id: member.user_id as string,
      role: member.role ?? null,
      department: member.department ?? null,
      start_date: member.start_date ?? null,
      compliance_status: member.compliance_status ?? null,
      created_at: member.created_at ?? new Date().toISOString(),
      taskCount: taskCounts.get(member.user_id as string) ?? 0,
      evidenceCount: evidenceCounts.get(member.user_id as string) ?? 0,
    }));

  return { members };
}

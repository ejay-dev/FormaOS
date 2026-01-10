"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { evaluateFrameworkControls } from "@/app/app/actions/compliance-engine";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

export async function runAutomatedReadinessCheck(frameworkCode: string, reason?: string) {
  const supabase = await createSupabaseServerClient();
  const permissionCtx = await requirePermission("EDIT_CONTROLS");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const result = await evaluateFrameworkControls(permissionCtx.orgId, frameworkCode);
  if (!result) throw new Error("Framework not found or no controls available");

  const { data: framework } = await supabase
    .from("compliance_frameworks")
    .select("id")
    .eq("code", frameworkCode)
    .maybeSingle();

  const missingCodes = result.missingMandatoryCodes;
  if (!framework?.id || missingCodes.length === 0) {
    await logAuditEvent({
      organizationId: permissionCtx.orgId,
      actorUserId: user.id,
      actorRole: permissionCtx.role,
      entityType: "framework",
      entityId: framework?.id ?? null,
      actionType: "READINESS_CHECK_COMPLETED",
      afterState: { frameworkCode, missingCount: missingCodes.length },
      reason: reason && reason.trim().length ? reason.trim() : "automated_readiness_check",
    });
    return { success: true, createdTasks: 0, missingCodes };
  }

  const { data: controls } = await supabase
    .from("compliance_controls")
    .select("id, code, title")
    .eq("framework_id", framework.id)
    .in("code", missingCodes);

  const controlIds = (controls ?? []).map((c: any) => c.id);
  const { data: existingMappings } = await supabase
    .from("control_tasks")
    .select("control_id")
    .eq("organization_id", permissionCtx.orgId)
    .in("control_id", controlIds);

  const existingControlIds = new Set((existingMappings ?? []).map((m: any) => m.control_id));
  let createdTasks = 0;

  for (const control of controls ?? []) {
    if (existingControlIds.has(control.id)) continue;
    const { data: taskRow, error: taskErr } = await supabase
      .from("org_tasks")
      .insert({
        organization_id: permissionCtx.orgId,
        title: `Remediate control ${control.code}: ${control.title}`,
        description: `Automated remediation task for control ${control.code}.`,
        status: "pending",
      })
      .select("id")
      .maybeSingle();

    if (taskErr || !taskRow?.id) continue;

    await supabase.from("control_tasks").insert({
      organization_id: permissionCtx.orgId,
      control_id: control.id,
      task_id: taskRow.id,
    });

    createdTasks++;
  }

  await logAuditEvent({
    organizationId: permissionCtx.orgId,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "framework",
    entityId: framework.id,
    actionType: "READINESS_CHECK_TASKS_CREATED",
    afterState: { frameworkCode, createdTasks, missingCodes },
    reason: reason && reason.trim().length ? reason.trim() : "automated_readiness_check",
  });

  return { success: true, createdTasks, missingCodes };
}

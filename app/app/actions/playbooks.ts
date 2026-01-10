"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

export async function upsertFrameworkPlaybook(payload: {
  frameworkCode: string;
  name: string;
  reviewCadenceDays?: number | null;
  requiredEvidenceTypes?: string[] | null;
  controls?: Array<{
    controlCode: string;
    requiredEvidenceCount?: number | null;
    requiredEvidenceTypes?: string[] | null;
    reviewCadenceDays?: number | null;
  }>;
  reason?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const permissionCtx = await requirePermission("EDIT_CONTROLS");

  const { data: framework } = await supabase
    .from("compliance_frameworks")
    .select("id, code")
    .eq("code", payload.frameworkCode)
    .maybeSingle();

  if (!framework?.id) throw new Error("Framework not found");

  const { data: playbook } = await supabase
    .from("compliance_playbooks")
    .upsert({
      framework_id: framework.id,
      name: payload.name,
      review_cadence_days: payload.reviewCadenceDays ?? null,
      required_evidence_types: payload.requiredEvidenceTypes ?? null,
    }, { onConflict: "framework_id,name" })
    .select("id")
    .maybeSingle();

  if (!playbook?.id) throw new Error("Failed to create playbook");

  if (payload.controls?.length) {
    const { data: controls } = await supabase
      .from("compliance_controls")
      .select("id, code")
      .eq("framework_id", framework.id)
      .in("code", payload.controls.map((c) => c.controlCode));

    const controlIdByCode = new Map((controls ?? []).map((c: any) => [c.code, c.id]));
    const rows = payload.controls
      .map((c) => {
        const controlId = controlIdByCode.get(c.controlCode);
        if (!controlId) return null;
        return {
          playbook_id: playbook.id,
          control_id: controlId,
          required_evidence_count: c.requiredEvidenceCount ?? null,
          required_evidence_types: c.requiredEvidenceTypes ?? null,
          review_cadence_days: c.reviewCadenceDays ?? null,
        };
      })
      .filter(Boolean);

    if (rows.length) {
      await supabase.from("compliance_playbook_controls").upsert(rows, {
        onConflict: "playbook_id,control_id",
      });
    }
  }

  await logAuditEvent({
    organizationId: permissionCtx.orgId,
    actorUserId: permissionCtx.userId,
    actorRole: permissionCtx.role,
    entityType: "playbook",
    entityId: playbook.id,
    actionType: "PLAYBOOK_UPSERTED",
    afterState: { frameworkCode: framework.code, name: payload.name },
    reason: payload.reason && payload.reason.trim().length ? payload.reason.trim() : "playbook_update",
  });

  return { success: true, playbookId: playbook.id };
}

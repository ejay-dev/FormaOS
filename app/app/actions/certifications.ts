"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/app/app/actions/rbac";
import { requireNoComplianceBlocks } from "@/app/app/actions/enforcement";
import { logAuditEvent } from "@/app/app/actions/audit-events";
import { requireEntitlement } from "@/lib/billing/entitlements";

export async function generateCertification(frameworkCode: string, reason?: string) {
  const supabase = await createSupabaseServerClient();
  const permissionCtx = await requirePermission("GENERATE_CERTIFICATIONS");
  await requireEntitlement(permissionCtx.orgId, "certifications");

  const { data: framework, error: frameworkError } = await supabase
    .from("compliance_frameworks")
    .select("id, code, title")
    .eq("code", frameworkCode)
    .maybeSingle();

  if (frameworkError) throw frameworkError;
  if (!framework?.id) throw new Error("Framework not found");

  await requireNoComplianceBlocks(permissionCtx.orgId, "CERT_REPORT");

  const { data: snapshot, error: snapshotError } = await supabase
    .from("org_control_evaluations")
    .select("snapshot_hash, compliance_score, total_controls, last_evaluated_at")
    .eq("organization_id", permissionCtx.orgId)
    .eq("control_type", "framework_snapshot")
    .eq("framework_id", framework.id)
    .order("last_evaluated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (snapshotError) throw snapshotError;
  if (!snapshot?.snapshot_hash) {
    throw new Error("No compliance snapshot available for certification");
  }

  const { data: nonCompliant, error: nonCompliantError } = await supabase
    .from("org_control_evaluations")
    .select("control_key, status, details")
    .eq("organization_id", permissionCtx.orgId)
    .eq("control_type", "framework_control")
    .eq("required", true)
    .neq("status", "compliant");

  if (nonCompliantError) throw nonCompliantError;
  if ((nonCompliant ?? []).length > 0) {
    throw new Error("Certification blocked: unresolved controls exist");
  }

  const { data: controls, error: controlsError } = await supabase
    .from("compliance_controls")
    .select("id, code, title, category, risk_level, required_evidence_count")
    .eq("framework_id", framework.id);

  if (controlsError) throw controlsError;
  const controlIds = (controls ?? []).map((c: any) => c.id);
  const { data: evidenceLinks, error: evidenceLinksError } = await supabase
    .from("control_evidence")
    .select("control_id, evidence_id, status")
    .eq("organization_id", permissionCtx.orgId)
    .in("control_id", controlIds);

  if (evidenceLinksError) throw evidenceLinksError;
  const evidenceIds = Array.from(new Set((evidenceLinks ?? []).map((e: any) => e.evidence_id).filter(Boolean)));
  const { data: evidence, error: evidenceError } = evidenceIds.length
    ? await supabase
        .from("org_evidence")
        .select("id, title, status, verification_status, created_at")
        .eq("organization_id", permissionCtx.orgId)
        .in("id", evidenceIds)
    : { data: [] as any[], error: null };
  if (evidenceError) throw evidenceError;

  const issuedAt = new Date().toISOString();
  const { data: certification, error: certificationError } = await supabase
    .from("org_certifications")
    .insert({
      organization_id: permissionCtx.orgId,
      framework_id: framework.id,
      status: "issued",
      snapshot_hash: snapshot.snapshot_hash,
      issued_at: issuedAt,
      issued_by: permissionCtx.userId,
      reason: reason && reason.trim().length ? reason.trim() : "certification",
      evidence_manifest: { evidence: evidence ?? [] },
      controls_snapshot: { controls: controls ?? [] },
    })
    .select("id")
    .maybeSingle();

  if (certificationError) throw certificationError;

  const { error: exportError } = await supabase.from("org_exports").insert({
    organization_id: permissionCtx.orgId,
    export_type: "CERTIFICATION",
    framework_id: framework.id,
    status: "generated",
    created_by: permissionCtx.userId,
    payload: {
      certification_id: certification?.id ?? null,
      framework_code: framework.code,
      snapshot_hash: snapshot.snapshot_hash,
    },
  });
  if (exportError) throw exportError;

  await logAuditEvent({
    organizationId: permissionCtx.orgId,
    actorUserId: permissionCtx.userId,
    actorRole: permissionCtx.role,
    entityType: "certification",
    entityId: certification?.id ?? null,
    actionType: "CERTIFICATION_ISSUED",
    afterState: {
      frameworkCode: framework.code,
      snapshot_hash: snapshot.snapshot_hash,
      score: snapshot.compliance_score,
    },
    reason: reason && reason.trim().length ? reason.trim() : "certification",
  });

  return {
    success: true,
    certificationId: certification?.id ?? null,
    frameworkCode: framework.code,
    issuedAt,
  };
}

"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrgIdForUser, requireNoComplianceBlocks } from "@/app/app/actions/enforcement";
import { getOrgComplianceSnapshot } from "@/app/app/actions/compliance-engine";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { createCorrelationId } from "@/lib/security/correlation";

type AuditPackage = {
  orgId: string;
  framework: { id: string; code: string; title: string | null } | null;
  generatedAt: string;
  snapshot: ReturnType<typeof getOrgComplianceSnapshot> extends Promise<infer T> ? T : never;
  controls: any[];
  evaluations: any[];
  evidence: any[];
  tasks: any[];
  auditLogs: any[];
};

async function safeSelect(supabase: any, table: string, select: string, filter?: (q: any) => any) {
  try {
    let q = supabase.from(table).select(select);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  } catch {
    throw new Error(`Failed to load ${table}`);
  }
}

export async function generateAuditPackageDataset(frameworkCode: string) {
  const permissionCtx = await requirePermission("EXPORT_REPORTS");
  const { orgId } = await getOrgIdForUser();
  if (permissionCtx.orgId !== orgId) throw new Error("Organization mismatch.");
  const identifier = await getClientIdentifier();
  const rateLimit = await checkRateLimit(RATE_LIMITS.EXPORT, identifier, permissionCtx.userId);
  if (!rateLimit.success) {
    throw new Error("Export rate limit exceeded. Please try again later.");
  }
  const correlationId = createCorrelationId();
  await requireEntitlement(orgId, "audit_export");
  await requireNoComplianceBlocks(orgId, "AUDIT_EXPORT");

  const supabase = await createSupabaseServerClient();
  const generatedAt = new Date().toISOString();

  const frameworkRow = await safeSelect(
    supabase,
    "compliance_frameworks",
    "id,code,title",
    (q) => q.eq("code", frameworkCode).limit(1)
  );
  const framework = frameworkRow[0] || null;

  const controls = framework
    ? await safeSelect(
        supabase,
        "compliance_controls",
        "id,framework_id,code,title,description,category,risk_level,weight,required_evidence_count,is_mandatory",
        (q) => q.eq("framework_id", framework.id)
      )
    : [];

  const controlIds = controls.map((c: any) => c.id);

  const evidenceLinks = controlIds.length
    ? await safeSelect(
        supabase,
        "control_evidence",
        "control_id,evidence_id,status,created_at",
        (q) => q.eq("organization_id", orgId).in("control_id", controlIds)
      )
    : [];

  const evidenceIds = Array.from(
    new Set(evidenceLinks.map((e: any) => e.evidence_id).filter(Boolean))
  );

  const evidence = evidenceIds.length
    ? await safeSelect(
        supabase,
        "org_evidence",
        "id,title,status,created_at",
        (q) => q.eq("organization_id", orgId).in("id", evidenceIds)
      )
    : [];

  const taskLinks = controlIds.length
    ? await safeSelect(
        supabase,
        "control_tasks",
        "control_id,task_id,created_at",
        (q) => q.eq("organization_id", orgId).in("control_id", controlIds)
      )
    : [];

  const taskIds = Array.from(new Set(taskLinks.map((t: any) => t.task_id).filter(Boolean)));

  const tasks = taskIds.length
    ? await safeSelect(
        supabase,
        "org_tasks",
        "id,title,status,due_at,due_date,completed_at",
        (q) => q.eq("organization_id", orgId).in("id", taskIds)
      )
    : [];

  const evaluations = await safeSelect(
    supabase,
    "org_control_evaluations",
    "control_type,control_key,status,required,last_evaluated_at,details,framework_id,compliance_score,total_controls,missing_control_codes,partial_control_codes,snapshot_hash",
    (q) =>
      q
        .eq("organization_id", orgId)
        .in("control_type", ["framework_control", "framework_snapshot"])
  );

  const auditLogs = await safeSelect(
    supabase,
    "org_audit_logs",
    "action,target,actor_email,created_at,metadata",
    (q) => q.eq("organization_id", orgId).order("created_at", { ascending: false }).limit(200)
  );

  const snapshot = await getOrgComplianceSnapshot(orgId, true);

  const payload: AuditPackage = {
    orgId,
    framework,
    generatedAt,
    snapshot,
    controls,
    evaluations,
    evidence,
    tasks,
    auditLogs,
  };

  await logAuditEvent({
    organizationId: orgId,
    actorUserId: permissionCtx.userId,
    actorRole: permissionCtx.role,
    entityType: "export",
    entityId: null,
    actionType: "AUDIT_PACKAGE_DATASET_GENERATED",
    afterState: { frameworkCode, controls: controls.length, evidence: evidence.length, tasks: tasks.length, correlation_id: correlationId },
    reason: "export",
  });

  return payload;
}

"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { fetchComplianceSummaryStrict } from "@/app/app/actions/control-evaluations";
import { evaluateFrameworkControls } from "@/app/app/actions/compliance-engine";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

export async function runGapAnalysis(frameworkCode: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1) org
  const { data: membership, error: memErr } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (memErr || !membership) throw new Error("Organization context lost");
  const orgId = membership.organization_id as string;

  const result = await evaluateFrameworkControls(orgId, frameworkCode);
  if (!result) throw new Error("No controls found for framework");

  const { data: latestSnapshot } = await supabase
    .from("org_control_evaluations")
    .select("snapshot_hash")
    .eq("organization_id", orgId)
    .eq("control_type", "framework_snapshot")
    .order("last_evaluated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  revalidatePath("/app/reports");

  return {
    score: result.score,
    missing: result.missingMandatoryCodes.length,
    total: result.totalControls,
    missingCodes: result.missingMandatoryCodes,
    partialCodes: result.partialCodes,
    snapshot_hash: latestSnapshot?.snapshot_hash ?? null,
  };
}
// ===============================
// CREDENTIAL VERIFICATION ACTION
// ===============================
export async function verifyCredential(
  credentialId: string,
  status: "verified" | "rejected" = "verified",
  reason?: string
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  // Get org context
  const membership = await requirePermission(status === "verified" ? "APPROVE_EVIDENCE" : "REJECT_EVIDENCE");
  const orgId = membership.orgId;

  // Compliance enforcement: block approval if required controls are non-compliant
  if (!reason || !reason.trim()) {
    return { success: false, message: "Approval reason is required." };
  }

  try {
    const summary = await fetchComplianceSummaryStrict(orgId);
    if (summary.requiredNonCompliant > 0 && status === "verified") {
      return {
        success: false,
        message: "Approval blocked: required controls are non-compliant.",
      };
    }
  } catch {
    return {
      success: false,
      message: "Approval blocked: compliance state could not be verified.",
    };
  }

  let credential: any = null;
  try {
    const { data, error } = await supabase
      .from("org_credentials")
      .select("id, organization_id, status, created_by, submitted_by, user_id")
      .eq("id", credentialId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!error) credential = data;
  } catch {
    credential = null;
  }

  if (credential?.organization_id && credential.organization_id !== orgId) {
    return { success: false, message: "Organization mismatch" };
  }

  const ownerId = credential?.created_by || credential?.submitted_by || credential?.user_id;
  if (status === "verified" && ownerId && ownerId === user.id) {
    return { success: false, message: "Segregation violation: cannot approve your own credential." };
  }

  // Update credential status to verified
  const { error: updateErr } = await supabase
    .from("org_credentials")
    .update({
      status,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", credentialId)
    .eq("organization_id", orgId);

  if (updateErr) {
    console.error("Credential verification failed:", updateErr);
    return { success: false, message: "Verification failed" };
  }

  const resolvedReason = reason.trim();
  await logAuditEvent({
    organizationId: orgId,
    actorUserId: user.id,
    actorRole: membership.role,
    entityType: "credential",
    entityId: credentialId,
    actionType: status === "verified" ? "CREDENTIAL_VERIFIED" : "CREDENTIAL_REJECTED",
    beforeState: credential ? { status: credential.status } : null,
    afterState: { status },
    reason: resolvedReason,
  });

  revalidatePath("/app/vault");

  return { success: true };
}

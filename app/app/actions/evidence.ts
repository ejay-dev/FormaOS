"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/app/app/actions/audit"; // ✅ Standardized Logger
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { createCorrelationId } from "@/lib/security/correlation";

const MAX_EVIDENCE_BYTES = 20 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

/**
 * ✅ EVIDENCE UPLOAD ACTION
 * Securely handles file storage, database linking, and compliance logging.
 */
export async function uploadEvidence(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  
  // 1. Identity & Context Guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized Access");
  const membership = await requirePermission("UPLOAD_EVIDENCE");

  const identifier = await getClientIdentifier();
  const rateLimit = await checkRateLimit(RATE_LIMITS.UPLOAD, identifier, user.id);
  if (!rateLimit.success) {
    throw new Error("Rate limit exceeded. Please try again shortly.");
  }

  const taskId = formData.get("taskId") as string;
  const file = formData.get("file") as File;
  
  if (!file || !taskId) throw new Error("Missing required evidence data");
  if (file.size <= 0 || file.size > MAX_EVIDENCE_BYTES) {
    throw new Error("File size exceeds the 20MB limit.");
  }
  if (!ALLOWED_EVIDENCE_TYPES.has(file.type)) {
    throw new Error("Unsupported file type.");
  }

  // 2. Pre-Flight Check: Verify Task & Get Organization ID
  // We fetch this FIRST to ensure we don't upload files for non-existent tasks.
  const { data: task, error: taskError } = await supabase
    .from('org_tasks')
    .select('organization_id, title, entity_id, patient_id')
    .eq('id', taskId)
    .eq('organization_id', membership.orgId)
    .single();

  if (taskError || !task) {
    throw new Error("Target task not found. Upload aborted.");
  }
  if (task.organization_id !== membership.orgId) {
    throw new Error("Organization mismatch.");
  }

  // 3. Storage Operation
  // Strategy: Store by Org ID for easier bulk exports later
  const timestamp = Date.now();
  // Sanitize filename to prevent path traversal issues
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); 
  const filePath = `${task.organization_id}/${taskId}/${timestamp}_${safeName}`;

  const { error: uploadError } = await supabase
    .storage
    .from('evidence') 
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type
    });

  if (uploadError) throw new Error(`Storage Upload Failed: ${uploadError.message}`);

  // 4. Database Linkage
  const { data: createdEvidence, error: dbError } = await supabase
    .from('org_evidence')
    .insert({
      organization_id: task.organization_id,
      entity_id: task.entity_id ?? null,
      patient_id: task.patient_id ?? null,
      task_id: taskId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: user.id
    })
    .select("id")
    .maybeSingle();

  if (dbError) {
    // Optional: Clean up storage if DB insert fails (Advanced cleanup)
    // await supabase.storage.from('evidence').remove([filePath]);
    throw new Error(`Database Link Failed: ${dbError.message}`);
  }

  // 5. ✅ COMPLIANCE LOGGING
  await logActivity(task.organization_id, "UPLOAD_DOCUMENT", {
    resourceName: file.name,
    event: "Evidence attached to task",
    taskTitle: task.title,
    taskId: taskId,
    fileSize: `${(file.size / 1024).toFixed(2)} KB`
  });

  await logAuditEvent({
    organizationId: task.organization_id,
    actorUserId: user.id,
    actorRole: membership.role,
    entityType: "evidence",
    entityId: createdEvidence?.id ?? null,
    actionType: "EVIDENCE_UPLOADED",
    afterState: {
      task_id: taskId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
    },
  });

  revalidatePath("/app/tasks");
  return { success: true };
}
/**
 * ✅ VERIFY EVIDENCE ACTION
 * The digital stamp of approval. This unblocks the Task completion gate.
 */
export async function verifyEvidence(
  evidenceId: string,
  status: 'verified' | 'rejected',
  reason?: string
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const permission = status === "verified" ? "APPROVE_EVIDENCE" : "REJECT_EVIDENCE";
  const membership = await requirePermission(permission);
  if (!reason || !reason.trim()) {
    throw new Error("Approval reason is required.");
  }
  const correlationId = createCorrelationId();

  // 2. Fetch Evidence Context (for logging)
  const { data: evidence, error: evidenceError } = await supabase
    .from("org_evidence")
    .select("file_name, task_id, organization_id, uploaded_by, verification_status")
    .eq("id", evidenceId)
    .eq("organization_id", membership.orgId)
    .single();

  if (evidenceError || !evidence) throw new Error("Evidence artifact not found.");
  if (evidence.organization_id !== membership.orgId) {
    throw new Error("Organization mismatch.");
  }
  if (status === "verified" && evidence.uploaded_by === user.id) {
    throw new Error("Segregation violation: cannot approve your own evidence.");
  }

  // 3. Execute Verification
  const { error } = await supabase
    .from("org_evidence")
    .update({ 
      verification_status: status,
      verified_by: user.id,
      verified_at: new Date().toISOString()
    })
    .eq("id", evidenceId)
    .eq("organization_id", membership.orgId);

  if (error) throw error;
  const mappedStatus = status === "verified" ? "approved" : "rejected";
  try {
    await supabase
      .from("control_evidence")
      .update({ status: mappedStatus, updated_at: new Date().toISOString() })
      .eq("organization_id", membership.orgId)
      .eq("evidence_id", evidenceId);
  } catch {
    // ignore if mapping table missing
  }
  const resolvedReason = reason && reason.trim().length > 0 ? reason.trim() : "unspecified";

  // 4. ✅ COMPLIANCE LOGGING
  await logActivity(membership.orgId, "UPDATE_POLICY" as any, { // Re-using broad category or add 'VERIFY_EVIDENCE' type
    resourceName: evidence.file_name,
    event: `Evidence marked as ${status.toUpperCase()}`,
    evidenceId: evidenceId,
    taskId: evidence.task_id,
    outcome: status
  });

  await logAuditEvent({
    organizationId: membership.orgId,
    actorUserId: user.id,
    actorRole: membership.role,
    entityType: "evidence",
    entityId: evidenceId,
    actionType: status === "verified" ? "EVIDENCE_APPROVED" : "EVIDENCE_REJECTED",
    beforeState: { verification_status: evidence.verification_status ?? null },
    afterState: { verification_status: status, correlation_id: correlationId },
    reason: resolvedReason,
  });

  revalidatePath("/app/vault");
  revalidatePath("/app/tasks"); // Unblocks the task UI
  return { success: true };
}

'use server';

import { actionError, actionOk, isNextInternalError } from '@/lib/actions/safe';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logActivity } from '@/app/app/actions/audit'; // ✅ Standardized Logger
import { logActivity as logProductActivity } from '@/lib/activity/feed';
import { notify } from '@/lib/notifications/engine';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/app/app/actions/rbac';
import { logAuditEvent } from '@/app/app/actions/audit-events';
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';
import { createCorrelationId } from '@/lib/security/correlation';
import {
  assertOrgCanWrite,
  OrgReadOnlyError,
} from '@/lib/billing/enforce-grace-period';

const MAX_EVIDENCE_BYTES = 20 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

/**
 * Validates that the file's leading bytes (magic bytes) match the declared MIME type.
 * Prevents spoofed Content-Type headers from bypassing the allow-list.
 */
function validateMagicBytes(header: Uint8Array, declaredType: string): boolean {
  // PDF: starts with %PDF (0x25 0x50 0x44 0x46)
  if (declaredType === 'application/pdf') {
    return (
      header[0] === 0x25 &&
      header[1] === 0x50 &&
      header[2] === 0x44 &&
      header[3] === 0x46
    );
  }

  // PNG: starts with 0x89 P N G (0x89 0x50 0x4E 0x47)
  if (declaredType === 'image/png') {
    return (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    );
  }

  // JPEG: starts with 0xFF 0xD8 0xFF
  if (declaredType === 'image/jpeg') {
    return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  }

  // WebP: starts with RIFF....WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  if (declaredType === 'image/webp') {
    return (
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46 &&
      header[8] === 0x57 &&
      header[9] === 0x45 &&
      header[10] === 0x42 &&
      header[11] === 0x50
    );
  }

  // ZIP-based formats (docx, xlsx, legacy doc): PK header (0x50 0x4B 0x03 0x04)
  const ZIP_TYPES = new Set([
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]);
  if (ZIP_TYPES.has(declaredType)) {
    return (
      header[0] === 0x50 &&
      header[1] === 0x4b &&
      header[2] === 0x03 &&
      header[3] === 0x04
    );
  }

  // text/plain: no reliable magic bytes — allow through
  if (declaredType === 'text/plain') {
    return true;
  }

  return false;
}

/**
 * ✅ EVIDENCE UPLOAD ACTION
 * Securely handles file storage, database linking, and compliance logging.
 */
export async function uploadEvidence(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();

    // 1. Identity & Context Guard
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized Access');
    const membership = await requirePermission('UPLOAD_EVIDENCE');

    const identifier = await getClientIdentifier();
    const rateLimit = await checkRateLimit(
      RATE_LIMITS.UPLOAD,
      identifier,
      user.id,
    );
    if (!rateLimit.success) {
      throw new Error('Rate limit exceeded. Please try again shortly.');
    }

    const taskId = formData.get('taskId') as string;
    const file = formData.get('file') as File;

    if (!file || !taskId) throw new Error('Missing required evidence data');
    if (file.size <= 0 || file.size > MAX_EVIDENCE_BYTES) {
      throw new Error('File size exceeds the 20MB limit.');
    }
    if (!ALLOWED_EVIDENCE_TYPES.has(file.type)) {
      throw new Error('Unsupported file type.');
    }

    // Magic-byte validation: verify file content matches declared MIME type
    const fileBuffer = await file.arrayBuffer();
    const header = new Uint8Array(fileBuffer).slice(0, 12);
    if (!validateMagicBytes(header, file.type)) {
      throw new Error('File content does not match declared type');
    }

    // 2. Pre-Flight Check: Verify Task & Get Organization ID
    // We fetch this FIRST to ensure we don't upload files for non-existent tasks.
    const { data: task, error: taskError } = await supabase
      .from('org_tasks')
      .select('organization_id, title, entity_id, patient_id, assigned_to')
      .eq('id', taskId)
      .eq('organization_id', membership.orgId)
      .maybeSingle();

    if (taskError || !task) {
      throw new Error('Target task not found. Upload aborted.');
    }
    if (task.organization_id !== membership.orgId) {
      throw new Error('Organization mismatch.');
    }

    // Audit 2026-05-23: grace-period read-only gate. Past-due orgs get
    // 3 days of full access, then writes are blocked until billing
    // recovers (see lib/billing/enforce-grace-period.ts). Checked here
    // (before any storage / DB write) so we don't burn upload bandwidth
    // on a request we're about to reject.
    try {
      await assertOrgCanWrite(task.organization_id);
    } catch (gateError) {
      if (gateError instanceof OrgReadOnlyError) {
        return actionError(
          new Error(
            `Organisation is in read-only mode (${gateError.daysOverdue} day(s) past grace period). Update billing to resume uploads.`,
          ),
        );
      }
      throw gateError;
    }

    // 3. Storage Operation
    // Strategy: Store by Org ID for easier bulk exports later
    const timestamp = Date.now();
    // Sanitize filename to prevent path traversal issues
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${task.organization_id}/${taskId}/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('evidence')
      .upload(filePath, fileBuffer, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError)
      throw new Error(`Storage Upload Failed: ${uploadError.message}`);

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
        uploaded_by: user.id,
      })
      .select('id')
      .maybeSingle();

    if (dbError) {
      // Optional: Clean up storage if DB insert fails (Advanced cleanup)
      // await supabase.storage.from('evidence').remove([filePath]);
      throw new Error(`Database Link Failed: ${dbError.message}`);
    }

    // 4b. CONTROL LINKAGE — audit compliance-003 (2026-05-22).
    // Insert control_evidence rows for every (control_id, evidence_id)
    // pair so coverage calculators, audit-pack exports, and the
    // verifyEvidence path actually see this evidence as linked to
    // controls. Two sources for controlIds:
    //   1. Explicit `controlIds[]` form field — populated by the
    //      upload UI when the user selects which controls this evidence
    //      satisfies (preferred).
    //   2. Auto-derived from the task's existing control_tasks rows —
    //      fallback when the UI doesn't pass explicit ids, so a plain
    //      "upload to task" flow still links to whichever controls
    //      already point at that task.
    const explicitControlIds = formData
      .getAll('controlIds')
      .filter((v): v is string => typeof v === 'string' && v.length > 0);

    let resolvedControlIds = explicitControlIds;
    if (resolvedControlIds.length === 0 && createdEvidence?.id) {
      const { data: derivedRows } = await supabase
        .from('control_tasks')
        .select('control_id')
        .eq('organization_id', task.organization_id)
        .eq('task_id', taskId);
      resolvedControlIds = (derivedRows ?? [])
        .map((r) => r.control_id as string | null)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);
    }

    if (createdEvidence?.id && resolvedControlIds.length > 0) {
      const linkPayload = resolvedControlIds.map((controlId) => ({
        organization_id: task.organization_id,
        control_id: controlId,
        evidence_id: createdEvidence.id,
        status: 'pending' as const,
      }));
      const { error: linkErr } = await supabase
        .from('control_evidence')
        .upsert(linkPayload, {
          onConflict: 'organization_id,control_id,evidence_id',
          ignoreDuplicates: true,
        });
      if (linkErr) {
        // Linkage failure must not block the upload — the evidence row is
        // already persisted. Log and continue; the nightly backfill job
        // will catch missed links.
        console.warn(
          '[evidence/upload] control_evidence linkage failed:',
          linkErr.message,
        );
      }
    }

    // 5. ✅ COMPLIANCE LOGGING
    await logActivity(task.organization_id, 'UPLOAD_DOCUMENT', {
      resourceName: file.name,
      event: 'Evidence attached to task',
      taskTitle: task.title,
      taskId: taskId,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`,
    });

    await logProductActivity(
      task.organization_id,
      user.id,
      'uploaded',
      {
        type: 'evidence',
        id: createdEvidence?.id ?? null,
        name: file.name,
        path: '/app/evidence',
      },
      {
        taskId,
        taskTitle: task.title,
        fileType: file.type,
        fileSize: file.size,
      },
    );

    await logAuditEvent({
      organizationId: task.organization_id,
      actorUserId: user.id,
      actorRole: membership.role,
      entityType: 'evidence',
      entityId: createdEvidence?.id ?? null,
      actionType: 'EVIDENCE_UPLOADED',
      afterState: {
        task_id: taskId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
      },
    });

    if (task.assigned_to && task.assigned_to !== user.id) {
      await notify(task.organization_id, [task.assigned_to], {
        type: 'evidence.review_requested',
        title: 'Evidence ready for review',
        body: `${file.name} was attached to ${task.title}.`,
        priority: 'high',
        data: {
          href: '/app/tasks',
          taskId,
          evidenceId: createdEvidence?.id ?? null,
          resourceType: 'evidence',
          resourceName: file.name,
          dedupeKey: `evidence.review_requested:${createdEvidence?.id ?? filePath}`,
        },
      });
    }

    revalidatePath('/app/tasks');
    return actionOk();
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
/**
 * ✅ VERIFY EVIDENCE ACTION
 * The digital stamp of approval. This unblocks the Task completion gate.
 */
export async function verifyEvidence(
  evidenceId: string,
  status: 'verified' | 'rejected',
  reason?: string,
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const permission =
      status === 'verified' ? 'APPROVE_EVIDENCE' : 'REJECT_EVIDENCE';
    const membership = await requirePermission(permission);
    if (!reason || !reason.trim()) {
      throw new Error('Approval reason is required.');
    }
    const correlationId = createCorrelationId();

    // 2. Fetch Evidence Context (for logging)
    const { data: evidence, error: evidenceError } = await supabase
      .from('org_evidence')
      .select(
        'file_name, task_id, organization_id, uploaded_by, verification_status',
      )
      .eq('id', evidenceId)
      .eq('organization_id', membership.orgId)
      .maybeSingle();

    if (evidenceError || !evidence)
      throw new Error('Evidence artifact not found.');
    if (evidence.organization_id !== membership.orgId) {
      throw new Error('Organization mismatch.');
    }
    if (status === 'verified' && evidence.uploaded_by === user.id) {
      throw new Error(
        'Segregation violation: cannot approve your own evidence.',
      );
    }

    // 3. Execute Verification
    const { error } = await supabase
      .from('org_evidence')
      .update({
        verification_status: status,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', evidenceId)
      .eq('organization_id', membership.orgId);

    if (error) throw error;
    const mappedStatus = status === 'verified' ? 'approved' : 'rejected';
    try {
      await supabase
        .from('control_evidence')
        .update({ status: mappedStatus, updated_at: new Date().toISOString() })
        .eq('organization_id', membership.orgId)
        .eq('evidence_id', evidenceId);
    } catch {
      // ignore if mapping table missing
    }
    const resolvedReason =
      reason && reason.trim().length > 0 ? reason.trim() : 'unspecified';

    // 4. ✅ COMPLIANCE LOGGING
    await logActivity(membership.orgId, 'VERIFY_EVIDENCE', {
      resourceName: evidence.file_name,
      event: `Evidence marked as ${status.toUpperCase()}`,
      evidenceId: evidenceId,
      taskId: evidence.task_id,
      outcome: status,
    });

    await logProductActivity(
      membership.orgId,
      user.id,
      status === 'verified' ? 'approved' : 'rejected',
      {
        type: 'evidence',
        id: evidenceId,
        name: evidence.file_name,
        path: '/app/vault',
      },
      {
        taskId: evidence.task_id,
        verificationStatus: status,
        reason: resolvedReason,
      },
    );

    await logAuditEvent({
      organizationId: membership.orgId,
      actorUserId: user.id,
      actorRole: membership.role,
      entityType: 'evidence',
      entityId: evidenceId,
      actionType:
        status === 'verified' ? 'EVIDENCE_APPROVED' : 'EVIDENCE_REJECTED',
      beforeState: {
        verification_status: evidence.verification_status ?? null,
      },
      afterState: {
        verification_status: status,
        correlation_id: correlationId,
      },
      reason: resolvedReason,
    });

    if (evidence.uploaded_by && evidence.uploaded_by !== user.id) {
      await notify(membership.orgId, [evidence.uploaded_by], {
        type: status === 'verified' ? 'evidence.approved' : 'evidence.rejected',
        title:
          status === 'verified'
            ? 'Evidence approved'
            : 'Evidence needs changes',
        body:
          status === 'verified'
            ? `${evidence.file_name} was approved.`
            : `${evidence.file_name} was rejected: ${resolvedReason}`,
        priority: status === 'verified' ? 'normal' : 'high',
        data: {
          href: '/app/vault',
          evidenceId,
          taskId: evidence.task_id,
          resourceType: 'evidence',
          resourceName: evidence.file_name,
          dedupeKey: `evidence.${status}:${evidenceId}`,
        },
      });
    }

    revalidatePath('/app/vault');
    revalidatePath('/app/tasks'); // Unblocks the task UI
    return actionOk();
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

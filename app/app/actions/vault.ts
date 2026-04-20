'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { requirePermission } from '@/app/app/actions/rbac';
import { logAuditEvent } from '@/app/app/actions/audit-events';
import { actionError, isNextInternalError } from "@/lib/actions/safe";

export async function registerVaultArtifact(data: {
  title: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  policyId?: string;
  checksum?: string;
}) {
  try {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const permissionCtx = await requirePermission('UPLOAD_EVIDENCE');

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership || membership.organization_id !== permissionCtx.orgId)
    throw new Error('Access Denied');

  const { data: evidenceRow, error } = await supabase
    .from('org_evidence')
    .insert({
      organization_id: membership.organization_id,
      title: data.title,
      file_path: data.filePath,
      file_type: data.fileType,
      file_size: data.fileSize,
      uploaded_by: user.id,
      linked_policy_id: data.policyId || null,
      checksum: data.checksum || null,
    })
    .select('id')
    .maybeSingle();

  if (error) throw error;

  await logActivity(
    membership.organization_id,
    'published_policy', // Logic: Artifacts are 'Evidence of Publication'
    `Vault: Uploaded and secured artifact: ${data.title}`,
  );

  await logAuditEvent({
    organizationId: membership.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: 'evidence',
    entityId: evidenceRow?.id ?? null,
    actionType: 'EVIDENCE_UPLOADED',
    afterState: { title: data.title, file_path: data.filePath },
    reason: 'vault_upload',
  });

  revalidatePath('/app/vault');
  if (data.policyId) revalidatePath(`/app/policies/${data.policyId}`);

  return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function getEvidenceSignedUrl(filePath: string) {
  try {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const permissionCtx = await requirePermission('VIEW_CONTROLS');

  const { data: evidence, error: evidenceError } = await supabase
    .from('org_evidence')
    .select('id, organization_id')
    .eq('file_path', filePath)
    .eq('organization_id', permissionCtx.orgId)
    .maybeSingle();

  if (evidenceError || !evidence) {
    throw new Error('Evidence not found');
  }

  const { data, error } = await supabase.storage
    .from('evidence')
    .createSignedUrl(filePath, 60 * 10);

  if (error || !data?.signedUrl) {
    throw new Error('Signed URL generation failed');
  }

  return { signedUrl: data.signedUrl };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

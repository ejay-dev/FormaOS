'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/audit/legacy-log-activity';
import { requirePermission } from '@/app/app/actions/rbac';
import { logAuditEvent } from '@/app/app/actions/audit-events';
import { actionError, isNextInternalError } from "@/lib/actions/safe";
import { isMissingSupabaseColumnError } from '@/lib/supabase/schema-compat';

export async function registerVaultArtifact(data: {
  title: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  policyId?: string;
  /**
   * Control this artifact closes a gap for, from the `?control=` param the
   * evidence-gap and report links carry into the vault. Written as part of
   * the insert: a follow-up update from the browser is not equivalent,
   * because the RLS update policy can reject it without the upload failing.
   */
  controlId?: string;
  /** SHA-256 hex of the uploaded bytes, computed before upload. */
  fileHash: string;
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

  // The control id arrives from a URL the user can edit, so resolve it
  // against this org before it is written anywhere.
  const requestedControlId = data.controlId?.trim() || '';
  let controlToLink: string | null = null;
  if (requestedControlId) {
    const { data: control } = await supabase
      .from('org_controls')
      .select('id')
      .eq('organization_id', membership.organization_id)
      .eq('id', requestedControlId)
      .maybeSingle();
    controlToLink = (control?.id as string | undefined) ?? null;
  }

  // org_evidence.file_name is NOT NULL in the base schema. Persisting the
  // original filename also drives the downloads UX, so accept it explicitly
  // rather than synthesising it from the title (which is optional and may
  // duplicate across uploads).
  const insertPayload: Record<string, unknown> = {
    organization_id: membership.organization_id,
    title: data.title,
    file_name: data.fileName,
    file_path: data.filePath,
    file_type: data.fileType,
    file_size: data.fileSize,
    uploaded_by: user.id,
    linked_policy_id: data.policyId || null,
    file_hash: data.fileHash,
    verification_status: 'pending',
  };
  if (controlToLink) insertPayload.control_id = controlToLink;

  let controlLinked = Boolean(controlToLink);
  let { data: evidenceRow, error } = await supabase
    .from('org_evidence')
    .insert(insertPayload)
    .select('id')
    .maybeSingle();

  // org_evidence.control_id is not in the shipped schema yet (no migration
  // adds it, and production does not have it either), so this retry is the
  // live path rather than a rare fallback: the file still has to land, and
  // `controlLinked: false` tells the modal to say the control was not
  // attached instead of claiming a link that was never written.
  if (
    error &&
    controlToLink &&
    isMissingSupabaseColumnError(error, 'org_evidence', 'control_id')
  ) {
    controlLinked = false;
    delete insertPayload.control_id;
    ({ data: evidenceRow, error } = await supabase
      .from('org_evidence')
      .insert(insertPayload)
      .select('id')
      .maybeSingle());
  }

  if (error) {
    // Postgres 23505 = unique_violation. Combined with the deterministic
    // hash-based storage path the modal now uses, a duplicate insert means
    // a double-click hit the same payload — return success so the UI
    // doesn't show an error for what was effectively a retry.
    const errCode = (error as { code?: string }).code;
    if (errCode === '23505') {
      const { data: existing } = await supabase
        .from('org_evidence')
        .select('id')
        .eq('organization_id', membership.organization_id)
        .eq('file_path', data.filePath)
        .maybeSingle();
      // Re-uploading a file that is already in the vault is how people
      // attach an existing artifact to a new gap, so still record the
      // control on the row that survived.
      if (controlToLink && existing?.id) {
        const { error: relinkError } = await supabase
          .from('org_evidence')
          .update({ control_id: controlToLink })
          .eq('id', existing.id)
          .eq('organization_id', membership.organization_id);
        controlLinked = !relinkError;
      }
      revalidatePath('/app/vault');
      if (data.policyId) revalidatePath(`/app/policies/${data.policyId}`);
      if (controlLinked) revalidatePath('/app/evidence/gaps');
      return {
        success: true as const,
        evidenceId: existing?.id ?? null,
        deduplicated: true as const,
        controlLinked,
      };
    }

    // Otherwise roll back the orphaned storage object so the user does not
    // end up with a file in the bucket but no metadata row pointing at it.
    await supabase.storage
      .from('evidence')
      .remove([data.filePath])
      .catch(() => {});
    throw error;
  }

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
  if (controlLinked) revalidatePath('/app/evidence/gaps');

  return {
    success: true as const,
    evidenceId: evidenceRow?.id ?? null,
    controlLinked,
  };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Delete an evidence row + its storage object. Two-step delete with explicit
 * scoping by both organization_id and id so a misrouted call cannot reach
 * another tenant's row even if RLS permitted it. Storage removal is best
 * effort — if the object is already gone we still consider the row delete
 * authoritative.
 */
export async function deleteEvidence(evidenceId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    const permissionCtx = await requirePermission('UPLOAD_EVIDENCE');

    const { data: row, error: fetchError } = await supabase
      .from('org_evidence')
      .select('id, file_path, organization_id, title')
      .eq('id', evidenceId)
      .eq('organization_id', permissionCtx.orgId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!row) throw new Error('Evidence not found');

    const { error: deleteError } = await supabase
      .from('org_evidence')
      .delete()
      .eq('id', evidenceId)
      .eq('organization_id', permissionCtx.orgId);

    if (deleteError) throw deleteError;

    if (row.file_path) {
      await supabase.storage
        .from('evidence')
        .remove([row.file_path])
        .catch(() => {});
    }

    await logAuditEvent({
      organizationId: permissionCtx.orgId,
      actorUserId: user.id,
      actorRole: permissionCtx.role,
      entityType: 'evidence',
      entityId: evidenceId,
      actionType: 'EVIDENCE_DELETED',
      beforeState: { title: row.title, file_path: row.file_path },
      reason: 'vault_delete',
    });

    revalidatePath('/app/vault');
    return { success: true as const };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

/**
 * Light-weight list of the current org's policies for use as a "Link to
 * policy" selector in the Vault upload modal. Returns id + title only.
 * RLS-bound; no admin client.
 */
export async function listOrgPoliciesForLinking(): Promise<
  | { success: true; policies: { id: string; title: string }[] }
  | { success: false; error: string }
> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('org_policies')
      .select('id, title')
      .order('updated_at', { ascending: false })
      .limit(200);

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      policies: ((data ?? []) as Array<{ id: string; title: string | null }>)
        .filter((p) => Boolean(p.title))
        .map((p) => ({ id: p.id, title: p.title as string })),
    };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list policies',
    };
  }
}

/**
 * Resolve the control behind the vault's `?control=` param so the upload
 * modal can name what the file is being attached to instead of showing an
 * id. org_controls carries no row-level policy of its own, so the caller's
 * organisation is applied here explicitly — a control id from another
 * workspace resolves to null.
 */
export async function getControlForEvidenceLink(controlId: string): Promise<
  | { success: true; control: { id: string; code: string; title: string } | null }
  | { success: false; error: string }
> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    const permissionCtx = await requirePermission('VIEW_CONTROLS');

    const trimmed = controlId.trim();
    if (!trimmed) return { success: true, control: null };

    const { data, error } = await supabase
      .from('org_controls')
      .select('id, code, title')
      .eq('organization_id', permissionCtx.orgId)
      .eq('id', trimmed)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    if (!data) return { success: true, control: null };

    return {
      success: true,
      control: {
        id: data.id as string,
        code: (data.code as string | null) ?? '',
        title: (data.title as string | null) ?? '',
      },
    };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load control',
    };
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

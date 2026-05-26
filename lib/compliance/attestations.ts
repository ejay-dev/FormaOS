import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';

// Audit Sprint 6c (2026-05-23): data layer for the manual-attestation
// workflow. Pairs with:
//   - supabase/migrations/20260624021_audit_sprint6c_control_attestations.sql
//   - app/app/actions/compliance-attestations.ts (mutators)
//   - app/app/compliance/attestations/page.tsx (UI)
//
// The list-resolver here is the part that bridges the evaluator world
// ("this control needs human attestation") and the attestation row
// world ("here's the human attestation, claimed, reviewed"). It joins
// org_control_evaluations rows whose `details->gaps` contain
// `code=manual_attestation_required` against the latest
// org_control_attestations row per (framework, control).

export type AttestationStatus = 'claimed' | 'reviewed' | 'rejected';

export interface AttestationRow {
  id: string;
  organizationId: string;
  frameworkId: string;
  controlKey: string;
  status: AttestationStatus;
  claimedBy: string;
  claimedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectedReason: string | null;
  evidenceId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Controls that need a manual attestation, plus their latest attestation
 * (if any). UI surfaces this as three buckets:
 *   - Awaiting attestation: latestAttestation === null OR status === 'rejected'
 *   - Awaiting review: latestAttestation.status === 'claimed'
 *   - Reviewed: latestAttestation.status === 'reviewed'
 */
export interface ControlNeedingAttestation {
  frameworkId: string;
  frameworkName: string | null;
  controlKey: string;
  controlTitle: string | null;
  message: string;
  latestAttestation: AttestationRow | null;
}

export const MANUAL_GAP_CODE = 'manual_attestation_required';

function toAttestationRow(raw: Record<string, unknown>): AttestationRow {
  return {
    id: String(raw.id),
    organizationId: String(raw.organization_id),
    frameworkId: String(raw.framework_id),
    controlKey: String(raw.control_key),
    status: String(raw.status) as AttestationStatus,
    claimedBy: String(raw.claimed_by),
    claimedAt: String(raw.claimed_at),
    reviewedBy: raw.reviewed_by ? String(raw.reviewed_by) : null,
    reviewedAt: raw.reviewed_at ? String(raw.reviewed_at) : null,
    rejectedReason: raw.rejected_reason ? String(raw.rejected_reason) : null,
    evidenceId: String(raw.evidence_id),
    notes: raw.notes ? String(raw.notes) : null,
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
  };
}

/**
 * List every control across the org's active frameworks that needs a
 * manual attestation, with its latest attestation row attached. Caller
 * groups by `latestAttestation?.status` for the UI buckets.
 */
export async function listControlsNeedingAttestation(
  orgId: string,
): Promise<ControlNeedingAttestation[]> {
  const supabase = createSupabaseOrgClient(orgId);

  // 1. Manual-attestation-required signals from the evaluator output.
  // Per-control rows live alongside per-framework snapshot rows in this
  // table — we want the per-control ones (control_key IS NOT NULL).
  // .eq('organization_id', orgId) appended automatically.
  const { data: evalRows, error: evalError } = await supabase
    .from('org_control_evaluations')
    .select('framework_id, control_key, details')
    .eq('status', 'not_evaluated')
    .not('control_key', 'is', null);

  if (evalError) {
    throw new Error(
      `listControlsNeedingAttestation: failed to read evaluations: ${evalError.message}`,
    );
  }

  const candidates = ((evalRows ?? []) as Array<Record<string, unknown>>).filter((row) => {
    const details = (row as { details?: { gaps?: Array<{ code?: string }> } })
      .details;
    return details?.gaps?.some((g) => g?.code === MANUAL_GAP_CODE) === true;
  });

  if (candidates.length === 0) return [];

  // 2. Framework names for display. `compliance_frameworks` is a global
  // catalog (not org-scoped) — drop to the underlying admin client.
  const admin = supabase.unsafeAdmin();
  const frameworkIds = Array.from(
    new Set(candidates.map((c) => String((c as { framework_id: string }).framework_id))),
  );
  const { data: frameworks } = await admin
    .from('compliance_frameworks')
    .select('id, name')
    .in('id', frameworkIds);

  const frameworkNameById = new Map(
    ((frameworks ?? []) as Array<{ id: string; name: string | null }>).map(
      (f) => [String(f.id), f.name],
    ),
  );

  // 3. Latest attestation per (framework, control) — ordered DESC by
  // claimed_at so the first row per group is the current one.
  // .eq('organization_id', orgId) appended automatically.
  const { data: attestations, error: attError } = await supabase
    .from('org_control_attestations')
    .select('*')
    .order('claimed_at', { ascending: false });

  if (attError) {
    throw new Error(
      `listControlsNeedingAttestation: failed to read attestations: ${attError.message}`,
    );
  }

  const latestByKey = new Map<string, AttestationRow>();
  for (const row of attestations ?? []) {
    const key = `${row.framework_id}|${row.control_key}`;
    if (!latestByKey.has(key)) {
      latestByKey.set(key, toAttestationRow(row as Record<string, unknown>));
    }
  }

  return candidates.map((c) => {
    const frameworkId = String((c as { framework_id: string }).framework_id);
    const controlKey = String((c as { control_key: string }).control_key);
    const details = (c as { details?: { gaps?: Array<{ message?: string }> } })
      .details;
    const message =
      details?.gaps?.find((g) => g?.message)?.message ??
      'Manual attestation required.';

    return {
      frameworkId,
      frameworkName: frameworkNameById.get(frameworkId) ?? null,
      controlKey,
      // We don't have a separate control title table populated for
      // every pack today — fall back to the code itself.
      controlTitle: controlKey,
      message,
      latestAttestation: latestByKey.get(`${frameworkId}|${controlKey}`) ?? null,
    };
  });
}

export interface ClaimAttestationInput {
  orgId: string;
  frameworkId: string;
  controlKey: string;
  evidenceId: string;
  notes?: string;
  claimedBy: string;
}

export async function insertAttestationClaim(
  input: ClaimAttestationInput,
): Promise<AttestationRow> {
  const supabase = createSupabaseOrgClient(input.orgId);
  // organization_id is stamped automatically by the org-scoped client.
  const { data, error } = await supabase
    .from('org_control_attestations')
    .insert({
      framework_id: input.frameworkId,
      control_key: input.controlKey,
      status: 'claimed',
      claimed_by: input.claimedBy,
      evidence_id: input.evidenceId,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error || !data) {
    throw new Error(
      `insertAttestationClaim: ${error?.message ?? 'no row returned'}`,
    );
  }
  return toAttestationRow(data as Record<string, unknown>);
}

export interface ReviewAttestationInput {
  attestationId: string;
  reviewerUserId: string;
  decision: 'approve' | 'reject';
  rejectedReason?: string;
}

/**
 * Returns the updated row. Throws if:
 *   - the row doesn't exist
 *   - the reviewer is the same user who claimed (DB CHECK also catches this
 *     but we throw early with a clearer message)
 *   - decision === 'reject' but no reason given
 */
export async function updateAttestationReview(
  input: ReviewAttestationInput,
): Promise<AttestationRow> {
  if (input.decision === 'reject' && !input.rejectedReason?.trim()) {
    throw new Error(
      'updateAttestationReview: rejected_reason required when rejecting',
    );
  }
  const admin = createSupabaseAdminClient();

  const { data: existing, error: readError } = await admin
    .from('org_control_attestations')
    .select('id, claimed_by, status')
    .eq('id', input.attestationId)
    .maybeSingle();

  if (readError) {
    throw new Error(`updateAttestationReview: ${readError.message}`);
  }
  if (!existing) {
    throw new Error('updateAttestationReview: attestation not found');
  }
  if (existing.status !== 'claimed') {
    throw new Error(
      `updateAttestationReview: only 'claimed' attestations can be reviewed (current status=${String(existing.status)})`,
    );
  }
  if (existing.claimed_by === input.reviewerUserId) {
    throw new Error(
      'updateAttestationReview: reviewer must be a different user from the claimer (separation of duties)',
    );
  }

  const patch =
    input.decision === 'approve'
      ? {
          status: 'reviewed' as const,
          reviewed_by: input.reviewerUserId,
          reviewed_at: new Date().toISOString(),
          rejected_reason: null,
        }
      : {
          status: 'rejected' as const,
          reviewed_by: input.reviewerUserId,
          reviewed_at: new Date().toISOString(),
          rejected_reason: input.rejectedReason?.trim() ?? null,
        };

  const { data: updated, error: updateError } = await admin
    .from('org_control_attestations')
    .update(patch)
    .eq('id', input.attestationId)
    .select()
    .single();

  if (updateError || !updated) {
    throw new Error(
      `updateAttestationReview: ${updateError?.message ?? 'update failed'}`,
    );
  }
  return toAttestationRow(updated as Record<string, unknown>);
}

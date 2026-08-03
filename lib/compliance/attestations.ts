import 'server-only';

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
// org_control_evaluations rows whose `details->evaluator->gap_codes`
// contain `manual_attestation_required` against the latest
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

/**
 * Shape of `org_control_evaluations.details`.
 *
 * evaluate-framework-controls.ts is the only writer that runs the registry
 * evaluators; it persists gap codes as a flat string array under
 * `evaluator.gap_codes` and the control's human-readable code/title as
 * `code`/`title` (`control_key` itself is the internal `control:<uuid>` key).
 * ~1,438 older rows in production instead carry `control_code`/`control_title`,
 * so both spellings are read.
 */
interface EvaluationDetails {
  code?: string;
  title?: string;
  control_code?: string;
  control_title?: string;
  evaluator?: {
    reason?: string | null;
    gap_codes?: string[];
  } | null;
}

function detailsOf(row: Record<string, unknown>): EvaluationDetails {
  return (row.details ?? {}) as EvaluationDetails;
}

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
  // No status filter: `not_evaluated` is an evaluator status, not an engine
  // status, and evaluate-framework-controls.ts deliberately leaves the
  // heuristic status in place when an evaluator returns it — so a control
  // needing attestation can carry any of compliant/at_risk/non_compliant.
  // .eq('organization_id', orgId) appended automatically.
  const { data: evalRows, error: evalError } = await supabase
    .from('org_control_evaluations')
    .select('framework_id, control_key, details')
    .not('control_key', 'is', null);

  if (evalError) {
    throw new Error(
      `listControlsNeedingAttestation: failed to read evaluations: ${evalError.message}`,
    );
  }

  const candidates = ((evalRows ?? []) as Array<Record<string, unknown>>).filter(
    (row) =>
      detailsOf(row).evaluator?.gap_codes?.includes(MANUAL_GAP_CODE) === true,
  );

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

  // org_control_attestations was absent from production until it was backfilled
  // on 2026-08-03 (migration 20260624021 had been recorded in the ledger while
  // the table itself was never created — the known repo-vs-prod divergence).
  // The tolerance is kept for environments still in that state: a missing
  // relation reads as "no attestations yet" and the page renders the
  // "awaiting attestation" bucket, rather than 500ing the moment an evaluator
  // emits a gap code. A genuine query failure still throws.
  const attestationTableMissing =
    attError?.code === '42P01' ||
    attError?.code === 'PGRST205' ||
    /relation .* does not exist|could not find the table/i.test(attError?.message ?? '');

  if (attError && !attestationTableMissing) {
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
    const details = detailsOf(c);
    // The published control code (e.g. "A.5.6") is what the operator and the
    // attestation rows key on; `control_key` is the internal `control:<uuid>`.
    const controlKey =
      details.code ??
      details.control_code ??
      String((c as { control_key: string }).control_key);
    const message = details.evaluator?.reason ?? 'Manual attestation required.';

    return {
      frameworkId,
      frameworkName: frameworkNameById.get(frameworkId) ?? null,
      controlKey,
      controlTitle: details.title ?? details.control_title ?? controlKey,
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
  /**
   * Audit 2026-08-02 — required. The lookup below runs on the service-role
   * client, which bypasses RLS, and previously filtered on the attestation id
   * alone. The caller (reviewAttestation in app/app/actions/
   * compliance-attestations.ts) already held the reviewer's org id and simply
   * did not pass it, so any authenticated user who knew or guessed an
   * attestation UUID could approve or reject another tenant's compliance
   * attestation. Made non-optional so every call site has to supply it.
   */
  organizationId: string;
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
  // Audit 2026-08-02: this ran on the raw admin client filtered by id alone, so
  // any authenticated user who knew an attestation UUID could approve or reject
  // another tenant's compliance attestation. Switched to the org-scoped client
  // — which the rest of this module already uses — rather than hand-writing
  // .eq('organization_id', ...) on each statement: the wrapper stamps the
  // filter structurally, so a future statement added here cannot forget it.
  const supabase = createSupabaseOrgClient(input.organizationId);

  const { data: existing, error: readError } = await supabase
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

  const { data: updated, error: updateError } = await supabase
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

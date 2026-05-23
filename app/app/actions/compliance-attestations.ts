'use server';

import { revalidatePath } from 'next/cache';
import { actionError, actionOk } from '@/lib/actions/safe';
import { getUserOrgMembership } from '@/app/app/actions/rbac';
import { writeAuditLog } from '@/lib/audit/audit-engine';
import {
  insertAttestationClaim,
  listControlsNeedingAttestation,
  updateAttestationReview,
  type AttestationRow,
  type ControlNeedingAttestation,
} from '@/lib/compliance/attestations';
// TODO(audit-sprint-1): import { assertOrgCanWrite, OrgReadOnlyError } from
// '@/lib/billing/enforce-grace-period' once PR #162 merges, and wrap each
// mutator with await assertOrgCanWrite(membership.orgId). The helper
// lives there, not on this branch.

// Audit Sprint 6c (2026-05-23): server actions for the manual-attestation
// workflow. Each mutator:
//   - resolves the caller's org via getUserOrgMembership() (same source
//     of truth the rest of /app uses; bounces unauthenticated/null-org
//     to actionError)
//   - calls assertOrgCanWrite() so the past-due grace-period gate
//     blocks attestations on read-only orgs (Sprint 1 wired this gate)
//   - performs the mutation via lib/compliance/attestations.ts
//   - emits a hash-chained audit_log entry (writeAuditLog)
//   - revalidates the attestations page so the next render reflects
//     the new state

export async function listMyAttestations() {
  const membership = await getUserOrgMembership();
  if (!membership) {
    return actionError(new Error('Unauthorized'));
  }
  try {
    const rows = await listControlsNeedingAttestation(membership.orgId);
    return actionOk<ControlNeedingAttestation[]>(rows);
  } catch (err) {
    return actionError(err);
  }
}

export async function claimAttestation(input: {
  frameworkId: string;
  controlKey: string;
  evidenceId: string;
  notes?: string;
}) {
  const membership = await getUserOrgMembership();
  if (!membership) return actionError(new Error('Unauthorized'));

  try {
    const row = await insertAttestationClaim({
      orgId: membership.orgId,
      frameworkId: input.frameworkId,
      controlKey: input.controlKey,
      evidenceId: input.evidenceId,
      notes: input.notes,
      claimedBy: membership.userId,
    });

    // Hash-chain the action. Non-blocking: if the chain write fails we
    // still want the attestation to land — the chain failure is logged
    // for compliance review.
    try {
      await writeAuditLog(membership.orgId, {
        userId: membership.userId,
        action: 'compliance.attestation.claimed',
        resourceType: 'control_attestation',
        resourceId: row.id,
        details: {
          frameworkId: row.frameworkId,
          controlKey: row.controlKey,
          evidenceId: row.evidenceId,
        },
      });
    } catch (chainErr) {
      console.warn(
        '[compliance-attestations] hash-chain write failed (non-blocking):',
        chainErr instanceof Error ? chainErr.message : String(chainErr),
      );
    }

    revalidatePath('/app/compliance/attestations');
    return actionOk<AttestationRow>(row);
  } catch (err) {
    return actionError(err);
  }
}

export async function reviewAttestation(input: {
  attestationId: string;
  decision: 'approve' | 'reject';
  rejectedReason?: string;
}) {
  const membership = await getUserOrgMembership();
  if (!membership) return actionError(new Error('Unauthorized'));

  try {
    const row = await updateAttestationReview({
      attestationId: input.attestationId,
      reviewerUserId: membership.userId,
      decision: input.decision,
      rejectedReason: input.rejectedReason,
    });

    try {
      await writeAuditLog(membership.orgId, {
        userId: membership.userId,
        action:
          input.decision === 'approve'
            ? 'compliance.attestation.approved'
            : 'compliance.attestation.rejected',
        resourceType: 'control_attestation',
        resourceId: row.id,
        details: {
          frameworkId: row.frameworkId,
          controlKey: row.controlKey,
          decision: input.decision,
          rejectedReason: row.rejectedReason ?? undefined,
        },
      });
    } catch (chainErr) {
      console.warn(
        '[compliance-attestations] hash-chain write failed (non-blocking):',
        chainErr instanceof Error ? chainErr.message : String(chainErr),
      );
    }

    revalidatePath('/app/compliance/attestations');
    return actionOk<AttestationRow>(row);
  } catch (err) {
    return actionError(err);
  }
}

/**
 * NIST CSF PR-2 — Data protection applied.
 *
 * Signal: presence of retention_policies (encryption is enforced
 * at the platform layer and not exposed as a per-tenant flag — we
 * report partial when policies exist but cannot prove encryption,
 * and fail when no retention is documented at all).
 */

import type {
  ControlEvaluator,
  ControlResult,
  EvidenceRef,
} from '../types';
import {
  EVIDENCE_CAP,
  makeAutomatedEvaluator,
  notEvaluated,
  round2,
} from './_shared';

const CODE = 'PR-2';

type RetentionRow = { id: string; resource_type: string | null; updated_at: string | null };

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('retention_policies')
    .select('id, resource_type, updated_at')
    .eq('org_id', orgId)
    .limit(200);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'retention_policies_unavailable',
      `Could not read retention_policies: ${error.message}`,
    );
  }

  const policies = (data ?? []) as RetentionRow[];

  if (policies.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_retention_policies',
          message:
            'No retention policies — PR-2 requires documented data retention as part of data protection.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: 'retention_policies empty.',
      evaluatedAt,
    };
  }

  const evidenceRefs: EvidenceRef[] = policies.slice(0, EVIDENCE_CAP).map((p) => ({
    source: 'retention_policies',
    ref: p.id,
    capturedAt: p.updated_at ?? undefined,
  }));

  // Encryption cannot be proven from a per-tenant row today — leave a
  // partial result so the UI prompts for the attestation rather than
  // declaring a full pass on retention alone.
  const status: ControlResult['status'] = 'partial';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps: [
      {
        code: 'encryption_coverage_not_provable',
        message:
          'retention_policies are documented but per-tenant encryption coverage is not exposed as a row — attest encryption-at-rest/in-transit separately.',
        severity: 'medium',
      },
    ],
    confidence: round2(0.5 + 0.3 * Math.min(1, policies.length / 5)),
    reason: `${policies.length} retention polic(ies); encryption coverage is an infrastructure-layer attestation.`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };

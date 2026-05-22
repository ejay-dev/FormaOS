/**
 * SOC2-TSC CC1.4 — "Demonstrates commitment to competence"
 *
 * Partial signal: `org_credentials` tracks staff certifications and
 * `org_staff_credentials` exists in some deployments. We probe
 * org_credentials for completion / expiry to provide context, but the
 * criterion (training program, role-fit) is ultimately attested.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, manualAttestation } from './_shared';

const CODE = 'CC1.4';

type CredentialRow = {
  id: string;
  user_id: string;
  document_type: string | null;
  expiry_date: string | null;
  verification_status: string | null;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_credentials')
    .select('id, user_id, document_type, expiry_date, verification_status, created_at')
    .eq('organization_id', orgId)
    .limit(500);

  if (error) {
    return manualAttestation(
      CODE,
      evaluatedAt,
      `CC1.4 requires attestation by a compliance officer — could not probe org_credentials for supporting context (${error.message}).`,
    );
  }

  const rows = (data ?? []) as CredentialRow[];
  const verified = rows.filter(
    (r) => (r.verification_status || '').toLowerCase() === 'verified',
  );

  const evidence: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_credentials',
    ref: r.id,
    capturedAt: r.created_at ?? undefined,
  }));

  const attestation = manualAttestation(
    CODE,
    evaluatedAt,
    `CC1.4 requires attestation by a compliance officer — ${verified.length}/${rows.length} credentials are verified, but training-program completeness must be human-attested.`,
  );
  return { ...attestation, evidenceRefs: evidence };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

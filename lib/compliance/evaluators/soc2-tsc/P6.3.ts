/**
 * SOC2-TSC P6.3 — "Maintains records of disclosures"
 *
 * Partial signal: `org_incidents` rows whose description references
 * unauthorized disclosure can be cross-referenced with
 * `org_regulatory_notifications` to show the record is being kept.
 * Without an explicit "unauthorized disclosure" classifier, we keep
 * this attested and provide supporting context where available.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, manualAttestation } from './_shared';

const CODE = 'P6.3';
const DISCLOSURE_PATTERN = /disclosure|leak|breach|unauthorized access|data loss/i;

type IncidentRow = {
  id: string;
  description: string | null;
  incident_type: string | null;
  status: string | null;
  occurred_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_incidents')
    .select('id, description, incident_type, status, occurred_at')
    .eq('organization_id', orgId)
    .limit(500);

  if (error) {
    return manualAttestation(
      CODE,
      evaluatedAt,
      `P6.3 requires attestation by a compliance officer — could not probe org_incidents for supporting context (${error.message}).`,
    );
  }

  const rows = (data ?? []) as IncidentRow[];
  const disclosures = rows.filter(
    (i) =>
      DISCLOSURE_PATTERN.test(i.description ?? '') ||
      DISCLOSURE_PATTERN.test(i.incident_type ?? ''),
  );

  const evidence: EvidenceRef[] = disclosures.slice(0, EVIDENCE_CAP).map((i) => ({
    source: 'org_incidents',
    ref: i.id,
    capturedAt: i.occurred_at ?? undefined,
  }));

  const attestation = manualAttestation(
    CODE,
    evaluatedAt,
    `P6.3 requires attestation by a compliance officer — ${disclosures.length} disclosure-flavoured incident(s) on record, but completeness of the unauthorized-disclosure log must be human-verified.`,
  );
  return { ...attestation, evidenceRefs: evidence };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

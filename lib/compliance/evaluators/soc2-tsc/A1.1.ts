/**
 * SOC2-TSC A1.1 — "Maintains availability commitments"
 *
 * No automated signal: capacity metrics + uptime SLAs require an
 * observability source (Datadog/Grafana/Statuspage) that is not part
 * of the FormaOS schema. We probe `compliance_scans` for an
 * availability-flavoured scan as supporting context but defer the
 * capacity-vs-commitment judgement to a human reviewer.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, manualAttestation } from './_shared';

const CODE = 'A1.1';
const AVAILABILITY_PATTERN = /availab|uptim|capacity|sla|reliability/i;

type ScanRow = { id: string; scan_type: string | null; completed_at: string | null };

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('compliance_scans')
    .select('id, scan_type, completed_at')
    .eq('organization_id', orgId)
    .order('completed_at', { ascending: false })
    .limit(200);

  if (error) {
    return manualAttestation(
      CODE,
      evaluatedAt,
      `A1.1 requires attestation by a compliance officer — could not probe compliance_scans for supporting context (${error.message}).`,
    );
  }

  const scans = ((data ?? []) as ScanRow[]).filter((s) =>
    AVAILABILITY_PATTERN.test(s.scan_type ?? ''),
  );

  const evidence: EvidenceRef[] = scans.slice(0, EVIDENCE_CAP).map((s) => ({
    source: 'compliance_scans',
    ref: s.id,
    capturedAt: s.completed_at ?? undefined,
  }));

  const attestation = manualAttestation(
    CODE,
    evaluatedAt,
    `A1.1 requires attestation by a compliance officer — ${scans.length} availability-flavoured scan(s) on record, but capacity-vs-commitment validation needs an observability source not present in the FormaOS schema.`,
  );
  return { ...attestation, evidenceRefs: evidence };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

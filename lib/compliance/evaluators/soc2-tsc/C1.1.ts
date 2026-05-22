/**
 * SOC2-TSC C1.1 — "Identifies confidential information"
 *
 * Signal: `org_assets` rows carry `criticality` + `contains_phi` +
 * encryption flags which together evidence a data-classification
 * scheme. Pass requires every asset to have a non-null criticality;
 * partial if classification is sparse; fail if no assets at all.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, notEvaluated, round2 } from './_shared';

const CODE = 'C1.1';

type AssetRow = {
  id: string;
  name: string | null;
  type: string | null;
  criticality: string | null;
  contains_phi: boolean | null;
  encrypted_at_rest: boolean | null;
  encrypted_in_transit: boolean | null;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_assets')
    .select(
      'id, name, type, criticality, contains_phi, encrypted_at_rest, encrypted_in_transit, created_at',
    )
    .eq('organization_id', orgId)
    .limit(2000);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_assets_unavailable',
      `Could not read org_assets: ${error.message}`,
    );
  }

  const rows = (data ?? []) as AssetRow[];

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_assets_registered',
          message:
            'org_assets is empty — confidential data has not been inventoried or classified.',
          severity: 'high',
        },
      ],
      confidence: 0.8,
      reason: 'No assets registered for this organization.',
      evaluatedAt,
    };
  }

  const classified = rows.filter(
    (a) => !!a.criticality && a.criticality.trim().length > 0,
  );
  const classificationRate = classified.length / rows.length;

  const gaps: ControlGap[] = [];
  if (classificationRate < 0.9) {
    gaps.push({
      code: 'unclassified_assets',
      message: `${rows.length - classified.length}/${rows.length} asset(s) lack a criticality classification.`,
      severity: classificationRate < 0.5 ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = classified.slice(0, EVIDENCE_CAP).map((a) => ({
    source: 'org_assets',
    ref: a.id,
    capturedAt: a.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (classificationRate >= 0.9) status = 'pass';
  else if (classificationRate >= 0.5) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / 10)),
    reason: `${classified.length}/${rows.length} asset(s) classified (${Math.round(classificationRate * 100)}%).`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

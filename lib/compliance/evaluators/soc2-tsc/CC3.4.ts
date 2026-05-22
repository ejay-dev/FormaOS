/**
 * SOC2-TSC CC3.4 — "Identifies and analyses significant change"
 *
 * Signal: `org_risks` rows updated within the 180-day review cadence
 * (the pack frequency). A continuously-reviewed risk register
 * demonstrates that changes are being assessed. Fail if no risks
 * exist; partial if the register exists but hasn't been touched in
 * the window.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, daysSince, notEvaluated, round2 } from './_shared';

const CODE = 'CC3.4';
const REVIEW_WINDOW_DAYS = 180;

type RiskRow = {
  id: string;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_risks')
    .select('id, status, updated_at, created_at')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_risks_unavailable',
      `Could not read org_risks: ${error.message}`,
    );
  }

  const rows = (data ?? []) as RiskRow[];

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_risk_register',
          message:
            'No org_risks entries — significant changes are not being analysed against a risk register.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: 'Empty risk register; cannot demonstrate change-impact analysis.',
      evaluatedAt,
    };
  }

  const recentlyUpdated = rows.filter((r) => {
    const since = daysSince(r.updated_at ?? r.created_at);
    return since != null && since <= REVIEW_WINDOW_DAYS;
  });
  const recentRate = recentlyUpdated.length / rows.length;

  const gaps: ControlGap[] = [];
  if (recentRate < 0.5) {
    gaps.push({
      code: 'stagnant_risk_register',
      message: `${rows.length - recentlyUpdated.length}/${rows.length} risk(s) have not been touched in ${REVIEW_WINDOW_DAYS} days — change-impact reviews appear to have stalled.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = recentlyUpdated.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_risks',
    ref: r.id,
    capturedAt: r.updated_at ?? r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (recentRate >= 0.5 && recentlyUpdated.length >= 1) status = 'pass';
  else if (recentlyUpdated.length >= 1) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / 5)),
    reason: `${recentlyUpdated.length}/${rows.length} risk(s) updated within ${REVIEW_WINDOW_DAYS}d.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

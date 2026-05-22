/**
 * NIST CSF ID-3 — Risk assessment performed.
 *
 * Signal: org_risks register with likelihood + impact scoring,
 * touched in the last 180 days (pack cadence). Mirrors SOC2-TSC CC3.2.
 */

import type {
  ControlEvaluator,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import {
  EVIDENCE_CAP,
  daysSince,
  makeAutomatedEvaluator,
  notEvaluated,
  round2,
} from './_shared';

const CODE = 'ID-3';
const REVIEW_WINDOW_DAYS = 180;

type RiskRow = {
  id: string;
  title: string | null;
  likelihood: number | null;
  impact: number | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_risks')
    .select('id, title, likelihood, impact, status, updated_at, created_at')
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
            'org_risks is empty — ID-3 requires a documented risk register with scoring.',
          severity: 'high',
        },
      ],
      confidence: 0.85,
      reason: 'No risks recorded.',
      evaluatedAt,
    };
  }

  const scored = rows.filter(
    (r) =>
      typeof r.likelihood === 'number' &&
      typeof r.impact === 'number' &&
      r.likelihood > 0 &&
      r.impact > 0,
  );
  const scoredRate = scored.length / rows.length;

  const newest = rows
    .map((r) => r.updated_at || r.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceReview = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (scoredRate < 0.9) {
    gaps.push({
      code: 'unscored_risks',
      message: `${rows.length - scored.length}/${rows.length} risks missing likelihood or impact.`,
      severity: 'high',
    });
  }
  if (sinceReview != null && sinceReview > REVIEW_WINDOW_DAYS) {
    gaps.push({
      code: 'risk_register_stale',
      message: `Last update ${sinceReview}d ago — exceeds the ${REVIEW_WINDOW_DAYS}d cadence.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_risks',
    ref: r.id,
    capturedAt: r.updated_at ?? r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (scoredRate >= 0.9 && (sinceReview == null || sinceReview <= REVIEW_WINDOW_DAYS))
    status = 'pass';
  else if (scoredRate >= 0.6) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / 5)),
    reason: `${rows.length} risk(s); ${scored.length} scored; last update ${sinceReview ?? '?'}d ago.`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };

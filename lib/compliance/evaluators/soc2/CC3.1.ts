import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 50;
const FRESH_WINDOW_DAYS = 180;

type Risk = {
  id: string;
  status: string | null;
  likelihood: number | null;
  impact: number | null;
  risk_score: number | null;
  updated_at: string | null;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_risks')
    .select('id, status, likelihood, impact, risk_score, updated_at, created_at')
    .eq('organization_id', orgId);

  if (error) {
    // Either the table is missing or RLS denied. Surface as not_evaluated
    // with the original message so the operator can disambiguate.
    return notEvaluated(
      evaluatedAt,
      'org_risks_unavailable',
      `Could not read org_risks: ${error.message}`,
    );
  }

  const risks = (data ?? []) as Risk[];
  if (risks.length === 0) {
    return {
      controlCode: 'CC3.1',
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'empty_risk_register',
          message:
            'org_risks contains no rows; risk identification is a SOC 2 prerequisite.',
          severity: 'high',
        },
      ],
      confidence: 1,
      reason: 'Risk register is empty.',
      evaluatedAt,
    };
  }

  const cutoff = Date.now() - FRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const scored = risks.filter(
    (r) =>
      r.likelihood !== null &&
      r.impact !== null &&
      (r.risk_score !== null || r.likelihood !== null),
  );
  const recent = risks.filter((r) => {
    const ts = r.updated_at ?? r.created_at;
    return ts && new Date(ts).getTime() >= cutoff;
  });

  const gaps: ControlGap[] = [];
  if (scored.length === 0) {
    gaps.push({
      code: 'risks_unscored',
      message:
        'No risks carry both likelihood and impact scores; the register is unusable for prioritisation.',
      severity: 'high',
    });
  } else if (scored.length < risks.length) {
    gaps.push({
      code: 'partial_risk_scoring',
      message: `${risks.length - scored.length} risk(s) are missing likelihood or impact scoring.`,
      severity: 'medium',
    });
  }
  if (recent.length === 0) {
    gaps.push({
      code: 'stale_risk_register',
      message: `No risk has been created or updated in the last ${FRESH_WINDOW_DAYS} days.`,
      severity: 'high',
    });
  }

  let status: ControlResult['status'];
  let reason: string;
  if (scored.length > 0 && recent.length > 0 && scored.length === risks.length) {
    status = 'pass';
    reason = `${risks.length} risk(s) on register; all scored, ${recent.length} updated within ${FRESH_WINDOW_DAYS} days.`;
  } else if (scored.length > 0 && recent.length > 0) {
    status = 'partial';
    reason = `Risk register is active but incomplete (${scored.length}/${risks.length} scored, ${recent.length} fresh).`;
  } else {
    status = 'fail';
    reason = `Risk register is present but ${scored.length === 0 ? 'unscored' : 'stale'}.`;
  }

  const evidenceRefs: EvidenceRef[] = risks
    .slice(0, EVIDENCE_CAP)
    .map((r) => ({
      source: 'org_risks',
      ref: r.id,
      capturedAt: r.updated_at ?? r.created_at ?? undefined,
    }));

  return {
    controlCode: 'CC3.1',
    status,
    evidenceRefs,
    gaps,
    confidence: 1,
    reason,
    evaluatedAt,
  };
};

function notEvaluated(
  evaluatedAt: string,
  code: string,
  message: string,
): ControlResult {
  return {
    controlCode: 'CC3.1',
    status: 'not_evaluated',
    evidenceRefs: [],
    gaps: [{ code, message, severity: 'medium' }],
    confidence: 0,
    reason: message,
    evaluatedAt,
  };
}

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2',
  controlCode: 'CC3.1',
  evaluator: evaluate,
};

export { evaluate };

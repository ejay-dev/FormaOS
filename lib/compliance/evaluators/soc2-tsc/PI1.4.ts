/**
 * SOC2-TSC PI1.4 — "Stores data completely and accurately"
 *
 * Partial signal: `org_workflow_executions` rows carry a `status` and
 * `error_message`. A healthy processing pipeline keeps error rates
 * low. Pass requires ≥95% non-error runs over the last 180 days.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, notEvaluated, round2 } from './_shared';

const CODE = 'PI1.4';
const LOOKBACK_DAYS = 180;

type ExecutionRow = {
  id: string;
  status: string | null;
  error_message: string | null;
  executed_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();
  const windowStart = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await db
    .from('org_workflow_executions')
    .select('id, status, error_message, executed_at')
    .eq('organization_id', orgId)
    .gte('executed_at', windowStart)
    .order('executed_at', { ascending: false })
    .limit(2000);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_workflow_executions_unavailable',
      `Could not read org_workflow_executions: ${error.message}`,
    );
  }

  const rows = (data ?? []) as ExecutionRow[];

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'partial',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_workflow_executions',
          message: `No workflow executions in ${LOOKBACK_DAYS}d — cannot evaluate processing-completeness signal.`,
          severity: 'low',
        },
      ],
      confidence: 0.4,
      reason: 'No pipeline activity in window; treat as partial pending audit.',
      evaluatedAt,
    };
  }

  const failed = rows.filter(
    (r) => (r.status || '').toLowerCase() === 'failed' || !!r.error_message,
  );
  const successRate = 1 - failed.length / rows.length;

  const gaps: ControlGap[] = [];
  if (successRate < 0.95) {
    gaps.push({
      code: 'pipeline_errors',
      message: `${failed.length}/${rows.length} workflow execution(s) failed in ${LOOKBACK_DAYS}d (${Math.round((1 - successRate) * 100)}% error rate).`,
      severity: successRate < 0.8 ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_workflow_executions',
    ref: r.id,
    capturedAt: r.executed_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (successRate >= 0.95) status = 'pass';
  else if (successRate >= 0.8) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / 20)),
    reason: `${rows.length - failed.length}/${rows.length} execution(s) succeeded in ${LOOKBACK_DAYS}d.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

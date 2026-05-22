/**
 * SOC2-TSC P4.2 — "Retains information for limited time"
 *
 * Signal: `retention_policies` defined per data category. Pass when at
 * least one active retention_policy exists; fail when none.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, notEvaluated, round2 } from './_shared';

const CODE = 'P4.2';

type RetentionRow = {
  id: string;
  name: string | null;
  document_category: string | null;
  is_active: boolean | null;
  updated_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('retention_policies')
    .select('id, name, document_category, is_active, updated_at')
    .eq('org_id', orgId)
    .limit(500);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'retention_policies_unavailable',
      `Could not read retention_policies: ${error.message}`,
    );
  }

  const rows = (data ?? []) as RetentionRow[];

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_retention_policies',
          message:
            'retention_policies is empty — personal information retention is not bounded.',
          severity: 'high',
        },
      ],
      confidence: 0.8,
      reason: 'No retention policies recorded for this organization.',
      evaluatedAt,
    };
  }

  const active = rows.filter((r) => r.is_active !== false);
  const gaps: ControlGap[] = [];
  if (active.length === 0) {
    gaps.push({
      code: 'no_active_retention',
      message: `${rows.length} retention polic(ies) exist but none are flagged active.`,
      severity: 'high',
    });
  }

  const evidenceRefs: EvidenceRef[] = active.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'retention_policies',
    ref: r.id,
    capturedAt: r.updated_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (active.length >= 1) status = 'pass';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, active.length / 3)),
    reason: `${active.length} active retention polic(ies) of ${rows.length} total.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

/**
 * ISO/IEC 27001:2022 A.8.15 — "Logging"
 *
 * Signal: org_audit_logs volume in the last 7 days as proxy for a
 * functioning log pipeline. Pass when ≥10 entries; partial when
 * 1–9; fail when 0.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import {
  EVIDENCE_CAP,
  FRAMEWORK,
  daysSince,
  notEvaluated,
  round2,
} from './_shared';

const CODE = 'A.8.15';
const LOOKBACK_DAYS = 7;
const HEALTHY_VOLUME = 10;

type AuditRow = {
  id: string;
  action: string | null;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();
  const windowStart = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await db
    .from('org_audit_logs')
    .select('id, action, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_audit_logs_unavailable',
      `Could not read org_audit_logs: ${error.message}`,
    );
  }

  const rows = (data ?? []) as AuditRow[];
  const sinceLatest = daysSince(rows[0]?.created_at);

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_log_pipeline',
          message: `No org_audit_logs entries in the last ${LOOKBACK_DAYS}d — log pipeline appears inactive.`,
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: 'No audit-log entries in lookback window.',
      evaluatedAt,
    };
  }

  const gaps: ControlGap[] = [];
  if (rows.length < HEALTHY_VOLUME) {
    gaps.push({
      code: 'low_log_volume',
      message: `Only ${rows.length} audit row(s) in ${LOOKBACK_DAYS}d — verify log pipeline coverage.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_audit_logs',
    ref: r.id,
    capturedAt: r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (rows.length >= HEALTHY_VOLUME) status = 'pass';
  else status = 'partial';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / HEALTHY_VOLUME)),
    reason: `${rows.length} audit row(s) in ${LOOKBACK_DAYS}d; latest ${sinceLatest ?? '?'}d ago.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

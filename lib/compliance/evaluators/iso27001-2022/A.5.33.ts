/**
 * ISO/IEC 27001:2022 A.5.33 — "Protection of records"
 *
 * Signal: org_audit_logs activity in the last 30 days as a proxy for
 * "audit logs are being captured and retained". Genuine record-
 * protection requires retention-policy attestation, so this evaluator
 * returns `partial` even when activity is present until a
 * retention_policies / retention_executions check is wired in.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  EvidenceRef,
} from '../types';
import {
  EVIDENCE_CAP,
  FRAMEWORK,
  daysSince,
  notEvaluated,
  round2,
} from './_shared';

const CODE = 'A.5.33';
const LOOKBACK_DAYS = 30;

type AuditRow = {
  id: string;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();
  const windowStart = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await db
    .from('org_audit_logs')
    .select('id, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_audit_logs_unavailable',
      `Could not read org_audit_logs: ${error.message}`,
    );
  }

  const rows = (data ?? []) as AuditRow[];

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_audit_activity',
          message: `No org_audit_logs entries in the last ${LOOKBACK_DAYS} days — records protection cannot be evidenced.`,
          severity: 'high',
        },
      ],
      confidence: 0.6,
      reason: 'No audit-log entries in lookback window.',
      evaluatedAt,
    };
  }

  const sinceLatest = daysSince(rows[0]?.created_at);

  const gaps: ControlGap[] = [
    {
      code: 'retention_policy_attestation_pending',
      message: 'A.5.33 also requires a documented retention schedule and integrity attestation — automated retention signal not yet wired.',
      severity: 'low',
    },
  ];

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_audit_logs',
    ref: r.id,
    capturedAt: r.created_at ?? undefined,
  }));

  return {
    controlCode: CODE,
    status: 'partial',
    evidenceRefs,
    gaps,
    confidence: round2(0.5 + 0.3 * Math.min(1, rows.length / 50)),
    reason: `${rows.length} audit row(s) in ${LOOKBACK_DAYS}d; latest ${sinceLatest ?? '?'}d ago. Retention attestation pending.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

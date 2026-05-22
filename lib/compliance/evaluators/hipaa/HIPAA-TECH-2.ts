/**
 * HIPAA-TECH-2 — Audit controls.
 *
 * Signal: org_audit_logs volume + freshness in the last 60 days
 * (pack cadence). Pass requires ≥10 entries with the most recent
 * within 7 days; partial when sparse.
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

const CODE = 'HIPAA-TECH-2';
const LOOKBACK_DAYS = 60;
const RECENT_DAYS = 7;
const MIN_VOLUME = 10;

type AuditRow = { id: string; action: string | null; created_at: string | null };

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

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_audit_logs',
          message: `No audit entries in ${LOOKBACK_DAYS}d — HIPAA § 164.312(b) requires audit controls on ePHI access.`,
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: 'Empty org_audit_logs window.',
      evaluatedAt,
    };
  }

  const newest = rows
    .map((r) => r.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceLatest = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (rows.length < MIN_VOLUME) {
    gaps.push({
      code: 'low_audit_volume',
      message: `Only ${rows.length} audit entries in ${LOOKBACK_DAYS}d — verify logging covers all ePHI access.`,
      severity: 'medium',
    });
  }
  if (sinceLatest != null && sinceLatest > RECENT_DAYS) {
    gaps.push({
      code: 'audit_log_stale',
      message: `Most recent audit entry was ${sinceLatest}d ago — log pipeline may be broken.`,
      severity: 'high',
    });
  }

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_audit_logs',
    ref: r.id,
    capturedAt: r.created_at ?? undefined,
  }));

  const fresh = sinceLatest != null && sinceLatest <= RECENT_DAYS;
  let status: ControlResult['status'];
  if (rows.length >= MIN_VOLUME && fresh) status = 'pass';
  else if (rows.length >= 1) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / 50)),
    reason: `${rows.length} audit entries in ${LOOKBACK_DAYS}d; latest ${sinceLatest ?? '?'}d ago.`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };

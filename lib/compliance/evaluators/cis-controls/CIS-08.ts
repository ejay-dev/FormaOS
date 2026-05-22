/**
 * CIS-08 — Audit log management.
 *
 * Signal: volume + freshness of org_audit_logs entries in the last
 * 30 days (pack cadence). Pass requires ≥10 entries with the most
 * recent within 7 days; partial when sparse or recent-but-low-volume;
 * fail when no audit traffic at all.
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

const CODE = 'CIS-08';
const LOOKBACK_DAYS = 30;
const RECENT_DAYS = 7;
const MIN_VOLUME = 10;

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

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_audit_logs',
          message: `No org_audit_logs entries in the last ${LOOKBACK_DAYS} days — CIS-08 requires active log collection.`,
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
      message: `Only ${rows.length} audit entries in ${LOOKBACK_DAYS}d — below the ${MIN_VOLUME}-event volume threshold.`,
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

  let status: ControlResult['status'];
  const fresh = sinceLatest != null && sinceLatest <= RECENT_DAYS;
  if (rows.length >= MIN_VOLUME && fresh) status = 'pass';
  else if (rows.length >= 1 && fresh) status = 'partial';
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

/**
 * NIST CSF DE-2 — Anomaly detection.
 *
 * Signal: security_alerts (or security_events) activity in the last
 * 60 days (pack cadence). Presence of any alerts/events demonstrates
 * the detection pipeline is operating; absence may mean the pipeline
 * is broken or never deployed.
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

const CODE = 'DE-2';
const LOOKBACK_DAYS = 60;
const STALE_DAYS = 180;

type EventRow = { id: string; severity: string | null; created_at: string | null };

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();
  const windowStart = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await db
    .from('security_events')
    .select('id, severity, created_at')
    .eq('org_id', orgId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'security_events_unavailable',
      `Could not read security_events: ${error.message}`,
    );
  }

  const rows = (data ?? []) as EventRow[];

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_security_events',
          message: `No security_events in the last ${LOOKBACK_DAYS}d — DE-2 requires an active anomaly-detection pipeline.`,
          severity: 'high',
        },
      ],
      confidence: 0.65,
      reason: 'security_events is empty in window.',
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
  if (sinceLatest != null && sinceLatest > LOOKBACK_DAYS) {
    gaps.push({
      code: 'detection_stale',
      message: `Most recent security event was ${sinceLatest}d ago — exceeds the ${LOOKBACK_DAYS}d cadence.`,
      severity: sinceLatest > STALE_DAYS ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'security_events',
    ref: r.id,
    capturedAt: r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (sinceLatest != null && sinceLatest <= LOOKBACK_DAYS) status = 'pass';
  else if (sinceLatest != null && sinceLatest <= STALE_DAYS) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / 10)),
    reason: `${rows.length} security event(s) in ${LOOKBACK_DAYS}d; latest ${sinceLatest ?? '?'}d ago.`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 50;
const LOOKBACK_DAYS = 90;
const MAX_GAP_DAYS = 7;
const MIN_EVENTS_PASS = LOOKBACK_DAYS; // ≈1/day average

type SecurityEvent = { id: string; created_at: string };

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function findLongestZeroGap(
  events: SecurityEvent[],
  windowStart: Date,
  windowEnd: Date,
): number {
  const days = new Set(events.map((e) => dayKey(e.created_at)));
  let longest = 0;
  let current = 0;
  for (
    let d = new Date(windowStart);
    d <= windowEnd;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const key = d.toISOString().slice(0, 10);
    if (!days.has(key)) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }
  return longest;
}

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();
  const windowEnd = new Date();
  const windowStart = new Date(
    windowEnd.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  );

  const { data, error } = await db
    .from('security_events')
    .select('id, created_at')
    .eq('org_id', orgId)
    .gte('created_at', windowStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) {
    return notEvaluated(
      evaluatedAt,
      'security_events_unavailable',
      `Could not read security_events: ${error.message}`,
    );
  }

  const events = (data ?? []) as SecurityEvent[];

  if (events.length === 0) {
    return notEvaluated(
      evaluatedAt,
      'no_security_events',
      `No security_events in the last ${LOOKBACK_DAYS} days; configuration-change detection cannot be confirmed.`,
    );
  }

  const longestGap = findLongestZeroGap(events, windowStart, windowEnd);
  const gaps: ControlGap[] = [];

  let status: ControlResult['status'];
  let reason: string;

  if (events.length >= MIN_EVENTS_PASS && longestGap <= MAX_GAP_DAYS) {
    status = 'pass';
    reason = `${events.length} security events in ${LOOKBACK_DAYS}d; longest zero-event gap ${longestGap}d.`;
  } else if (events.length >= MIN_EVENTS_PASS / 3 && longestGap <= MAX_GAP_DAYS * 2) {
    status = 'partial';
    reason = `${events.length} security events in ${LOOKBACK_DAYS}d; longest zero-event gap ${longestGap}d.`;
    if (events.length < MIN_EVENTS_PASS) {
      gaps.push({
        code: 'low_event_volume',
        message: `Average <1 event/day suggests detection coverage is limited.`,
        severity: 'medium',
      });
    }
    if (longestGap > MAX_GAP_DAYS) {
      gaps.push({
        code: 'monitoring_silence_gap',
        message: `Detected a ${longestGap}-day window with zero security events — monitoring may have been offline.`,
        severity: 'medium',
      });
    }
  } else {
    status = 'fail';
    reason = `Only ${events.length} security events in ${LOOKBACK_DAYS}d; longest gap ${longestGap}d.`;
    gaps.push({
      code: 'insufficient_monitoring',
      message: `Event volume and/or coverage is too low for production monitoring.`,
      severity: 'high',
    });
  }

  const evidenceRefs: EvidenceRef[] = events
    .slice(0, EVIDENCE_CAP)
    .map((e) => ({
      source: 'security_events',
      ref: e.id,
      capturedAt: e.created_at,
    }));

  return {
    controlCode: 'CC7.1',
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, events.length / MIN_EVENTS_PASS)),
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
    controlCode: 'CC7.1',
    status: 'not_evaluated',
    evidenceRefs: [],
    gaps: [{ code, message, severity: 'medium' }],
    confidence: 0,
    reason: message,
    evaluatedAt,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2',
  controlCode: 'CC7.1',
  evaluator: evaluate,
};

export { evaluate };

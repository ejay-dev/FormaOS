/**
 * CIS-17 — Incident response management.
 *
 * Signal: org_incidents cadence in the last 180 days (pack window)
 * plus presence of resolved + open incident workflow. Pass when
 * incidents are being recorded AND most are reaching a terminal
 * status. Fail when no incidents in window (program inactive or
 * monitoring blind).
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

const CODE = 'CIS-17';
const LOOKBACK_DAYS = 180;
const STALE_DAYS = 365;

type IncidentRow = {
  id: string;
  status: string | null;
  severity: string | null;
  type: string | null;
  created_at: string | null;
  resolved_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();
  const windowStart = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await db
    .from('org_incidents')
    .select('id, status, severity, type, created_at, resolved_at')
    .eq('organization_id', orgId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_incidents_unavailable',
      `Could not read org_incidents: ${error.message}`,
    );
  }

  const rows = (data ?? []) as IncidentRow[];

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_incidents',
          message: `No org_incidents recorded in the last ${LOOKBACK_DAYS}d — CIS-17 requires an active incident response program (or proof of detection coverage).`,
          severity: 'high',
        },
      ],
      confidence: 0.6,
      reason: 'Empty incidents window.',
      evaluatedAt,
    };
  }

  const resolved = rows.filter(
    (r) => !!r.resolved_at || ['resolved', 'closed'].includes((r.status ?? '').toLowerCase()),
  );
  const resolutionRate = resolved.length / rows.length;
  const newest = rows
    .map((r) => r.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceLatest = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (resolutionRate < 0.5) {
    gaps.push({
      code: 'low_resolution_rate',
      message: `${rows.length - resolved.length}/${rows.length} incidents remain open — incident response is not closing the loop.`,
      severity: 'high',
    });
  }
  if (sinceLatest != null && sinceLatest > STALE_DAYS) {
    gaps.push({
      code: 'incidents_stale',
      message: `Most recent incident was ${sinceLatest}d ago — verify detection is still operating.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_incidents',
    ref: r.id,
    capturedAt: r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (resolutionRate >= 0.7) status = 'pass';
  else if (resolutionRate >= 0.3) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / 5)),
    reason: `${rows.length} incident(s) in ${LOOKBACK_DAYS}d; ${resolved.length} resolved.`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };

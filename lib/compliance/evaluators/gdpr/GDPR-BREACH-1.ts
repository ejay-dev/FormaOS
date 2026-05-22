/**
 * GDPR-BREACH-1 — Breach detection and triage.
 *
 * Signal: org_incidents activity in the last 90 days (pack cadence)
 * — proves breach detection is operating. Empty incident window
 * may also mean monitoring is blind, so we report fail with a high
 * severity to invite review.
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

const CODE = 'GDPR-BREACH-1';
const LOOKBACK_DAYS = 90;
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
  const inWindow = rows.filter((r) => r.created_at && r.created_at >= windowStart);

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_incidents',
          message:
            'No org_incidents recorded — GDPR-BREACH-1 needs evidence the detection pipeline is operating or that incidents are documented when they occur.',
          severity: 'high',
        },
      ],
      confidence: 0.6,
      reason: 'org_incidents is empty for this organization.',
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
  if (sinceLatest != null && sinceLatest > STALE_DAYS) {
    gaps.push({
      code: 'no_recent_incident_activity',
      message: `Most recent incident was ${sinceLatest}d ago — confirm detection coverage hasn't lapsed.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_incidents',
    ref: r.id,
    capturedAt: r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (inWindow.length >= 1) status = 'pass';
  else if (sinceLatest != null && sinceLatest <= STALE_DAYS) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.55 + 0.35 * Math.min(1, rows.length / 5)),
    reason: `${rows.length} incident(s) on record; ${inWindow.length} in last ${LOOKBACK_DAYS}d.`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };

/**
 * NIST CSF DE-1 — Continuous monitoring.
 *
 * Signal: compliance_scans cadence in the last 30 days (pack window).
 * Pass when scans are happening regularly across any scan_type.
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

const CODE = 'DE-1';
const RECENT_DAYS = 30;
const STALE_DAYS = 90;

type ScanRow = { id: string; scan_type: string | null; completed_at: string | null; created_at: string | null };

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('compliance_scans')
    .select('id, scan_type, completed_at, created_at')
    .eq('organization_id', orgId)
    .order('completed_at', { ascending: false })
    .limit(200);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'compliance_scans_unavailable',
      `Could not read compliance_scans: ${error.message}`,
    );
  }

  const rows = (data ?? []) as ScanRow[];

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_scans',
          message: 'No compliance_scans recorded — DE-1 requires continuous monitoring activity.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: 'compliance_scans is empty.',
      evaluatedAt,
    };
  }

  const newest = rows
    .map((r) => r.completed_at || r.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceLast = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (sinceLast != null && sinceLast > RECENT_DAYS) {
    gaps.push({
      code: 'monitoring_stale',
      message: `Most recent scan was ${sinceLast}d ago — exceeds the ${RECENT_DAYS}-day cadence.`,
      severity: sinceLast > STALE_DAYS ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'compliance_scans',
    ref: r.id,
    capturedAt: r.completed_at ?? r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (sinceLast == null) status = 'partial';
  else if (sinceLast <= RECENT_DAYS) status = 'pass';
  else if (sinceLast <= STALE_DAYS) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / 10)),
    reason: `${rows.length} scan(s); latest ${sinceLast ?? '?'}d ago.`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };

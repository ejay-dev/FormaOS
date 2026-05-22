/**
 * ISO/IEC 27001:2022 A.5.30 — "ICT readiness for business continuity"
 *
 * Signal: compliance_scans with scan_type indicating a DR / backup
 * / continuity test, completed inside the 180-day cadence.
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

const CODE = 'A.5.30';
const REVIEW_WINDOW_DAYS = 180;
const STALE_WINDOW_DAYS = 365;

type ScanRow = {
  id: string;
  scan_type: string | null;
  completed_at: string | null;
  created_at: string | null;
};

function isDrScan(row: ScanRow): boolean {
  const type = (row.scan_type || '').toLowerCase();
  return /dr|disaster|continuity|backup|restore|failover|recovery/.test(type);
}

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
  const drScans = rows.filter(isDrScan);

  if (drScans.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_dr_tests',
          message: 'No DR / backup / continuity scans recorded — A.5.30 requires tested ICT recovery against documented RTO/RPO.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: `No scan_type matching DR / continuity / backup in ${rows.length} compliance_scans row(s).`,
      evaluatedAt,
    };
  }

  const newest = drScans
    .map((s) => s.completed_at ?? s.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceLast = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (sinceLast != null && sinceLast > REVIEW_WINDOW_DAYS) {
    gaps.push({
      code: 'dr_test_stale',
      message: `Most recent DR test was ${sinceLast}d ago — exceeds the ${REVIEW_WINDOW_DAYS}-day cadence.`,
      severity: sinceLast > STALE_WINDOW_DAYS ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = drScans.slice(0, EVIDENCE_CAP).map((s) => ({
    source: 'compliance_scans',
    ref: s.id,
    capturedAt: s.completed_at ?? s.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (sinceLast == null) status = 'partial';
  else if (sinceLast <= REVIEW_WINDOW_DAYS) status = 'pass';
  else if (sinceLast <= STALE_WINDOW_DAYS) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, drScans.length / 3)),
    reason: `${drScans.length} DR / continuity test(s); last completed ${sinceLast ?? '?'}d ago.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

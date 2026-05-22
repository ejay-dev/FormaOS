/**
 * ISO/IEC 27001:2022 A.5.36 — "Compliance with policies, rules and standards for information security"
 *
 * Signal: compliance_scans completed within the 180-day cadence
 * (any framework). Pass requires a recent scan; partial when only
 * older scans exist; fail when no scans at all.
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

const CODE = 'A.5.36';
const REVIEW_WINDOW_DAYS = 180;
const STALE_WINDOW_DAYS = 365;

type ScanRow = {
  id: string;
  scan_type: string | null;
  framework: string | null;
  completed_at: string | null;
  created_at: string | null;
  compliance_score: number | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('compliance_scans')
    .select('id, scan_type, framework, completed_at, created_at, compliance_score')
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
          code: 'no_compliance_scans',
          message: 'No compliance_scans recorded — A.5.36 requires continuous compliance review.',
          severity: 'high',
        },
      ],
      confidence: 0.8,
      reason: 'No compliance scans for this organization.',
      evaluatedAt,
    };
  }

  const newest = rows
    .map((s) => s.completed_at ?? s.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceLast = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (sinceLast != null && sinceLast > REVIEW_WINDOW_DAYS) {
    gaps.push({
      code: 'compliance_scan_stale',
      message: `Most recent compliance scan was ${sinceLast}d ago — exceeds the ${REVIEW_WINDOW_DAYS}-day cadence.`,
      severity: sinceLast > STALE_WINDOW_DAYS ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((s) => ({
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
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / 5)),
    reason: `${rows.length} compliance scan(s); last completed ${sinceLast ?? '?'}d ago.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

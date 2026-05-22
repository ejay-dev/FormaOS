/**
 * SOC2-TSC A1.3 — "Tests recovery plans"
 *
 * Signal: `compliance_scans` rows whose scan_type references recovery
 * drills (recovery / restore / backup / disaster) completed in the
 * last 180 days. Pass when at least one drill is in window; partial
 * when drills exist but are stale; fail otherwise.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, daysSince, notEvaluated, round2 } from './_shared';

const CODE = 'A1.3';
const RECENT_DAYS = 180;
const STALE_DAYS = 365;
const RECOVERY_PATTERN = /recovery|restore|backup|disaster|drill/i;

type ScanRow = {
  id: string;
  scan_type: string | null;
  completed_at: string | null;
  created_at: string | null;
};

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
  const drills = rows.filter((s) => RECOVERY_PATTERN.test(s.scan_type ?? ''));

  if (drills.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_recovery_drills',
          message: `No recovery/restore/backup scans on record — recovery procedures have not been tested.`,
          severity: 'high',
        },
      ],
      confidence: 0.75,
      reason: `0 recovery-flavoured scans in ${rows.length} compliance_scans row(s).`,
      evaluatedAt,
    };
  }

  const newest = drills
    .map((s) => s.completed_at || s.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceLast = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (sinceLast != null && sinceLast > RECENT_DAYS) {
    gaps.push({
      code: 'recovery_drill_stale',
      message: `Most recent recovery drill was ${sinceLast} days ago — exceeds the ${RECENT_DAYS}-day cadence.`,
      severity: sinceLast > STALE_DAYS ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = drills.slice(0, EVIDENCE_CAP).map((s) => ({
    source: 'compliance_scans',
    ref: s.id,
    capturedAt: s.completed_at ?? s.created_at ?? undefined,
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
    confidence: round2(0.6 + 0.4 * Math.min(1, drills.length / 3)),
    reason: `${drills.length} recovery drill(s); last completed ${sinceLast ?? '?'}d ago.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

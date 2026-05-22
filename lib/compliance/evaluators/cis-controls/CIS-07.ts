/**
 * CIS-07 — Continuous vulnerability management.
 *
 * Signal: compliance_scans with a vulnerability-flavoured scan_type
 * completed in the last 30 days (the pack cadence).
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

const CODE = 'CIS-07';
const RECENT_DAYS = 30;
const STALE_DAYS = 90;
const VULN_PATTERN = /vulnerab|sast|dast|sca|dependency|nessus|qualys|tenable/i;

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
  const vulnScans = rows.filter((r) => VULN_PATTERN.test(r.scan_type ?? ''));

  if (vulnScans.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_vuln_scans',
          message:
            'No vulnerability-flavoured scans recorded — CIS-07 requires continuous vulnerability management.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: `No vulnerability scan_type in ${rows.length} compliance_scans row(s).`,
      evaluatedAt,
    };
  }

  const newest = vulnScans
    .map((s) => s.completed_at || s.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceLast = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (sinceLast != null && sinceLast > RECENT_DAYS) {
    gaps.push({
      code: 'vuln_scan_stale',
      message: `Most recent vulnerability scan was ${sinceLast}d ago — exceeds the ${RECENT_DAYS}-day cadence.`,
      severity: sinceLast > STALE_DAYS ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = vulnScans.slice(0, EVIDENCE_CAP).map((s) => ({
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
    confidence: round2(0.6 + 0.4 * Math.min(1, vulnScans.length / 5)),
    reason: `${vulnScans.length} vulnerability scan(s); last completed ${sinceLast ?? '?'}d ago.`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };

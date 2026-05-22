/**
 * CIS-10 — Malware defenses.
 *
 * Signal: compliance_scans with a malware/EDR-flavoured scan_type
 * within the last 60 days (the pack cadence).
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

const CODE = 'CIS-10';
const RECENT_DAYS = 60;
const STALE_DAYS = 180;
const MALWARE_PATTERN = /malware|edr|antivirus|crowdstrike|defender|sentinel/i;

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
  const malwareScans = rows.filter((r) => MALWARE_PATTERN.test(r.scan_type ?? ''));

  if (malwareScans.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_malware_scans',
          message:
            'No malware/EDR-flavoured scans recorded — CIS-10 requires endpoint malware protection.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: `No malware/EDR scan_type in ${rows.length} compliance_scans row(s).`,
      evaluatedAt,
    };
  }

  const newest = malwareScans
    .map((s) => s.completed_at || s.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceLast = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (sinceLast != null && sinceLast > RECENT_DAYS) {
    gaps.push({
      code: 'malware_scan_stale',
      message: `Most recent malware/EDR scan was ${sinceLast}d ago — exceeds the ${RECENT_DAYS}-day cadence.`,
      severity: sinceLast > STALE_DAYS ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = malwareScans.slice(0, EVIDENCE_CAP).map((s) => ({
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
    confidence: round2(0.6 + 0.4 * Math.min(1, malwareScans.length / 5)),
    reason: `${malwareScans.length} malware/EDR scan(s); last completed ${sinceLast ?? '?'}d ago.`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };

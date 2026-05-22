/**
 * SOC2-TSC CC6.8 — "Prevents and detects malicious software"
 *
 * Signal: compliance_scans with scan_type indicating a malware /
 * vulnerability / dependency scan, completed in the last 30 days.
 * Pass: at least one recent scan; partial: scan exists but older
 * than 30 days; fail: no scans at all.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, daysSince, notEvaluated, round2 } from './_shared';

const CODE = 'CC6.8';
const RECENT_DAYS = 30;
const STALE_DAYS = 180;

type ScanRow = {
  id: string;
  scan_id: string | null;
  scan_type: string | null;
  framework: string | null;
  completed_at: string | null;
  created_at: string | null;
  compliance_score: number | null;
};

function isMalwareOrVulnScan(row: ScanRow): boolean {
  const type = (row.scan_type || '').toLowerCase();
  return /vulnerab|malware|dependency|edr|antivirus|sast|dast|sca/.test(type);
}

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('compliance_scans')
    .select('id, scan_id, scan_type, framework, completed_at, created_at, compliance_score')
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
  const scans = rows.filter(isMalwareOrVulnScan);

  if (scans.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_malware_scans',
          message:
            'No malware / dependency / vulnerability scans recorded — CC6.8 requires active detection of malicious software.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: `No scan_type matching malware/vulnerability/dependency in ${rows.length} compliance_scans record(s).`,
      evaluatedAt,
    };
  }

  const newest = scans
    .map((s) => s.completed_at || s.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceLast = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (sinceLast != null && sinceLast > RECENT_DAYS) {
    gaps.push({
      code: 'malware_scan_stale',
      message: `Most recent malware/vulnerability scan was ${sinceLast} days ago — production environments require frequent scanning.`,
      severity: sinceLast > STALE_DAYS ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = scans.slice(0, EVIDENCE_CAP).map((s) => ({
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
    confidence: round2(0.6 + 0.4 * Math.min(1, scans.length / 5)),
    reason: `${scans.length} malware/vuln scan(s); last completed ${sinceLast ?? '?'}d ago.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

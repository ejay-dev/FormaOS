/**
 * CIS-04 — Secure configuration.
 *
 * Signal: compliance_scans with a configuration-flavoured scan_type
 * completed in the last 90 days (the pack cadence). Pass requires a
 * recent scan; partial if the scan is older than the cadence; fail
 * when no configuration scans exist.
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

const CODE = 'CIS-04';
const RECENT_DAYS = 90;
const STALE_DAYS = 365;
const CONFIG_PATTERN =
  /config|configuration|baseline|harden|posture|misconfig|cis|benchmark/i;

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
  const configScans = rows.filter((r) => CONFIG_PATTERN.test(r.scan_type ?? ''));

  if (configScans.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_config_scans',
          message:
            'No configuration/baseline scans recorded — CIS-04 requires baseline adherence checks.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: `No config/baseline scan_type in ${rows.length} compliance_scans row(s).`,
      evaluatedAt,
    };
  }

  const newest = configScans
    .map((s) => s.completed_at || s.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceLast = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (sinceLast != null && sinceLast > RECENT_DAYS) {
    gaps.push({
      code: 'config_scan_stale',
      message: `Most recent configuration scan was ${sinceLast} days ago — exceeds the ${RECENT_DAYS}-day cadence.`,
      severity: sinceLast > STALE_DAYS ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = configScans.slice(0, EVIDENCE_CAP).map((s) => ({
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
    confidence: round2(0.6 + 0.4 * Math.min(1, configScans.length / 5)),
    reason: `${configScans.length} configuration scan(s); last completed ${sinceLast ?? '?'}d ago.`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };

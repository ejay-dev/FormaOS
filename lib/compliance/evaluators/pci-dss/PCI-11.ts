/**
 * PCI-11 — Test security.
 *
 * Signal: compliance_scans of any testing flavour (pen-test,
 * vulnerability, dast) in the last 180 days (pack cadence). PCI v4
 * requires quarterly ASV scans + annual pen tests; we use 180d as a
 * compromise — anything outside that window flags partial/fail.
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

const CODE = 'PCI-11';
const RECENT_DAYS = 180;
const STALE_DAYS = 365;
const TESTING_PATTERN =
  /pen[-_ ]?test|pentest|dast|sast|vulnerab|asv|red[-_ ]?team/i;

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
  const testingScans = rows.filter((r) => TESTING_PATTERN.test(r.scan_type ?? ''));

  if (testingScans.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_security_testing',
          message:
            'No vulnerability/pen-test scans recorded — PCI-11 requires regular security testing.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: `No testing scan_type in ${rows.length} compliance_scans row(s).`,
      evaluatedAt,
    };
  }

  const newest = testingScans
    .map((s) => s.completed_at || s.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceLast = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (sinceLast != null && sinceLast > RECENT_DAYS) {
    gaps.push({
      code: 'testing_stale',
      message: `Most recent security test was ${sinceLast}d ago — exceeds the ${RECENT_DAYS}d cadence.`,
      severity: sinceLast > STALE_DAYS ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = testingScans.slice(0, EVIDENCE_CAP).map((s) => ({
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
    confidence: round2(0.6 + 0.4 * Math.min(1, testingScans.length / 3)),
    reason: `${testingScans.length} testing scan(s); last completed ${sinceLast ?? '?'}d ago.`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };

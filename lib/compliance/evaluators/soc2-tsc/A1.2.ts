/**
 * SOC2-TSC A1.2 — "Designs recovery infrastructure"
 *
 * Signal: presence of retention_policies covering critical resource
 * types (org/customer data) and at least one recovery-flavoured
 * compliance_scan (scan_type containing "backup" or "recovery") in
 * the last 180 days. Pass requires both signals; partial requires
 * one; fail when neither is present.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, daysSince, notEvaluated, round2 } from './_shared';

const CODE = 'A1.2';
const RECENT_DAYS = 180;

type RetentionRow = { id: string; resource_type: string | null; framework: string | null; updated_at: string | null };
type ScanRow = { id: string; scan_type: string | null; completed_at: string | null };

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const [{ data: retentionData, error: retentionError }, { data: scanData, error: scanError }] =
    await Promise.all([
      db
        .from('retention_policies')
        .select('id, resource_type, framework, updated_at')
        .eq('org_id', orgId)
        .limit(200),
      db
        .from('compliance_scans')
        .select('id, scan_type, completed_at')
        .eq('organization_id', orgId)
        .order('completed_at', { ascending: false })
        .limit(200),
    ]);

  if (retentionError && scanError) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'recovery_signals_unavailable',
      `Both retention_policies and compliance_scans queries failed: ${retentionError.message}; ${scanError.message}`,
    );
  }

  const retention = (retentionData ?? []) as RetentionRow[];
  const scans = ((scanData ?? []) as ScanRow[]).filter((s) =>
    /backup|recovery|disaster|restore/i.test(s.scan_type ?? ''),
  );

  const newestScan = scans
    .map((s) => s.completed_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceScan = daysSince(newestScan);

  const hasRetention = retention.length > 0;
  const hasRecentRecoveryScan = sinceScan != null && sinceScan <= RECENT_DAYS;

  const gaps: ControlGap[] = [];
  if (!hasRetention) {
    gaps.push({
      code: 'no_retention_policies',
      message:
        'No retention_policies rows scoped to this organization — backup/retention strategy is not documented.',
      severity: 'high',
    });
  }
  if (!hasRecentRecoveryScan) {
    gaps.push({
      code: 'no_recent_recovery_scan',
      message: `No backup/recovery scan completed within ${RECENT_DAYS} days.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = [
    ...retention.slice(0, EVIDENCE_CAP / 2).map((r) => ({
      source: 'retention_policies',
      ref: r.id,
      capturedAt: r.updated_at ?? undefined,
    })),
    ...scans.slice(0, EVIDENCE_CAP / 2).map((s) => ({
      source: 'compliance_scans',
      ref: s.id,
      capturedAt: s.completed_at ?? undefined,
    })),
  ];

  let status: ControlResult['status'];
  if (hasRetention && hasRecentRecoveryScan) status = 'pass';
  else if (hasRetention || hasRecentRecoveryScan) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.55 + 0.2 * (hasRetention ? 1 : 0) + 0.2 * (hasRecentRecoveryScan ? 1 : 0)),
    reason: `${retention.length} retention polic(ies); ${scans.length} backup/recovery scan(s); last scan ${sinceScan ?? 'n/a'}d ago.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

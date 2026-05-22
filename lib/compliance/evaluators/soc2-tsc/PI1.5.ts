/**
 * SOC2-TSC PI1.5 — "Stores data with authorization and integrity"
 *
 * Signal: presence of `audit_log` rows with non-null `entry_hash` +
 * `prev_hash` indicates the tamper-evident chain is being populated.
 * The hash-chain verification itself is performed by CC7.2; here we
 * just confirm the chain is being written.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, daysSince, notEvaluated, round2 } from './_shared';

const CODE = 'PI1.5';

type ChainRow = {
  id: string;
  entry_hash: string | null;
  prev_hash: string | null;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('audit_log')
    .select('id, entry_hash, prev_hash, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'audit_log_unavailable',
      `Could not read audit_log: ${error.message}`,
    );
  }

  const rows = (data ?? []) as ChainRow[];

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_tamper_evident_log',
          message:
            'audit_log is empty — tamper-evident storage is not being populated for this organization.',
          severity: 'high',
        },
      ],
      confidence: 0.8,
      reason: 'No audit_log entries for this organization.',
      evaluatedAt,
    };
  }

  const hashed = rows.filter((r) => !!r.entry_hash);
  const hashRate = hashed.length / rows.length;

  const newest = rows[0].created_at;
  const sinceLast = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (hashRate < 0.99) {
    gaps.push({
      code: 'missing_entry_hashes',
      message: `${rows.length - hashed.length}/${rows.length} audit_log row(s) have no entry_hash — chain integrity cannot be guaranteed.`,
      severity: 'high',
    });
  }
  if (sinceLast != null && sinceLast > 30) {
    gaps.push({
      code: 'stale_audit_log',
      message: `Most recent audit_log entry was ${sinceLast} days ago — confirm the chain is still being written.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'audit_log',
    ref: r.id,
    capturedAt: r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (hashRate >= 0.99 && (sinceLast == null || sinceLast <= 30)) status = 'pass';
  else if (hashRate >= 0.9) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / 50)),
    reason: `${hashed.length}/${rows.length} audit_log row(s) are hashed; last entry ${sinceLast ?? '?'}d ago.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };

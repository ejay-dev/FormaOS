import { verifyChainIntegrity } from '@/lib/audit/hash-utils';
import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 5; // first/last/broken-position rows

type ChainEntry = {
  id: string;
  org_id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  entry_hash: string;
  prev_hash: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('audit_log')
    .select(
      'id, org_id, user_id, action, resource_type, resource_id, details, created_at, entry_hash, prev_hash, sequence_number',
    )
    .eq('org_id', orgId)
    .order('sequence_number', { ascending: true })
    .limit(10000);

  if (error) {
    return notEvaluated(
      evaluatedAt,
      'audit_log_unavailable',
      `Could not read audit_log chain: ${error.message}`,
    );
  }

  const entries = (data ?? []) as ChainEntry[];

  if (entries.length === 0) {
    return notEvaluated(
      evaluatedAt,
      'no_chain_entries',
      'No tamper-evident audit_log entries exist for this organization.',
    );
  }

  const verifiable = entries.map((e) => ({
    id: e.id,
    org_id: e.org_id,
    user_id: e.user_id ?? undefined,
    action: e.action,
    resource_type: e.resource_type,
    resource_id: e.resource_id ?? undefined,
    details: e.details ?? {},
    created_at: e.created_at,
    entry_hash: e.entry_hash,
    prev_hash: e.prev_hash ?? undefined,
  }));

  const result = verifyChainIntegrity(verifiable);

  const gaps: ControlGap[] = [];
  let status: ControlResult['status'];
  let reason: string;

  if (result.valid) {
    status = 'pass';
    reason = `Hash chain verified across ${result.totalChecked} audit_log entries.`;
  } else {
    status = 'fail';
    reason = `Hash chain broken at entry index ${result.brokenAt}/${result.totalChecked} — possible tampering.`;
    gaps.push({
      code: 'chain_broken',
      message: `Audit chain integrity check failed at index ${result.brokenAt}. Investigate and re-seal the chain.`,
      severity: 'critical',
    });
  }

  const evidenceRefs: EvidenceRef[] = entries
    .slice(0, EVIDENCE_CAP)
    .map((e) => ({
      source: 'audit_log',
      ref: e.id,
      capturedAt: e.created_at,
    }));

  return {
    controlCode: 'CC7.2',
    status,
    evidenceRefs,
    gaps,
    confidence: 1,
    reason,
    evaluatedAt,
  };
};

function notEvaluated(
  evaluatedAt: string,
  code: string,
  message: string,
): ControlResult {
  return {
    controlCode: 'CC7.2',
    status: 'not_evaluated',
    evidenceRefs: [],
    gaps: [{ code, message, severity: 'medium' }],
    confidence: 0,
    reason: message,
    evaluatedAt,
  };
}

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2',
  controlCode: 'CC7.2',
  evaluator: evaluate,
};

export { evaluate };

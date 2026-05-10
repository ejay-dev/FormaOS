import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 50;
const LOOKBACK_DAYS = 365;

type AuditRow = {
  id: string;
  action: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

const ACCESS_ACTION_PATTERNS = [
  'role',
  'member',
  'access',
  'invitation',
  'revok',
  'offboard',
  'permission',
];

function isAccessAction(action: string): boolean {
  const lower = action.toLowerCase();
  return ACCESS_ACTION_PATTERNS.some((p) => lower.includes(p));
}

function hasBeforeAfterMetadata(metadata: Record<string, unknown> | null): boolean {
  if (!metadata) return false;
  const keys = Object.keys(metadata).map((k) => k.toLowerCase());
  const hints = ['before', 'after', 'previous', 'new', 'old', 'diff', 'from', 'to'];
  const matched = hints.filter((h) => keys.some((k) => k.includes(h)));
  return matched.length >= 2;
}

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();
  const since = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: auditData, error: auditError } = await db
    .from('org_audit_logs')
    .select('id, action, created_at, metadata')
    .eq('organization_id', orgId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(2000);

  if (auditError) {
    return notEvaluated(
      evaluatedAt,
      'org_audit_logs_unavailable',
      `Could not read org_audit_logs: ${auditError.message}`,
    );
  }

  const audit = (auditData ?? []) as AuditRow[];

  const { data: membersData, error: membersError } = await db
    .from('org_members')
    .select('id')
    .eq('organization_id', orgId);

  if (membersError) {
    return notEvaluated(
      evaluatedAt,
      'org_members_unavailable',
      `Could not read org_members: ${membersError.message}`,
    );
  }
  const memberCount = (membersData ?? []).length;

  if (audit.length === 0) {
    if (memberCount <= 1) {
      return {
        controlCode: 'CC6.3',
        status: 'partial',
        evidenceRefs: [],
        gaps: [
          {
            code: 'no_audit_entries',
            message:
              'Organization has no audit log entries in the last 365 days. Cannot confirm change-auditing is operational.',
            severity: 'low',
          },
        ],
        confidence: 0.4,
        reason:
          'Single-member org with no audit history; insufficient signal to pass.',
        evaluatedAt,
      };
    }
    return notEvaluated(
      evaluatedAt,
      'no_audit_entries',
      'Multi-member org has zero audit log entries in the last 365 days — audit logging may not be configured.',
    );
  }

  const accessEntries = audit.filter((row) => isAccessAction(row.action));
  const richEntries = accessEntries.filter((row) =>
    hasBeforeAfterMetadata(row.metadata),
  );

  const gaps: ControlGap[] = [];
  let status: ControlResult['status'];
  let reason: string;

  if (accessEntries.length === 0) {
    if (memberCount <= 1) {
      status = 'pass';
      reason =
        'No access-change events expected (single-member org); audit log is otherwise active.';
    } else {
      status = 'fail';
      reason = `Multi-member org (${memberCount} members) has no access-change audit entries in the last 365 days.`;
      gaps.push({
        code: 'no_access_change_logs',
        message:
          'No audit entries for role/member/access changes were found despite multiple members existing.',
        severity: 'high',
      });
    }
  } else if (richEntries.length === accessEntries.length) {
    status = 'pass';
    reason = `${accessEntries.length} access-change audit entries found; all carry before/after metadata.`;
  } else if (richEntries.length / accessEntries.length >= 0.6) {
    status = 'partial';
    reason = `${richEntries.length}/${accessEntries.length} access-change audit entries carry before/after metadata.`;
    gaps.push({
      code: 'sparse_change_metadata',
      message: `${accessEntries.length - richEntries.length} access-change audit entries lack before/after detail in metadata.`,
      severity: 'medium',
    });
  } else {
    status = 'fail';
    reason = `Only ${richEntries.length}/${accessEntries.length} access-change audit entries carry before/after metadata.`;
    gaps.push({
      code: 'missing_change_metadata',
      message:
        'Most access-change audit entries do not record old/new state — auditor cannot reconstruct what changed.',
      severity: 'high',
    });
  }

  const evidenceRefs: EvidenceRef[] = accessEntries
    .slice(0, EVIDENCE_CAP)
    .map((row) => ({
      source: 'org_audit_logs',
      ref: row.id,
      capturedAt: row.created_at,
    }));

  const dataCompleteness = Math.min(1, audit.length / 50);
  const confidence = round2(0.5 + 0.4 * dataCompleteness);

  return {
    controlCode: 'CC6.3',
    status,
    evidenceRefs,
    gaps,
    confidence,
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
    controlCode: 'CC6.3',
    status: 'not_evaluated',
    evidenceRefs: [],
    gaps: [{ code, message, severity: 'medium' }],
    confidence: 0,
    reason: message,
    evaluatedAt,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2',
  controlCode: 'CC6.3',
  evaluator: evaluate,
};

export { evaluate };

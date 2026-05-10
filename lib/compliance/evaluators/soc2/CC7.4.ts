import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 50;
const LOOKBACK_DAYS = 90;
const SYSTEM_ACTOR_PATTERNS = ['system@', 'noreply@', 'unknown'];

const CONFIG_ACTION_PATTERNS = [
  'create',
  'update',
  'delete',
  'config',
  'policy',
  'role',
  'permission',
  'enable',
  'disable',
  'rotate',
  'revoke',
];

type AuditRow = {
  id: string;
  action: string;
  actor_email: string | null;
  created_at: string;
};

function isConfigMutating(action: string): boolean {
  const lower = action.toLowerCase();
  return CONFIG_ACTION_PATTERNS.some((p) => lower.includes(p));
}

function isSystemActor(email: string | null): boolean {
  if (!email) return true;
  const lower = email.toLowerCase();
  return SYSTEM_ACTOR_PATTERNS.some((p) => lower.includes(p));
}

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();
  const since = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await db
    .from('org_audit_logs')
    .select('id, action, actor_email, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) {
    return notEvaluated(
      evaluatedAt,
      'org_audit_logs_unavailable',
      `Could not read org_audit_logs: ${error.message}`,
    );
  }

  const audit = (data ?? []) as AuditRow[];

  if (audit.length === 0) {
    return notEvaluated(
      evaluatedAt,
      'no_audit_entries',
      `No org_audit_logs entries in the last ${LOOKBACK_DAYS} days.`,
    );
  }

  const configEntries = audit.filter((row) => isConfigMutating(row.action));

  if (configEntries.length === 0) {
    return {
      controlCode: 'CC7.4',
      status: 'partial',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_config_actions',
          message:
            'No config-mutating audit entries found in the lookback window; cannot affirm actor-attribution coverage.',
          severity: 'low',
        },
      ],
      confidence: 0.5,
      reason:
        'Audit log is active but contains no config-mutating actions in the lookback window.',
      evaluatedAt,
    };
  }

  const anonymous = configEntries.filter((row) => isSystemActor(row.actor_email));
  const attributedRate = 1 - anonymous.length / configEntries.length;

  const gaps: ControlGap[] = [];
  let status: ControlResult['status'];
  let reason: string;

  if (attributedRate >= 0.95) {
    status = 'pass';
    reason = `${configEntries.length - anonymous.length}/${configEntries.length} config-mutating entries carry a non-system actor (${Math.round(attributedRate * 100)}%).`;
  } else if (attributedRate >= 0.6) {
    status = 'partial';
    reason = `${configEntries.length - anonymous.length}/${configEntries.length} config-mutating entries carry a non-system actor.`;
    gaps.push({
      code: 'sparse_actor_attribution',
      message: `${anonymous.length} config-mutating audit entries lack a non-system actor.`,
      severity: 'medium',
    });
  } else {
    status = 'fail';
    reason = `Only ${configEntries.length - anonymous.length}/${configEntries.length} config-mutating entries carry a non-system actor.`;
    gaps.push({
      code: 'majority_anonymous_changes',
      message: `Most config-mutating audit entries lack named-actor attribution; auditor cannot prove who made changes.`,
      severity: 'high',
    });
  }

  const evidenceRefs: EvidenceRef[] = configEntries
    .slice(0, EVIDENCE_CAP)
    .map((row) => ({
      source: 'org_audit_logs',
      ref: row.id,
      capturedAt: row.created_at,
    }));

  return {
    controlCode: 'CC7.4',
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, configEntries.length / 50)),
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
    controlCode: 'CC7.4',
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
  controlCode: 'CC7.4',
  evaluator: evaluate,
};

export { evaluate };

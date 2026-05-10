import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 50;

type ApiKey = {
  id: string;
  scopes: string[] | null;
  revoked_at: string | null;
};

type AuditRow = { id: string; action: string; created_at: string };

const EXPORT_ACTION_HINTS = ['export', 'download', 'bulk_delete', 'data_extract'];

function isExportAction(action: string): boolean {
  const lower = action.toLowerCase();
  return EXPORT_ACTION_HINTS.some((h) => lower.includes(h));
}

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data: keysData, error: keysError } = await db
    .from('api_keys')
    .select('id, scopes, revoked_at')
    .eq('org_id', orgId)
    .is('revoked_at', null);

  if (keysError) {
    return notEvaluated(
      evaluatedAt,
      'api_keys_unavailable',
      `Could not read api_keys: ${keysError.message}`,
    );
  }

  const activeKeys = (keysData ?? []) as ApiKey[];
  const totalKeys = activeKeys.length;
  const unscopedKeys = activeKeys.filter(
    (k) => !Array.isArray(k.scopes) || k.scopes.length === 0,
  );

  const gaps: ControlGap[] = [];

  // Check exports are audit-logged in last 365d.
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const { data: auditData } = await db
    .from('org_audit_logs')
    .select('id, action, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(2000);

  const auditRows = (auditData ?? []) as AuditRow[];
  const exportEntries = auditRows.filter((row) => isExportAction(row.action));

  let status: ControlResult['status'];
  let reason: string;

  if (totalKeys === 0) {
    // No API keys means no movement vector via API; lean on export logging only.
    if (auditRows.length === 0) {
      return notEvaluated(
        evaluatedAt,
        'no_data_sources',
        'No API keys and no audit log activity in the last 365 days; cannot evaluate information-movement controls.',
      );
    }
    status = 'pass';
    reason =
      'No active API keys; audit log is recording activity, including any export events.';
  } else {
    const unscopedRatio = unscopedKeys.length / totalKeys;
    if (unscopedRatio === 0) {
      status = 'pass';
      reason = `All ${totalKeys} active API key(s) have explicit scopes set.`;
    } else if (unscopedRatio <= 0.2) {
      status = 'partial';
      reason = `${unscopedKeys.length}/${totalKeys} active API key(s) lack explicit scopes (≤20%).`;
      gaps.push({
        code: 'unscoped_api_keys',
        message: `${unscopedKeys.length} active API key(s) have no scopes defined; tighten to least-privilege.`,
        severity: 'medium',
      });
    } else {
      status = 'fail';
      reason = `${unscopedKeys.length}/${totalKeys} active API key(s) lack explicit scopes (>20%).`;
      gaps.push({
        code: 'majority_unscoped_keys',
        message: `Most active API keys have no scopes set, granting broad access.`,
        severity: 'high',
      });
    }
  }

  if (auditRows.length > 0 && exportEntries.length === 0) {
    gaps.push({
      code: 'no_export_audit_entries',
      message:
        'Audit log is active but contains no export/download entries — confirm exports route through audited paths.',
      severity: 'low',
    });
  }

  const evidenceRefs: EvidenceRef[] = [
    ...activeKeys.slice(0, EVIDENCE_CAP).map((k) => ({
      source: 'api_keys',
      ref: k.id,
    })),
    ...exportEntries.slice(0, EVIDENCE_CAP).map((e) => ({
      source: 'org_audit_logs',
      ref: e.id,
      capturedAt: e.created_at,
    })),
  ];

  return {
    controlCode: 'CC6.7',
    status,
    evidenceRefs,
    gaps,
    confidence: 0.8,
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
    controlCode: 'CC6.7',
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
  controlCode: 'CC6.7',
  evaluator: evaluate,
};

export { evaluate };

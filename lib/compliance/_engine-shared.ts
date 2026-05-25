/**
 * Audit server-actions-002 (2026-05-22): shared internals for the
 * compliance-engine lib helpers (`evaluate-framework-controls`,
 * `get-org-compliance-snapshot`, `get-framework-certification-readiness`).
 *
 * Does NOT verify caller authz — the server-action wrappers at
 * `@/app/app/actions/compliance-engine` enforce the session→orgId
 * match before delegating here.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { insertOrgAuditLog } from '@/lib/audit/org-audit-log';
import { logActivity as logger } from '@/lib/audit/legacy-log-activity';
import { getFrameworkCodeForSlug } from '@/lib/frameworks/framework-installer';

export type ControlStatus =
  | 'compliant'
  | 'at_risk'
  | 'non_compliant'
  | 'not_applicable';

export type EvidenceStatus = 'pending' | 'approved' | 'rejected';

export type FrameworkRow = {
  id: string;
  code: string;
  title?: string | null;
  description?: string | null;
};

export type FrameworkScore = {
  frameworkId: string;
  frameworkCode: string;
  frameworkTitle: string;
  score: number;
  riskScore: number;
  totalControls: number;
  compliant: number;
  atRisk: number;
  nonCompliant: number;
  notApplicable: number;
};

export type CategoryScore = {
  category: string;
  score: number;
  riskScore: number;
  totalControls: number;
  compliant: number;
  atRisk: number;
  nonCompliant: number;
  notApplicable: number;
};

export type ComplianceSnapshot = {
  overallScore: number;
  frameworkBreakdown: FrameworkScore[];
  categoryBreakdown: CategoryScore[];
  trend: {
    overallDelta: number | null;
    frameworkDeltas: Array<{ frameworkCode: string; delta: number | null }>;
  };
  openViolations: Array<{
    controlId: string;
    frameworkId: string;
    frameworkCode: string;
    code: string;
    title: string;
    status: ControlStatus;
    riskLevel: string;
    category: string;
    entityId?: string | null;
    requiredEvidenceCount: number;
    approvedEvidenceCount: number;
    pendingEvidenceCount: number;
    rejectedEvidenceCount: number;
    openTaskCount: number;
    overdueTaskCount: number;
  }>;
  highRiskControls: Array<{
    controlId: string;
    frameworkId: string;
    frameworkCode: string;
    code: string;
    title: string;
    status: ControlStatus;
    riskLevel: string;
    category: string;
  }>;
  evidenceBacklog: {
    pending: number;
    rejected: number;
    total: number;
  };
  taskBacklog: {
    open: number;
    overdue: number;
    total: number;
  };
  forecast: {
    projectedScoreIn21Days: number | null;
    daysToFullCompliance: number | null;
    basis: string;
  };
};

export type EvidenceRow = {
  control_id: string;
  evidence_id: string | null;
  status: EvidenceStatus | null;
  created_at?: string | null;
  entity_id?: string | null;
};

export type TaskRow = {
  id: string;
  status?: string | null;
  due_at?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
};

type LegacyFrameworkRecord = FrameworkRow & {
  name?: string | null;
};

type EnabledFrameworkRow = {
  framework_slug: string | null;
};

type LegacyEvidenceMappingRow = {
  control_id: string;
  evidence_id: string | null;
  entity_id?: string | null;
  org_evidence?: {
    status?: EvidenceStatus | null;
  } | null;
};

export type ControlTaskLinkRow = {
  control_id: string;
  task_id: string;
  entity_id?: string | null;
};

export type ControlRow = {
  id: string;
  framework_id: string;
  code: string;
  title: string;
  description?: string | null;
  category?: string | null;
  risk_level?: string | null;
  weight?: number | null;
  required_evidence_count?: number | null;
  is_mandatory?: boolean | null;
};

export type EvaluationRow = {
  organization_id: string;
  entity_id: string | null;
  control_type: string;
  control_key: string;
  required: boolean;
  status: ControlStatus;
  last_evaluated_at: string;
  details: Record<string, unknown>;
};

export function riskMultiplier(riskLevel: string | null | undefined) {
  const level = (riskLevel || 'medium').toLowerCase();
  if (level === 'critical') return 1.4;
  if (level === 'high') return 1.2;
  if (level === 'low') return 0.8;
  return 1;
}

export function scoreFromStatus(status: ControlStatus) {
  if (status === 'compliant') return 1;
  if (status === 'at_risk') return 0.5;
  return 0;
}

export function isTaskComplete(task: TaskRow) {
  const status = (task.status || '').toLowerCase();
  return status === 'completed' || status === 'done';
}

export function isTaskOverdue(task: TaskRow) {
  if (isTaskComplete(task)) return false;
  const due = task.due_at || task.due_date;
  if (!due) return false;
  try {
    return new Date(due) < new Date();
  } catch {
    return false;
  }
}

export function stableHash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv1a_${(h >>> 0).toString(16)}`;
}

export async function safeLogActivity(
  orgId: string,
  action: string,
  description: string,
  metadata?: Record<string, unknown>,
) {
  try {
    if (typeof logger === 'function') {
      await Reflect.apply(logger, undefined, [
        orgId,
        action,
        description,
        metadata,
      ]);
      return;
    }
  } catch {
    // fall back below
  }

  try {
    const supabase = await createSupabaseServerClient();
    await insertOrgAuditLog(supabase, {
      organization_id: orgId,
      action,
      target: description,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date().toISOString(),
    });
  } catch {
    // best-effort only
  }
}

export type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

// In production we now default `strict` to true so schema/RLS errors propagate
// instead of silently returning [] (which produced precise-looking compliance
// scores from sparse data — audit P1 #13). Callers in non-production
// environments can explicitly pass `strict: false` to retain the old
// fallback behavior while back-filling missing migrations.
export const SAFE_SELECT_STRICT_DEFAULT = process.env.NODE_ENV === 'production';

export async function safeSelectFrameworks(
  supabase: DbClient,
  orgId?: string,
  strict: boolean = SAFE_SELECT_STRICT_DEFAULT,
): Promise<FrameworkRow[]> {
  try {
    const { data, error } = await supabase
      .from('compliance_frameworks')
      .select('id, code, name, description');
    if (error) {
      if (strict) throw new Error(error.message);
      return [];
    }
    const frameworks = ((data ?? []) as LegacyFrameworkRecord[]).map((row) => ({
      ...row,
      title: row.title ?? row.name ?? null,
    }));
    if (!orgId) return frameworks;

    try {
      const { data: enabled } = await supabase
        .from('org_frameworks')
        .select('framework_slug')
        .eq('organization_id', orgId);

      const enabledSlugs = ((enabled ?? []) as EnabledFrameworkRow[]).map(
        (row) => row.framework_slug,
      );
      if (!enabledSlugs.length) return frameworks;

      const enabledCodes = new Set(
        enabledSlugs
          .filter(
            (slug): slug is string =>
              typeof slug === 'string' && slug.length > 0,
          )
          .map((slug) => getFrameworkCodeForSlug(slug)),
      );

      return frameworks.filter((fw) => enabledCodes.has(fw.code));
    } catch {
      return frameworks;
    }
  } catch {
    if (strict) throw new Error('Failed to load frameworks');
    return [];
  }
}

export async function safeSelectControls(
  supabase: DbClient,
  frameworkId: string,
  strict: boolean = SAFE_SELECT_STRICT_DEFAULT,
) {
  try {
    const { data, error } = await supabase
      .from('compliance_controls')
      .select(
        'id, framework_id, code, title, description, category, risk_level, weight, required_evidence_count, is_mandatory',
      )
      .eq('framework_id', frameworkId);
    if (error) {
      if (strict) throw new Error(error.message);
      return [];
    }
    return data ?? [];
  } catch {
    if (strict) throw new Error('Failed to load controls');
    return [];
  }
}

export async function safeSelectControlEvidence(
  supabase: DbClient,
  orgId: string,
  controlIds: string[],
  strict: boolean = SAFE_SELECT_STRICT_DEFAULT,
): Promise<EvidenceRow[]> {
  if (!controlIds.length) return [];

  let lastError: string | null = null;
  try {
    const { data, error } = await supabase
      .from('control_evidence')
      .select('control_id, evidence_id, status, created_at, entity_id')
      .eq('organization_id', orgId)
      .in('control_id', controlIds);
    if (!error && data) return data as EvidenceRow[];
    lastError = error?.message ?? null;
  } catch {
    // fall through
  }

  // fallback to legacy mapping if present
  try {
    const { data, error } = await supabase
      .from('org_control_mappings')
      .select('control_id, evidence_id, org_evidence ( status )')
      .eq('organization_id', orgId)
      .in('control_id', controlIds);
    if (error || !data) {
      lastError = error?.message ?? lastError;
      if (strict)
        throw new Error(lastError || 'Failed to load control evidence');
      return [];
    }
    return (data as LegacyEvidenceMappingRow[]).map((row) => ({
      control_id: row.control_id,
      evidence_id: row.evidence_id,
      status: (row.org_evidence?.status || 'pending') as EvidenceStatus,
      entity_id: row.entity_id ?? null,
    }));
  } catch {
    if (strict) throw new Error(lastError || 'Failed to load control evidence');
    return [];
  }
}

export async function safeSelectControlTasks(
  supabase: DbClient,
  orgId: string,
  controlIds: string[],
  strict: boolean = SAFE_SELECT_STRICT_DEFAULT,
): Promise<Array<{ control_id: string; task_id: string; entity_id?: string | null }>> {
  if (!controlIds.length) return [];

  try {
    const { data, error } = await supabase
      .from('control_tasks')
      .select('control_id, task_id, entity_id')
      .eq('organization_id', orgId)
      .in('control_id', controlIds);
    if (error) {
      if (strict) throw new Error(error.message);
      return [];
    }
    return ((data ?? []) as ControlTaskLinkRow[]).map((row) => ({
      control_id: row.control_id,
      task_id: row.task_id,
      entity_id: row.entity_id ?? null,
    }));
  } catch {
    if (strict) throw new Error('Failed to load control tasks');
    return [];
  }
}

export async function safeSelectTasksByIds(
  supabase: DbClient,
  orgId: string,
  taskIds: string[],
  strict: boolean = SAFE_SELECT_STRICT_DEFAULT,
): Promise<TaskRow[]> {
  if (!taskIds.length) return [];
  try {
    const { data, error } = await supabase
      .from('org_tasks')
      .select('id,status,due_at,due_date,completed_at')
      .eq('organization_id', orgId)
      .in('id', taskIds);
    if (error) {
      if (strict) throw new Error(error.message);
      return [];
    }
    return (data ?? []) as TaskRow[];
  } catch {
    if (strict) throw new Error('Failed to load tasks');
    return [];
  }
}

export async function upsertEvaluations(
  supabase: DbClient,
  rows: EvaluationRow[],
) {
  if (!rows.length) return;
  try {
    await supabase
      .from('org_control_evaluations')
      .upsert(rows, { onConflict: 'organization_id,control_type,control_key' });
  } catch {
    // best-effort only
  }
}

export async function logEvaluationAudit(
  supabase: DbClient,
  orgId: string,
  rows: EvaluationRow[],
) {
  if (!rows.length) return;
  try {
    const logs = rows.map((row) => ({
      organization_id: orgId,
      action: 'control_evaluated',
      target: row.control_key,
      actor_email: 'system',
      created_at: row.last_evaluated_at,
      metadata: row.details || null,
    }));
    await insertOrgAuditLog(supabase, logs);
  } catch {
    // swallow to avoid blocking page render
  }
}

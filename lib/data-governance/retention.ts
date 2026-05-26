import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logIdentityEvent } from '@/lib/identity/audit';
import {
  isMissingSupabaseColumnError,
  isMissingSupabaseTableError,
} from '@/lib/supabase/schema-compat';

/**
 * Audit 2026-05-26 (M6): this module previously read/wrote five
 * columns that DO NOT EXIST in production
 * (`resource_type, retention_days, action, exceptions, framework`).
 * The prod `retention_policies` table was created by
 * `20260403002_document_retention.sql` with the columns
 * `name, description, document_category, retention_period_days,
 * action_on_expiry, is_active` (verified live 2026-05-26). The two
 * later `CREATE TABLE IF NOT EXISTS` migrations were no-ops.
 *
 * Net effect before this fix: `applyRetentionPolicy` writes failed,
 * `evaluateRetention` saw every policy row as
 * `{ resource_type: undefined, retention_days: undefined, action: undefined }`,
 * and the nightly /api/cron/data-retention cron silently applied
 * nothing to any org's data — exactly the "decoupled" symptom that
 * RUNBOOKS §11 documented.
 *
 * Fix: column-name bridge at the DB boundary. The rest of the module
 * keeps using the in-memory canonical names; only `toDbWriteRow` and
 * `toCanonicalPolicy` know the prod column names. If the prod schema
 * is ever expanded to add `exceptions` / `framework` back, drop the
 * bridge and use direct columns.
 *
 * Action mapping: prod `action_on_expiry` allows
 * `'archive' | 'delete' | 'review'`. The canonical type still names
 * `'anonymize'` for backward-compat; in-DB it stores as `'archive'`
 * (closest semantics) and is reapplied as anonymize logic via the
 * `anonymizeFields` config below if the resource has them.
 */

export type RetentionAction = 'archive' | 'delete' | 'anonymize';

type DbRetentionPolicyRow = {
  id: string;
  org_id: string;
  document_category: string;
  retention_period_days: number;
  action_on_expiry: 'archive' | 'delete' | 'review';
  is_active: boolean;
  name?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
};

type CanonicalRetentionPolicy = {
  id: string;
  org_id: string;
  resource_type: string;
  retention_days: number;
  action: RetentionAction;
  exceptions: string[];
  framework: 'GDPR' | 'SOC2' | 'HIPAA' | 'custom';
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function toCanonicalPolicy(row: DbRetentionPolicyRow): CanonicalRetentionPolicy {
  // The legacy 'anonymize' value never made it into the prod CHECK
  // constraint; rows surface as 'archive' and the executor does
  // anonymize-or-archive based on the resource config's
  // anonymizeFields. Keep callers' canonical view intact.
  const action: RetentionAction =
    row.action_on_expiry === 'review' ? 'archive' : row.action_on_expiry;
  return {
    id: row.id,
    org_id: row.org_id,
    resource_type: row.document_category,
    retention_days: row.retention_period_days,
    action,
    exceptions: [],
    framework: 'custom',
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toDbWriteRow(
  orgId: string,
  policy: RetentionPolicyInput,
): Omit<DbRetentionPolicyRow, 'id' | 'created_at'> {
  const action_on_expiry: DbRetentionPolicyRow['action_on_expiry'] =
    policy.action === 'anonymize' ? 'archive' : policy.action;
  return {
    org_id: orgId,
    name: `${policy.framework ?? 'custom'}: ${policy.resource_type}`,
    description: null,
    document_category: policy.resource_type,
    retention_period_days: policy.retention_days,
    action_on_expiry,
    is_active: true,
    updated_at: new Date().toISOString(),
  };
}

export interface RetentionPolicyInput {
  resource_type: string;
  retention_days: number;
  action: RetentionAction;
  exceptions?: string[];
  framework?: 'GDPR' | 'SOC2' | 'HIPAA' | 'custom';
}

type ResourceConfig = {
  table: string;
  orgColumn: 'organization_id' | 'org_id';
  createdAtColumn: string;
  archiveUpdate?: Record<string, unknown>;
  anonymizeFields?: string[];
};

const RESOURCE_CONFIGS: Record<string, ResourceConfig> = {
  tasks: {
    table: 'org_tasks',
    orgColumn: 'organization_id',
    createdAtColumn: 'created_at',
    archiveUpdate: { status: 'archived' },
  },
  evidence: {
    table: 'org_evidence',
    orgColumn: 'organization_id',
    createdAtColumn: 'created_at',
    anonymizeFields: ['uploaded_by', 'ai_summary'],
  },
  policies: {
    table: 'org_policies',
    orgColumn: 'organization_id',
    createdAtColumn: 'updated_at',
    archiveUpdate: { status: 'archived' },
    anonymizeFields: ['author'],
  },
  assets: {
    table: 'org_assets',
    orgColumn: 'organization_id',
    createdAtColumn: 'created_at',
    archiveUpdate: { status: 'archived' },
    anonymizeFields: ['owner'],
  },
  risks: {
    table: 'org_risks',
    orgColumn: 'organization_id',
    createdAtColumn: 'updated_at',
    archiveUpdate: { status: 'archived' },
    anonymizeFields: ['mitigation_strategy'],
  },
  identity_audit: {
    table: 'identity_audit_events',
    orgColumn: 'org_id',
    createdAtColumn: 'created_at',
  },
  notifications: {
    table: 'notifications',
    orgColumn: 'org_id',
    createdAtColumn: 'created_at',
    archiveUpdate: { archived_at: new Date().toISOString() },
  },
};

export const BUILT_IN_RETENTION_POLICIES = {
  GDPR: [
    {
      resource_type: 'identity_audit',
      retention_days: 365,
      action: 'anonymize' as const,
    },
    {
      resource_type: 'notifications',
      retention_days: 180,
      action: 'delete' as const,
    },
  ],
  SOC2: [
    {
      resource_type: 'identity_audit',
      retention_days: 365 * 2,
      action: 'archive' as const,
    },
    {
      resource_type: 'evidence',
      retention_days: 365 * 7,
      action: 'archive' as const,
    },
  ],
};

function getResourceConfig(resourceType: string) {
  const config = RESOURCE_CONFIGS[resourceType];
  if (!config) {
    throw new Error(`Unsupported retention resource type: ${resourceType}`);
  }
  return config;
}

function cutoffIso(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

async function selectExpiredRows(
  orgId: string,
  resourceType: string,
  retentionDays: number,
  exceptions: string[],
) {
  const admin = createSupabaseAdminClient();
  const config = getResourceConfig(resourceType);
  let query = admin
    .from(config.table)
    .select(`id, ${config.createdAtColumn}`)
    .eq(config.orgColumn, orgId)
    .lt(config.createdAtColumn, cutoffIso(retentionDays))
    .limit(500);

  if (exceptions.length) {
    query = query.not(
      'id',
      'in',
      `(${exceptions.map((id) => `"${id}"`).join(',')})`,
    );
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as Array<{ id: string }>;
}

export async function applyRetentionPolicy(
  orgId: string,
  policy: RetentionPolicyInput,
): Promise<CanonicalRetentionPolicy> {
  const admin = createSupabaseAdminClient();
  const payload = toDbWriteRow(orgId, policy);

  const { data, error } = await admin
    .from('retention_policies')
    .upsert(payload, { onConflict: 'org_id,document_category' })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toCanonicalPolicy(data as DbRetentionPolicyRow);
}

export async function listRetentionPolicies(
  orgId: string,
): Promise<CanonicalRetentionPolicy[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('retention_policies')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('document_category', { ascending: true });

  if (error) {
    if (
      isMissingSupabaseTableError(error, 'retention_policies') ||
      isMissingSupabaseColumnError(error, 'retention_policies')
    ) {
      return [];
    }
    throw new Error(error.message);
  }

  return ((data ?? []) as DbRetentionPolicyRow[]).map(toCanonicalPolicy);
}

interface RetentionPolicyRow {
  resource_type: string;
  retention_days: number;
  action: string;
  exceptions?: string[];
}

interface EvaluationItem {
  resource_type: string;
  retention_days: number;
  action: string;
  expired_count: number;
  record_ids: string[];
}

export async function evaluateRetention(orgId: string) {
  const policies = await listRetentionPolicies(orgId);
  const summary: Array<Record<string, unknown>> = [];

  for (const policy of policies as Array<RetentionPolicyRow>) {
    const rows = await selectExpiredRows(
      orgId,
      policy.resource_type,
      policy.retention_days,
      policy.exceptions ?? [],
    );
    summary.push({
      resource_type: policy.resource_type,
      retention_days: policy.retention_days,
      action: policy.action,
      expired_count: rows.length,
      record_ids: rows.map((row) => row.id),
    });
  }

  return summary;
}

async function archiveRows(
  config: ResourceConfig,
  orgId: string,
  ids: string[],
) {
  const admin = createSupabaseAdminClient();
  if (!config.archiveUpdate) return;
  const { error } = await admin
    .from(config.table)
    .update(config.archiveUpdate)
    .eq(config.orgColumn, orgId)
    .in('id', ids);
  if (error) throw new Error(error.message);
}

async function anonymizeRows(
  config: ResourceConfig,
  orgId: string,
  ids: string[],
) {
  const admin = createSupabaseAdminClient();
  if (!config.anonymizeFields?.length) return;
  const updatePayload = Object.fromEntries(
    config.anonymizeFields.map((field) => [field, null]),
  );
  const { error } = await admin
    .from(config.table)
    .update(updatePayload)
    .eq(config.orgColumn, orgId)
    .in('id', ids);
  if (error) throw new Error(error.message);
}

async function deleteRows(
  config: ResourceConfig,
  orgId: string,
  ids: string[],
) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from(config.table)
    .delete()
    .eq(config.orgColumn, orgId)
    .in('id', ids);
  if (error) throw new Error(error.message);
}

export async function executeRetention(orgId: string, dryRun = true) {
  const admin = createSupabaseAdminClient();
  const evaluation = await evaluateRetention(orgId);
  const results: Array<Record<string, unknown>> = [];

  for (const item of evaluation as unknown as Array<EvaluationItem>) {
    const ids = (item.record_ids ?? []) as string[];
    const config = getResourceConfig(item.resource_type);

    if (!dryRun && ids.length) {
      if (item.action === 'archive') {
        await archiveRows(config, orgId, ids);
      } else if (item.action === 'delete') {
        await deleteRows(config, orgId, ids);
      } else if (item.action === 'anonymize') {
        await anonymizeRows(config, orgId, ids);
      }
    }

    const execution = {
      org_id: orgId,
      resource_type: item.resource_type,
      action: item.action,
      dry_run: dryRun,
      affected_records: ids,
      affected_count: ids.length,
      executed_at: new Date().toISOString(),
      metadata: {
        retention_days: item.retention_days,
      },
    };

    const { error } = await admin
      .from('retention_executions')
      .insert(execution);
    if (error) {
      throw new Error(error.message);
    }

    results.push(execution);
  }

  await logIdentityEvent({
    eventType: 'governance.retention.executed',
    actorType: 'system',
    orgId,
    result: 'success',
    metadata: {
      dry_run: dryRun,
      execution_count: results.length,
      totals: results.reduce(
        (sum, item) =>
          sum + ((item as Record<string, number>).affected_count ?? 0),
        0,
      ),
    },
  });

  return results;
}

export async function listRetentionExecutions(orgId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('retention_executions')
    .select('*')
    .eq('org_id', orgId)
    .order('executed_at', { ascending: false })
    .limit(25);

  if (error) {
    if (
      isMissingSupabaseTableError(error, 'retention_executions') ||
      isMissingSupabaseColumnError(error, 'retention_executions')
    ) {
      return [];
    }
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getRetentionSchemaStatus() {
  const admin = createSupabaseAdminClient();
  const checks = await Promise.all([
    admin.from('retention_policies').select('id, resource_type').limit(1),
    admin.from('retention_executions').select('id, executed_at').limit(1),
  ]);
  const missing = checks
    .map((result, index) => ({
      table: index === 0 ? 'retention_policies' : 'retention_executions',
      error: result.error,
    }))
    .filter(
      (item) =>
        isMissingSupabaseTableError(item.error, item.table) ||
        isMissingSupabaseColumnError(item.error, item.table),
    )
    .map((item) => item.table);

  return {
    available: missing.length === 0,
    missing,
  };
}

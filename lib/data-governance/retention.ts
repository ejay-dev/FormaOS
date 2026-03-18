import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logIdentityEvent } from '@/lib/identity/audit';

export type RetentionAction = 'archive' | 'delete' | 'anonymize';

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
    query = query.not('id', 'in', `(${exceptions.map((id) => `"${id}"`).join(',')})`);
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
) {
  const admin = createSupabaseAdminClient();
  const payload = {
    org_id: orgId,
    resource_type: policy.resource_type,
    retention_days: policy.retention_days,
    action: policy.action,
    exceptions: policy.exceptions ?? [],
    framework: policy.framework ?? 'custom',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from('retention_policies')
    .upsert(payload, { onConflict: 'org_id,resource_type' })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function listRetentionPolicies(orgId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('retention_policies')
    .select('*')
    .eq('org_id', orgId)
    .order('resource_type', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function evaluateRetention(orgId: string) {
  const policies = await listRetentionPolicies(orgId);
  const summary: Array<Record<string, unknown>> = [];

  for (const policy of policies as Array<any>) {
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

async function archiveRows(config: ResourceConfig, orgId: string, ids: string[]) {
  const admin = createSupabaseAdminClient();
  if (!config.archiveUpdate) return;
  const { error } = await admin
    .from(config.table)
    .update(config.archiveUpdate)
    .eq(config.orgColumn, orgId)
    .in('id', ids);
  if (error) throw new Error(error.message);
}

async function anonymizeRows(config: ResourceConfig, orgId: string, ids: string[]) {
  const admin = createSupabaseAdminClient();
  if (!config.anonymizeFields?.length) return;
  const updatePayload = Object.fromEntries(config.anonymizeFields.map((field) => [field, null]));
  const { error } = await admin
    .from(config.table)
    .update(updatePayload)
    .eq(config.orgColumn, orgId)
    .in('id', ids);
  if (error) throw new Error(error.message);
}

async function deleteRows(config: ResourceConfig, orgId: string, ids: string[]) {
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

  for (const item of evaluation as Array<any>) {
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

    const { error } = await admin.from('retention_executions').insert(execution);
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
      totals: results.reduce((sum, item: any) => sum + item.affected_count, 0),
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
    throw new Error(error.message);
  }

  return data ?? [];
}

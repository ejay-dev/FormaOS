import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/audit-trail';
import { createJiraIssue, syncTaskStatusToJira } from './jira';
import { createLinearIssue, syncTaskStatusToLinear } from './linear';
import {
  sendCertificateNotification,
  sendComplianceAlert,
  sendMemberNotification,
  sendTaskNotification,
} from './slack';
import {
  sendTeamsCertificateNotification,
  sendTeamsComplianceAlert,
  sendTeamsTaskNotification,
} from './teams';
import { decodeIntegrationConfig, encodeIntegrationConfig } from './config-crypto';

export type IntegrationType =
  | 'slack'
  | 'teams'
  | 'jira'
  | 'linear'
  | 'google_drive'
  | 'webhook_relay';

export interface IntegrationCatalogItem {
  id: IntegrationType;
  name: string;
  description: string;
  icon: string;
  status: 'available' | 'beta';
  capabilities: string[];
}

const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send compliance alerts and task updates to Slack channels.',
    icon: 'message-square',
    status: 'available',
    capabilities: ['alerts', 'tasks', 'certificates'],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Push Adaptive Card alerts into Microsoft Teams.',
    icon: 'messages-square',
    status: 'available',
    capabilities: ['alerts', 'tasks', 'certificates'],
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Create and sync compliance tasks as Jira issues.',
    icon: 'briefcase',
    status: 'available',
    capabilities: ['task-sync', 'status-sync'],
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Create and sync compliance tasks as Linear issues.',
    icon: 'kanban-square',
    status: 'available',
    capabilities: ['task-sync', 'status-sync'],
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Reference Google Drive evidence in FormaOS.',
    icon: 'folder',
    status: 'beta',
    capabilities: ['evidence-linking'],
  },
  {
    id: 'webhook_relay',
    name: 'Webhook Relay',
    description: 'Relay compliance events to arbitrary HTTPS endpoints.',
    icon: 'webhook',
    status: 'available',
    capabilities: ['event-relay'],
  },
];

function getCatalogItem(type: string) {
  return INTEGRATION_CATALOG.find((item) => item.id === type);
}

function getRequiredConfigKeys(type: IntegrationType): string[] {
  switch (type) {
    case 'slack':
      return ['webhook_url'];
    case 'teams':
      return ['webhook_url', 'channel_name'];
    case 'jira':
      return ['cloud_id', 'access_token', 'project_key', 'issue_type_id'];
    case 'linear':
      return ['api_key', 'team_id'];
    case 'google_drive':
      return ['access_token', 'refresh_token'];
    case 'webhook_relay':
      return ['relay_enabled'];
  }
}

export function listAvailableIntegrations(): IntegrationCatalogItem[] {
  return INTEGRATION_CATALOG;
}

async function getProviderConfigRow(orgId: string, provider: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('integration_configs')
    .select('*')
    .eq('organization_id', orgId)
    .eq('provider', provider)
    .maybeSingle();

  return data ?? null;
}

export async function listConnectedIntegrations(orgId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('integration_configs')
    .select('*')
    .eq('organization_id', orgId)
    .order('provider', { ascending: true });

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    organization_id: row.organization_id as string,
    provider: row.provider as IntegrationType,
    enabled: Boolean(row.enabled),
    config: decodeIntegrationConfig<Record<string, unknown>>(row.config),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }));
}

export async function getIntegrationStatus(orgId: string) {
  const admin = createSupabaseAdminClient();
  const [connected, syncLog] = await Promise.all([
    listConnectedIntegrations(orgId),
    admin
      .from('integration_sync_log')
      .select('provider, synced_at')
      .eq('organization_id', orgId)
      .order('synced_at', { ascending: false })
      .limit(100),
  ]);

  const lastSyncByProvider = new Map<string, string>();
  for (const row of syncLog.data ?? []) {
    if (!lastSyncByProvider.has(row.provider)) {
      lastSyncByProvider.set(row.provider, row.synced_at);
    }
  }

  return INTEGRATION_CATALOG.map((catalog) => {
    const connection = connected.find(
      (item: { provider: string }) => item.provider === catalog.id,
    );
    return {
      ...catalog,
      connected: Boolean(connection),
      health: connection?.enabled ? 'healthy' : 'disconnected',
      lastSyncAt: lastSyncByProvider.get(catalog.id) ?? null,
      config: connection?.config ?? null,
    };
  });
}

export async function connectIntegration(args: {
  orgId: string;
  type: IntegrationType;
  config: Record<string, unknown>;
  actorUserId: string;
}) {
  if (!getCatalogItem(args.type)) {
    throw new Error(`Unsupported integration type: ${args.type}`);
  }

  const missing = getRequiredConfigKeys(args.type).filter((key) => {
    const value = args.config[key];
    return typeof value !== 'string' || !value.trim();
  });

  if (missing.length > 0) {
    throw new Error(`Missing required config fields: ${missing.join(', ')}`);
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('integration_configs')
    .upsert(
      {
        organization_id: args.orgId,
        provider: args.type,
        config: encodeIntegrationConfig(args.config),
        enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,provider' },
    )
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to connect integration: ${error?.message ?? 'unknown error'}`);
  }

  await logActivity(args.orgId, args.actorUserId, 'create', 'organization', {
    entityId: data.id,
    entityName: args.type,
    details: { type: 'integration', provider: args.type },
  });

  return {
    ...data,
    config: decodeIntegrationConfig<Record<string, unknown>>(data.config),
  };
}

export async function disconnectIntegration(args: {
  orgId: string;
  integrationId: string;
  actorUserId: string;
}) {
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from('integration_configs')
    .select('*')
    .eq('organization_id', args.orgId)
    .eq('id', args.integrationId)
    .maybeSingle();

  if (!existing) {
    throw new Error('Integration not found');
  }

  const { error } = await admin
    .from('integration_configs')
    .delete()
    .eq('organization_id', args.orgId)
    .eq('id', args.integrationId);

  if (error) {
    throw new Error(`Failed to disconnect integration: ${error.message}`);
  }

  await logActivity(args.orgId, args.actorUserId, 'delete', 'organization', {
    entityId: args.integrationId,
    entityName: existing.provider,
    details: { type: 'integration' },
  });
}

export async function testIntegration(
  orgId: string,
  integrationId: string,
): Promise<{ ok: boolean; provider?: string; message: string }> {
  const row = await getProviderConfigRow(orgId, integrationId);
  if (!row) {
    return { ok: false, message: 'Integration not connected' };
  }

  const provider = row.provider as IntegrationType;
  const config = decodeIntegrationConfig<Record<string, unknown>>(row.config);
  const missing = getRequiredConfigKeys(provider).filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || !value.trim();
  });

  if (missing.length > 0) {
    return {
      ok: false,
      provider,
      message: `Configuration incomplete: ${missing.join(', ')}`,
    };
  }

  return { ok: true, provider, message: 'Configuration looks healthy' };
}

export async function getIntegrationEventHistory(
  orgId: string,
  integrationId: string,
  limit = 50,
) {
  const admin = createSupabaseAdminClient();
  const [events, syncLog] = await Promise.all([
    admin
      .from('integration_events')
      .select('*')
      .eq('organization_id', orgId)
      .eq('provider', integrationId)
      .order('created_at', { ascending: false })
      .limit(limit),
    admin
      .from('integration_sync_log')
      .select('*')
      .eq('organization_id', orgId)
      .eq('provider', integrationId)
      .order('synced_at', { ascending: false })
      .limit(limit),
  ]);

  return {
    events: events.data ?? [],
    syncLog: syncLog.data ?? [],
  };
}

export async function dispatchIntegrationEvent(
  orgId: string,
  event:
    | 'task.created'
    | 'task.completed'
    | 'certificate.expiring'
    | 'certificate.expired'
    | 'member.added'
    | 'member.removed'
    | 'compliance.alert'
    | 'evidence.uploaded',
  payload: Record<string, any>,
) {
  const connected = await listConnectedIntegrations(orgId);
  const providers = new Set(
    connected
      .filter((item: { enabled: boolean }) => item.enabled)
      .map((item: { provider: string }) => item.provider),
  );

  await Promise.allSettled([
    providers.has('slack')
      ? dispatchSlackEvent(orgId, event, payload)
      : Promise.resolve(null),
    providers.has('teams')
      ? dispatchTeamsEvent(orgId, event, payload)
      : Promise.resolve(null),
    providers.has('jira')
      ? dispatchJiraEvent(orgId, event, payload)
      : Promise.resolve(null),
    providers.has('linear')
      ? dispatchLinearEvent(orgId, event, payload)
      : Promise.resolve(null),
    providers.has('google_drive')
      ? recordIntegrationEvent(orgId, 'google_drive', event, payload)
      : Promise.resolve(null),
  ]);
}

async function dispatchSlackEvent(
  orgId: string,
  event: string,
  payload: Record<string, any>,
) {
  if (event === 'task.created') {
    await sendTaskNotification(orgId, payload.task, 'created');
  } else if (event === 'task.completed') {
    await sendTaskNotification(orgId, payload.task, 'completed');
  } else if (event === 'certificate.expiring') {
    await sendCertificateNotification(orgId, payload.certificate, 'expiring');
  } else if (event === 'certificate.expired') {
    await sendCertificateNotification(orgId, payload.certificate, 'expired');
  } else if (event === 'member.added') {
    await sendMemberNotification(orgId, payload.member, 'added');
  } else if (event === 'member.removed') {
    await sendMemberNotification(orgId, payload.member, 'removed');
  } else if (event === 'compliance.alert') {
    await sendComplianceAlert(orgId, payload.alert);
  }

  await recordIntegrationEvent(orgId, 'slack', event, payload);
}

async function dispatchTeamsEvent(
  orgId: string,
  event: string,
  payload: Record<string, any>,
) {
  if (event === 'task.created') {
    await sendTeamsTaskNotification(orgId, payload.task, 'task_created');
  } else if (event === 'task.completed') {
    await sendTeamsTaskNotification(orgId, payload.task, 'task_completed');
  } else if (event === 'certificate.expiring') {
    await sendTeamsCertificateNotification(
      orgId,
      payload.certificate,
      'certificate_expiring',
    );
  } else if (event === 'certificate.expired') {
    await sendTeamsCertificateNotification(
      orgId,
      payload.certificate,
      'certificate_expired',
    );
  } else if (event === 'compliance.alert') {
    await sendTeamsComplianceAlert(
      orgId,
      (payload.alert?.severity as 'low' | 'medium' | 'high' | 'critical') ?? 'medium',
      payload.alert,
    );
  }

  await recordIntegrationEvent(orgId, 'teams', event, payload);
}

async function dispatchJiraEvent(
  orgId: string,
  event: string,
  payload: Record<string, any>,
) {
  if (event === 'task.created') {
    await createJiraIssue(orgId, payload.task);
  } else if (event === 'task.completed') {
    await syncTaskStatusToJira(orgId, payload.task.id, 'completed');
  }

  await recordIntegrationEvent(orgId, 'jira', event, payload);
}

async function dispatchLinearEvent(
  orgId: string,
  event: string,
  payload: Record<string, any>,
) {
  if (event === 'task.created') {
    await createLinearIssue(orgId, payload.task);
  } else if (event === 'task.completed') {
    await syncTaskStatusToLinear(orgId, payload.task.id, 'completed');
  }

  await recordIntegrationEvent(orgId, 'linear', event, payload);
}

async function recordIntegrationEvent(
  orgId: string,
  provider: string,
  eventType: string,
  metadata: Record<string, unknown>,
) {
  const admin = createSupabaseAdminClient();
  await admin.from('integration_events').insert({
    organization_id: orgId,
    provider,
    event_type: eventType,
    metadata,
    created_at: new Date().toISOString(),
  });
}

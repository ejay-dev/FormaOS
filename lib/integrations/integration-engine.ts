import { createSupabaseServerClient } from '@/lib/supabase/server';

// ------------------------------------------------------------------
// Integration Engine
// ------------------------------------------------------------------

export const INTEGRATION_CATALOG = {
  slack: {
    name: 'Slack',
    description:
      'Send compliance alerts, task updates, and incident notifications to Slack channels',
    icon: '💬',
    category: 'communication',
    actions: ['send_message'],
    events: [
      'control_status_change',
      'evidence_uploaded',
      'incident_created',
      'task_overdue',
      'policy_published',
    ],
  },
  jira: {
    name: 'Jira',
    description:
      'Create Jira issues from incidents, sync tasks bidirectionally',
    icon: '🎯',
    category: 'project_management',
    actions: ['create_issue', 'sync_task'],
    events: ['incident_created', 'task_created', 'task_status_change'],
  },
  azure_ad: {
    name: 'Azure AD / Entra ID',
    description: 'Sync users and groups from Azure Active Directory',
    icon: '🔑',
    category: 'identity',
    actions: ['sync_user', 'sync_group'],
    events: [],
  },
  webhook: {
    name: 'Custom Webhook',
    description: 'Send event payloads to any HTTP endpoint',
    icon: '🔗',
    category: 'developer',
    actions: ['webhook_post'],
    events: [
      'control_status_change',
      'evidence_uploaded',
      'incident_created',
      'task_overdue',
      'policy_published',
      'task_created',
      'task_status_change',
    ],
  },
  google_workspace: {
    name: 'Google Workspace',
    description: 'Sync users from Google Workspace directory',
    icon: '📧',
    category: 'identity',
    actions: ['sync_user'],
    events: [],
  },
  teams: {
    name: 'Microsoft Teams',
    description: 'Post notifications to Teams channels via incoming webhooks',
    icon: '💼',
    category: 'communication',
    actions: ['send_message'],
    events: [
      'control_status_change',
      'incident_created',
      'task_overdue',
      'policy_published',
    ],
  },
} as const;

export type IntegrationProvider = keyof typeof INTEGRATION_CATALOG;

export async function getOrgIntegrations(orgId: string) {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('org_integrations')
    .select('*')
    .eq('org_id', orgId)
    .order('provider');
  return data || [];
}

export async function connectIntegration(
  orgId: string,
  provider: IntegrationProvider,
  config: Record<string, unknown>,
  createdBy: string,
) {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from('org_integrations')
    .upsert(
      {
        org_id: orgId,
        provider,
        status: 'active',
        config,
        created_by: createdBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,provider' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function disconnectIntegration(
  orgId: string,
  integrationId: string,
) {
  const db = await createSupabaseServerClient();
  await db
    .from('org_integrations')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .eq('id', integrationId)
    .eq('org_id', orgId);
}

export async function getEventMappings(orgId: string, integrationId: string) {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('integration_event_mappings')
    .select('*')
    .eq('org_id', orgId)
    .eq('integration_id', integrationId);
  return data || [];
}

export async function createEventMapping(
  orgId: string,
  integrationId: string,
  mapping: { event: string; action: string; config?: Record<string, unknown> },
) {
  const db = await createSupabaseServerClient();
  const { error } = await db.from('integration_event_mappings').insert({
    org_id: orgId,
    integration_id: integrationId,
    formaos_event: mapping.event,
    integration_action: mapping.action,
    config: mapping.config || {},
  });
  if (error) throw error;
}

export async function logSyncEvent(
  orgId: string,
  integrationId: string,
  event: {
    eventType: string;
    direction: 'inbound' | 'outbound';
    status: 'success' | 'error' | 'skipped';
    payload?: Record<string, unknown>;
    errorMessage?: string;
    durationMs?: number;
  },
) {
  const db = await createSupabaseServerClient();
  await db.from('integration_sync_log').insert({
    org_id: orgId,
    integration_id: integrationId,
    event_type: event.eventType,
    direction: event.direction,
    status: event.status,
    payload: event.payload || {},
    error_message: event.errorMessage,
    duration_ms: event.durationMs,
  });
}

export async function getSyncLog(
  orgId: string,
  integrationId: string,
  limit = 50,
) {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('integration_sync_log')
    .select('*')
    .eq('org_id', orgId)
    .eq('integration_id', integrationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

// ------------------------------------------------------------------
// Connector stubs (actual API calls would go here)
// ------------------------------------------------------------------

export async function sendSlackMessage(
  webhookUrl: string,
  message: { text: string; channel?: string },
) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  if (!res.ok) throw new Error(`Slack webhook failed: ${res.status}`);
}

export async function postTeamsMessage(
  webhookUrl: string,
  message: { text: string },
) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message.text }),
  });
  if (!res.ok) throw new Error(`Teams webhook failed: ${res.status}`);
}

export async function postWebhook(
  url: string,
  payload: Record<string, unknown>,
) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Webhook POST failed: ${res.status}`);
}

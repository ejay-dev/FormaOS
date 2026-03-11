/**
 * =========================================================
 * Jira Integration
 * =========================================================
 * Sync compliance tasks with Jira issues.
 * Creates issues, updates status, and links evidence.
 *
 * Auth: OAuth 2.0 (3LO) via Atlassian Connect
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';

export type JiraEventType =
  | 'task_created'
  | 'task_completed'
  | 'task_overdue'
  | 'evidence_uploaded'
  | 'compliance_alert';

export interface JiraConfig {
  organizationId: string;
  cloudId: string;
  accessToken: string;
  refreshToken: string;
  projectKey: string;
  issueTypeId: string;
  enabledEvents: JiraEventType[];
  enabled: boolean;
}

interface JiraIssuePayload {
  fields: {
    project: { key: string };
    summary: string;
    description: {
      type: 'doc';
      version: 1;
      content: Array<{
        type: 'paragraph';
        content: Array<{ type: 'text'; text: string }>;
      }>;
    };
    issuetype: { id: string };
    labels?: string[];
    priority?: { name: string };
  };
}

/**
 * Get Jira config for an organization
 */
async function getJiraConfig(orgId: string): Promise<JiraConfig | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('integration_configs')
    .select('*')
    .eq('organization_id', orgId)
    .eq('provider', 'jira')
    .eq('enabled', true)
    .maybeSingle();

  if (!data) return null;
  const config = data.config as Record<string, unknown>;

  return {
    organizationId: orgId,
    cloudId: config.cloud_id as string,
    accessToken: config.access_token as string,
    refreshToken: config.refresh_token as string,
    projectKey: config.project_key as string,
    issueTypeId: config.issue_type_id as string,
    enabledEvents: (config.enabled_events as JiraEventType[]) ?? [],
    enabled: true,
  };
}

/**
 * Create a Jira issue from a compliance task
 */
export async function createJiraIssue(
  orgId: string,
  task: {
    id: string;
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    framework?: string;
    controlRef?: string;
  },
): Promise<{ success: boolean; issueKey?: string; error?: string }> {
  const config = await getJiraConfig(orgId);
  if (!config) return { success: false, error: 'Jira not configured' };

  const payload: JiraIssuePayload = {
    fields: {
      project: { key: config.projectKey },
      summary: `[Compliance] ${task.title}`,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: [
                  task.description ?? '',
                  task.framework ? `Framework: ${task.framework}` : '',
                  task.controlRef ? `Control: ${task.controlRef}` : '',
                  task.dueDate ? `Due: ${task.dueDate}` : '',
                  `Source: FormaOS (Task ${task.id})`,
                ]
                  .filter(Boolean)
                  .join('\n'),
              },
            ],
          },
        ],
      },
      issuetype: { id: config.issueTypeId },
      labels: ['formaos', 'compliance'],
      priority: task.priority ? { name: mapPriority(task.priority) } : undefined,
    },
  };

  try {
    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${config.cloudId}/rest/api/3/issue`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, error: `Jira API error: ${response.status} ${errorBody}` };
    }

    const result = await response.json();

    // Store mapping
    const supabase = await createClient();
    await supabase.from('integration_sync_log').insert({
      organization_id: orgId,
      provider: 'jira',
      local_entity_type: 'task',
      local_entity_id: task.id,
      remote_entity_id: result.key,
      remote_url: `https://${config.cloudId}.atlassian.net/browse/${result.key}`,
      sync_type: 'push',
    });

    return { success: true, issueKey: result.key };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update Jira issue status when task status changes
 */
export async function syncTaskStatusToJira(
  orgId: string,
  taskId: string,
  status: 'completed' | 'in_progress' | 'pending',
): Promise<{ success: boolean; error?: string }> {
  const config = await getJiraConfig(orgId);
  if (!config) return { success: false, error: 'Jira not configured' };

  const supabase = await createClient();
  const { data: syncLog } = await supabase
    .from('integration_sync_log')
    .select('remote_entity_id')
    .eq('organization_id', orgId)
    .eq('provider', 'jira')
    .eq('local_entity_type', 'task')
    .eq('local_entity_id', taskId)
    .maybeSingle();

  if (!syncLog?.remote_entity_id) return { success: false, error: 'No synced Jira issue' };

  // Get available transitions
  const issueKey = syncLog.remote_entity_id;
  const transResponse = await fetch(
    `https://api.atlassian.com/ex/jira/${config.cloudId}/rest/api/3/issue/${issueKey}/transitions`,
    {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        Accept: 'application/json',
      },
    },
  );

  if (!transResponse.ok) return { success: false, error: 'Failed to get transitions' };

  const { transitions } = await transResponse.json();
  const targetName = status === 'completed' ? 'Done' : status === 'in_progress' ? 'In Progress' : 'To Do';
  const transition = transitions.find(
    (t: { name: string }) => t.name.toLowerCase().includes(targetName.toLowerCase()),
  );

  if (!transition) return { success: false, error: `No matching transition for ${targetName}` };

  const result = await fetch(
    `https://api.atlassian.com/ex/jira/${config.cloudId}/rest/api/3/issue/${issueKey}/transitions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transition: { id: transition.id } }),
    },
  );

  return { success: result.ok };
}

function mapPriority(priority: string): string {
  const map: Record<string, string> = {
    critical: 'Highest',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return map[priority.toLowerCase()] ?? 'Medium';
}

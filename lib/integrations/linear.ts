/**
 * =========================================================
 * Linear Integration
 * =========================================================
 * Sync compliance tasks with Linear issues.
 * Uses Linear's GraphQL API.
 *
 * Auth: OAuth 2.0 or API key
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';

export type LinearEventType =
  | 'task_created'
  | 'task_completed'
  | 'task_overdue'
  | 'compliance_alert';

export interface LinearConfig {
  organizationId: string;
  apiKey: string;
  teamId: string;
  enabledEvents: LinearEventType[];
  enabled: boolean;
}

const LINEAR_API = 'https://api.linear.app/graphql';

/**
 * Get Linear config for an organization
 */
async function getLinearConfig(orgId: string): Promise<LinearConfig | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('integration_configs')
    .select('*')
    .eq('organization_id', orgId)
    .eq('provider', 'linear')
    .eq('enabled', true)
    .maybeSingle();

  if (!data) return null;
  const config = data.config as Record<string, unknown>;

  return {
    organizationId: orgId,
    apiKey: config.api_key as string,
    teamId: config.team_id as string,
    enabledEvents: (config.enabled_events as LinearEventType[]) ?? [],
    enabled: true,
  };
}

/**
 * Execute a GraphQL query against Linear API
 */
async function linearQuery(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data?: Record<string, unknown>; errors?: Array<{ message: string }> }> {
  const response = await fetch(LINEAR_API, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Linear API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a Linear issue from a compliance task
 */
export async function createLinearIssue(
  orgId: string,
  task: {
    id: string;
    title: string;
    description?: string;
    priority?: number;
    dueDate?: string;
    framework?: string;
    controlRef?: string;
  },
): Promise<{ success: boolean; issueId?: string; identifier?: string; error?: string }> {
  const config = await getLinearConfig(orgId);
  if (!config) return { success: false, error: 'Linear not configured' };

  const description = [
    task.description ?? '',
    '',
    task.framework ? `**Framework:** ${task.framework}` : '',
    task.controlRef ? `**Control:** ${task.controlRef}` : '',
    task.dueDate ? `**Due:** ${task.dueDate}` : '',
    '',
    `_Synced from FormaOS (Task ${task.id})_`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }
  `;

  try {
    const result = await linearQuery(config.apiKey, mutation, {
      input: {
        teamId: config.teamId,
        title: `[Compliance] ${task.title}`,
        description,
        priority: task.priority ?? 3,
        dueDate: task.dueDate,
        labelIds: [],
      },
    });

    if (result.errors?.length) {
      return { success: false, error: result.errors[0].message };
    }

    const issueCreate = (result.data as Record<string, Record<string, unknown>>)?.issueCreate;
    const issue = issueCreate?.issue as { id: string; identifier: string; url: string } | undefined;
    if (!issue) return { success: false, error: 'No issue returned' };

    // Store mapping
    const supabase = await createClient();
    await supabase.from('integration_sync_log').insert({
      organization_id: orgId,
      provider: 'linear',
      local_entity_type: 'task',
      local_entity_id: task.id,
      remote_entity_id: issue.id,
      remote_url: issue.url,
      sync_type: 'push',
    });

    return { success: true, issueId: issue.id, identifier: issue.identifier };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update Linear issue state when task status changes
 */
export async function syncTaskStatusToLinear(
  orgId: string,
  taskId: string,
  status: 'completed' | 'in_progress' | 'pending',
): Promise<{ success: boolean; error?: string }> {
  const config = await getLinearConfig(orgId);
  if (!config) return { success: false, error: 'Linear not configured' };

  const supabase = await createClient();
  const { data: syncLog } = await supabase
    .from('integration_sync_log')
    .select('remote_entity_id')
    .eq('organization_id', orgId)
    .eq('provider', 'linear')
    .eq('local_entity_type', 'task')
    .eq('local_entity_id', taskId)
    .maybeSingle();

  if (!syncLog?.remote_entity_id) return { success: false, error: 'No synced Linear issue' };

  // Get team workflow states
  const statesQuery = `
    query TeamStates($teamId: String!) {
      team(id: $teamId) {
        states {
          nodes {
            id
            name
            type
          }
        }
      }
    }
  `;

  try {
    const statesResult = await linearQuery(config.apiKey, statesQuery, {
      teamId: config.teamId,
    });

    const team = (statesResult.data as Record<string, Record<string, unknown>>)?.team;
    const stateNodes = (team?.states as { nodes: Array<{ id: string; name: string; type: string }> })?.nodes ?? [];

    const targetType =
      status === 'completed' ? 'completed' : status === 'in_progress' ? 'started' : 'unstarted';

    const targetState = stateNodes.find(
      (s: { type: string }) => s.type === targetType,
    );

    if (!targetState) return { success: false, error: `No matching state for ${status}` };

    const mutation = `
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
        }
      }
    `;

    const updateResult = await linearQuery(config.apiKey, mutation, {
      id: syncLog.remote_entity_id,
      input: { stateId: targetState.id },
    });

    const issueUpdate = (updateResult.data as Record<string, Record<string, unknown>>)?.issueUpdate;
    return { success: !!issueUpdate?.success };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

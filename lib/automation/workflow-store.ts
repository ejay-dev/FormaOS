import { randomUUID } from 'node:crypto';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { automationLogger } from '@/lib/observability/structured-logger';
import type {
  ApprovalDecision,
  ApprovalRequest,
  CreateWorkflowRequest,
  ExecutionHistoryFilters,
  WorkflowApprovalRecord,
  WorkflowDefinition,
  WorkflowExecutionRecord,
  WorkflowExecutionStatus,
  WorkflowExecutionSummary,
  WorkflowListFilters,
  WorkflowStatus,
  UpdateWorkflowRequest,
} from './workflow-types';
import { normalizeWorkflowStatus } from './workflow-types';

type DefinitionRow = {
  row_id?: string;
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  version: number;
  definition: Record<string, unknown> | null;
  enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type ExecutionRow = {
  id: string;
  workflow_id: string;
  org_id: string;
  workflow_version: number;
  trigger_event: Record<string, unknown> | null;
  status: WorkflowExecutionStatus;
  started_at: string;
  completed_at: string | null;
  error: string | null;
  execution_trace: Record<string, unknown> | null;
  current_step_id?: string | null;
  context_snapshot?: Record<string, unknown> | null;
  workflow_definitions?: { name?: string | null } | { name?: string | null }[];
};

type ApprovalRow = {
  id: string;
  execution_id: string;
  step_id: string;
  approvers: string[] | null;
  status: WorkflowApprovalRecord['status'];
  approved_by: string | null;
  approved_at: string | null;
  timeout_at: string | null;
  decision: 'approve' | 'reject' | null;
  comment: string | null;
  workflow_executions?: { org_id?: string | null } | { org_id?: string | null }[];
};

function mapDefinitionRow(row: DefinitionRow): WorkflowDefinition {
  const definition = (row.definition ?? {}) as Partial<WorkflowDefinition>;
  const status = normalizeWorkflowStatus(
    definition.status,
    row.enabled,
  ) as WorkflowStatus;

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? definition.description ?? '',
    version: row.version,
    org_id: row.org_id,
    enabled: row.enabled,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    trigger: definition.trigger ?? { type: 'manual' },
    steps: definition.steps ?? [],
    variables: definition.variables ?? {},
    tags: definition.tags ?? [],
    status,
    orgId: row.org_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExecutionRow(row: ExecutionRow): WorkflowExecutionRecord {
  const trace = row.execution_trace;

  return {
    id: row.id,
    workflow_id: row.workflow_id,
    org_id: row.org_id,
    workflow_version: row.workflow_version,
    trigger_event: row.trigger_event ?? {},
    status: row.status,
    started_at: row.started_at,
    completed_at: row.completed_at,
    error: row.error,
    execution_trace: {
      steps: Array.isArray(trace?.steps) ? (trace.steps as any[]) : [],
      logs: Array.isArray(trace?.logs) ? (trace.logs as any[]) : [],
    },
    current_step_id: row.current_step_id ?? null,
    context_snapshot: row.context_snapshot ?? {},
    workflowId: row.workflow_id,
    orgId: row.org_id,
  };
}

function mapApprovalRow(row: ApprovalRow): WorkflowApprovalRecord {
  return {
    id: row.id,
    execution_id: row.execution_id,
    step_id: row.step_id,
    approvers: row.approvers ?? [],
    status: row.status,
    approved_by: row.approved_by,
    approved_at: row.approved_at,
    timeout_at: row.timeout_at,
    decision: row.decision,
    comment: row.comment,
  };
}

function buildDefinitionRecord(definition: WorkflowDefinition) {
  const status = normalizeWorkflowStatus(definition.status, definition.enabled);

  return {
    id: definition.id,
    org_id: definition.org_id,
    name: definition.name,
    description: definition.description,
    version: definition.version,
    definition: {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      version: definition.version,
      org_id: definition.org_id,
      enabled: definition.enabled,
      created_by: definition.created_by,
      created_at: definition.created_at,
      updated_at: definition.updated_at,
      status,
      trigger: definition.trigger,
      steps: definition.steps,
      variables: definition.variables ?? {},
      tags: definition.tags ?? [],
    },
    enabled: definition.enabled,
    created_by: definition.created_by,
    updated_at: definition.updated_at,
  };
}

export async function saveWorkflowDefinition(
  definition: WorkflowDefinition,
): Promise<WorkflowDefinition> {
  const supabase = createSupabaseAdminClient();
  const { data: existingRows, error: existingError } = await supabase
    .from('workflow_definitions')
    .select('*')
    .eq('id', definition.id)
    .order('version', { ascending: false })
    .limit(1);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const latest = existingRows?.[0] as DefinitionRow | undefined;
  const nextVersion = latest
    ? Math.max(latest.version + 1, definition.version)
    : definition.version;
  const timestamp = new Date().toISOString();
  const record = buildDefinitionRecord({
    ...definition,
    version: nextVersion,
    created_at: latest?.created_at ?? definition.created_at,
    updated_at: timestamp,
  });

  const { data, error } = await supabase
    .from('workflow_definitions')
    .insert(record)
    .select('*')
    .single();

  if (error || !data) {
    automationLogger.error(
      'Failed to save workflow definition',
      new Error(error?.message ?? 'Unknown error'),
      { workflowId: definition.id },
    );
    throw new Error(error?.message ?? 'Failed to save workflow definition');
  }

  return mapDefinitionRow(data as DefinitionRow);
}

export async function getWorkflowDefinition(
  id: string,
  version?: number,
): Promise<WorkflowDefinition | null> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('workflow_definitions')
    .select('*')
    .eq('id', id)
    .order('version', { ascending: false });

  if (version !== undefined) {
    query = query.eq('version', version);
  }

  if (version === undefined) {
    query = query.limit(1);
  }

  const { data, error } = version === undefined
    ? await query.maybeSingle()
    : await query.single();

  if (error || !data) {
    return null;
  }

  return mapDefinitionRow(data as DefinitionRow);
}

export async function listWorkflows(
  orgId: string,
  filters?: WorkflowListFilters,
): Promise<{ workflows: WorkflowDefinition[]; total: number }> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('workflow_definitions')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });

  if (filters?.enabled !== undefined) {
    query = query.eq('enabled', filters.enabled);
  }

  if (filters?.status) {
    query = query.eq('definition->>status', filters.status);
  }

  if (filters?.trigger) {
    query = query.eq('definition->trigger->>type', filters.trigger);
  }

  const { data, error, count } = await query;

  if (error) {
    automationLogger.error('Failed to list workflows', new Error(error.message), { orgId });
    return { workflows: [], total: 0 };
  }

  const latestByWorkflowId = new Map<string, DefinitionRow>();
  for (const row of (data ?? []) as DefinitionRow[]) {
    const existing = latestByWorkflowId.get(row.id);
    if (!existing || existing.version < row.version) {
      latestByWorkflowId.set(row.id, row);
    }
  }

  const dedupedRows = Array.from(latestByWorkflowId.values());
  const offset = filters?.offset ?? 0;
  const limitedRows =
    filters?.limit !== undefined
      ? dedupedRows.slice(offset, offset + filters.limit)
      : dedupedRows.slice(offset);

  return {
    workflows: limitedRows.map((row) => mapDefinitionRow(row)),
    total: latestByWorkflowId.size || count || 0,
  };
}

export async function getWorkflowExecutionHistory(
  workflowId: string,
  filters?: ExecutionHistoryFilters,
): Promise<WorkflowExecutionSummary[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('workflow_executions')
    .select('*, workflow_definitions(name)')
    .eq('workflow_id', workflowId)
    .order('started_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    automationLogger.error('Failed to load workflow execution history', new Error(error.message), {
      workflowId,
    });
    return [];
  }

  return (data ?? []).map((row: unknown) => {
    const execution = mapExecutionRow(row as ExecutionRow);
    const steps = execution.execution_trace.steps;
    const workflowDefinitions = (row as ExecutionRow).workflow_definitions;
    const relatedDefinition = Array.isArray(workflowDefinitions)
      ? workflowDefinitions[0]
      : workflowDefinitions;

    return {
      id: execution.id,
      workflowId: execution.workflow_id,
      workflowName: relatedDefinition?.name ?? 'Workflow',
      status: execution.status,
      startedAt: execution.started_at,
      completedAt: execution.completed_at,
      duration: execution.completed_at
        ? new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()
        : undefined,
      stepsTotal: steps.length,
      stepsCompleted: steps.filter((step) => step.status === 'success').length,
      stepsFailed: steps.filter((step) => step.status === 'failed').length,
    };
  });
}

export async function getExecutionDetail(
  executionId: string,
): Promise<WorkflowExecutionRecord | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('id', executionId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapExecutionRow(data as ExecutionRow);
}

export async function createWorkflowExecution(
  workflow: WorkflowDefinition,
  triggerEvent: Record<string, unknown>,
  contextSnapshot?: Record<string, unknown>,
): Promise<WorkflowExecutionRecord> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('workflow_executions')
    .insert({
      workflow_id: workflow.id,
      org_id: workflow.org_id,
      workflow_version: workflow.version,
      trigger_event: triggerEvent,
      status: 'running',
      execution_trace: { steps: [], logs: [] },
      context_snapshot: contextSnapshot ?? {},
      started_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create workflow execution');
  }

  return mapExecutionRow(data as ExecutionRow);
}

export async function updateWorkflowExecution(
  executionId: string,
  updates: Partial<WorkflowExecutionRecord>,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const record: Record<string, unknown> = {};

  if (updates.status !== undefined) record.status = updates.status;
  if (updates.completed_at !== undefined) record.completed_at = updates.completed_at;
  if (updates.error !== undefined) record.error = updates.error;
  if (updates.execution_trace !== undefined) record.execution_trace = updates.execution_trace;
  if (updates.current_step_id !== undefined) record.current_step_id = updates.current_step_id;
  if (updates.context_snapshot !== undefined) record.context_snapshot = updates.context_snapshot;

  const { error } = await supabase
    .from('workflow_executions')
    .update(record)
    .eq('id', executionId);

  if (error) {
    automationLogger.error('Failed to update workflow execution', new Error(error.message), {
      executionId,
    });
  }
}

export async function createWorkflowApproval(params: {
  executionId: string;
  stepId: string;
  approvers: string[];
  timeoutAt?: string;
}): Promise<WorkflowApprovalRecord> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('workflow_approvals')
    .insert({
      execution_id: params.executionId,
      step_id: params.stepId,
      approvers: params.approvers,
      status: 'pending',
      timeout_at: params.timeoutAt ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create workflow approval');
  }

  return mapApprovalRow(data as ApprovalRow);
}

export async function getPendingApprovals(
  orgId: string,
): Promise<WorkflowApprovalRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('workflow_approvals')
    .select('*, workflow_executions!inner(org_id)')
    .eq('workflow_executions.org_id', orgId)
    .eq('status', 'pending')
    .order('timeout_at', { ascending: true });

  if (error) {
    automationLogger.error('Failed to load pending approvals', new Error(error.message), { orgId });
    return [];
  }

  return (data ?? []).map((row: unknown) => mapApprovalRow(row as ApprovalRow));
}

export async function processApprovalDecision(
  decision: ApprovalDecision,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('workflow_approvals')
    .update({
      status: decision.decision === 'approve' ? 'approved' : 'rejected',
      approved_by: decision.decidedBy,
      approved_at: new Date().toISOString(),
      decision: decision.decision,
      comment: decision.comment ?? null,
    })
    .eq('execution_id', decision.executionId)
    .eq('step_id', decision.stepId)
    .eq('status', 'pending');

  if (error) {
    throw new Error(error.message);
  }
}

export async function listTimedOutApprovals(
  before: string,
): Promise<WorkflowApprovalRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('workflow_approvals')
    .select('*')
    .eq('status', 'pending')
    .lte('timeout_at', before);

  if (error) {
    automationLogger.error('Failed to list timed out approvals', new Error(error.message));
    return [];
  }

  return (data ?? []).map((row: unknown) => mapApprovalRow(row as ApprovalRow));
}

export async function markApprovalTimedOut(approvalId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from('workflow_approvals')
    .update({
      status: 'timed_out',
      approved_at: new Date().toISOString(),
    })
    .eq('id', approvalId);
}

export async function createWorkflow(
  orgId: string,
  userId: string,
  request: CreateWorkflowRequest,
): Promise<WorkflowDefinition> {
  const now = new Date().toISOString();
  const workflow: WorkflowDefinition = {
    id: randomUUID(),
    name: request.name,
    description: request.description ?? '',
    version: 1,
    org_id: orgId,
    enabled: request.enabled ?? request.status !== 'archived',
    created_by: userId,
    created_at: now,
    updated_at: now,
    trigger: request.trigger,
    steps: request.steps,
    variables: request.variables ?? {},
    tags: request.tags ?? [],
    status: normalizeWorkflowStatus(request.status, request.enabled),
  };

  return saveWorkflowDefinition(workflow);
}

export async function updateWorkflow(
  workflowId: string,
  orgId: string,
  request: UpdateWorkflowRequest,
): Promise<WorkflowDefinition> {
  const current = await getWorkflowDefinition(workflowId);

  if (!current || current.org_id !== orgId) {
    throw new Error('Workflow not found');
  }

  return saveWorkflowDefinition({
    ...current,
    name: request.name ?? current.name,
    description: request.description ?? current.description,
    version: current.version + 1,
    enabled: request.enabled ?? current.enabled,
    trigger: request.trigger ?? current.trigger,
    steps: request.steps ?? current.steps,
    variables: request.variables ?? current.variables,
    tags: request.tags ?? current.tags,
    status: normalizeWorkflowStatus(request.status ?? current.status, request.enabled ?? current.enabled),
    updated_at: new Date().toISOString(),
  });
}

export async function getWorkflow(
  workflowId: string,
  orgId: string,
): Promise<WorkflowDefinition | null> {
  const workflow = await getWorkflowDefinition(workflowId);
  return workflow && workflow.org_id === orgId ? workflow : null;
}

export async function deleteWorkflow(
  workflowId: string,
  orgId: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('workflow_definitions')
    .delete()
    .eq('id', workflowId)
    .eq('org_id', orgId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getActiveWorkflowsByTrigger(
  orgId: string,
  triggerType: string,
): Promise<WorkflowDefinition[]> {
  const result = await listWorkflows(orgId, {
    enabled: true,
    trigger: triggerType as any,
    limit: 200,
  });

  return result.workflows.filter((workflow) => workflow.status !== 'archived');
}

export async function createExecution(
  workflow: WorkflowDefinition,
  triggerData: Record<string, unknown>,
): Promise<WorkflowExecutionRecord> {
  return createWorkflowExecution(workflow, triggerData);
}

export async function updateExecution(
  executionId: string,
  updates: Partial<{
    status: WorkflowExecutionStatus;
    completedAt: string;
    error: string;
    stepExecutions: unknown;
    currentStepId: string;
    variables: Record<string, unknown>;
    executionTrace: unknown;
  }>,
): Promise<void> {
  const current = await getExecutionDetail(executionId);
  if (!current) {
    return;
  }

  await updateWorkflowExecution(executionId, {
    ...current,
    status: updates.status ?? current.status,
    completed_at: updates.completedAt ?? current.completed_at,
    error: updates.error ?? current.error,
    current_step_id: updates.currentStepId ?? current.current_step_id,
    context_snapshot: updates.variables
      ? { ...(current.context_snapshot ?? {}), variables: updates.variables }
      : current.context_snapshot,
    execution_trace:
      updates.executionTrace && typeof updates.executionTrace === 'object'
        ? (updates.executionTrace as WorkflowExecutionRecord['execution_trace'])
        : current.execution_trace,
  });
}

export async function getExecution(executionId: string): Promise<WorkflowExecutionRecord | null> {
  return getExecutionDetail(executionId);
}

export async function listExecutions(
  orgId: string,
  options?: {
    workflowId?: string;
    status?: WorkflowExecutionStatus;
    limit?: number;
    offset?: number;
  },
): Promise<{ executions: WorkflowExecutionSummary[]; total: number }> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('workflow_executions')
    .select('*, workflow_definitions(name)', { count: 'exact' })
    .eq('org_id', orgId)
    .order('started_at', { ascending: false });

  if (options?.workflowId) {
    query = query.eq('workflow_id', options.workflowId);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset !== undefined && options.limit) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    automationLogger.error('Failed to list executions', new Error(error.message), { orgId });
    return { executions: [], total: 0 };
  }

  const executions = (data ?? []).map((row: unknown) => {
    const execution = mapExecutionRow(row as ExecutionRow);
    const workflowDefinitions = (row as ExecutionRow).workflow_definitions;
    const workflowName = Array.isArray(workflowDefinitions)
      ? workflowDefinitions[0]?.name
      : workflowDefinitions?.name;

    return {
      id: execution.id,
      workflowId: execution.workflow_id,
      workflowName: workflowName ?? 'Workflow',
      status: execution.status,
      startedAt: execution.started_at,
      completedAt: execution.completed_at,
      duration: execution.completed_at
        ? new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()
        : undefined,
      stepsTotal: execution.execution_trace.steps.length,
      stepsCompleted: execution.execution_trace.steps.filter((step) => step.status === 'success')
        .length,
      stepsFailed: execution.execution_trace.steps.filter((step) => step.status === 'failed').length,
    } satisfies WorkflowExecutionSummary;
  });

  return {
    executions,
    total: count ?? executions.length,
  };
}

export async function createApprovalRequest(request: ApprovalRequest): Promise<void> {
  await createWorkflowApproval({
    executionId: request.executionId,
    stepId: request.stepId,
    approvers: request.approvers,
    timeoutAt: request.timeoutAt,
  });
}

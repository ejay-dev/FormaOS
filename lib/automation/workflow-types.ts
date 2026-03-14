import type { TriggerType as LegacyEngineTriggerType } from '@/lib/workflow-engine';

export type WorkflowTriggerType =
  | LegacyEngineTriggerType
  | 'member_removed'
  | 'evidence_uploaded'
  | 'evidence_verified'
  | 'evidence_rejected'
  | 'evidence_expiry'
  | 'control_failed'
  | 'control_status_updated'
  | 'policy_review_due'
  | 'risk_score_change'
  | 'compliance_score_changed'
  | 'manual'
  | 'webhook'
  | 'incident_created'
  | 'vendor_added'
  | 'vendor_assessed'
  | 'quarterly_review'
  | 'audit_preparation';

export type WorkflowActionType =
  | 'send_notification'
  | 'send_email'
  | 'create_task'
  | 'assign_task'
  | 'update_status'
  | 'update_field'
  | 'escalate'
  | 'webhook'
  | 'log_activity'
  | 'calculate_compliance_score'
  | 'generate_report'
  | 'create_incident_room'
  | 'create_approval_task'
  | 'set_variable';

export type WorkflowStepType =
  | 'action'
  | 'condition'
  | 'approval'
  | 'parallel'
  | 'delay'
  | 'loop';

export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'exists'
  | 'not_exists'
  | 'matches';

export type StepErrorPolicy = 'stop' | 'continue' | 'retry';

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';

export type WorkflowExecutionStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'waiting_approval'
  | 'waiting_delay'
  | 'paused';

export type ExecutionResultStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'skipped'
  | 'waiting_approval'
  | 'waiting_delay'
  | 'paused';

export type ApprovalDecisionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'timed_out'
  | 'escalated';

export type DurationUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks';

export type Duration =
  | number
  | `${number}${'s' | 'm' | 'h' | 'd' | 'w'}`
  | {
      amount: number;
      unit: DurationUnit;
    };

export interface Condition {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
}

export interface TriggerNode {
  type: WorkflowTriggerType;
  filters?: Record<string, unknown>;
  schedule?: {
    cron: string;
    timezone?: string;
  };
  webhookSecret?: string;
  label?: string;
}

interface BaseStep {
  id: string;
  type: WorkflowStepType;
  name: string;
  description?: string;
  enabled?: boolean;
}

export interface ActionStep extends BaseStep {
  type: 'action';
  action: WorkflowActionType;
  config: Record<string, unknown>;
  onError: StepErrorPolicy;
  actionType?: WorkflowActionType;
}

export interface ConditionStep extends BaseStep {
  type: 'condition';
  conditions: Condition[];
  combinator?: 'and' | 'or';
  thenSteps: WorkflowStep[];
  elseSteps?: WorkflowStep[];
}

export interface ApprovalStep extends BaseStep {
  type: 'approval';
  approvers: string[];
  timeout: Duration;
  onTimeout: 'approve' | 'reject' | 'escalate';
  timeoutEscalateTo?: string[];
  instructions?: string;
}

export interface ParallelStep extends BaseStep {
  type: 'parallel';
  branches: WorkflowStep[][];
  waitForAll?: boolean;
}

export interface DelayStep extends BaseStep {
  type: 'delay';
  duration: Duration;
}

export interface LoopStep extends BaseStep {
  type: 'loop';
  collection: string;
  itemVariable: string;
  steps: WorkflowStep[];
  maxIterations: number;
}

export type WorkflowStep =
  | ActionStep
  | ConditionStep
  | ApprovalStep
  | ParallelStep
  | DelayStep
  | LoopStep;

export interface WorkflowVariable {
  type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'date'
    | 'array'
    | 'object'
    | 'any';
  defaultValue?: unknown;
  description?: string;
  required?: boolean;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: number;
  org_id: string;
  enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  trigger: TriggerNode;
  steps: WorkflowStep[];
  variables?: Record<string, WorkflowVariable>;
  tags?: string[];
  status?: WorkflowStatus;
  orgId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowExecutionTrace {
  steps: ExecutionResult[];
  logs?: Array<{
    at: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    stepId?: string;
    details?: Record<string, unknown>;
  }>;
}

export interface WorkflowExecutionRecord {
  id: string;
  workflow_id: string;
  org_id: string;
  workflow_version: number;
  trigger_event: Record<string, unknown>;
  status: WorkflowExecutionStatus;
  started_at: string;
  completed_at?: string | null;
  error?: string | null;
  execution_trace: WorkflowExecutionTrace;
  current_step_id?: string | null;
  context_snapshot?: Record<string, unknown>;
  workflowId?: string;
  orgId?: string;
}

export interface WorkflowApprovalRecord {
  id: string;
  execution_id: string;
  step_id: string;
  approvers: string[];
  status: ApprovalDecisionStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  timeout_at?: string | null;
  decision?: 'approve' | 'reject' | null;
  comment?: string | null;
}

export interface ExecutionResult {
  stepId: string;
  status: ExecutionResultStatus;
  output?: unknown;
  error?: string;
  duration: number;
  startedAt: string;
  completedAt?: string;
  childResults?: ExecutionResult[];
  attemptCount?: number;
}

export interface WorkflowExecutionContextInput {
  trigger: {
    type: WorkflowTriggerType;
    data: Record<string, unknown>;
    timestamp?: string;
  };
  execution?: WorkflowExecutionRecord;
  variables?: Record<string, unknown>;
  stepOutputs?: Record<string, unknown>;
  env?: Record<string, unknown>;
  actor?: {
    id?: string;
    email?: string;
  };
}

export interface ExecuteWorkflowOptions {
  persist?: boolean;
  executionId?: string;
  resumeFromStepId?: string;
  resumeData?: Record<string, unknown>;
  maxRetries?: number;
}

export interface ExecuteWorkflowResult {
  execution: WorkflowExecutionRecord;
  context: WorkflowRuntimeState;
  trace: WorkflowExecutionTrace;
}

export interface WorkflowRuntimeState {
  variables: Record<string, unknown>;
  stepOutputs: Record<string, unknown>;
  env: Record<string, unknown>;
}

export interface WorkflowListFilters {
  enabled?: boolean;
  trigger?: WorkflowTriggerType;
  status?: WorkflowStatus;
  limit?: number;
  offset?: number;
}

export interface ExecutionHistoryFilters {
  status?: WorkflowExecutionStatus;
  limit?: number;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  enabled?: boolean;
  status?: WorkflowStatus;
  trigger: TriggerNode;
  steps: WorkflowStep[];
  variables?: Record<string, WorkflowVariable>;
  tags?: string[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  status?: WorkflowStatus;
  trigger?: TriggerNode;
  steps?: WorkflowStep[];
  variables?: Record<string, WorkflowVariable>;
  tags?: string[];
}

export interface WorkflowExecutionSummary {
  id: string;
  workflowId: string;
  workflowName: string;
  status: WorkflowExecutionStatus;
  startedAt: string;
  completedAt?: string | null;
  duration?: number;
  stepsTotal: number;
  stepsCompleted: number;
  stepsFailed: number;
}

export interface ApprovalRequest {
  executionId: string;
  stepId: string;
  approvers: string[];
  timeoutAt?: string;
}

export interface ApprovalDecision {
  executionId: string;
  stepId: string;
  decision: 'approve' | 'reject';
  decidedBy: string;
  comment?: string;
}

export interface WorkflowTemplateMetadata {
  name: string;
  description: string;
  industry: string[];
  framework: string[];
  triggerType: WorkflowTriggerType;
  estimatedSetupTime: string;
}

export interface WorkflowTemplateDefinition extends WorkflowTemplateMetadata {
  id: string;
  definition: Omit<
    WorkflowDefinition,
    'id' | 'version' | 'org_id' | 'enabled' | 'created_by' | 'created_at' | 'updated_at'
  >;
}

export type WorkflowCategory =
  | 'certification'
  | 'review'
  | 'onboarding'
  | 'incident'
  | 'vendor'
  | 'policy'
  | 'audit';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category?: WorkflowCategory;
  trigger: TriggerNode;
  steps: WorkflowStep[];
  variables?: Record<string, WorkflowVariable>;
  tags?: string[];
  estimatedDuration?: string;
}

export interface LegacyWorkflowRuleAction {
  type: WorkflowActionType;
  config: Record<string, unknown>;
}

export interface LegacyWorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: LegacyEngineTriggerType;
  conditions?: Record<string, unknown>;
  actions: LegacyWorkflowRuleAction[];
  enabled: boolean;
  org_id: string;
}

export function normalizeWorkflowStatus(
  status?: WorkflowStatus,
  enabled?: boolean,
): WorkflowStatus {
  if (status) {
    return status;
  }

  return enabled === false ? 'paused' : 'active';
}

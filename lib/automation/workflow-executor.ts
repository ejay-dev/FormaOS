import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity/feed';
import { notify } from '@/lib/notifications/engine';
import { triggerTaskIfConfigured } from '@/lib/trigger/client';
import { automationLogger } from '@/lib/observability/structured-logger';
import { validateWebhookUrl } from '@/lib/security/url-validator';
import {
  WorkflowContext,
  durationToMs,
} from './workflow-context';
import {
  createApprovalRequest,
  createExecution,
  createWorkflowExecution,
  updateWorkflowExecution,
} from './workflow-store';
import type {
  ActionStep,
  ExecuteWorkflowOptions,
  ExecuteWorkflowResult,
  ExecutionResult,
  StepErrorPolicy,
  WorkflowDefinition,
  WorkflowExecutionContextInput,
  WorkflowExecutionRecord,
  WorkflowExecutionStatus,
  WorkflowStep,
} from './workflow-types';

const DEFAULT_MAX_RETRIES = 3;
const INLINE_DELAY_THRESHOLD_MS = 30_000;

class WorkflowPauseSignal extends Error {
  constructor(
    readonly status: 'waiting_approval' | 'waiting_delay',
    readonly stepId: string,
  ) {
    super('__WORKFLOW_PAUSED__');
  }
}

interface ExecutionState {
  resumeFromStepId?: string;
  resumeData?: Record<string, unknown>;
  resumeSatisfied: boolean;
}

interface StepRunOutcome {
  result: ExecutionResult;
  halted?: boolean;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cloneResult(result: ExecutionResult): ExecutionResult {
  return {
    ...result,
    childResults: result.childResults?.map(cloneResult),
  };
}

function stepContainsId(step: WorkflowStep, targetStepId: string): boolean {
  if (step.id === targetStepId) {
    return true;
  }

  if (step.type === 'condition') {
    return (
      step.thenSteps.some((child) => stepContainsId(child, targetStepId)) ||
      (step.elseSteps ?? []).some((child) => stepContainsId(child, targetStepId))
    );
  }

  if (step.type === 'parallel') {
    return step.branches.some((branch) =>
      branch.some((child) => stepContainsId(child, targetStepId)),
    );
  }

  if (step.type === 'loop') {
    return step.steps.some((child) => stepContainsId(child, targetStepId));
  }

  return false;
}

function shouldTraverseForResume(step: WorkflowStep, state: ExecutionState): boolean {
  if (!state.resumeFromStepId || state.resumeSatisfied) {
    return true;
  }

  return stepContainsId(step, state.resumeFromStepId);
}

function toDelayString(ms: number): string {
  const seconds = Math.max(1, Math.ceil(ms / 1000));

  if (seconds % 604800 === 0) return `${seconds / 604800}w`;
  if (seconds % 86400 === 0) return `${seconds / 86400}d`;
  if (seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
}

async function persistTrace(
  execution: WorkflowExecutionRecord,
  context: WorkflowContext,
  status?: WorkflowExecutionStatus,
): Promise<void> {
  await updateWorkflowExecution(execution.id, {
    status: status ?? execution.status,
    current_step_id: execution.current_step_id,
    execution_trace: execution.execution_trace,
    context_snapshot: context.getRuntimeState() as unknown as Record<string, unknown>,
    completed_at: execution.completed_at,
    error: execution.error,
  });
}

async function performAction(
  step: ActionStep,
  context: WorkflowContext,
  workflow: WorkflowDefinition,
): Promise<unknown> {
  const config = context.resolveObject(step.config);
  const supabase = createSupabaseAdminClient();

  switch (step.action) {
    case 'send_notification': {
      const userId = String((config.userId ?? config.assignedTo) ?? '');
      if (userId) {
        await notify(workflow.org_id, [userId], {
          type: 'workflow.approval_requested',
          title: String(config.title ?? 'Workflow notification'),
          body: String(config.message ?? ''),
          priority:
            config.type === 'warning' || config.type === 'error'
              ? 'high'
              : 'normal',
          data: {
            href:
              typeof config.actionUrl === 'string'
                ? config.actionUrl
                : '/app/workflows',
            dedupeKey: `workflow.notify:${workflow.id}:${step.id}:${userId}`,
          },
        });
      }
      return { sent: Boolean(userId), userId };
    }

    case 'send_email':
      automationLogger.info('Workflow email action queued', {
        workflowId: workflow.id,
        to: config.to,
        subject: config.subject,
      });
      return { queued: true, to: config.to, subject: config.subject };

    case 'create_task':
    case 'assign_task': {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          org_id: workflow.org_id,
          title: config.title,
          description: config.description,
          assigned_to: config.assignedTo ?? null,
          due_date: config.dueDate ?? null,
          priority: config.priority ?? 'medium',
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { taskId: data?.id };
    }

    case 'update_status': {
      if (!config.table || !config.recordId) {
        return { skipped: true, reason: 'table/recordId required' };
      }

      const { error } = await supabase
        .from(String(config.table))
        .update({ status: config.status })
        .eq('id', String(config.recordId));

      if (error) {
        throw new Error(error.message);
      }

      return { updated: true };
    }

    case 'update_field': {
      if (!config.table || !config.recordId || !config.field) {
        return { skipped: true, reason: 'table/recordId/field required' };
      }

      const { error } = await supabase
        .from(String(config.table))
        .update({ [String(config.field)]: config.value })
        .eq('id', String(config.recordId));

      if (error) {
        throw new Error(error.message);
      }

      return { updated: true };
    }

    case 'escalate': {
      const { data, error } = await supabase
        .from('org_members')
        .select('user_id')
        .eq('organization_id', workflow.org_id)
        .in('role', ['owner', 'admin', 'compliance_officer']);

      if (error) {
        throw new Error(error.message);
      }

      await Promise.all(
        (data ?? []).map((member: { user_id: string }) =>
          notify(workflow.org_id, [member.user_id], {
            type: 'incident.escalated',
            title: String(config.title ?? 'Escalation required'),
            body: String(config.message ?? ''),
            priority: 'high',
            data: {
              href:
                typeof config.actionUrl === 'string'
                  ? config.actionUrl
                  : '/app/workflows',
              dedupeKey: `workflow.escalate:${workflow.id}:${step.id}:${member.user_id}`,
            },
          }),
        ),
      );

      return { escalatedTo: (data ?? []).length };
    }

    case 'webhook': {
      await validateWebhookUrl(String(config.url));
      const response = await fetch(String(config.url), {
        method: String(config.method ?? 'POST'),
        headers: {
          'Content-Type': 'application/json',
          ...((config.headers as Record<string, string> | undefined) ?? {}),
        },
        body: JSON.stringify(config.body ?? {}),
      });

      return { ok: response.ok, status: response.status };
    }

    case 'log_activity':
      await logActivity(
        workflow.org_id,
        String(context.evaluate('actor.id') ?? '') || null,
        String(config.action ?? 'updated'),
        {
          type: String(config.resourceType ?? 'workflow'),
          id: String(config.resourceId ?? workflow.id),
          name: String(config.resourceName ?? workflow.name ?? workflow.id),
          path:
            typeof config.path === 'string' ? config.path : '/app/workflows',
        },
        (config.details as Record<string, unknown> | undefined) ?? {},
      );
      return { logged: true };

    case 'calculate_compliance_score': {
      const { updateComplianceScore } = await import('./compliance-score-engine');
      await updateComplianceScore(workflow.org_id);
      return { recalculated: true };
    }

    case 'generate_report':
      return { queued: true, reportType: config.reportType ?? 'compliance' };

    case 'create_incident_room':
      return {
        created: true,
        roomName: config.roomName ?? `incident-${Date.now()}`,
      };

    case 'create_approval_task':
      return {
        created: true,
        assignedTo: config.assignedTo ?? null,
      };

    case 'set_variable':
      context.setVariable(String(config.name), config.value);
      return { name: config.name, value: config.value };

    default:
      return { skipped: true, reason: `Unsupported action ${step.action}` };
  }
}

async function runActionWithPolicy(
  step: ActionStep,
  context: WorkflowContext,
  workflow: WorkflowDefinition,
  maxRetries: number,
): Promise<{ output?: unknown; error?: string; attempts: number }> {
  const policy: StepErrorPolicy = step.onError ?? 'stop';
  let attempts = 0;

  while (attempts < Math.max(1, maxRetries)) {
    attempts += 1;

    try {
      const output = await performAction(step, context, workflow);
      return { output, attempts };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (policy !== 'retry' || attempts >= maxRetries) {
        if (policy === 'continue') {
          automationLogger.warn('Workflow action failed and continued', {
            workflowId: workflow.id,
            stepId: step.id,
            error: message,
          });
          return { error: message, attempts };
        }

        throw error;
      }

      await wait(250 * attempts * attempts);
    }
  }

  return { attempts };
}

async function executeStep(
  step: WorkflowStep,
  workflow: WorkflowDefinition,
  execution: WorkflowExecutionRecord,
  context: WorkflowContext,
  options: Required<Pick<ExecuteWorkflowOptions, 'persist' | 'maxRetries'>>,
  state: ExecutionState,
): Promise<StepRunOutcome | null> {
  if (step.enabled === false) {
    return {
      result: {
        stepId: step.id,
        status: 'skipped',
        output: { reason: 'disabled' },
        duration: 0,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    };
  }

  if (!shouldTraverseForResume(step, state)) {
    return null;
  }

  if (state.resumeFromStepId && !state.resumeSatisfied && step.id === state.resumeFromStepId) {
    state.resumeSatisfied = true;
    context.recordStepOutput(step.id, state.resumeData ?? { resumed: true });
    const resumedResult: ExecutionResult = {
      stepId: step.id,
      status: 'success',
      output: state.resumeData ?? { resumed: true },
      duration: 0,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    execution.execution_trace.steps.push(resumedResult);
    return { result: resumedResult };
  }

  const startedAt = new Date().toISOString();
  execution.current_step_id = step.id;
  const baseResult: ExecutionResult = {
    stepId: step.id,
    status: 'running',
    duration: 0,
    startedAt,
  };

  const finalize = (result: ExecutionResult) => {
    result.completedAt = new Date().toISOString();
    result.duration =
      new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime();
    execution.execution_trace.steps.push(cloneResult(result));
    return result;
  };

  try {
    switch (step.type) {
      case 'action': {
        const { output, error, attempts } = await runActionWithPolicy(
          step,
          context,
          workflow,
          options.maxRetries,
        );

        if (output !== undefined) {
          context.recordStepOutput(step.id, output);
        }

        return {
          result: finalize({
            ...baseResult,
            status: error ? (step.onError === 'continue' ? 'failed' : 'failed') : 'success',
            output,
            error,
            attemptCount: attempts,
          }),
        };
      }

      case 'condition': {
        const matched = context.evaluateConditions(
          step.conditions,
          step.combinator ?? 'and',
        );
        const branchSteps = matched ? step.thenSteps : step.elseSteps ?? [];
        const childResults = await executeSteps(
          branchSteps,
          workflow,
          execution,
          context,
          options,
          state,
        );

        const result = finalize({
          ...baseResult,
          status: 'success',
          output: { matched },
          childResults,
        });
        context.recordStepOutput(step.id, { matched });
        return { result };
      }

      case 'approval': {
        const timeoutMs = durationToMs(step.timeout);
        const timeoutAt =
          timeoutMs > 0 ? new Date(Date.now() + timeoutMs).toISOString() : undefined;
        const approvers = step.approvers
          .map((approver) => context.resolve(approver))
          .flatMap((approver) =>
            Array.isArray(approver)
              ? approver.map((value) => String(value))
              : approver == null || approver === ''
                ? []
                : [String(approver)],
          );

        await createApprovalRequest({
          executionId: execution.id,
          stepId: step.id,
          approvers,
          timeoutAt,
        });

        execution.status = 'waiting_approval';
        finalize({
          ...baseResult,
          status: 'waiting_approval',
          output: { approvers, timeoutAt },
        });

        if (options.persist) {
          await persistTrace(execution, context, 'waiting_approval');
        }

        throw new WorkflowPauseSignal('waiting_approval', step.id);
      }

      case 'parallel': {
        const branchResults = await Promise.allSettled(
          step.branches.map((branch) =>
            executeSteps(branch, workflow, execution, context, options, state),
          ),
        );

        const childResults = branchResults.flatMap((branch) =>
          branch.status === 'fulfilled'
            ? branch.value
            : [
                {
                  stepId: `${step.id}:branch`,
                  status: 'failed',
                  error: branch.reason instanceof Error ? branch.reason.message : String(branch.reason),
                  duration: 0,
                  startedAt,
                  completedAt: new Date().toISOString(),
                } satisfies ExecutionResult,
              ],
        );

        const failedBranches = childResults.filter((child) => child.status === 'failed');
        if ((step.waitForAll ?? true) && failedBranches.length > 0) {
          throw new Error(
            `Parallel branch failure: ${failedBranches.map((child) => child.error).join(', ')}`,
          );
        }

        const result = finalize({
          ...baseResult,
          status: failedBranches.length > 0 ? 'failed' : 'success',
          childResults,
          output: {
            branches: childResults.length,
            failedBranches: failedBranches.length,
          },
        });
        context.recordStepOutput(step.id, result.output);
        return { result };
      }

      case 'delay': {
        const delayMs = durationToMs(step.duration);

        if (delayMs <= 0) {
          const result = finalize({
            ...baseResult,
            status: 'skipped',
            output: { delayed: false, reason: 'non-positive duration' },
          });
          context.recordStepOutput(step.id, result.output);
          return { result };
        }

        if (delayMs <= INLINE_DELAY_THRESHOLD_MS) {
          await wait(delayMs);
          const result = finalize({
            ...baseResult,
            status: 'success',
            output: {
              delayed: true,
              mode: 'inline',
              durationMs: delayMs,
            },
          });
          context.recordStepOutput(step.id, result.output);
          return { result };
        }

        const resumeAt = new Date(Date.now() + delayMs);
        execution.status = 'waiting_delay';
        finalize({
          ...baseResult,
          status: 'waiting_delay',
          output: { resumeAt: resumeAt.toISOString() },
        });

        const scheduled = await triggerTaskIfConfigured(
          'resume-workflow-after-delay',
          {
            executionId: execution.id,
            workflowId: workflow.id,
            orgId: workflow.org_id,
            resumeStepId: step.id,
          },
          {
            queue: 'workflow-engine',
            delay: toDelayString(delayMs),
            idempotencyKey: ['workflow-delay', execution.id, step.id, resumeAt.toISOString()],
          },
        );

        if (!scheduled) {
          throw new Error(
            `Failed to schedule delayed resume for workflow ${workflow.id} step ${step.id}`,
          );
        }

        if (options.persist) {
          await persistTrace(execution, context, 'waiting_delay');
        }

        throw new WorkflowPauseSignal('waiting_delay', step.id);
      }

      case 'loop': {
        const collection = context.resolve(step.collection);
        const items = Array.isArray(collection) ? collection : [];
        const childResults: ExecutionResult[] = [];
        const maxIterations = Math.min(step.maxIterations, items.length);

        for (let index = 0; index < maxIterations; index += 1) {
          context.pushScope({
            [step.itemVariable]: items[index],
            [`${step.itemVariable}_index`]: index,
          });
          const results = await executeSteps(
            step.steps,
            workflow,
            execution,
            context,
            options,
            state,
          );
          childResults.push(...results);
          context.popScope();
        }

        const result = finalize({
          ...baseResult,
          status: 'success',
          output: { iterations: maxIterations },
          childResults,
        });
        context.recordStepOutput(step.id, result.output);
        return { result };
      }
    }
  } catch (error) {
    if (error instanceof WorkflowPauseSignal) {
      throw error;
    }

    const result = finalize({
      ...baseResult,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });

    if (step.type === 'action' && step.onError === 'continue') {
      context.recordStepOutput(step.id, { error: result.error, continued: true });
      return { result };
    }

    throw error;
  }
}

async function executeSteps(
  steps: WorkflowStep[],
  workflow: WorkflowDefinition,
  execution: WorkflowExecutionRecord,
  context: WorkflowContext,
  options: Required<Pick<ExecuteWorkflowOptions, 'persist' | 'maxRetries'>>,
  state: ExecutionState,
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];

  for (const step of steps) {
    const outcome = await executeStep(step, workflow, execution, context, options, state);

    if (!outcome) {
      continue;
    }

    results.push(outcome.result);

    if (options.persist) {
      await persistTrace(execution, context);
    }
  }

  return results;
}

export async function executeWorkflow(
  definition: WorkflowDefinition,
  contextInput: WorkflowExecutionContextInput,
  options: ExecuteWorkflowOptions = {},
): Promise<ExecuteWorkflowResult> {
  const execution =
    contextInput.execution ??
    (options.persist !== false
      ? await createWorkflowExecution(definition, contextInput.trigger.data, {
          variables: contextInput.variables ?? {},
          env: contextInput.env ?? {},
        })
      : await createExecution(definition, contextInput.trigger.data));

  const context = new WorkflowContext({
    ...contextInput,
    execution,
  });
  const state: ExecutionState = {
    resumeFromStepId: options.resumeFromStepId,
    resumeData: options.resumeData,
    resumeSatisfied: !options.resumeFromStepId,
  };

  try {
    const stepResults = await executeSteps(
      definition.steps,
      definition,
      execution,
      context,
      {
        persist: options.persist ?? true,
        maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
      },
      state,
    );

    execution.status = 'completed';
    execution.completed_at = new Date().toISOString();
    execution.execution_trace = {
      ...execution.execution_trace,
      steps: stepResults.length > execution.execution_trace.steps.length
        ? stepResults
        : execution.execution_trace.steps,
    };

    if (options.persist ?? true) {
      await persistTrace(execution, context, 'completed');
    }
  } catch (error) {
    if (error instanceof WorkflowPauseSignal) {
      execution.status = error.status;
      execution.current_step_id = error.stepId;
      if (options.persist ?? true) {
        await persistTrace(execution, context, error.status);
      }

      return {
        execution,
        context: context.getRuntimeState(),
        trace: execution.execution_trace,
      };
    }

    execution.status = 'failed';
    execution.error = error instanceof Error ? error.message : String(error);
    execution.completed_at = new Date().toISOString();

    if (options.persist ?? true) {
      await persistTrace(execution, context, 'failed');
    }
  }

  return {
    execution,
    context: context.getRuntimeState(),
    trace: execution.execution_trace,
  };
}

export async function startWorkflowExecution(
  workflow: WorkflowDefinition,
  triggerData: Record<string, unknown>,
  options?: { userId?: string; userEmail?: string },
): Promise<WorkflowExecutionRecord> {
  const result = await executeWorkflow(
    workflow,
    {
      trigger: {
        type: workflow.trigger.type,
        data: triggerData,
      },
      actor: {
        id: options?.userId,
        email: options?.userEmail,
      },
    },
    {
      persist: true,
    },
  );

  return result.execution;
}

export async function resumeWorkflowExecution(
  execution: WorkflowExecutionRecord,
  workflow: WorkflowDefinition,
  resumeStepId: string,
  resumeData?: Record<string, unknown>,
): Promise<WorkflowExecutionRecord> {
  const result = await executeWorkflow(
    workflow,
    {
      execution,
      trigger: {
        type: workflow.trigger.type,
        data: execution.trigger_event,
      },
      variables:
        (execution.context_snapshot?.variables as Record<string, unknown> | undefined) ?? {},
      stepOutputs:
        (execution.context_snapshot?.stepOutputs as Record<string, unknown> | undefined) ?? {},
      env: (execution.context_snapshot?.env as Record<string, unknown> | undefined) ?? {},
    },
    {
      persist: true,
      resumeFromStepId: resumeStepId,
      resumeData,
    },
  );

  return result.execution;
}

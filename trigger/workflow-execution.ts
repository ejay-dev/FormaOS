import { schedules, task } from '@trigger.dev/sdk';
import type { WorkflowStep } from '@/lib/automation/workflow-types';

import {
  createWorkflowApproval,
  getExecutionDetail,
  getExecution,
  getWorkflow,
  listTimedOutApprovals,
  markApprovalTimedOut,
  processApprovalDecision,
  updateWorkflowExecution,
} from '@/lib/automation/workflow-store';
import {
  resumeWorkflowExecution,
  startWorkflowExecution,
} from '@/lib/automation/workflow-executor';
import { WorkflowContext } from '@/lib/automation/workflow-context';

export const executeWorkflowTask = task({
  id: 'execute-workflow',
  maxDuration: 300,
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: {
    workflowId: string;
    orgId: string;
    triggerData: Record<string, unknown>;
    actor?: {
      userId?: string;
      userEmail?: string;
    };
  }) => {
    const workflow = await getWorkflow(payload.workflowId, payload.orgId);
    if (!workflow) {
      throw new Error(`Workflow ${payload.workflowId} not found`);
    }

    const execution = await startWorkflowExecution(workflow, payload.triggerData, {
      userId: payload.actor?.userId,
      userEmail: payload.actor?.userEmail,
    });

    return {
      executionId: execution.id,
      status: execution.status,
    };
  },
});

export const resumeWorkflowAfterDelay = task({
  id: 'resume-workflow-after-delay',
  maxDuration: 300,
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: {
    executionId: string;
    workflowId: string;
    orgId: string;
    resumeStepId: string;
  }) => {
    const execution = await getExecution(payload.executionId);
    const workflow = await getWorkflow(payload.workflowId, payload.orgId);

    if (!execution || !workflow) {
      throw new Error('Execution or workflow not found for delayed resume');
    }

    const result = await resumeWorkflowExecution(
      execution,
      workflow,
      payload.resumeStepId,
      { resumedAfterDelay: true },
    );

    return {
      executionId: result.id,
      status: result.status,
    };
  },
});

export const resumeWorkflowAfterApproval = task({
  id: 'resume-workflow-after-approval',
  maxDuration: 300,
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: {
    executionId: string;
    workflowId: string;
    orgId: string;
    stepId: string;
    approvedBy: string;
    decision: 'approve' | 'reject';
    comment?: string;
  }) => {
    await processApprovalDecision({
      executionId: payload.executionId,
      stepId: payload.stepId,
      decision: payload.decision,
      decidedBy: payload.approvedBy,
      comment: payload.comment,
    });

    if (payload.decision === 'reject') {
      const execution = await getExecution(payload.executionId);
      if (execution) {
        await updateWorkflowExecution(execution.id, {
          status: 'failed',
          error: `Approval rejected for step ${payload.stepId}`,
          completed_at: new Date().toISOString(),
        });
      }
      return {
        executionId: payload.executionId,
        status: 'rejected',
      };
    }

    const execution = await getExecution(payload.executionId);
    const workflow = await getWorkflow(payload.workflowId, payload.orgId);

    if (!execution || !workflow) {
      throw new Error('Execution or workflow not found for approval resume');
    }

    const result = await resumeWorkflowExecution(
      execution,
      workflow,
      payload.stepId,
      {
        approved: true,
        approvedBy: payload.approvedBy,
        comment: payload.comment,
      },
    );

    return {
      executionId: result.id,
      status: result.status,
    };
  },
});

export const workflowTimeoutCheck = schedules.task({
  id: 'workflow-timeout-check',
  cron: '*/15 * * * *',
  run: async () => {
    const approvals = await listTimedOutApprovals(new Date().toISOString());
    let processed = 0;

    for (const approval of approvals) {
      await markApprovalTimedOut(approval.id);
      const execution = await getExecutionDetail(approval.execution_id);
      if (!execution) {
        continue;
      }

      const workflow = await getWorkflow(execution.workflow_id, execution.org_id);
      if (!workflow) {
        continue;
      }

      const step = findStep(workflow.steps, approval.step_id);
      if (!step || step.type !== 'approval') {
        continue;
      }

      processed += 1;

      if (step.onTimeout === 'approve') {
        await resumeWorkflowExecution(
          execution,
          workflow,
          approval.step_id,
          { approved: true, timedOut: true },
        );
      } else if (step.onTimeout === 'reject') {
        await updateWorkflowExecution(execution.id, {
          status: 'failed',
          error: `Approval timed out for step ${approval.step_id}`,
          completed_at: new Date().toISOString(),
        });
      } else if (step.onTimeout === 'escalate') {
        const context = new WorkflowContext({
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
        });
        const approvers = (step.timeoutEscalateTo ?? [])
          .map((approver) => context.resolve(approver))
          .flatMap((approver) =>
            Array.isArray(approver)
              ? approver.map((value) => String(value))
              : approver == null || approver === ''
                ? []
                : [String(approver)],
          );

        if (approvers.length > 0) {
          await createWorkflowApproval({
            executionId: execution.id,
            stepId: approval.step_id,
            approvers,
            timeoutAt: undefined,
          });
          await updateWorkflowExecution(execution.id, {
            status: 'waiting_approval',
            error: execution.error ?? undefined,
          });
        } else {
          await updateWorkflowExecution(execution.id, {
            status: 'failed',
            error: `Approval timed out for step ${approval.step_id} and no escalation approvers were resolved`,
            completed_at: new Date().toISOString(),
          });
        }
      }
    }

    return {
      processed,
    };
  },
});

function findStep(steps: WorkflowStep[], stepId: string): WorkflowStep | null {
  for (const step of steps) {
    if (step.id === stepId) {
      return step;
    }

    if (step.type === 'condition') {
      const nested = findStep(step.thenSteps, stepId) ?? findStep(step.elseSteps ?? [], stepId);
      if (nested) {
        return nested;
      }
    }

    if (step.type === 'parallel') {
      for (const branch of step.branches) {
        const nested = findStep(branch, stepId);
        if (nested) {
          return nested;
        }
      }
    }

    if (step.type === 'loop') {
      const nested = findStep(step.steps, stepId);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

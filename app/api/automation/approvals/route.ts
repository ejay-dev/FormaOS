import { NextRequest, NextResponse } from 'next/server';

import {
  getExecution,
  getPendingApprovals,
  getWorkflow,
  processApprovalDecision,
  updateWorkflowExecution,
} from '@/lib/automation/workflow-store';
import { resumeWorkflowExecution } from '@/lib/automation/workflow-executor';
import {
  automationForbidden,
  automationUnauthorized,
  canManageAutomation,
  getAutomationApiContext,
} from '../_auth';

export async function GET() {
  const context = await getAutomationApiContext();
  if (!context) {
    return automationUnauthorized();
  }

  const approvals = await getPendingApprovals(context.orgId);
  return NextResponse.json({ approvals });
}

export async function POST(request: NextRequest) {
  const context = await getAutomationApiContext();
  if (!context) {
    return automationUnauthorized();
  }

  if (!canManageAutomation(context.role)) {
    return automationForbidden();
  }

  const body = await request.json();
  await processApprovalDecision({
    executionId: body.executionId,
    stepId: body.stepId,
    decision: body.decision,
    decidedBy: context.userId,
    comment: body.comment,
  });

  if (body.decision === 'approve') {
    const execution = await getExecution(body.executionId);
    if (execution) {
      const workflow = await getWorkflow(execution.workflow_id, context.orgId);
      if (workflow) {
        await resumeWorkflowExecution(execution, workflow, body.stepId, {
          approved: true,
          approvedBy: context.userId,
          comment: body.comment,
        });
      }
    }
  } else {
    const execution = await getExecution(body.executionId);
    if (execution) {
      await updateWorkflowExecution(execution.id, {
        status: 'failed',
        error: `Approval rejected for step ${body.stepId}`,
        completed_at: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({ ok: true });
}

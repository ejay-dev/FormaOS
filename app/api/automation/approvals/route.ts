import { NextRequest, NextResponse } from 'next/server';
import { validateCsrfOrigin } from '@/lib/security/csrf';

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
  automationPlanRequired,
  automationUnauthorized,
  canManageAutomation,
  getAutomationApiContext,
} from '../_auth';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/automation/approvals');

export async function GET() {
  try {
    const context = await getAutomationApiContext();
    if (!context) {
      return automationUnauthorized();
    }
    if (!context.canUseWorkflowAutomation) {
      return automationPlanRequired();
    }

    const approvals = await getPendingApprovals(context.orgId);
    return NextResponse.json({ approvals });
  } catch (error) {
    log.error({ err: error }, '[API] Unhandled error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const context = await getAutomationApiContext();
    if (!context) {
      return automationUnauthorized();
    }
    if (!context.canUseWorkflowAutomation) {
      return automationPlanRequired();
    }

    if (!canManageAutomation(context.role)) {
      return automationForbidden();
    }

    const body = await request.json();
    await processApprovalDecision({
      executionId: body.executionId,
      stepId: body.stepId,
      orgId: context.orgId,
      decision: body.decision,
      decidedBy: context.userId,
      comment: body.comment,
    });

    if (body.decision === 'approve') {
      const execution = await getExecution(body.executionId);
      if (execution) {
        const workflow = await getWorkflow(
          execution.workflow_id,
          context.orgId,
        );
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
  } catch (error) {
    log.error({ err: error }, '[API] Unhandled error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

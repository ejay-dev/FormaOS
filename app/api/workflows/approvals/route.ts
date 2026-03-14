/**
 * Workflow Approvals API
 * GET  /api/workflows/approvals - List pending approvals
 * POST /api/workflows/approvals - Submit approval decision
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getPendingApprovals,
  processApprovalDecision,
  getExecution,
  getWorkflow,
} from '@/lib/automation/workflow-store';
import { resumeWorkflowExecution } from '@/lib/automation/workflow-executor';

async function getAuthContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership) return null;

  return {
    user,
    orgId: membership.organization_id as string,
    role: membership.role as string,
  };
}

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const approvals = await getPendingApprovals(ctx.orgId);
  return NextResponse.json({ approvals });
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['owner', 'admin', 'compliance_officer'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { executionId, stepId, decision, comment } = body;

    if (!executionId || !stepId || !decision) {
      return NextResponse.json(
        { error: 'executionId, stepId, and decision are required' },
        { status: 400 },
      );
    }

    if (!['approve', 'reject'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be "approve" or "reject"' },
        { status: 400 },
      );
    }

    // Process the decision
    await processApprovalDecision({
      executionId,
      stepId,
      decision,
      decidedBy: ctx.user.id,
      comment,
    });

    // If approved, resume the workflow
    if (decision === 'approve') {
      const execution = await getExecution(executionId);
      if (execution) {
        const workflow = await getWorkflow(
          execution.workflow_id ?? execution.workflowId ?? '',
          ctx.orgId,
        );
        if (workflow) {
          await resumeWorkflowExecution(execution, workflow, stepId, {
            approved: true,
            approvedBy: ctx.user.id,
            comment,
          });
        }
      }
    }

    return NextResponse.json({ processed: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process approval' },
      { status: 500 },
    );
  }
}

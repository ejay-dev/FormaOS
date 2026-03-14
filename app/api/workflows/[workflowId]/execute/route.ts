/**
 * Workflow Execution API
 * POST /api/workflows/[workflowId]/execute - Trigger workflow execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkflow } from '@/lib/automation/workflow-store';
import { startWorkflowExecution } from '@/lib/automation/workflow-executor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['owner', 'admin', 'compliance_officer'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { workflowId } = await params;
  const orgId = membership.organization_id as string;
  const workflow = await getWorkflow(workflowId, orgId);

  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  if (workflow.status !== 'active') {
    return NextResponse.json(
      { error: 'Workflow is not active' },
      { status: 400 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const triggerData = {
      manualTrigger: true,
      triggeredBy: user.id,
      ...body,
    };

    const execution = await startWorkflowExecution(workflow, triggerData, {
      userId: user.id,
      userEmail: user.email,
    });

    return NextResponse.json({
      executionId: execution.id,
      status: execution.status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Execution failed' },
      { status: 500 },
    );
  }
}

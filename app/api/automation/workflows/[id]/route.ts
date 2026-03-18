import { NextRequest, NextResponse } from 'next/server';

import {
  deleteWorkflow,
  getWorkflow,
  updateWorkflow,
} from '@/lib/automation/workflow-store';
import { startWorkflowExecution } from '@/lib/automation/workflow-executor';
import {
  automationForbidden,
  automationUnauthorized,
  canManageAutomation,
  getAutomationApiContext,
} from '../../_auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAutomationApiContext();
  if (!context) {
    return automationUnauthorized();
  }

  const workflow = await getWorkflow((await params).id, context.orgId);

  if (!workflow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(workflow);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAutomationApiContext();
  if (!context) {
    return automationUnauthorized();
  }

  if (!canManageAutomation(context.role)) {
    return automationForbidden();
  }

  try {
    const workflow = await updateWorkflow(
      (await params).id,
      context.orgId,
      await request.json(),
    );
    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update workflow' },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAutomationApiContext();
  if (!context) {
    return automationUnauthorized();
  }

  if (!canManageAutomation(context.role)) {
    return automationForbidden();
  }

  try {
    await deleteWorkflow((await params).id, context.orgId);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete workflow' },
      { status: 400 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAutomationApiContext();
  if (!context) {
    return automationUnauthorized();
  }

  if (!canManageAutomation(context.role)) {
    return automationForbidden();
  }

  const workflow = await getWorkflow((await params).id, context.orgId);
  if (!workflow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const execution = await startWorkflowExecution(workflow, body, {
    userId: context.userId,
    userEmail: context.userEmail,
  });

  return NextResponse.json({
    executionId: execution.id,
    status: execution.status,
  });
}

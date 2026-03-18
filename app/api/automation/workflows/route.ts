import { NextRequest, NextResponse } from 'next/server';

import {
  createWorkflow,
  listWorkflows,
} from '@/lib/automation/workflow-store';
import type { WorkflowTriggerType } from '@/lib/automation/workflow-types';
import {
  canManageAutomation,
  getAutomationApiContext,
  automationForbidden,
  automationUnauthorized,
} from '../_auth';

export async function GET(request: NextRequest) {
  const context = await getAutomationApiContext();
  if (!context) {
    return automationUnauthorized();
  }

  const { searchParams } = request.nextUrl;
  const enabledParam = searchParams.get('enabled');
  const trigger = searchParams.get('trigger') ?? undefined;

  const workflows = await listWorkflows(context.orgId, {
    enabled:
      enabledParam === null ? undefined : enabledParam === 'true',
    trigger: trigger as WorkflowTriggerType | undefined,
  });

  return NextResponse.json(workflows);
}

export async function POST(request: NextRequest) {
  const context = await getAutomationApiContext();
  if (!context) {
    return automationUnauthorized();
  }

  if (!canManageAutomation(context.role)) {
    return automationForbidden();
  }

  try {
    const body = await request.json();
    const workflow = await createWorkflow(context.orgId, context.userId, body);
    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create workflow' },
      { status: 400 },
    );
  }
}

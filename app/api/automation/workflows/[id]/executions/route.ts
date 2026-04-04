import { NextRequest, NextResponse } from 'next/server';

import { getWorkflowExecutionHistory } from '@/lib/automation/workflow-store';
import type { WorkflowExecutionStatus } from '@/lib/automation/workflow-types';
import {
  automationUnauthorized,
  getAutomationApiContext,
} from '../../../_auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getAutomationApiContext();
    if (!context) {
      return automationUnauthorized();
    }

    const status = request.nextUrl.searchParams.get('status') ?? undefined;
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? '25');

    const executions = await getWorkflowExecutionHistory((await params).id, {
      status: status as WorkflowExecutionStatus | undefined,
      limit,
    });

    return NextResponse.json({ executions });
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

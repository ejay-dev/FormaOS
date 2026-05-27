import { NextRequest, NextResponse } from 'next/server';

import { getWorkflowExecutionHistory } from '@/lib/automation/workflow-store';
import type { WorkflowExecutionStatus } from '@/lib/automation/workflow-types';
import {
  automationPlanRequired,
  automationUnauthorized,
  getAutomationApiContext,
} from '../../../_auth';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/automation/workflows/[id]/executions');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getAutomationApiContext();
    if (!context) {
      return automationUnauthorized();
    }
    if (!context.canUseWorkflowAutomation) {
      return automationPlanRequired();
    }

    const status = request.nextUrl.searchParams.get('status') ?? undefined;
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? '25');

    const executions = await getWorkflowExecutionHistory(
      (await params).id,
      context.orgId,
      {
        status: status as WorkflowExecutionStatus | undefined,
        limit,
      },
    );

    return NextResponse.json({ executions });
  } catch (error) {
    log.error({ err: error }, '[API] Unhandled error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { routeLog } from '@/lib/monitoring/server-logger';
import { captureRouteError } from '@/lib/observability/with-route-observability';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';
import {
  listTimedOutApprovals,
  markApprovalTimedOut,
  updateWorkflowExecution,
} from '@/lib/automation/workflow-store';

const log = routeLog('/api/cron/workflow-approval-timeout');

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Enforces approval-step timeouts. Replaces the removed Trigger.dev
 * `workflow-timeout-check` task: an approval whose `timeout_at` has passed
 * while still `pending` is marked `timed_out` and its paused execution is
 * failed so it doesn't hang forever.
 */
export async function GET(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  const now = new Date().toISOString();
  const due = await listTimedOutApprovals(now);
  let timedOut = 0;
  let failed = 0;

  for (const approval of due) {
    try {
      await markApprovalTimedOut(approval.id);
      await updateWorkflowExecution(approval.execution_id, {
        status: 'failed',
        error: `Approval step ${approval.step_id} timed out`,
        completed_at: new Date().toISOString(),
      });
      timedOut += 1;
    } catch (err) {
      failed += 1;
      captureRouteError('cron.workflow-approval-timeout', err, {
        approvalId: approval.id,
      });
    }
  }

  if (failed > 0) {
    log.error({ failed, considered: due.length }, 'approval-timeout sweep had failures');
  }

  return NextResponse.json({
    ok: true,
    considered: due.length,
    timedOut,
    failed,
    timestamp: now,
  });
}

import { NextResponse } from 'next/server';
import { routeLog } from '@/lib/monitoring/server-logger';
import { captureRouteError } from '@/lib/observability/with-route-observability';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';
import {
  listExecutionsToResume,
  getWorkflowDefinition,
} from '@/lib/automation/workflow-store';
import { resumeWorkflowExecution } from '@/lib/automation/workflow-executor';

const log = routeLog('/api/cron/workflow-resume');

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Resumes workflow executions paused on a >30s delay step whose resume time
 * has elapsed. Replaces the removed Trigger.dev `resume-workflow-after-delay`
 * task: the executor now persists `waiting_delay` + `delay_resume_at` and
 * pauses; this sweep continues them.
 */
export async function GET(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  const now = new Date().toISOString();
  const due = await listExecutionsToResume(now, 50);
  let resumed = 0;
  let failed = 0;

  for (const execution of due) {
    try {
      const stepId = execution.current_step_id;
      if (!stepId) {
        log.error({ executionId: execution.id }, 'resume: missing current_step_id');
        failed += 1;
        continue;
      }
      const workflow = await getWorkflowDefinition(
        execution.workflow_id,
        execution.workflow_version,
      );
      if (!workflow) {
        log.error({ executionId: execution.id }, 'resume: workflow definition not found');
        failed += 1;
        continue;
      }
      await resumeWorkflowExecution(execution, workflow, stepId, {
        resumed: true,
        reason: 'delay_elapsed',
      });
      resumed += 1;
    } catch (err) {
      failed += 1;
      captureRouteError('cron.workflow-resume', err, { executionId: execution.id });
    }
  }

  return NextResponse.json({
    ok: true,
    considered: due.length,
    resumed,
    failed,
    timestamp: now,
  });
}

/**
 * Automation Cron Endpoint
 * Scheduled automation checks - should be called periodically by cron service
 *
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { runScheduledAutomation } from '@/lib/automation/scheduled-processor';
import { processQueueJobs } from '@/lib/queue';
import { routeLog } from '@/lib/monitoring/server-logger';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';

const log = routeLog('/api/automation/cron');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for enterprise plans

/**
 * POST /api/automation/cron
 * Run all scheduled automation checks
 *
 * Headers:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  log.info({}, "[Cron] Starting scheduled automation...");

  try {
    const startTime = Date.now();

    // Run all automation checks
    const automationResult = await runScheduledAutomation();

    // Process pending queue jobs
    log.info({}, "[Cron] Processing job queue...");
    const queueResult = await processQueueJobs();

    const duration = Date.now() - startTime;

    log.info({ data: {
      duration: `${duration}ms`,
      automation: automationResult,
      queue: queueResult,
    } }, "[Cron] Automation completed:");

    return NextResponse.json({
      success: true,
      duration,
      automation: {
        checksRun: automationResult.checksRun,
        triggersExecuted: automationResult.triggersExecuted,
        errors: automationResult.errors,
      },
      queue: {
        processed: queueResult.processed,
        succeeded: queueResult.succeeded,
        failed: queueResult.failed,
        movedToDead: queueResult.movedToDead,
        errors: queueResult.errors,
      },
    });
  } catch (error) {
    log.error({ err: error }, "[Cron] Automation failed:");

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/automation/cron
 * If called with Authorization, runs the same cron work as POST.
 * Without Authorization, returns a lightweight health response.
 */
export async function GET(request: NextRequest) {
  // Vercel Cron hits routes via GET by default. If Authorization is present,
  // treat this as an authenticated run; otherwise act as a public health check.
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    return POST(request);
  }

  return NextResponse.json({
    status: 'ok',
    service: 'automation-cron',
    timestamp: new Date().toISOString(),
  });
}

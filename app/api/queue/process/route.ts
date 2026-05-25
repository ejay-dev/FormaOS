/**
 * Queue Processing Endpoint
 *
 * POST /api/queue/process - Process pending jobs from the queue
 * GET  /api/queue/process - Process pending jobs from the queue (cron-safe default)
 * GET  /api/queue/process?stats=1 - Health check / queue stats
 *
 * Security: Protected by CRON_SECRET (same as automation cron).
 * Designed to be called by a cron service or the automation cron route.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processQueueJobs, getQueueClient } from '@/lib/queue';
import { routeLog } from '@/lib/monitoring/server-logger';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';

const log = routeLog('/api/queue/process');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute (jobs should be individually short)

// ---------------------------------------------------------------------------
// POST /api/queue/process
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  // Optional batch size from request body
  let batchSize: number | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body.batchSize === 'number') {
      batchSize = Math.min(Math.max(body.batchSize, 1), 50); // Clamp 1-50
    }
  } catch {
    // Ignore parse errors, use default
  }

  log.info({}, "[Queue API] Starting job processing...");
  const startTime = Date.now();

  try {
    const result = await processQueueJobs(batchSize);
    const duration = Date.now() - startTime;

    log.info({ data: { duration: `${duration}ms`, ...result } }, "[Queue API] Processing completed:");

    return NextResponse.json({
      success: true,
      duration,
      ...result,
    });
  } catch (error) {
    log.error({ err: error }, "[Queue API] Processing failed:");

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/queue/process
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  const url = new URL(request.url);

  // Explicit stats mode (for on-demand inspection).
  if (url.searchParams.get('stats') === '1') {
    try {
      const queue = getQueueClient();
      const stats = await queue.getStats();

      return NextResponse.json({
        status: 'ok',
        service: 'job-queue',
        timestamp: new Date().toISOString(),
        stats,
      });
    } catch (error) {
      return NextResponse.json({
        status: 'degraded',
        service: 'job-queue',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Cron-safe default: process jobs. (Vercel Cron requests are GET-only by default.)
  const batchSizeRaw = url.searchParams.get('batchSize');
  const batchSize = batchSizeRaw ? Number(batchSizeRaw) : undefined;
  const clampedBatchSize =
    typeof batchSize === 'number' && Number.isFinite(batchSize)
      ? Math.min(Math.max(batchSize, 1), 50)
      : undefined;

  const startTime = Date.now();
  try {
    const result = await processQueueJobs(clampedBatchSize);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

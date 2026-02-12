/**
 * Queue Processing Endpoint
 *
 * POST /api/queue/process - Process pending jobs from the queue
 * GET  /api/queue/process - Health check / queue stats
 *
 * Security: Protected by CRON_SECRET (same as automation cron).
 * Designed to be called by a cron service or the automation cron route.
 */

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { processQueueJobs, getQueueClient } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute (jobs should be individually short)

// ---------------------------------------------------------------------------
// Auth helper (reuses same CRON_SECRET pattern as automation cron)
// ---------------------------------------------------------------------------

function verifyCronSecret(request: NextRequest): { valid: boolean; error?: string } {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return { valid: false, error: 'CRON_SECRET not configured' };
  }

  const tokenBuffer = Buffer.from(token ?? '', 'utf8');
  const secretBuffer = Buffer.from(cronSecret, 'utf8');
  const isValid =
    tokenBuffer.length === secretBuffer.length &&
    timingSafeEqual(tokenBuffer, secretBuffer);

  if (!isValid) {
    return { valid: false, error: 'Invalid cron secret' };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// POST /api/queue/process
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = verifyCronSecret(request);
  if (!auth.valid) {
    console.error(`[Queue API] ${auth.error}`);
    const status = auth.error === 'CRON_SECRET not configured' ? 500 : 401;
    return NextResponse.json(
      { error: auth.error === 'CRON_SECRET not configured' ? 'Queue not configured' : 'Unauthorized' },
      { status },
    );
  }

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

  console.log('[Queue API] Starting job processing...');
  const startTime = Date.now();

  try {
    const result = await processQueueJobs(batchSize);
    const duration = Date.now() - startTime;

    console.log('[Queue API] Processing completed:', { duration: `${duration}ms`, ...result });

    return NextResponse.json({
      success: true,
      duration,
      ...result,
    });
  } catch (error) {
    console.error('[Queue API] Processing failed:', error);

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
  // Stats endpoint also requires auth
  const auth = verifyCronSecret(request);
  if (!auth.valid) {
    // For GET health-check, return basic status without auth
    return NextResponse.json({
      status: 'ok',
      service: 'job-queue',
      timestamp: new Date().toISOString(),
    });
  }

  // If authenticated, return full stats
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

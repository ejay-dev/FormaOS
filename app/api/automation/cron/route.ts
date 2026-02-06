/**
 * Automation Cron Endpoint
 * Scheduled automation checks - should be called periodically by cron service
 *
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { runScheduledAutomation } from '@/lib/automation/scheduled-processor';

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
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Cron not configured' },
      { status: 500 }
    );
  }

  if (token !== cronSecret) {
    console.error('[Cron] Invalid cron secret');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[Cron] Starting scheduled automation...');

  try {
    const startTime = Date.now();

    // Run all automation checks
    const result = await runScheduledAutomation();

    const duration = Date.now() - startTime;

    console.log('[Cron] Automation completed:', {
      duration: `${duration}ms`,
      ...result,
    });

    return NextResponse.json({
      success: true,
      duration,
      ...result,
    });
  } catch (error) {
    console.error('[Cron] Automation failed:', error);

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
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'automation-cron',
    timestamp: new Date().toISOString(),
  });
}

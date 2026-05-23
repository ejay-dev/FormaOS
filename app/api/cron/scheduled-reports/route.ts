import { NextResponse } from 'next/server';

import { runDueScheduledReports } from '@/lib/reports/scheduled-runner';
import { captureRouteError } from '@/lib/observability/with-route-observability';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handleScheduledReportsCron(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? 25);
  const result = await runDueScheduledReports({ limit });
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  try {
    return await handleScheduledReportsCron(request);
  } catch (error) {
    captureRouteError('cron.scheduled-reports', error, {
      method: 'GET',
      url: request.url,
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Scheduled report processing failed',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}

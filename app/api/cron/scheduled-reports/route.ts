import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

import { runDueScheduledReports } from '@/lib/reports/scheduled-runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function verifyCronSecret(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return { ok: false, status: 500, error: 'CRON_SECRET not configured' };
  }

  const token =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ??
    '';
  const tokenBuffer = Buffer.from(token, 'utf8');
  const secretBuffer = Buffer.from(cronSecret, 'utf8');
  const ok =
    tokenBuffer.length === secretBuffer.length &&
    timingSafeEqual(tokenBuffer, secretBuffer);

  return ok
    ? { ok: true, status: 200, error: null }
    : { ok: false, status: 401, error: 'Unauthorized' };
}

async function handleScheduledReportsCron(request: Request) {
  const auth = verifyCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? 25);
  const result = await runDueScheduledReports({ limit });
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  try {
    return await handleScheduledReportsCron(request);
  } catch (error) {
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

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const token = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim();

  const tokenBuffer = Buffer.from(token ?? '', 'utf8');
  const secretBuffer = Buffer.from(cronSecret, 'utf8');

  return (
    tokenBuffer.length === secretBuffer.length &&
    timingSafeEqual(tokenBuffer, secretBuffer)
  );
}

async function runSecurityRetention(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: 'cron_secret_missing' },
      { status: 500 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    );
  }

  try {
    const admin = createSupabaseAdminClient();
    const startedAt = Date.now();

    const { error } = await admin.rpc('cleanup_old_security_data');
    if (error) {
      console.error('[SecurityRetentionCron] cleanup failed:', error);
      return NextResponse.json(
        { ok: false, error: 'cleanup_failed', detail: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      ranAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('[SecurityRetentionCron] unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return runSecurityRetention(request);
}

export async function POST(request: Request) {
  return runSecurityRetention(request);
}

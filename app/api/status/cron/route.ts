import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getRedisClient, getRedisConfig } from '@/lib/redis/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function verifyCronSecret(request: Request): { ok: boolean; error?: string } {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') ?? '';
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return { ok: false, error: 'CRON_SECRET not configured' };
  }

  const tokenBuffer = Buffer.from(token, 'utf8');
  const secretBuffer = Buffer.from(cronSecret, 'utf8');

  const valid =
    tokenBuffer.length === secretBuffer.length &&
    timingSafeEqual(tokenBuffer, secretBuffer);

  if (!valid) return { ok: false, error: 'Unauthorized' };
  return { ok: true };
}

async function handleStatusCron(request: Request) {
  const auth = verifyCronSecret(request);
  if (!auth.ok) {
    const status = auth.error === 'CRON_SECRET not configured' ? 500 : 401;
    return NextResponse.json({ ok: false, error: auth.error }, { status });
  }

  const admin = createSupabaseAdminClient();

  const startedAt = Date.now();
  let ok = true;

  const details: Record<string, unknown> = {
    checks: {},
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    region: process.env.VERCEL_REGION ?? null,
  };

  // DB health check (source of truth for app availability)
  try {
    const res = await admin
      .from('organizations')
      .select('id', { head: true, count: 'exact' })
      .limit(1);

    if (res.error) throw new Error(res.error.message);
    (details.checks as any).database = true;
  } catch (err) {
    ok = false;
    (details.checks as any).database = false;
    (details.checks as any).database_error =
      err instanceof Error ? err.message : String(err);
  }

  // Redis check (optional but critical for enterprise-grade reliability)
  const { url, token } = getRedisConfig();
  if (url && token) {
    try {
      const redis = getRedisClient();
      if (!redis) throw new Error('Redis client unavailable');
      await redis.set('status:ping', String(Date.now()), { ex: 60 });
      (details.checks as any).redis = true;
    } catch (err) {
      (details.checks as any).redis = false;
      (details.checks as any).redis_error =
        err instanceof Error ? err.message : String(err);
      // Redis failure degrades enterprise posture but does not necessarily mean the app is down.
    }
  } else {
    (details.checks as any).redis = null;
  }

  const latencyMs = Date.now() - startedAt;

  try {
    const insert = await admin.from('public_uptime_checks').insert({
      ok,
      latency_ms: latencyMs,
      source: 'vercel-cron',
      details,
    });

    if (insert.error) {
      return NextResponse.json(
        { ok: false, error: insert.error.message },
        { status: 500 },
      );
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    recorded: { ok, latencyMs },
    details,
  });
}

// Vercel Cron hits routes via GET by default (vercel.json "crons" only defines path+schedule).
// Keep POST for manual/internal callers, but implement GET so schedules actually execute.
export async function GET(request: Request) {
  return handleStatusCron(request);
}

export async function POST(request: Request) {
  return handleStatusCron(request);
}

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * v4-031: shared Vercel cron authentication.
 *
 * Vercel-scheduled invocations carry `user-agent: vercel-cron/1.0` and
 * the `CRON_SECRET` bearer. Verifying BOTH gives defence in depth:
 * a leaked CRON_SECRET on its own (env exfiltration, log scraping) is
 * no longer enough to trigger crons from anywhere — the attacker also
 * has to forge the UA. Operators who need to manually trigger a cron
 * from curl can set `ALLOW_NON_VERCEL_CRON=true` to skip the UA gate
 * (useful for staging dry-runs and incident replays).
 *
 * Returns `null` on success, a 401/500 NextResponse on failure.
 */
export function verifyVercelCronRequest(request: Request): Response | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') ?? '';
  const tokenBuffer = Buffer.from(token, 'utf8');
  const secretBuffer = Buffer.from(cronSecret, 'utf8');
  const bearerOk =
    tokenBuffer.length === secretBuffer.length &&
    timingSafeEqual(tokenBuffer, secretBuffer);

  if (!bearerOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (process.env.ALLOW_NON_VERCEL_CRON === 'true') {
    return null;
  }

  const ua = request.headers.get('user-agent') ?? '';
  const fromVercelCron = ua.toLowerCase().startsWith('vercel-cron');
  if (!fromVercelCron) {
    return NextResponse.json(
      { error: 'Forbidden: cron requests must originate from Vercel' },
      { status: 403 },
    );
  }

  return null;
}

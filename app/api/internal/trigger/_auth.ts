import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export function verifyInternalTriggerRequest(
  request: NextRequest,
): { ok: true } | { ok: false; status: number; error: string } {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '') ?? '';
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return { ok: false, status: 500, error: 'CRON_SECRET not configured' };
  }

  const tokenBuffer = Buffer.from(token, 'utf8');
  const secretBuffer = Buffer.from(cronSecret, 'utf8');
  const valid =
    tokenBuffer.length === secretBuffer.length &&
    timingSafeEqual(tokenBuffer, secretBuffer);

  if (!valid) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  return { ok: true };
}

export function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

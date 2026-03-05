import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { enable2FA } from '@/lib/security';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  logSecurityEvent,
  SecurityEventTypes,

} from '@/lib/security/session-security';

const log = routeLog('/api/security/mfa/enable');
import { safeString } from '@/lib/security/api-validation';
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';

const schema = z.object({
  token: safeString({ min: 4, max: 16 }),
});

export async function POST(request: Request) {
  try {
    const identifier = await getClientIdentifier();
    const rl = await checkRateLimit(RATE_LIMITS.AUTH, identifier);
    if (!rl.success) {
      return NextResponse.json(
        { ok: false, error: 'rate_limited' },
        { status: 429, headers: createRateLimitHeaders(rl) },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'invalid_token' },
        { status: 400 },
      );
    }

    const verified = await enable2FA(user.id, parsed.data.token);
    if (!verified) {
      return NextResponse.json(
        { ok: false, error: 'invalid_token' },
        { status: 400 },
      );
    }

    logSecurityEvent({
      eventType: SecurityEventTypes.MFA_ENABLED,
      userId: user.id,
      metadata: { source: 'settings' },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error({ err: error }, "[security/mfa/enable] Error:");
    return NextResponse.json(
      { ok: false, error: 'mfa_enable_failed' },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { disable2FA } from '@/lib/security';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  logSecurityEvent,
  SecurityEventTypes,

} from '@/lib/security/session-security';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const log = routeLog('/api/security/mfa/disable');
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

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
    const password = typeof body?.password === 'string' ? body.password : '';

    const disabled = await disable2FA(user.id, password);
    if (!disabled) {
      return NextResponse.json(
        { ok: false, error: 'mfa_disable_failed' },
        { status: 400 },
      );
    }

    logSecurityEvent({
      eventType: SecurityEventTypes.MFA_DISABLED,
      userId: user.id,
      metadata: { source: 'settings' },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error({ err: error }, "[security/mfa/disable] Error:");
    return NextResponse.json(
      { ok: false, error: 'mfa_disable_failed' },
      { status: 500 },
    );
  }
}

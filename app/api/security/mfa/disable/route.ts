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

    // P1-C (2026-05-26): disable2FA calls verify2FAToken under the hood,
    // so it shares the same per-user brute-force surface as the verify
    // route. Apply the per-user MFA budget here as well — without it, an
    // attacker rotating IPs can spray TOTP codes against this endpoint
    // and burn through a target's backup codes without ever tripping the
    // per-IP AUTH bucket.
    const perUserRl = await checkRateLimit(
      RATE_LIMITS.MFA_VERIFY_PER_USER,
      `user:${user.id}`,
    );
    if (!perUserRl.success) {
      return NextResponse.json(
        { ok: false, error: 'rate_limited' },
        { status: 429, headers: createRateLimitHeaders(perUserRl) },
      );
    }

    const body = await request.json().catch(() => ({}));
    // v4-015: TOTP / backup code is required (not password). A phished
    // password must not be enough to strip MFA — the attacker must
    // also possess the authenticator or a backup code.
    const totpToken = typeof body?.totp === 'string' ? body.totp.trim() : '';

    if (!totpToken) {
      return NextResponse.json(
        { ok: false, error: 'totp_required' },
        { status: 400 },
      );
    }

    const disabled = await disable2FA(user.id, totpToken);
    if (!disabled) {
      return NextResponse.json(
        { ok: false, error: 'invalid_totp' },
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

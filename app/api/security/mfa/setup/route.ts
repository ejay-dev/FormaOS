import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generate2FASecret } from '@/lib/security';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  RATE_LIMITS,

} from '@/lib/security/rate-limiter';

const log = routeLog('/api/security/mfa/setup');

export const runtime = 'nodejs';

export async function POST() {
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

    if (!user || !user.email) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    const secret = await generate2FASecret(user.id, user.email);
    // Only return QR code and backup codes — never expose the raw TOTP secret
    return NextResponse.json({
      ok: true,
      qrCode: secret.qrCode,
      backupCodes: secret.backupCodes,
    });
  } catch (error) {
    log.error({ err: error }, "[security/mfa/setup] Error:");
    return NextResponse.json(
      { ok: false, error: 'mfa_setup_failed' },
      { status: 500 },
    );
  }
}

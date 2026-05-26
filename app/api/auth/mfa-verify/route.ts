import { NextResponse } from 'next/server';
import { headers as nextHeaders } from 'next/headers';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verify2FAToken } from '@/lib/security';
import {
  extractSessionIdFromAccessToken,
  markMfaPassedForCurrentSession,
  recordMfaFailure,
} from '@/lib/auth/mfa-gate';
import { logMfaAudit } from '@/lib/auth/mfa-audit';
import {
  RATE_LIMITS,
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from '@/lib/security/rate-limiter';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { extractClientIP } from '@/lib/security/session-security';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/auth/mfa-verify');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const requestHeaders = await nextHeaders();
  const ipAddress = extractClientIP(requestHeaders);
  const userAgent = requestHeaders.get('user-agent');

  try {
    const identifier = await getClientIdentifier();
    const rl = await checkRateLimit(RATE_LIMITS.AUTH, identifier);
    if (!rl.success) {
      return NextResponse.json(
        { ok: false, error: 'rate_limited' },
        { status: 429, headers: createRateLimitHeaders(rl) },
      );
    }

    let body: { token?: unknown } = {};
    try {
      body = (await request.json()) as { token?: unknown };
    } catch {
      return NextResponse.json(
        { ok: false, error: 'invalid_body' },
        { status: 400 },
      );
    }

    const token =
      typeof body.token === 'string' ? body.token.replace(/\s+/g, '') : '';
    if (!token || token.length < 6 || token.length > 16) {
      return NextResponse.json(
        { ok: false, error: 'invalid_token_format' },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const { data: userData } = await supabase.auth.getUser();

    const userId = userData?.user?.id;
    const sessionId = extractSessionIdFromAccessToken(
      sessionData?.session?.access_token,
    );

    if (!userId || !sessionId) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    // P1-B (2026-05-26): a distributed attacker rotating source IPs can
    // spray TOTP codes against a single user without ever tripping the
    // per-IP AUTH bucket. Apply a stricter per-user budget once we have
    // the resolved user id.
    const perUserRl = await checkRateLimit(
      RATE_LIMITS.MFA_VERIFY_PER_USER,
      `user:${userId}`,
    );
    if (!perUserRl.success) {
      await logMfaAudit({
        userId,
        event: 'mfa_failure',
        method: 'password',
        ipAddress,
        userAgent,
        reason: 'rate_limited_per_user',
      });
      return NextResponse.json(
        { ok: false, error: 'rate_limited' },
        { status: 429, headers: createRateLimitHeaders(perUserRl) },
      );
    }

    const verified = await verify2FAToken(userId, token);
    if (!verified) {
      await recordMfaFailure(supabase, userId);
      await logMfaAudit({
        userId,
        event: 'mfa_failure',
        method: 'password',
        ipAddress,
        userAgent,
        reason: 'invalid_token',
      });
      return NextResponse.json(
        { ok: false, error: 'invalid_token' },
        { status: 401 },
      );
    }

    await markMfaPassedForCurrentSession(supabase, userId, sessionId);
    // Distinguish backup-code success from TOTP success in the audit log
    // by length — backup codes are 12 hex chars, TOTP codes are 6 digits.
    const looksLikeBackupCode = /^[0-9A-Fa-f]{12}$/.test(token);
    await logMfaAudit({
      userId,
      event: looksLikeBackupCode ? 'mfa_backup_code_used' : 'mfa_success',
      method: 'password',
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'mfa-verify failed');
    return NextResponse.json(
      { ok: false, error: 'mfa_verify_failed' },
      { status: 500 },
    );
  }
}

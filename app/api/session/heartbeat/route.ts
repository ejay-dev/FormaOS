/**
 * Session Heartbeat API
 *
 * Event-driven active session tracking:
 * - Writes on login, focus regain, route change, and logout
 * - Uses authenticated RPC (no service-role client in user route)
 * - Rate limited to prevent noisy writes
 */

import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { extractClientIP } from '@/lib/security/session-security';
import { isSecurityMonitoringEnabled } from '@/lib/security/monitoring-flags';
import { logRateLimitExceeded } from '@/lib/security/event-logger';
import {
  checkRateLimit,
  createRateLimitHeaders,
  createRateLimitedResponse,
} from '@/lib/security/rate-limiter';

const RATE_LIMITS = {
  HEARTBEAT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // Event-driven writes can cluster during navigation/focus
    keyPrefix: 'rl:heartbeat',
  },
};

export async function POST(request: Request) {
  if (!isSecurityMonitoringEnabled()) {
    return NextResponse.json({ ok: true, disabled: true });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    // Rate limit check
    const headers = request.headers;
    const ip = extractClientIP(headers);
    const rateLimitResult = await checkRateLimit(
      RATE_LIMITS.HEARTBEAT,
      ip,
      user.id,
    );

    if (!rateLimitResult.success) {
      logRateLimitExceeded({
        userId: user.id,
        ip,
        userAgent: headers.get('user-agent') || 'unknown',
        path: '/api/session/heartbeat',
      });
      return createRateLimitedResponse(
        'Too many heartbeat requests. Please wait before trying again.',
        429,
        createRateLimitHeaders(rateLimitResult),
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      reason?: 'login' | 'focus' | 'route_change' | 'logout';
    };
    const reason = body.reason ?? 'focus';

    // Get Supabase session ID from access token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'no_session' },
        { status: 401 },
      );
    }

    const sessionId = createHash('sha256')
      .update(session.access_token)
      .digest('hex');

    const { error: sessionError } = await supabase.rpc(
      'update_session_heartbeat',
      {
        p_session_id: sessionId,
      },
    );

    if (sessionError) {
      console.error('[Heartbeat] Failed to update session:', sessionError);
      return NextResponse.json(
        { ok: false, error: 'db_error' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, reason });
  } catch (error) {
    console.error('[Heartbeat] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

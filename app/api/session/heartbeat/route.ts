/**
 * Session Heartbeat API
 *
 * Tracks active sessions in real-time:
 * - Updates last_seen_at every ~60 seconds
 * - Creates/updates active_sessions records
 * - Logs session context (IP, UA, device, geo)
 * - Rate limited: 2 requests per minute per user
 */

import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { extractClientIP } from '@/lib/security/session-security';
import { generateDeviceFingerprint } from '@/lib/security/session-security';
import { enrichGeoData, parseUserAgent } from '@/lib/security/detection-rules';
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
    maxRequests: 2, // Allow 2 requests per minute
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
      await logRateLimitExceeded({
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

    // Extract request context
    const userAgent = headers.get('user-agent') || 'unknown';
    const acceptLanguage = headers.get('accept-language') || undefined;
    const acceptEncoding = headers.get('accept-encoding') || undefined;

    const deviceFingerprint = generateDeviceFingerprint(
      userAgent,
      acceptLanguage,
      acceptEncoding,
    );

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

    // Get org_id if user is in an org
    const admin = createSupabaseAdminClient();
    const { data: membership } = await admin
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    const orgId = membership?.organization_id;

    // Enrich with geo data (non-blocking)
    const geo = await enrichGeoData(ip).catch(() => ({
      country: undefined,
      region: undefined,
      city: undefined,
    }));
    const deviceInfo = parseUserAgent(userAgent);

    // Update or create active session
    const { error: sessionError } = await admin.from('active_sessions').upsert(
      {
        session_id: sessionId,
        user_id: user.id,
        org_id: orgId,
        last_seen_at: new Date().toISOString(),
        ip_address: ip,
        user_agent: userAgent,
        device_fingerprint: deviceFingerprint,
        geo_country: geo.country,
        geo_region: geo.region,
        geo_city: geo.city,
        metadata: deviceInfo,
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7 days
      },
      { onConflict: 'session_id' },
    );

    if (sessionError) {
      console.error('[Heartbeat] Failed to update session:', sessionError);
      return NextResponse.json(
        { ok: false, error: 'db_error' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Heartbeat] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

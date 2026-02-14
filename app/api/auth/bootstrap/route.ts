import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { recoverUserWorkspace } from '@/lib/provisioning/workspace-recovery';
import {
  createTrackedSession,
  generateDeviceFingerprint,
  generateSessionToken,
  extractClientIP,
  logSecurityEvent,
  SecurityEventTypes,
} from '@/lib/security/session-security';
import {
  TRACKED_SESSION_COOKIE,
  TRACKED_SESSION_MAX_AGE,
} from '@/lib/security/session-constants';
import { getCookieDomain } from '@/lib/supabase/cookie-domain';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const recovery = await recoverUserWorkspace({
    userId: user.id,
    userEmail: user.email ?? null,
    source: 'api-auth-bootstrap',
  });

  if (!recovery.ok) {
    return NextResponse.json({ ok: false, error: 'recovery_failed' }, { status: 500 });
  }

  const response = NextResponse.json({
    ok: true,
    organizationId: recovery.organizationId,
    next: recovery.nextPath,
  });

  logSecurityEvent({
    eventType: SecurityEventTypes.LOGIN_SUCCESS,
    userId: user.id,
    ipAddress: extractClientIP(request.headers),
    userAgent: request.headers.get('user-agent') ?? undefined,
    metadata: { source: 'bootstrap' },
  });

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(TRACKED_SESSION_COOKIE)?.value;
  if (!existingToken) {
    const userAgent = request.headers.get('user-agent') ?? '';
    const fingerprint = generateDeviceFingerprint(
      userAgent,
      request.headers.get('accept-language') ?? '',
      request.headers.get('accept-encoding') ?? '',
    );
    const sessionToken = generateSessionToken();
    try {
      await createTrackedSession({
        userId: user.id,
        sessionToken,
        ipAddress: extractClientIP(request.headers),
        userAgent,
        deviceFingerprint: fingerprint,
      });
      const requestUrl = new URL(request.url);
      const cookieDomain = getCookieDomain(requestUrl.hostname);
      response.cookies.set(TRACKED_SESSION_COOKIE, sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: requestUrl.protocol === 'https:',
        maxAge: TRACKED_SESSION_MAX_AGE,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      });
    } catch (error) {
      console.error('[auth/bootstrap] Session tracking failed:', error);
    }
  }

  return response;
}

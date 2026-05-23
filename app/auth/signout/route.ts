import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  logSecurityEvent,
  SecurityEventTypes,
  revokeSessionByToken,
} from '@/lib/security/session-security';
import { TRACKED_SESSION_COOKIE } from '@/lib/security/session-constants';
import { authLogger } from '@/lib/observability/structured-logger';

function getProjectRef(url: string): string {
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return '';
  }
}

function isLoopbackHost(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
}

const resolveRedirectUrl = (request: Request) => {
  const { origin } = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;

  try {
    const configured = new URL(appUrl);
    const requestOrigin = new URL(origin);
    if (
      isLoopbackHost(configured.hostname) &&
      isLoopbackHost(requestOrigin.hostname)
    ) {
      return `${requestOrigin.origin}/auth/signin`;
    }
    return `${configured.origin}/auth/signin`;
  } catch {
    return `${origin}/auth/signin`;
  }
};

// Clear all Supabase auth cookies for complete session cleanup
async function clearSupabaseCookies(response: NextResponse) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const projectRef = getProjectRef(supabaseUrl);

  const cookiePrefixes = [`sb-${projectRef}`, 'sb-'];

  for (const cookie of allCookies) {
    if (cookiePrefixes.some((prefix) => cookie.name.startsWith(prefix))) {
      response.cookies.set(cookie.name, '', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }
  }

  // Also clear potential chunked cookies
  for (let i = 0; i < 10; i++) {
    response.cookies.set(`sb-${projectRef}-auth-token.${i}`, '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
}

async function persistLogoutHeartbeat(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId?: string,
) {
  if (!userId) return;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    const sessionId = createHash('sha256')
      .update(session.access_token)
      .digest('hex');

    await supabase.rpc('update_session_heartbeat', {
      p_session_id: sessionId,
      p_user_id: userId,
    });
  } catch {
    // Best-effort heartbeat only.
  }
}

/**
 * v4-015: GET /auth/signout mutates state (revokes session, clears
 * cookies). Without an origin/referer check, any cross-site
 * `<img src="/auth/signout">` or link-prefetch silently logs the
 * user out — a low-impact-but-easy CSRF. We require either:
 *   - sec-fetch-site = same-origin / same-site / none (the modern
 *     browser-set header, present on top-level nav + same-origin
 *     XHR/img, absent on cross-site `<img>`)
 *   - OR a Referer/Origin header whose origin matches the request
 *     origin (covers older browsers without sec-fetch-site)
 * Cross-site requests get a 405 nudging clients to POST instead.
 */
function isSameOriginRequest(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite) {
    return (
      fetchSite === 'same-origin' ||
      fetchSite === 'same-site' ||
      fetchSite === 'none'
    );
  }

  const requestOrigin = new URL(request.url).origin;
  const originHeader = request.headers.get('origin');
  if (originHeader) {
    try {
      return new URL(originHeader).origin === requestOrigin;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin === requestOrigin;
    } catch {
      return false;
    }
  }

  // No fetch metadata and no referer/origin — treat as untrusted
  // (modern browsers always send sec-fetch-site).
  return false;
}

export async function GET(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: 'method_not_allowed', message: 'POST /auth/signout to log out' },
      { status: 405, headers: { Allow: 'POST' } },
    );
  }

  const supabase = await createSupabaseServerClient();
  let user = null;

  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch {
    // Continue even if getUser fails (JWT might be invalid after rotation)
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // Continue even if signOut fails
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(TRACKED_SESSION_COOKIE)?.value;
  if (sessionToken) {
    await revokeSessionByToken(sessionToken);
  }

  await persistLogoutHeartbeat(supabase, user?.id);

  if (user) {
    logSecurityEvent({
      eventType: SecurityEventTypes.LOGOUT,
      userId: user.id,
      metadata: { source: 'signout' },
    });
  }

  const response = NextResponse.redirect(resolveRedirectUrl(request));

  // Clear tracked session cookie
  response.cookies.set(TRACKED_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  // Clear all Supabase cookies for complete cleanup
  await clearSupabaseCookies(response);

  authLogger.info('session_cleared', { method: 'GET' });

  return response;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  let user = null;

  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch {
    // Continue even if getUser fails
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // Continue even if signOut fails
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(TRACKED_SESSION_COOKIE)?.value;
  if (sessionToken) {
    await revokeSessionByToken(sessionToken);
  }

  await persistLogoutHeartbeat(supabase, user?.id);

  if (user) {
    logSecurityEvent({
      eventType: SecurityEventTypes.LOGOUT,
      userId: user.id,
      metadata: { source: 'signout' },
    });
  }

  const response = NextResponse.redirect(resolveRedirectUrl(request));

  // Clear tracked session cookie
  response.cookies.set(TRACKED_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  // Clear all Supabase cookies for complete cleanup
  await clearSupabaseCookies(response);

  authLogger.info('session_cleared', { method: 'POST' });

  return response;
}

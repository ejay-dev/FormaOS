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

function getProjectRef(url: string): string {
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return '';
  }
}

const resolveRedirectUrl = (request: Request) => {
  const { origin } = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  return `${appUrl.replace(/\/$/, '')}/auth/signin`;
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
    });
  } catch {
    // Best-effort heartbeat only.
  }
}

export async function GET(request: Request) {
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

  console.log('[auth/signout] Session cleared, redirecting to signin');

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

  console.log('[auth/signout] POST: Session cleared, redirecting to signin');

  return response;
}

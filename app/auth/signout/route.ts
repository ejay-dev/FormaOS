import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  logSecurityEvent,
  SecurityEventTypes,
  revokeSessionByToken,
} from '@/lib/security/session-security';
import {
  TRACKED_SESSION_COOKIE,
} from '@/lib/security/session-constants';

const resolveRedirectUrl = (request: Request) => {
  const { origin } = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  return `${appUrl.replace(/\/$/, '')}/auth/signin`;
};

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(TRACKED_SESSION_COOKIE)?.value;
  if (sessionToken) {
    await revokeSessionByToken(sessionToken);
  }

  if (user) {
    await logSecurityEvent({
      eventType: SecurityEventTypes.LOGOUT,
      userId: user.id,
      metadata: { source: 'signout' },
    });
  }

  const response = NextResponse.redirect(resolveRedirectUrl(request));
  response.cookies.set(TRACKED_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(TRACKED_SESSION_COOKIE)?.value;
  if (sessionToken) {
    await revokeSessionByToken(sessionToken);
  }

  if (user) {
    await logSecurityEvent({
      eventType: SecurityEventTypes.LOGOUT,
      userId: user.id,
      metadata: { source: 'signout' },
    });
  }

  const response = NextResponse.redirect(resolveRedirectUrl(request));
  response.cookies.set(TRACKED_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

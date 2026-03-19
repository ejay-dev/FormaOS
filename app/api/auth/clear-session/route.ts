import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { routeLog } from '@/lib/monitoring/server-logger';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const log = routeLog('/api/auth/clear-session');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/clear-session
 *
 * Clears all Supabase auth cookies and session state.
 * Use this endpoint after JWT key rotation to force users to re-authenticate.
 *
 * This is a safe way to recover from stale sessions that were signed with
 * the old JWT key.
 */

function getProjectRef(url: string): string {
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return '';
  }
}

export async function POST(request: Request) {
  // CSRF: reject cross-origin requests to prevent forced-logout attacks
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const projectRef = getProjectRef(supabaseUrl);

  // Find and clear all Supabase-related cookies
  const clearedCookies: string[] = [];
  const cookiePrefixes = [
    `sb-${projectRef}`,
    'sb-',
    'supabase-auth',
    '__session',
    'formaos-session',
  ];

  for (const cookie of allCookies) {
    const shouldClear = cookiePrefixes.some((prefix) =>
      cookie.name.startsWith(prefix),
    );
    if (shouldClear) {
      clearedCookies.push(cookie.name);
    }
  }

  // Attempt to sign out via Supabase (this may fail if the token is invalid)
  let signOutError: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      signOutError = error.message;
    }
  } catch (err) {
    signOutError =
      err instanceof Error ? err.message : 'Unknown error during sign out';
  }

  // Build response with explicit cookie clearing
  const response = NextResponse.json({
    success: true,
    message: 'Session cleared. Please sign in again.',
    cleared_cookies: clearedCookies,
    signout_error: signOutError,
    redirect: '/auth/signin',
  });

  // Clear all matched cookies with all possible configurations
  for (const cookieName of clearedCookies) {
    // Clear without domain
    response.cookies.set(cookieName, '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    // Also try clearing with the project-specific cookie (chunked)
    for (let i = 0; i < 10; i++) {
      response.cookies.set(`${cookieName}.${i}`, '', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }
  }

  // Also clear the tracked session cookie
  response.cookies.set('formaos-session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  log.info(
    { data: clearedCookies },
    '[auth/clear-session] Cleared session cookies:',
  );

  return response;
}

// GET endpoint redirects to clear and then to signin
// Note: although GET is normally safe, this endpoint mutates state (clears
// session cookies), so we apply the same origin check to prevent cross-site
// forced logouts via <img src="..."> or link prefetching.
export async function GET(request: Request) {
  // Re-use the CSRF utility's origin logic, but since it skips GET by design
  // we perform a manual origin/referer check here.
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  if (!origin && !referer) {
    // Allow direct navigation (browser address bar) — no origin/referer is
    // sent for top-level navigations, which is the expected use-case.
  } else {
    // If an origin or referer IS present, validate it by re-wrapping as POST
    // so validateCsrfOrigin applies its trusted-origin logic.
    const csrfError = validateCsrfOrigin(
      new Request(request.url, { method: 'POST', headers: request.headers }),
    );
    if (csrfError) return csrfError;
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const projectRef = getProjectRef(supabaseUrl);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  const clearedCookies: string[] = [];
  const cookiePrefixes = [
    `sb-${projectRef}`,
    'sb-',
    'supabase-auth',
    '__session',
    'formaos-session',
  ];

  for (const cookie of allCookies) {
    if (cookiePrefixes.some((prefix) => cookie.name.startsWith(prefix))) {
      clearedCookies.push(cookie.name);
    }
  }

  // Sign out via Supabase
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Continue even if signOut fails
  }

  // Redirect to signin with session cleared
  const response = NextResponse.redirect(
    `${appUrl}/auth/signin?session_cleared=true`,
  );

  // Clear all cookies
  for (const cookieName of clearedCookies) {
    response.cookies.set(cookieName, '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    // Clear chunked cookies
    for (let i = 0; i < 10; i++) {
      response.cookies.set(`${cookieName}.${i}`, '', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }
  }

  response.cookies.set('formaos-session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  log.info(
    {},
    '[auth/clear-session] GET: Cleared session and redirecting to signin',
  );

  return response;
}

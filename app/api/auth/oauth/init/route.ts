import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_TTL_SECONDS,
} from '@/lib/auth/oauth-state';
import { validateCsrfOrigin } from '@/lib/security/csrf';

export const runtime = 'nodejs';

/**
 * v4-026: OAuth state was previously generated client-side and
 * persisted via document.cookie — which means the cookie cannot be
 * HttpOnly (browsers ignore HttpOnly from document.cookie). An XSS
 * payload could read the state and replay it.
 *
 * This route generates the state server-side, sets it as an
 * HttpOnly + Secure + SameSite=Lax cookie via Set-Cookie, and
 * returns the full provider redirect URL with the state embedded.
 * The client never sees the raw state — it just follows the URL.
 *
 * Request body: { provider: 'google', redirectTo: '<oauth-redirect-base>' }
 * Response:     { url: '<full provider URL with state param>' }
 */
export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const body = (await request.json().catch(() => null)) as
    | { provider?: string; redirectTo?: string }
    | null;
  const provider = body?.provider;
  const redirectTo = body?.redirectTo;

  if (!provider || !redirectTo) {
    return NextResponse.json(
      { error: 'provider_and_redirectTo_required' },
      { status: 400 },
    );
  }

  // Only accept providers we actually support — defends against
  // open-redirect via the `provider` field hitting an unknown URL.
  if (provider !== 'google') {
    return NextResponse.json(
      { error: 'unsupported_provider' },
      { status: 400 },
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(redirectTo);
  } catch {
    return NextResponse.json(
      { error: 'invalid_redirectTo' },
      { status: 400 },
    );
  }

  const state = randomUUID();
  parsed.searchParams.set('provider', provider);
  parsed.searchParams.set('state', state);

  // Audit 2026-05-26 — gate `secure` off the request protocol rather
  // than NODE_ENV. Previously, a local HTTPS dev tunnel (ngrok / cloudflared)
  // had NODE_ENV=development → the cookie was sent over HTTPS without
  // the Secure attribute. Keying off `request.url`'s protocol means
  // any HTTPS context gets Secure, regardless of build mode.
  const isHttps = new URL(request.url).protocol === 'https:';

  const response = NextResponse.json({ url: parsed.toString() });
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_STATE_TTL_SECONDS,
  });
  return response;
}

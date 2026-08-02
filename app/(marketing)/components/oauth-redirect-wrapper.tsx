'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au')
  .replace(/\/$/, '');

/**
 * =========================================================
 * OAUTH REDIRECT WRAPPER
 * =========================================================
 *
 * This component handles OAuth redirects on public pages.
 * It detects OAuth code and state parameters in the URL and
 * redirects to the appropriate callback handler.
 *
 * This is necessary because the middleware can't handle all
 * OAuth redirect scenarios, especially when the user is on
 * a public page.
 */

// OAuth 2.0 / OIDC error codes (RFC 6749 §4.1.2.1, §4.2.2.1 and OIDC core).
// Marketing pages use `?error=` for their own server-action failures — the
// contact form redirects to /contact?error=rate_limit — so an `error` param is
// only an OAuth failure when it carries an OAuth code or an OAuth companion
// param (`error_description` / `error_code`, both sent by Supabase auth).
const OAUTH_ERROR_CODES = new Set([
  'access_denied',
  'invalid_request',
  'invalid_scope',
  'server_error',
  'temporarily_unavailable',
  'unauthorized_client',
  'unsupported_response_type',
  'interaction_required',
  'login_required',
  'consent_required',
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function OAuthRedirectWrapper() {
  const searchParams = useSearchParams();
  const [isHandling, setIsHandling] = useState(false);

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      // Supabase's PKCE callback carries a UUID auth code; `state` is present
      // when a provider redirects here directly. Anything else (a campaign or
      // discount `?code=`) is not an OAuth redirect and must be left alone.
      const codeParam = searchParams.get('code');
      const code =
        codeParam && (state || UUID_PATTERN.test(codeParam)) ? codeParam : null;

      const error =
        errorParam &&
        (OAUTH_ERROR_CODES.has(errorParam.toLowerCase()) ||
          searchParams.has('error_description') ||
          searchParams.has('error_code') ||
          state)
          ? errorParam
          : null;

      // Only handle if this is an OAuth redirect
      if (!code && !error) return;

      // If we're already on the callback route, don't attempt to re-route
      // (avoids redirect loops where the callback page itself contains this wrapper)
      if (
        typeof window !== 'undefined' &&
        window.location.pathname === '/auth/callback'
      ) {
        return;
      }

      // Prevent double handling
      if (isHandling) return;
      setIsHandling(true);

      try {
        if (error) {
          // Handle OAuth error
          window.location.assign(
            `${appBase}/auth/signin?error=oauth_cancelled&message=${encodeURIComponent('Sign in was cancelled. Please try again.')}`,
          );
          return;
        }

        if (code) {
          // This is an OAuth redirect, send to callback handler
          // Get the current URL to preserve all query parameters
          const currentUrl = new URL(window.location.href);
          const callbackUrl = new URL(`${appBase}/auth/callback`);
          callbackUrl.search = currentUrl.search;

          // Redirect to the callback route with all query parameters.
          // This route is implemented as a server GET handler (app/auth/callback/route.ts),
          // so perform a full-page navigation to ensure the server route executes
          // instead of attempting a client-side App Router render (which yields 404).
          window.location.replace(callbackUrl.toString());
        }
      } catch {
        window.location.assign(
          `${appBase}/auth/signin?error=oauth_error&message=An error occurred during sign in. Please try again.`,
        );
      }
    };

    handleOAuthRedirect();
  }, [searchParams, isHandling]);

  // Return an empty fragment instead of null
  return <></>;
}

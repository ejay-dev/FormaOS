'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
const appBase = 'https://app.formaos.com.au';

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

export function OAuthRedirectWrapper() {
  const searchParams = useSearchParams();
  const [isHandling, setIsHandling] = useState(false);

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

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
          console.log('[OAuthRedirectWrapper] OAuth error detected:', error);
          window.location.assign(
            `${appBase}/auth/signin?error=oauth_cancelled&message=${encodeURIComponent('Sign in was cancelled. Please try again.')}`,
          );
          return;
        }

        if (code) {
          // This is an OAuth redirect, send to callback handler
          console.log(
            '[OAuthRedirectWrapper] OAuth code detected, redirecting to callback',
          );

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
      } catch (error) {
        console.error(
          '[OAuthRedirectWrapper] Error handling OAuth redirect:',
          error,
        );
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

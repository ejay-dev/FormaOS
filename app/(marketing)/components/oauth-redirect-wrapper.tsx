'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isHandling, setIsHandling] = useState(false);

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Only handle if this is an OAuth redirect
      if (!code && !error) return;

      // Prevent double handling
      if (isHandling) return;
      setIsHandling(true);

      try {
        if (error) {
          // Handle OAuth error
          console.log('[OAuthRedirectWrapper] OAuth error detected:', error);
          router.push(
            `/auth/signin?error=oauth_cancelled&message=${encodeURIComponent('Sign in was cancelled. Please try again.')}`,
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

          // Change the pathname to the callback route
          currentUrl.pathname = '/auth/callback';

          // Redirect to the callback route with all query parameters
          router.push(currentUrl.toString());
        }
      } catch (error) {
        console.error(
          '[OAuthRedirectWrapper] Error handling OAuth redirect:',
          error,
        );
        router.push(
          '/auth/signin?error=oauth_error&message=An error occurred during sign in. Please try again.',
        );
      }
    };

    handleOAuthRedirect();
  }, [searchParams, router, isHandling]);

  // Return an empty fragment instead of null
  return <></>;
}

'use client';

/**
 * ⚠️  DEPRECATED – Google Identity Services / signInWithIdToken flow.
 *
 * This component has been disabled because it caused 401 invalid_client
 * errors in production. The root cause was a mismatch between the
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID env var and the OAuth client configured
 * inside Supabase Auth → Providers → Google.
 *
 * The correct long-term fix for branded consent screens is:
 *   → Supabase Custom Auth Domain (requires Pro plan)
 *   → https://supabase.com/docs/guides/auth/custom-domains
 *
 * Until then, we use the standard signInWithOAuth() flow which routes
 * through Supabase's hosted callback and is rock-solid stable.
 *
 * DO NOT re-enable without first:
 * 1. Verifying the Google Cloud OAuth client ID matches Supabase config
 * 2. Testing in Incognito on production domain
 * 3. Confirming no 401 errors
 */

/** Stub export so stale imports don't break the build. */
export function GoogleOneTap() {
  return null;
}

/** Always returns false — GIS is disabled. */
export function isGoogleOneTapAvailable() {
  return false;
}

/**
 * MFA Session Gate
 *
 * Bridges Supabase's password sign-in (which mints a session immediately)
 * with FormaOS's TOTP/backup-code challenge. A 2FA-enabled user's session
 * is considered "MFA-passed" only when its `session_id` claim has been
 * recorded in `user_security.mfa_passed_session_id` after a successful
 * TOTP / backup-code verification.
 *
 * The `/app/*` layout, the OAuth callback, and the sign-in client all
 * consult this module to decide whether to admit a user or redirect to
 * the MFA challenge page.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export const MFA_CHALLENGE_PATH = '/auth/mfa-challenge';

export interface MfaGateState {
  /** User has TOTP enabled and must clear the challenge for their current session. */
  required: boolean;
  /** The current session has cleared the challenge. */
  passed: boolean;
  /** The Supabase access-token `session_id` claim, if available. */
  sessionId: string | null;
}

interface MfaSessionRow {
  two_factor_enabled: boolean | null;
  mfa_passed_session_id: string | null;
}

/**
 * Decode the `session_id` claim out of a Supabase access token without
 * verifying the signature — Supabase already verified it before issuing
 * cookies. Returns null if the token is malformed.
 */
export function extractSessionIdFromAccessToken(
  accessToken: string | null | undefined,
): string | null {
  if (!accessToken) return null;
  const parts = accessToken.split('.');
  if (parts.length !== 3) return null;
  try {
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as { session_id?: unknown };
    if (typeof payload.session_id === 'string' && payload.session_id.length > 0) {
      return payload.session_id;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Compute the gate state for the currently-authenticated user.
 * Safe to call from a server component or route handler.
 */
export async function evaluateMfaGate(
  supabase?: SupabaseClient,
): Promise<MfaGateState> {
  const client = supabase ?? (await createSupabaseServerClient());

  const [{ data: sessionData }, { data: userData }] = await Promise.all([
    client.auth.getSession(),
    client.auth.getUser(),
  ]);

  const userId = userData?.user?.id ?? null;
  const sessionId = extractSessionIdFromAccessToken(
    sessionData?.session?.access_token,
  );

  if (!userId) {
    return { required: false, passed: true, sessionId };
  }

  const { data } = await client
    .from('user_security')
    .select('two_factor_enabled, mfa_passed_session_id')
    .eq('user_id', userId)
    .maybeSingle<MfaSessionRow>();

  const required = data?.two_factor_enabled === true;
  if (!required) {
    return { required: false, passed: true, sessionId };
  }

  const passed =
    sessionId !== null &&
    typeof data?.mfa_passed_session_id === 'string' &&
    data.mfa_passed_session_id === sessionId;

  return { required, passed, sessionId };
}

/**
 * Mark the current session as MFA-passed. Called only after the TOTP /
 * backup-code verification has succeeded server-side.
 */
export async function markMfaPassedForCurrentSession(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
): Promise<void> {
  await supabase
    .from('user_security')
    .update({
      mfa_passed_session_id: sessionId,
      mfa_passed_at: new Date().toISOString(),
      mfa_failed_attempts: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

/**
 * Increment the failed-attempts counter. Used for audit + future
 * lockout policy. The hard rate limit is enforced by the rate-limiter
 * middleware at the route level.
 */
export async function recordMfaFailure(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  // Read-then-write is acceptable here: the rate limiter is the
  // authoritative defence; this counter only powers UX/audit.
  const { data } = await supabase
    .from('user_security')
    .select('mfa_failed_attempts')
    .eq('user_id', userId)
    .maybeSingle<{ mfa_failed_attempts: number | null }>();

  const next = (data?.mfa_failed_attempts ?? 0) + 1;
  await supabase
    .from('user_security')
    .update({
      mfa_failed_attempts: next,
      mfa_last_failure_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

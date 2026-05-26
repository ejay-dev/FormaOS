import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Audit 2026-05-26 — P0-13: per-user JWT-iat watermark.
//
// `assertSessionNotRevoked(userId, accessToken)` is the read side. Call
// it inside every server-side auth gate (admin + v1 API) after the
// session is resolved but before any privileged work. If the JWT was
// issued at or before the user's revoked_at, throw — Supabase will
// auto-refresh the token (which re-reads role + membership state from
// the DB) and the next call comes in with a fresh `iat`.
//
// `revokeAllSessions(userId, ...)` is the write side. Called from the
// admin session-revoke endpoint, role-downgrade flows, and membership
// removal. Idempotent upsert on the per-user row.

export class SessionRevokedError extends Error {
  constructor(public userId: string) {
    super('Session revoked');
    this.name = 'SessionRevokedError';
  }
}

/**
 * Returns the iat claim (seconds since epoch) from a Supabase access
 * token. Signature is not verified — Supabase already did that before
 * issuing the cookie. Returns null on malformed tokens.
 */
export function extractIatFromAccessToken(
  accessToken: string | null | undefined,
): number | null {
  if (!accessToken) return null;
  const parts = accessToken.split('.');
  if (parts.length !== 3) return null;
  try {
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as { iat?: unknown };
    if (typeof payload.iat === 'number' && Number.isFinite(payload.iat)) {
      return payload.iat;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Throws SessionRevokedError if `accessToken.iat` is at or before the
 * user's revocation watermark. No-op if the user has no revocation row
 * or the token has no iat claim (defensive — never bricks login flows
 * on malformed tokens).
 */
export async function assertSessionNotRevoked(
  userId: string,
  accessToken: string | null | undefined,
): Promise<void> {
  const iatSeconds = extractIatFromAccessToken(accessToken);
  if (iatSeconds === null) return;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('user_session_revocations')
    .select('revoked_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.revoked_at) return;

  const revokedAtSeconds = Math.floor(
    new Date(data.revoked_at as string).getTime() / 1000,
  );
  if (iatSeconds <= revokedAtSeconds) {
    throw new SessionRevokedError(userId);
  }
}

/**
 * Set the per-user revocation watermark to `now` (or `revokedAt` when
 * the caller needs to anchor to a specific moment). Every access token
 * issued at or before this timestamp will be rejected by
 * assertSessionNotRevoked.
 *
 * Returns the upserted timestamp.
 */
export async function revokeAllSessions(
  userId: string,
  options: {
    revokedBy?: string | null;
    reason?: string | null;
    revokedAt?: Date;
  } = {},
): Promise<Date> {
  const revokedAt = options.revokedAt ?? new Date();
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('user_session_revocations')
    .upsert(
      {
        user_id: userId,
        revoked_at: revokedAt.toISOString(),
        revoked_by: options.revokedBy ?? null,
        reason: options.reason ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    throw new Error(`Failed to record session revocation: ${error.message}`);
  }

  return revokedAt;
}

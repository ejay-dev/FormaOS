import 'server-only';

import { getRedisClient } from '@/lib/redis/client';
import { consoleShim } from '@/lib/monitoring/console-shim';

/**
 * Audit 2026-05-26 (H3): per-email failed-login counter and lockout.
 *
 * Background: `rateLimitAuth` enforces IP-keyed limits which stop
 * botnets and brute-force-from-one-IP attacks, but do NOT protect a
 * single account against slow, distributed credential-stuffing
 * attempts (e.g. one attempt per minute from each of a thousand IPs
 * over a week). The fix is a per-email counter: lock the account out
 * after N consecutive failed logins, regardless of source IP.
 *
 * Design:
 *   - Redis-backed sliding counter, keyed by `auth-lockout:<emailLower>`.
 *   - Threshold: 5 failures within 15 minutes → 15-minute lockout.
 *   - Successful login (or admin reset) calls `clearLockout(email)`
 *     to wipe the counter.
 *   - When Redis is unconfigured, the helpers degrade to a no-op
 *     (with a single warn-log per invocation) so dev/preview still
 *     accept logins. Production must have UPSTASH_REDIS_REST_URL +
 *     UPSTASH_REDIS_REST_TOKEN set; otherwise this protection is
 *     non-operative.
 *   - Email is lowercased and trimmed before keying so case variants
 *     can't bypass the lockout.
 *
 * Integration points:
 *   - lib/security/log/route.ts ('login_failure' event) calls
 *     `recordLoginFailure(email)`.
 *   - /api/auth/check-lockout (new POST endpoint) calls
 *     `isAccountLocked(email)` and returns the verdict + retry
 *     window so the signin form can surface a clear error before
 *     calling supabase.auth.signInWithPassword.
 *   - Auth callback / successful login paths call
 *     `clearLockout(email)` to reset on success.
 */

const KEY_PREFIX = 'auth-lockout';
const FAILURE_THRESHOLD = 5;
const WINDOW_SECONDS = 15 * 60; // 15-minute sliding window
const LOCKOUT_SECONDS = 15 * 60; // 15-minute lockout after threshold

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function keyFor(email: string): string {
  return `${KEY_PREFIX}:${normalizeEmail(email)}`;
}

export interface LockoutStatus {
  locked: boolean;
  /** Seconds remaining on the lockout (when locked = true). */
  retryAfterSeconds?: number;
  /** Count of failed attempts in the current window. */
  failureCount: number;
}

/**
 * Record a failed login attempt for the given email. Returns the
 * post-increment count, or null if Redis is unavailable.
 *
 * On the call that crosses the threshold, sets a fixed-TTL lockout
 * marker that `isAccountLocked` detects.
 */
export async function recordLoginFailure(
  email: string,
): Promise<number | null> {
  const redis = getRedisClient();
  if (!redis) {
    consoleShim.warn(
      '[account-lockout] recordLoginFailure skipped — Redis not configured',
    );
    return null;
  }

  const key = keyFor(email);

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      // First failure in this window — set the sliding TTL.
      await redis.expire(key, WINDOW_SECONDS);
    } else if (count === FAILURE_THRESHOLD) {
      // Threshold crossed — extend TTL to the lockout window so the
      // counter persists for the full lockout regardless of when the
      // first failure landed in the original sliding window.
      await redis.expire(key, LOCKOUT_SECONDS);
    } else if (count > FAILURE_THRESHOLD) {
      // Every additional attempt while locked refreshes the lockout
      // window so attackers can't roll the counter off by spacing
      // attempts beyond the original window.
      await redis.expire(key, LOCKOUT_SECONDS);
    }
    return count;
  } catch (err) {
    consoleShim.warn('[account-lockout] recordLoginFailure error:', err);
    return null;
  }
}

/**
 * Check whether the account is currently locked. Returns:
 *   - `{ locked: false, failureCount: <0..threshold> }` for normal
 *     state, including "near threshold but not yet locked"
 *   - `{ locked: true, retryAfterSeconds, failureCount }` after the
 *     threshold has been reached
 *
 * Failure modes (Redis down, etc.) fall through to `{ locked: false }`
 * — better to admit a real login than to lock everyone out when the
 * counter itself is broken.
 */
export async function isAccountLocked(email: string): Promise<LockoutStatus> {
  const redis = getRedisClient();
  if (!redis) {
    consoleShim.warn(
      '[account-lockout] isAccountLocked skipped — Redis not configured',
    );
    return { locked: false, failureCount: 0 };
  }

  const key = keyFor(email);

  try {
    const [countRaw, ttl] = await Promise.all([redis.get<number>(key), redis.ttl(key)]);
    const count = Number(countRaw ?? 0);

    if (count < FAILURE_THRESHOLD) {
      return { locked: false, failureCount: count };
    }

    return {
      locked: true,
      retryAfterSeconds: ttl > 0 ? ttl : LOCKOUT_SECONDS,
      failureCount: count,
    };
  } catch (err) {
    consoleShim.warn('[account-lockout] isAccountLocked error:', err);
    return { locked: false, failureCount: 0 };
  }
}

/**
 * Clear any lockout / failure counter for the email. Called from the
 * successful-login path so a user who has 4 failures and then enters
 * the right password isn't carrying baggage into their next session.
 */
export async function clearLockout(email: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const key = keyFor(email);
  try {
    await redis.del(key);
  } catch (err) {
    consoleShim.warn('[account-lockout] clearLockout error:', err);
  }
}

export const ACCOUNT_LOCKOUT_THRESHOLD = FAILURE_THRESHOLD;
export const ACCOUNT_LOCKOUT_WINDOW_SECONDS = WINDOW_SECONDS;

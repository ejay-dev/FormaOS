import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAccountLocked } from '@/lib/security/account-lockout';
import { rateLimitAuth } from '@/lib/security/rate-limiter';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import {
  emailSchema,
  formatZodError,
  validateBody,
} from '@/lib/security/api-validation';

const checkLockoutSchema = z.object({
  email: emailSchema,
});

export const runtime = 'nodejs';

/**
 * Audit 2026-05-26 (H3): pre-flight lockout check for the signin form.
 *
 * The signin flow runs against `supabase.auth.signInWithPassword` in
 * the browser; we can't intercept that call server-side. To enforce
 * the per-email lockout, the form posts here before submitting:
 *
 *   POST /api/auth/check-lockout  { email }
 *     → 200 { locked: false }                              continue
 *     → 200 { locked: true, retryAfterSeconds: 870 }       block submit + show message
 *
 * Auth gate: IP rate-limited via rateLimitAuth so this endpoint can't
 * itself be a username-enumeration tool (consistent shape regardless
 * of whether the email exists in `auth.users`).
 *
 * Side-channel safety: the response shape does NOT differ between
 * "email exists but not locked" and "email doesn't exist." Lockout
 * state lives in Redis under a hash of the lowercase email; we
 * return false for both unknown and not-yet-failed addresses.
 */
export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const { allowed, headers, error } = await rateLimitAuth(request);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: error ?? 'too_many_requests' },
      { status: 429, headers },
    );
  }

  const validation = await validateBody(request, checkLockoutSchema);
  if (!validation.success) {
    return NextResponse.json(formatZodError(validation.error), {
      status: 400,
      headers,
    });
  }

  const status = await isAccountLocked(validation.data.email);
  return NextResponse.json(
    {
      locked: status.locked,
      retryAfterSeconds: status.retryAfterSeconds,
    },
    { headers },
  );
}

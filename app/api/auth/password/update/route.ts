import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { validatePassword } from '@/lib/security/password-security';
import {
  isPasswordReused,
  recordPasswordHistory,
} from '@/lib/security/password-history';
import {
  logSecurityEvent,
  SecurityEventTypes,
} from '@/lib/security/session-security';
import {
  rateLimitAuth,
  createRateLimitHeaders,
} from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // Rate limiting: Prevent brute force password update attempts
  const { allowed, headers } = await rateLimitAuth(request);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: 'too_many_requests' },
      { status: 429, headers },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!password) {
      return NextResponse.json(
        { ok: false, error: 'password_required' },
        { status: 400 },
      );
    }

    const validation = await validatePassword(password);
    if (!validation.valid) {
      return NextResponse.json(
        {
          ok: false,
          error: 'password_invalid',
          errors: validation.errors,
          breached: validation.breached,
          breachCount: validation.breachCount,
        },
        { status: 400 },
      );
    }

    const reused = await isPasswordReused(user.id, password);
    if (reused) {
      return NextResponse.json(
        {
          ok: false,
          error: 'password_reused',
          errors: ['Password was used recently. Choose a new password.'],
        },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 400 },
      );
    }

    await recordPasswordHistory(user.id, password);
    await logSecurityEvent({
      eventType: SecurityEventTypes.PASSWORD_CHANGE,
      userId: user.id,
      metadata: {
        source: 'password_reset',
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[auth/password/update] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'password_update_failed' },
      { status: 500 },
    );
  }
}

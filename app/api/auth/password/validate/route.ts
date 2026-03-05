import { NextResponse } from 'next/server';
import { validatePassword } from '@/lib/security/password-security';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  rateLimitAuth,

} from '@/lib/security/rate-limiter';

const log = routeLog('/api/auth/password/validate');

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // Rate limiting: Prevent brute force password validation attempts
  const { allowed, headers } = await rateLimitAuth(request);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, errors: ['Too many requests. Please try again later.'] },
      { status: 429, headers },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!password) {
      return NextResponse.json(
        { ok: false, errors: ['Password is required'] },
        { status: 400 },
      );
    }

    const validation = await validatePassword(password);
    if (!validation.valid) {
      return NextResponse.json(
        {
          ok: false,
          errors: validation.errors,
          breached: validation.breached,
          breachCount: validation.breachCount,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error({ err: error }, "[auth/password/validate] Error:");
    return NextResponse.json(
      { ok: false, errors: ['Unable to validate password'] },
      { status: 500 },
    );
  }
}

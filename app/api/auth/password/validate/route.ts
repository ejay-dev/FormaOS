import { NextResponse } from 'next/server';
import { validatePassword } from '@/lib/security/password-security';

export const runtime = 'nodejs';

export async function POST(request: Request) {
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
    console.error('[auth/password/validate] Error:', error);
    return NextResponse.json(
      { ok: false, errors: ['Unable to validate password'] },
      { status: 500 },
    );
  }
}

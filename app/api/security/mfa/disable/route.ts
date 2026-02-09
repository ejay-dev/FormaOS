import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { disable2FA } from '@/lib/security';
import {
  logSecurityEvent,
  SecurityEventTypes,
} from '@/lib/security/session-security';

export const runtime = 'nodejs';

export async function POST(request: Request) {
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
    const password =
      typeof body?.password === 'string' ? body.password : '';

    const disabled = await disable2FA(user.id, password);
    if (!disabled) {
      return NextResponse.json(
        { ok: false, error: 'mfa_disable_failed' },
        { status: 400 },
      );
    }

    await logSecurityEvent({
      eventType: SecurityEventTypes.MFA_DISABLED,
      userId: user.id,
      metadata: { source: 'settings' },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[security/mfa/disable] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'mfa_disable_failed' },
      { status: 500 },
    );
  }
}

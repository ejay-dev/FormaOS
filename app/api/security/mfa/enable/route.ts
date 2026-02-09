import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { enable2FA } from '@/lib/security';
import {
  logSecurityEvent,
  SecurityEventTypes,
} from '@/lib/security/session-security';
import { safeString } from '@/lib/security/api-validation';

export const runtime = 'nodejs';

const schema = z.object({
  token: safeString({ min: 4, max: 16 }),
});

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
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'invalid_token' },
        { status: 400 },
      );
    }

    const verified = await enable2FA(user.id, parsed.data.token);
    if (!verified) {
      return NextResponse.json(
        { ok: false, error: 'invalid_token' },
        { status: 400 },
      );
    }

    await logSecurityEvent({
      eventType: SecurityEventTypes.MFA_ENABLED,
      userId: user.id,
      metadata: { source: 'settings' },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[security/mfa/enable] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'mfa_enable_failed' },
      { status: 500 },
    );
  }
}

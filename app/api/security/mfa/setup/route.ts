import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generate2FASecret } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    const secret = await generate2FASecret(user.id, user.email);
    // Only return QR code and backup codes — never expose the raw TOTP secret
    return NextResponse.json({ ok: true, qrCode: secret.qrCode, backupCodes: secret.backupCodes });
  } catch (error) {
    console.error('[security/mfa/setup] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'mfa_setup_failed' },
      { status: 500 },
    );
  }
}

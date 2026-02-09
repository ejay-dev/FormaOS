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
    return NextResponse.json({ ok: true, ...secret });
  } catch (error) {
    console.error('[security/mfa/setup] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'mfa_setup_failed' },
      { status: 500 },
    );
  }
}

/**
 * Session Revocation API
 *
 * Allows admins to revoke active sessions (kick users)
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isFounder } from '@/lib/utils/founder';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    // Only founders can revoke sessions
    if (!isFounder(user.email, user.id)) {
      return NextResponse.json(
        { ok: false, error: 'forbidden' },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      sessionId?: string;
    };

    if (!body.sessionId) {
      return NextResponse.json(
        { ok: false, error: 'missing_session_id' },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();

    // Revoke the session
    const { error: revokeError } = await admin
      .from('active_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('session_id', body.sessionId);

    if (revokeError) {
      console.error('[Revoke] Failed to revoke session:', revokeError);
      return NextResponse.json(
        { ok: false, error: 'db_error' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Revoke] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

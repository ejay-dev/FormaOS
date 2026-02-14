/**
 * Active Sessions API
 *
 * Returns list of active sessions with user context
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isFounder } from '@/lib/utils/founder';

export async function GET(_request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !isFounder(user.email, user.id)) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    const admin = createSupabaseAdminClient();

    // Get active sessions with user profile info
    const { data: sessions, error } = await admin
      .from('active_sessions')
      .select(
        `
        *,
        user:user_profiles!inner(email, full_name),
        org:organizations(name)
      `,
      )
      .is('revoked_at', null)
      .order('last_seen_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Sessions] Failed to fetch:', error);
      return NextResponse.json(
        { ok: false, error: 'db_error' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      sessions: sessions || [],
    });
  } catch (error) {
    console.error('[Sessions] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

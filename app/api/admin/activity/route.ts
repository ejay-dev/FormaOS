/**
 * User Activity API
 *
 * Returns recent user activity logs
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isFounder } from '@/lib/utils/founder';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '24h';
    const action = searchParams.get('action');

    const admin = createSupabaseAdminClient();

    // Calculate time window
    const hoursBack = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 168;
    const since = new Date(
      Date.now() - hoursBack * 60 * 60 * 1000,
    ).toISOString();

    let query = admin
      .from('user_activity')
      .select(
        `
        *,
        user:user_profiles!inner(email, full_name),
        org:organizations(name)
      `,
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(200);

    if (action) {
      query = query.eq('action', action);
    }

    const { data: activity, error } = await query;

    if (error) {
      console.error('[Activity] Failed to fetch:', error);
      return NextResponse.json(
        { ok: false, error: 'db_error' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      activity: activity || [],
      timeRange,
    });
  } catch (error) {
    console.error('[Activity] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

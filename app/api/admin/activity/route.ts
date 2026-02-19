/**
 * User Activity API
 *
 * Returns recent user activity logs
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isFounder } from '@/lib/utils/founder';
import { fetchAuthEmailsByIds } from '@/app/api/admin/_auth-users';
import { extractClientIP } from '@/lib/security/session-security';
import { logUnauthorizedAccess } from '@/lib/security/event-logger';
import {
  isSecurityDashboardEnabled,
  isSecurityMonitoringEnabled,
} from '@/lib/security/monitoring-flags';

type ActivityRow = {
  id: string;
  created_at: string;
  user_id: string;
  org_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  route: string | null;
  metadata: Record<string, unknown> | null;
};

async function loadUserContext(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userIds: string[],
) {
  const uniqueUserIds = Array.from(new Set(userIds));
  if (!uniqueUserIds.length) {
    return {
      profileByUserId: new Map<string, { full_name: string | null }>(),
      emailByUserId: new Map<string, string>(),
    };
  }

  const { data: profiles } = await admin
    .from('user_profiles')
    .select('user_id, full_name')
    .in('user_id', uniqueUserIds);

  const profileByUserId = new Map<string, { full_name: string | null }>();
  (profiles ?? []).forEach((profile: any) => {
    profileByUserId.set(profile.user_id, {
      full_name: profile.full_name ?? null,
    });
  });

  const emailByUserId = await fetchAuthEmailsByIds(admin, uniqueUserIds);

  return { profileByUserId, emailByUserId };
}

function logUnauthorizedActivityAccess(request: Request, userId?: string) {
  const ip = extractClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  logUnauthorizedAccess({
    userId,
    ip,
    userAgent,
    path: '/api/admin/activity',
    method: request.method,
    userRole: userId ? 'non_founder' : 'anonymous',
  });
}

export async function GET(request: Request) {
  if (!isSecurityMonitoringEnabled() || !isSecurityDashboardEnabled()) {
    return NextResponse.json({ ok: false, error: 'disabled' }, { status: 404 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logUnauthorizedActivityAccess(request);
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    if (!isFounder(user.email, user.id)) {
      logUnauthorizedActivityAccess(request, user.id);
      return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
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
        'id, created_at, user_id, org_id, action, entity_type, entity_id, route, metadata',
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(150);

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

    const activityRows = (activity ?? []) as ActivityRow[];
    const userIds = Array.from(new Set(activityRows.map((entry) => entry.user_id)));
    const orgIds = Array.from(
      new Set(
        activityRows
          .map((entry) => entry.org_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const [{ data: organizations }, userContext] = await Promise.all([
      orgIds.length
        ? admin.from('organizations').select('id, name').in('id', orgIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
      loadUserContext(admin, userIds),
    ]);

    const orgById = new Map<string, { id: string; name: string }>();
    (organizations ?? []).forEach((org: any) => {
      orgById.set(org.id, { id: org.id, name: org.name });
    });

    const enrichedActivity = activityRows.map((entry) => {
      const profile = userContext.profileByUserId.get(entry.user_id);
      const email = userContext.emailByUserId.get(entry.user_id) ?? null;
      const organization = entry.org_id ? orgById.get(entry.org_id) : null;

      return {
        ...entry,
        user: {
          id: entry.user_id,
          full_name: profile?.full_name ?? null,
          email,
        },
        org: organization,
      };
    });

    return NextResponse.json({
      ok: true,
      activity: enrichedActivity,
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

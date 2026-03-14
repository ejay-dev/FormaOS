/**
 * Active Sessions API
 *
 * Returns list of active sessions with user context
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/app/app/admin/access';
import { fetchAuthEmailsByIds } from '@/app/api/admin/_auth-users';
import { extractClientIP } from '@/lib/security/session-security';
import { logUnauthorizedAccess } from '@/lib/security/event-logger';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  isSecurityDashboardEnabled,
  isSecurityMonitoringEnabled,
} from '@/lib/security/monitoring-flags';

const log = routeLog('/api/admin/sessions');

type SessionRow = {
  id: string;
  session_id: string;
  user_id: string;
  org_id: string | null;
  created_at: string;
  last_seen_at: string;
  ip_address: string | null;
  user_agent: string | null;
  device_fingerprint: string | null;
  geo_country: string | null;
  geo_region: string | null;
  geo_city: string | null;
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
  (profiles ?? []).forEach((profile: Record<string, unknown>) => {
    profileByUserId.set(profile.user_id as string, {
      full_name: (profile.full_name as string | null) ?? null,
    });
  });

  const emailByUserId = await fetchAuthEmailsByIds(admin, uniqueUserIds);

  return { profileByUserId, emailByUserId };
}

function logUnauthorizedSessionsAccess(request: Request, userId?: string) {
  const ip = extractClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  logUnauthorizedAccess({
    userId,
    ip,
    userAgent,
    path: '/api/admin/sessions',
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
      logUnauthorizedSessionsAccess(request);
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    try {
      await requireAdminAccess({ permission: 'security:view' });
    } catch {
      logUnauthorizedSessionsAccess(request, user.id);
      return NextResponse.json(
        { ok: false, error: 'forbidden' },
        { status: 403 },
      );
    }

    const admin = createSupabaseAdminClient();

    // Get active sessions and enrich user/org context in-process.
    const { data: sessions, error } = await admin
      .from('active_sessions')
      .select(
        'id, session_id, user_id, org_id, created_at, last_seen_at, ip_address, user_agent, device_fingerprint, geo_country, geo_region, geo_city, metadata',
      )
      .is('revoked_at', null)
      .order('last_seen_at', { ascending: false })
      .limit(100);

    if (error) {
      log.error({ err: error }, '[Sessions] Failed to fetch:');
      return NextResponse.json(
        { ok: false, error: 'db_error' },
        { status: 500 },
      );
    }

    const sessionRows = (sessions ?? []) as SessionRow[];
    const userIds = Array.from(new Set(sessionRows.map((s) => s.user_id)));
    const orgIds = Array.from(
      new Set(
        sessionRows
          .map((s) => s.org_id)
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
    (organizations ?? []).forEach((org: Record<string, unknown>) => {
      orgById.set(org.id as string, {
        id: org.id as string,
        name: org.name as string,
      });
    });

    const enrichedSessions = sessionRows.map((session) => {
      const profile = userContext.profileByUserId.get(session.user_id);
      const email = userContext.emailByUserId.get(session.user_id) ?? null;
      const organization = session.org_id ? orgById.get(session.org_id) : null;
      const isOnline =
        Date.now() - new Date(session.last_seen_at).getTime() < 3 * 60 * 1000;

      return {
        ...session,
        is_online: isOnline,
        user: {
          id: session.user_id,
          full_name: profile?.full_name ?? null,
          email,
        },
        org: organization,
      };
    });

    return NextResponse.json({
      ok: true,
      sessions: enrichedSessions,
    });
  } catch (error) {
    log.error({ err: error }, '[Sessions] Error:');
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

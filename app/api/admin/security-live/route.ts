import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isFounder } from '@/lib/utils/founder';
import { fetchAuthEmailsByIds } from '@/app/api/admin/_auth-users';
import { extractClientIP } from '@/lib/security/session-security';
import {
  logUnauthorizedAccess,
  logUserActivity,
} from '@/lib/security/event-logger';
import {
  isSecurityDashboardEnabled,
  isSecurityMonitoringEnabled,
} from '@/lib/security/monitoring-flags';

type SecurityEventRow = {
  id: string;
  created_at: string;
  type: string;
  severity: string;
  user_id: string | null;
  org_id: string | null;
  ip_address: string | null;
  geo_country: string | null;
  request_path: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
};

type SecurityAlertRow = {
  id: string;
  created_at: string;
  status: string;
  event_id: string;
  notes: string | null;
  assigned_to: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
};

const ALLOWED_STATUSES = new Set([
  'open',
  'acknowledged',
  'resolved',
  'false_positive',
]);

const ALLOWED_SEVERITIES = new Set([
  'info',
  'low',
  'medium',
  'high',
  'critical',
]);

function rangeToHours(range: string): number {
  if (range === '1h') return 1;
  if (range === '7d') return 168;
  return 24;
}

async function loadUserContext(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userIds: string[],
) {
  if (!userIds.length) {
    return {
      profileByUserId: new Map<string, { full_name: string | null }>(),
      emailByUserId: new Map<string, string>(),
    };
  }

  const uniqueUserIds = Array.from(new Set(userIds));

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

function logUnauthorizedSecurityAccess(request: Request, userId?: string) {
  const ip = extractClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  logUnauthorizedAccess({
    userId,
    ip,
    userAgent,
    path: '/api/admin/security-live',
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
      logUnauthorizedSecurityAccess(request);
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    if (!isFounder(user.email, user.id)) {
      logUnauthorizedSecurityAccess(request, user.id);
      return NextResponse.json(
        { ok: false, error: 'forbidden' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') ?? '24h';
    const status = searchParams.get('status') ?? '';
    const severity = searchParams.get('severity') ?? '';
    const orgId = searchParams.get('orgId') ?? '';
    const userId = searchParams.get('userId') ?? '';

    const hoursBack = rangeToHours(range);
    const since = new Date(
      Date.now() - hoursBack * 60 * 60 * 1000,
    ).toISOString();

    const admin = createSupabaseAdminClient();

    let eventQuery = admin
      .from('security_events')
      .select(
        'id, created_at, type, severity, user_id, org_id, ip_address, geo_country, request_path, user_agent, metadata',
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(120);

    if (severity && ALLOWED_SEVERITIES.has(severity)) {
      eventQuery = eventQuery.eq('severity', severity);
    }
    if (orgId) {
      eventQuery = eventQuery.eq('org_id', orgId);
    }
    if (userId) {
      eventQuery = eventQuery.eq('user_id', userId);
    }

    const { data: events, error: eventsError } = await eventQuery;
    if (eventsError) {
      console.error('[SecurityLive] Failed to fetch events:', eventsError);
      return NextResponse.json(
        { ok: false, error: 'db_error' },
        { status: 500 },
      );
    }

    const eventRows = (events ?? []) as SecurityEventRow[];
    const eventIds = eventRows.map((event) => event.id);

    let alertQuery = admin
      .from('security_alerts')
      .select(
        'id, created_at, status, event_id, notes, assigned_to, resolved_at, resolved_by, resolution_notes',
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(120);

    if (status && ALLOWED_STATUSES.has(status)) {
      alertQuery = alertQuery.eq('status', status);
    }

    if ((severity || orgId || userId) && eventIds.length > 0) {
      alertQuery = alertQuery.in('event_id', eventIds);
    }

    if ((severity || orgId || userId) && eventIds.length === 0) {
      return NextResponse.json({
        ok: true,
        alerts: [],
        events: [],
        summary: {
          openAlerts: 0,
          criticalEvents: 0,
          totalEvents: 0,
          timeRange: range,
        },
        filterOptions: { users: [], organizations: [] },
      });
    }

    const { data: alerts, error: alertsError } = await alertQuery;
    if (alertsError) {
      console.error('[SecurityLive] Failed to fetch alerts:', alertsError);
      return NextResponse.json(
        { ok: false, error: 'db_error' },
        { status: 500 },
      );
    }

    const alertRows = (alerts ?? []) as SecurityAlertRow[];
    const eventById = new Map(eventRows.map((event) => [event.id, event]));
    const alertsWithEvent = alertRows
      .map((alert) => ({
        ...alert,
        event: eventById.get(alert.event_id) ?? null,
      }))
      .filter((alert) => alert.event !== null);

    const orgIds = Array.from(
      new Set(eventRows.map((event) => event.org_id).filter(Boolean) as string[]),
    );
    const userIds = Array.from(
      new Set(eventRows.map((event) => event.user_id).filter(Boolean) as string[]),
    );

    const [{ data: organizations }, userContext] = await Promise.all([
      orgIds.length
        ? admin.from('organizations').select('id, name').in('id', orgIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
      loadUserContext(admin, userIds),
    ]);

    const organizationById = new Map<string, { id: string; name: string }>();
    (organizations ?? []).forEach((organization: any) => {
      organizationById.set(organization.id, organization);
    });

    const enrichedEvents = eventRows.map((event) => {
      const profile = event.user_id
        ? userContext.profileByUserId.get(event.user_id)
        : undefined;
      const email = event.user_id
        ? userContext.emailByUserId.get(event.user_id)
        : undefined;
      const org = event.org_id ? organizationById.get(event.org_id) : undefined;

      return {
        ...event,
        user: event.user_id
          ? {
              id: event.user_id,
              full_name: profile?.full_name ?? null,
              email: email ?? null,
            }
          : null,
        organization: org ?? null,
      };
    });

    const summary = {
      openAlerts: alertsWithEvent.filter((alert) => alert.status === 'open')
        .length,
      criticalEvents: enrichedEvents.filter(
        (event) => event.severity === 'critical' || event.severity === 'high',
      ).length,
      totalEvents: enrichedEvents.length,
      timeRange: range,
    };

    const filterOptions = {
      users: userIds.map((id) => ({
        id,
        full_name: userContext.profileByUserId.get(id)?.full_name ?? null,
        email: userContext.emailByUserId.get(id) ?? null,
      })),
      organizations: Array.from(organizationById.values()),
    };

    return NextResponse.json({
      ok: true,
      alerts: alertsWithEvent,
      events: enrichedEvents,
      summary,
      filterOptions,
    });
  } catch (error) {
    console.error('[SecurityLive] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
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
      logUnauthorizedSecurityAccess(request);
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    if (!isFounder(user.email, user.id)) {
      logUnauthorizedSecurityAccess(request, user.id);
      return NextResponse.json(
        { ok: false, error: 'forbidden' },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      alertId?: string;
      status?: string;
      notes?: string;
    };

    if (!body.alertId || !body.status || !ALLOWED_STATUSES.has(body.status)) {
      return NextResponse.json(
        { ok: false, error: 'invalid_payload' },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();
    const updateData: Record<string, unknown> = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    if (body.status === 'resolved' || body.status === 'false_positive') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id;
      updateData.resolution_notes = body.notes ?? null;
    } else if (body.status === 'acknowledged') {
      updateData.assigned_to = user.id;
    }

    const { data: alert, error: alertError } = await admin
      .from('security_alerts')
      .update(updateData)
      .eq('id', body.alertId)
      .select('id, event_id')
      .single();

    if (alertError || !alert) {
      console.error('[SecurityLive] Failed to update alert:', alertError);
      return NextResponse.json(
        { ok: false, error: 'db_error' },
        { status: 500 },
      );
    }

    const { data: event } = await admin
      .from('security_events')
      .select('org_id')
      .eq('id', alert.event_id)
      .single();

    logUserActivity({
      userId: user.id,
      orgId: event?.org_id ?? undefined,
      action: 'bulk_action',
      entityType: 'security_alert',
      entityId: alert.id,
      route: '/admin/security-live',
      metadata: {
        operation: 'alert_status_change',
        status: body.status,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[SecurityLive] PATCH error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

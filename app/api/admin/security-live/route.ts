/**
 * Security Live Alerts API
 *
 * Returns real-time security alerts and events for admin dashboard
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

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    // Only founders can view security monitoring
    if (!isFounder(user.email, user.id)) {
      return NextResponse.json(
        { ok: false, error: 'forbidden' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '24h';
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');

    const admin = createSupabaseAdminClient();

    // Calculate time window
    const hoursBack =
      timeRange === '1h'
        ? 1
        : timeRange === '24h'
          ? 24
          : timeRange === '7d'
            ? 168
            : 24;
    const since = new Date(
      Date.now() - hoursBack * 60 * 60 * 1000,
    ).toISOString();

    // Fetch alerts with event details
    let alertQuery = admin
      .from('security_alerts')
      .select(
        `
        *,
        event:security_events(*)
      `,
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status) {
      alertQuery = alertQuery.eq('status', status);
    }

    const { data: alerts, error: alertsError } = await alertQuery;

    if (alertsError) {
      console.error('[SecurityLive] Failed to fetch alerts:', alertsError);
      return NextResponse.json(
        { ok: false, error: 'db_error' },
        { status: 500 },
      );
    }

    // Fetch recent high-severity events (not necessarily alerted)
    let eventsQuery = admin
      .from('security_events')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);

    if (severity) {
      eventsQuery = eventsQuery.eq('severity', severity);
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('[SecurityLive] Failed to fetch events:', eventsError);
      return NextResponse.json(
        { ok: false, error: 'db_error' },
        { status: 500 },
      );
    }

    // Calculate summary stats
    const summary = {
      openAlerts: alerts?.filter((a: any) => a.status === 'open').length || 0,
      criticalEvents:
        events?.filter(
          (e: any) => e.severity === 'critical' || e.severity === 'high',
        ).length || 0,
      totalEvents: events?.length || 0,
      timeRange,
    };

    return NextResponse.json({
      ok: true,
      alerts: alerts || [],
      events: events || [],
      summary,
    });
  } catch (error) {
    console.error('[SecurityLive] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

// Update alert status
export async function PATCH(request: Request) {
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

    const body = (await request.json().catch(() => ({}))) as {
      alertId?: string;
      status?: string;
      notes?: string;
    };

    if (!body.alertId || !body.status) {
      return NextResponse.json(
        { ok: false, error: 'invalid_payload' },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();

    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    if (body.status === 'resolved' || body.status === 'false_positive') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id;
      updateData.resolution_notes = body.notes;
    } else if (body.status === 'acknowledged') {
      updateData.assigned_to = user.id;
    }

    const { error } = await admin
      .from('security_alerts')
      .update(updateData)
      .eq('id', body.alertId);

    if (error) {
      console.error('[SecurityLive] Failed to update alert:', error);
      return NextResponse.json(
        { ok: false, error: 'db_error' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[SecurityLive] PATCH error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

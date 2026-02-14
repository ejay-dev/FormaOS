/**
 * Session Revocation API
 *
 * Allows admins to revoke active sessions (kick users)
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isFounder } from '@/lib/utils/founder';
import { extractClientIP } from '@/lib/security/session-security';
import {
  logSecurityEventEnhanced,
  logUnauthorizedAccess,
  logUserActivity,
} from '@/lib/security/event-logger';
import { isSecurityMonitoringEnabled } from '@/lib/security/monitoring-flags';

export async function POST(request: Request) {
  if (!isSecurityMonitoringEnabled()) {
    return NextResponse.json({ ok: false, error: 'disabled' }, { status: 404 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logUnauthorizedAccess({
        ip: extractClientIP(request.headers),
        userAgent: request.headers.get('user-agent') ?? 'unknown',
        path: '/api/session/revoke',
        method: request.method,
        userRole: 'anonymous',
      });
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    // Only founders can revoke sessions
    if (!isFounder(user.email, user.id)) {
      logUnauthorizedAccess({
        userId: user.id,
        ip: extractClientIP(request.headers),
        userAgent: request.headers.get('user-agent') ?? 'unknown',
        path: '/api/session/revoke',
        method: request.method,
        userRole: 'non_founder',
      });
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

    const { data: sessionRecord } = await admin
      .from('active_sessions')
      .select('session_id, user_id, org_id')
      .eq('session_id', body.sessionId)
      .is('revoked_at', null)
      .single();

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

    const ip = extractClientIP(request.headers);
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    logSecurityEventEnhanced({
      type: 'session_revoked',
      severity: 'high',
      userId: user.id,
      orgId: sessionRecord?.org_id ?? undefined,
      ip,
      userAgent,
      path: '/api/session/revoke',
      method: request.method,
      metadata: {
        revokedSessionId: body.sessionId,
        revokedUserId: sessionRecord?.user_id ?? null,
        initiatedBy: 'founder_dashboard',
      },
    });

    logUserActivity({
      userId: user.id,
      orgId: sessionRecord?.org_id ?? undefined,
      action: 'role_change',
      entityType: 'session',
      entityId: body.sessionId,
      route: '/admin/sessions',
      metadata: {
        operation: 'session_revoke',
        targetUserId: sessionRecord?.user_id ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Revoke] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

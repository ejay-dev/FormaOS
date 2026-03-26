import { requireAdminAccess } from '@/app/app/admin/access';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  handleAdminError,
  ADMIN_CACHE_HEADERS,
} from '@/app/api/admin/_helpers';

const log = routeLog('/api/admin/security');

/**
 * GET /api/admin/security — Real security events from admin_audit_log
 *
 * Returns recent audit log entries, categorized by severity.
 * No mock data — all from live DB.
 */
export async function GET() {
  try {
    await requireAdminAccess({ permission: 'security:view' });
    const admin = createSupabaseAdminClient();

    /* ── Recent audit events (last 7 days, limit 50) ──── */
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { data: auditEvents, error } = await admin
      .from('platform_admin_audit_feed')
      .select('id, actor_user_id, action, target_type, target_id, metadata, created_at')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      log.error({ err: error }, '/api/admin/security audit query error:');
    }

    /* ── Map audit events to security event shape ──────── */
    const HIGH_SEVERITY_ACTIONS = new Set([
      'org_lock',
      'org_suspend',
      'org_retire',
      'user_lock',
      'delete_org',
      'trial_reset',
      'emergency_lockdown',
    ]);
    const MEDIUM_SEVERITY_ACTIONS = new Set([
      'org_plan_update',
      'trial_extend',
      'expire_trial',
      'user_unlock',
      'org_unlock',
      'org_restore',
      'subscription_resync',
      'repair_org',
      'repair_user',
      'session_revoke',
    ]);

    const events = (auditEvents ?? []).map((e: Record<string, unknown>) => {
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (HIGH_SEVERITY_ACTIONS.has(e.action as string)) severity = 'high';
      else if (MEDIUM_SEVERITY_ACTIONS.has(e.action as string))
        severity = 'medium';

      return {
        id: e.id,
        event_type: e.action,
        severity,
        actor_id: e.actor_user_id,
        target_type: e.target_type,
        target_id: e.target_id,
        description: `${e.action as string} on ${e.target_type as string} ${(e.target_id as string)?.slice(0, 8)}…`,
        timestamp: e.created_at,
        meta: e.metadata,
      };
    });

    /* ── Summary counts ────────────────────────────────── */
    const totalEvents = events.length;
    const highSeverity = events.filter(
      (e: Record<string, unknown>) => e.severity === 'high',
    ).length;
    const mediumSeverity = events.filter(
      (e: Record<string, unknown>) => e.severity === 'medium',
    ).length;

    return NextResponse.json(
      {
        events,
        summary: {
          total: totalEvents,
          high: highSeverity,
          medium: mediumSeverity,
          low: totalEvents - highSeverity - mediumSeverity,
          period: '7d',
        },
      },
      { headers: ADMIN_CACHE_HEADERS },
    );
  } catch (error) {
    return handleAdminError(error, '/api/admin/security');
  }
}

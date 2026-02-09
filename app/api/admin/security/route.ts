import { requireFounderAccess } from '@/app/app/admin/access';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import {
  handleAdminError,
  ADMIN_CACHE_HEADERS,
} from '@/app/api/admin/_helpers';

/**
 * GET /api/admin/security — Real security events from admin_audit_log
 *
 * Returns recent audit log entries, categorized by severity.
 * No mock data — all from live DB.
 */
export async function GET() {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();

    /* ── Recent audit events (last 7 days, limit 50) ──── */
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { data: auditEvents, error } = await admin
      .from('admin_audit_log')
      .select('id, actor_id, action, target_type, target_id, meta, created_at')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('/api/admin/security audit query error:', error);
    }

    /* ── Map audit events to security event shape ──────── */
    const HIGH_SEVERITY_ACTIONS = new Set([
      'block_org',
      'lock_user',
      'delete_org',
      'reset_trial',
    ]);
    const MEDIUM_SEVERITY_ACTIONS = new Set([
      'change_plan',
      'extend_trial',
      'expire_trial',
      'unlock_user',
      'unblock_org',
      'resync_stripe',
      'repair_org',
      'repair_user',
    ]);

    const events = (auditEvents ?? []).map((e: any) => {
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (HIGH_SEVERITY_ACTIONS.has(e.action)) severity = 'high';
      else if (MEDIUM_SEVERITY_ACTIONS.has(e.action)) severity = 'medium';

      return {
        id: e.id,
        event_type: e.action,
        severity,
        actor_id: e.actor_id,
        target_type: e.target_type,
        target_id: e.target_id,
        description: `${e.action} on ${e.target_type} ${e.target_id?.slice(0, 8)}…`,
        timestamp: e.created_at,
        meta: e.meta,
      };
    });

    /* ── Summary counts ────────────────────────────────── */
    const totalEvents = events.length;
    const highSeverity = events.filter(
      (e: any) => e.severity === 'high',
    ).length;
    const mediumSeverity = events.filter(
      (e: any) => e.severity === 'medium',
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

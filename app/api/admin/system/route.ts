import { requireFounderAccess } from '@/app/app/admin/access';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/system — Real system metrics
 *
 * All values computed from live data — no hardcoded fakes.
 */
export async function GET() {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();

    /* ── DB latency (timed round-trip) ─────────────────── */
    const t0 = performance.now();
    await admin
      .from('organizations')
      .select('id', { count: 'exact', head: true });
    const dbLatencyMs = Math.round(performance.now() - t0);

    /* ── Table counts ──────────────────────────────────── */
    const [
      { count: orgCount },
      { count: subCount },
      { count: memberCount },
      { count: auditCount },
    ] = await Promise.all([
      admin.from('organizations').select('*', { count: 'exact', head: true }),
      admin
        .from('org_subscriptions')
        .select('*', { count: 'exact', head: true }),
      admin.from('org_members').select('*', { count: 'exact', head: true }),
      admin.from('admin_audit_log').select('*', { count: 'exact', head: true }),
    ]);

    /* ── Recent admin actions (last 24 h) ─────────────── */
    const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const { count: recentAdminActions } = await admin
      .from('admin_audit_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);

    /* ── Recent billing events (last 24 h) ────────────── */
    const { count: recentBillingEvents } = await admin
      .from('billing_events')
      .select('*', { count: 'exact', head: true })
      .gte('processed_at', oneDayAgo);

    /* ── Build information from Vercel env ────────────── */
    const buildVersion =
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
      process.env.npm_package_version ||
      'dev';
    const buildTimestamp = process.env.VERCEL_GIT_COMMIT_TIMESTAMP || null;
    const environment =
      process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';

    return NextResponse.json({
      database_latency_ms: dbLatencyMs,
      total_organizations: orgCount ?? 0,
      total_subscriptions: subCount ?? 0,
      total_members: memberCount ?? 0,
      total_audit_entries: auditCount ?? 0,
      recent_admin_actions_24h: recentAdminActions ?? 0,
      recent_billing_events_24h: recentBillingEvents ?? 0,
      build_version: buildVersion,
      build_timestamp: buildTimestamp,
      environment,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('/api/admin/system error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system status' },
      { status: 500 },
    );
  }
}

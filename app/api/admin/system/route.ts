import { requireFounderAccess } from '@/app/app/admin/access';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { handleAdminError, ADMIN_CACHE_HEADERS } from '@/app/api/admin/_helpers';

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
    const [orgsResult, subsResult, membersResult, auditResult] =
      await Promise.all([
        admin.from('organizations').select('*', { count: 'exact', head: true }),
        admin
          .from('org_subscriptions')
          .select('*', { count: 'exact', head: true }),
        admin.from('org_members').select('*', { count: 'exact', head: true }),
        admin
          .from('admin_audit_log')
          .select('*', { count: 'exact', head: true }),
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

    return NextResponse.json(
      {
        database_latency_ms: dbLatencyMs,
        total_organizations: orgsResult.error ? null : (orgsResult.count ?? 0),
        total_subscriptions: subsResult.error ? null : (subsResult.count ?? 0),
        total_members: membersResult.error ? null : (membersResult.count ?? 0),
        total_audit_entries: auditResult.error
          ? null
          : (auditResult.count ?? 0),
        recent_admin_actions_24h: recentAdminActions ?? 0,
        recent_billing_events_24h: recentBillingEvents ?? 0,
        build_version: buildVersion,
        build_timestamp: buildTimestamp,
        environment,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (error: any) {
    const msg = error?.message ?? '';
    if (msg === 'Unauthorized' || msg === 'Forbidden') {
      return NextResponse.json(
        { error: 'Unavailable (permission)' },
        { status: 403 },
      );
    }
    console.error('/api/admin/system error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system status' },
      { status: 500 },
    );
  }
}

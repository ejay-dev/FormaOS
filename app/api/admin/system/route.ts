import { requireFounderAccess } from '@/app/app/admin/access';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { CURRENT_RELEASE_NAME, CURRENT_VERSION } from '@/config/release';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/admin/system');

type RouteLatencyStat = {
  route: string;
  samples: number;
  p50_ms: number;
  p95_ms: number;
  avg_ms: number;
  max_ms: number;
};

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * p) - 1),
  );
  return Math.round(sorted[index]);
}

function buildRouteLatencyStats(
  rows: Array<{ route: string | null; metadata: unknown }>,
): {
  totalSamples: number;
  overallP50Ms: number | null;
  overallP95Ms: number | null;
  routes: RouteLatencyStat[];
} {
  const durationsByRoute = new Map<string, number[]>();
  const allDurations: number[] = [];

  for (const row of rows) {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    if (metadata.nav_source !== 'sidebar') continue;

    const route =
      typeof metadata.to_route === 'string'
        ? metadata.to_route
        : (row.route ?? '');
    if (!route.startsWith('/app')) continue;

    const durationMs = Number(metadata.duration_ms);
    if (
      !Number.isFinite(durationMs) ||
      durationMs <= 0 ||
      durationMs > 120_000
    ) {
      continue;
    }

    allDurations.push(durationMs);
    if (!durationsByRoute.has(route)) durationsByRoute.set(route, []);
    durationsByRoute.get(route)!.push(durationMs);
  }

  const routes = Array.from(durationsByRoute.entries())
    .map(([route, durations]) => {
      const total = durations.reduce((sum, value) => sum + value, 0);
      return {
        route,
        samples: durations.length,
        p50_ms: percentile(durations, 0.5),
        p95_ms: percentile(durations, 0.95),
        avg_ms: Math.round(total / durations.length),
        max_ms: Math.round(Math.max(...durations)),
      } satisfies RouteLatencyStat;
    })
    .sort((a, b) => b.samples - a.samples)
    .slice(0, 12);

  return {
    totalSamples: allDurations.length,
    overallP50Ms:
      allDurations.length > 0 ? percentile(allDurations, 0.5) : null,
    overallP95Ms:
      allDurations.length > 0 ? percentile(allDurations, 0.95) : null,
    routes,
  };
}

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
        admin
          .from('organizations')
          .select('id', { count: 'exact', head: true }),
        admin
          .from('org_subscriptions')
          .select('organization_id', { count: 'exact', head: true }),
        admin.from('org_members').select('id', { count: 'exact', head: true }),
        admin
          .from('admin_audit_log')
          .select('id', { count: 'exact', head: true }),
      ]);

    /* ── Recent admin actions (last 24 h) ─────────────── */
    const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const { count: recentAdminActions } = await admin
      .from('admin_audit_log')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);

    /* ── Recent billing events (last 24 h) ────────────── */
    const { count: recentBillingEvents } = await admin
      .from('billing_events')
      .select('id', { count: 'exact', head: true })
      .gte('processed_at', oneDayAgo);

    /* ── Sidebar route transition latency (last 24 h) ─── */
    const { data: routeTransitionRows } = await admin
      .from('user_activity')
      .select('route, metadata')
      .eq('action', 'route_transition')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(5000);
    const routeTransitionStats = buildRouteLatencyStats(
      routeTransitionRows ?? [],
    );

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
        route_transition_samples_24h: routeTransitionStats.totalSamples,
        route_transition_p50_ms_24h: routeTransitionStats.overallP50Ms,
        route_transition_p95_ms_24h: routeTransitionStats.overallP95Ms,
        route_transition_routes_24h: routeTransitionStats.routes,
        build_version: buildVersion,
        build_timestamp: buildTimestamp,
        environment,
        product_release_version: CURRENT_VERSION,
        product_release_name: CURRENT_RELEASE_NAME,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (error: unknown) {
    const msg = (error as Error)?.message ?? '';
    if (msg === 'Unauthorized' || msg === 'Forbidden') {
      return NextResponse.json(
        { error: 'Unavailable (permission)' },
        { status: 403 },
      );
    }
    log.error({ err: error }, '/api/admin/system error:');
    return NextResponse.json(
      { error: 'Failed to fetch system status' },
      { status: 500 },
    );
  }
}

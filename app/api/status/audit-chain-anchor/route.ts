import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { routeLog } from '@/lib/monitoring/server-logger';

// Audit 2026-05-27 — public anchor-status endpoint backing /status.
//
// Returns aggregate statistics only (latest anchor timestamp, provider,
// public view URL, count over the last 30 days). No per-org data, no
// top_entry_hash, no signature material — those are sensitive enough
// that we only expose them to org members through audit_chain_anchors
// (RLS-gated SELECT).
//
// No auth: public can read these stats. The numbers prove "the chain
// is being anchored regularly" without leaking which orgs are large
// vs. small.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const log = routeLog('/api/status/audit-chain-anchor');

export async function GET() {
  const admin = createSupabaseAdminClient();

  const { data: latestArr, error: latestError } = await admin
    .from('audit_chain_anchors')
    .select('anchored_at, external_provider, external_anchor_url')
    .order('anchored_at', { ascending: false })
    .limit(1);

  if (latestError) {
    log.warn({ err: latestError }, 'failed to read latest anchor');
    return NextResponse.json(
      {
        latestAnchorAt: null,
        latestExternalProvider: null,
        latestExternalUrl: null,
        totalAnchorsLast30d: 0,
      },
      { status: 200 },
    );
  }

  const latest = latestArr?.[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const { count, error: countError } = await admin
    .from('audit_chain_anchors')
    .select('id', { count: 'exact', head: true })
    .gte('anchored_at', thirtyDaysAgo);

  if (countError) {
    log.warn({ err: countError }, 'failed to count anchors');
  }

  return NextResponse.json(
    {
      latestAnchorAt: latest?.anchored_at ?? null,
      latestExternalProvider: latest?.external_provider ?? null,
      latestExternalUrl: latest?.external_anchor_url ?? null,
      totalAnchorsLast30d: count ?? 0,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    },
  );
}

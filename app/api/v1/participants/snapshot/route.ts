import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

const log = routeLog('/api/v1/participants/snapshot');
const DAY_MS = 86_400_000;

export async function GET(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();
    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) {
      // Preserve historic "zeros" body for the no-org / unauth case so
      // dashboards still render an empty card; 409 (ambiguous active
      // org) is surfaced as-is so the client can prompt a switch.
      if (ctx.response.status === 409) return ctx.response;
      return NextResponse.json(
        { total: 0, plansOverdue: 0, restrictivePractices: 0 },
        { status: ctx.response.status },
      );
    }
    const { orgId } = ctx;

    const now = new Date().toISOString();
    const monthFromNow = new Date(Date.now() + 30 * DAY_MS).toISOString();

    const [{ count: total }, { data: overduePlans }, { count: rp }] = await Promise.all([
      supabase
        .from('org_patients')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
      supabase
        .from('org_care_plans')
        .select('id, review_date')
        .eq('organization_id', orgId)
        .not('review_date', 'is', null)
        .lte('review_date', monthFromNow),
      supabase
        .from('org_incidents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('incident_type', 'restrictive_practice')
        .eq('status', 'open'),
    ]);

    const plansOverdue = (overduePlans ?? []).filter(
      (p) => p.review_date && new Date(p.review_date as string).toISOString() < now,
    ).length;

    return NextResponse.json({
      total: total ?? 0,
      plansOverdue,
      restrictivePractices: rp ?? 0,
    });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ total: 0, plansOverdue: 0, restrictivePractices: 0 });
  }
}

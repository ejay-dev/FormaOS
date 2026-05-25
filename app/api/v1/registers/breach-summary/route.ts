import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

const log = routeLog('/api/v1/registers/breach-summary');
const DAY_MS = 86_400_000;

export async function GET(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) {
      if (ctx.response.status === 401 || ctx.response.status === 409) {
        return ctx.response;
      }
      return NextResponse.json({ openBreaches: 0, selfReported: 0, daysSinceDetection: 0 });
    }
    const { orgId } = ctx;

    const { data: incidents, error } = await supabase
      .from('org_incidents')
      .select('status, notifications_sent, occurred_at, severity')
      .eq('organization_id', orgId)
      .in('severity', ['high', 'critical']);

    if (error) {
      log.error({ err: error }, 'failed to load incidents');
      return NextResponse.json({ openBreaches: 0, selfReported: 0, daysSinceDetection: 0 });
    }

    let openBreaches = 0;
    let selfReported = 0;
    let mostRecentDetection: number | null = null;
    for (const i of incidents ?? []) {
      if (i.status !== 'resolved' && i.status !== 'closed') openBreaches++;
      const notifs = Array.isArray(i.notifications_sent)
        ? (i.notifications_sent as string[])
        : [];
      if (notifs.length > 0) selfReported++;
      if (i.occurred_at) {
        const t = new Date(i.occurred_at as string).getTime();
        if (mostRecentDetection === null || t > mostRecentDetection) {
          mostRecentDetection = t;
        }
      }
    }

    const daysSinceDetection = mostRecentDetection
      ? Math.max(0, Math.floor((Date.now() - mostRecentDetection) / DAY_MS))
      : 0;

    return NextResponse.json({ openBreaches, selfReported, daysSinceDetection });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ openBreaches: 0, selfReported: 0, daysSinceDetection: 0 });
  }
}

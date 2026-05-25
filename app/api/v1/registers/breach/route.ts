import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

const log = routeLog('/api/v1/registers/breach');
const DAY_MS = 86_400_000;

type BreachStatus = 'detected' | 'assessed' | 'reported' | 'closed';

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
      return NextResponse.json({ breaches: [] });
    }
    const { orgId } = ctx;

    // Derive breaches from high/critical incidents that represent regulatory breaches
    const { data: incidents, error } = await supabase
      .from('org_incidents')
      .select('id, incident_type, description, occurred_at, status, notifications_sent, severity, reported_at')
      .eq('organization_id', orgId)
      .in('severity', ['high', 'critical'])
      .order('occurred_at', { ascending: false })
      .limit(50);

    if (error) {
      log.error({ err: error }, 'failed to load incidents');
      return NextResponse.json({ breaches: [] });
    }

    const now = Date.now();
    const breaches = (incidents ?? []).map((inc, idx) => {
      const detected = inc.occurred_at
        ? new Date(inc.occurred_at as string)
        : new Date();
      const daysOpen = Math.max(0, Math.floor((now - detected.getTime()) / DAY_MS));
      const notifs = Array.isArray(inc.notifications_sent)
        ? (inc.notifications_sent as string[])
        : [];
      let status: BreachStatus = 'detected';
      if (inc.status === 'resolved' || inc.status === 'closed') status = 'closed';
      else if (notifs.length > 0) status = 'reported';
      else if (inc.status === 'investigating') status = 'assessed';

      return {
        id: inc.id as string,
        breach_id: `BR-${String(idx + 1).padStart(4, '0')}`,
        description: (inc.description as string) || 'Regulatory breach detected',
        detected_date: detected.toISOString().split('T')[0],
        reported_to_asic: notifs.length > 0,
        reported_date: (inc.reported_at as string | null) || null,
        days_open: daysOpen,
        status,
      };
    });

    return NextResponse.json({ breaches });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ breaches: [] });
  }
}

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

const log = routeLog('/api/v1/incidents/sirs-summary');

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
      return NextResponse.json({ open: 0, notified: 0, investigating: 0 });
    }
    const { orgId } = ctx;

    const { data: incidents, error } = await supabase
      .from('org_incidents')
      .select('status, notifications_sent, severity')
      .eq('organization_id', orgId);

    if (error) {
      log.error({ err: error }, 'failed to load incidents');
      return NextResponse.json({ open: 0, notified: 0, investigating: 0 });
    }

    let open = 0;
    let notified = 0;
    let investigating = 0;
    for (const i of incidents ?? []) {
      if (i.status === 'open') open++;
      if (i.status === 'investigating') investigating++;
      const ns = (i.notifications_sent as unknown as string[] | null) || [];
      if (Array.isArray(ns) && ns.length > 0) notified++;
    }

    return NextResponse.json({ open, notified, investigating });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ open: 0, notified: 0, investigating: 0 });
  }
}

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/care-plans/review-status');
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

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId = membership?.organization_id as string | undefined;
    if (!orgId) return NextResponse.json({ dueThisMonth: 0, overdue: 0 });

    const { data: plans, error } = await supabase
      .from('org_care_plans')
      .select('id, review_date, status')
      .eq('organization_id', orgId)
      .not('review_date', 'is', null);

    if (error) {
      log.error({ err: error }, 'failed to load care plans');
      return NextResponse.json({ dueThisMonth: 0, overdue: 0 });
    }

    const now = Date.now();
    const monthFromNow = now + 30 * DAY_MS;
    let dueThisMonth = 0;
    let overdue = 0;
    for (const p of plans ?? []) {
      if (p.status === 'archived') continue;
      const due = p.review_date ? new Date(p.review_date as string).getTime() : null;
      if (due === null) continue;
      if (due < now) overdue++;
      else if (due <= monthFromNow) dueThisMonth++;
    }

    return NextResponse.json({ dueThisMonth, overdue });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ dueThisMonth: 0, overdue: 0 });
  }
}

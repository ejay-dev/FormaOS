import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/compliance/transaction-monitoring');
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
    if (!orgId) {
      return NextResponse.json({ alertsTriggered: 0, lastReviewDate: null, nextReviewDue: null });
    }

    const ninetyDaysAgo = new Date(Date.now() - 90 * DAY_MS).toISOString();
    const { data: alerts, error: alertErr } = await supabase
      .from('org_incidents')
      .select('id, occurred_at, incident_type, severity')
      .eq('organization_id', orgId)
      .gte('occurred_at', ninetyDaysAgo);

    if (alertErr) {
      log.error({ err: alertErr }, 'failed to load incidents');
    }

    const amlRegex = /aml|ctf|transaction|suspicious|money[-\s]?laundering|sanction/i;
    const relevant = (alerts ?? []).filter((a) =>
      amlRegex.test((a.incident_type as string) || '')
    );

    const { data: reviews } = await supabase
      .from('org_tasks')
      .select('title, status, completed_at, due_date')
      .eq('organization_id', orgId)
      .or('title.ilike.%aml%,title.ilike.%transaction monitoring%,title.ilike.%ctf%')
      .order('completed_at', { ascending: false })
      .limit(10);

    let lastReviewDate: string | null = null;
    let nextReviewDue: string | null = null;
    for (const r of reviews ?? []) {
      if (!lastReviewDate && r.status === 'completed' && r.completed_at) {
        lastReviewDate = r.completed_at as string;
      }
      if (!nextReviewDue && r.status !== 'completed' && r.due_date) {
        nextReviewDue = r.due_date as string;
      }
    }

    if (lastReviewDate && !nextReviewDue) {
      const next = new Date(lastReviewDate).getTime() + 90 * DAY_MS;
      nextReviewDue = new Date(next).toISOString();
    }

    return NextResponse.json({
      alertsTriggered: relevant.length,
      lastReviewDate,
      nextReviewDue,
    });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ alertsTriggered: 0, lastReviewDate: null, nextReviewDue: null });
  }
}

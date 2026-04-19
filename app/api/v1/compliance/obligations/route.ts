import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/compliance/obligations');
const DAY_MS = 86_400_000;

export async function GET(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rate.resetAt },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const orgId = membership?.organization_id as string | undefined;
    if (!orgId) return NextResponse.json({ obligations: [] });

    const { data: tasks, error } = await supabase
      .from('org_tasks')
      .select('id, title, status, priority, due_date, created_at')
      .eq('organization_id', orgId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(200);

    if (error) {
      log.error({ err: error }, 'failed to load tasks');
      return NextResponse.json({ obligations: [] });
    }

    const now = Date.now();
    const weekFromNow = now + 7 * DAY_MS;

    const obligations = (tasks ?? []).map((t) => {
      const due = t.due_date ? new Date(t.due_date as string).getTime() : null;
      let status: 'overdue' | 'due_soon' | 'on_track' | 'completed' | 'not_started';
      if (t.status === 'completed') status = 'completed';
      else if (!t.due_date) status = 'not_started';
      else if (due !== null && due < now) status = 'overdue';
      else if (due !== null && due <= weekFromNow) status = 'due_soon';
      else status = 'on_track';

      const risk = (t.priority as string) === 'critical'
        ? 'critical'
        : (t.priority as string) === 'high'
          ? 'high'
          : (t.priority as string) === 'low'
            ? 'low'
            : 'medium';

      return {
        id: t.id as string,
        title: (t.title as string) || 'Untitled',
        framework: 'Internal',
        frameworkCode: 'INT',
        owner: null,
        dueDate: (t.due_date as string) || '',
        status,
        evidenceCount: 0,
        riskScore: risk,
      };
    });

    return NextResponse.json({ obligations });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ obligations: [] });
  }
}

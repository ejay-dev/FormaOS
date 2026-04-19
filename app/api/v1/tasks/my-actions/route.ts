import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/tasks/my-actions');
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
    if (!orgId) return NextResponse.json({ actions: [] });

    const { data: tasks, error } = await supabase
      .from('org_tasks')
      .select('id, title, status, priority, due_date')
      .eq('organization_id', orgId)
      .neq('status', 'completed')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(25);

    if (error) {
      log.error({ err: error }, 'failed to load tasks');
      return NextResponse.json({ actions: [] });
    }

    const now = Date.now();
    const dayFromNow = now + DAY_MS;
    const weekFromNow = now + 7 * DAY_MS;

    const actions = (tasks ?? []).map((t) => {
      const due = t.due_date ? new Date(t.due_date as string).getTime() : null;
      let status: 'overdue' | 'due_today' | 'due_soon' | 'in_progress' | 'pending';
      if (t.status === 'in_progress') status = 'in_progress';
      else if (due !== null && due < now) status = 'overdue';
      else if (due !== null && due < dayFromNow) status = 'due_today';
      else if (due !== null && due <= weekFromNow) status = 'due_soon';
      else status = 'pending';

      return {
        id: t.id as string,
        title: (t.title as string) || 'Untitled task',
        dueDate: (t.due_date as string) || new Date(now + 7 * DAY_MS).toISOString(),
        status,
        type: 'task' as const,
        entityId: t.id as string,
        entityHref: `/app/tasks`,
      };
    });

    return NextResponse.json({ actions });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ actions: [] });
  }
}

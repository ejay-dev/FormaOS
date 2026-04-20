import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/dashboard/stand-up');
const DAY_MS = 86_400_000;

type Action = {
  id: string;
  title: string;
  dueDate: string | null;
  kind: 'task' | 'incident' | 'renewal';
  href: string;
};

type Win = {
  id: string;
  label: string;
  completedAt: string;
};

type Deadline = {
  id: string;
  label: string;
  dueDate: string;
  daysAway: number;
  href: string;
};

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
    if (!orgId) {
      return NextResponse.json({ actions: [], wins: [], deadline: null });
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * DAY_MS);
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);

    // 1. Top 3 actions: highest priority open tasks, overdue or due within 7 days
    const { data: actionRows, error: actionsErr } = await supabase
      .from('org_tasks')
      .select('id, title, due_date, priority, status')
      .eq('organization_id', orgId)
      .neq('status', 'completed')
      .or(`due_date.is.null,due_date.lte.${sevenDaysFromNow.toISOString()}`)
      .order('priority', { ascending: true }) // critical < high < medium < low alphabetically works
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(3);

    if (actionsErr) {
      log.error({ err: actionsErr }, 'stand-up: failed to load actions');
    }

    const actions: Action[] = (actionRows ?? []).map((t) => ({
      id: t.id as string,
      title: (t.title as string) || 'Untitled task',
      dueDate: (t.due_date as string) ?? null,
      kind: 'task' as const,
      href: '/app/tasks',
    }));

    // 2. Up to 2 wins: tasks completed in last 7 days
    const { data: winRows, error: winsErr } = await supabase
      .from('org_tasks')
      .select('id, title, created_at')
      .eq('organization_id', orgId)
      .eq('status', 'completed')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(2);

    if (winsErr) {
      log.error({ err: winsErr }, 'stand-up: failed to load wins');
    }

    const wins: Win[] = (winRows ?? []).map((t) => ({
      id: t.id as string,
      label: (t.title as string) || 'Completed task',
      completedAt: t.created_at as string,
    }));

    // 3. Nearest upcoming deadline
    const { data: deadlineRow, error: deadlineErr } = await supabase
      .from('org_compliance_deadlines')
      .select('id, title, due_date')
      .eq('organization_id', orgId)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .gte('due_date', now.toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (deadlineErr) {
      log.error({ err: deadlineErr }, 'stand-up: failed to load deadline');
    }

    let deadline: Deadline | null = null;
    if (deadlineRow) {
      const dueDate = new Date(deadlineRow.due_date as string);
      const daysAway = Math.max(
        0,
        Math.ceil((dueDate.getTime() - now.getTime()) / DAY_MS),
      );
      deadline = {
        id: deadlineRow.id as string,
        label: (deadlineRow.title as string) || 'Upcoming deadline',
        dueDate: deadlineRow.due_date as string,
        daysAway,
        href: '/app/compliance',
      };
    }

    return NextResponse.json({ actions, wins, deadline });
  } catch (err) {
    log.error({ err }, 'stand-up: unexpected error');
    return NextResponse.json({ actions: [], wins: [], deadline: null });
  }
}

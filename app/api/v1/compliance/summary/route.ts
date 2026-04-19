import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/compliance/summary');

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
    if (!orgId) {
      return NextResponse.json({
        total: 0,
        overdue: 0,
        dueSoon: 0,
        completed: 0,
        completionPercentage: 0,
        obligations: [],
        deadlines: [],
      });
    }

    const { data: tasks, error } = await supabase
      .from('org_tasks')
      .select('id, title, status, priority, due_date, created_at')
      .eq('organization_id', orgId);

    if (error) {
      log.error({ err: error }, 'failed to load tasks');
      return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
    }

    const now = Date.now();
    const weekFromNow = now + 7 * DAY_MS;

    const rows = tasks ?? [];
    let overdue = 0;
    let dueSoon = 0;
    let completed = 0;
    for (const t of rows) {
      const status = (t.status as string) || 'pending';
      const due = t.due_date ? new Date(t.due_date as string).getTime() : null;
      if (status === 'completed') {
        completed++;
        continue;
      }
      if (due !== null) {
        if (due < now) overdue++;
        else if (due <= weekFromNow) dueSoon++;
      }
    }

    const total = rows.length;
    const completionPercentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    const obligations = rows.slice(0, 25).map((t) => ({
      id: t.id as string,
      title: (t.title as string) || 'Untitled',
      framework: 'Internal',
      frameworkCode: 'INT',
      owner: null,
      dueDate: (t.due_date as string) || '',
      status:
        t.status === 'completed'
          ? 'completed'
          : t.due_date && new Date(t.due_date as string).getTime() < now
            ? 'overdue'
            : t.due_date &&
                new Date(t.due_date as string).getTime() <= weekFromNow
              ? 'due_soon'
              : 'on_track',
      evidenceCount: 0,
      controlKey: '',
    }));

    const deadlines = rows
      .filter((t) => t.due_date && t.status !== 'completed')
      .sort(
        (a, b) =>
          new Date(a.due_date as string).getTime() -
          new Date(b.due_date as string).getTime(),
      )
      .slice(0, 10)
      .map((t) => {
        const due = new Date(t.due_date as string).getTime();
        const urgency =
          due < now ? 'red' : due <= weekFromNow ? 'amber' : 'green';
        return {
          id: t.id as string,
          title: t.title as string,
          dueDate: t.due_date as string,
          type: 'obligation' as const,
          urgency,
        };
      });

    return NextResponse.json({
      total,
      overdue,
      dueSoon,
      completed,
      completionPercentage,
      obligations,
      deadlines,
    });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

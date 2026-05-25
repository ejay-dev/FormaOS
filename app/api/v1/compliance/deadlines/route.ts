import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

const log = routeLog('/api/v1/compliance/deadlines');
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

    const url = new URL(request.url);
    const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days') || '30')));

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) {
      if (ctx.response.status === 401 || ctx.response.status === 409) {
        return ctx.response;
      }
      return NextResponse.json({ deadlines: [] });
    }
    const { orgId } = ctx;

    const now = Date.now();
    const horizon = new Date(now + days * DAY_MS).toISOString();

    const [{ data: tasks }, { data: credentials }] = await Promise.all([
      supabase
        .from('org_tasks')
        .select('id, title, due_date, status')
        .eq('organization_id', orgId)
        .neq('status', 'completed')
        .not('due_date', 'is', null)
        .lte('due_date', horizon)
        .order('due_date', { ascending: true })
        .limit(30),
      supabase
        .from('org_staff_credentials')
        .select('id, credential_name, expiry_date')
        .eq('organization_id', orgId)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', horizon)
        .order('expiry_date', { ascending: true })
        .limit(15),
    ]);

    const weekFromNow = now + 7 * DAY_MS;
    const urgency = (t: number) =>
      t < now ? 'red' : t <= weekFromNow ? 'amber' : 'green';

    const fromTasks = (tasks ?? []).map((t) => {
      const due = new Date(t.due_date as string).getTime();
      return {
        id: t.id as string,
        title: (t.title as string) || 'Untitled obligation',
        dueDate: t.due_date as string,
        type: 'obligation' as const,
        urgency: urgency(due),
        href: '/app/tasks',
      };
    });

    const fromCredentials = (credentials ?? []).map((c) => {
      const due = new Date(c.expiry_date as string).getTime();
      return {
        id: c.id as string,
        title: `${(c.credential_name as string) || 'Credential'} expiry`,
        dueDate: c.expiry_date as string,
        type: 'certification' as const,
        urgency: urgency(due),
        href: '/app/staff-compliance',
      };
    });

    const deadlines = [...fromTasks, ...fromCredentials].sort(
      (a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    return NextResponse.json({ deadlines });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ deadlines: [] });
  }
}

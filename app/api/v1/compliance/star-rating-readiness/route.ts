import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

const log = routeLog('/api/v1/compliance/star-rating-readiness');

// High-15: this endpoint computes "aged-care star rating readiness" as
// (completedTasks / totalTasks). That is a generic completion ratio with
// no mapping to the actual Aged Care Quality Indicators / Star Rating
// dimensions defined by the Department of Health & Aged Care. Until a
// real evaluator is built, every response carries `experimental: true`
// and the dashboard hides this surface from default navigation. Direct
// callers (e.g. a partner that wired against the URL) still get data.
const EXPERIMENTAL_NOTICE = {
  experimental: true,
  notice:
    'This endpoint returns a generic task-completion ratio, not a true Aged Care Star Rating evaluation. Do not use as a regulatory readiness signal.',
};

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
      return NextResponse.json({ ...EXPERIMENTAL_NOTICE, completionPercentage: 0 });
    }
    const { orgId } = ctx;

    const { data: tasks, error } = await supabase
      .from('org_tasks')
      .select('status')
      .eq('organization_id', orgId);

    if (error) {
      log.error({ err: error }, 'failed to load tasks');
      return NextResponse.json(
        { ...EXPERIMENTAL_NOTICE, completionPercentage: 0, error: 'tasks_unavailable' },
        { status: 503 },
      );
    }

    const rows = tasks ?? [];
    const total = rows.length;
    const completed = rows.filter((t) => t.status === 'completed').length;
    const completionPercentage = total > 0
      ? Math.round((completed / total) * 100)
      : 0;

    return NextResponse.json({ ...EXPERIMENTAL_NOTICE, completionPercentage });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json(
      { ...EXPERIMENTAL_NOTICE, completionPercentage: 0, error: 'internal_error' },
      { status: 500 },
    );
  }
}

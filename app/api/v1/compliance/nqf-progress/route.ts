import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

const log = routeLog('/api/v1/compliance/nqf-progress');

// High-15: this endpoint matches NQF Quality Areas to org_tasks via
// regex over task titles. That is keyword spotting, not a regulatory
// evaluation. Until per-area evaluators exist this surface ships with
// `experimental: true` and is hidden from the default app sidebar.
const EXPERIMENTAL_NOTICE = {
  experimental: true,
  notice:
    'NQF Quality Area progress is computed by keyword-matching task titles. It is not a regulatory NQF assessment. Do not present to ACECQA or assessors as an NQF readiness signal.',
};

const NQF_AREAS: Array<{ id: string; number: number; title: string; keywords: RegExp }> = [
  { id: '1', number: 1, title: 'Educational Program & Practice', keywords: /educational|program|practice|learning/i },
  { id: '2', number: 2, title: "Children's Health & Safety", keywords: /health|safety|nutrition|sleep|hygiene/i },
  { id: '3', number: 3, title: 'Physical Environment', keywords: /environment|facility|building|maintenance/i },
  { id: '4', number: 4, title: 'Staffing Arrangements', keywords: /staffing|ratio|roster|educator/i },
  { id: '5', number: 5, title: 'Relationships with Children', keywords: /relationship|children|interaction|behaviour/i },
  { id: '6', number: 6, title: 'Collaborative Partnerships', keywords: /partnership|family|community|collaboration/i },
  { id: '7', number: 7, title: 'Governance & Leadership', keywords: /governance|leadership|policy|philosophy/i },
];

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
      return NextResponse.json({ ...EXPERIMENTAL_NOTICE, areas: [] });
    }
    const { orgId } = ctx;

    const { data: tasks, error } = await supabase
      .from('org_tasks')
      .select('title, status')
      .eq('organization_id', orgId);

    if (error) {
      log.error({ err: error }, 'failed to load tasks');
      return NextResponse.json(
        { ...EXPERIMENTAL_NOTICE, areas: NQF_AREAS.map(a => ({ id: a.id, number: a.number, title: a.title, progress: 0 })), error: 'tasks_unavailable' },
        { status: 503 },
      );
    }

    const rows = tasks ?? [];
    const areas = NQF_AREAS.map((a) => {
      const related = rows.filter((t) => a.keywords.test((t.title as string) || ''));
      const done = related.filter((t) => t.status === 'completed').length;
      const progress = related.length > 0
        ? Math.round((done / related.length) * 100)
        : 0;
      return { id: a.id, number: a.number, title: a.title, progress };
    });

    return NextResponse.json({ ...EXPERIMENTAL_NOTICE, areas });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json(
      { ...EXPERIMENTAL_NOTICE, areas: [], error: 'internal_error' },
      { status: 500 },
    );
  }
}

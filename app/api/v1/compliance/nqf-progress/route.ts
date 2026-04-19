import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/compliance/nqf-progress');

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

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId = membership?.organization_id as string | undefined;
    if (!orgId) return NextResponse.json({ areas: [] });

    const { data: tasks, error } = await supabase
      .from('org_tasks')
      .select('title, status')
      .eq('organization_id', orgId);

    if (error) {
      log.error({ err: error }, 'failed to load tasks');
      return NextResponse.json({ areas: NQF_AREAS.map(a => ({ ...a, progress: 0 })) });
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

    return NextResponse.json({ areas });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ areas: [] });
  }
}

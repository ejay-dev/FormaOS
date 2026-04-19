import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/compliance/star-rating-readiness');

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
    if (!orgId) return NextResponse.json({ completionPercentage: 0 });

    const { data: tasks, error } = await supabase
      .from('org_tasks')
      .select('status')
      .eq('organization_id', orgId);

    if (error) {
      log.error({ err: error }, 'failed to load tasks');
      return NextResponse.json({ completionPercentage: 0 });
    }

    const rows = tasks ?? [];
    const total = rows.length;
    const completed = rows.filter((t) => t.status === 'completed').length;
    const completionPercentage = total > 0
      ? Math.round((completed / total) * 100)
      : 0;

    return NextResponse.json({ completionPercentage });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ completionPercentage: 0 });
  }
}

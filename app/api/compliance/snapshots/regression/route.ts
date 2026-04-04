import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { detectScoreRegression } from '@/lib/compliance/snapshot-service';
import { routeLog } from '@/lib/monitoring/server-logger';
import { rateLimitApi } from '@/lib/security/rate-limiter';

const log = routeLog('/api/compliance/snapshots/regression');

export async function GET(request: Request) {
  try {
    const rl = await rateLimitApi(request);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const framework = searchParams.get('framework');

    if (!orgId || !framework) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user belongs to org
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const regression = await detectScoreRegression(orgId, framework);

    return NextResponse.json({ ok: true, regression });
  } catch (error) {
    log.error({ err: error }, '[snapshots/regression] Error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { routeLog } from '@/lib/monitoring/server-logger';
import { requireEntitlement } from '@/lib/billing/entitlements';

const log = routeLog('/api/v1/ai/reindex');

export async function POST(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/app/settings/ai';
  redirectUrl.search = '';

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirectUrl.searchParams.set('error', 'auth');
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership?.organization_id) {
      redirectUrl.searchParams.set('error', 'membership');
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    if (!['owner', 'admin'].includes(String(membership.role ?? ''))) {
      redirectUrl.searchParams.set('error', 'forbidden');
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    try {
      await requireEntitlement(membership.organization_id, 'ai_assistant');
    } catch {
      redirectUrl.searchParams.set('error', 'entitlement');
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const admin = createSupabaseAdminClient();
    const { fullReindex } = await import('@/lib/ai/indexing-pipeline');
    const result = await fullReindex(admin, membership.organization_id);

    redirectUrl.searchParams.set('reindexed', String(result.indexed));
    redirectUrl.searchParams.set('reindexErrors', String(result.errors));
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    log.error({ err: error }, 'ai reindex failed');
    redirectUrl.searchParams.set('error', 'reindex_failed');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }
}

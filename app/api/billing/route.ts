import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { SUBSCRIPTION_PLANS } from '@/lib/billing/plans';

const log = routeLog('/api/billing');

export async function GET(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const requestedOrgId = url.searchParams.get('orgId');

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const userOrgId = membership?.organization_id as string | undefined;
    const orgId = requestedOrgId || userOrgId;

    if (!orgId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }
    if (requestedOrgId && requestedOrgId !== userOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: subscription } = await supabase
      .from('org_subscriptions')
      .select('plan_key, status, current_period_end, cancel_at')
      .eq('organization_id', orgId)
      .maybeSingle();

    const planKey = (subscription?.plan_key as string | undefined) || 'free';
    const legacyTier = planKey === 'basic' ? 'starter' : planKey;
    const currentPlan = SUBSCRIPTION_PLANS[legacyTier as keyof typeof SUBSCRIPTION_PLANS]
      ?? SUBSCRIPTION_PLANS.free;

    const [membersCount, tasksCount, certsCount, evidenceCount] = await Promise.all([
      supabase.from('org_members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('org_tasks').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('org_staff_credentials').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('org_evidence').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    ]);

    // Rough approximation: assume average evidence file ~2MB until file_size is tracked.
    const storageGb = Math.round(((evidenceCount.count ?? 0) * 2) / 1024 * 100) / 100;

    const usage = {
      members: membersCount.count ?? 0,
      tasks: tasksCount.count ?? 0,
      storage: storageGb,
      certificates: certsCount.count ?? 0,
      apiCalls: 0,
    };

    return NextResponse.json({
      currentPlan,
      usage,
      limits: currentPlan.limits,
      availablePlans: Object.values(SUBSCRIPTION_PLANS),
      subscriptionStatus: subscription?.status ?? 'inactive',
      currentPeriodEnd: subscription?.current_period_end ?? null,
      cancelAt: subscription?.cancel_at ?? null,
    });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

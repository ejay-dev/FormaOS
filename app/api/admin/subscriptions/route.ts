import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import { parsePageParams } from '@/app/api/admin/_utils';
import { handleAdminError } from '@/app/api/admin/_helpers';

export async function GET(request: Request) {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();
    const url = new URL(request.url);
    const status = (url.searchParams.get('status') ?? '').trim();
    const { page, limit, from, to } = parsePageParams(url.searchParams);

    let query = admin
      .from('org_subscriptions')
      .select(
        'organization_id, status, plan_key, stripe_customer_id, stripe_subscription_id, current_period_end, trial_expires_at',
        { count: 'exact' },
      )
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: subscriptions, count } = await query;
    const orgIds = (subscriptions ?? []).map((row: any) => row.organization_id);

    const { data: organizations } = orgIds.length
      ? await admin.from('organizations').select('id, name').in('id', orgIds)
      : { data: [] };

    const orgMap = new Map<string, string>();
    (organizations ?? []).forEach((org: any) => {
      orgMap.set(org.id, org.name ?? 'N/A');
    });

    const rows = (subscriptions ?? []).map((subscription: any) => ({
      ...subscription,
      organization_name: orgMap.get(subscription.organization_id) ?? 'N/A',
      trial_expires_at:
        subscription.trial_expires_at ??
        subscription.current_period_end ??
        null,
    }));

    return NextResponse.json({
      page,
      pageSize: limit,
      total: count ?? rows.length,
      data: rows,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/subscriptions');
  }
}

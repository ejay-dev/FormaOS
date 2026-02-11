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
    const search = (url.searchParams.get('query') ?? '').trim().toLowerCase();
    const { page, limit, from, to } = parsePageParams(url.searchParams);

    const MAX_SEARCH_SCAN = 1500;
    const SEARCH_BATCH_SIZE = 100;

    let subscriptions: any[] = [];
    let total = 0;

    if (search) {
      let currentPage = 1;
      while (subscriptions.length < MAX_SEARCH_SCAN) {
        let batchQuery = admin
          .from('org_subscriptions')
          .select(
            'organization_id, status, plan_key, stripe_customer_id, stripe_subscription_id, current_period_end, trial_expires_at, payment_failures, grace_period_end, updated_at',
            { count: 'exact' },
          )
          .order('updated_at', { ascending: false })
          .range(
            (currentPage - 1) * SEARCH_BATCH_SIZE,
            currentPage * SEARCH_BATCH_SIZE - 1,
          );

        if (status) {
          batchQuery = batchQuery.eq('status', status);
        }

        const { data: batch, count, error } = await batchQuery;
        if (error) throw error;
        if (typeof count === 'number') total = count;

        const rows = batch ?? [];
        subscriptions = subscriptions.concat(rows);
        if (rows.length < SEARCH_BATCH_SIZE) break;
        currentPage += 1;
      }
    } else {
      let pageQuery = admin
        .from('org_subscriptions')
        .select(
          'organization_id, status, plan_key, stripe_customer_id, stripe_subscription_id, current_period_end, trial_expires_at, payment_failures, grace_period_end, updated_at',
          { count: 'exact' },
        )
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (status) {
        pageQuery = pageQuery.eq('status', status);
      }

      const { data, count, error } = await pageQuery;
      if (error) throw error;
      subscriptions = data ?? [];
      total = count ?? subscriptions.length;
    }

    const orgIds = Array.from(
      new Set(subscriptions.map((row: any) => row.organization_id)),
    );

    const { data: organizations } = orgIds.length
      ? await admin.from('organizations').select('id, name').in('id', orgIds)
      : { data: [] };

    const orgMap = new Map<string, string>();
    (organizations ?? []).forEach((org: any) => {
      orgMap.set(org.id, org.name ?? 'N/A');
    });

    const rowsWithOrg = subscriptions.map((subscription: any) => ({
      ...subscription,
      organization_name: orgMap.get(subscription.organization_id) ?? 'N/A',
      trial_expires_at:
        subscription.trial_expires_at ??
        subscription.current_period_end ??
        null,
    }));

    const filteredRows = search
      ? rowsWithOrg.filter((row: any) => {
          const orgName = String(row.organization_name ?? '').toLowerCase();
          const customerId = String(row.stripe_customer_id ?? '').toLowerCase();
          const subscriptionId = String(
            row.stripe_subscription_id ?? '',
          ).toLowerCase();
          const planKey = String(row.plan_key ?? '').toLowerCase();
          return (
            orgName.includes(search) ||
            customerId.includes(search) ||
            subscriptionId.includes(search) ||
            planKey.includes(search)
          );
        })
      : rowsWithOrg;

    const pagedRows = search
      ? filteredRows.slice((page - 1) * limit, page * limit)
      : filteredRows;

    return NextResponse.json({
      page,
      pageSize: limit,
      total: search ? filteredRows.length : total,
      data: pagedRows,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/subscriptions');
  }
}

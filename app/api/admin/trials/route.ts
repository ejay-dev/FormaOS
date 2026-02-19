import { requireFounderAccess } from '@/app/app/admin/access';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { handleAdminError } from '@/app/api/admin/_helpers';
import { parsePageParams } from '@/app/api/admin/_utils';
import { fetchAuthEmailsByIds } from '@/app/api/admin/_auth-users';

export async function GET(request: Request) {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();
    const url = new URL(request.url);
    const statusFilter = (url.searchParams.get('status') ?? '').trim();
    const query = (url.searchParams.get('query') ?? '').trim().toLowerCase();
    const { page, limit, from, to } = parsePageParams(url.searchParams);
    const MAX_SEARCH_SCAN = 1500;
    const SEARCH_BATCH_SIZE = 100;

    let subscriptions: any[] = [];
    let total = 0;

    if (query) {
      let currentPage = 1;
      while (subscriptions.length < MAX_SEARCH_SCAN) {
        let batchQuery = admin
          .from('org_subscriptions')
          .select(
            'organization_id, status, trial_expires_at, current_period_end',
            { count: 'exact' },
          )
          .order('trial_expires_at', { ascending: true })
          .range(
            (currentPage - 1) * SEARCH_BATCH_SIZE,
            currentPage * SEARCH_BATCH_SIZE - 1,
          );

        if (statusFilter) {
          batchQuery = batchQuery.eq('status', statusFilter);
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
          'organization_id, status, trial_expires_at, current_period_end',
          { count: 'exact' },
        )
        .order('trial_expires_at', { ascending: true })
        .range(from, to);

      if (statusFilter) {
        pageQuery = pageQuery.eq('status', statusFilter);
      }

      const { data, count, error } = await pageQuery;
      if (error) throw error;
      subscriptions = data ?? [];
      total = count ?? subscriptions.length;
    }

    // Get org names
    const orgIds = Array.from(
      new Set((subscriptions ?? []).map((item: any) => item.organization_id)),
    );
    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name')
      .in('id', orgIds);

    const orgMap = new Map((orgs ?? []).map((o: any) => [o.id, o.name]));

    // Get owner emails
    const { data: ownerships } = await admin
      .from('org_members')
      .select('organization_id, user_id')
      .in('organization_id', orgIds)
      .eq('role', 'owner');

    const ownerIds: string[] = Array.from(
      new Set(
        (ownerships ?? [])
          .map((owner: any) => String(owner.user_id ?? '').trim())
          .filter(Boolean),
      ),
    );
    const ownerEmailMap = await fetchAuthEmailsByIds(admin, ownerIds);

    const orgOwnerMap = new Map(
      (ownerships ?? []).map((o: any) => [
        o.organization_id,
        ownerEmailMap.get(o.user_id),
      ]),
    );

    const trials = subscriptions
      .map((sub: any) => {
        const trialEnd =
          sub.trial_expires_at ?? sub.current_period_end ?? null;
        if (!trialEnd) return null;

        const trialEndDate = new Date(trialEnd);
        const now = new Date();
        const diffDays = Math.ceil(
          (trialEndDate.getTime() - now.getTime()) / 86_400_000,
        );
        const trialStatus =
          diffDays <= 0 ? 'expired' : diffDays <= 3 ? 'expiring' : 'active';

        return {
          id: `${sub.organization_id}:${trialEnd}`,
          organization_id: sub.organization_id,
          organization_name: orgMap.get(sub.organization_id) || 'Unnamed Org',
          trial_ends_at: trialEnd,
          owner_email: orgOwnerMap.get(sub.organization_id) || 'N/A',
          status: trialStatus,
          subscription_status: sub.status ?? null,
          days_remaining: diffDays,
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;

    const filteredTrials = query
      ? trials.filter((trial) => {
          const orgName = String(trial.organization_name ?? '').toLowerCase();
          const ownerEmail = String(trial.owner_email ?? '').toLowerCase();
          const orgId = String(trial.organization_id ?? '').toLowerCase();
          return (
            orgName.includes(query) ||
            ownerEmail.includes(query) ||
            orgId.includes(query)
          );
        })
      : trials;

    const pagedTrials = query
      ? filteredTrials.slice((page - 1) * limit, page * limit)
      : filteredTrials;

    return NextResponse.json({
      page,
      pageSize: limit,
      total: query ? filteredTrials.length : total,
      trials: pagedTrials,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/trials');
  }
}

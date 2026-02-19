import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import { parsePageParams } from '@/app/api/admin/_utils';
import { handleAdminError } from '@/app/api/admin/_helpers';
import { fetchAuthEmailsByIds } from '@/app/api/admin/_auth-users';
import { rateLimitApi } from '@/lib/security/rate-limiter';

export async function GET(request: Request) {
  try {
    const { user } = await requireFounderAccess();

    // Rate limiting for admin routes
    const rateLimitResult = await rateLimitApi(request, user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const admin = createSupabaseAdminClient();
    const url = new URL(request.url);
    const query = (url.searchParams.get('query') ?? '').trim();
    const { page, limit, from, to } = parsePageParams(url.searchParams);

    const orgQuery = admin
      .from('organizations')
      .select('id, name, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (query) {
      orgQuery.ilike('name', `%${query}%`);
    }

    const { data: organizations, count } = await orgQuery;
    const orgIds = (organizations ?? []).map((org: any) => org.id);

    const [{ data: members }, { data: subscriptions }] = await Promise.all([
      orgIds.length
        ? admin
            .from('org_members')
            .select('organization_id, user_id, role')
            .in('organization_id', orgIds)
        : Promise.resolve({ data: [] }),
      orgIds.length
        ? admin
            .from('org_subscriptions')
            .select(
              'organization_id, status, plan_key, current_period_end, trial_expires_at',
            )
            .in('organization_id', orgIds)
        : Promise.resolve({ data: [] }),
    ]);

    const ownersByOrg = new Map<string, string>();
    (members ?? []).forEach((member: any) => {
      if (member.role === 'owner') {
        ownersByOrg.set(member.organization_id, member.user_id);
      }
    });

    const ownerIds = Array.from(new Set(Array.from(ownersByOrg.values())));
    const ownerEmails = await fetchAuthEmailsByIds(admin, ownerIds);

    const subscriptionByOrg = new Map<
      string,
      typeof subscriptions extends Array<infer T> ? T : any
    >();
    (subscriptions ?? []).forEach((subscription: any) => {
      subscriptionByOrg.set(subscription.organization_id, subscription);
    });

    const rows = (organizations ?? []).map((org: any) => {
      const subscription = subscriptionByOrg.get(org.id);
      const ownerId = ownersByOrg.get(org.id);
      return {
        id: org.id,
        name: org.name,
        created_at: org.created_at,
        owner_email: ownerId ? (ownerEmails.get(ownerId) ?? 'N/A') : 'N/A',
        plan_key: subscription?.plan_key ?? null,
        status: subscription?.status ?? 'pending',
        trial_expires_at:
          subscription?.trial_expires_at ??
          subscription?.current_period_end ??
          null,
      };
    });

    return NextResponse.json({
      page,
      pageSize: limit,
      total: count ?? rows.length,
      data: rows,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs');
  }
}

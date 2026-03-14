import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/app/app/admin/access';
import { parsePageParams } from '@/app/api/admin/_utils';
import { handleAdminError } from '@/app/api/admin/_helpers';
import { fetchAuthEmailsByIds } from '@/app/api/admin/_auth-users';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { getEffectiveOrganizationStatus } from '@/lib/admin/org-lifecycle';

export async function GET(request: Request) {
  try {
    const { user } = await requireAdminAccess({ permission: 'orgs:view' });

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
      .select('id, name, created_at, lifecycle_status', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (query) {
      orgQuery.ilike('name', `%${query}%`);
    }

    const { data: organizations, count } = await orgQuery;
    const orgIds = (organizations ?? []).map(
      (org: Record<string, unknown>) => org.id,
    );

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
    (members ?? []).forEach((member: Record<string, unknown>) => {
      if (member.role === 'owner') {
        ownersByOrg.set(
          member.organization_id as string,
          member.user_id as string,
        );
      }
    });

    const ownerIds = Array.from(new Set(Array.from(ownersByOrg.values())));
    const ownerEmails = await fetchAuthEmailsByIds(admin, ownerIds);

    const subscriptionByOrg = new Map<
      string,
      typeof subscriptions extends Array<infer T> ? T : unknown
    >();
    (subscriptions ?? []).forEach((subscription: Record<string, unknown>) => {
      subscriptionByOrg.set(
        subscription.organization_id as string,
        subscription,
      );
    });

    const rows = (organizations ?? []).map((org: Record<string, unknown>) => {
      const subscription = subscriptionByOrg.get(org.id as string) as
        | Record<string, unknown>
        | undefined;
      const ownerId = ownersByOrg.get(org.id as string);
      const effectiveStatus = getEffectiveOrganizationStatus({
        lifecycleStatus: org.lifecycle_status as string | null,
        subscriptionStatus: (subscription?.status as string | null) ?? 'pending',
      });
      return {
        id: org.id,
        name: org.name,
        created_at: org.created_at,
        owner_email: ownerId ? (ownerEmails.get(ownerId) ?? 'N/A') : 'N/A',
        plan_key: subscription?.plan_key ?? null,
        status: effectiveStatus.status,
        lifecycle_status: effectiveStatus.lifecycleStatus,
        subscription_status: effectiveStatus.subscriptionStatus,
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

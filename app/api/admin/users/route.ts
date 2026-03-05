import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import { parsePageParams } from '@/app/api/admin/_utils';
import { handleAdminError } from '@/app/api/admin/_helpers';
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
    const query = (url.searchParams.get('query') ?? '').trim().toLowerCase();
    const { page, limit } = parsePageParams(url.searchParams);
    const MAX_SEARCH_SCAN = 2000;
    const PAGE_BATCH_SIZE = 100;

    let users: Record<string, unknown>[] = [];
    let totalUsers = 0;

    if (query) {
      let currentPage = 1;
      while (users.length < MAX_SEARCH_SCAN) {
        const { data, error } = await (admin as any).auth.admin.listUsers({
          page: currentPage,
          perPage: PAGE_BATCH_SIZE,
        });
        if (error) throw error;
        const batch = data?.users ?? [];
        totalUsers = data?.total ?? totalUsers;
        users = users.concat(batch);
        if (batch.length < PAGE_BATCH_SIZE) break;
        currentPage += 1;
      }
    } else {
      const { data, error } = await (admin as any).auth.admin.listUsers({
        page,
        perPage: limit,
      });
      if (error) throw error;
      users = data?.users ?? [];
      totalUsers = data?.total ?? users.length;
    }

    const queryFilteredUsers = query
      ? users.filter((candidate: Record<string, unknown>) => {
          const email = ((candidate.email as string) ?? '').toLowerCase();
          const fullName = (
            (candidate.user_metadata as Record<string, unknown>)?.full_name ??
            (candidate.user_metadata as Record<string, unknown>)?.name ??
            ''
          )
            .toString()
            .toLowerCase();
          return email.includes(query) || fullName.includes(query);
        })
      : users;

    const from = (page - 1) * limit;
    const to = from + limit;
    const pagedUsers = query
      ? queryFilteredUsers.slice(from, to)
      : queryFilteredUsers;

    const userIds = pagedUsers.map(
      (candidate: Record<string, unknown>) => candidate.id,
    );
    const { data: memberships } = userIds.length
      ? await admin
          .from('org_members')
          .select('user_id, role, organization_id')
          .in('user_id', userIds)
      : { data: [] };

    const { data: organizations } = memberships?.length
      ? await admin
          .from('organizations')
          .select('id, name')
          .in(
            'id',
            memberships.map(
              (row: Record<string, unknown>) => row.organization_id,
            ),
          )
      : { data: [] };

    const orgMap = new Map<string, string>();
    (organizations ?? []).forEach((org: Record<string, unknown>) => {
      orgMap.set(org.id as string, (org.name as string) ?? 'N/A');
    });

    const membershipMap = new Map<
      string,
      { role: string | null; organization: string }
    >();
    (memberships ?? []).forEach((membership: Record<string, unknown>) => {
      membershipMap.set(membership.user_id as string, {
        role: membership.role as string | null,
        organization: orgMap.get(membership.organization_id as string) ?? 'N/A',
      });
    });

    const rows = pagedUsers.map((candidate: Record<string, unknown>) => ({
      id: candidate.id,
      email: candidate.email ?? 'N/A',
      provider:
        (candidate.app_metadata as Record<string, unknown>)?.provider ?? 'N/A',
      email_confirmed: Boolean(candidate.email_confirmed_at),
      last_sign_in_at: candidate.last_sign_in_at ?? null,
      role: membershipMap.get(candidate.id as string)?.role ?? 'N/A',
      organization:
        membershipMap.get(candidate.id as string)?.organization ?? 'N/A',
    }));

    return NextResponse.json({
      page,
      pageSize: limit,
      total: query ? queryFilteredUsers.length : totalUsers,
      data: rows,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/users');
  }
}

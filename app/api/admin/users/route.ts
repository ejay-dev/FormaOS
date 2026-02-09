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
    const query = (url.searchParams.get('query') ?? '').trim().toLowerCase();
    const { page, limit } = parsePageParams(url.searchParams);

    const { data, error } = await (admin as any).auth.admin.listUsers({
      page,
      perPage: limit,
    });

    if (error) {
      throw error;
    }

    const users = data?.users ?? [];
    const filtered = query
      ? users.filter((user: any) =>
          (user.email ?? '').toLowerCase().includes(query),
        )
      : users;

    const userIds = filtered.map((user: any) => user.id);
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
            memberships.map((row: any) => row.organization_id),
          )
      : { data: [] };

    const orgMap = new Map<string, string>();
    (organizations ?? []).forEach((org: any) => {
      orgMap.set(org.id, org.name ?? 'N/A');
    });

    const membershipMap = new Map<
      string,
      { role: string | null; organization: string }
    >();
    (memberships ?? []).forEach((membership: any) => {
      membershipMap.set(membership.user_id, {
        role: membership.role,
        organization: orgMap.get(membership.organization_id) ?? 'N/A',
      });
    });

    const rows = filtered.map((user: any) => ({
      id: user.id,
      email: user.email ?? 'N/A',
      provider: user.app_metadata?.provider ?? 'N/A',
      email_confirmed: Boolean(user.email_confirmed_at),
      last_sign_in_at: user.last_sign_in_at ?? null,
      role: membershipMap.get(user.id)?.role ?? 'N/A',
      organization: membershipMap.get(user.id)?.organization ?? 'N/A',
    }));

    return NextResponse.json({
      page,
      pageSize: limit,
      data: rows,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/users');
  }
}

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function requireOrgContext(requestedOrgId?: string | null) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  let query = supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1);

  if (requestedOrgId) {
    query = query.eq('organization_id', requestedOrgId);
  }

  const { data: membership, error } = await query.maybeSingle();
  if (error || !membership?.organization_id) {
    throw new Error('Organization membership not found');
  }

  return {
    supabase,
    user,
    orgId: membership.organization_id as string,
    role: (membership.role as string | null | undefined) ?? 'member',
  };
}

export async function requireOrgAdminContext(requestedOrgId?: string | null) {
  const context = await requireOrgContext(requestedOrgId);
  if (!['owner', 'admin'].includes(context.role)) {
    throw new Error('Forbidden');
  }
  return context;
}

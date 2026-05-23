import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function requireOrgContext(requestedOrgId?: string | null) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // v4-026: multi-org users were getting arbitrary first-org context
  // because the query was `.maybeSingle()` over the unfiltered
  // org_members list. Respect user_preferences.current_organization_id
  // when no explicit requestedOrgId is passed — and only fall back to
  // the first membership when no preference is set.
  let resolvedOrgId: string | null = requestedOrgId ?? null;
  if (!resolvedOrgId) {
    const { data: preference } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    resolvedOrgId =
      (preference as { current_organization_id?: string } | null)
        ?.current_organization_id ?? null;
  }

  let query = supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1);

  if (resolvedOrgId) {
    query = query.eq('organization_id', resolvedOrgId);
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

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CachedMembership = {
  userId: string;
  organizationId: string;
  role: string | null;
};

/**
 * Fetch the current user + their primary org membership exactly once per
 * request. Wrapping in React `cache()` deduplicates concurrent calls inside
 * the same render — every server action that previously ran its own
 * `auth.getUser` + `org_members` lookup (often two extra round trips per
 * mutation) can call this instead.
 *
 * Returns `null` for unauthenticated requests or users without a membership;
 * callers should branch on that rather than throwing here, so existing
 * action-level redirect/return-error patterns keep working.
 */
export const getCachedUserMembership = cache(
  async (): Promise<CachedMembership | null> => {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // v4-031: previously did `.maybeSingle()` over the unfiltered list,
    // so multi-org users got arbitrary first-row context. Honour
    // user_preferences.current_organization_id when set; otherwise fall
    // back to the first membership (preserves the old behaviour for
    // single-org users without surprising multi-org callers).
    const { data: preference } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const preferredOrgId =
      (preference as { current_organization_id?: string } | null)
        ?.current_organization_id ?? null;

    let query = supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .limit(1);

    if (preferredOrgId) {
      query = query.eq('organization_id', preferredOrgId);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data?.organization_id) return null;

    return {
      userId: user.id,
      organizationId: data.organization_id as string,
      role: (data.role as string | null) ?? null,
    };
  },
);

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export type CachedMembership = {
  userId: string;
  organizationId: string;
  role: string | null;
};

/**
 * Strict active-org resolution. Returns:
 *  - kind:'ok' when the active org is unambiguous (single membership,
 *    or preference matches a real membership).
 *  - kind:'ambiguous' when the user belongs to multiple orgs and has
 *    no valid `current_organization_id` preference. Callers MUST refuse
 *    the request (HTTP 409) and instruct the client to pick an org.
 *  - kind:'none' when the user has no memberships.
 *  - kind:'unauthorized' when there is no signed-in user.
 *
 * The lenient `getCachedUserMembership` (above) picks the first
 * membership for multi-org users with no preference — that hides
 * cross-tenant write bugs. Use this strict variant in any new code
 * (especially v1 API routes) and migrate older code as you touch it.
 */
export type ActiveMembershipResult =
  | { kind: 'unauthorized' }
  | { kind: 'none' }
  | {
      kind: 'ambiguous';
      userId: string;
      memberships: Array<{ organizationId: string; role: string | null }>;
    }
  | {
      kind: 'ok';
      userId: string;
      organizationId: string;
      role: string | null;
    };

export async function resolveActiveMembership(
  supabase?: SupabaseClient,
): Promise<ActiveMembershipResult> {
  const db = supabase ?? (await createSupabaseServerClient());

  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { kind: 'unauthorized' };

  const { data: memberships, error } = await db
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id);
  if (error) {
    // Treat read errors as "no memberships" rather than silently
    // failing open — callers will return 4xx and ops will see the
    // PG error in Sentry via the route handler.
    return { kind: 'none' };
  }
  const rows = (memberships ?? []) as Array<{
    organization_id: string;
    role: string | null;
  }>;
  if (rows.length === 0) return { kind: 'none' };

  if (rows.length === 1) {
    return {
      kind: 'ok',
      userId: user.id,
      organizationId: rows[0].organization_id,
      role: rows[0].role,
    };
  }

  // Multi-org. Honour user_preferences.current_organization_id but
  // only when it's a real membership.
  const { data: preference } = await db
    .from('user_preferences')
    .select('current_organization_id')
    .eq('user_id', user.id)
    .maybeSingle();
  const preferred = (
    preference as { current_organization_id?: string } | null
  )?.current_organization_id;

  if (preferred) {
    const match = rows.find((r) => r.organization_id === preferred);
    if (match) {
      return {
        kind: 'ok',
        userId: user.id,
        organizationId: match.organization_id,
        role: match.role,
      };
    }
  }

  return {
    kind: 'ambiguous',
    userId: user.id,
    memberships: rows.map((r) => ({
      organizationId: r.organization_id,
      role: r.role,
    })),
  };
}

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

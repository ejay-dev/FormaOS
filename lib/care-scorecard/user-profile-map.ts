import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Build a `user_id -> { name, email }` map from `user_profiles`.
 *
 * Replaces the old `org_members` + `profiles:profiles!inner(full_name, email)`
 * PostgREST embed used across the care scorecard. That embed silently failed
 * in production: there is no foreign key from `org_members` to the (near-empty)
 * `profiles` table, so PostgREST could not resolve the relationship and every
 * staff name/email fell back to "Unknown"/"". `user_profiles` is keyed by
 * `user_id` and matches the overwhelming majority of members.
 *
 * Uses the admin client (not the org-scoped client) because `user_profiles`
 * is not a registered tenant table — and it is safe to do so here: the
 * `userIds` passed in are always derived from org-scoped queries (the org's
 * own `org_members` / `org_staff_credentials`), so we only ever resolve
 * profiles for users that belong to the calling org. We look them up by
 * `user_id` (no org-column filter), so this does not trip the
 * admin-client-with-org-filter tenant-isolation rule.
 */
export async function buildUserProfileMap(
  userIds: readonly unknown[],
): Promise<Map<string, { name: string; email: string }>> {
  // Callers derive ids from loosely-typed Supabase rows (`data` is often
  // unknown[]), so coerce to a clean string[] here rather than at each site.
  const ids = userIds.filter((id): id is string => typeof id === 'string');
  if (ids.length === 0) return new Map();

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('user_profiles')
    .select('user_id, full_name, email')
    .in('user_id', ids);

  return new Map(
    ((data ?? []) as Array<{
      user_id: string;
      full_name?: string | null;
      email?: string | null;
    }>).map((p) => [
      p.user_id,
      { name: p.full_name || 'Unknown', email: p.email || '' },
    ]),
  );
}

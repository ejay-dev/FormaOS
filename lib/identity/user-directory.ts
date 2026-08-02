import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve auth user ids to a human-readable label.
 *
 * Audit 2026-08-02. Several surfaces built their staff pickers from
 * `public.user_profiles(full_name, email)`. Both columns are NULL for every one
 * of the 2,598 production rows, so those dropdowns rendered a list of blank
 * options — the picker looked populated but nothing was selectable by name.
 * `public.profiles` is not an alternative: it holds a single row.
 *
 * auth.users is the only populated source (6,738 rows, every one with an
 * email), and it is not reachable through PostgREST, so the label has to come
 * from the auth admin API. Callers pass the service-role client.
 *
 * Ids are fetched individually because the admin API has no "get many by id"
 * form. That is acceptable here: these are per-organisation member lists
 * (2,410 memberships across 2,309 organisations in production, so typically a
 * handful per org). `limit` guards the pathological case rather than letting a
 * large org turn a page render into hundreds of sequential round trips.
 */
export async function resolveUserLabels(
  admin: SupabaseClient,
  userIds: string[],
  options: { limit?: number } = {},
): Promise<Map<string, string>> {
  const labels = new Map<string, string>();
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return labels;

  const limit = options.limit ?? 200;
  const target = unique.slice(0, limit);

  const results = await Promise.all(
    target.map(async (id) => {
      const { data, error } = await admin.auth.admin.getUserById(id);
      if (error || !data?.user) return null;
      const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
      const fullName =
        typeof meta.full_name === 'string' ? meta.full_name.trim() : '';
      const name =
        typeof meta.name === 'string' ? meta.name.trim() : '';
      const email = data.user.email ?? '';
      return {
        id,
        label: fullName || name || email.split('@')[0] || id,
      };
    }),
  );

  for (const row of results) {
    if (row) labels.set(row.id, row.label);
  }

  // Anything the directory could not resolve still needs a stable option label,
  // otherwise the picker renders a blank entry that cannot be told apart from
  // its neighbours.
  for (const id of unique) {
    if (!labels.has(id)) labels.set(id, id);
  }

  return labels;
}

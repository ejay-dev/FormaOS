import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const MAX_RECENT_PER_USER = 50;

/**
 * Record an entity access for the recent items list.
 * Keeps the last MAX_RECENT_PER_USER items per user.
 */
export async function trackAccess(
  orgId: string,
  userId: string,
  entityType: string,
  entityId: string,
  entityTitle: string,
) {
  const db = createSupabaseAdminClient();

  // Upsert: if same entity was recently accessed, just update timestamp
  const { data: existing } = await db
    .from('recent_items')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .maybeSingle();

  if (existing) {
    await db
      .from('recent_items')
      .update({
        accessed_at: new Date().toISOString(),
        entity_title: entityTitle,
      })
      .eq('id', existing.id);
  } else {
    await db.from('recent_items').insert({
      org_id: orgId,
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      entity_title: entityTitle,
    });

    // Prune excess entries
    const { data: all } = await db
      .from('recent_items')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .order('accessed_at', { ascending: false });

    if (all && all.length > MAX_RECENT_PER_USER) {
      const toDelete = all.slice(MAX_RECENT_PER_USER).map((r) => r.id);
      await db.from('recent_items').delete().in('id', toDelete);
    }
  }
}

/**
 * Get the most recently accessed items for a user.
 */
export async function getRecentItems(
  orgId: string,
  userId: string,
  limit = 20,
) {
  const db = createSupabaseAdminClient();

  const { data } = await db
    .from('recent_items')
    .select('entity_type, entity_id, entity_title, accessed_at')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .order('accessed_at', { ascending: false })
    .limit(limit);

  return data ?? [];
}

/**
 * Get the most frequently accessed items over the last 30 days.
 */
export async function getFrequentItems(
  orgId: string,
  userId: string,
  limit = 10,
) {
  const db = createSupabaseAdminClient();
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Count access frequency by entity
  const { data } = await db
    .from('recent_items')
    .select('entity_type, entity_id, entity_title')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .gte('accessed_at', thirtyDaysAgo);

  if (!data || data.length === 0) return [];

  const counts: Record<
    string,
    { type: string; id: string; title: string; count: number }
  > = {};
  for (const item of data) {
    const key = `${item.entity_type}:${item.entity_id}`;
    if (!counts[key]) {
      counts[key] = {
        type: item.entity_type,
        id: item.entity_id,
        title: item.entity_title,
        count: 0,
      };
    }
    counts[key].count++;
  }

  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type SearchOptions = {
  entityTypes?: string[];
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

type SearchResult = {
  entity_type: string;
  entity_id: string;
  title: string;
  snippet: string;
  rank: number;
  metadata: Record<string, unknown>;
};

/**
 * Unified search across all indexed entities.
 * Uses PostgreSQL full-text search with weighted ranking.
 * Falls back to trigram similarity for short/fuzzy queries.
 */
export async function search(
  orgId: string,
  query: string,
  options: SearchOptions = {},
): Promise<{ results: SearchResult[]; total: number }> {
  const db = createSupabaseAdminClient();
  const limit = Math.min(options.limit ?? 20, 100);
  const offset = options.offset ?? 0;

  // Try full-text search first
  const { data: ftsResults, error } = await db.rpc('search_entities', {
    p_org_id: orgId,
    p_query: query,
    p_entity_types: options.entityTypes ?? null,
    p_limit: limit,
    p_offset: offset,
  });

  if (!error && ftsResults && ftsResults.length > 0) {
    let results = ftsResults as SearchResult[];

    // Date range filtering (post-filter on metadata.created_at if present)
    if (options.from || options.to) {
      results = results.filter((r) => {
        const created = (r.metadata?.created_at as string) ?? '';
        if (options.from && created < options.from) return false;
        if (options.to && created > options.to) return false;
        return true;
      });
    }

    return { results, total: results.length };
  }

  // Fallback: trigram similarity search for fuzzy matching
  const { data: trigramResults } = await db
    .from('search_index')
    .select('entity_type, entity_id, title, body, metadata')
    .eq('org_id', orgId)
    .ilike('title', `%${query}%`)
    .limit(limit);

  const fuzzyResults = (trigramResults ?? []).map((r) => ({
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    title: r.title,
    snippet: r.body?.substring(0, 200) ?? '',
    rank: 0.5,
    metadata: r.metadata as Record<string, unknown>,
  }));

  return { results: fuzzyResults, total: fuzzyResults.length };
}

/**
 * Autocomplete suggestions from recent searches and entity titles.
 */
export async function suggest(
  orgId: string,
  prefix: string,
  userId?: string,
): Promise<string[]> {
  const db = createSupabaseAdminClient();
  const suggestions: string[] = [];

  // Recent searches from this user
  if (userId) {
    const { data: recent } = await db
      .from('search_history')
      .select('query')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .ilike('query', `${prefix}%`)
      .order('searched_at', { ascending: false })
      .limit(5);
    for (const r of recent ?? []) {
      if (!suggestions.includes(r.query)) suggestions.push(r.query);
    }
  }

  // Entity title matches
  const { data: titles } = await db
    .from('search_index')
    .select('title')
    .eq('org_id', orgId)
    .ilike('title', `${prefix}%`)
    .limit(10);

  for (const t of titles ?? []) {
    if (!suggestions.includes(t.title)) suggestions.push(t.title);
  }

  return suggestions.slice(0, 10);
}

/**
 * Log a search event for analytics.
 */
export async function trackSearch(
  orgId: string,
  userId: string,
  query: string,
  resultCount: number,
) {
  const db = createSupabaseAdminClient();
  await db.from('search_history').insert({
    org_id: orgId,
    user_id: userId,
    query,
    result_count: resultCount,
  });
}

/**
 * Log a click on a search result.
 */
export async function trackClick(
  orgId: string,
  userId: string,
  entityType: string,
  entityId: string,
) {
  const db = createSupabaseAdminClient();
  await db.from('search_history').insert({
    org_id: orgId,
    user_id: userId,
    query: `[click] ${entityType}:${entityId}`,
    result_count: 1,
    clicked_result_id: entityId,
    clicked_result_type: entityType,
  });
}

/**
 * Get search analytics: popular queries, zero-result queries, click-through.
 */
export async function getSearchAnalytics(orgId: string) {
  const db = createSupabaseAdminClient();

  const { data: allSearches } = await db
    .from('search_history')
    .select('query, result_count, clicked_result_id')
    .eq('org_id', orgId)
    .not('query', 'like', '[click]%')
    .order('searched_at', { ascending: false })
    .limit(1000);

  const searches = allSearches ?? [];
  const queryCounts: Record<string, number> = {};
  let zeroResults = 0;
  let clickedCount = 0;

  for (const s of searches) {
    queryCounts[s.query] = (queryCounts[s.query] ?? 0) + 1;
    if (s.result_count === 0) zeroResults++;
    if (s.clicked_result_id) clickedCount++;
  }

  const popularQueries = Object.entries(queryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([query, count]) => ({ query, count }));

  const zeroResultQueries = searches
    .filter((s) => s.result_count === 0)
    .reduce<Record<string, number>>((acc, s) => {
      acc[s.query] = (acc[s.query] ?? 0) + 1;
      return acc;
    }, {});

  return {
    totalSearches: searches.length,
    uniqueQueries: Object.keys(queryCounts).length,
    zeroResultRate: searches.length > 0 ? zeroResults / searches.length : 0,
    clickThroughRate: searches.length > 0 ? clickedCount / searches.length : 0,
    popularQueries,
    zeroResultQueries: Object.entries(zeroResultQueries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count })),
  };
}

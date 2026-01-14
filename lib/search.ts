/**
 * =========================================================
 * Advanced Search System
 * =========================================================
 * Full-text search across all entities with filters
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { getCached, CacheKeys } from './cache';

export interface SearchResult {
  id: string;
  type: 'task' | 'member' | 'certificate' | 'evidence' | 'organization';
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  relevance: number;
  created_at?: string;
}

export interface SearchFilters {
  types?: SearchResult['type'][];
  dateFrom?: string;
  dateTo?: string;
  status?: string[];
  tags?: string[];
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
  sortBy?: 'relevance' | 'date' | 'name';
}

/**
 * Search across all entities in an organization
 */
export async function search(
  orgId: string,
  query: string,
  options: SearchOptions = {},
): Promise<{ results: SearchResult[]; total: number }> {
  const {
    limit = 20,
    offset = 0,
    filters = {},
    sortBy = 'relevance',
  } = options;

  // Use cache for search results (1 minute TTL)
  const cacheKey = CacheKeys.SEARCH_RESULTS(
    orgId,
    `${query}-${JSON.stringify(options)}`,
  );

  return getCached(
    cacheKey,
    async () => {
      const supabase = await createClient();
      const results: SearchResult[] = [];

      // Search tasks
      if (!filters.types || filters.types.includes('task')) {
        const taskResults = await searchTasks(supabase, orgId, query, filters);
        results.push(...taskResults);
      }

      // Search members
      if (!filters.types || filters.types.includes('member')) {
        const memberResults = await searchMembers(
          supabase,
          orgId,
          query,
          filters,
        );
        results.push(...memberResults);
      }

      // Search certificates
      if (!filters.types || filters.types.includes('certificate')) {
        const certResults = await searchCertificates(
          supabase,
          orgId,
          query,
          filters,
        );
        results.push(...certResults);
      }

      // Search evidence
      if (!filters.types || filters.types.includes('evidence')) {
        const evidenceResults = await searchEvidence(
          supabase,
          orgId,
          query,
          filters,
        );
        results.push(...evidenceResults);
      }

      // Sort results
      let sorted = results;
      if (sortBy === 'relevance') {
        sorted = results.sort((a, b) => b.relevance - a.relevance);
      } else if (sortBy === 'date') {
        sorted = results.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime(),
        );
      } else if (sortBy === 'name') {
        sorted = results.sort((a, b) => a.title.localeCompare(b.title));
      }

      // Apply pagination
      const paginated = sorted.slice(offset, offset + limit);

      return {
        results: paginated,
        total: sorted.length,
      };
    },
    60, // 1 minute cache
  );
}

/**
 * Search tasks
 */
async function searchTasks(
  supabase: any,
  orgId: string,
  query: string,
  filters: SearchFilters,
): Promise<SearchResult[]> {
  let queryBuilder = supabase
    .from('compliance_tasks')
    .select('*')
    .eq('organization_id', orgId);

  // Full-text search on title and description
  if (query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query}%,description.ilike.%${query}%`,
    );
  }

  // Apply filters
  if (filters.status) {
    queryBuilder = queryBuilder.in('status', filters.status);
  }

  if (filters.dateFrom) {
    queryBuilder = queryBuilder.gte('created_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    queryBuilder = queryBuilder.lte('created_at', filters.dateTo);
  }

  const { data, error } = await queryBuilder.limit(50);

  if (error || !data) return [];

  return data.map((task: any) => ({
    id: task.id,
    type: 'task' as const,
    title: task.title,
    description: task.description,
    metadata: {
      status: task.status,
      priority: task.priority,
      assignee: task.assigned_to,
      due_date: task.due_date,
    },
    relevance: calculateRelevance(query, task.title + ' ' + task.description),
    created_at: task.created_at,
  }));
}

/**
 * Search team members
 */
async function searchMembers(
  supabase: any,
  orgId: string,
  query: string,
  filters: SearchFilters,
): Promise<SearchResult[]> {
  let queryBuilder = supabase
    .from('team_members')
    .select('*, profiles(*)')
    .eq('organization_id', orgId);

  // Search by name or email
  if (query) {
    queryBuilder = queryBuilder.or(
      `profiles.full_name.ilike.%${query}%,profiles.email.ilike.%${query}%`,
    );
  }

  const { data, error } = await queryBuilder.limit(50);

  if (error || !data) return [];

  return data.map((member: any) => ({
    id: member.id,
    type: 'member' as const,
    title: member.profiles?.full_name || member.profiles?.email || 'Unknown',
    description: member.profiles?.email,
    metadata: {
      role: member.role,
      status: member.status,
      joined_at: member.joined_at,
    },
    relevance: calculateRelevance(
      query,
      (member.profiles?.full_name || '') + ' ' + (member.profiles?.email || ''),
    ),
    created_at: member.joined_at,
  }));
}

/**
 * Search certificates
 */
async function searchCertificates(
  supabase: any,
  orgId: string,
  query: string,
  filters: SearchFilters,
): Promise<SearchResult[]> {
  let queryBuilder = supabase
    .from('certifications')
    .select('*')
    .eq('organization_id', orgId);

  // Search by name or description
  if (query) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query}%,description.ilike.%${query}%`,
    );
  }

  // Apply filters
  if (filters.status) {
    queryBuilder = queryBuilder.in('status', filters.status);
  }

  const { data, error } = await queryBuilder.limit(50);

  if (error || !data) return [];

  return data.map((cert: any) => ({
    id: cert.id,
    type: 'certificate' as const,
    title: cert.name,
    description: cert.description,
    metadata: {
      status: cert.status,
      issued_date: cert.issued_date,
      expiry_date: cert.expiry_date,
      issuer: cert.issuer,
    },
    relevance: calculateRelevance(query, cert.name + ' ' + cert.description),
    created_at: cert.created_at,
  }));
}

/**
 * Search evidence documents
 */
async function searchEvidence(
  supabase: any,
  orgId: string,
  query: string,
  filters: SearchFilters,
): Promise<SearchResult[]> {
  let queryBuilder = supabase
    .from('evidence_documents')
    .select('*')
    .eq('organization_id', orgId);

  // Search by title or description
  if (query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query}%,description.ilike.%${query}%`,
    );
  }

  // Apply filters
  if (filters.tags && filters.tags.length > 0) {
    queryBuilder = queryBuilder.contains('tags', filters.tags);
  }

  const { data, error } = await queryBuilder.limit(50);

  if (error || !data) return [];

  return data.map((doc: any) => ({
    id: doc.id,
    type: 'evidence' as const,
    title: doc.title,
    description: doc.description,
    metadata: {
      file_name: doc.file_name,
      file_size: doc.file_size,
      tags: doc.tags,
      uploaded_by: doc.uploaded_by,
    },
    relevance: calculateRelevance(query, doc.title + ' ' + doc.description),
    created_at: doc.created_at,
  }));
}

/**
 * Calculate relevance score based on query match
 */
function calculateRelevance(query: string, text: string): number {
  if (!query || !text) return 0;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact match
  if (textLower === queryLower) return 1.0;

  // Starts with query
  if (textLower.startsWith(queryLower)) return 0.9;

  // Contains query as whole word
  const words = textLower.split(/\s+/);
  if (words.includes(queryLower)) return 0.8;

  // Contains query as substring
  if (textLower.includes(queryLower)) return 0.7;

  // Fuzzy match (any word starts with query)
  if (words.some((word) => word.startsWith(queryLower))) return 0.6;

  // Partial word match
  const queryChars = queryLower.split('');
  let matchCount = 0;
  for (const char of queryChars) {
    if (textLower.includes(char)) matchCount++;
  }
  const partialScore = matchCount / queryChars.length;
  return partialScore * 0.5;
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSuggestions(
  orgId: string,
  query: string,
  limit = 5,
): Promise<string[]> {
  if (!query || query.length < 2) return [];

  const supabase = await createClient();
  const suggestions = new Set<string>();

  // Get task titles
  const { data: tasks } = await supabase
    .from('compliance_tasks')
    .select('title')
    .eq('organization_id', orgId)
    .ilike('title', `%${query}%`)
    .limit(limit);

  tasks?.forEach((t) => suggestions.add(t.title));

  // Get member names
  const { data: members } = await supabase
    .from('team_members')
    .select('profiles(full_name)')
    .eq('organization_id', orgId)
    .ilike('profiles.full_name', `%${query}%`)
    .limit(limit);

  members?.forEach((m: any) => {
    if (m.profiles?.full_name) suggestions.add(m.profiles.full_name);
  });

  return Array.from(suggestions).slice(0, limit);
}

/**
 * Get recent searches for a user
 */
export async function getRecentSearches(
  userId: string,
  limit = 10,
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('search_history')
    .select('query')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((item: any) => item.query);
}

/**
 * Save search to history
 */
export async function saveSearchHistory(
  userId: string,
  query: string,
  resultsCount: number,
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('search_history').insert({
    user_id: userId,
    query,
    results_count: resultsCount,
  });
}

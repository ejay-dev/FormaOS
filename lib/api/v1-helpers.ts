import 'server-only';

import { randomBytes } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { V1AuthContext } from '@/lib/api-keys/middleware';

export function getActorId(context: V1AuthContext): string {
  return context.userId ?? context.apiKeyId ?? 'system';
}

export function getStringParam(
  searchParams: URLSearchParams,
  key: string,
): string | null {
  const value = searchParams.get(key)?.trim();
  return value ? value : null;
}

export function getBooleanParam(
  searchParams: URLSearchParams,
  key: string,
): boolean | null {
  const raw = searchParams.get(key)?.trim().toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return null;
}

export function getArrayParam(
  searchParams: URLSearchParams,
  key: string,
): string[] {
  const raw = searchParams.get(key)?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Sanitize for use inside an ilike LITERAL. Strips both LIKE wildcards
 * (% _) and the PostgREST `.or()` separators (commas, parens, asterisk,
 * backtick, double-quote, backslash) so any callsite that interpolates
 * the result into a `.or(...)` predicate can't be tricked into adding
 * extra OR clauses. See lib/utils/postgrest-search.ts for the
 * explicitly `.or()`-shaped helpers.
 */
export function sanitizeLikeQuery(value: string): string {
  return value
    .replace(/[\\]/g, '')
    .replace(/[(),*`"%_]/g, '')
    .trim()
    .slice(0, 100);
}

export function buildIlikePattern(value: string): string {
  return `%${sanitizeLikeQuery(value)}%`;
}

 
type FilterBuilder = any;

export async function countRows(
  table: string,
  build: (query: FilterBuilder) => PromiseLike<{ count: number | null }>,
): Promise<number> {
  const admin = createSupabaseAdminClient();
  const base = admin.from(table).select('id', { count: 'exact', head: true });
  const { count } = await build(base as FilterBuilder);
  return count ?? 0;
}

export function createInvitationToken() {
  return randomBytes(32).toString('hex');
}

/**
 * Search-term sanitizers for PostgREST `.or(...)` clauses.
 *
 * Background:
 *   PostgREST treats commas and parentheses as filter separators and operator
 *   delimiters. Interpolating a raw user-supplied string into something like
 *
 *       .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
 *
 *   allows the caller to append arbitrary OR predicates by injecting commas,
 *   e.g. q = "foo,is_published.eq.false" extends the predicate to include
 *   `is_published.eq.false`. Best case, the query becomes nonsense; worst
 *   case, the user crafts a filter that returns rows they shouldn't see
 *   (RLS still applies, but row-level filtering shouldn't depend on it as
 *   the only line of defense).
 *
 *   See the deep audit's §14 "Performance and Reliability" / Top 25 #20.
 *
 * Strategy:
 *   - Strip the PostgREST special chars: comma, parens, asterisk, backtick,
 *     double quote.
 *   - Strip SQL LIKE wildcards (%, _) — naively-allowed wildcards let users
 *     scan beyond the intended ilike pattern.
 *   - Strip backslash so an escape can't smuggle the above back in.
 *   - Trim and cap at 100 chars.
 */

export function sanitizeOrSearchTerm(
  input: string | null | undefined,
): string {
  if (!input) return '';
  return input
    .replace(/[\\]/g, '')
    .replace(/[(),*`"%_]/g, '')
    .trim()
    .slice(0, 100);
}

/**
 * Build a `column.ilike.%term%` fragment safe for `.or()` interpolation.
 * Returns null if the sanitized term is empty so callers can short-circuit
 * the predicate instead of issuing a no-op .ilike.%%.
 */
export function ilikeOrFragment(
  column: string,
  term: string | null | undefined,
): string | null {
  const sanitized = sanitizeOrSearchTerm(term);
  if (!sanitized) return null;
  return `${column}.ilike.%${sanitized}%`;
}

/**
 * Build a full PostgREST `.or()` argument from multiple columns and a single
 * search term. Returns an empty string when the term sanitizes to nothing —
 * callers should branch on it (`if (predicate) query = query.or(predicate)`).
 */
export function buildOrSearch(
  columns: readonly string[],
  term: string | null | undefined,
): string {
  const sanitized = sanitizeOrSearchTerm(term);
  if (!sanitized || columns.length === 0) return '';
  return columns
    .map((column) => `${column}.ilike.%${sanitized}%`)
    .join(',');
}

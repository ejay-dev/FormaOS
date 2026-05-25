import { createEnvelope, encodeCursor, parsePagination } from '@/lib/api-keys/middleware';

// Audit 2026-05-26 — single source of truth for v1 list pagination
// caps. Previously each route picked its own (audit-logs=200,
// tasks=100, audit-trail=50, members=100) and the OpenAPI spec didn't
// surface them. 100 mirrors the most common existing cap and matches
// the documented contract — bump per-route only with a deliberate
// reason.
export const V1_MAX_PAGE_SIZE = 100;
export const V1_DEFAULT_PAGE_SIZE = 25;

export function getPagination(
  request: Request,
  defaultLimit = V1_DEFAULT_PAGE_SIZE,
  maxLimit = V1_MAX_PAGE_SIZE,
) {
  return parsePagination(request, { defaultLimit, maxLimit });
}

export function paginatedEnvelope<T>(
  data: T[],
  params: { offset: number; limit: number; total?: number },
) {
  const total = params.total ?? data.length;
  const hasMore = params.offset + data.length < total;
  return createEnvelope(data, {
    total,
    hasMore,
    cursor: hasMore ? encodeCursor(params.offset + data.length) : null,
  });
}


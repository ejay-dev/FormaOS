import { createEnvelope, encodeCursor, parsePagination } from '@/lib/api-keys/middleware';

export function getPagination(request: Request, defaultLimit = 25, maxLimit = 100) {
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


import { getPagination, paginatedEnvelope } from '@/lib/api/v1';

// We need to mock parsePagination since it uses `new URL(request.url)`
jest.mock('@/lib/api-keys/middleware', () => ({
  parsePagination: jest.fn((_req, opts) => ({
    limit: opts?.defaultLimit ?? 25,
    offset: 0,
    cursor: null,
    searchParams: new URLSearchParams(),
  })),
  encodeCursor: jest.fn((offset: number) =>
    offset > 0 ? Buffer.from(String(offset)).toString('base64url') : null,
  ),
  createEnvelope: jest.fn((data, meta) => ({
    data,
    meta: {
      cursor: meta?.cursor ?? null,
      hasMore: meta?.hasMore ?? false,
      total: meta?.total ?? data.length,
    },
  })),
}));

describe('getPagination', () => {
  it('returns pagination with default limit', () => {
    const result = getPagination({} as Request);
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(0);
  });

  it('uses custom default and max limit', () => {
    const result = getPagination({} as Request, 10, 50);
    expect(result.limit).toBe(10);
  });
});

describe('paginatedEnvelope', () => {
  it('wraps data in envelope with pagination meta', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const result = paginatedEnvelope(data, { offset: 0, limit: 10, total: 5 });
    expect(result.data).toEqual(data);
    expect(result.meta.total).toBe(5);
    expect(result.meta.hasMore).toBe(true);
  });

  it('sets hasMore=false when at end', () => {
    const data = [{ id: 1 }];
    const result = paginatedEnvelope(data, { offset: 0, limit: 10, total: 1 });
    expect(result.meta.hasMore).toBe(false);
  });

  it('uses data.length as total if none provided', () => {
    const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = paginatedEnvelope(data, { offset: 0, limit: 10 });
    expect(result.meta.total).toBe(3);
  });
});

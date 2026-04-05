/**
 * @jest-environment node
 */

/**
 * Tests for app/api/v1/evidence/route.ts
 */

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => mockSupabase),
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  rateLimitApi: jest.fn().mockResolvedValue({ success: true }),
}));

const mockRequirePermission = jest.fn();
jest.mock('@/app/app/actions/rbac', () => ({
  requirePermission: (...args: any[]) => mockRequirePermission(...args),
}));

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}));

import { GET } from '@/app/api/v1/evidence/route';

beforeEach(() => {
  jest.clearAllMocks();
});

function makeRequest(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/v1/evidence');
  if (params)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString(), {
    headers: { Authorization: 'Bearer tok' },
  });
}

describe('GET /api/v1/evidence', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 403 when insufficient permissions', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockRequirePermission.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('returns 200 with evidence list', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockRequirePermission.mockResolvedValue({ orgId: 'org1' });

    const chain: any = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.limit = jest.fn().mockReturnValue(chain);
    chain.then = jest.fn((resolve: Function) =>
      resolve({
        data: [{ id: 'e1', title: 'SOC2 cert', file_name: 'cert.pdf' }],
        error: null,
      }),
    );
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.evidence).toHaveLength(1);
  });

  it('returns 500 on database error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockRequirePermission.mockResolvedValue({ orgId: 'org1' });

    const chain: any = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.limit = jest.fn().mockReturnValue(chain);
    chain.then = jest.fn((resolve: Function) =>
      resolve({ data: null, error: { message: 'fail' } }),
    );
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });

  it('passes status filter via query params', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockRequirePermission.mockResolvedValue({ orgId: 'org1' });

    const eqMock = jest.fn();
    const chain: any = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = eqMock.mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.limit = jest.fn().mockReturnValue(chain);
    chain.then = jest.fn((resolve: Function) =>
      resolve({ data: [], error: null }),
    );
    mockFrom.mockReturnValue(chain);

    await GET(makeRequest({ status: 'verified' }));
    // Should have called eq with verification_status after the main query chain
    const calls = eqMock.mock.calls.map((c: any[]) => c[0]);
    expect(calls).toContain('verification_status');
  });
});

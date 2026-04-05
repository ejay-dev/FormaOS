/**
 * @jest-environment node
 */

/**
 * Tests for app/api/v1/tasks/route.ts
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

import { GET } from '@/app/api/v1/tasks/route';

beforeEach(() => {
  jest.clearAllMocks();
});

function makeRequest(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/v1/tasks');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new Request(url.toString(), {
    headers: { Authorization: 'Bearer test-token' },
  });
}

describe('GET /api/v1/tasks', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 403 when user lacks permission', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockRequirePermission.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('returns 200 with tasks when authenticated and authorized', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockRequirePermission.mockResolvedValue({ orgId: 'org1' });

    const chain: any = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.limit = jest.fn().mockResolvedValue({
      data: [
        {
          id: 't1',
          title: 'Review Policy',
          status: 'pending',
          priority: 'high',
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tasks).toHaveLength(1);
    expect(body.tasks[0].title).toBe('Review Policy');
  });

  it('returns 500 when database query fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockRequirePermission.mockResolvedValue({ orgId: 'org1' });

    const chain: any = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.limit = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'DB connection failed' },
    });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });

  it('respects limit parameter capped at 100', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockRequirePermission.mockResolvedValue({ orgId: 'org1' });

    const limitMock = jest.fn().mockResolvedValue({ data: [], error: null });
    const chain: any = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.limit = limitMock;
    mockFrom.mockReturnValue(chain);

    await GET(makeRequest({ limit: '500' }));
    expect(limitMock).toHaveBeenCalledWith(100);
  });

  it('returns empty tasks array when no tasks found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockRequirePermission.mockResolvedValue({ orgId: 'org1' });

    const chain: any = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.limit = jest.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.tasks).toEqual([]);
    expect(body.total).toBe(0);
  });
});

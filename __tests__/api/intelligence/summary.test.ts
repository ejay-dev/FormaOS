/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/intelligence/summary/route.ts
 * Targets 46 uncovered branches: auth, membership, rate limiting, caching, data fetching
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const mockCheckRateLimit = jest.fn();
const mockGetRateLimitStatus = jest.fn();
const mockGetCachedIntelligence = jest.fn();
const mockSetCachedIntelligence = jest.fn();

jest.mock('@/lib/cache/intelligence-cache', () => ({
  checkRateLimit: (...a: any[]) => mockCheckRateLimit(...a),
  getRateLimitStatus: (...a: any[]) => mockGetRateLimitStatus(...a),
  getCachedIntelligence: (...a: any[]) => mockGetCachedIntelligence(...a),
  setCachedIntelligence: (...a: any[]) => mockSetCachedIntelligence(...a),
}));

function createBuilder(result: any = { data: null, error: null, count: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'filter',
    'match',
    'or',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

let supabaseBuilder: any;
const mockGetUser = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    from: jest.fn(() => supabaseBuilder),
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
  })),
}));

import { GET } from '@/app/api/intelligence/summary/route';

describe('GET /api/intelligence/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue(true);
    mockGetCachedIntelligence.mockResolvedValue(null);
    mockSetCachedIntelligence.mockResolvedValue(undefined);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    supabaseBuilder = createBuilder({
      data: [{ organization_id: 'org-1' }],
      error: null,
    });
  });

  it('returns 401 when user not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.code).toBe('AUTH_REQUIRED');
  });

  it('returns 401 when auth throws', async () => {
    mockGetUser.mockRejectedValue(new Error('auth fail'));
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.code).toBe('AUTH_ERROR');
  });

  it('returns 403 when membership lookup errors', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    // First call will be for auth, second for membership
    // We need membership to fail
    const membershipBuilder = createBuilder({
      data: null,
      error: { message: 'DB err' },
    });
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => membershipBuilder),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns 404 when no organization', async () => {
    const membershipBuilder = createBuilder({ data: null, error: null });
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => membershipBuilder),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.code).toBe('NO_ORGANIZATION');
  });

  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockResolvedValue(false);
    mockGetRateLimitStatus.mockResolvedValue({ resetAt: Date.now() + 60000 });
    const membershipBuilder = createBuilder({
      data: { organization_id: 'org-1' },
      error: null,
    });
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => membershipBuilder),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(429);
  });

  it('returns cached data with X-Cache HIT', async () => {
    const cachedData = { complianceScore: { current: 80 } };
    mockGetCachedIntelligence.mockResolvedValue(cachedData);
    const membershipBuilder = createBuilder({
      data: { organization_id: 'org-1' },
      error: null,
    });
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => membershipBuilder),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('HIT');
  });

  it('returns fresh data with X-Cache MISS', async () => {
    let callCount = 0;
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { organization_id: 'org-1' },
            error: null,
          });
        return createBuilder({ data: [], error: null, count: 0 });
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('MISS');
  });

  it('handles rate limit check failure gracefully', async () => {
    mockCheckRateLimit.mockRejectedValue(new Error('redis down'));
    let callCount = 0;
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { organization_id: 'org-1' },
            error: null,
          });
        return createBuilder({ data: [], error: null, count: 0 });
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('handles cache check failure gracefully', async () => {
    mockGetCachedIntelligence.mockRejectedValue(new Error('cache fail'));
    let callCount = 0;
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { organization_id: 'org-1' },
            error: null,
          });
        return createBuilder({ data: [], error: null, count: 0 });
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('handles cache set failure gracefully', async () => {
    mockSetCachedIntelligence.mockRejectedValue(new Error('cache write fail'));
    let callCount = 0;
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { organization_id: 'org-1' },
            error: null,
          });
        return createBuilder({ data: [], error: null, count: 0 });
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('handles org lookup exception', async () => {
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => {
        throw new Error('boom');
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('calculates compliance trends and risk reduction', async () => {
    const scores = Array.from({ length: 15 }, (_, i) => ({
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      pass_count: 70 + i,
      fail_count: 30 - i,
      total_count: 100,
    }));
    const tasks = [
      { status: 'completed', due_date: '2025-01-01' },
      { status: 'open', due_date: '2025-06-01' },
    ];
    const upcoming = [
      { title: 'Task A', due_date: '2025-12-01', status: 'open' },
    ];

    let callCount = 0;
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          // membership
          return createBuilder({
            data: { organization_id: 'org-1' },
            error: null,
          });
        }
        if (callCount === 2) {
          // automation_runs
          return createBuilder({
            data: [
              {
                id: '1',
                status: 'completed',
                created_at: new Date().toISOString(),
              },
            ],
            error: null,
          });
        }
        if (callCount === 3) {
          // compliance scores
          return createBuilder({ data: scores, error: null });
        }
        if (callCount === 4) {
          // tasks
          return createBuilder({ data: tasks, error: null });
        }
        if (callCount === 5) {
          // evidence count
          return createBuilder({ data: null, error: null, count: 25 });
        }
        // upcoming deadlines
        return createBuilder({ data: upcoming, error: null });
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.complianceScore).toBeDefined();
    expect(json.automation).toBeDefined();
    expect(json.riskReduction).toBeDefined();
    expect(json.tasks).toBeDefined();
    expect(json.auditReadiness).toBeDefined();
  });

  it('returns 500 when data fetching throws', async () => {
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    let callCount = 0;
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          return createBuilder({
            data: { organization_id: 'org-1' },
            error: null,
          });
        }
        throw new Error('DB connection lost');
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.code).toBe('DATA_FETCH_ERROR');
  });

  it('handles empty automation runs', async () => {
    let callCount = 0;
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          return createBuilder({
            data: { organization_id: 'org-1' },
            error: null,
          });
        }
        return createBuilder({ data: [], error: null, count: 0 });
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.automation.successRate).toBe(0);
    expect(json.automation.lastRunAt).toBeNull();
  });

  it('calculates audit readiness correctly', async () => {
    let callCount = 0;
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          return createBuilder({
            data: { organization_id: 'org-1' },
            error: null,
          });
        }
        if (callCount === 2) {
          return createBuilder({
            data: [
              {
                id: '1',
                status: 'completed',
                created_at: new Date().toISOString(),
              },
            ],
            error: null,
          });
        }
        if (callCount === 3) {
          return createBuilder({
            data: [
              {
                created_at: new Date().toISOString(),
                pass_count: 90,
                fail_count: 10,
                total_count: 100,
              },
            ],
            error: null,
          });
        }
        if (callCount === 4) {
          return createBuilder({
            data: Array(20).fill({
              status: 'completed',
              due_date: '2025-01-01',
            }),
            error: null,
          });
        }
        if (callCount === 5) {
          return createBuilder({ data: null, error: null, count: 50 });
        }
        return createBuilder({ data: [], error: null });
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.auditReadiness.score).toBeGreaterThan(0);
  });
});

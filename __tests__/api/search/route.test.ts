/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/search/route.ts
 * Targets 40 uncovered branches
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const mockRateLimit = jest.fn();
jest.mock('@/lib/security/rate-limiter', () => ({
  rateLimitApi: (...a: any[]) => mockRateLimit(...a),
}));

const mockRequirePermission = jest.fn();
jest.mock('@/app/app/actions/rbac', () => ({
  requirePermission: (...a: any[]) => mockRequirePermission(...a),
}));

function createBuilder(result: any = { data: null, error: null }) {
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
    'ilike',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    from: jest.fn(() => createBuilder({ data: [], error: null })),
  })),
}));

import { GET } from '@/app/api/search/route';

function makeRequest(q: string, limit?: string) {
  const url = new URL('http://localhost/api/search');
  url.searchParams.set('q', q);
  if (limit) url.searchParams.set('limit', limit);
  return new Request(url.toString());
}

describe('GET /api/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true });
    mockRequirePermission.mockResolvedValue({ orgId: 'org-1' });
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValue({
      success: false,
      resetAt: Date.now() + 60000,
    });
    const res = await GET(makeRequest('test'));
    expect(res.status).toBe(429);
  });

  it('returns empty results for short query', async () => {
    const res = await GET(makeRequest('a'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results).toEqual([]);
  });

  it('returns empty results for empty query', async () => {
    const res = await GET(makeRequest(''));
    expect(res.status).toBe(200);
  });

  it('truncates query longer than 80 chars', async () => {
    const longQuery = 'a'.repeat(100);
    const res = await GET(makeRequest(longQuery));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.query.length).toBe(80);
  });

  it('searches policies, tasks, and evidence', async () => {
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    const policyBuilder = createBuilder({
      data: [{ id: 'p1', title: 'Security Policy' }],
      error: null,
    });
    const taskBuilder = createBuilder({
      data: [{ id: 't1', title: 'Review Controls' }],
      error: null,
    });
    const evidenceBuilder = createBuilder({
      data: [{ id: 'e1', title: null, file_name: 'cert.pdf' }],
      error: null,
    });
    let callCount = 0;
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return policyBuilder;
        if (callCount === 2) return taskBuilder;
        return evidenceBuilder;
      }),
    });
    const res = await GET(makeRequest('test'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results.length).toBe(3);
    expect(json.results[0].type).toBe('policy');
    expect(json.results[1].type).toBe('task');
    expect(json.results[2].type).toBe('evidence');
    expect(json.results[2].title).toBe('cert.pdf');
  });

  it('returns 500 when any query errors', async () => {
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'DB err' } }),
      ),
    });
    const res = await GET(makeRequest('test'));
    expect(res.status).toBe(500);
  });

  it('returns 401 for unauthorized', async () => {
    mockRequirePermission.mockRejectedValue(new Error('Unauthorized'));
    const res = await GET(makeRequest('test'));
    expect(res.status).toBe(401);
  });

  it('returns 403 for access denied', async () => {
    mockRequirePermission.mockRejectedValue(new Error('Access denied'));
    const res = await GET(makeRequest('test'));
    expect(res.status).toBe(403);
  });

  it('returns 500 for unknown errors', async () => {
    mockRequirePermission.mockRejectedValue(new Error('Something weird'));
    const res = await GET(makeRequest('test'));
    expect(res.status).toBe(500);
  });

  it('clamps limit to valid range', async () => {
    const res = await GET(makeRequest('test', '50'));
    expect(res.status).toBe(200);
  });
});

/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/customer-health/score/route.ts
 * Targets 42 uncovered branches
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const mockCalculateHealthScore = jest.fn();
jest.mock('@/lib/customer-health/health-score-engine', () => ({
  calculateHealthScore: (...a: any[]) => mockCalculateHealthScore(...a),
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
    'ilike',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const mockGetUser = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    from: jest.fn(() => createBuilder({ data: null, error: null, count: 0 })),
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
  })),
}));

import { GET } from '@/app/api/customer-health/score/route';

describe('GET /api/customer-health/score', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockCalculateHealthScore.mockReturnValue({
      score: 75,
      status: 'Healthy',
      factors: {},
      alerts: [],
      recommendedActions: [],
      lastLoginAt: null,
    });
  });

  it('returns 401 when not authenticated', async () => {
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

  it('returns 403 when no membership', async () => {
    const memberBuilder = createBuilder({ data: null, error: null });
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => memberBuilder),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns 500 when org lookup throws', async () => {
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
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.code).toBe('ORG_LOOKUP_ERROR');
  });

  it('calculates health score successfully', async () => {
    let callCount = 0;
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          return createBuilder({
            data: { organization_id: 'org-1', role: 'admin' },
            error: null,
          });
        }
        if (callCount === 2) {
          return createBuilder({
            data: {
              id: 'org-1',
              name: 'Test Org',
              industry: 'tech',
              created_at: '2025-01-01',
            },
            error: null,
          });
        }
        if (callCount === 3) {
          return createBuilder({
            data: { plan_key: 'pro', status: 'active', trial_expires_at: null },
            error: null,
          });
        }
        // All count/data queries
        return createBuilder({ data: [], error: null, count: 0 });
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.healthScore).toBeDefined();
    expect(json.healthScore.score).toBe(75);
  });

  it('handles trialing subscription with trial_expires_at', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    let callCount = 0;
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { organization_id: 'org-1', role: 'admin' },
            error: null,
          });
        if (callCount === 2)
          return createBuilder({
            data: {
              id: 'org-1',
              name: 'Test',
              industry: null,
              created_at: '2025-01-01',
            },
            error: null,
          });
        if (callCount === 3)
          return createBuilder({
            data: {
              plan_key: 'basic',
              status: 'trialing',
              trial_expires_at: tomorrow,
            },
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
    expect(mockCalculateHealthScore).toHaveBeenCalled();
    const input = mockCalculateHealthScore.mock.calls[0][0];
    expect(input.isTrialing).toBe(true);
    expect(input.trialDaysRemaining).toBeGreaterThanOrEqual(0);
  });

  it('returns 500 when calculation throws', async () => {
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
        // org query returns error
        if (callCount === 2)
          return createBuilder({ data: null, error: { message: 'not found' } });
        return createBuilder({ data: [], error: null, count: 0 });
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.code).toBe('CALCULATION_ERROR');
  });

  it('handles recent logins and activity data', async () => {
    const recentDate = new Date().toISOString();
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
        if (callCount === 2)
          return createBuilder({
            data: {
              id: 'org-1',
              name: 'Test',
              industry: 'health',
              created_at: '2025-01-01',
            },
            error: null,
          });
        if (callCount === 3)
          return createBuilder({
            data: {
              plan_key: 'enterprise',
              status: 'active',
              trial_expires_at: null,
            },
            error: null,
          });
        if (callCount === 4)
          return createBuilder({ data: null, error: null, count: 5 }); // members
        if (callCount === 5)
          return createBuilder({
            data: [{ created_at: recentDate }, { created_at: recentDate }],
            error: null,
          }); // logins
        if (callCount === 6)
          return createBuilder({
            data: [{ action: 'task.create' }, { action: 'evidence.upload' }],
            error: null,
          }); // activity
        if (callCount === 7)
          return createBuilder({
            data: [{ compliance_score: 85, captured_at: recentDate }],
            error: null,
          }); // snapshots
        return createBuilder({ data: null, error: null, count: 0 });
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(mockCalculateHealthScore).toHaveBeenCalled();
    const input = mockCalculateHealthScore.mock.calls[0][0];
    expect(input.memberCount).toBe(5);
    expect(input.featuresUsed).toContain('task');
    expect(input.featuresUsed).toContain('evidence');
  });
});

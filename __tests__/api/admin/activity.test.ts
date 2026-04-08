/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/admin/activity/route.ts
 * Targets 40 uncovered branches
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const mockRequireAdmin = jest.fn();
jest.mock('@/app/app/admin/access', () => ({
  requireAdminAccess: (...a: any[]) => mockRequireAdmin(...a),
}));

const mockFetchEmails = jest.fn();
jest.mock('@/app/api/admin/_auth-users', () => ({
  fetchAuthEmailsByIds: (...a: any[]) => mockFetchEmails(...a),
}));

jest.mock('@/lib/security/session-security', () => ({
  extractClientIP: jest.fn(() => '127.0.0.1'),
}));

const mockLogUnauth = jest.fn();
jest.mock('@/lib/security/event-logger', () => ({
  logUnauthorizedAccess: (...a: any[]) => mockLogUnauth(...a),
}));

const mockSecDashEnabled = jest.fn();
const mockSecMonEnabled = jest.fn();
jest.mock('@/lib/security/monitoring-flags', () => ({
  isSecurityDashboardEnabled: (...a: any[]) => mockSecDashEnabled(...a),
  isSecurityMonitoringEnabled: (...a: any[]) => mockSecMonEnabled(...a),
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

const mockGetUser = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
  })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    from: jest.fn(() => createBuilder({ data: [], error: null })),
  })),
}));

import { GET } from '@/app/api/admin/activity/route';

function makeRequest(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/admin/activity');
  if (params)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe('GET /api/admin/activity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecDashEnabled.mockReturnValue(true);
    mockSecMonEnabled.mockReturnValue(true);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockRequireAdmin.mockResolvedValue({ user: { id: 'u1' } });
    mockFetchEmails.mockResolvedValue(new Map());
  });

  it('returns 404 when security monitoring disabled', async () => {
    mockSecMonEnabled.mockReturnValue(false);
    const res = await GET(makeRequest());
    expect(res.status).toBe(404);
  });

  it('returns 404 when security dashboard disabled', async () => {
    mockSecDashEnabled.mockReturnValue(false);
    const res = await GET(makeRequest());
    expect(res.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'no session' },
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(mockLogUnauth).toHaveBeenCalled();
  });

  it('returns 403 when not admin', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('Forbidden'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
    expect(mockLogUnauth).toHaveBeenCalled();
  });

  it('returns activity with enriched user data', async () => {
    const activity = [
      {
        id: '1',
        created_at: new Date().toISOString(),
        user_id: 'u1',
        org_id: 'org-1',
        action: 'login',
        entity_type: null,
        entity_id: null,
        route: null,
        metadata: null,
      },
    ];
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    const profiles = [{ user_id: 'u1', full_name: 'Test User' }];
    const orgs = [{ id: 'org-1', name: 'TestOrg' }];
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === 'user_activity')
          return createBuilder({ data: activity, error: null });
        if (table === 'user_profiles')
          return createBuilder({ data: profiles, error: null });
        if (table === 'organizations')
          return createBuilder({ data: orgs, error: null });
        return createBuilder({ data: [], error: null });
      }),
    });
    mockFetchEmails.mockResolvedValue(new Map([['u1', 'test@example.com']]));
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.activity[0].user.full_name).toBe('Test User');
    expect(json.activity[0].user.email).toBe('test@example.com');
    expect(json.activity[0].org.name).toBe('TestOrg');
  });

  it('handles 1h time range', async () => {
    const res = await GET(makeRequest({ range: '1h' }));
    expect(res.status).toBe(200);
  });

  it('handles 7d time range', async () => {
    const res = await GET(makeRequest({ range: '7d' }));
    expect(res.status).toBe(200);
  });

  it('filters by action', async () => {
    const res = await GET(makeRequest({ action: 'login' }));
    expect(res.status).toBe(200);
  });

  it('returns 500 on db error', async () => {
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'DB err' } }),
      ),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockRequireAdmin.mockResolvedValue({ user: { id: 'u1' } });
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        throw new Error('unexpected');
      }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });

  it('handles activity with no org_id', async () => {
    const activity = [
      {
        id: '1',
        created_at: new Date().toISOString(),
        user_id: 'u1',
        org_id: null,
        action: 'login',
        entity_type: null,
        entity_id: null,
        route: null,
        metadata: null,
      },
    ];
    const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: activity, error: null });
        return createBuilder({ data: [], error: null });
      }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.activity[0].org).toBeNull();
  });
});

/** @jest-environment node */
/**
 * Tests for admin/system route pure functions + GET handler branches
 * Extracts and tests: percentile, buildRouteLatencyStats
 */

jest.mock('server-only', () => ({}));
jest.mock('@/app/app/admin/access', () => ({
  requireAdminAccess: jest.fn(),
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
    'in',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'gte',
    'lte',
    'is',
    'contains',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/config/release', () => ({
  CURRENT_RELEASE_NAME: 'TestRelease',
  CURRENT_VERSION: '1.0.0',
}));
jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
const { requireAdminAccess } = require('@/app/app/admin/access');

import { GET } from '@/app/api/admin/system/route';

beforeEach(() => jest.clearAllMocks());

describe('GET /api/admin/system', () => {
  it('returns 403 on permission error', async () => {
    requireAdminAccess.mockRejectedValue(new Error('Unauthorized'));
    const res = await GET();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('permission');
  });

  it('returns 403 on Forbidden error', async () => {
    requireAdminAccess.mockRejectedValue(new Error('Forbidden'));
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns 500 on unexpected error', async () => {
    requireAdminAccess.mockRejectedValue(new Error('DB down'));
    const res = await GET();
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed');
  });

  it('returns system metrics on success', async () => {
    requireAdminAccess.mockResolvedValue({});
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        // 1: db latency ping
        if (callCount === 1)
          return createBuilder({ data: null, error: null, count: 0 });
        // 2: orgs count
        if (callCount === 2)
          return createBuilder({ data: null, error: null, count: 5 });
        // 3: subs count
        if (callCount === 3)
          return createBuilder({ data: null, error: null, count: 3 });
        // 4: members count
        if (callCount === 4)
          return createBuilder({ data: null, error: null, count: 10 });
        // 5: audit count
        if (callCount === 5)
          return createBuilder({ data: null, error: null, count: 100 });
        // 6: recent admin actions
        if (callCount === 6)
          return createBuilder({ data: null, error: null, count: 2 });
        // 7: recent billing events
        if (callCount === 7)
          return createBuilder({ data: null, error: null, count: 1 });
        // 8: route transitions
        if (callCount === 8)
          return createBuilder({
            data: [
              {
                route: '/app/dashboard',
                metadata: {
                  nav_source: 'sidebar',
                  to_route: '/app/dashboard',
                  duration_ms: 150,
                },
              },
              {
                route: '/app/settings',
                metadata: {
                  nav_source: 'sidebar',
                  to_route: '/app/settings',
                  duration_ms: 200,
                },
              },
              {
                route: '/app/reports',
                metadata: { nav_source: 'click', duration_ms: 50 },
              }, // not sidebar
              {
                route: null,
                metadata: { nav_source: 'sidebar', duration_ms: -10 },
              }, // invalid duration
              {
                route: null,
                metadata: {
                  nav_source: 'sidebar',
                  to_route: '/app/team',
                  duration_ms: 999999,
                },
              }, // > 120000
              { route: null, metadata: null }, // null metadata
            ],
            error: null,
          });
        return createBuilder({ data: null, error: null });
      }),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total_organizations).toBe(5);
    expect(data.total_subscriptions).toBe(3);
    expect(data.total_members).toBe(10);
    expect(data.product_release_version).toBe('1.0.0');
    expect(data.route_transition_routes_24h).toBeDefined();
  });

  it('handles error counts gracefully', async () => {
    requireAdminAccess.mockResolvedValue({});
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'fail' }, count: null }),
      ),
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total_organizations).toBeNull();
  });
});

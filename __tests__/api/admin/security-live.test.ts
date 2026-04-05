/** @jest-environment node */

/**
 * Tests for app/api/admin/security-live/route.ts
 *
 * GET: Returns security events + alerts (with user enrichment)
 * PATCH: Updates alert status
 */

jest.mock('server-only', () => ({}));

// ── Supabase mocks ──────────────────────────────────────────────────────────

function createBuilder(result = { data: null, error: null }) {
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
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

// Admin client
jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});

function getAdminClient() {
  return require('@/lib/supabase/admin').__client;
}

// Server client
const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: { id: 'user-1', email: 'admin@test.com' } },
  error: null,
});

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

// ── Dependency mocks ─────────────────────────────────────────────────────────

jest.mock('@/app/app/admin/access', () => ({
  requireAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/api/admin/_auth-users', () => ({
  fetchAuthEmailsByIds: jest.fn().mockResolvedValue(new Map()),
}));

jest.mock('@/lib/security/session-security', () => ({
  extractClientIP: jest.fn(() => '127.0.0.1'),
}));

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock('@/lib/security/event-logger', () => ({
  logUnauthorizedAccess: jest.fn(),
  logUserActivity: jest.fn(),
}));

jest.mock('@/lib/security/monitoring-flags', () => ({
  isSecurityDashboardEnabled: jest.fn(() => true),
  isSecurityMonitoringEnabled: jest.fn(() => true),
}));

jest.mock('@/lib/security/csrf', () => ({
  validateCsrfOrigin: jest.fn(() => null),
}));

jest.mock('@/app/api/admin/_helpers', () => ({
  assertAdminReason: jest.fn((r: string) => r),
  extractAdminReason: jest.fn(() => 'test reason'),
}));

import { GET, PATCH } from '@/app/api/admin/security-live/route';

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-1', email: 'admin@test.com' } },
    error: null,
  });
});

describe('GET /api/admin/security-live', () => {
  it('returns events and alerts for authenticated admin', async () => {
    const events = [
      {
        id: 'ev-1',
        created_at: new Date().toISOString(),
        type: 'login_failed',
        severity: 'high',
        user_id: null,
        org_id: null,
        ip_address: '1.2.3.4',
        geo_country: 'US',
        request_path: '/api/auth',
        user_agent: 'Mozilla',
        metadata: {},
      },
    ];
    const alerts = [
      {
        id: 'al-1',
        created_at: new Date().toISOString(),
        status: 'open',
        event_id: 'ev-1',
        notes: null,
        assigned_to: null,
        resolved_at: null,
        resolved_by: null,
        resolution_notes: null,
      },
    ];

    let callIdx = 0;
    getAdminClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return createBuilder({ data: events, error: null });
      if (callIdx === 2) return createBuilder({ data: alerts, error: null });
      return createBuilder({ data: [], error: null });
    });

    const request = new Request(
      'http://localhost/api/admin/security-live?range=24h',
    );
    const res = await GET(request);
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.events).toBeDefined();
    expect(json.alerts).toBeDefined();
    expect(json.summary).toBeDefined();
    expect(json.filterOptions).toBeDefined();
  });

  it('returns 401 for unauthenticated user', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'No session' },
    });

    const request = new Request('http://localhost/api/admin/security-live');
    const res = await GET(request);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    const { requireAdminAccess } = require('@/app/app/admin/access');
    requireAdminAccess.mockRejectedValueOnce(new Error('Forbidden'));

    const request = new Request('http://localhost/api/admin/security-live');
    const res = await GET(request);
    expect(res.status).toBe(403);
  });

  it('returns 404 when monitoring disabled', async () => {
    const {
      isSecurityMonitoringEnabled,
    } = require('@/lib/security/monitoring-flags');
    isSecurityMonitoringEnabled.mockReturnValueOnce(false);

    const request = new Request('http://localhost/api/admin/security-live');
    const res = await GET(request);
    expect(res.status).toBe(404);
  });

  it('applies severity filter', async () => {
    getAdminClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );

    const request = new Request(
      'http://localhost/api/admin/security-live?severity=critical',
    );
    const res = await GET(request);
    const json = await res.json();

    expect(json.ok).toBe(true);
  });

  it('returns empty alerts when no matching events for filters', async () => {
    // Events query returns empty
    getAdminClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );

    const request = new Request(
      'http://localhost/api/admin/security-live?severity=critical&userId=user-x',
    );
    const res = await GET(request);
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.alerts).toEqual([]);
  });

  it('handles DB error gracefully', async () => {
    getAdminClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'DB error' } }),
    );

    const request = new Request('http://localhost/api/admin/security-live');
    const res = await GET(request);
    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/admin/security-live', () => {
  it('updates alert status successfully', async () => {
    const updatedAlert = { id: 'al-1', event_id: 'ev-1' };
    const event = { org_id: 'org-1' };

    let callIdx = 0;
    getAdminClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1)
        return createBuilder({ data: updatedAlert, error: null });
      return createBuilder({ data: event, error: null });
    });

    const request = new Request('http://localhost/api/admin/security-live', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId: 'al-1', status: 'acknowledged' }),
    });

    const res = await PATCH(request);
    const json = await res.json();

    expect(json.ok).toBe(true);
  });

  it('returns 400 for invalid payload', async () => {
    const request = new Request('http://localhost/api/admin/security-live', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId: 'al-1', status: 'invalid_status' }),
    });

    const res = await PATCH(request);
    expect(res.status).toBe(400);
  });

  it('returns 401 for unauthenticated user', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'No session' },
    });

    const request = new Request('http://localhost/api/admin/security-live', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId: 'al-1', status: 'resolved' }),
    });

    const res = await PATCH(request);
    expect(res.status).toBe(401);
  });

  it('returns 404 when monitoring disabled', async () => {
    const {
      isSecurityDashboardEnabled,
    } = require('@/lib/security/monitoring-flags');
    isSecurityDashboardEnabled.mockReturnValueOnce(false);

    const request = new Request('http://localhost/api/admin/security-live', {
      method: 'PATCH',
      body: '{}',
    });

    const res = await PATCH(request);
    expect(res.status).toBe(404);
  });

  it('handles resolved status with resolution notes', async () => {
    const updatedAlert = { id: 'al-1', event_id: 'ev-1' };
    let callIdx = 0;
    getAdminClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1)
        return createBuilder({ data: updatedAlert, error: null });
      return createBuilder({ data: { org_id: 'org-1' }, error: null });
    });

    const request = new Request('http://localhost/api/admin/security-live', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId: 'al-1',
        status: 'resolved',
        notes: 'False alarm',
      }),
    });

    const res = await PATCH(request);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});

/** @jest-environment node */

/**
 * Tests for app/api/customer-health/rankings/route.ts
 *
 * GET: Returns health rankings for all organizations (founder only)
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
  data: { user: { id: 'user-founder', email: 'founder@test.com' } },
  error: null,
});

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

// ── Dependency mocks ──────────────────────────────────────────────────────────

jest.mock('@/lib/utils/founder', () => ({
  isFounder: jest.fn(() => true),
}));

jest.mock('@/lib/customer-health/health-score-engine', () => ({
  calculateHealthScore: jest.fn((input: any) => ({
    orgId: input.orgId,
    orgName: input.orgName,
    score: 72,
    status: 'Warning',
    isTrialing: input.isTrialing,
    factors: {},
    alerts: [],
    recommendations: [],
  })),
}));

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

import { GET } from '@/app/api/customer-health/rankings/route';

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockReset().mockResolvedValue({
    data: { user: { id: 'user-founder', email: 'founder@test.com' } },
    error: null,
  });
  // Ensure server client mock is fresh
  const { createSupabaseServerClient } = require('@/lib/supabase/server');
  createSupabaseServerClient.mockReset().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  });
});

describe('GET /api/customer-health/rankings', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'No session' },
    });

    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 403 when user is not a founder', async () => {
    const { isFounder } = require('@/lib/utils/founder');
    isFounder.mockReturnValueOnce(false);

    const res = await GET();
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('FOUNDER_REQUIRED');
  });

  it('returns empty rankings when no organizations exist', async () => {
    // organizations query returns empty array
    getAdminClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.rankings.organizations).toEqual([]);
    expect(json.rankings.summary.total).toBe(0);
    expect(json.rankings.summary.averageScore).toBe(0);
  });

  it('returns rankings for organizations with full data', async () => {
    const orgs = [
      {
        id: 'org-1',
        name: 'Acme Corp',
        industry: 'tech',
        created_at: '2024-01-01T00:00:00Z',
        org_subscriptions: [
          { plan_key: 'pro', status: 'active', trial_expires_at: null },
        ],
      },
      {
        id: 'org-2',
        name: 'Beta Inc',
        industry: 'health',
        created_at: '2024-06-01T00:00:00Z',
        org_subscriptions: [
          {
            plan_key: 'starter',
            status: 'trialing',
            trial_expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
          },
        ],
      },
    ];

    const members = [
      { organization_id: 'org-1' },
      { organization_id: 'org-1' },
      { organization_id: 'org-2' },
    ];

    const loginRows = [
      { organization_id: 'org-1', created_at: new Date().toISOString() },
    ];

    const activityRows = [
      { organization_id: 'org-1', action: 'evidence.upload' },
      { organization_id: 'org-1', action: 'task.create' },
    ];

    const complianceRows = [
      {
        organization_id: 'org-1',
        compliance_score: 85,
        captured_at: new Date().toISOString(),
      },
    ];

    let callIdx = 0;
    getAdminClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return createBuilder({ data: orgs, error: null });
      if (callIdx === 2) return createBuilder({ data: members, error: null });
      if (callIdx === 3) return createBuilder({ data: loginRows, error: null });
      if (callIdx === 4)
        return createBuilder({ data: activityRows, error: null });
      if (callIdx === 5)
        return createBuilder({ data: complianceRows, error: null });
      // workflows, workflowRuns, overdueTasks
      return createBuilder({ data: [], error: null });
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.rankings.organizations).toHaveLength(2);
    expect(json.rankings.summary.total).toBe(2);
    expect(json.generatedAt).toBeDefined();
  });

  it('returns 500 when organizations query fails', async () => {
    getAdminClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'DB failure' } }),
    );

    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.code).toBe('CALCULATION_ERROR');
  });

  it('handles auth exception gracefully', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('Token expired'));

    // When the whole server client creation throws
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockRejectedValueOnce(
      new Error('Token expired'),
    );

    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.code).toBe('AUTH_ERROR');
  });

  it('calculates summary counts correctly', async () => {
    // Two orgs - our mock always returns score=72, status='Warning'
    const orgs = [
      {
        id: 'org-1',
        name: 'A',
        industry: null,
        created_at: '2024-01-01T00:00:00Z',
        org_subscriptions: [
          { plan_key: 'pro', status: 'active', trial_expires_at: null },
        ],
      },
      {
        id: 'org-2',
        name: 'B',
        industry: null,
        created_at: '2024-01-01T00:00:00Z',
        org_subscriptions: [
          { plan_key: 'pro', status: 'active', trial_expires_at: null },
        ],
      },
    ];

    let callIdx = 0;
    getAdminClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return createBuilder({ data: orgs, error: null });
      return createBuilder({ data: [], error: null });
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.rankings.summary.total).toBe(2);
    expect(json.rankings.summary.warning).toBe(2);
    expect(json.rankings.summary.averageScore).toBe(72);
    expect(json.rankings.calculatedAt).toBeDefined();
  });
});

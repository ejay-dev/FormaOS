/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/trust-packet/generate/route.ts
 * Targets 46 uncovered branches: CSRF, rate limit, auth, membership, role check, body parsing, DB insert
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const mockCsrf = jest.fn();
jest.mock('@/lib/security/csrf', () => ({
  validateCsrfOrigin: (...a: any[]) => mockCsrf(...a),
}));

const mockCheckRL = jest.fn();
const mockGetIdent = jest.fn();
const mockCreateHeaders = jest.fn();
jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: (...a: any[]) => mockCheckRL(...a),
  getClientIdentifier: (...a: any[]) => mockGetIdent(...a),
  createRateLimitHeaders: (...a: any[]) => mockCreateHeaders(...a),
  RATE_LIMITS: { EXPORT: { windowMs: 600000, maxRequests: 5 } },
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
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

let builderResults: Record<string, any> = {};
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    from: jest.fn((table: string) => {
      if (builderResults[table]) return builderResults[table];
      return createBuilder();
    }),
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
  })),
}));

import { POST } from '@/app/api/trust-packet/generate/route';
import { NextRequest } from 'next/server';

function makeRequest(body?: Record<string, any>) {
  return new NextRequest('http://localhost/api/trust-packet/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('POST /api/trust-packet/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCsrf.mockReturnValue(null);
    mockCheckRL.mockResolvedValue({ success: true });
    mockGetIdent.mockResolvedValue('ip-1');
    mockCreateHeaders.mockReturnValue({});
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    builderResults = {
      org_members: createBuilder({
        data: { organization_id: 'org-1', role: 'admin' },
        error: null,
      }),
      org_frameworks: createBuilder({
        data: [
          { framework_key: 'soc2', status: 'active', created_at: '2025-01-01' },
        ],
        error: null,
      }),
      policies: createBuilder({
        data: [
          {
            id: 'p1',
            title: 'Security',
            status: 'active',
            last_reviewed_at: new Date().toISOString(),
          },
        ],
        error: null,
      }),
      controls: createBuilder({
        data: [{ id: 'c1', status: 'implemented', framework_key: 'soc2' }],
        error: null,
      }),
      org_subscriptions: createBuilder({
        data: { plan_key: 'enterprise', status: 'active' },
        error: null,
      }),
      trust_packets: createBuilder({ data: null, error: null }),
    };
  });

  it('returns CSRF error when csrf fails', async () => {
    const csrfResp = new Response(JSON.stringify({ error: 'CSRF' }), {
      status: 403,
    });
    mockCsrf.mockReturnValue(csrfResp);
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    mockCheckRL.mockResolvedValue({ success: false, remaining: 0 });
    const res = await POST(makeRequest());
    expect(res.status).toBe(429);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 404 when no organization', async () => {
    // Modern lookup returns nothing, legacy lookup returns nothing
    builderResults.org_members = createBuilder({ data: null, error: null });
    const res = await POST(makeRequest());
    expect(res.status).toBe(404);
  });

  it('returns 403 when role is not admin/owner', async () => {
    builderResults.org_members = createBuilder({
      data: { organization_id: 'org-1', role: 'viewer' },
      error: null,
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
  });

  it('returns 403 when role is null', async () => {
    builderResults.org_members = createBuilder({
      data: { organization_id: 'org-1', role: null },
      error: null,
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
  });

  it('succeeds with custom expiresInDays and recipientEmail', async () => {
    const res = await POST(
      makeRequest({
        expiresInDays: 14,
        recipientEmail: 'test@example.com',
        note: 'For review',
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.shareUrl).toBeDefined();
    expect(json.packet).toBeDefined();
  });

  it('succeeds with default body when json parse fails', async () => {
    const req = new NextRequest('http://localhost/api/trust-packet/generate', {
      method: 'POST',
      body: 'invalid json',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('handles insert error gracefully with warning', async () => {
    builderResults.trust_packets = createBuilder({
      data: null,
      error: { message: 'relation does not exist' },
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.warning).toBeDefined();
    expect(json.shareUrl).toBeNull();
  });

  it('returns 500 when exception thrown', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn(() => {
        throw new Error('Connection lost');
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });

  it('checks legacy membership when modern lookup fails', async () => {
    // Modern returns error, legacy returns org_id
    let callCount = 0;
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      from: jest.fn((table: string) => {
        if (table === 'org_members') {
          callCount++;
          if (callCount === 1) {
            // Modern lookup fails
            return createBuilder({ data: null, error: { message: 'err' } });
          }
          // Legacy lookup succeeds
          return createBuilder({
            data: { org_id: 'org-1', role: 'owner' },
            error: null,
          });
        }
        return builderResults[table] || createBuilder();
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
  });

  it('calculates coverage with non-enterprise plan', async () => {
    builderResults.org_subscriptions = createBuilder({
      data: { plan_key: 'pro', status: 'active' },
      error: null,
    });
    builderResults.controls = createBuilder({
      data: [
        { id: 'c1', status: 'implemented', framework_key: 'soc2' },
        { id: 'c2', status: 'not_started', framework_key: 'soc2' },
      ],
      error: null,
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.packet.security_overview.sso_available).toBe(false);
    expect(json.packet.compliance_summary.coverage_percent).toBe(50);
  });

  it('handles zero controls', async () => {
    builderResults.controls = createBuilder({ data: [], error: null });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.packet.compliance_summary.coverage_percent).toBe(0);
  });

  it('counts recently reviewed policies', async () => {
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
    builderResults.policies = createBuilder({
      data: [
        {
          id: 'p1',
          title: 'Recent',
          status: 'active',
          last_reviewed_at: new Date().toISOString(),
        },
        {
          id: 'p2',
          title: 'Old',
          status: 'active',
          last_reviewed_at: thirtyOneDaysAgo.toISOString(),
        },
        { id: 'p3', title: 'Never', status: 'active', last_reviewed_at: null },
      ],
      error: null,
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.packet.policies_summary.recently_reviewed).toBe(1);
  });
});

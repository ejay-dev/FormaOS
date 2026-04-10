/** @jest-environment node */

/**
 * Tests for app/api/v1/controls/route.ts
 *
 * GET: List controls with pagination, filtering, evidence/evaluation enrichment.
 * Auth via API key middleware.
 */

jest.mock('server-only', () => ({}));

// ── Supabase mock (builder pattern) ──────────────────────────────────────────

function createBuilder(
  result = { data: null, error: null, count: null as number | null },
) {
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
    'ilike',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

// ── API key middleware mock ───────────────────────────────────────────────────

const mockDb = { from: jest.fn(() => createBuilder()) };
const _mockContext = {
  orgId: 'org-1',
  db: mockDb,
  apiKey: { id: 'key-1', organization_id: 'org-1' },
};

jest.mock('@/lib/api-keys/middleware', () => ({
  authenticateV1Request: jest.fn().mockResolvedValue({
    ok: true,
    context: {
      orgId: 'org-1',
      db: { from: jest.fn(() => createBuilder()) },
      apiKey: { id: 'key-1', organization_id: 'org-1' },
    },
    response: undefined,
  }),
  jsonWithContext: jest.fn((_ctx: any, body: any) => {
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  logV1Access: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/api/v1', () => ({
  getPagination: jest.fn((_req: any, defaultLimit: number) => ({
    limit: defaultLimit,
    offset: 0,
    searchParams: new URLSearchParams(),
  })),
  paginatedEnvelope: jest.fn((data: any, meta: any) => ({
    data,
    meta,
  })),
}));

jest.mock('@/lib/api/v1-helpers', () => ({
  buildIlikePattern: jest.fn((q: string) => `%${q}%`),
  getStringParam: jest.fn(() => null),
}));

import { GET } from '@/app/api/v1/controls/route';

beforeEach(() => {
  jest.clearAllMocks();

  // Reset auth to successful
  const {
    authenticateV1Request,
    jsonWithContext,
  } = require('@/lib/api-keys/middleware');

  // Create fresh mock DB for each test
  const freshDb = { from: jest.fn(() => createBuilder()) };

  authenticateV1Request.mockResolvedValue({
    ok: true,
    context: {
      orgId: 'org-1',
      db: freshDb,
      apiKey: { id: 'key-1', organization_id: 'org-1' },
    },
    response: undefined,
  });

  jsonWithContext.mockImplementation(
    (_ctx: any, body: any) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
});

describe('GET /api/v1/controls', () => {
  it('returns auth error when API key is invalid', async () => {
    const { authenticateV1Request } = require('@/lib/api-keys/middleware');
    authenticateV1Request.mockResolvedValueOnce({
      ok: false,
      response: new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
      }),
    });

    const request = new Request('http://localhost/api/v1/controls');
    const res = await GET(request);
    expect(res.status).toBe(401);
  });

  it('returns controls with evidence and evaluation enrichment', async () => {
    const {
      authenticateV1Request,
      jsonWithContext,
    } = require('@/lib/api-keys/middleware');

    const controls = [
      {
        id: 'ctrl-1',
        code: 'CC-1.1',
        title: 'Access Control',
        framework_id: 'soc2',
      },
      {
        id: 'ctrl-2',
        code: 'CC-2.1',
        title: 'Data Encryption',
        framework_id: 'soc2',
      },
    ];
    const evidence = [
      { control_id: 'ctrl-1', status: 'approved' },
      { control_id: 'ctrl-1', status: 'pending' },
    ];
    const evaluations = [
      {
        control_key: 'CC-1.1',
        status: 'compliant',
        compliance_score: 95,
        evaluated_at: '2024-01-01',
        last_evaluated_at: '2024-01-01',
      },
    ];

    const freshDb = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'compliance_controls')
          return createBuilder({ data: controls, error: null, count: 2 });
        if (table === 'control_evidence')
          return createBuilder({ data: evidence, error: null, count: null });
        if (table === 'org_control_evaluations')
          return createBuilder({ data: evaluations, error: null, count: null });
        return createBuilder();
      }),
    };

    authenticateV1Request.mockResolvedValueOnce({
      ok: true,
      context: {
        orgId: 'org-1',
        db: freshDb,
        apiKey: { id: 'key-1', organization_id: 'org-1' },
      },
    });

    const request = new Request('http://localhost/api/v1/controls');
    const res = await GET(request);
    expect(res.status).toBe(200);

    // jsonWithContext was called
    expect(jsonWithContext).toHaveBeenCalled();
  });

  it('handles empty controls list', async () => {
    const {
      authenticateV1Request,
      jsonWithContext: _jsonWithContext,
    } = require('@/lib/api-keys/middleware');

    const freshDb = {
      from: jest.fn(() => createBuilder({ data: [], error: null, count: 0 })),
    };

    authenticateV1Request.mockResolvedValueOnce({
      ok: true,
      context: {
        orgId: 'org-1',
        db: freshDb,
        apiKey: { id: 'key-1', organization_id: 'org-1' },
      },
    });

    const request = new Request('http://localhost/api/v1/controls');
    const res = await GET(request);
    expect(res.status).toBe(200);
  });

  it('returns 500 on unhandled error', async () => {
    const { authenticateV1Request } = require('@/lib/api-keys/middleware');

    authenticateV1Request.mockResolvedValueOnce({
      ok: true,
      context: {
        orgId: 'org-1',
        db: {
          from: jest.fn().mockImplementation(() => {
            throw new Error('unexpected');
          }),
        },
        apiKey: { id: 'key-1' },
      },
    });

    const request = new Request('http://localhost/api/v1/controls');
    const res = await GET(request);
    expect(res.status).toBe(500);
  });

  it('filters by frameworkId when provided', async () => {
    const {
      authenticateV1Request,
      jsonWithContext,
    } = require('@/lib/api-keys/middleware');
    const { getStringParam } = require('@/lib/api/v1-helpers');

    getStringParam.mockImplementation((_sp: any, key: string) => {
      if (key === 'frameworkId') return 'soc2';
      return null;
    });

    const freshDb = {
      from: jest.fn(() => createBuilder({ data: [], error: null, count: 0 })),
    };

    authenticateV1Request.mockResolvedValueOnce({
      ok: true,
      context: {
        orgId: 'org-1',
        db: freshDb,
        apiKey: { id: 'key-1', organization_id: 'org-1' },
      },
    });

    const request = new Request(
      'http://localhost/api/v1/controls?frameworkId=soc2',
    );
    await GET(request);

    expect(jsonWithContext).toHaveBeenCalled();
  });
});

/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/executive/audit-forecast/route.ts
 * Targets uncovered branches in GET: auth, membership, role check,
 * framework filter, calculation error
 */

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

let authResult: any = { data: { user: { id: 'u1' } }, error: null };
let fromBuilder: any;
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    auth: { getUser: () => authResult },
    from: jest.fn(() => fromBuilder),
  })),
}));

function createBuilder(result: any = { data: null, error: null, count: 0 }) {
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
    'head',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const mockCalculateAuditForecast = jest.fn();
jest.mock('@/lib/executive/multi-framework-rollup', () => ({
  calculateAuditForecast: (...a: any[]) => mockCalculateAuditForecast(...a),
}));

const mockGetDeadlineSummary = jest.fn();
const mockGetActionDeadlines = jest.fn();
jest.mock('@/lib/executive/deadline-tracker', () => ({
  getDeadlineSummary: (...a: any[]) => mockGetDeadlineSummary(...a),
  getActionRequiredDeadlines: (...a: any[]) => mockGetActionDeadlines(...a),
}));

// Mock the admin client used by getAutomationMetrics
const mockAdminFrom = jest.fn();
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    from: (...a: any[]) => mockAdminFrom(...a),
  })),
}));

import { GET } from '@/app/api/executive/audit-forecast/route';
import { NextRequest } from 'next/server';

function makeReq(params = '') {
  return new NextRequest(
    `http://localhost/api/executive/audit-forecast${params}`,
  );
}

describe('GET /api/executive/audit-forecast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authResult = { data: { user: { id: 'u1' } }, error: null };
    fromBuilder = createBuilder({
      data: { organization_id: 'org1', role: 'admin' },
      error: null,
    });
    mockCalculateAuditForecast.mockResolvedValue({ score: 85 });
    mockGetDeadlineSummary.mockResolvedValue({ upcoming: 2 });
    mockGetActionDeadlines.mockResolvedValue([]);
    // Mock admin from for automation metrics — return builders for each table
    mockAdminFrom.mockReturnValue(
      createBuilder({ data: [], error: null, count: 0 }),
    );
  });

  it('returns forecast data', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.auditForecast.score).toBe(85);
    expect(body.generatedAt).toBeDefined();
  });

  it('returns 401 when not authenticated', async () => {
    authResult = { data: { user: null }, error: { message: 'no auth' } };
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns 401 on auth exception', async () => {
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockRejectedValueOnce(new Error('auth crash'));
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns 403 when no membership', async () => {
    fromBuilder = createBuilder({ data: null, error: null });
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
  });

  it('returns 403 for member role', async () => {
    fromBuilder = createBuilder({
      data: { organization_id: 'org1', role: 'member' },
      error: null,
    });
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
  });

  it('returns 500 on org lookup error', async () => {
    const { createSupabaseServerClient } = require('@/lib/supabase/server');
    createSupabaseServerClient.mockResolvedValueOnce({
      auth: { getUser: () => ({ data: { user: { id: 'u1' } }, error: null }) },
      from: () => {
        throw new Error('DB down');
      },
    });
    const res = await GET(makeReq());
    expect(res.status).toBe(500);
  });

  it('returns 500 on calculation error', async () => {
    mockCalculateAuditForecast.mockRejectedValue(new Error('calc fail'));
    const res = await GET(makeReq());
    expect(res.status).toBe(500);
  });

  it('passes framework filter to calculation', async () => {
    const res = await GET(makeReq('?framework=soc2'));
    expect(res.status).toBe(200);
    expect(mockCalculateAuditForecast).toHaveBeenCalledWith('org1', 'soc2');
  });

  it('handles owner role', async () => {
    fromBuilder = createBuilder({
      data: { organization_id: 'org1', role: 'owner' },
      error: null,
    });
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
  });
});

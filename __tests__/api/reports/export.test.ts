/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/reports/export/route.ts
 * Targets uncovered branches in GET handler: rate limit, auth, membership,
 * role check, report type validation, async/sync modes, json/pdf formats
 */

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const mockCheckRateLimit = jest.fn();
const mockGetClientIdentifier = jest.fn();
const mockGetUserIdentifier = jest.fn();
const mockCreateRateLimitHeaders = jest.fn(() => ({}));
jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: (...a: any[]) => mockCheckRateLimit(...a),
  getClientIdentifier: (...a: any[]) => mockGetClientIdentifier(...a),
  getUserIdentifier: (...a: any[]) => mockGetUserIdentifier(...a),
  createRateLimitHeaders: (...a: any[]) => mockCreateRateLimitHeaders(...a),
  RATE_LIMITS: { EXPORT: { limit: 5, window: 3600 } },
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

let authResult: any = { data: { user: { id: 'u1' } }, error: null };
let fromBuilder: any;
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    auth: { getUser: () => authResult },
    from: jest.fn(() => fromBuilder),
  })),
}));

const mockBuildReport = jest.fn();
jest.mock('@/lib/audit-reports/report-builder', () => ({
  buildReport: (...a: any[]) => mockBuildReport(...a),
}));

const mockGeneratePdf = jest.fn();
jest.mock('@/lib/audit-reports/pdf-generator', () => ({
  generateReportPdf: (...a: any[]) => mockGeneratePdf(...a),
}));

const mockCreateJob = jest.fn();
const mockProcessJob = jest.fn();
jest.mock('@/lib/reports/export-jobs', () => ({
  createReportExportJob: (...a: any[]) => mockCreateJob(...a),
  processReportExportJob: (...a: any[]) => mockProcessJob(...a),
}));

import { GET } from '@/app/api/reports/export/route';
import { NextRequest } from 'next/server';

function makeReq(params: string = '?type=soc2&format=pdf') {
  return new NextRequest(`http://localhost/api/reports/export${params}`);
}

describe('GET /api/reports/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserIdentifier.mockResolvedValue('u1');
    mockGetClientIdentifier.mockResolvedValue('ip:1.2.3.4');
    mockCheckRateLimit.mockResolvedValue({ success: true });
    authResult = { data: { user: { id: 'u1' } }, error: null };
    fromBuilder = createBuilder({
      data: { organization_id: 'org1', role: 'admin' },
      error: null,
    });
  });

  it('returns 429 on rate limit', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false });
    const res = await GET(makeReq());
    expect(res.status).toBe(429);
  });

  it('returns 400 on invalid report type', async () => {
    const res = await GET(makeReq('?type=invalid'));
    expect(res.status).toBe(400);
  });

  it('returns 400 on missing report type', async () => {
    const res = await GET(makeReq(''));
    expect(res.status).toBe(400);
  });

  it('returns 401 on auth error', async () => {
    authResult = { data: { user: null }, error: { message: 'no auth' } };
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns 401 on auth exception', async () => {
    authResult = { data: { user: null }, error: null };
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns 403 on missing membership', async () => {
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

  it('returns json format', async () => {
    mockBuildReport.mockResolvedValue({
      organizationName: 'Test Org',
      data: {},
    });
    const res = await GET(makeReq('?type=soc2&format=json&mode=sync'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report).toBeDefined();
  });

  it('returns pdf format', async () => {
    mockBuildReport.mockResolvedValue({
      organizationName: 'Test Org',
      data: {},
    });
    const pdfBlob = { arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) };
    mockGeneratePdf.mockReturnValue(pdfBlob);
    const res = await GET(makeReq('?type=soc2&format=pdf&sync=1'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
  });

  it('handles async mode (default)', async () => {
    mockCreateJob.mockResolvedValue({ ok: true, jobId: 'job-1' });
    mockProcessJob.mockResolvedValue(undefined);
    const res = await GET(makeReq('?type=soc2'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.jobId).toBe('job-1');
    expect(body.status).toBe('pending');
  });

  it('returns 500 when job creation fails', async () => {
    mockCreateJob.mockResolvedValue({ ok: false, error: 'Queue full' });
    const res = await GET(makeReq('?type=soc2'));
    expect(res.status).toBe(500);
  });

  it('returns 500 on report build error', async () => {
    mockBuildReport.mockRejectedValue(new Error('Build failed'));
    const res = await GET(makeReq('?type=soc2&mode=sync'));
    expect(res.status).toBe(500);
  });

  it('handles org lookup exception', async () => {
    fromBuilder = createBuilder({ data: null, error: null });
    // Force an exception by making from() throw
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
});

/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/exports/enterprise/[jobId]/route.ts
 * GET handler (download) and POST handler (trigger processing)
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/observability/structured-logger', () => ({
  exportLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockVerifyToken = jest.fn();
jest.mock('@/lib/security/export-tokens', () => ({
  verifyExportToken: (...args: any[]) => mockVerifyToken(...args),
}));

const mockGetJobStatus = jest.fn();
jest.mock('@/lib/export/enterprise-export', () => ({
  getExportJobStatus: (...args: any[]) => mockGetJobStatus(...args),
  processEnterpriseExportJob: jest
    .fn()
    .mockResolvedValue({ ok: true, downloadUrl: 'https://example.com/dl' }),
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
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

let adminBuilder: any;
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    from: jest.fn(() => adminBuilder),
  })),
}));

let memberBuilder: any;
const mockGetUser = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    from: jest.fn(() => memberBuilder),
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
  })),
}));

jest.mock('@/lib/supabase/env', () => ({
  getSupabaseUrl: jest.fn(() => 'https://abc.supabase.co'),
}));

import { GET, POST } from '@/app/api/exports/enterprise/[jobId]/route';
import { NextRequest } from 'next/server';

function makeGETRequest(jobId: string, token?: string) {
  const url = token
    ? `http://localhost/api/exports/enterprise/${jobId}?token=${token}`
    : `http://localhost/api/exports/enterprise/${jobId}`;
  const req = new NextRequest(url);
  return { req, params: Promise.resolve({ jobId }) };
}

describe('GET /api/exports/enterprise/[jobId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminBuilder = createBuilder();
    memberBuilder = createBuilder({
      data: { organization_id: 'org-1', role: 'admin' },
      error: null,
    });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('returns 401 when no token', async () => {
    const { req, params } = makeGETRequest('job-1');
    const res = await GET(req, { params });
    expect(res.status).toBe(401);
  });

  it('returns 401 when token invalid', async () => {
    mockVerifyToken.mockReturnValue(null);
    const { req, params } = makeGETRequest('job-1', 'bad-token');
    const res = await GET(req, { params });
    expect(res.status).toBe(401);
  });

  it('returns 403 when jobId does not match token', async () => {
    mockVerifyToken.mockReturnValue({ jobId: 'other-job', orgId: 'org-1' });
    const { req, params } = makeGETRequest('job-1', 'valid-token');
    const res = await GET(req, { params });
    expect(res.status).toBe(403);
  });

  it('returns 401 when user not authenticated', async () => {
    mockVerifyToken.mockReturnValue({ jobId: 'job-1', orgId: 'org-1' });
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { req, params } = makeGETRequest('job-1', 'valid-token');
    const res = await GET(req, { params });
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin/owner', async () => {
    mockVerifyToken.mockReturnValue({ jobId: 'job-1', orgId: 'org-1' });
    memberBuilder = createBuilder({
      data: { organization_id: 'org-1', role: 'viewer' },
      error: null,
    });
    const { req, params } = makeGETRequest('job-1', 'valid-token');
    const res = await GET(req, { params });
    expect(res.status).toBe(403);
  });

  it('returns 403 when no membership', async () => {
    mockVerifyToken.mockReturnValue({ jobId: 'job-1', orgId: 'org-1' });
    memberBuilder = createBuilder({ data: null, error: null });
    const { req, params } = makeGETRequest('job-1', 'valid-token');
    const res = await GET(req, { params });
    expect(res.status).toBe(403);
  });

  it('returns 404 when job not found', async () => {
    mockVerifyToken.mockReturnValue({ jobId: 'job-1', orgId: 'org-1' });
    mockGetJobStatus.mockResolvedValue(null);
    const { req, params } = makeGETRequest('job-1', 'valid-token');
    const res = await GET(req, { params });
    expect(res.status).toBe(404);
  });

  it('returns 202 when job not completed', async () => {
    mockVerifyToken.mockReturnValue({ jobId: 'job-1', orgId: 'org-1' });
    mockGetJobStatus.mockResolvedValue({ status: 'processing', progress: 50 });
    const { req, params } = makeGETRequest('job-1', 'valid-token');
    const res = await GET(req, { params });
    expect(res.status).toBe(202);
  });

  it('returns 410 when export expired', async () => {
    mockVerifyToken.mockReturnValue({ jobId: 'job-1', orgId: 'org-1' });
    mockGetJobStatus.mockResolvedValue({
      status: 'completed',
      progress: 100,
      expiresAt: '2020-01-01T00:00:00Z',
    });
    const { req, params } = makeGETRequest('job-1', 'valid-token');
    const res = await GET(req, { params });
    expect(res.status).toBe(410);
  });

  it('redirects when file_url is valid supabase URL', async () => {
    mockVerifyToken.mockReturnValue({ jobId: 'job-1', orgId: 'org-1' });
    mockGetJobStatus.mockResolvedValue({ status: 'completed', progress: 100 });
    adminBuilder = createBuilder({
      data: {
        file_url: 'https://abc.supabase.co/storage/v1/object/signed/export.zip',
      },
      error: null,
    });
    const { req, params } = makeGETRequest('job-1', 'valid-token');
    const res = await GET(req, { params });
    expect(res.status).toBe(307);
  });

  it('returns 500 when file_url is untrusted domain', async () => {
    mockVerifyToken.mockReturnValue({ jobId: 'job-1', orgId: 'org-1' });
    mockGetJobStatus.mockResolvedValue({ status: 'completed', progress: 100 });
    adminBuilder = createBuilder({
      data: { file_url: 'https://evil.com/malware.zip' },
      error: null,
    });
    const { req, params } = makeGETRequest('job-1', 'valid-token');
    const res = await GET(req, { params });
    expect(res.status).toBe(500);
  });

  it('returns 500 when file_url is null', async () => {
    mockVerifyToken.mockReturnValue({ jobId: 'job-1', orgId: 'org-1' });
    mockGetJobStatus.mockResolvedValue({ status: 'completed', progress: 100 });
    adminBuilder = createBuilder({ data: { file_url: null }, error: null });
    const { req, params } = makeGETRequest('job-1', 'valid-token');
    const res = await GET(req, { params });
    expect(res.status).toBe(500);
  });

  it('returns 500 when legacy query errors', async () => {
    mockVerifyToken.mockReturnValue({ jobId: 'job-1', orgId: 'org-1' });
    mockGetJobStatus.mockResolvedValue({ status: 'completed', progress: 100 });
    adminBuilder = createBuilder({
      data: null,
      error: { message: 'DB error' },
    });
    const { req, params } = makeGETRequest('job-1', 'valid-token');
    const res = await GET(req, { params });
    expect(res.status).toBe(500);
  });
});

describe('POST /api/exports/enterprise/[jobId]', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: 'test-secret' };
    adminBuilder = createBuilder();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns 500 when CRON_SECRET not configured', async () => {
    process.env = { ...originalEnv };
    delete process.env.CRON_SECRET;
    const req = new NextRequest(
      'http://localhost/api/exports/enterprise/job-1',
      {
        method: 'POST',
        headers: { authorization: 'Bearer test-secret' },
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ jobId: 'job-1' }),
    });
    expect(res.status).toBe(500);
  });

  it('returns 401 when token does not match secret', async () => {
    const req = new NextRequest(
      'http://localhost/api/exports/enterprise/job-1',
      {
        method: 'POST',
        headers: { authorization: 'Bearer wrong-secret' },
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ jobId: 'job-1' }),
    });
    expect(res.status).toBe(401);
  });

  it('returns success when token matches', async () => {
    const req = new NextRequest(
      'http://localhost/api/exports/enterprise/job-1',
      {
        method: 'POST',
        headers: { authorization: 'Bearer test-secret' },
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ jobId: 'job-1' }),
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('returns 500 when processing fails', async () => {
    const {
      processEnterpriseExportJob,
    } = require('@/lib/export/enterprise-export');
    processEnterpriseExportJob.mockResolvedValueOnce({
      ok: false,
      error: 'Processing failed',
    });

    const req = new NextRequest(
      'http://localhost/api/exports/enterprise/job-1',
      {
        method: 'POST',
        headers: { authorization: 'Bearer test-secret' },
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ jobId: 'job-1' }),
    });
    expect(res.status).toBe(500);
  });

  it('returns 401 when no auth header', async () => {
    const req = new NextRequest(
      'http://localhost/api/exports/enterprise/job-1',
      {
        method: 'POST',
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ jobId: 'job-1' }),
    });
    expect(res.status).toBe(401);
  });
});

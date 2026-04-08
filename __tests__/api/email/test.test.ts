/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/email/test/route.ts
 * Targets uncovered branches in POST handler: CSRF, auth, rate limit,
 * missing API key, missing recipient, send error, payload merging
 */

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const mockValidateCsrf = jest.fn(() => null);
jest.mock('@/lib/security/csrf', () => ({
  validateCsrfOrigin: (...a: any[]) => mockValidateCsrf(...a),
}));

const mockRequireFounder = jest.fn();
jest.mock('@/app/app/admin/access', () => ({
  requireFounderAccess: (...a: any[]) => mockRequireFounder(...a),
}));

const mockRateLimitApi = jest.fn();
const mockCreateRLHeaders = jest.fn(() => ({}));
jest.mock('@/lib/security/rate-limiter', () => ({
  rateLimitApi: (...a: any[]) => mockRateLimitApi(...a),
  createRateLimitHeaders: (...a: any[]) => mockCreateRLHeaders(...a),
}));

const mockSendEmail = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: (...a: any[]) => mockSendEmail(...a) },
  })),
}));

jest.mock('@/lib/admin/audit', () => ({
  logAdminAction: jest.fn(async () => {}),
}));

import { POST } from '@/app/api/email/test/route';

function makeReq(body?: any, queryParams: string = '') {
  const url = `http://localhost/api/email/test${queryParams}`;
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : '{}',
  });
}

describe('POST /api/email/test', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 'test-key',
      RESEND_FROM_EMAIL: 'test@formaos.com',
    };
    mockRequireFounder.mockResolvedValue({ user: { id: 'founder1' } });
    mockRateLimitApi.mockResolvedValue({ success: true });
    mockSendEmail.mockResolvedValue({ data: { id: 'msg-1' }, error: null });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns CSRF error', async () => {
    const { NextResponse } = require('next/server');
    mockValidateCsrf.mockReturnValueOnce(
      NextResponse.json({ error: 'CSRF' }, { status: 403 }),
    );
    const res = await POST(makeReq());
    expect(res.status).toBe(403);
  });

  it('returns 401 when not founder', async () => {
    mockRequireFounder.mockRejectedValue(new Error('Unauthorized'));
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns 403 for Forbidden', async () => {
    mockRequireFounder.mockRejectedValue(new Error('Forbidden'));
    const res = await POST(makeReq());
    expect(res.status).toBe(403);
  });

  it('returns 429 on rate limit', async () => {
    mockRateLimitApi.mockResolvedValue({ success: false });
    const res = await POST(makeReq());
    expect(res.status).toBe(429);
  });

  it('returns 500 when RESEND_API_KEY missing', async () => {
    delete process.env.RESEND_API_KEY;
    const res = await POST(makeReq({ to: 'test@test.com' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('RESEND_API_KEY');
  });

  it('returns 400 when to is missing', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('sends email successfully', async () => {
    const res = await POST(
      makeReq({ to: 'user@test.com', subject: 'Hello', message: 'World' }),
    );
    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('returns 500 on send error', async () => {
    mockSendEmail.mockResolvedValue({
      data: null,
      error: { message: 'Send failed' },
    });
    const res = await POST(makeReq({ to: 'user@test.com' }));
    expect(res.status).toBe(500);
  });

  it('merges query params with body', async () => {
    const res = await POST(
      makeReq({ subject: 'Body Subject' }, '?to=query@test.com'),
    );
    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('handles CTA in email', async () => {
    const res = await POST(
      makeReq({
        to: 'user@test.com',
        ctaText: 'Click me',
        ctaHref: 'https://formaos.com',
      }),
    );
    expect(res.status).toBe(200);
  });

  it('handles body parse failure gracefully', async () => {
    const req = new Request(
      'http://localhost/api/email/test?to=fallback@test.com',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('handles non-Error thrown from auth', async () => {
    mockRequireFounder.mockRejectedValue('string error');
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
  });
});

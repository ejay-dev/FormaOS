/** @jest-environment node */
jest.mock('server-only', () => ({}));

// Mock supabase/env
jest.mock('@/lib/supabase/env', () => ({
  getSupabaseUrl: jest.fn(() => 'https://test.supabase.co'),
  getSupabaseServiceRoleKey: jest.fn(() => 'test-service-role-key'),
}));

// Mock @supabase/supabase-js
function createSupabaseClient() {
  const builder: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'limit',
    'single',
    'maybeSingle',
    'order',
  ].forEach((m) => {
    builder[m] = jest.fn(() => builder);
  });
  builder.then = (resolve: any) =>
    resolve({ data: [{ id: '1', name: 'Test Org' }], error: null });

  return {
    from: jest.fn(() => builder),
    auth: {
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
    },
  };
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => createSupabaseClient()),
}));

// Mock redis health
jest.mock('@/lib/redis/health', () => ({
  checkRedisHealth: jest.fn().mockResolvedValue({ ok: true }),
}));

// Mock admin profile directory
jest.mock('@/lib/users/admin-profile-directory', () => ({
  getAdminProfileDirectoryEntries: jest.fn().mockResolvedValue([]),
}));

import { GET } from '@/app/api/health/detailed/route';

beforeEach(() => {
  jest.clearAllMocks();
  process.env.HEALTH_DETAILED_PROTECT = '1';
  process.env.HEALTH_DETAILED_FOUNDER_TOKEN = 'test-token-123';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
});

function makeRequest(headers?: Record<string, string>) {
  return new Request('http://localhost:3000/api/health/detailed', {
    headers: new Headers(headers ?? {}),
  });
}

describe('GET /api/health/detailed', () => {
  it('returns 401 when no token provided', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 for wrong token', async () => {
    const response = await GET(
      makeRequest({ 'x-founder-token': 'wrong-token' }),
    );
    expect(response.status).toBe(401);
  });

  it('returns health data with valid token', async () => {
    const response = await GET(
      makeRequest({ 'x-founder-token': 'test-token-123' }),
    );
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('checks');
    expect(body).toHaveProperty('summary');
    expect(Array.isArray(body.checks)).toBe(true);
    expect(body.summary).toHaveProperty('total');
  });

  it('accepts Bearer token in Authorization header', async () => {
    const response = await GET(
      makeRequest({ authorization: 'Bearer test-token-123' }),
    );
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('checks');
  });

  it('returns 500 when HEALTH_DETAILED_FOUNDER_TOKEN not set', async () => {
    delete process.env.HEALTH_DETAILED_FOUNDER_TOKEN;
    delete process.env.FOUNDER_API_TOKEN;
    const response = await GET(makeRequest({ 'x-founder-token': 'anything' }));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.code).toBe('HEALTH_DETAILED_TOKEN_CONFIG_ERROR');
  });

  it('bypasses auth when protection disabled', async () => {
    process.env.HEALTH_DETAILED_PROTECT = '0';
    const response = await GET(makeRequest());
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('checks');
  });

  it('returns checks array with expected check names', async () => {
    const response = await GET(
      makeRequest({ 'x-founder-token': 'test-token-123' }),
    );
    const body = await response.json();
    const checkNames = body.checks.map((c: any) => c.name);
    expect(checkNames).toContain('database_connection');
    expect(checkNames).toContain('authentication_service');
    expect(checkNames).toContain('api_endpoints');
    expect(checkNames).toContain('environment_config');
    expect(checkNames).toContain('redis_cache');
  });

  it('includes system info when env var set', async () => {
    process.env.HEALTH_DETAILED_INCLUDE_SYSTEM = '1';
    const response = await GET(
      makeRequest({ 'x-founder-token': 'test-token-123' }),
    );
    const body = await response.json();
    expect(body).toHaveProperty('system');
    expect(body.system).toHaveProperty('memory');
    delete process.env.HEALTH_DETAILED_INCLUDE_SYSTEM;
  });

  it('returns error status when DB fails', async () => {
    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValueOnce({
      from: jest.fn(() => {
        const b: Record<string, any> = {};
        ['select', 'eq', 'limit'].forEach((m) => {
          b[m] = jest.fn(() => b);
        });
        b.then = (resolve: any) =>
          resolve({ data: null, error: { message: 'DB down' } });
        return b;
      }),
      auth: {
        getSession: jest
          .fn()
          .mockResolvedValue({ data: { session: null }, error: null }),
      },
    });

    const response = await GET(
      makeRequest({ 'x-founder-token': 'test-token-123' }),
    );
    const body = await response.json();
    const dbCheck = body.checks.find(
      (c: any) => c.name === 'database_connection',
    );
    expect(dbCheck?.status).toBe('error');
  });

  it('reports missing env vars', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const response = await GET(
      makeRequest({ 'x-founder-token': 'test-token-123' }),
    );
    const body = await response.json();
    const envCheck = body.checks.find(
      (c: any) => c.name === 'environment_config',
    );
    expect(envCheck?.status).toBe('error');
    // Restore
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  });
});

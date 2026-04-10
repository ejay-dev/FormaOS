/**
 * @jest-environment node
 */

jest.mock('server-only', () => ({}));

// ── Supabase mocks ──
function createBuilder(result = { data: null, error: null } as any) {
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

jest.mock('@/lib/supabase/server', () => {
  const c: Record<string, any> = {
    from: jest.fn(() => createBuilder()),
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
  };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});

jest.mock('@/lib/supabase/admin', () => {
  const c: Record<string, any> = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});

function getServerClient() {
  return require('@/lib/supabase/server').__client;
}
function _getAdminClient() {
  return require('@/lib/supabase/admin').__client;
}

jest.mock('@/lib/ratelimit', () => ({
  getClientIp: jest.fn(() => '1.2.3.4'),
}));

jest.mock('@/lib/api-keys/scopes', () => ({
  normalizeApiKeyScopes: jest.fn((s: any[]) => s),
}));

jest.mock('@/lib/api-keys/manager', () => ({
  applyRateLimitHeaders: jest.fn(),
  getSessionRateLimit: jest
    .fn()
    .mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    }),
  logApiKeyUsage: jest.fn(),
  validateApiKey: jest
    .fn()
    .mockResolvedValue({ ok: false, error: 'invalid', status: 401 }),
}));

import {
  authenticateV1Request,
  parsePagination,
  encodeCursor,
  decodeCursor,
  createEnvelope,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import type { V1AuthContext } from '@/lib/api-keys/middleware';
const { validateApiKey } = require('@/lib/api-keys/manager');
const { getSessionRateLimit } = require('@/lib/api-keys/manager');

describe('api-keys/middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getServerClient().auth.getUser.mockResolvedValue({ data: { user: null } });
    getServerClient().from.mockImplementation(() => createBuilder());
  });

  // ── Pure helpers ──
  describe('encodeCursor', () => {
    it('encodes non-negative offset to base64url', () => {
      const encoded = encodeCursor(25);
      expect(typeof encoded).toBe('string');
      expect(decodeCursor(encoded)).toBe(25);
    });

    it('returns null for negative offset', () => {
      expect(encodeCursor(-1)).toBeNull();
    });

    it('returns null for NaN', () => {
      expect(encodeCursor(NaN)).toBeNull();
    });

    it('encodes 0', () => {
      const encoded = encodeCursor(0);
      expect(decodeCursor(encoded)).toBe(0);
    });
  });

  describe('decodeCursor', () => {
    it('returns 0 for null', () => {
      expect(decodeCursor(null)).toBe(0);
    });

    it('returns 0 for invalid base64', () => {
      expect(decodeCursor('!invalid!')).toBe(0);
    });

    it('roundtrips with encodeCursor', () => {
      expect(decodeCursor(encodeCursor(42))).toBe(42);
    });
  });

  describe('parsePagination', () => {
    it('returns default limit and offset 0', () => {
      const request = new Request('http://localhost/api/v1/items');
      const result = parsePagination(request);
      expect(result.limit).toBe(25);
      expect(result.offset).toBe(0);
    });

    it('respects limit query param', () => {
      const request = new Request('http://localhost/api/v1/items?limit=10');
      const result = parsePagination(request);
      expect(result.limit).toBe(10);
    });

    it('clamps limit to maxLimit', () => {
      const request = new Request('http://localhost/api/v1/items?limit=500');
      const result = parsePagination(request, { maxLimit: 50 });
      expect(result.limit).toBe(50);
    });

    it('clamps limit to at least 1', () => {
      const request = new Request('http://localhost/api/v1/items?limit=0');
      const result = parsePagination(request);
      expect(result.limit).toBe(1);
    });

    it('decodes cursor param', () => {
      const cursor = encodeCursor(100)!;
      const request = new Request(
        `http://localhost/api/v1/items?cursor=${cursor}`,
      );
      const result = parsePagination(request);
      expect(result.offset).toBe(100);
    });
  });

  describe('createEnvelope', () => {
    it('wraps data with default meta', () => {
      const env = createEnvelope([1, 2, 3]);
      expect(env.data).toEqual([1, 2, 3]);
      expect(env.meta.total).toBe(3);
      expect(env.meta.hasMore).toBe(false);
      expect(env.meta.cursor).toBeNull();
    });

    it('supports custom meta', () => {
      const env = createEnvelope({ id: 1 }, { total: 99, hasMore: true });
      expect(env.meta.total).toBe(99);
      expect(env.meta.hasMore).toBe(true);
    });

    it('defaults total to 1 for non-array data', () => {
      const env = createEnvelope('hello');
      expect(env.meta.total).toBe(1);
    });
  });

  describe('jsonWithContext', () => {
    it('sets rate limit and auth headers', () => {
      const context = {
        accessType: 'api_key',
        rateLimit: { limit: 100, remaining: 50, resetAt: 1700000000 },
      } as unknown as V1AuthContext;
      const response = jsonWithContext(context, { ok: true });
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-FormaOS-Auth')).toBe('api_key');
    });
  });

  describe('logV1Access', () => {
    it('does nothing when no apiKeyId', async () => {
      const context = { apiKeyId: null } as unknown as V1AuthContext;
      await logV1Access(context, 200);
      const { logApiKeyUsage } = require('@/lib/api-keys/manager');
      expect(logApiKeyUsage).not.toHaveBeenCalled();
    });
  });

  // ── authenticateV1Request ──
  describe('authenticateV1Request', () => {
    it('returns 401 when no Bearer token and no session', async () => {
      const request = new Request('http://localhost/api/v1/test');
      const result = await authenticateV1Request(request);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.response.status).toBe(401);
    });

    it('returns 401 for invalid fos_ key', async () => {
      validateApiKey.mockResolvedValueOnce({
        ok: false,
        error: 'Invalid API key',
        status: 401,
      });
      const request = new Request('http://localhost/api/v1/test', {
        headers: { Authorization: 'Bearer fos_invalid' },
      });
      const result = await authenticateV1Request(request);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.response.status).toBe(401);
    });

    it('returns ok context for valid fos_ key', async () => {
      validateApiKey.mockResolvedValueOnce({
        ok: true,
        apiKey: {
          id: 'key-1',
          org_id: 'org-1',
          scopes: ['controls:read'],
          rate_limit: 100,
        },
        remaining: 99,
        resetAt: Date.now() + 60000,
      });
      const request = new Request('http://localhost/api/v1/test', {
        headers: { Authorization: 'Bearer fos_validkey' },
      });
      const result = await authenticateV1Request(request);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.context.accessType).toBe('api_key');
        expect(result.context.orgId).toBe('org-1');
      }
    });

    it('returns 401 when allowSessionFallback is false and no fos_ token', async () => {
      const request = new Request('http://localhost/api/v1/test', {
        headers: { Authorization: 'Bearer some-session-token' },
      });
      const result = await authenticateV1Request(request, {
        allowSessionFallback: false,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.response.status).toBe(401);
    });

    it('returns session context for valid session user', async () => {
      getServerClient().auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      });
      getServerClient().from.mockImplementation(() =>
        createBuilder({
          data: { organization_id: 'org-1', role: 'owner' },
          error: null,
        }),
      );
      const request = new Request('http://localhost/api/v1/test', {
        headers: { Authorization: 'Bearer session-token' },
      });
      const result = await authenticateV1Request(request);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.context.accessType).toBe('session');
        expect(result.context.orgId).toBe('org-1');
      }
    });

    it('returns 403 when user has no org', async () => {
      getServerClient().auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      });
      getServerClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );
      const request = new Request('http://localhost/api/v1/test', {
        headers: { Authorization: 'Bearer session-token' },
      });
      const result = await authenticateV1Request(request);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.response.status).toBe(403);
    });

    it('returns 403 when requireAdmin but user is member', async () => {
      getServerClient().auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      });
      getServerClient().from.mockImplementation(() =>
        createBuilder({
          data: { organization_id: 'org-1', role: 'member' },
          error: null,
        }),
      );
      const request = new Request('http://localhost/api/v1/test', {
        headers: { Authorization: 'Bearer session-token' },
      });
      const result = await authenticateV1Request(request, {
        requireAdmin: true,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.response.status).toBe(403);
    });

    it('returns 429 when session rate limit exceeded', async () => {
      getServerClient().auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
      });
      getServerClient().from.mockImplementation(() =>
        createBuilder({
          data: { organization_id: 'org-1', role: 'owner' },
          error: null,
        }),
      );
      getSessionRateLimit.mockResolvedValueOnce({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 60000,
      });
      const request = new Request('http://localhost/api/v1/test', {
        headers: { Authorization: 'Bearer session-token' },
      });
      const result = await authenticateV1Request(request);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.response.status).toBe(429);
    });
  });
});

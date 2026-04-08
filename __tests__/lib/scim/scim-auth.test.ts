/**
 * Tests for lib/scim/scim-auth.ts
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: jest
    .fn()
    .mockResolvedValue({ success: true, remaining: 100 }),
  createRateLimitHeaders: jest
    .fn()
    .mockReturnValue({ 'X-RateLimit-Remaining': '100' }),
  getClientIdentifier: jest.fn().mockResolvedValue('test-client'),
}));
jest.mock('@/lib/identity/audit', () => ({
  logIdentityEvent: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/scim/scim-schemas', () => ({
  SCIM_SCHEMA_ERROR: 'urn:ietf:params:scim:api:messages:2.0:Error',
}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'limit',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
const { checkRateLimit } = require('@/lib/security/rate-limiter');

import {
  scimError,
  authenticateScimRequest,
  generateScimToken,
} from '@/lib/scim/scim-auth';

beforeEach(() => jest.clearAllMocks());

describe('scimError', () => {
  it('returns error body without scimType', () => {
    const err = scimError(400, 'bad request');
    expect(err.status).toBe('400');
    expect(err.detail).toBe('bad request');
    expect(err.scimType).toBeUndefined();
  });

  it('returns error body with scimType', () => {
    const err = scimError(409, 'uniqueness', 'uniqueness');
    expect(err.scimType).toBe('uniqueness');
  });
});

describe('authenticateScimRequest', () => {
  function mockRequest(authHeader?: string) {
    const hdr = authHeader ?? null;
    return {
      headers: { get: (k: string) => (k === 'authorization' ? hdr : null) },
    } as any;
  }

  it('returns 401 when no bearer token', async () => {
    const result = await authenticateScimRequest(mockRequest(), 'org-1');
    expect(result.ok).toBe(false);
    expect((result as any).status).toBe(401);
  });

  it('returns 401 when authorization header is not Bearer', async () => {
    const result = await authenticateScimRequest(
      mockRequest('Basic abc'),
      'org-1',
    );
    expect(result.ok).toBe(false);
  });

  it('returns 401 when no tokens found', async () => {
    const builder = createBuilder({ data: null, error: { message: 'nope' } });
    createSupabaseAdminClient.mockReturnValue({ from: () => builder });
    const result = await authenticateScimRequest(
      mockRequest('Bearer sometoken'),
      'org-1',
    );
    expect(result.ok).toBe(false);
    expect((result as any).status).toBe(401);
  });

  it('returns 401 when empty tokens array', async () => {
    const builder = createBuilder({ data: [], error: null });
    createSupabaseAdminClient.mockReturnValue({ from: () => builder });
    const result = await authenticateScimRequest(
      mockRequest('Bearer sometoken'),
      'org-1',
    );
    expect(result.ok).toBe(false);
  });

  it('returns 401 when token hash does not match', async () => {
    const builder = createBuilder({
      data: [{ id: 't1', token_hash: 'wronghash', active: true }],
      error: null,
    });
    createSupabaseAdminClient.mockReturnValue({ from: () => builder });
    const result = await authenticateScimRequest(
      mockRequest('Bearer sometoken'),
      'org-1',
    );
    expect(result.ok).toBe(false);
    expect((result as any).status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    // Need to create a token that matches the hash
    const crypto = require('crypto');
    const rawToken = 'test-token-123';
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const updateBuilder = createBuilder({ data: null, error: null });
    const selectBuilder = createBuilder({
      data: [
        {
          id: 't1',
          token_hash: hash,
          active: true,
          max_requests_per_minute: 120,
          label: 'test',
        },
      ],
      error: null,
    });
    const client = {
      from: jest.fn((table: string) => {
        if (table === 'scim_tokens') {
          // First call is select, second is update
          if (client._callCount === 0) {
            client._callCount++;
            return selectBuilder;
          }
          return updateBuilder;
        }
        return createBuilder();
      }),
      _callCount: 0,
    };
    createSupabaseAdminClient.mockReturnValue(client);
    checkRateLimit.mockResolvedValue({ success: false, remaining: 0 });

    const result = await authenticateScimRequest(
      mockRequest(`Bearer ${rawToken}`),
      'org-1',
    );
    expect(result.ok).toBe(false);
    expect((result as any).status).toBe(429);
  });

  it('returns ok when token valid and not rate limited', async () => {
    const crypto = require('crypto');
    const rawToken = 'valid-token-abc';
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const updateBuilder = createBuilder({ data: null, error: null });
    const selectBuilder = createBuilder({
      data: [
        {
          id: 't2',
          token_hash: hash,
          active: true,
          max_requests_per_minute: null,
          label: 'MyToken',
          token_prefix: 'valid-to',
        },
      ],
      error: null,
    });
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        if (callCount === 0) {
          callCount++;
          return selectBuilder;
        }
        return updateBuilder;
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    checkRateLimit.mockResolvedValue({ success: true, remaining: 99 });

    const result = await authenticateScimRequest(
      mockRequest(`Bearer ${rawToken}`),
      'org-1',
    );
    expect(result.ok).toBe(true);
    expect((result as any).context.orgId).toBe('org-1');
    expect((result as any).context.tokenId).toBe('t2');
  });
});

describe('generateScimToken', () => {
  it('generates a token and logs identity event', async () => {
    const builder = createBuilder({ data: { id: 'tok-1' }, error: null });
    createSupabaseAdminClient.mockReturnValue({ from: () => builder });

    const result = await generateScimToken({
      orgId: 'org-1',
      createdBy: 'user-1',
      label: 'CI Token',
    });
    expect(result.tokenId).toBe('tok-1');
    expect(result.token).toBeDefined();
    expect(result.tokenPrefix).toHaveLength(8);
  });

  it('throws on insert error', async () => {
    const builder = createBuilder({
      data: null,
      error: { message: 'insert failed' },
    });
    createSupabaseAdminClient.mockReturnValue({ from: () => builder });

    await expect(generateScimToken({ orgId: 'org-1' })).rejects.toThrow(
      'insert failed',
    );
  });
});

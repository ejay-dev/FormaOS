/** @jest-environment node */
jest.mock('server-only', () => ({}));

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
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});

jest.mock('@/lib/redis/client', () => ({
  getRedisClient: jest.fn(() => null),
  getRedisConfig: jest.fn(() => ({ restUrl: '', token: '' })),
}));

jest.mock('@/lib/ratelimit', () => ({
  checkApiRateLimit: jest
    .fn()
    .mockResolvedValue({
      success: true,
      remaining: 100,
      resetAt: Date.now() + 60000,
    }),
  addRateLimitHeaders: jest.fn((res) => res),
}));

jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/api-keys/scopes', () => ({
  hasRequiredScopes: jest.fn(() => true),
  normalizeApiKeyScopes: jest.fn((s: string[]) => s),
}));

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

import {
  generateRawApiKey,
  hashApiKey,
  createApiKey,
  listApiKeys,
  updateApiKey,
  revokeApiKey,
  rotateApiKey,
  validateApiKey,
  logApiKeyUsage,
  getSessionRateLimit,
  applyRateLimitHeaders,
} from '@/lib/api-keys/manager';

beforeEach(() => jest.clearAllMocks());

describe('generateRawApiKey', () => {
  it('returns key with fos_ prefix', () => {
    const { key, prefix } = generateRawApiKey();
    expect(key).toContain('fos_');
    expect(prefix).toContain('fos_');
    expect(key).toContain('.');
  });

  it('generates unique keys', () => {
    const a = generateRawApiKey();
    const b = generateRawApiKey();
    expect(a.key).not.toBe(b.key);
  });
});

describe('hashApiKey', () => {
  it('returns a hex string', () => {
    const hash = hashApiKey('fos_test.secretpart');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic', () => {
    const h1 = hashApiKey('fos_a.b');
    const h2 = hashApiKey('fos_a.b');
    expect(h1).toBe(h2);
  });
});

describe('createApiKey', () => {
  it('creates and returns API key with plaintext', async () => {
    const row = {
      id: 'key-1',
      org_id: 'org-1',
      name: 'Test Key',
      key_hash: 'h',
      prefix: 'fos_abc',
      scopes: ['controls:read'],
      rate_limit: 120,
      last_used: null,
      created_by: 'user-1',
      created_at: '2024-01-01',
      revoked_at: null,
    };
    getClient().from.mockImplementation(() =>
      createBuilder({ data: row, error: null }),
    );

    const { apiKey, plaintextKey } = await createApiKey({
      orgId: 'org-1',
      name: 'Test Key',
      scopes: ['controls:read'],
      createdBy: 'user-1',
    });
    expect(apiKey.id).toBe('key-1');
    expect(plaintextKey).toContain('fos_');
  });

  it('throws on insert error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'conflict' } }),
    );
    await expect(
      createApiKey({
        orgId: 'org-1',
        name: 'Key',
        scopes: [],
        createdBy: 'u1',
      }),
    ).rejects.toThrow('Failed to create API key');
  });
});

describe('listApiKeys', () => {
  it('returns mapped keys', async () => {
    const rows = [
      {
        id: 'k1',
        org_id: 'org-1',
        name: 'Key 1',
        scopes: [],
        rate_limit: 120,
        created_at: '2024-01-01',
      },
      {
        id: 'k2',
        org_id: 'org-1',
        name: 'Key 2',
        scopes: ['controls:read'],
        rate_limit: 60,
        created_at: '2024-01-02',
      },
    ];
    getClient().from.mockImplementation(() =>
      createBuilder({ data: rows, error: null }),
    );
    const keys = await listApiKeys('org-1');
    expect(keys.length).toBe(2);
    expect(keys[0].id).toBe('k1');
  });

  it('throws on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    await expect(listApiKeys('org-1')).rejects.toThrow(
      'Failed to list API keys',
    );
  });
});

describe('updateApiKey', () => {
  it('updates name and scopes', async () => {
    const row = {
      id: 'k1',
      org_id: 'org-1',
      name: 'Updated',
      scopes: ['all'],
      rate_limit: 120,
      created_at: '2024-01-01',
    };
    getClient().from.mockImplementation(() =>
      createBuilder({ data: row, error: null }),
    );
    const result = await updateApiKey('k1', 'org-1', {
      name: 'Updated',
      scopes: ['all'],
    });
    expect(result.name).toBe('Updated');
  });

  it('throws on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'nope' } }),
    );
    await expect(updateApiKey('k1', 'org-1', { name: 'X' })).rejects.toThrow();
  });
});

describe('revokeApiKey', () => {
  it('revokes key', async () => {
    getClient().from.mockImplementation(() => createBuilder({ error: null }));
    await expect(
      revokeApiKey({ keyId: 'k1', orgId: 'org-1', revokedBy: 'u1' }),
    ).resolves.toBeUndefined();
  });

  it('throws on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ error: { message: 'cannot revoke' } }),
    );
    await expect(revokeApiKey({ keyId: 'k1', orgId: 'org-1' })).rejects.toThrow(
      'Failed to revoke API key',
    );
  });
});

describe('rotateApiKey', () => {
  it('rotates key and returns new plaintext', async () => {
    const row = {
      id: 'k1',
      org_id: 'org-1',
      name: 'Key',
      key_hash: 'new-hash',
      prefix: 'fos_new',
      scopes: ['controls:read'],
      rate_limit: 120,
      created_at: '2024-01-01',
      revoked_at: null,
    };
    getClient().from.mockImplementation(() =>
      createBuilder({ data: row, error: null }),
    );
    const { apiKey, plaintextKey } = await rotateApiKey({
      keyId: 'k1',
      orgId: 'org-1',
      rotatedBy: 'u1',
    });
    expect(apiKey.id).toBe('k1');
    expect(plaintextKey).toContain('fos_');
  });

  it('throws on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    await expect(
      rotateApiKey({ keyId: 'k1', orgId: 'org-1', rotatedBy: 'u1' }),
    ).rejects.toThrow('Failed to rotate API key');
  });
});

describe('validateApiKey', () => {
  it('rejects key without fos_ prefix', async () => {
    const result = await validateApiKey('bad-key');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });

  it('validates good key', async () => {
    const row = {
      id: 'k1',
      org_id: 'org-1',
      name: 'Key',
      scopes: ['controls:read'],
      rate_limit: 120,
      created_at: '2024-01-01',
      revoked_at: null,
    };
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return createBuilder({ data: row, error: null });
      return createBuilder({ data: null, error: null });
    });
    const result = await validateApiKey('fos_abc12345.secretpart');
    expect(result.ok).toBe(true);
    expect(result.apiKey).toBeDefined();
  });

  it('rejects when key not found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await validateApiKey('fos_abc12345.secretpart');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });
});

describe('logApiKeyUsage', () => {
  it('logs usage and returns log entry', async () => {
    const row = {
      id: 'log-1',
      api_key_id: 'k1',
      method: 'GET',
      path: '/api/v1/controls',
    };
    getClient().from.mockImplementation(() =>
      createBuilder({ data: row, error: null }),
    );
    const result = await logApiKeyUsage({
      apiKeyId: 'k1',
      orgId: 'org-1',
      method: 'GET',
      path: '/api/v1/controls',
      statusCode: 200,
    });
    expect(result).toHaveProperty('id', 'log-1');
  });

  it('returns null on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    const result = await logApiKeyUsage({
      apiKeyId: 'k1',
      orgId: 'org-1',
      method: 'GET',
      path: '/',
      statusCode: 200,
    });
    expect(result).toBeNull();
  });
});

describe('getSessionRateLimit', () => {
  it('delegates to checkApiRateLimit', async () => {
    const result = await getSessionRateLimit('test-id');
    expect(result).toHaveProperty('success', true);
  });
});

describe('applyRateLimitHeaders', () => {
  it('returns response with rate limit headers', () => {
    const response = new Response('ok');
    const result = applyRateLimitHeaders(response, {
      limit: 100,
      remaining: 99,
      resetAt: Date.now(),
    });
    expect(result).toBeTruthy();
  });
});

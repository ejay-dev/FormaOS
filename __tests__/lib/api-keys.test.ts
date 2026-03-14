jest.mock('@/lib/redis/client', () => ({
  getRedisClient: jest.fn(() => null),
  getRedisConfig: jest.fn(() => ({ restUrl: null, token: null })),
}));

jest.mock('@/lib/ratelimit', () => ({
  addRateLimitHeaders: jest.fn((response: Response) => response),
  checkApiRateLimit: jest.fn(async () => ({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60_000,
  })),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn(),
}));

import {
  generateRawApiKey,
  hashApiKey,
} from '@/lib/api-keys/manager';
import {
  API_KEY_SCOPES,
  hasRequiredScopes,
  normalizeApiKeyScopes,
} from '@/lib/api-keys/scopes';
import { generateOpenApiSpec } from '@/lib/api-keys/openapi';

describe('api keys', () => {
  it('generates a prefixed plaintext key', () => {
    const { key, prefix } = generateRawApiKey();

    expect(prefix.startsWith('fos_')).toBe(true);
    expect(key.startsWith(`${prefix}.`)).toBe(true);
    expect(key.split('.')).toHaveLength(2);
  });

  it('hashes keys deterministically', () => {
    const key = 'fos_deadbeef.secret';

    expect(hashApiKey(key)).toBe(hashApiKey(key));
    expect(hashApiKey(key)).not.toBe(hashApiKey(`${key}-other`));
  });

  it('normalizes scopes and removes unsupported values', () => {
    expect(
      normalizeApiKeyScopes([
        'tasks:read',
        'tasks:read',
        'reports:write',
        'not-real',
      ]),
    ).toEqual(['reports:write', 'tasks:read']);
  });

  it('checks required scopes against granted scopes', () => {
    expect(
      hasRequiredScopes(['tasks:read', 'reports:read'], ['tasks:read']),
    ).toBe(true);
    expect(
      hasRequiredScopes(['tasks:read'], ['tasks:read', 'reports:read']),
    ).toBe(false);
  });

  it('generates an OpenAPI document with bearer auth and route metadata', () => {
    const spec = generateOpenApiSpec('https://app.example.com/');

    expect(spec.openapi).toBe('3.1.0');
    expect(spec.servers).toEqual([{ url: 'https://app.example.com' }]);
    expect(spec.components.schemas.ApiKeyScope.enum).toEqual(API_KEY_SCOPES);
    expect(spec.paths['/api/v1/integrations/{integrationId}'].post).toMatchObject({
      operationId: 'connectOrTestIntegration',
      security: [{ bearerAuth: [] }],
    });
  });
});

/**
 * Extended branch coverage for lib/integrations/webhook-relay.ts
 * Covers: verifyRelaySignature, isValidWebhookUrl, validateRelayEvents,
 * CRUD operations, relayEvent
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/audit-trail', () => ({ logActivity: jest.fn() }));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'in',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'gte',
    'lte',
    'is',
    'contains',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));

const { createSupabaseServerClient } = require('@/lib/supabase/server');

import {
  verifyRelaySignature,
  isValidWebhookUrl,
  validateRelayEvents,
  createRelayWebhook,
  listRelayWebhooks,
  getRelayWebhook,
  deleteRelayWebhook,
  relayEvent,
} from '@/lib/integrations/webhook-relay';

beforeEach(() => jest.clearAllMocks());

describe('verifyRelaySignature', () => {
  it('returns true for valid signature', () => {
    const crypto = require('crypto');
    const secret = 'test-secret';
    const payload = '{"test":true}';
    const sig = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    expect(verifyRelaySignature(payload, sig, secret)).toBe(true);
  });

  it('returns false for invalid signature', () => {
    expect(
      verifyRelaySignature(
        'payload',
        'bad-sig-that-is-not-valid-hex',
        'secret',
      ),
    ).toBe(false);
  });

  it('returns false for mismatched length signatures', () => {
    expect(verifyRelaySignature('payload', 'abc', 'secret')).toBe(false);
  });
});

describe('validateRelayEvents', () => {
  it('returns empty for valid events', () => {
    expect(validateRelayEvents(['member.added', 'task.created'])).toEqual([]);
  });

  it('returns invalid events', () => {
    expect(validateRelayEvents(['member.added', 'invalid.event'])).toEqual([
      'invalid.event',
    ]);
  });

  it('returns all invalid for unknown events', () => {
    expect(validateRelayEvents(['foo', 'bar'])).toEqual(['foo', 'bar']);
  });
});

describe('isValidWebhookUrl', () => {
  const origEnv = process.env.NODE_ENV;
  afterAll(() => {
    process.env.NODE_ENV = origEnv;
  });

  it('accepts HTTPS URL in dev', async () => {
    process.env.NODE_ENV = 'development';
    expect(await isValidWebhookUrl('https://example.com/webhook')).toBe(true);
  });

  it('accepts localhost in dev', async () => {
    process.env.NODE_ENV = 'development';
    expect(await isValidWebhookUrl('http://localhost:3000/hook')).toBe(true);
  });

  it('accepts 127.0.0.1 in dev', async () => {
    process.env.NODE_ENV = 'development';
    expect(await isValidWebhookUrl('http://127.0.0.1:3000/hook')).toBe(true);
  });

  it('rejects HTTP non-localhost in dev', async () => {
    process.env.NODE_ENV = 'development';
    expect(await isValidWebhookUrl('http://example.com/hook')).toBe(false);
  });

  it('rejects invalid URL', async () => {
    expect(await isValidWebhookUrl('not-a-url')).toBe(false);
  });
});

describe('createRelayWebhook', () => {
  it('creates a webhook and logs activity', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({
          data: {
            id: 'wh1',
            organization_id: 'org1',
            name: 'Test',
            url: 'https://example.com',
            secret: 'abc',
            events: ['member.added'],
            enabled: true,
            retry_count: 3,
            headers: {},
            metadata: { provider: 'custom', description: '', relay: true },
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          error: null,
        }),
      ),
    });
    const result = await createRelayWebhook('org1', {
      name: 'Test',
      url: 'https://example.com',
      events: ['member.added'],
    });
    expect(result.name).toBe('Test');
    expect(result.id).toBe('wh1');
  });

  it('throws on insert error', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      ),
    });
    await expect(
      createRelayWebhook('org1', {
        name: 'Test',
        url: 'https://x.com',
        events: ['member.added'],
      }),
    ).rejects.toBeDefined();
  });

  it('passes provider and retry_count options', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({
          data: {
            id: 'wh2',
            organization_id: 'org1',
            name: 'Zapier Hook',
            url: 'https://hooks.zapier.com/test',
            secret: 'abc',
            events: ['task.completed'],
            enabled: false,
            retry_count: 5,
            headers: { 'X-Custom': 'val' },
            metadata: { provider: 'zapier', description: 'Test', relay: true },
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          error: null,
        }),
      ),
    });
    const result = await createRelayWebhook('org1', {
      name: 'Zapier Hook',
      url: 'https://hooks.zapier.com/test',
      events: ['task.completed'],
      provider: 'zapier',
      enabled: false,
      retry_count: 5,
      headers: { 'X-Custom': 'val' },
      description: 'Test',
    });
    expect(result.provider).toBe('zapier');
  });
});

describe('listRelayWebhooks', () => {
  it('returns webhooks', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({
          data: [
            {
              id: 'wh1',
              organization_id: 'org1',
              name: 'Hook1',
              url: 'https://a.com',
              secret: 'x',
              events: ['member.added'],
              enabled: true,
              retry_count: 3,
              headers: {},
              metadata: { provider: 'zapier', relay: true },
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            },
          ],
          error: null,
        }),
      ),
    });
    const result = await listRelayWebhooks('org1');
    expect(result).toHaveLength(1);
    expect(result[0].provider).toBe('zapier');
  });

  it('returns empty array on error', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      ),
    });
    const result = await listRelayWebhooks('org1');
    expect(result).toEqual([]);
  });

  it('filters by enabled status', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => createBuilder({ data: [], error: null })),
    });
    const result = await listRelayWebhooks('org1', { enabled: true });
    expect(result).toEqual([]);
  });
});

describe('getRelayWebhook', () => {
  it('returns webhook config', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({
          data: {
            id: 'wh1',
            organization_id: 'org1',
            name: 'Hook1',
            url: 'https://a.com',
            secret: 'x',
            events: ['task.created'],
            enabled: true,
            retry_count: 3,
            headers: {},
            metadata: { provider: 'make', relay: true },
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          error: null,
        }),
      ),
    });
    const result = await getRelayWebhook('wh1');
    expect(result?.provider).toBe('make');
  });

  it('returns null on error', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'not found' } }),
      ),
    });
    const result = await getRelayWebhook('wh-missing');
    expect(result).toBeNull();
  });
});

describe('deleteRelayWebhook', () => {
  it('deletes successfully', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    });
    await expect(deleteRelayWebhook('wh1')).resolves.toBeUndefined();
  });

  it('throws on error', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      ),
    });
    await expect(deleteRelayWebhook('wh1')).rejects.toBeDefined();
  });
});

describe('relayEvent', () => {
  it('returns 0/0 when no webhooks', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => createBuilder({ data: [], error: null })),
    });
    const result = await relayEvent('org1', 'member.added', { userId: 'u1' });
    expect(result).toEqual({ delivered: 0, failed: 0 });
  });

  it('returns 0/0 when webhooks is null', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    });
    const result = await relayEvent('org1', 'task.created', {});
    expect(result).toEqual({ delivered: 0, failed: 0 });
  });
});

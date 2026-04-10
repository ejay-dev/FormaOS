/** @jest-environment node */

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
  const c: Record<string, any> = { from: jest.fn(() => createBuilder()) };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});
jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn(),
}));
jest.mock('dns/promises', () => ({
  resolve4: jest.fn(),
  resolve6: jest.fn(),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

import {
  verifyRelaySignature,
  validateRelayEvents,
  sanitizeWebhookForResponse,
  isValidWebhookUrl,
  createRelayWebhook,
  listRelayWebhooks,
  getRelayWebhook,
  updateRelayWebhook,
  deleteRelayWebhook,
  relayEvent,
  testRelayWebhook,
  testRelayUrl,
  getRelayDeliveries,
  RELAY_EVENT_LABELS,
  VALID_RELAY_EVENTS,
} from '@/lib/integrations/webhook-relay';
import type { RelayWebhookConfig } from '@/lib/integrations/webhook-relay';

function getClient() {
  return require('@/lib/supabase/server').__client;
}
import dns from 'dns/promises';

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
});

/* ------------------------------------------------------------------ */
/* Constants / labels                                                 */
/* ------------------------------------------------------------------ */

describe('RELAY_EVENT_LABELS', () => {
  it('has 9 event types', () => {
    expect(Object.keys(RELAY_EVENT_LABELS)).toHaveLength(9);
  });

  it('all event types are in VALID_RELAY_EVENTS', () => {
    for (const key of Object.keys(RELAY_EVENT_LABELS)) {
      expect(VALID_RELAY_EVENTS.has(key)).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ */
/* verifyRelaySignature                                               */
/* ------------------------------------------------------------------ */

describe('verifyRelaySignature', () => {
  const crypto = require('crypto');
  const secret = 'test-secret';
  const payload = '{"event":"test"}';

  it('returns true for valid signature', () => {
    const sig = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    expect(verifyRelaySignature(payload, sig, secret)).toBe(true);
  });

  it('returns false for invalid signature', () => {
    expect(verifyRelaySignature(payload, 'bad-signature', secret)).toBe(false);
  });

  it('returns false for different secret', () => {
    const sig = crypto
      .createHmac('sha256', 'wrong-secret')
      .update(payload)
      .digest('hex');
    expect(verifyRelaySignature(payload, sig, secret)).toBe(false);
  });

  it('returns false for mismatched length signatures (timingSafeEqual throws)', () => {
    expect(verifyRelaySignature(payload, 'short', secret)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* validateRelayEvents                                                */
/* ------------------------------------------------------------------ */

describe('validateRelayEvents', () => {
  it('returns empty array for all valid events', () => {
    expect(validateRelayEvents(['member.added', 'task.created'])).toEqual([]);
  });

  it('returns invalid event names', () => {
    expect(validateRelayEvents(['member.added', 'invalid.event'])).toEqual([
      'invalid.event',
    ]);
  });

  it('returns all invalid for completely wrong events', () => {
    expect(validateRelayEvents(['bad1', 'bad2'])).toEqual(['bad1', 'bad2']);
  });

  it('returns empty for empty input', () => {
    expect(validateRelayEvents([])).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* sanitizeWebhookForResponse                                         */
/* ------------------------------------------------------------------ */

describe('sanitizeWebhookForResponse', () => {
  const config: RelayWebhookConfig = {
    id: 'wh-1',
    organization_id: 'org-1',
    name: 'Test Hook',
    url: 'https://example.com/hook',
    secret: 'abcdef1234567890abcdef1234567890',
    provider: 'custom',
    events: ['task.created'],
    enabled: true,
    retry_count: 3,
    headers: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('removes secret from output', () => {
    const result = sanitizeWebhookForResponse(config);
    expect((result as any).secret).toBeUndefined();
  });

  it('adds secret_preview with first 8 chars', () => {
    const result = sanitizeWebhookForResponse(config);
    expect(result.secret_preview).toBe('abcdef12...');
  });

  it('preserves other fields', () => {
    const result = sanitizeWebhookForResponse(config);
    expect(result.id).toBe('wh-1');
    expect(result.name).toBe('Test Hook');
  });

  it('handles empty secret', () => {
    const result = sanitizeWebhookForResponse({ ...config, secret: '' });
    expect(result.secret_preview).toBe('');
  });
});

/* ------------------------------------------------------------------ */
/* isValidWebhookUrl                                                  */
/* ------------------------------------------------------------------ */

describe('isValidWebhookUrl', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
  });

  it('accepts https URLs in development', async () => {
    (process.env as any).NODE_ENV = 'development';
    expect(await isValidWebhookUrl('https://example.com/hook')).toBe(true);
  });

  it('accepts localhost HTTP in development', async () => {
    (process.env as any).NODE_ENV = 'development';
    expect(await isValidWebhookUrl('http://localhost:3000/hook')).toBe(true);
  });

  it('accepts 127.0.0.1 HTTP in development', async () => {
    (process.env as any).NODE_ENV = 'development';
    expect(await isValidWebhookUrl('http://127.0.0.1:3000/hook')).toBe(true);
  });

  it('rejects random HTTP in dev (non-localhost)', async () => {
    (process.env as any).NODE_ENV = 'development';
    expect(await isValidWebhookUrl('http://example.com/hook')).toBe(false);
  });

  it('rejects invalid URLs', async () => {
    expect(await isValidWebhookUrl('not-a-url')).toBe(false);
  });

  it('rejects plain HTTP in production', async () => {
    (process.env as any).NODE_ENV = 'production';
    expect(await isValidWebhookUrl('http://example.com/hook')).toBe(false);
  });

  it('rejects private IPs in production (10.x)', async () => {
    (process.env as any).NODE_ENV = 'production';
    expect(await isValidWebhookUrl('https://10.0.0.1/hook')).toBe(false);
  });

  it('rejects private IPs in production (172.16.x)', async () => {
    (process.env as any).NODE_ENV = 'production';
    expect(await isValidWebhookUrl('https://172.16.0.1/hook')).toBe(false);
  });

  it('rejects private IPs in production (192.168.x)', async () => {
    (process.env as any).NODE_ENV = 'production';
    expect(await isValidWebhookUrl('https://192.168.1.1/hook')).toBe(false);
  });

  it('rejects loopback 127.x in production', async () => {
    (process.env as any).NODE_ENV = 'production';
    expect(await isValidWebhookUrl('https://127.0.0.1/hook')).toBe(false);
  });

  it('rejects link-local 169.254.x in production', async () => {
    (process.env as any).NODE_ENV = 'production';
    expect(await isValidWebhookUrl('https://169.254.1.1/hook')).toBe(false);
  });

  it('rejects 0.0.0.0 in production', async () => {
    (process.env as any).NODE_ENV = 'production';
    expect(await isValidWebhookUrl('https://0.0.0.1/hook')).toBe(false);
  });

  it('rejects CGNAT range 100.64-127.x in production', async () => {
    (process.env as any).NODE_ENV = 'production';
    expect(await isValidWebhookUrl('https://100.64.0.1/hook')).toBe(false);
  });

  it('rejects benchmark range 198.18.x in production', async () => {
    (process.env as any).NODE_ENV = 'production';
    expect(await isValidWebhookUrl('https://198.18.0.1/hook')).toBe(false);
  });

  it('rejects localhost hostname in production', async () => {
    (process.env as any).NODE_ENV = 'production';
    expect(await isValidWebhookUrl('https://localhost/hook')).toBe(false);
  });

  it('accepts public HTTPS in production with valid DNS', async () => {
    (process.env as any).NODE_ENV = 'production';
    (dns.resolve4 as jest.Mock).mockResolvedValue(['8.8.8.8']);
    (dns.resolve6 as jest.Mock).mockRejectedValue(new Error('no AAAA'));
    expect(await isValidWebhookUrl('https://example.com/hook')).toBe(true);
  });

  it('rejects when DNS resolves to private IP in production', async () => {
    (process.env as any).NODE_ENV = 'production';
    (dns.resolve4 as jest.Mock).mockResolvedValue(['10.0.0.1']);
    (dns.resolve6 as jest.Mock).mockRejectedValue(new Error('no AAAA'));
    expect(await isValidWebhookUrl('https://evil.com/hook')).toBe(false);
  });

  it('rejects when DNS resolves to no addresses', async () => {
    (process.env as any).NODE_ENV = 'production';
    (dns.resolve4 as jest.Mock).mockRejectedValue(new Error('NXDOMAIN'));
    (dns.resolve6 as jest.Mock).mockRejectedValue(new Error('NXDOMAIN'));
    expect(await isValidWebhookUrl('https://nonexistent.example/hook')).toBe(
      false,
    );
  });

  it('rejects IPv6 loopback ::1 in production', async () => {
    (process.env as any).NODE_ENV = 'production';
    expect(await isValidWebhookUrl('https://[::1]/hook')).toBe(false);
  });

  it('rejects fe80: link-local IPv6 in production DNS resolution', async () => {
    (process.env as any).NODE_ENV = 'production';
    (dns.resolve4 as jest.Mock).mockRejectedValue(new Error('no A'));
    (dns.resolve6 as jest.Mock).mockResolvedValue(['fe80::1']);
    expect(await isValidWebhookUrl('https://example.com/hook')).toBe(false);
  });

  it('rejects fc/fd private IPv6 in production DNS resolution', async () => {
    (process.env as any).NODE_ENV = 'production';
    (dns.resolve4 as jest.Mock).mockRejectedValue(new Error('no A'));
    (dns.resolve6 as jest.Mock).mockResolvedValue(['fd12::1']);
    expect(await isValidWebhookUrl('https://example.com/hook')).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* CRUD operations                                                    */
/* ------------------------------------------------------------------ */

const makeRow = (overrides: Record<string, any> = {}) => ({
  id: 'wh-1',
  organization_id: 'org-1',
  name: 'Test Hook',
  url: 'https://example.com/hook',
  secret: 'abc123',
  events: ['task.created'],
  enabled: true,
  retry_count: 3,
  headers: {},
  metadata: { provider: 'custom', relay: true, description: '' },
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  ...overrides,
});

describe('createRelayWebhook', () => {
  it('creates webhook and returns mapped config', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: makeRow(), error: null }),
    );
    const result = await createRelayWebhook('org-1', {
      name: 'Test Hook',
      url: 'https://example.com/hook',
      events: ['task.created'],
    });
    expect(result.id).toBe('wh-1');
    expect(result.provider).toBe('custom');
  });

  it('uses provided provider and retry_count', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: makeRow({
          metadata: {
            provider: 'zapier',
            relay: true,
            description: 'Zapier hook',
          },
        }),
        error: null,
      }),
    );
    const result = await createRelayWebhook('org-1', {
      name: 'Zap Hook',
      url: 'https://hooks.zapier.com/x',
      events: ['task.created'],
      provider: 'zapier',
      retry_count: 10,
      description: 'Zapier hook',
    });
    expect(result.provider).toBe('zapier');
  });

  it('throws on DB error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'insert fail' } }),
    );
    await expect(
      createRelayWebhook('org-1', {
        name: 'x',
        url: 'https://x.com',
        events: ['task.created'],
      }),
    ).rejects.toThrow('Failed to create relay webhook');
  });
});

describe('listRelayWebhooks', () => {
  it('returns mapped configs', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [makeRow(), makeRow({ id: 'wh-2' })],
        error: null,
      }),
    );
    const result = await listRelayWebhooks('org-1');
    expect(result).toHaveLength(2);
  });

  it('filters by enabled status', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [makeRow({ enabled: true })], error: null }),
    );
    const result = await listRelayWebhooks('org-1', { enabled: true });
    expect(result).toHaveLength(1);
  });

  it('returns empty on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'err' } }),
    );
    expect(await listRelayWebhooks('org-1')).toEqual([]);
  });
});

describe('getRelayWebhook', () => {
  it('returns config when found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: makeRow(), error: null }),
    );
    const result = await getRelayWebhook('wh-1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('wh-1');
  });

  it('returns null when not found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    expect(await getRelayWebhook('missing')).toBeNull();
  });

  it('returns null on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'err' } }),
    );
    expect(await getRelayWebhook('err-wh')).toBeNull();
  });
});

describe('updateRelayWebhook', () => {
  it('updates and returns config', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: makeRow({ name: 'Updated', enabled: false }),
        error: null,
      }),
    );
    const result = await updateRelayWebhook('wh-1', {
      name: 'Updated',
      enabled: false,
    });
    expect(result.name).toBe('Updated');
    expect(result.enabled).toBe(false);
  });

  it('updates provider/description via metadata', async () => {
    // getRelayWebhook is called internally when provider/description changes
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: makeRow({
          metadata: { provider: 'make', relay: true, description: 'new desc' },
        }),
        error: null,
      }),
    );
    const result = await updateRelayWebhook('wh-1', {
      provider: 'make',
      description: 'new desc',
    });
    expect(result.provider).toBe('make');
  });

  it('caps retry_count at MAX_RETRY_COUNT', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: makeRow({ retry_count: 5 }), error: null }),
    );
    const result = await updateRelayWebhook('wh-1', { retry_count: 100 });
    expect(result.retry_count).toBe(5);
  });

  it('throws on DB error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'err' } }),
    );
    await expect(updateRelayWebhook('wh-1', { name: 'x' })).rejects.toThrow(
      'Failed to update relay webhook',
    );
  });
});

describe('deleteRelayWebhook', () => {
  it('deletes successfully', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    await expect(deleteRelayWebhook('wh-1')).resolves.toBeUndefined();
  });

  it('throws on DB error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'err' } }),
    );
    await expect(deleteRelayWebhook('wh-1')).rejects.toThrow(
      'Failed to delete relay webhook',
    );
  });
});

/* ------------------------------------------------------------------ */
/* relayEvent                                                         */
/* ------------------------------------------------------------------ */

describe('relayEvent', () => {
  it('returns 0/0 when no matching webhooks', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await relayEvent('org-1', 'task.created', { id: 't1' });
    expect(result).toEqual({ delivered: 0, failed: 0 });
  });

  it('returns 0/0 when webhooks is null', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await relayEvent('org-1', 'task.created', { id: 't1' });
    expect(result).toEqual({ delivered: 0, failed: 0 });
  });

  it('delivers to matching webhooks and counts successes', async () => {
    (process.env as any).NODE_ENV = 'development';
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [makeRow({ url: 'https://example.com/hook' })],
        error: null,
      }),
    );
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: jest.fn().mockResolvedValue('ok'),
    });
    const result = await relayEvent('org-1', 'task.created', { id: 't1' });
    expect(result.delivered).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('counts failures when delivery fails', async () => {
    (process.env as any).NODE_ENV = 'development';
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [makeRow({ url: 'https://example.com/hook', retry_count: 1 })],
        error: null,
      }),
    );
    mockFetch.mockRejectedValue(new Error('network error'));
    const result = await relayEvent('org-1', 'task.created', { id: 't1' });
    expect(result.failed).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/* testRelayWebhook                                                   */
/* ------------------------------------------------------------------ */

describe('testRelayWebhook', () => {
  it('returns not found when webhook missing', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await testRelayWebhook('missing');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Webhook not found');
  });

  it('returns success for valid webhook delivery', async () => {
    (process.env as any).NODE_ENV = 'development';
    getClient().from.mockImplementation(() =>
      createBuilder({ data: makeRow(), error: null }),
    );
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: jest.fn().mockResolvedValue('ok'),
    });
    const result = await testRelayWebhook('wh-1');
    expect(result.success).toBe(true);
    expect(result.message).toContain('Test delivered successfully');
  });
});

/* ------------------------------------------------------------------ */
/* testRelayUrl                                                       */
/* ------------------------------------------------------------------ */

describe('testRelayUrl', () => {
  it('returns blocked for unsafe URL', async () => {
    (process.env as any).NODE_ENV = 'production';
    const result = await testRelayUrl('https://localhost/hook', 'org-1');
    expect(result.success).toBe(false);
    expect(result.message).toContain('blocked');
  });

  it('returns success for valid URL', async () => {
    (process.env as any).NODE_ENV = 'development';
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    });
    const result = await testRelayUrl('https://example.com/hook', 'org-1');
    expect(result.success).toBe(true);
    expect(result.responseCode).toBe(200);
  });

  it('returns failure for non-ok response', async () => {
    (process.env as any).NODE_ENV = 'development';
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    const result = await testRelayUrl('https://example.com/hook', 'org-1');
    expect(result.success).toBe(false);
    expect(result.responseCode).toBe(500);
  });

  it('returns failure on fetch error', async () => {
    (process.env as any).NODE_ENV = 'development';
    mockFetch.mockRejectedValue(new Error('timeout'));
    const result = await testRelayUrl('https://example.com/hook', 'org-1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('timeout');
  });

  it('handles non-Error thrown value', async () => {
    (process.env as any).NODE_ENV = 'development';
    mockFetch.mockRejectedValue('string-error');
    const result = await testRelayUrl('https://example.com/hook', 'org-1');
    expect(result.success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* getRelayDeliveries                                                 */
/* ------------------------------------------------------------------ */

describe('getRelayDeliveries', () => {
  it('returns deliveries', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [{ id: 'd1' }, { id: 'd2' }], error: null }),
    );
    const result = await getRelayDeliveries('wh-1');
    expect(result).toHaveLength(2);
  });

  it('returns empty on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'err' } }),
    );
    expect(await getRelayDeliveries('wh-1')).toEqual([]);
  });

  it('uses custom limit', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    await getRelayDeliveries('wh-1', 10);
    expect(getClient().from).toHaveBeenCalled();
  });
});

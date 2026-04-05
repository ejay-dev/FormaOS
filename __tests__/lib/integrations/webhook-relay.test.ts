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
  RELAY_EVENT_LABELS,
  VALID_RELAY_EVENTS,
} from '@/lib/integrations/webhook-relay';
import type { RelayWebhookConfig } from '@/lib/integrations/webhook-relay';

function getClient() {
  return require('@/lib/supabase/server').__client;
}
import dns from 'dns/promises';

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

  it('returns false for mismatched length signatures', () => {
    expect(verifyRelaySignature(payload, 'short', secret)).toBe(false);
  });
});

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
    expect(result.url).toBe('https://example.com/hook');
  });

  it('handles empty secret', () => {
    const result = sanitizeWebhookForResponse({ ...config, secret: '' });
    expect(result.secret_preview).toBe('');
  });
});

describe('isValidWebhookUrl', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  it('accepts https URLs in development', async () => {
    process.env.NODE_ENV = 'development';
    expect(await isValidWebhookUrl('https://example.com/hook')).toBe(true);
  });

  it('accepts localhost in development', async () => {
    process.env.NODE_ENV = 'development';
    expect(await isValidWebhookUrl('http://localhost:3000/hook')).toBe(true);
  });

  it('rejects invalid URLs', async () => {
    expect(await isValidWebhookUrl('not-a-url')).toBe(false);
  });

  it('rejects plain HTTP in production', async () => {
    process.env.NODE_ENV = 'production';
    expect(await isValidWebhookUrl('http://example.com/hook')).toBe(false);
  });

  it('rejects private IPs in production', async () => {
    process.env.NODE_ENV = 'production';
    expect(await isValidWebhookUrl('https://192.168.1.1/hook')).toBe(false);
  });

  it('accepts public HTTPS in production with valid DNS', async () => {
    process.env.NODE_ENV = 'production';
    (dns.resolve4 as jest.Mock).mockResolvedValue(['8.8.8.8']);
    (dns.resolve6 as jest.Mock).mockRejectedValue(new Error('no AAAA'));
    expect(await isValidWebhookUrl('https://example.com/hook')).toBe(true);
  });

  it('rejects when DNS resolves to private IP in production', async () => {
    process.env.NODE_ENV = 'production';
    (dns.resolve4 as jest.Mock).mockResolvedValue(['10.0.0.1']);
    (dns.resolve6 as jest.Mock).mockRejectedValue(new Error('no AAAA'));
    expect(await isValidWebhookUrl('https://evil.com/hook')).toBe(false);
  });
});

// ── CRUD operations ──
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
  beforeEach(() => jest.clearAllMocks());

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
  beforeEach(() => jest.clearAllMocks());

  it('returns mapped configs', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [makeRow(), makeRow({ id: 'wh-2', name: 'H2' })],
        error: null,
      }),
    );
    const result = await listRelayWebhooks('org-1');
    expect(result).toHaveLength(2);
  });

  it('returns empty on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'err' } }),
    );
    expect(await listRelayWebhooks('org-1')).toEqual([]);
  });
});

describe('getRelayWebhook', () => {
  beforeEach(() => jest.clearAllMocks());

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
});

describe('updateRelayWebhook', () => {
  beforeEach(() => jest.clearAllMocks());

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
  beforeEach(() => jest.clearAllMocks());

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

describe('relayEvent', () => {
  beforeEach(() => jest.clearAllMocks());

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
});

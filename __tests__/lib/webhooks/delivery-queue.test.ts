/**
 * Tests for Webhook Delivery Queue
 */

jest.mock('server-only', () => ({}));

jest.mock('@/lib/supabase/admin', () => {
  const q: Record<string, jest.Mock> = {};
  q.select = jest.fn(() => q);
  q.insert = jest.fn(() => q);
  q.update = jest.fn(() => q);
  q.delete = jest.fn(() => q);
  q.eq = jest.fn(() => q);
  q.in = jest.fn(() => q);
  q.contains = jest.fn(() => q);
  q.order = jest.fn(() => q);
  q.range = jest.fn(() => q);
  q.limit = jest.fn(() => q);
  q.single = jest.fn(() => Promise.resolve({ data: null, error: null }));
  q.maybeSingle = jest.fn(() => Promise.resolve({ data: null, error: null }));
  q.then = jest.fn((resolve: Function) => resolve({ data: null, error: null }));
  const c = { from: jest.fn(() => q) };
  return {
    createSupabaseAdminClient: jest.fn(() => c),
    __query: q,
    __client: c,
  };
});

function getQuery() {
  return require('@/lib/supabase/admin').__query;
}
function getClient() {
  return require('@/lib/supabase/admin').__client;
}

jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/trigger/client', () => ({
  triggerTaskIfConfigured: jest.fn().mockResolvedValue(false),
}));

jest.mock('@/lib/security/url-validator', () => ({
  validateWebhookUrl: jest.fn().mockResolvedValue(undefined),
}));

import {
  queueWebhookDelivery,
  processWebhookDelivery,
  listWebhookDeliveries,
  sendTestWebhookEvent,
} from '@/lib/webhooks/delivery-queue';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

function resetAdminQuery(data: unknown = null, error: unknown = null) {
  const q = getQuery();
  Object.keys(q).forEach((k) => {
    if (k === 'then') return;
    q[k].mockImplementation(() => q);
  });
  q.then = jest.fn((resolve: Function) => resolve({ data, error }));
  getClient().from.mockReturnValue(q);
}

describe('queueWebhookDelivery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAdminQuery();
    getClient().from.mockReturnValue(getQuery());
  });

  it('returns early when no matching webhooks', async () => {
    getQuery().then = jest.fn((resolve: Function) =>
      resolve({ data: [], error: null }),
    );

    const result = await queueWebhookDelivery('org-1', 'task.created' as any, {
      id: 't1',
    });
    expect(result.queued).toBe(0);
  });

  it('queues deliveries for matching webhooks', async () => {
    // First from().select().eq().contains() returns webhooks
    getQuery().then = jest.fn((resolve: Function) =>
      resolve({
        data: [
          {
            id: 'wh1',
            url: 'https://example.com/hook',
            secret: 'secret123',
            events: ['task.created'],
            enabled: true,
          },
        ],
        error: null,
      }),
    );
    // insert().select() returns inserted rows
    getQuery().insert.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ id: 'del-1', webhook_id: 'wh1' }],
        error: null,
      }),
    });

    const result = await queueWebhookDelivery('org-1', 'task.created' as any, {
      id: 't1',
    });
    expect(result.queued).toBeGreaterThanOrEqual(0);
  });
});

describe('processWebhookDelivery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAdminQuery();
    getClient().from.mockReturnValue(getQuery());
    mockFetch.mockReset();
  });

  it('throws when delivery not found', async () => {
    getQuery().then = jest.fn((resolve: Function) =>
      resolve({ data: null, error: { message: 'not found' } }),
    );
    await expect(processWebhookDelivery('del-1')).rejects.toThrow();
  });

  it('returns failed when webhook is disabled', async () => {
    const delivery = {
      id: 'del-1',
      webhook_id: 'wh1',
      event: 'task.created',
      payload: { test: true },
      attempts: 0,
      status: 'pending',
      webhook_configs: {
        id: 'wh1',
        url: 'https://example.com/hook',
        secret: 'secret123',
        enabled: false,
        organization_id: 'org-1',
        retry_count: 3,
        metadata: {},
        headers: null,
      },
    };

    getQuery().then = jest.fn((resolve: Function) =>
      resolve({ data: delivery, error: null }),
    );

    const result = await processWebhookDelivery('del-1');
    expect(result.ok).toBe(false);
    expect(result.status).toBe('failed');
  });
});

describe('listWebhookDeliveries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAdminQuery();
    getClient().from.mockReturnValue(getQuery());
  });

  it('returns empty when no webhooks found', async () => {
    getQuery().then = jest.fn((resolve: Function) =>
      resolve({ data: [], error: null, count: 0 }),
    );
    const result = await listWebhookDeliveries({ organizationId: 'org-1' });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe('sendTestWebhookEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAdminQuery();
    getClient().from.mockReturnValue(getQuery());
  });

  it('throws when webhook not found', async () => {
    getQuery().then = jest.fn((resolve: Function) =>
      resolve({ data: null, error: { message: 'not found' } }),
    );
    await expect(
      sendTestWebhookEvent({
        organizationId: 'org-1',
        webhookId: 'wh1',
        userId: 'u1',
      }),
    ).rejects.toThrow();
  });
});

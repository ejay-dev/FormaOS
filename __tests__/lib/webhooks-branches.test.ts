/**
 * Branch coverage for lib/webhooks.ts
 * Covers: createWebhook, getWebhooks, updateWebhook, deleteWebhook,
 * triggerWebhook, testWebhook, getWebhookDeliveries
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
  createWebhook,
  getWebhooks,
  updateWebhook,
  deleteWebhook,
  triggerWebhook,
  testWebhook,
  getWebhookDeliveries,
} from '@/lib/webhooks';

beforeEach(() => jest.clearAllMocks());

describe('createWebhook', () => {
  it('creates webhook and returns data', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({
          data: {
            id: 'wh1',
            name: 'Hook',
            events: ['task.created'],
            organization_id: 'org1',
          },
          error: null,
        }),
      ),
    });
    const result = await createWebhook('org1', {
      name: 'Hook',
      url: 'https://x.com/hook',
      events: ['task.created'],
      enabled: true,
    });
    expect(result.id).toBe('wh1');
  });

  it('throws on error', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      ),
    });
    await expect(
      createWebhook('org1', {
        name: 'Hook',
        url: 'https://x.com',
        events: ['task.created'],
        enabled: true,
      }),
    ).rejects.toBeDefined();
  });

  it('passes retry_count and headers', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({
          data: {
            id: 'wh2',
            name: 'Hook2',
            events: ['member.added'],
            retry_count: 5,
            headers: { 'X-Key': 'val' },
          },
          error: null,
        }),
      ),
    });
    const result = await createWebhook('org1', {
      name: 'Hook2',
      url: 'https://x.com',
      events: ['member.added'],
      enabled: true,
      retry_count: 5,
      headers: { 'X-Key': 'val' },
    });
    expect(result.retry_count).toBe(5);
  });
});

describe('getWebhooks', () => {
  it('returns webhooks', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({
          data: [{ id: 'wh1', name: 'A' }],
          error: null,
        }),
      ),
    });
    const result = await getWebhooks('org1');
    expect(result).toHaveLength(1);
  });

  it('returns empty on error', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      ),
    });
    const result = await getWebhooks('org1');
    expect(result).toEqual([]);
  });

  it('returns empty when data is null', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    });
    const result = await getWebhooks('org1');
    expect(result).toEqual([]);
  });
});

describe('updateWebhook', () => {
  it('updates successfully', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    });
    await expect(
      updateWebhook('wh1', { name: 'Updated' }),
    ).resolves.toBeUndefined();
  });

  it('throws on error', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      ),
    });
    await expect(
      updateWebhook('wh1', { name: 'Updated' }),
    ).rejects.toBeDefined();
  });
});

describe('deleteWebhook', () => {
  it('deletes successfully', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    });
    await expect(deleteWebhook('wh1')).resolves.toBeUndefined();
  });

  it('throws on error', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      ),
    });
    await expect(deleteWebhook('wh1')).rejects.toBeDefined();
  });
});

describe('triggerWebhook', () => {
  it('returns early when no webhooks', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => createBuilder({ data: [], error: null })),
    });
    await expect(
      triggerWebhook('org1', 'task.created', {}),
    ).resolves.toBeUndefined();
  });

  it('returns early when webhooks is null', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    });
    await expect(
      triggerWebhook('org1', 'task.created', {}, { source: 'test' }),
    ).resolves.toBeUndefined();
  });
});

describe('testWebhook', () => {
  it('returns not found when webhook missing', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    });
    const result = await testWebhook('wh-missing');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });
});

describe('getWebhookDeliveries', () => {
  it('returns deliveries', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({
          data: [{ id: 'd1', status: 'success' }],
          error: null,
        }),
      ),
    });
    const result = await getWebhookDeliveries('wh1');
    expect(result).toHaveLength(1);
  });

  it('returns empty on error', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      ),
    });
    const result = await getWebhookDeliveries('wh1');
    expect(result).toEqual([]);
  });

  it('uses custom limit', async () => {
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => createBuilder({ data: [], error: null })),
    });
    const result = await getWebhookDeliveries('wh1', 50);
    expect(result).toEqual([]);
  });
});

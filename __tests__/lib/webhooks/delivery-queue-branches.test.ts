/**
 * Tests for lib/webhooks/delivery-queue.ts - branch coverage supplement
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn(),
}));
jest.mock('@/lib/trigger/client', () => ({
  triggerTaskIfConfigured: jest.fn(() => false),
}));
jest.mock('@/lib/security/url-validator', () => ({
  validateWebhookUrl: jest.fn(),
}));

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
    'contains',
    'order',
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
const { triggerTaskIfConfigured } = require('@/lib/trigger/client');

import {
  queueWebhookDelivery,
  processWebhookDelivery,
} from '@/lib/webhooks/delivery-queue';

beforeEach(() => {
  jest.clearAllMocks();
  triggerTaskIfConfigured.mockResolvedValue(false);
});

describe('queueWebhookDelivery', () => {
  it('returns 0 queued when no matching webhooks', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => createBuilder({ data: [], error: null })),
    });
    const result = await queueWebhookDelivery('org-1', 'control.created', {
      id: '1',
    });
    expect(result.queued).toBe(0);
  });

  it('returns skipped=1 when query errors', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      ),
    });
    const result = await queueWebhookDelivery('org-1', 'control.created', {
      id: '1',
    });
    expect(result.skipped).toBe(1);
  });

  it('throws when insert fails', async () => {
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: [{ id: 'wh1' }], error: null });
        return createBuilder({ data: null, error: { message: 'insert fail' } });
      }),
    });
    await expect(
      queueWebhookDelivery('org-1', 'control.created', {}),
    ).rejects.toThrow('Failed to queue');
  });

  it('filters by webhookIds when provided', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => createBuilder({ data: [], error: null })),
    });
    const result = await queueWebhookDelivery(
      'org-1',
      'control.created',
      {},
      undefined,
      { webhookIds: ['wh1'] },
    );
    expect(result.queued).toBe(0);
  });
});

describe('processWebhookDelivery', () => {
  it('throws when delivery not found', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    });
    await expect(processWebhookDelivery('del-1')).rejects.toThrow('not found');
  });

  it('fails when webhook is disabled', async () => {
    const delivery = {
      id: 'del-1',
      event: 'control.created',
      payload: {},
      attempts: 0,
      webhook_configs: {
        id: 'wh1',
        enabled: false,
        url: 'https://hook.example.com',
        secret: 's',
        organization_id: 'org-1',
        name: 'Test',
      },
    };
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: delivery, error: null });
        return createBuilder({ data: null, error: null });
      }),
    });
    const result = await processWebhookDelivery('del-1');
    expect(result.ok).toBe(false);
    expect(result.status).toBe('failed');
  });

  it('succeeds on 200 response', async () => {
    const delivery = {
      id: 'del-1',
      event: 'control.created',
      payload: { data: {} },
      attempts: 0,
      webhook_configs: {
        id: 'wh1',
        enabled: true,
        url: 'https://hook.example.com',
        secret: 'secret123',
        organization_id: 'org-1',
        name: 'Test',
        headers: null,
        retry_count: null,
        metadata: null,
      },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('ok'),
    }) as any;

    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: delivery, error: null });
        return createBuilder({ data: null, error: null });
      }),
    });

    const result = await processWebhookDelivery('del-1');
    expect(result.ok).toBe(true);
    expect(result.status).toBe('success');
  });

  it('retries on failure when retry_count allows', async () => {
    const delivery = {
      id: 'del-1',
      event: 'control.created',
      payload: { data: {} },
      attempts: 0,
      webhook_configs: {
        id: 'wh1',
        enabled: true,
        url: 'https://hook.example.com',
        secret: 'secret123',
        organization_id: 'org-1',
        name: 'Test',
        headers: null,
        retry_count: 3,
        metadata: { consecutive_failures: 0 },
      },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('error'),
    }) as any;

    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: delivery, error: null });
        return createBuilder({ data: null, error: null });
      }),
    });

    const result = await processWebhookDelivery('del-1');
    expect(result.ok).toBe(false);
    expect(result.status).toBe('retrying');
  });

  it('handles fetch exceptions', async () => {
    const delivery = {
      id: 'del-1',
      event: 'control.created',
      payload: { data: {} },
      attempts: 0,
      webhook_configs: {
        id: 'wh1',
        enabled: true,
        url: 'https://hook.example.com',
        secret: 'secret123',
        organization_id: 'org-1',
        name: 'Test',
        headers: null,
        retry_count: null,
        metadata: { consecutive_failures: 4 },
      },
    };

    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network error')) as any;

    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: delivery, error: null });
        return createBuilder({ data: null, error: null });
      }),
    });

    const result = await processWebhookDelivery('del-1');
    expect(result.ok).toBe(false);
    expect(result.status).toBe('failed');
  });
});

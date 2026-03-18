/** @jest-environment node */

import {
  createWebhook,
  testWebhook,
  triggerWebhook,
  verifyWebhookSignature,
} from '@/lib/webhooks';
import { createMockWebhook } from '@/tests/factories';
import { mockSupabase } from '@/tests/helpers';

const supabase = mockSupabase();
const logActivity = jest.fn();
const fetchMock = global.fetch as jest.Mock;

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => supabase.client),
}));

jest.mock('@/lib/audit-trail', () => ({
  logActivity: (...args: unknown[]) => logActivity(...args),
}));

describe('webhooks', () => {
  beforeEach(() => {
    supabase.reset();
    logActivity.mockReset();
    fetchMock.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('creates webhook configurations and audit logs the registration', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'webhook_configs' && operation.action === 'insert') {
        return {
          data: { id: 'wh-1', ...(operation.values as Record<string, unknown>) },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const webhook = await createWebhook('org-a', {
      name: 'Primary',
      url: 'https://example.com/hook',
      events: ['task.created', 'task.completed'],
      enabled: true,
      retry_count: 5,
      headers: { Authorization: 'Bearer token' },
    });

    expect(webhook.id).toBe('wh-1');
    expect(webhook.secret).toHaveLength(64);
    expect(logActivity).toHaveBeenCalledWith(
      'org-a',
      '',
      'create',
      'organization',
      expect.objectContaining({
        entityId: 'wh-1',
        entityName: 'Primary',
      }),
    );
  });

  it('verifies valid signatures and rejects malformed ones', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'webhook_configs' && operation.action === 'insert') {
        return {
          data: { id: 'wh-2', ...(operation.values as Record<string, unknown>) },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const created = await createWebhook('org-a', {
      name: 'Verifier',
      url: 'https://example.com/hook',
      events: ['task.created'],
      enabled: true,
    });
    const payload = JSON.stringify({ hello: 'world' });
    const response = await createWebhook('org-a', {
      name: 'Verifier 2',
      url: 'https://example.com/hook',
      events: ['task.created'],
      enabled: true,
    });

    const validSignature = require('crypto')
      .createHmac('sha256', created.secret)
      .update(payload)
      .digest('hex');

    expect(verifyWebhookSignature(payload, validSignature, created.secret)).toBe(
      true,
    );
    expect(verifyWebhookSignature(payload, 'short', created.secret)).toBe(false);
    expect(
      verifyWebhookSignature(payload, validSignature, response.secret),
    ).toBe(false);
  });

  it('constructs payloads and delivery headers for subscribed webhook events', async () => {
    const webhook = createMockWebhook({
      id: 'wh-3',
      organization_id: 'org-a',
      events: ['task.created'],
      secret: 'signing-secret',
      headers: { Authorization: 'Bearer test' },
    });
    let deliveryId = 0;

    supabase.setResolver((operation) => {
      if (operation.table === 'webhook_configs' && operation.action === 'select') {
        return { data: [webhook], error: null };
      }
      if (
        operation.table === 'webhook_deliveries' &&
        operation.action === 'insert'
      ) {
        deliveryId += 1;
        return {
          data: { id: `delivery-${deliveryId}`, ...(operation.values as object) },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    fetchMock.mockResolvedValue({
      ok: true,
      status: 202,
      statusText: 'Accepted',
      text: jest.fn().mockResolvedValue('accepted'),
    });

    await triggerWebhook(
      'org-a',
      'task.created',
      { id: 'task-1', title: 'Review access' },
      { source: 'unit-test' },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.com/webhooks');
    expect(request.body).toContain('"event":"task.created"');
    expect(request.body).toContain('"organization_id":"org-a"');
    expect(request.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer test',
        'X-FormaOS-Event': 'task.created',
        'X-FormaOS-Delivery': 'delivery-1',
      }),
    );

    const deliveryUpdates = supabase.operations.filter(
      (operation) =>
        operation.table === 'webhook_deliveries' && operation.action === 'update',
    );
    expect(deliveryUpdates[0].values).toEqual(
      expect.objectContaining({
        status: 'success',
        response_code: 202,
      }),
    );
  });

  it('retries failed deliveries with exponential backoff and marks retrying status', async () => {
    jest.useFakeTimers();
    const webhook = createMockWebhook({
      id: 'wh-4',
      organization_id: 'org-a',
      retry_count: 2,
      events: ['task.created'],
    });
    let deliveryId = 0;

    supabase.setResolver((operation) => {
      if (operation.table === 'webhook_configs' && operation.action === 'select') {
        return { data: [webhook], error: null };
      }
      if (
        operation.table === 'webhook_deliveries' &&
        operation.action === 'insert'
      ) {
        deliveryId += 1;
        return {
          data: { id: `delivery-${deliveryId}`, ...(operation.values as object) },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    fetchMock
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: jest.fn().mockResolvedValue('ok'),
      });

    const promise = triggerWebhook('org-a', 'task.created', { id: 'task-1' });
    await jest.runAllTimersAsync();
    await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const updatePayloads = supabase.operations
      .filter(
        (operation) =>
          operation.table === 'webhook_deliveries' && operation.action === 'update',
      )
      .map((operation) => operation.values as Record<string, unknown>);

    expect(updatePayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'retrying', error_message: 'timeout' }),
        expect.objectContaining({ status: 'success', response_code: 200 }),
      ]),
    );
  });

  it('disables webhook configurations after repeated failures exhaust retries', async () => {
    jest.useFakeTimers();
    const webhook = createMockWebhook({
      id: 'wh-5',
      organization_id: 'org-a',
      retry_count: 2,
      events: ['task.created'],
    });
    let deliveryId = 0;

    supabase.setResolver((operation) => {
      if (operation.table === 'webhook_configs' && operation.action === 'select') {
        return { data: [webhook], error: null };
      }
      if (
        operation.table === 'webhook_deliveries' &&
        operation.action === 'insert'
      ) {
        deliveryId += 1;
        return {
          data: { id: `delivery-${deliveryId}`, ...(operation.values as object) },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    fetchMock.mockRejectedValue(new Error('network down'));

    const promise = triggerWebhook('org-a', 'task.created', { id: 'task-1' });
    await jest.runAllTimersAsync();
    await promise;

    const disableUpdate = supabase.operations.find(
      (operation) =>
        operation.table === 'webhook_configs' &&
        operation.action === 'update' &&
        (operation.values as Record<string, unknown>).enabled === false,
    );

    expect(disableUpdate).toBeDefined();
  });

  it('delivers a single event concurrently to multiple matching webhooks', async () => {
    const webhookA = createMockWebhook({
      id: 'wh-a',
      organization_id: 'org-a',
      url: 'https://example.com/a',
      events: ['task.created'],
    });
    const webhookB = createMockWebhook({
      id: 'wh-b',
      organization_id: 'org-a',
      url: 'https://example.com/b',
      events: ['task.created'],
    });
    let deliveryId = 0;

    supabase.setResolver((operation) => {
      if (operation.table === 'webhook_configs' && operation.action === 'select') {
        return { data: [webhookA, webhookB], error: null };
      }
      if (
        operation.table === 'webhook_deliveries' &&
        operation.action === 'insert'
      ) {
        deliveryId += 1;
        return {
          data: { id: `delivery-${deliveryId}`, ...(operation.values as object) },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: jest.fn().mockResolvedValue('ok'),
    });

    await triggerWebhook('org-a', 'task.created', { id: 'task-2' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      fetchMock.mock.calls.map((call) => call[0]).sort(),
    ).toEqual(['https://example.com/a', 'https://example.com/b']);
  });

  it('returns a failure message when testing an unknown webhook', async () => {
    supabase.queueResponse({
      match: { table: 'webhook_configs', action: 'select', expects: 'single' },
      response: { data: null, error: null },
    });

    await expect(testWebhook('missing')).resolves.toEqual({
      success: false,
      message: 'Webhook not found',
    });
  });
});


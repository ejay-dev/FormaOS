/** @jest-environment node */

import {
  createWebhook,
  getWebhooks,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  triggerWebhook,
  getWebhookDeliveries,
  getWebhookStats,
  verifyWebhookSignature,
  retryFailedDelivery,
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

  /* ---------------------------------------------------------------- */
  /* createWebhook                                                    */
  /* ---------------------------------------------------------------- */

  it('creates webhook configurations and audit logs the registration', async () => {
    supabase.setResolver((operation) => {
      if (
        operation.table === 'webhook_configs' &&
        operation.action === 'insert'
      ) {
        return {
          data: {
            id: 'wh-1',
            ...(operation.values as Record<string, unknown>),
          },
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

  it('throws on createWebhook DB error', async () => {
    supabase.setResolver(() => ({
      data: null,
      error: { message: 'insert fail' },
    }));
    await expect(
      createWebhook('org-a', {
        name: 'Fail',
        url: 'https://example.com',
        events: ['task.created'],
        enabled: true,
      }),
    ).rejects.toThrow('Failed to create webhook');
  });

  /* ---------------------------------------------------------------- */
  /* getWebhooks                                                      */
  /* ---------------------------------------------------------------- */

  it('returns webhooks on success', async () => {
    supabase.setResolver(() => ({
      data: [{ id: 'wh-1' }, { id: 'wh-2' }],
      error: null,
    }));
    const result = await getWebhooks('org-a');
    expect(result).toHaveLength(2);
  });

  it('returns empty on getWebhooks error', async () => {
    supabase.setResolver(() => ({
      data: null,
      error: { message: 'err' },
    }));
    expect(await getWebhooks('org-a')).toEqual([]);
  });

  /* ---------------------------------------------------------------- */
  /* updateWebhook                                                    */
  /* ---------------------------------------------------------------- */

  it('updates webhook successfully', async () => {
    supabase.setResolver(() => ({ data: null, error: null }));
    await expect(
      updateWebhook('wh-1', { name: 'Updated' }),
    ).resolves.toBeUndefined();
  });

  it('throws on updateWebhook error', async () => {
    supabase.setResolver(() => ({
      data: null,
      error: { message: 'update err' },
    }));
    await expect(updateWebhook('wh-1', { name: 'Fail' })).rejects.toThrow(
      'Failed to update webhook',
    );
  });

  /* ---------------------------------------------------------------- */
  /* deleteWebhook                                                    */
  /* ---------------------------------------------------------------- */

  it('deletes webhook successfully', async () => {
    supabase.setResolver(() => ({ data: null, error: null }));
    await expect(deleteWebhook('wh-1')).resolves.toBeUndefined();
  });

  it('throws on deleteWebhook error', async () => {
    supabase.setResolver(() => ({
      data: null,
      error: { message: 'delete err' },
    }));
    await expect(deleteWebhook('wh-1')).rejects.toThrow(
      'Failed to delete webhook',
    );
  });

  /* ---------------------------------------------------------------- */
  /* verifyWebhookSignature                                           */
  /* ---------------------------------------------------------------- */

  it('verifies valid signatures and rejects malformed ones', async () => {
    supabase.setResolver((operation) => {
      if (
        operation.table === 'webhook_configs' &&
        operation.action === 'insert'
      ) {
        return {
          data: {
            id: 'wh-2',
            ...(operation.values as Record<string, unknown>),
          },
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

    const validSignature = require('crypto')
      .createHmac('sha256', created.secret)
      .update(payload)
      .digest('hex');

    expect(
      verifyWebhookSignature(payload, validSignature, created.secret),
    ).toBe(true);
    expect(verifyWebhookSignature(payload, 'short', created.secret)).toBe(
      false,
    );
    expect(
      verifyWebhookSignature(payload, validSignature, 'wrong-secret'),
    ).toBe(false);
  });

  /* ---------------------------------------------------------------- */
  /* triggerWebhook + delivery                                        */
  /* ---------------------------------------------------------------- */

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
      if (
        operation.table === 'webhook_configs' &&
        operation.action === 'select'
      ) {
        return { data: [webhook], error: null };
      }
      if (
        operation.table === 'webhook_deliveries' &&
        operation.action === 'insert'
      ) {
        deliveryId += 1;
        return {
          data: {
            id: `delivery-${deliveryId}`,
            ...(operation.values as object),
          },
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
    expect(request.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer test',
        'X-FormaOS-Event': 'task.created',
        'X-FormaOS-Delivery': 'delivery-1',
      }),
    );
  });

  it('skips delivery when no webhooks match', async () => {
    supabase.setResolver(() => ({ data: null, error: null }));
    await triggerWebhook('org-a', 'task.created', { id: 'task-1' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips delivery when webhooks array is empty', async () => {
    supabase.setResolver(() => ({ data: [], error: null }));
    await triggerWebhook('org-a', 'task.created', { id: 'task-1' });
    expect(fetchMock).not.toHaveBeenCalled();
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
      if (
        operation.table === 'webhook_configs' &&
        operation.action === 'select'
      ) {
        return { data: [webhook], error: null };
      }
      if (
        operation.table === 'webhook_deliveries' &&
        operation.action === 'insert'
      ) {
        deliveryId += 1;
        return {
          data: {
            id: `delivery-${deliveryId}`,
            ...(operation.values as object),
          },
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
        (op: any) =>
          op.table === 'webhook_deliveries' && op.action === 'update',
      )
      .map((op: any) => op.values as Record<string, unknown>);

    expect(updatePayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'retrying',
          error_message: 'timeout',
        }),
        expect.objectContaining({ status: 'success', response_code: 200 }),
      ]),
    );
  });

  it('disables webhook after repeated failures exhaust retries', async () => {
    jest.useFakeTimers();
    const webhook = createMockWebhook({
      id: 'wh-5',
      organization_id: 'org-a',
      retry_count: 2,
      events: ['task.created'],
    });
    let deliveryId = 0;

    supabase.setResolver((operation) => {
      if (
        operation.table === 'webhook_configs' &&
        operation.action === 'select'
      ) {
        return { data: [webhook], error: null };
      }
      if (
        operation.table === 'webhook_deliveries' &&
        operation.action === 'insert'
      ) {
        deliveryId += 1;
        return {
          data: {
            id: `delivery-${deliveryId}`,
            ...(operation.values as object),
          },
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
      (op: any) =>
        op.table === 'webhook_configs' &&
        op.action === 'update' &&
        (op.values as Record<string, unknown>).enabled === false,
    );
    expect(disableUpdate).toBeDefined();
  });

  it('handles HTTP error responses (non-ok) with retry', async () => {
    jest.useFakeTimers();
    const webhook = createMockWebhook({
      id: 'wh-6',
      organization_id: 'org-a',
      retry_count: 2,
      events: ['task.created'],
    });
    let deliveryId = 0;

    supabase.setResolver((operation) => {
      if (
        operation.table === 'webhook_configs' &&
        operation.action === 'select'
      ) {
        return { data: [webhook], error: null };
      }
      if (
        operation.table === 'webhook_deliveries' &&
        operation.action === 'insert'
      ) {
        deliveryId += 1;
        return {
          data: {
            id: `delivery-${deliveryId}`,
            ...(operation.values as object),
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('error body'),
      })
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
  });

  it('delivers a single event to multiple matching webhooks', async () => {
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
      if (
        operation.table === 'webhook_configs' &&
        operation.action === 'select'
      ) {
        return { data: [webhookA, webhookB], error: null };
      }
      if (
        operation.table === 'webhook_deliveries' &&
        operation.action === 'insert'
      ) {
        deliveryId += 1;
        return {
          data: {
            id: `delivery-${deliveryId}`,
            ...(operation.values as object),
          },
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
  });

  it('handles delivery record insert failure gracefully', async () => {
    const webhook = createMockWebhook({
      id: 'wh-insert-fail',
      organization_id: 'org-a',
      events: ['task.created'],
    });

    supabase.setResolver((operation) => {
      if (
        operation.table === 'webhook_configs' &&
        operation.action === 'select'
      ) {
        return { data: [webhook], error: null };
      }
      if (
        operation.table === 'webhook_deliveries' &&
        operation.action === 'insert'
      ) {
        return { data: null, error: { message: 'insert delivery failed' } };
      }
      return { data: null, error: null };
    });

    // Should not throw; delivery returns early with partial delivery object
    await triggerWebhook('org-a', 'task.created', { id: 'task-1' });
    expect(console.error).toHaveBeenCalledWith(
      'Failed to create delivery record:',
      expect.anything(),
    );
  });

  /* ---------------------------------------------------------------- */
  /* testWebhook                                                      */
  /* ---------------------------------------------------------------- */

  it('returns failure for unknown webhook', async () => {
    supabase.queueResponse({
      match: { table: 'webhook_configs', action: 'select', expects: 'single' },
      response: { data: null, error: null },
    });

    await expect(testWebhook('missing')).resolves.toEqual({
      success: false,
      message: 'Webhook not found',
    });
  });

  it('returns success for successful test delivery', async () => {
    const webhook = createMockWebhook({
      id: 'wh-test',
      organization_id: 'org-a',
      events: ['task.created'],
    });
    let deliveryId = 0;

    supabase.setResolver((operation) => {
      if (
        operation.table === 'webhook_configs' &&
        operation.action === 'select'
      ) {
        return { data: webhook, error: null };
      }
      if (
        operation.table === 'webhook_deliveries' &&
        operation.action === 'insert'
      ) {
        deliveryId += 1;
        return {
          data: {
            id: `delivery-${deliveryId}`,
            ...(operation.values as object),
          },
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

    const result = await testWebhook('wh-test');
    expect(result.success).toBe(true);
    expect(result.message).toContain('delivered successfully');
    expect(result.response?.responseCode).toBe(200);
  });

  /* ---------------------------------------------------------------- */
  /* getWebhookDeliveries                                             */
  /* ---------------------------------------------------------------- */

  it('returns deliveries', async () => {
    supabase.setResolver(() => ({
      data: [{ id: 'd1' }, { id: 'd2' }],
      error: null,
    }));
    const result = await getWebhookDeliveries('wh-1');
    expect(result).toHaveLength(2);
  });

  it('returns empty on getWebhookDeliveries error', async () => {
    supabase.setResolver(() => ({
      data: null,
      error: { message: 'err' },
    }));
    expect(await getWebhookDeliveries('wh-1')).toEqual([]);
  });

  /* ---------------------------------------------------------------- */
  /* getWebhookStats                                                  */
  /* ---------------------------------------------------------------- */

  it('calculates webhook statistics', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'webhook_configs') {
        return {
          data: [
            { id: 'wh-1', enabled: true },
            { id: 'wh-2', enabled: false },
          ],
          error: null,
        };
      }
      if (operation.table === 'webhook_deliveries') {
        return {
          data: [
            { event: 'task.created', status: 'success' },
            { event: 'task.created', status: 'success' },
            { event: 'task.completed', status: 'failed' },
          ],
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const stats = await getWebhookStats('org-a');
    expect(stats.totalWebhooks).toBe(2);
    expect(stats.activeWebhooks).toBe(1);
    expect(stats.totalDeliveries).toBe(3);
    expect(stats.successfulDeliveries).toBe(2);
    expect(stats.failedDeliveries).toBe(1);
    expect(stats.successRate).toBe(67);
    expect(stats.deliveriesByEvent['task.created']).toBe(2);
  });

  it('handles empty webhooks and deliveries', async () => {
    supabase.setResolver(() => ({ data: null, error: null }));

    const stats = await getWebhookStats('org-a');
    expect(stats.totalWebhooks).toBe(0);
    expect(stats.activeWebhooks).toBe(0);
    expect(stats.totalDeliveries).toBe(0);
    expect(stats.successRate).toBe(0);
  });

  /* ---------------------------------------------------------------- */
  /* retryFailedDelivery                                              */
  /* ---------------------------------------------------------------- */

  it('retries a failed delivery', async () => {
    const webhook = createMockWebhook({
      id: 'wh-retry',
      organization_id: 'org-a',
      events: ['task.created'],
    });
    let deliveryId = 0;

    supabase.setResolver((operation) => {
      if (
        operation.table === 'webhook_deliveries' &&
        operation.action === 'select'
      ) {
        return {
          data: {
            id: 'd-retry',
            webhook_id: 'wh-retry',
            event: 'task.created',
            payload: {
              event: 'task.created',
              timestamp: '',
              organization_id: 'org-a',
              data: {},
            },
            status: 'failed',
            attempts: 1,
            webhook_configs: webhook,
          },
          error: null,
        };
      }
      if (
        operation.table === 'webhook_deliveries' &&
        operation.action === 'insert'
      ) {
        deliveryId += 1;
        return {
          data: {
            id: `delivery-${deliveryId}`,
            ...(operation.values as object),
          },
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

    await retryFailedDelivery('d-retry');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when delivery not found for retry', async () => {
    supabase.setResolver(() => ({ data: null, error: null }));
    await expect(retryFailedDelivery('missing')).rejects.toThrow(
      'Delivery or webhook not found',
    );
  });

  it('throws when webhook_configs missing from delivery', async () => {
    supabase.setResolver(() => ({
      data: { id: 'd-1', webhook_configs: null },
      error: null,
    }));
    await expect(retryFailedDelivery('d-1')).rejects.toThrow(
      'Delivery or webhook not found',
    );
  });
});

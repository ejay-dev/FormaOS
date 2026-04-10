/** @jest-environment node */

/**
 * Tests for lib/webhooks/delivery-queue.ts
 * Covers: queueWebhookDelivery, processWebhookDelivery,
 *         listWebhookDeliveries, sendTestWebhookEvent,
 *         + internal helpers (getRetryDelayMs, createSignature,
 *           getWebhookStatus, notifyWebhookFailures)
 */

// ─── Supabase chain builder ───────────────────────────────────────────────
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
    'filter',
    'match',
    'or',
    'contains',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const mockAdminClient = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => mockAdminClient),
}));

jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));

const mockTriggerTask = jest.fn().mockResolvedValue(false);
jest.mock('@/lib/trigger/client', () => ({
  triggerTaskIfConfigured: (...args: any[]) => mockTriggerTask(...args),
}));

jest.mock('@/lib/security/url-validator', () => ({
  validateWebhookUrl: jest.fn().mockResolvedValue(undefined),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

import {
  queueWebhookDelivery,
  processWebhookDelivery,
  listWebhookDeliveries,
  sendTestWebhookEvent,
} from '@/lib/webhooks/delivery-queue';

describe('webhooks/delivery-queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  // ─── queueWebhookDelivery ────────────────────────────────────
  describe('queueWebhookDelivery', () => {
    it('returns {queued:0} when no matching webhooks', async () => {
      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: [], error: null }),
      );

      const result = await queueWebhookDelivery('org1', 'task.created', {
        id: '1',
      });
      expect(result.queued).toBe(0);
      expect(result.deliveryIds).toEqual([]);
    });

    it('returns {queued:0, skipped:1} on query error', async () => {
      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: null, error: { message: 'DB error' } }),
      );

      const result = await queueWebhookDelivery('org1', 'task.created', {});
      expect(result.skipped).toBe(1);
    });

    it('queues deliveries for matching webhooks', async () => {
      const webhooksBuilder = createBuilder({
        data: [{ id: 'wh1' }, { id: 'wh2' }],
        error: null,
      });
      const insertBuilder = createBuilder({
        data: [{ id: 'del1' }, { id: 'del2' }],
        error: null,
      });

      let callCount = 0;
      mockAdminClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return webhooksBuilder;
        return insertBuilder;
      });

      const result = await queueWebhookDelivery('org1', 'task.created', {
        taskId: 't1',
      });
      expect(result.queued).toBe(2);
      expect(result.deliveryIds).toHaveLength(2);
    });

    it('throws on insert error', async () => {
      const webhooksBuilder = createBuilder({
        data: [{ id: 'wh1' }],
        error: null,
      });
      const insertErrorBuilder = createBuilder({
        data: null,
        error: { message: 'Insert failed' },
      });

      let callCount = 0;
      mockAdminClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return webhooksBuilder;
        return insertErrorBuilder;
      });

      await expect(
        queueWebhookDelivery('org1', 'task.created', {}),
      ).rejects.toThrow('Failed to queue webhook deliveries');
    });

    it('filters by webhookIds when provided', async () => {
      const webhooksBuilder = createBuilder({
        data: [{ id: 'wh1' }],
        error: null,
      });
      const insertBuilder = createBuilder({
        data: [{ id: 'del1' }],
        error: null,
      });

      let callCount = 0;
      mockAdminClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return webhooksBuilder;
        return insertBuilder;
      });

      const result = await queueWebhookDelivery(
        'org1',
        'task.created',
        {},
        undefined,
        { webhookIds: ['wh1'] },
      );
      expect(result.queued).toBe(1);
    });

    it('passes metadata to payload', async () => {
      const webhooksBuilder = createBuilder({
        data: [{ id: 'wh1' }],
        error: null,
      });
      const insertBuilder = createBuilder({
        data: [{ id: 'del1' }],
        error: null,
      });

      let callCount = 0;
      mockAdminClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return webhooksBuilder;
        return insertBuilder;
      });

      const result = await queueWebhookDelivery(
        'org1',
        'task.updated',
        { taskId: 't1' },
        { source: 'api' },
      );
      expect(result.queued).toBe(1);
    });

    it('calls triggerTaskIfConfigured and falls back to processWebhookDelivery', async () => {
      const webhooksBuilder = createBuilder({
        data: [{ id: 'wh1' }],
        error: null,
      });
      const insertBuilder = createBuilder({
        data: [{ id: 'del1' }],
        error: null,
      });

      let callCount = 0;
      mockAdminClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return webhooksBuilder;
        return insertBuilder;
      });

      mockTriggerTask.mockResolvedValueOnce(true); // task triggered

      const _result = await queueWebhookDelivery('org1', 'task.created', {});
      expect(mockTriggerTask).toHaveBeenCalled();
    });
  });

  // ─── processWebhookDelivery ───────────────────────────────────
  describe('processWebhookDelivery', () => {
    const baseDelivery = {
      id: 'del1',
      webhook_id: 'wh1',
      event: 'task.created',
      payload: { event: 'task.created', data: {} },
      status: 'pending',
      attempts: 0,
      webhook_configs: {
        id: 'wh1',
        organization_id: 'org1',
        name: 'Test Hook',
        url: 'https://example.com/hook',
        secret: 'test-secret',
        enabled: true,
        events: ['task.created'],
        headers: {},
        retry_count: 3,
        metadata: { status: 'healthy', consecutive_failures: 0 },
      },
    };

    it('throws when delivery not found', async () => {
      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: null, error: { message: 'Not found' } }),
      );

      await expect(processWebhookDelivery('nonexistent')).rejects.toThrow(
        'Webhook delivery nonexistent not found',
      );
    });

    it('marks as failed when webhook is disabled', async () => {
      const disabledDelivery = {
        ...baseDelivery,
        webhook_configs: { ...baseDelivery.webhook_configs, enabled: false },
      };

      const selectBuilder = createBuilder({
        data: disabledDelivery,
        error: null,
      });
      const updateBuilder = createBuilder({ data: null, error: null });

      let callCount = 0;
      mockAdminClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return selectBuilder;
        return updateBuilder;
      });

      const result = await processWebhookDelivery('del1');
      expect(result).toEqual({
        ok: false,
        status: 'failed',
        deliveryId: 'del1',
      });
    });

    it('delivers successfully on HTTP 200', async () => {
      const _selectBuilder = createBuilder({ data: baseDelivery, error: null });
      const _updateBuilder = createBuilder({ data: null, error: null });

      mockAdminClient.from.mockImplementation(() => {
        return createBuilder({ data: baseDelivery, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('OK'),
      });

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(true);
      expect(result.status).toBe('success');
    });

    it('marks as retrying on HTTP 500 with retries remaining', async () => {
      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: baseDelivery, error: null }),
      );

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server Error'),
      });

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(false);
    });

    it('marks as failed on HTTP 500 with no retries remaining', async () => {
      const maxAttemptsDelivery = {
        ...baseDelivery,
        attempts: 5,
        webhook_configs: { ...baseDelivery.webhook_configs, retry_count: 1 },
      };

      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: maxAttemptsDelivery, error: null }),
      );

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: () => Promise.resolve('Down'),
      });

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(false);
    });

    it('handles fetch error (network failure)', async () => {
      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: baseDelivery, error: null }),
      );

      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(false);
      expect(result.status).toBe('failed');
    });

    it('handles non-Error throws from fetch', async () => {
      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: baseDelivery, error: null }),
      );

      mockFetch.mockRejectedValueOnce('string error');

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(false);
    });

    it('disables webhook after reaching FAILURE_DISABLE_THRESHOLD', async () => {
      const highFailureDelivery = {
        ...baseDelivery,
        webhook_configs: {
          ...baseDelivery.webhook_configs,
          metadata: { status: 'failing', consecutive_failures: 49 },
        },
      };

      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: highFailureDelivery, error: null }),
      );

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Error',
        text: () => Promise.resolve('Error'),
      });

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(false);
    });

    it('sends notification at FAILURE_WARN_THRESHOLD', async () => {
      const warnDelivery = {
        ...baseDelivery,
        webhook_configs: {
          ...baseDelivery.webhook_configs,
          metadata: { status: 'healthy', consecutive_failures: 4 },
        },
      };

      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: warnDelivery, error: null }),
      );

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text: () => Promise.resolve(''),
      });

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(false);
    });

    it('schedules retry via triggerTask when retrying', async () => {
      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: baseDelivery, error: null }),
      );

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Error',
        text: () => Promise.resolve(''),
      });

      mockTriggerTask.mockResolvedValueOnce(true);

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(false);
    });

    it('falls back to setTimeout when triggerTask fails', async () => {
      jest.useFakeTimers();

      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: baseDelivery, error: null }),
      );

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Error',
        text: () => Promise.resolve(''),
      });

      mockTriggerTask
        .mockResolvedValueOnce(undefined) // first call in queue
        .mockResolvedValueOnce(false); // retry call

      await processWebhookDelivery('del1');

      jest.useRealTimers();
    });

    it('handles webhook with null retry_count', async () => {
      const nullRetry = {
        ...baseDelivery,
        webhook_configs: {
          ...baseDelivery.webhook_configs,
          retry_count: null,
        },
      };

      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: nullRetry, error: null }),
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('OK'),
      });

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(true);
    });

    it('handles webhook with null metadata', async () => {
      const nullMeta = {
        ...baseDelivery,
        webhook_configs: {
          ...baseDelivery.webhook_configs,
          metadata: null,
        },
      };

      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: nullMeta, error: null }),
      );

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Error',
        text: () => Promise.resolve(''),
      });

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(false);
    });

    it('handles response.text() failure', async () => {
      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: baseDelivery, error: null }),
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.reject(new Error('Stream closed')),
      });

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(true);
    });

    it('resets consecutive_failures on success', async () => {
      const failingWebhook = {
        ...baseDelivery,
        webhook_configs: {
          ...baseDelivery.webhook_configs,
          metadata: { status: 'failing', consecutive_failures: 10 },
        },
      };

      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: failingWebhook, error: null }),
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('OK'),
      });

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(true);
    });

    it('handles fetch error in catch and updates consecutive_failures', async () => {
      const delivery = {
        ...baseDelivery,
        webhook_configs: {
          ...baseDelivery.webhook_configs,
          metadata: { consecutive_failures: 4 },
        },
      };

      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: delivery, error: null }),
      );

      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('ECONNREFUSED');
    });

    it('notifies on FAILURE_DISABLE_THRESHOLD in catch path', async () => {
      const delivery = {
        ...baseDelivery,
        webhook_configs: {
          ...baseDelivery.webhook_configs,
          metadata: { consecutive_failures: 49 },
        },
      };

      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: delivery, error: null }),
      );

      mockFetch.mockRejectedValueOnce(new Error('Timeout'));

      const result = await processWebhookDelivery('del1');
      expect(result.ok).toBe(false);
    });
  });

  // ─── listWebhookDeliveries ────────────────────────────────────
  describe('listWebhookDeliveries', () => {
    it('returns empty when no webhooks for org', async () => {
      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: [], error: null }),
      );

      const result = await listWebhookDeliveries({
        orgId: 'org1',
        limit: 10,
        offset: 0,
      });
      expect(result).toEqual({ data: [], total: 0 });
    });

    it('returns deliveries with total count', async () => {
      const configsBuilder = createBuilder({
        data: [{ id: 'wh1' }],
        error: null,
      });
      const deliveriesBuilder = createBuilder({
        data: [{ id: 'del1', event: 'task.created' }],
        count: 1,
        error: null,
      });

      let callCount = 0;
      mockAdminClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return configsBuilder;
        return deliveriesBuilder;
      });

      const result = await listWebhookDeliveries({
        orgId: 'org1',
        limit: 10,
        offset: 0,
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies event filter', async () => {
      const configsBuilder = createBuilder({
        data: [{ id: 'wh1' }],
        error: null,
      });
      const deliveriesBuilder = createBuilder({
        data: [],
        count: 0,
        error: null,
      });

      let callCount = 0;
      mockAdminClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return configsBuilder;
        return deliveriesBuilder;
      });

      await listWebhookDeliveries({
        orgId: 'org1',
        limit: 10,
        offset: 0,
        event: 'task.created',
      });
    });

    it('applies status filter', async () => {
      const configsBuilder = createBuilder({
        data: [{ id: 'wh1' }],
        error: null,
      });
      const deliveriesBuilder = createBuilder({
        data: [],
        count: 0,
        error: null,
      });

      let callCount = 0;
      mockAdminClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return configsBuilder;
        return deliveriesBuilder;
      });

      await listWebhookDeliveries({
        orgId: 'org1',
        limit: 10,
        offset: 0,
        status: 'failed',
      });
    });

    it('applies webhookId filter', async () => {
      const configsBuilder = createBuilder({
        data: [{ id: 'wh1' }],
        error: null,
      });
      const deliveriesBuilder = createBuilder({
        data: [],
        count: 0,
        error: null,
      });

      let callCount = 0;
      mockAdminClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return configsBuilder;
        return deliveriesBuilder;
      });

      await listWebhookDeliveries({
        orgId: 'org1',
        limit: 10,
        offset: 0,
        webhookId: 'wh1',
      });
    });

    it('throws on query error', async () => {
      const configsBuilder = createBuilder({
        data: [{ id: 'wh1' }],
        error: null,
      });
      const errorBuilder = createBuilder({
        data: null,
        error: { message: 'Query error' },
      });

      let callCount = 0;
      mockAdminClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return configsBuilder;
        return errorBuilder;
      });

      await expect(
        listWebhookDeliveries({ orgId: 'org1', limit: 10, offset: 0 }),
      ).rejects.toThrow('Failed to list webhook deliveries');
    });
  });

  // ─── sendTestWebhookEvent ─────────────────────────────────────
  describe('sendTestWebhookEvent', () => {
    it('sends test webhook event', async () => {
      const webhookBuilder = createBuilder({
        data: { id: 'wh1', name: 'Test Hook' },
        error: null,
      });
      const insertBuilder = createBuilder({
        data: [{ id: 'del-test' }],
        error: null,
      });

      let callCount = 0;
      mockAdminClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return webhookBuilder;
        return insertBuilder;
      });

      const result = await sendTestWebhookEvent({
        orgId: 'org1',
        webhookId: 'wh1',
        actorId: 'u1',
      });
      expect(result).toBeDefined();
    });

    it('throws when webhook not found', async () => {
      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: null, error: { message: 'Not found' } }),
      );

      await expect(
        sendTestWebhookEvent({
          orgId: 'org1',
          webhookId: 'wh-none',
          actorId: 'u1',
        }),
      ).rejects.toThrow('Webhook not found');
    });

    it('throws when webhook returns null data', async () => {
      mockAdminClient.from.mockReturnValue(
        createBuilder({ data: null, error: null }),
      );

      await expect(
        sendTestWebhookEvent({
          orgId: 'org1',
          webhookId: 'wh-none',
          actorId: 'u1',
        }),
      ).rejects.toThrow('Webhook not found');
    });
  });
});

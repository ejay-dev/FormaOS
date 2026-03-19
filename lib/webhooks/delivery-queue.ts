import 'server-only';

import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/audit-trail';
import { triggerTaskIfConfigured } from '@/lib/trigger/client';
import type { WebhookConfig, WebhookDelivery, WebhookEvent, WebhookPayload } from '@/lib/webhooks';
import { validateWebhookUrl } from '@/lib/security/url-validator';

const SIGNATURE_HEADER = 'X-FormaOS-Signature';
const EVENT_HEADER = 'X-FormaOS-Event';
const DELIVERY_HEADER = 'X-FormaOS-Delivery';
const USER_AGENT = 'FormaOS-Webhooks/2.0';
const DELIVERY_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BODY_LENGTH = 1_000;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 12 * 60 * 60_000];
const FAILURE_DISABLE_THRESHOLD = 50;
const FAILURE_WARN_THRESHOLD = 5;

type WebhookConfigRow = WebhookConfig & {
  id: string;
  retry_count?: number | null;
  metadata?: Record<string, unknown> | null;
};

type WebhookDeliveryRow = WebhookDelivery & {
  id: string;
  webhook_configs?: WebhookConfigRow | null;
};

function getRetryDelayMs(attempt: number) {
  return RETRY_DELAYS_MS[Math.max(0, Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1))];
}

function createSignature(payload: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function getWebhookStatus(metadata: Record<string, unknown> | null | undefined) {
  const status = metadata?.status;
  return typeof status === 'string' ? status : 'healthy';
}

async function notifyWebhookFailures(
  orgId: string,
  webhookId: string,
  name: string,
  consecutiveFailures: number,
) {
  const admin = createSupabaseAdminClient();
  const { data: members } = await admin
    .from('org_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .in('role', ['owner', 'admin']);

  if (!members?.length) {
    return;
  }

  await admin.from('org_notifications').insert(
    (members as Array<{ user_id: string }>).map((member) => ({
      organization_id: orgId,
      user_id: member.user_id,
      type: 'SECURITY_ALERT',
      title:
        consecutiveFailures >= FAILURE_DISABLE_THRESHOLD
          ? 'Webhook disabled after repeated failures'
          : 'Webhook delivery failures detected',
      body:
        consecutiveFailures >= FAILURE_DISABLE_THRESHOLD
          ? `${name} was disabled after ${consecutiveFailures} consecutive failures.`
          : `${name} has failed ${consecutiveFailures} times in a row and needs attention.`,
      action_url: '/app/settings/integrations',
      metadata: {
        webhookId,
        consecutiveFailures,
      },
    })),
  );
}

export async function queueWebhookDelivery(
  orgId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
  metadata?: Record<string, unknown>,
  options?: { webhookIds?: string[] },
) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from('webhook_configs')
    .select('*')
    .eq('organization_id', orgId)
    .eq('enabled', true)
    .contains('events', [event]);

  if (options?.webhookIds?.length) {
    query = query.in('id', options.webhookIds);
  }

  const { data: webhooks, error } = await query;

  if (error || !webhooks?.length) {
    return { queued: 0, skipped: error ? 1 : 0, deliveryIds: [] as string[] };
  }

  const now = new Date().toISOString();
  const payloadBase: WebhookPayload = {
    event,
    timestamp: now,
    organization_id: orgId,
    data,
    metadata,
  };

  const deliveries = (webhooks as Array<{ id: string }>).map((webhook) => ({
    webhook_id: webhook.id,
    event,
    payload: payloadBase,
    status: 'pending' as const,
    attempts: 0,
    created_at: now,
    next_retry_at: null,
  }));

  const { data: inserted, error: insertError } = await admin
    .from('webhook_deliveries')
    .insert(deliveries)
    .select('id');

  if (insertError || !inserted?.length) {
    throw new Error(
      `Failed to queue webhook deliveries: ${insertError?.message ?? 'unknown error'}`,
    );
  }

  await Promise.allSettled(
    inserted.map(async (delivery: { id: string }) => {
      const triggered = await triggerTaskIfConfigured(
        'webhook-delivery',
        { deliveryId: delivery.id },
        {
          queue: 'webhooks',
          idempotencyKey: `webhook-delivery:${delivery.id}`,
          tags: ['webhook-delivery', event],
        },
      );

      if (!triggered) {
        await processWebhookDelivery(delivery.id);
      }
    }),
  );

  return {
    queued: inserted.length,
    skipped: 0,
    deliveryIds: inserted.map((row: { id: string }) => row.id),
  };
}

export async function processWebhookDelivery(deliveryId: string) {
  const admin = createSupabaseAdminClient();
  const { data: delivery, error } = await admin
    .from('webhook_deliveries')
    .select('*, webhook_configs(*)')
    .eq('id', deliveryId)
    .maybeSingle();

  if (error || !delivery?.webhook_configs) {
    throw new Error(`Webhook delivery ${deliveryId} not found`);
  }

  const deliveryRow = delivery as WebhookDeliveryRow;
  const webhook = deliveryRow.webhook_configs as WebhookConfigRow;

  if (!webhook.enabled) {
    await admin
      .from('webhook_deliveries')
      .update({
        status: 'failed',
        error_message: 'Webhook disabled before delivery',
      })
      .eq('id', deliveryId);
    return { ok: false, status: 'failed', deliveryId };
  }

  const attempt = Number(deliveryRow.attempts ?? 0) + 1;
  const payloadString = JSON.stringify(deliveryRow.payload);
  const signature = createSignature(payloadString, webhook.secret);

  await admin
    .from('webhook_deliveries')
    .update({
      attempts: attempt,
      status: 'pending',
      error_message: null,
      next_retry_at: null,
    })
    .eq('id', deliveryId);

  try {
    await validateWebhookUrl(webhook.url);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [SIGNATURE_HEADER]: signature,
        [EVENT_HEADER]: deliveryRow.event,
        [DELIVERY_HEADER]: deliveryId,
        'User-Agent': USER_AGENT,
        ...(webhook.headers ?? {}),
      },
      body: payloadString,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });

    const responseBody = await response.text().catch(() => '');
    const success = response.ok;
    const maxAttempts = Math.min(
      Math.max(Number(webhook.retry_count ?? RETRY_DELAYS_MS.length), 1),
      RETRY_DELAYS_MS.length,
    );

    let status: WebhookDelivery['status'] = success ? 'success' : 'failed';
    let nextRetryAt: string | null = null;

    if (!success && attempt < maxAttempts) {
      status = 'retrying';
      nextRetryAt = new Date(Date.now() + getRetryDelayMs(attempt)).toISOString();
    }

    await admin.from('webhook_delivery_attempts').insert({
      delivery_id: deliveryId,
      attempt_number: attempt,
      status,
      response_code: response.status,
      response_body: responseBody.substring(0, MAX_RESPONSE_BODY_LENGTH),
      attempted_at: new Date().toISOString(),
    });

    await admin
      .from('webhook_deliveries')
      .update({
        status,
        response_code: response.status,
        response_body: responseBody.substring(0, MAX_RESPONSE_BODY_LENGTH),
        error_message: success
          ? null
          : `HTTP ${response.status}: ${response.statusText}`,
        delivered_at: success ? new Date().toISOString() : null,
        next_retry_at: nextRetryAt,
      })
      .eq('id', deliveryId);

    if (success) {
      const updatedMetadata = {
        ...(webhook.metadata ?? {}),
        status: 'healthy',
        consecutive_failures: 0,
        last_success_at: new Date().toISOString(),
      };

      await admin
        .from('webhook_configs')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', webhook.id);

      return { ok: true, status, deliveryId };
    }

    const previousFailures =
      Number((webhook.metadata as Record<string, unknown> | null)?.consecutive_failures ?? 0);
    const consecutiveFailures = previousFailures + 1;
    const webhookStatus =
      consecutiveFailures >= FAILURE_DISABLE_THRESHOLD
        ? 'disabled'
        : consecutiveFailures >= FAILURE_WARN_THRESHOLD
          ? 'failing'
          : getWebhookStatus(webhook.metadata);

    await admin
      .from('webhook_configs')
      .update({
        enabled: consecutiveFailures >= FAILURE_DISABLE_THRESHOLD ? false : webhook.enabled,
        metadata: {
          ...(webhook.metadata ?? {}),
          status: webhookStatus,
          consecutive_failures: consecutiveFailures,
          last_failure_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', webhook.id);

    if (
      consecutiveFailures === FAILURE_WARN_THRESHOLD ||
      consecutiveFailures === FAILURE_DISABLE_THRESHOLD
    ) {
      await notifyWebhookFailures(
        webhook.organization_id,
        webhook.id,
        webhook.name,
        consecutiveFailures,
      );
    }

    if (status === 'retrying' && nextRetryAt) {
      const triggered = await triggerTaskIfConfigured(
        'webhook-delivery',
        { deliveryId },
        {
          queue: 'webhooks',
          idempotencyKey: `webhook-delivery:${deliveryId}:attempt:${attempt + 1}`,
          tags: ['webhook-delivery', deliveryRow.event],
        },
      );

      if (!triggered) {
        setTimeout(() => {
          void processWebhookDelivery(deliveryId);
        }, Math.min(getRetryDelayMs(attempt), 5_000));
      }
    }

    return { ok: false, status, deliveryId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Webhook delivery failed';
    await admin.from('webhook_delivery_attempts').insert({
      delivery_id: deliveryId,
      attempt_number: attempt,
      status: 'failed',
      response_code: null,
      response_body: message.substring(0, MAX_RESPONSE_BODY_LENGTH),
      attempted_at: new Date().toISOString(),
    });

    await admin
      .from('webhook_deliveries')
      .update({
        status: 'failed',
        error_message: message,
      })
      .eq('id', deliveryId);

    const previousFailures =
      Number((webhook.metadata as Record<string, unknown> | null)?.consecutive_failures ?? 0);
    const consecutiveFailures = previousFailures + 1;
    await admin
      .from('webhook_configs')
      .update({
        enabled: consecutiveFailures >= FAILURE_DISABLE_THRESHOLD ? false : webhook.enabled,
        metadata: {
          ...(webhook.metadata ?? {}),
          status:
            consecutiveFailures >= FAILURE_DISABLE_THRESHOLD
              ? 'disabled'
              : consecutiveFailures >= FAILURE_WARN_THRESHOLD
                ? 'failing'
                : getWebhookStatus(webhook.metadata),
          consecutive_failures: consecutiveFailures,
          last_failure_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', webhook.id);

    if (
      consecutiveFailures === FAILURE_WARN_THRESHOLD ||
      consecutiveFailures === FAILURE_DISABLE_THRESHOLD
    ) {
      await notifyWebhookFailures(
        webhook.organization_id,
        webhook.id,
        webhook.name,
        consecutiveFailures,
      );
    }

    return { ok: false, status: 'failed', deliveryId, error: message };
  }
}

export async function listWebhookDeliveries(args: {
  orgId: string;
  limit: number;
  offset: number;
  event?: string | null;
  status?: string | null;
  webhookId?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const { data: configs } = await admin
    .from('webhook_configs')
    .select('id')
    .eq('organization_id', args.orgId);

  const webhookIds = ((configs ?? []) as Array<{ id: string }>).map((row) => row.id);
  if (!webhookIds.length) {
    return { data: [] as WebhookDeliveryRow[], total: 0 };
  }

  let query = admin
    .from('webhook_deliveries')
    .select('*', { count: 'exact' })
    .in('webhook_id', webhookIds)
    .order('created_at', { ascending: false })
    .range(args.offset, args.offset + args.limit - 1);

  if (args.event) query = query.eq('event', args.event);
  if (args.status) query = query.eq('status', args.status);
  if (args.webhookId) query = query.eq('webhook_id', args.webhookId);

  const { data, count, error } = await query;
  if (error) {
    throw new Error(`Failed to list webhook deliveries: ${error.message}`);
  }

  return { data: (data ?? []) as WebhookDeliveryRow[], total: count ?? 0 };
}

export async function sendTestWebhookEvent(args: {
  orgId: string;
  webhookId: string;
  actorId: string;
}) {
  const admin = createSupabaseAdminClient();
  const { data: webhook, error } = await admin
    .from('webhook_configs')
    .select('*')
    .eq('id', args.webhookId)
    .eq('organization_id', args.orgId)
    .maybeSingle();

  if (error || !webhook) {
    throw new Error('Webhook not found');
  }

  const queued = await queueWebhookDelivery(args.orgId, 'task.created', {
    test: true,
    taskId: 'test-task',
    title: 'FormaOS API test delivery',
    requestedBy: args.actorId,
  }, undefined, { webhookIds: [args.webhookId] });

  await logActivity(args.orgId, args.actorId, 'update', 'organization', {
    entityId: args.webhookId,
    entityName: webhook.name,
    details: {
      type: 'webhook_test',
      queued: queued.queued,
    },
  });

  return queued;
}

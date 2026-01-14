/**
 * =========================================================
 * Webhook System
 * =========================================================
 * Manage webhook subscriptions and deliver events to external systems
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { logActivity } from './audit-trail';
import crypto from 'crypto';

export type WebhookEvent =
  | 'task.created'
  | 'task.updated'
  | 'task.completed'
  | 'task.deleted'
  | 'certificate.created'
  | 'certificate.updated'
  | 'certificate.expiring'
  | 'certificate.expired'
  | 'certificate.renewed'
  | 'evidence.uploaded'
  | 'evidence.approved'
  | 'evidence.rejected'
  | 'member.added'
  | 'member.removed'
  | 'member.role_changed'
  | 'workflow.triggered'
  | 'workflow.completed'
  | 'compliance.alert';

export interface WebhookConfig {
  id?: string;
  organization_id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  enabled: boolean;
  retry_count?: number;
  headers?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  organization_id: string;
  data: any;
  metadata?: Record<string, any>;
}

export interface WebhookDelivery {
  id?: string;
  webhook_id: string;
  event: WebhookEvent;
  payload: WebhookPayload;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  response_code?: number;
  response_body?: string;
  error_message?: string;
  attempts: number;
  delivered_at?: string;
  created_at?: string;
}

/**
 * Create webhook configuration
 */
export async function createWebhook(
  organizationId: string,
  config: Omit<
    WebhookConfig,
    'id' | 'organization_id' | 'secret' | 'created_at' | 'updated_at'
  >,
): Promise<WebhookConfig> {
  const supabase = await createClient();

  // Generate secret for webhook signature
  const secret = crypto.randomBytes(32).toString('hex');

  const { data, error } = await supabase
    .from('webhook_configs')
    .insert({
      organization_id: organizationId,
      name: config.name,
      url: config.url,
      events: config.events,
      secret,
      enabled: config.enabled,
      retry_count: config.retry_count || 3,
      headers: config.headers || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create webhook: ${error.message}`);
  }

  await logActivity(
    organizationId,
    '', // System action
    'create',
    'organization',
    {
      entityId: data.id,
      entityName: config.name,
      details: { events: config.events },
    },
  );

  return data;
}

/**
 * Get webhook configurations
 */
export async function getWebhooks(
  organizationId: string,
): Promise<WebhookConfig[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) return [];

  return data || [];
}

/**
 * Update webhook configuration
 */
export async function updateWebhook(
  webhookId: string,
  updates: Partial<WebhookConfig>,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('webhook_configs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', webhookId);

  if (error) {
    throw new Error(`Failed to update webhook: ${error.message}`);
  }
}

/**
 * Delete webhook configuration
 */
export async function deleteWebhook(webhookId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('webhook_configs')
    .delete()
    .eq('id', webhookId);

  if (error) {
    throw new Error(`Failed to delete webhook: ${error.message}`);
  }
}

/**
 * Generate webhook signature
 */
function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Deliver webhook payload
 */
async function deliverWebhook(
  webhook: WebhookConfig,
  payload: WebhookPayload,
  attempt = 1,
): Promise<WebhookDelivery> {
  const supabase = await createClient();

  const delivery: Partial<WebhookDelivery> = {
    webhook_id: webhook.id!,
    event: payload.event,
    payload,
    status: 'pending',
    attempts: attempt,
    created_at: new Date().toISOString(),
  };

  // Create delivery record
  const { data: deliveryRecord, error: insertError } = await supabase
    .from('webhook_deliveries')
    .insert(delivery)
    .select()
    .single();

  if (insertError || !deliveryRecord) {
    console.error('Failed to create delivery record:', insertError);
    return delivery as WebhookDelivery;
  }

  try {
    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, webhook.secret);

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-FormaOS-Signature': signature,
      'X-FormaOS-Event': payload.event,
      'X-FormaOS-Delivery': deliveryRecord.id,
      'User-Agent': 'FormaOS-Webhooks/1.0',
      ...webhook.headers,
    };

    // Send webhook request
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseBody = await response.text().catch(() => '');

    // Update delivery record with result
    const updateData: Partial<WebhookDelivery> = {
      status: response.ok ? 'success' : 'failed',
      response_code: response.status,
      response_body: responseBody.substring(0, 1000), // Limit size
      delivered_at: new Date().toISOString(),
    };

    if (!response.ok) {
      updateData.error_message = `HTTP ${response.status}: ${response.statusText}`;
    }

    await supabase
      .from('webhook_deliveries')
      .update(updateData)
      .eq('id', deliveryRecord.id);

    return { ...deliveryRecord, ...updateData };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Update delivery record with error
    await supabase
      .from('webhook_deliveries')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', deliveryRecord.id);

    // Retry if attempts remain
    if (attempt < (webhook.retry_count || 3)) {
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      return deliverWebhook(webhook, payload, attempt + 1);
    }

    return {
      ...deliveryRecord,
      status: 'failed',
      error_message: errorMessage,
    };
  }
}

/**
 * Trigger webhook for an event
 */
export async function triggerWebhook(
  organizationId: string,
  event: WebhookEvent,
  data: any,
  metadata?: Record<string, any>,
): Promise<void> {
  const supabase = await createClient();

  // Get all enabled webhooks that subscribe to this event
  const { data: webhooks } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('enabled', true)
    .contains('events', [event]);

  if (!webhooks || webhooks.length === 0) {
    return; // No webhooks to trigger
  }

  // Prepare payload
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    organization_id: organizationId,
    data,
    metadata,
  };

  // Deliver to all subscribed webhooks
  await Promise.allSettled(
    webhooks.map((webhook: any) => deliverWebhook(webhook, payload)),
  );
}

/**
 * Test webhook configuration
 */
export async function testWebhook(webhookId: string): Promise<{
  success: boolean;
  message: string;
  response?: any;
}> {
  const supabase = await createClient();

  const { data: webhook } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('id', webhookId)
    .single();

  if (!webhook) {
    return {
      success: false,
      message: 'Webhook not found',
    };
  }

  const testPayload: WebhookPayload = {
    event: 'task.created',
    timestamp: new Date().toISOString(),
    organization_id: webhook.organization_id,
    data: {
      test: true,
      message: 'This is a test webhook delivery from FormaOS',
    },
  };

  const delivery = await deliverWebhook(webhook, testPayload);

  return {
    success: delivery.status === 'success',
    message:
      delivery.status === 'success'
        ? `Test webhook delivered successfully (HTTP ${delivery.response_code})`
        : `Test webhook failed: ${delivery.error_message}`,
    response: {
      status: delivery.status,
      responseCode: delivery.response_code,
      responseBody: delivery.response_body,
    },
  };
}

/**
 * Get webhook delivery history
 */
export async function getWebhookDeliveries(
  webhookId: string,
  limit = 100,
): Promise<WebhookDelivery[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('webhook_deliveries')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  return data || [];
}

/**
 * Get webhook statistics
 */
export async function getWebhookStats(organizationId: string): Promise<{
  totalWebhooks: number;
  activeWebhooks: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  deliveriesByEvent: Record<WebhookEvent, number>;
}> {
  const supabase = await createClient();

  // Get webhook counts
  const { data: webhooks } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('organization_id', organizationId);

  const totalWebhooks = webhooks?.length || 0;
  const activeWebhooks = webhooks?.filter((w: any) => w.enabled).length || 0;

  // Get delivery stats
  const { data: deliveries } = await supabase
    .from('webhook_deliveries')
    .select('*, webhook_configs!webhook_id(organization_id)')
    .eq('webhook_configs.organization_id', organizationId);

  const totalDeliveries = deliveries?.length || 0;
  const successfulDeliveries =
    deliveries?.filter((d: any) => d.status === 'success').length || 0;
  const failedDeliveries =
    deliveries?.filter((d: any) => d.status === 'failed').length || 0;
  const successRate =
    totalDeliveries > 0
      ? Math.round((successfulDeliveries / totalDeliveries) * 100)
      : 0;

  // Group by event type
  const deliveriesByEvent: Record<string, number> = {};
  deliveries?.forEach((delivery: any) => {
    deliveriesByEvent[delivery.event] =
      (deliveriesByEvent[delivery.event] || 0) + 1;
  });

  return {
    totalWebhooks,
    activeWebhooks,
    totalDeliveries,
    successfulDeliveries,
    failedDeliveries,
    successRate,
    deliveriesByEvent: deliveriesByEvent as Record<WebhookEvent, number>,
  };
}

/**
 * Verify webhook signature (for receiving webhooks from external systems)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * Retry failed webhook deliveries
 */
export async function retryFailedDelivery(deliveryId: string): Promise<void> {
  const supabase = await createClient();

  const { data: delivery } = await supabase
    .from('webhook_deliveries')
    .select('*, webhook_configs!webhook_id(*)')
    .eq('id', deliveryId)
    .single();

  if (!delivery || !delivery.webhook_configs) {
    throw new Error('Delivery or webhook not found');
  }

  await deliverWebhook(
    delivery.webhook_configs,
    delivery.payload,
    delivery.attempts + 1,
  );
}

/**
 * =========================================================
 * Webhook Relay Integration
 * =========================================================
 * Relay FormaOS events to external webhook URLs (Zapier, Make, custom)
 * with HMAC signature verification, retry logic, and Zapier-compatible
 * payload formatting.
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/audit-trail';
import crypto from 'crypto';
import dns from 'dns/promises';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * All event types that can be relayed to external systems.
 * Uses dot-notation to match the existing WebhookEvent convention
 * defined in lib/webhooks.ts.
 */
export type RelayEventType =
  | 'member.added'
  | 'member.removed'
  | 'task.created'
  | 'task.completed'
  | 'evidence.uploaded'
  | 'evidence.verified'
  | 'policy.published'
  | 'incident.created'
  | 'compliance.score_changed';

/** Friendly labels used for UI / documentation */
export const RELAY_EVENT_LABELS: Record<RelayEventType, string> = {
  'member.added': 'Member Added',
  'member.removed': 'Member Removed',
  'task.created': 'Task Created',
  'task.completed': 'Task Completed',
  'evidence.uploaded': 'Evidence Uploaded',
  'evidence.verified': 'Evidence Verified',
  'policy.published': 'Policy Published',
  'incident.created': 'Incident Created',
  'compliance.score_changed': 'Compliance Score Changed',
};

/** All valid relay event types as a set (for runtime validation) */
export const VALID_RELAY_EVENTS = new Set<string>(
  Object.keys(RELAY_EVENT_LABELS),
);

/**
 * Provider hint stored alongside the webhook so the relay can apply
 * provider-specific quirks when formatting the outgoing payload.
 */
export type WebhookProvider = 'zapier' | 'make' | 'custom';

/** Persisted configuration for a single outbound relay webhook */
export interface RelayWebhookConfig {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  secret: string;
  provider: WebhookProvider;
  events: RelayEventType[];
  enabled: boolean;
  retry_count: number;
  headers: Record<string, string>;
  description?: string;
  created_at: string;
  updated_at: string;
}

/** The top-level payload format delivered to subscribers */
export interface RelayPayload {
  event: RelayEventType;
  timestamp: string;
  organization_id: string;
  data: Record<string, unknown>;
  signature: string;
}

/** Individual delivery attempt record */
export interface RelayDelivery {
  id: string;
  webhook_id: string;
  event: RelayEventType;
  payload: RelayPayload;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  response_code?: number;
  response_body?: string;
  error_message?: string;
  attempts: number;
  next_retry_at?: string;
  delivered_at?: string;
  created_at: string;
}

/** Input when creating a new relay webhook */
export interface CreateRelayWebhookInput {
  name: string;
  url: string;
  provider?: WebhookProvider;
  events: RelayEventType[];
  enabled?: boolean;
  retry_count?: number;
  headers?: Record<string, string>;
  description?: string;
}

/** Input when updating a relay webhook */
export interface UpdateRelayWebhookInput {
  name?: string;
  url?: string;
  provider?: WebhookProvider;
  events?: RelayEventType[];
  enabled?: boolean;
  retry_count?: number;
  headers?: Record<string, string>;
  description?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RETRY_COUNT = 5;
const DEFAULT_RETRY_COUNT = 3;
const DELIVERY_TIMEOUT_MS = 30_000; // 30 seconds
const MAX_RESPONSE_BODY_LENGTH = 1_000;
const SIGNATURE_HEADER = 'X-FormaOS-Signature';
const EVENT_HEADER = 'X-FormaOS-Event';
const DELIVERY_HEADER = 'X-FormaOS-Delivery';
const USER_AGENT = 'FormaOS-WebhookRelay/1.0';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate HMAC-SHA256 hex signature for a payload string */
function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/** Verify an incoming HMAC-SHA256 signature (timing-safe) */
export function verifyRelaySignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = generateSignature(payload, secret);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

/** Compute exponential backoff delay: 2^attempt * 1000ms */
function backoffDelay(attempt: number): number {
  return Math.pow(2, attempt) * 1000;
}

/**
 * Returns true when the IP address falls within a private/internal/reserved range.
 * Blocks RFC 1918, loopback, link-local, CGNAT, and other non-routable ranges.
 */
function isPrivateIp(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (
    parts.length === 4 &&
    parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)
  ) {
    if (parts[0] === 10) return true; // 10.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 127) return true; // 127.0.0.0/8
    if (parts[0] === 169 && parts[1] === 254) return true; // link-local
    if (parts[0] === 0) return true; // 0.0.0.0/8
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true; // CGNAT
    if (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19)) return true; // benchmark
  }
  // IPv6 loopback & private ranges
  if (
    ip === '::1' ||
    ip === '::' ||
    ip.startsWith('fe80:') ||
    ip.startsWith('fc') ||
    ip.startsWith('fd')
  ) {
    return true;
  }
  return false;
}

/**
 * Returns true when the hostname itself is a known private name (before DNS).
 */
function isPrivateHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '[::1]') return true;
  return isPrivateIp(hostname);
}

/**
 * Resolve a hostname and verify none of its addresses point to private ranges.
 * Returns true only if ALL resolved addresses are public.
 */
async function isPublicHostnameResolved(hostname: string): Promise<boolean> {
  if (isPrivateIp(hostname)) return false;

  try {
    const [ipv4Result, ipv6Result] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolve6(hostname),
    ]);

    const addresses: string[] = [];
    if (ipv4Result.status === 'fulfilled') addresses.push(...ipv4Result.value);
    if (ipv6Result.status === 'fulfilled') addresses.push(...ipv6Result.value);

    if (addresses.length === 0) return false;

    for (const addr of addresses) {
      if (isPrivateIp(addr)) {
        console.warn('[WebhookRelay][SSRF] DNS resolved to private IP', {
          hostname,
          resolvedIp: addr,
        });
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that a URL is a plausible webhook endpoint.
 * Must be HTTPS. Private/internal IPs are blocked in production.
 * Localhost only allowed in development.
 * In production, DNS-resolves the hostname to block rebinding attacks.
 */
export async function isValidWebhookUrl(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const isDev = process.env.NODE_ENV !== 'production';

    // In production, block all private/internal targets (SSRF prevention)
    if (!isDev && isPrivateHostname(parsed.hostname)) {
      return false;
    }

    if (parsed.protocol === 'https:') {
      // In production, also resolve DNS and verify the target IP
      if (!isDev) {
        const isPublic = await isPublicHostnameResolved(parsed.hostname);
        if (!isPublic) return false;
      }
      return true;
    }

    // Allow localhost only in non-production environments
    if (
      isDev &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Validate an array of event strings against the known set.
 * Returns an array of invalid event names (empty means all valid).
 */
export function validateRelayEvents(events: string[]): string[] {
  return events.filter((e) => !VALID_RELAY_EVENTS.has(e));
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/**
 * Register a new relay webhook for an organization.
 * Generates a unique HMAC secret on creation.
 */
export async function createRelayWebhook(
  organizationId: string,
  input: CreateRelayWebhookInput,
): Promise<RelayWebhookConfig> {
  const supabase = await createClient();
  const secret = crypto.randomBytes(32).toString('hex');

  const { data, error } = await supabase
    .from('webhook_configs')
    .insert({
      organization_id: organizationId,
      name: input.name,
      url: input.url,
      secret,
      events: input.events,
      enabled: input.enabled ?? true,
      retry_count: Math.min(
        input.retry_count ?? DEFAULT_RETRY_COUNT,
        MAX_RETRY_COUNT,
      ),
      headers: input.headers ?? {},
      metadata: {
        provider: input.provider ?? 'custom',
        description: input.description ?? '',
        relay: true,
      },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create relay webhook: ${error.message}`);
  }

  await logActivity(
    organizationId,
    '', // system action
    'create',
    'organization',
    {
      entityId: data.id,
      entityName: input.name,
      details: {
        events: input.events,
        provider: input.provider ?? 'custom',
        type: 'webhook_relay',
      },
    },
  );

  return mapRowToConfig(data);
}

/**
 * List all relay webhooks for an organization.
 * Optionally filter by enabled status.
 */
export async function listRelayWebhooks(
  organizationId: string,
  options?: { enabled?: boolean },
): Promise<RelayWebhookConfig[]> {
  const supabase = await createClient();

  let query = supabase
    .from('webhook_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.enabled !== undefined) {
    query = query.eq('enabled', options.enabled);
  }

  const { data, error } = await query;

  if (error) return [];

  return (data ?? []).map(mapRowToConfig);
}

/**
 * Fetch a single relay webhook by ID.
 * Returns null when not found.
 */
export async function getRelayWebhook(
  webhookId: string,
): Promise<RelayWebhookConfig | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('id', webhookId)
    .maybeSingle();

  if (error || !data) return null;

  return mapRowToConfig(data);
}

/**
 * Update fields on an existing relay webhook.
 */
export async function updateRelayWebhook(
  webhookId: string,
  input: UpdateRelayWebhookInput,
): Promise<RelayWebhookConfig> {
  const supabase = await createClient();

  // Build the update payload, only including defined fields
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.url !== undefined) updates.url = input.url;
  if (input.events !== undefined) updates.events = input.events;
  if (input.enabled !== undefined) updates.enabled = input.enabled;
  if (input.headers !== undefined) updates.headers = input.headers;
  if (input.retry_count !== undefined) {
    updates.retry_count = Math.min(input.retry_count, MAX_RETRY_COUNT);
  }

  // Provider / description live inside the JSONB metadata column
  if (input.provider !== undefined || input.description !== undefined) {
    const existing = await getRelayWebhook(webhookId);
    const meta: Record<string, unknown> = {
      relay: true,
      provider: input.provider ?? existing?.provider ?? 'custom',
      description: input.description ?? existing?.description ?? '',
    };
    updates.metadata = meta;
  }

  const { data, error } = await supabase
    .from('webhook_configs')
    .update(updates)
    .eq('id', webhookId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update relay webhook: ${error.message}`);
  }

  return mapRowToConfig(data);
}

/**
 * Delete a relay webhook by ID.
 */
export async function deleteRelayWebhook(webhookId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('webhook_configs')
    .delete()
    .eq('id', webhookId);

  if (error) {
    throw new Error(`Failed to delete relay webhook: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

/**
 * Relay an event to all enabled webhooks subscribed to that event type.
 * Runs deliveries concurrently and does not throw on partial failures.
 */
export async function relayEvent(
  organizationId: string,
  event: RelayEventType,
  data: Record<string, unknown>,
): Promise<{ delivered: number; failed: number }> {
  const supabase = await createClient();

  // Fetch all enabled webhooks that include this event
  const { data: webhooks } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('enabled', true)
    .contains('events', [event]);

  if (!webhooks || webhooks.length === 0) {
    return { delivered: 0, failed: 0 };
  }

  const configs = webhooks.map(mapRowToConfig);

  // Build the shared payload skeleton (signature added per-webhook)
  const timestamp = new Date().toISOString();

  const results = await Promise.allSettled(
    configs.map((config: RelayWebhookConfig) => {
      const payloadBody = {
        event,
        timestamp,
        organization_id: organizationId,
        data,
      };
      const payloadString = JSON.stringify(payloadBody);
      const signature = generateSignature(payloadString, config.secret);

      const payload: RelayPayload = {
        ...payloadBody,
        signature,
      };

      return deliverRelay(config, payload);
    }),
  );

  let delivered = 0;
  let failed = 0;
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.status === 'success') {
      delivered++;
    } else {
      failed++;
    }
  }

  // Log relay event to integration_events table
  await supabase.from('integration_events').insert({
    organization_id: organizationId,
    provider: 'webhook_relay',
    event_type: event,
    metadata: { delivered, failed, total: configs.length },
    created_at: new Date().toISOString(),
  });

  return { delivered, failed };
}

/**
 * Deliver a payload to a single webhook endpoint, with retry logic.
 * Retries use exponential backoff: 2s, 4s, 8s, ...
 */
async function deliverRelay(
  config: RelayWebhookConfig,
  payload: RelayPayload,
  attempt = 1,
): Promise<RelayDelivery> {
  // SSRF: re-validate the target URL (including DNS) before every delivery
  const urlSafe = await isValidWebhookUrl(config.url);
  if (!urlSafe) {
    console.warn('[WebhookRelay][SSRF] Blocked delivery to unsafe URL', {
      webhookId: config.id,
      url: config.url,
    });
    return {
      id: '',
      webhook_id: config.id,
      event: payload.event,
      payload,
      status: 'failed',
      error_message: 'Blocked: URL resolves to private/reserved address',
      attempts: attempt,
      created_at: new Date().toISOString(),
    };
  }

  const supabase = await createClient();

  // Create the delivery record
  const { data: deliveryRecord, error: insertError } = await supabase
    .from('webhook_deliveries')
    .insert({
      webhook_id: config.id,
      event: payload.event,
      payload,
      status: 'pending',
      attempts: attempt,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError || !deliveryRecord) {
    console.error(
      '[WebhookRelay] Failed to create delivery record:',
      insertError,
    );
    return {
      id: '',
      webhook_id: config.id,
      event: payload.event,
      payload,
      status: 'failed',
      error_message: 'Failed to create delivery record',
      attempts: attempt,
      created_at: new Date().toISOString(),
    };
  }

  try {
    const payloadString = JSON.stringify(payload);

    // Build headers – include provider-specific additions
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      [SIGNATURE_HEADER]: payload.signature,
      [EVENT_HEADER]: payload.event,
      [DELIVERY_HEADER]: deliveryRecord.id,
      'User-Agent': USER_AGENT,
      ...config.headers,
    };

    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });

    const responseBody = await response.text().catch(() => '');

    const updateData: Record<string, unknown> = {
      status: response.ok ? 'success' : 'failed',
      response_code: response.status,
      response_body: responseBody.substring(0, MAX_RESPONSE_BODY_LENGTH),
      delivered_at: new Date().toISOString(),
    };

    if (!response.ok) {
      updateData.error_message = `HTTP ${response.status}: ${response.statusText}`;
    }

    await supabase
      .from('webhook_deliveries')
      .update(updateData)
      .eq('id', deliveryRecord.id);

    if (response.ok) {
      return { ...deliveryRecord, ...updateData } as RelayDelivery;
    }

    // Non-2xx — fall through to retry logic below
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('webhook_deliveries')
      .update({
        status: attempt < config.retry_count ? 'retrying' : 'failed',
        error_message: errorMessage,
      })
      .eq('id', deliveryRecord.id);

    // Retry with exponential backoff if attempts remain
    if (attempt < config.retry_count) {
      const delayMs = backoffDelay(attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return deliverRelay(config, payload, attempt + 1);
    }

    return {
      ...deliveryRecord,
      status: 'failed' as const,
      error_message: errorMessage,
      attempts: attempt,
    };
  }
}

// ---------------------------------------------------------------------------
// Test delivery
// ---------------------------------------------------------------------------

/**
 * Send a test event to a specific webhook to confirm connectivity.
 */
export async function testRelayWebhook(webhookId: string): Promise<{
  success: boolean;
  message: string;
  response?: Record<string, unknown>;
}> {
  const config = await getRelayWebhook(webhookId);

  if (!config) {
    return { success: false, message: 'Webhook not found' };
  }

  const timestamp = new Date().toISOString();
  const payloadBody = {
    event: 'task.created' as RelayEventType,
    timestamp,
    organization_id: config.organization_id,
    data: {
      test: true,
      message: 'This is a test webhook delivery from FormaOS',
    },
  };

  const payloadString = JSON.stringify(payloadBody);
  const signature = generateSignature(payloadString, config.secret);

  const payload: RelayPayload = {
    ...payloadBody,
    signature,
  };

  const delivery = await deliverRelay(config, payload);

  return {
    success: delivery.status === 'success',
    message:
      delivery.status === 'success'
        ? `Test delivered successfully (HTTP ${delivery.response_code})`
        : `Test delivery failed: ${delivery.error_message}`,
    response: {
      status: delivery.status,
      responseCode: delivery.response_code,
      responseBody: delivery.response_body,
    },
  };
}

/**
 * Send a test event to an arbitrary URL (before the webhook is persisted).
 * Useful for the "test before save" flow in the UI.
 */
export async function testRelayUrl(
  url: string,
  organizationId: string,
): Promise<{ success: boolean; message: string; responseCode?: number }> {
  // SSRF: validate URL (including DNS resolution) before sending
  const urlSafe = await isValidWebhookUrl(url);
  if (!urlSafe) {
    return {
      success: false,
      message: 'URL is blocked: resolves to a private/reserved address',
    };
  }

  const timestamp = new Date().toISOString();
  const testSecret = crypto.randomBytes(32).toString('hex');

  const payloadBody = {
    event: 'task.created' as RelayEventType,
    timestamp,
    organization_id: organizationId,
    data: {
      test: true,
      message: 'This is a test webhook delivery from FormaOS',
    },
  };

  const payloadString = JSON.stringify(payloadBody);
  const signature = generateSignature(payloadString, testSecret);

  const fullPayload: RelayPayload = {
    ...payloadBody,
    signature,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [SIGNATURE_HEADER]: signature,
        [EVENT_HEADER]: 'task.created',
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify(fullPayload),
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });

    if (response.ok) {
      return {
        success: true,
        message: `Test delivered successfully (HTTP ${response.status})`,
        responseCode: response.status,
      };
    }

    return {
      success: false,
      message: `Endpoint returned HTTP ${response.status}: ${response.statusText}`,
      responseCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ---------------------------------------------------------------------------
// Delivery history
// ---------------------------------------------------------------------------

/**
 * Get delivery history for a specific webhook.
 */
export async function getRelayDeliveries(
  webhookId: string,
  limit = 50,
): Promise<RelayDelivery[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('webhook_deliveries')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

/**
 * Map a raw database row to the strongly-typed RelayWebhookConfig.
 * The `provider` and `description` fields are stored in a JSONB
 * `metadata` column alongside the core webhook fields.
 */
function mapRowToConfig(row: Record<string, any>): RelayWebhookConfig {
  return {
    id: row.id,
    organization_id: row.organization_id,
    name: row.name,
    url: row.url,
    secret: row.secret,
    provider: row.metadata?.provider ?? 'custom',
    events: row.events ?? [],
    enabled: row.enabled,
    retry_count: row.retry_count ?? DEFAULT_RETRY_COUNT,
    headers: row.headers ?? {},
    description: row.metadata?.description ?? '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Sanitize a webhook config for API responses by stripping the secret.
 * Only show a masked version so the full secret is never leaked.
 */
export function sanitizeWebhookForResponse(
  config: RelayWebhookConfig,
): Omit<RelayWebhookConfig, 'secret'> & { secret_preview: string } {
  const { secret, ...rest } = config;
  return {
    ...rest,
    secret_preview: secret ? `${secret.substring(0, 8)}...` : '',
  };
}

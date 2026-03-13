import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/app/app/actions/rbac';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { z } from 'zod';
import { formatZodError } from '@/lib/security/api-validation';
import {
  createRelayWebhook,
  listRelayWebhooks,
  sanitizeWebhookForResponse,
  isValidWebhookUrl,
  validateRelayEvents,
  type CreateRelayWebhookInput,
  type RelayEventType,
} from '@/lib/integrations/webhook-relay';

const VALID_EVENTS = [
  'member.added',
  'member.removed',
  'task.created',
  'task.completed',
  'evidence.uploaded',
  'evidence.verified',
  'policy.published',
  'incident.created',
  'compliance.score_changed',
] as const;

const createWebhookSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Name too long'),
  url: z.string().url('Invalid URL').max(2048, 'URL too long'),
  provider: z.enum(['zapier', 'make', 'custom']).default('custom'),
  events: z.array(z.string().min(1).max(100)).min(1, 'At least one event is required').max(20),
  enabled: z.boolean().default(true),
  retry_count: z.number().int().min(0).max(10).default(3),
  headers: z.record(z.string().max(200), z.string().max(2000)).default({}),
  description: z.string().max(1000).default(''),
});

const log = routeLog('/api/v1/webhooks');

/**
 * =========================================================
 * REST API v1 - Webhooks Endpoint
 * =========================================================
 * GET  /api/v1/webhooks - List registered webhooks for the organization
 * POST /api/v1/webhooks - Register a new webhook URL with event subscriptions
 *
 * Authentication: Bearer token (Supabase JWT)
 * Rate limit: 60 requests per minute
 */

// -----------------------------------------------------------------------
// GET - List webhooks
// -----------------------------------------------------------------------

export async function GET(request: Request) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimitApi(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.resetAt },
        { status: 429 },
      );
    }

    // 2. Authentication & authorization
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Bearer token required' },
        { status: 401 },
      );
    }

    const permissionCtx = await requirePermission('VIEW_CONTROLS');
    if (!permissionCtx) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 },
      );
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const enabledParam = searchParams.get('enabled');
    const enabled =
      enabledParam === 'true'
        ? true
        : enabledParam === 'false'
          ? false
          : undefined;

    // 4. Fetch webhooks
    const webhooks = await listRelayWebhooks(permissionCtx.orgId, { enabled });

    // 5. Return sanitized response (never expose full secret)
    return NextResponse.json({
      webhooks: webhooks.map(sanitizeWebhookForResponse),
      total: webhooks.length,
    });
  } catch (error: unknown) {
    log.error({ err: error }, '[API v1 /webhooks] Unexpected error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------
// POST - Register a new webhook
// -----------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimitApi(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.resetAt },
        { status: 429 },
      );
    }

    // 2. Authentication & authorization
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Bearer token required' },
        { status: 401 },
      );
    }

    // Webhook registration is a privileged write — requires EDIT_CONTROLS (owner/admin only)
    const permissionCtx = await requirePermission('EDIT_CONTROLS');
    if (!permissionCtx) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required to manage webhooks' },
        { status: 403 },
      );
    }

    // 3. Parse & validate request body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = createWebhookSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        formatZodError(parsed.error),
        { status: 400 },
      );
    }

    const { name, url, provider, events, enabled, retry_count, headers, description } = parsed.data;

    if (!(await isValidWebhookUrl(url))) {
      return NextResponse.json(
        { error: 'Invalid webhook URL. Must be HTTPS (or localhost for development).' },
        { status: 400 },
      );
    }

    const invalidEvents = validateRelayEvents(events);
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid event types: ${invalidEvents.join(', ')}`,
          valid_events: VALID_EVENTS,
        },
        { status: 400 },
      );
    }

    // 4. Create webhook
    const input: CreateRelayWebhookInput = {
      name,
      url,
      provider,
      events: events as RelayEventType[],
      enabled,
      retry_count,
      headers,
      description,
    };

    const webhook = await createRelayWebhook(permissionCtx.orgId, input);

    // 5. Return created webhook (include full secret only on creation)
    return NextResponse.json(
      {
        webhook: {
          ...sanitizeWebhookForResponse(webhook),
          // Expose full secret ONLY on creation so the caller can store it
          secret: webhook.secret,
        },
        message:
          'Webhook created successfully. Store the secret securely — it will not be shown again.',
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    log.error({ err: error }, '[API v1 /webhooks] Unexpected error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/app/app/actions/rbac';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import {
  createRelayWebhook,
  listRelayWebhooks,
  sanitizeWebhookForResponse,
  isValidWebhookUrl,
  validateRelayEvents,
  type CreateRelayWebhookInput,
  type RelayEventType,
} from '@/lib/integrations/webhook-relay';

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
      enabledParam === 'true' ? true : enabledParam === 'false' ? false : undefined;

    // 4. Fetch webhooks
    const webhooks = await listRelayWebhooks(permissionCtx.orgId, { enabled });

    // 5. Return sanitized response (never expose full secret)
    return NextResponse.json({
      webhooks: webhooks.map(sanitizeWebhookForResponse),
      total: webhooks.length,
    });
  } catch (error: any) {
    console.error('[API v1 /webhooks] Unexpected error:', error);
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

    const permissionCtx = await requirePermission('VIEW_CONTROLS');
    if (!permissionCtx) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 },
      );
    }

    // 3. Parse & validate request body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const { name, url, provider, events, enabled, retry_count, headers, description } =
      body as Record<string, any>;

    // Required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid field: name' },
        { status: 400 },
      );
    }

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid field: url' },
        { status: 400 },
      );
    }

    if (!isValidWebhookUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid webhook URL. Must be HTTPS (or localhost for development).' },
        { status: 400 },
      );
    }

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid field: events. Must be a non-empty array of event types.' },
        { status: 400 },
      );
    }

    const invalidEvents = validateRelayEvents(events);
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid event types: ${invalidEvents.join(', ')}`,
          valid_events: [
            'member.added',
            'member.removed',
            'task.created',
            'task.completed',
            'evidence.uploaded',
            'evidence.verified',
            'policy.published',
            'incident.created',
            'compliance.score_changed',
          ],
        },
        { status: 400 },
      );
    }

    if (provider && !['zapier', 'make', 'custom'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be one of: zapier, make, custom' },
        { status: 400 },
      );
    }

    // 4. Create webhook
    const input: CreateRelayWebhookInput = {
      name: name.trim(),
      url,
      provider: provider ?? 'custom',
      events: events as RelayEventType[],
      enabled: enabled ?? true,
      retry_count: retry_count ?? 3,
      headers: headers ?? {},
      description: description ?? '',
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
        message: 'Webhook created successfully. Store the secret securely — it will not be shown again.',
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('[API v1 /webhooks] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

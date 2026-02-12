import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/app/app/actions/rbac';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import {
  getRelayWebhook,
  updateRelayWebhook,
  deleteRelayWebhook,
  getRelayDeliveries,
  sanitizeWebhookForResponse,
  isValidWebhookUrl,
  validateRelayEvents,
  type UpdateRelayWebhookInput,
  type RelayEventType,
} from '@/lib/integrations/webhook-relay';

/**
 * =========================================================
 * REST API v1 - Webhook Detail Endpoint
 * =========================================================
 * GET    /api/v1/webhooks/:id - Get webhook details + recent deliveries
 * PATCH  /api/v1/webhooks/:id - Update webhook subscriptions / config
 * DELETE /api/v1/webhooks/:id - Remove webhook
 *
 * Authentication: Bearer token (Supabase JWT)
 * Rate limit: 60 requests per minute
 */

type RouteContext = { params: Promise<{ id: string }> };

// -----------------------------------------------------------------------
// GET - Webhook details
// -----------------------------------------------------------------------

export async function GET(request: Request, context: RouteContext) {
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

    // 3. Fetch webhook
    const { id } = await context.params;
    const webhook = await getRelayWebhook(id);

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 },
      );
    }

    // Verify organization ownership
    if (webhook.organization_id !== permissionCtx.orgId) {
      return NextResponse.json(
        { error: 'Forbidden - Webhook belongs to a different organization' },
        { status: 403 },
      );
    }

    // 4. Optionally include recent deliveries
    const { searchParams } = new URL(request.url);
    const includeDeliveries = searchParams.get('include_deliveries') === 'true';
    const deliveryLimit = Math.min(
      parseInt(searchParams.get('delivery_limit') || '20'),
      100,
    );

    const deliveries = includeDeliveries
      ? await getRelayDeliveries(id, deliveryLimit)
      : undefined;

    // 5. Return sanitized response
    return NextResponse.json({
      webhook: sanitizeWebhookForResponse(webhook),
      ...(deliveries !== undefined && {
        deliveries,
        delivery_count: deliveries.length,
      }),
    });
  } catch (error: any) {
    console.error('[API v1 /webhooks/:id] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------
// PATCH - Update webhook
// -----------------------------------------------------------------------

export async function PATCH(request: Request, context: RouteContext) {
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

    // 3. Verify webhook exists and belongs to the organization
    const { id } = await context.params;
    const existing = await getRelayWebhook(id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 },
      );
    }

    if (existing.organization_id !== permissionCtx.orgId) {
      return NextResponse.json(
        { error: 'Forbidden - Webhook belongs to a different organization' },
        { status: 403 },
      );
    }

    // 4. Parse & validate request body
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

    // Validate individual fields if provided
    if (url !== undefined) {
      if (typeof url !== 'string' || !isValidWebhookUrl(url)) {
        return NextResponse.json(
          { error: 'Invalid webhook URL. Must be HTTPS (or localhost for development).' },
          { status: 400 },
        );
      }
    }

    if (events !== undefined) {
      if (!Array.isArray(events) || events.length === 0) {
        return NextResponse.json(
          { error: 'events must be a non-empty array of event types' },
          { status: 400 },
        );
      }

      const invalidEvents = validateRelayEvents(events);
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: `Invalid event types: ${invalidEvents.join(', ')}` },
          { status: 400 },
        );
      }
    }

    if (provider !== undefined && !['zapier', 'make', 'custom'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be one of: zapier, make, custom' },
        { status: 400 },
      );
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'name must be a non-empty string' },
        { status: 400 },
      );
    }

    // 5. Build update input
    const input: UpdateRelayWebhookInput = {};
    if (name !== undefined) input.name = name.trim();
    if (url !== undefined) input.url = url;
    if (provider !== undefined) input.provider = provider;
    if (events !== undefined) input.events = events as RelayEventType[];
    if (enabled !== undefined) input.enabled = enabled;
    if (retry_count !== undefined) input.retry_count = retry_count;
    if (headers !== undefined) input.headers = headers;
    if (description !== undefined) input.description = description;

    // 6. Update
    const updated = await updateRelayWebhook(id, input);

    return NextResponse.json({
      webhook: sanitizeWebhookForResponse(updated),
      message: 'Webhook updated successfully',
    });
  } catch (error: any) {
    console.error('[API v1 /webhooks/:id] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------
// DELETE - Remove webhook
// -----------------------------------------------------------------------

export async function DELETE(request: Request, context: RouteContext) {
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

    // 3. Verify webhook exists and belongs to the organization
    const { id } = await context.params;
    const existing = await getRelayWebhook(id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 },
      );
    }

    if (existing.organization_id !== permissionCtx.orgId) {
      return NextResponse.json(
        { error: 'Forbidden - Webhook belongs to a different organization' },
        { status: 403 },
      );
    }

    // 4. Delete
    await deleteRelayWebhook(id);

    return NextResponse.json({
      message: 'Webhook deleted successfully',
      id,
    });
  } catch (error: any) {
    console.error('[API v1 /webhooks/:id] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

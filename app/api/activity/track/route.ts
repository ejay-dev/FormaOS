/**
 * Activity Tracking API
 *
 * Logs high-level user actions for admin visibility
 * Called from client on key actions (navigation, exports, role changes, etc.)
 * Rate limited: 20 requests per minute per user
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logUserActivity } from '@/lib/security/event-logger';
import { extractClientIP } from '@/lib/security/session-security';
import { checkRateLimit, createRateLimitHeaders, createRateLimitedResponse } from '@/lib/security/rate-limiter';

const RATE_LIMITS = {
  ACTIVITY: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // Allow 20 activity logs per minute
    keyPrefix: 'rl:activity',
  },
};

const ALLOWED_ACTIONS = [
  'page_view',
  'export_report',
  'export_compliance',
  'role_change',
  'invite_sent',
  'user_deleted',
  'control_updated',
  'framework_added',
  'bulk_action',
  'api_key_created',
  'webhook_configured',
] as const;

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    // Rate limit check
    const headers = request.headers;
    const ip = extractClientIP(headers);
    const rateLimitResult = await checkRateLimit(
      RATE_LIMITS.ACTIVITY,
      ip,
      user.id,
    );

    if (!rateLimitResult.success) {
      return createRateLimitedResponse(
        'Too many activity tracking requests. Please slow down.',
        429,
        createRateLimitHeaders(rateLimitResult),
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      entityType?: string;
      entityId?: string;
      route?: string;
      metadata?: Record<string, any>;
    };

    // Validate action
    if (!body.action || !ALLOWED_ACTIONS.includes(body.action as any)) {
      return NextResponse.json(
        { ok: false, error: 'invalid_action' },
        { status: 400 },
      );
    }

    // Get org context if available
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    const success = await logUserActivity({
      userId: user.id,
      orgId: membership?.organization_id,
      action: body.action,
      entityType: body.entityType,
      entityId: body.entityId,
      route: body.route,
      metadata: body.metadata,
    });

    if (!success) {
      return NextResponse.json(
        { ok: false, error: 'log_failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Activity] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    );
  }
}

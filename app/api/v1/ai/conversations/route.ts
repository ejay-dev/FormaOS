import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { isMissingSupabaseTableError } from '@/lib/supabase/schema-compat';
import { requireEntitlement } from '@/lib/billing/entitlements';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/ai/conversations');

/**
 * =========================================================
 * REST API v1 - AI Conversations CRUD
 * =========================================================
 * GET  /api/v1/ai/conversations - List conversations (paginated, most recent first)
 * POST /api/v1/ai/conversations - Create a new conversation
 *
 * Authentication: Bearer token (Supabase JWT)
 * Rate limit: 100 requests per minute (standard API limit)
 */

// -----------------------------------------------------------------------
// GET - List conversations
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

    // 2. Authentication
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

    // 3. Resolve active org (audit 2026-05-26: strict — 409 for
    //    multi-org users without preference).
    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) return ctx.response;
    const { orgId } = ctx;
    try {
      await requireEntitlement(orgId, 'ai_assistant');
    } catch {
      return NextResponse.json(
        { error: 'AI assistant requires an active AI entitlement.' },
        { status: 403 },
      );
    }

    // 4. Parse pagination
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);
    const includeArchived = searchParams.get('include_archived') === 'true';

    // 5. Query conversations
    const admin = createSupabaseAdminClient();
    let query = admin
      .from('ai_chat_conversations')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeArchived) {
      query = query.is('archived_at', null);
    }

    const { data, count, error } = await query;

    if (error) {
      if (isMissingSupabaseTableError(error, 'ai_chat_conversations')) {
        return NextResponse.json({
          items: [],
          total: 0,
          persistenceAvailable: false,
        });
      }
      log.error({ err: error }, '[API v1 /ai/conversations] Query error:');
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      items: data ?? [],
      total: count ?? 0,
      persistenceAvailable: true,
    });
  } catch (error: unknown) {
    log.error({ err: error }, '[API v1 /ai/conversations] Unexpected error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------
// POST - Create a new conversation
// -----------------------------------------------------------------------

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimitApi(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.resetAt },
        { status: 429 },
      );
    }

    // 2. Authentication
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

    // 3. Resolve active org (audit 2026-05-26: strict — 409 for
    //    multi-org users without preference).
    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) return ctx.response;
    const { orgId } = ctx;
    try {
      await requireEntitlement(orgId, 'ai_assistant');
    } catch {
      return NextResponse.json(
        { error: 'AI assistant requires an active AI entitlement.' },
        { status: 403 },
      );
    }

    // 4. Parse optional title from body
    let title = 'New conversation';
    try {
      const body = (await request.json()) as Record<string, unknown>;
      if (typeof body.title === 'string' && body.title.trim()) {
        title = body.title.trim().slice(0, 200);
      }
    } catch {
      // Body is optional for POST; default title is used
    }

    // 5. Create conversation
    const admin = createSupabaseAdminClient();
    const { data: conversation, error } = await admin
      .from('ai_chat_conversations')
      .insert({
        organization_id: orgId,
        user_id: user.id,
        title,
      })
      .select('*')
      .single();

    if (error || !conversation) {
      if (isMissingSupabaseTableError(error, 'ai_chat_conversations')) {
        return NextResponse.json(
          { error: 'AI conversation history is unavailable for this workspace' },
          { status: 503 },
        );
      }
      log.error({ err: error }, '[API v1 /ai/conversations] Insert error:');
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 },
      );
    }

    return NextResponse.json(conversation, { status: 201 });
  } catch (error: unknown) {
    log.error({ err: error }, '[API v1 /ai/conversations] Unexpected error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

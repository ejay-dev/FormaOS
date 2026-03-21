import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { isMissingSupabaseTableError } from '@/lib/supabase/schema-compat';

/**
 * =========================================================
 * REST API v1 - AI Conversation Detail
 * =========================================================
 * GET    /api/v1/ai/conversations/:id - Fetch conversation with messages (paginated)
 * PATCH  /api/v1/ai/conversations/:id - Update title or archive
 * DELETE /api/v1/ai/conversations/:id - Hard delete conversation and messages
 *
 * Authentication: Bearer token (Supabase JWT)
 * Rate limit: 100 requests per minute (standard API limit)
 */

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Authenticate user and verify they own the conversation.
 * Returns the conversation data or an error response.
 */
async function authenticateAndGetConversation(request: Request, conversationId: string) {
  // Rate limiting
  const rateLimitResult = await rateLimitApi(request);
  if (!rateLimitResult.success) {
    return {
      error: NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.resetAt },
        { status: 429 },
      ),
    };
  }

  // Authentication
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Bearer token required' },
        { status: 401 },
      ),
    };
  }

  // Get org membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.organization_id) {
    return {
      error: NextResponse.json(
        { error: 'Organization context not found' },
        { status: 403 },
      ),
    };
  }

  const orgId = membership.organization_id as string;
  const admin = createSupabaseAdminClient();

  // Verify conversation belongs to user and org
  const { data: conversation, error: conversationError } = await admin
    .from('ai_chat_conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (isMissingSupabaseTableError(conversationError, 'ai_chat_conversations')) {
    return {
      error: NextResponse.json(
        { error: 'Conversation history is unavailable for this workspace' },
        { status: 404 },
      ),
    };
  }

  if (conversationError || !conversation) {
    return {
      error: NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 },
      ),
    };
  }

  return { conversation, admin, userId: user.id, orgId };
}

// -----------------------------------------------------------------------
// GET - Fetch conversation with messages
// -----------------------------------------------------------------------

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await authenticateAndGetConversation(request, id);

    if ('error' in auth && auth.error) {
      return auth.error;
    }

    const { conversation, admin } = auth;

    // Parse pagination for messages
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

    // Fetch messages
    const { data: messages, count, error } = await admin
      .from('ai_chat_messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (isMissingSupabaseTableError(error, 'ai_chat_messages')) {
      return NextResponse.json({
        conversation,
        messages: {
          items: [],
          total: 0,
        },
        persistenceAvailable: false,
      });
    }

    return NextResponse.json({
      conversation,
      messages: {
        items: messages ?? [],
        total: count ?? 0,
      },
      persistenceAvailable: true,
    });
  } catch (error: unknown) {
    console.error('[API v1 /ai/conversations/:id] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------
// PATCH - Update title or archive
// -----------------------------------------------------------------------

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await authenticateAndGetConversation(request, id);

    if ('error' in auth && auth.error) {
      return auth.error;
    }

    const { admin } = auth;

    // Parse body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Update title
    if (typeof body.title === 'string') {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json(
          { error: 'title must be a non-empty string' },
          { status: 400 },
        );
      }
      updates.title = title.slice(0, 200);
    }

    // Archive / unarchive
    if (body.archived === true) {
      updates.archived_at = new Date().toISOString();
    } else if (body.archived === false) {
      updates.archived_at = null;
    }

    const { data: updated, error } = await admin
      .from('ai_chat_conversations')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !updated) {
      if (isMissingSupabaseTableError(error, 'ai_chat_conversations')) {
        return NextResponse.json(
          { error: 'Conversation history is unavailable for this workspace' },
          { status: 404 },
        );
      }
      console.error('[API v1 /ai/conversations/:id] PATCH error:', error);
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 },
      );
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('[API v1 /ai/conversations/:id] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------
// DELETE - Hard delete conversation and messages (cascade)
// -----------------------------------------------------------------------

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await authenticateAndGetConversation(request, id);

    if ('error' in auth && auth.error) {
      return auth.error;
    }

    const { admin } = auth;

    // Delete conversation (messages cascade via FK)
    const { error } = await admin
      .from('ai_chat_conversations')
      .delete()
      .eq('id', id);

    if (error) {
      if (isMissingSupabaseTableError(error, 'ai_chat_conversations')) {
        return NextResponse.json(
          { message: 'Conversation history is unavailable for this workspace', id },
          { status: 200 },
        );
      }
      console.error('[API v1 /ai/conversations/:id] DELETE error:', error);
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Conversation deleted successfully',
      id,
    });
  } catch (error: unknown) {
    console.error('[API v1 /ai/conversations/:id] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

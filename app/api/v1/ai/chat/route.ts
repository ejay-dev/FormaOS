import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildComplianceContext } from '@/lib/ai/compliance-context';
import { createComplianceStream, isAIConfigured } from '@/lib/ai/streaming';
import { PROMPT_TEMPLATES } from '@/lib/ai/prompt-templates';
import { hasPermission, normalizeRole } from '@/app/app/actions/rbac';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { isMissingSupabaseTableError } from '@/lib/supabase/schema-compat';

/**
 * =========================================================
 * REST API v1 - AI Compliance Chat (Streaming)
 * =========================================================
 * POST /api/v1/ai/chat - Send a message and receive a streamed AI response
 *
 * Authentication: Bearer token (Supabase JWT)
 * Rate limit: 100 requests per minute (standard API limit)
 */

export async function POST(request: Request) {
  try {
    // 1. Check if AI is configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI assistant is not configured. OPENAI_API_KEY is missing.' },
        { status: 503 },
      );
    }

    // 2. Rate limiting
    const rateLimitResult = await rateLimitApi(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.resetAt },
        { status: 429 },
      );
    }

    // 3. Authentication
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

    // 4. Get org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      return NextResponse.json(
        { error: 'Organization context not found' },
        { status: 403 },
      );
    }

    const orgId = membership.organization_id as string;
    const role = normalizeRole(membership.role as string | null);

    // 5. Parse request body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const templateId = typeof body.templateId === 'string' ? body.templateId : undefined;
    let conversationId = typeof body.conversationId === 'string' ? body.conversationId : undefined;

    if (!message) {
      return NextResponse.json(
        { error: 'message is required and must be a non-empty string' },
        { status: 400 },
      );
    }

    // 6. If templateId provided, verify user has the required permission
    let templateSuffix = '';
    if (templateId) {
      const template = PROMPT_TEMPLATES.find((t) => t.id === templateId);
      if (!template) {
        return NextResponse.json(
          { error: `Unknown template: ${templateId}` },
          { status: 400 },
        );
      }
      if (!hasPermission(role, template.requiredPermission)) {
        return NextResponse.json(
          { error: `Forbidden - Missing permission ${template.requiredPermission} for this template` },
          { status: 403 },
        );
      }
      templateSuffix = `\n\n${template.systemPromptSuffix}`;
    }

    const admin = createSupabaseAdminClient();
    let persistenceAvailable = true;

    // 7. Create conversation if none provided
    if (!conversationId) {
      const { data: newConversation, error: convError } = await admin
        .from('ai_chat_conversations')
        .insert({
          organization_id: orgId,
          user_id: user.id,
          title: message.slice(0, 100),
        })
        .select('id')
        .single();

      if (isMissingSupabaseTableError(convError, 'ai_chat_conversations')) {
        persistenceAvailable = false;
      } else if (convError || !newConversation) {
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 },
        );
      } else {
        conversationId = (newConversation as Record<string, unknown>).id as string;
      }
    } else {
      // Verify conversation belongs to user
      const { data: existingConv, error: existingConvError } = await admin
        .from('ai_chat_conversations')
        .select('id, user_id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (isMissingSupabaseTableError(existingConvError, 'ai_chat_conversations')) {
        persistenceAvailable = false;
      } else if (existingConvError || !existingConv) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 },
        );
      }
    }

    // 8. Save user message
    if (persistenceAvailable && conversationId) {
      const { error: userMessageError } = await admin.from('ai_chat_messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
      });
      if (isMissingSupabaseTableError(userMessageError, 'ai_chat_messages')) {
        persistenceAvailable = false;
      }
    }

    // 9. Load conversation history (last 20 messages)
    let history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (persistenceAvailable && conversationId) {
      const { data: historyRows, error: historyError } = await admin
        .from('ai_chat_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20);

      if (isMissingSupabaseTableError(historyError, 'ai_chat_messages')) {
        persistenceAvailable = false;
      } else {
        history = ((historyRows ?? []) as Array<Record<string, unknown>>)
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content as string,
          }));
      }
    }

    // 10. Build system prompt
    const complianceContext = await buildComplianceContext(orgId);
    const systemPrompt = complianceContext + templateSuffix;

    // 11. Stream response
    const result = createComplianceStream({
      systemPrompt,
      messages: history,
      onFinish: async (finished) => {
        if (!persistenceAvailable || !conversationId) {
          return;
        }

        // Save assistant message
        const { error: assistantMessageError } = await admin.from('ai_chat_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: finished.text,
          metadata: {
            usage: finished.usage,
            templateId: templateId ?? null,
          },
        });
        if (isMissingSupabaseTableError(assistantMessageError, 'ai_chat_messages')) {
          return;
        }

        // Update conversation title from first user message if still default
        const { data: conv, error: conversationFetchError } = await admin
          .from('ai_chat_conversations')
          .select('title')
          .eq('id', conversationId!)
          .maybeSingle();
        if (isMissingSupabaseTableError(conversationFetchError, 'ai_chat_conversations')) {
          return;
        }

        const convTitle = (conv as Record<string, unknown> | null)?.title;
        if (convTitle === 'New conversation') {
          await admin
            .from('ai_chat_conversations')
            .update({
              title: message.slice(0, 100),
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId!);
        } else {
          await admin
            .from('ai_chat_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId!);
        }
      },
    });

    // 12. Return streaming response with conversationId header
    const response = result.toTextStreamResponse();
    if (conversationId) {
      response.headers.set('X-Conversation-Id', conversationId);
    }
    return response;
  } catch (error: unknown) {
    console.error('[API v1 /ai/chat] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

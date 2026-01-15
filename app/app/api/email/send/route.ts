import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, EmailData } from '@/lib/email/send-email';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  rateLimitApi,
  createRateLimitedResponse,
  createRateLimitHeaders,
} from '@/lib/security/rate-limiter';
import { requirePermission } from '@/app/app/actions/rbac';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify user is authenticated
    const { data, error: authError } = await supabase.auth.getUser();

    if (authError || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await rateLimitApi(request, data.user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.resetAt },
        { status: 429 },
      );
    }

    const permissionCtx = await requirePermission('MANAGE_USERS');

    const body = await request.json();
    const emailData = body as EmailData;
    const normalizedEmail = emailData.to?.toLowerCase?.() ?? '';

    if (!normalizedEmail || !emailData.type) {
      return NextResponse.json(
        { error: 'Invalid email payload' },
        { status: 400 },
      );
    }

    if (
      emailData.organizationId &&
      emailData.organizationId !== permissionCtx.orgId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload: EmailData = {
      ...emailData,
      to: normalizedEmail,
      organizationId: emailData.organizationId ?? permissionCtx.orgId,
      userId: emailData.userId ?? data.user.id,
    } as EmailData;

    // Send email
    const result = await sendEmail(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('[API /email/send] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

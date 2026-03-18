import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, EmailData } from '@/lib/email/send-email';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  rateLimitApi,
} from '@/lib/security/rate-limiter';
import { requirePermission } from '@/app/app/actions/rbac';
import {
  emailSchema,
  uuidSchema,
  safeString,
  urlSchema,
  validateBody,
  formatZodError,
} from '@/lib/security/api-validation';
import { z } from 'zod';

const baseSchema = z.object({
  to: emailSchema,
  type: z.enum(['welcome', 'invite', 'alert']),
  organizationId: uuidSchema.optional(),
  userId: uuidSchema.optional(),
});

const emailPayloadSchema = z.discriminatedUnion('type', [
  baseSchema.extend({
    type: z.literal('welcome'),
    userName: safeString({ max: 200 }),
    organizationName: safeString({ max: 200 }),
    loginUrl: urlSchema.optional(),
  }),
  baseSchema.extend({
    type: z.literal('invite'),
    inviterName: safeString({ max: 200 }),
    inviterEmail: emailSchema,
    organizationName: safeString({ max: 200 }),
    inviteUrl: urlSchema,
    role: safeString({ max: 50 }),
  }),
  baseSchema.extend({
    type: z.literal('alert'),
    userName: safeString({ max: 200 }),
    alertType: z.enum(['info', 'warning', 'critical']),
    alertTitle: safeString({ max: 200 }),
    alertMessage: safeString({ max: 2000 }),
    actionUrl: urlSchema.optional(),
    actionText: safeString({ max: 100 }).optional(),
  }),
]);

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

    const parsed = await validateBody(request, emailPayloadSchema);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }

    const emailData = parsed.data as EmailData;
    const normalizedEmail = emailData.to;

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

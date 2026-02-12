import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { emailSchema } from '@/lib/security/api-validation';
import { rateLimitAuth } from '@/lib/security/rate-limiter';
import { sendAuthEmail } from '@/lib/email/send-auth-email';
import { buildHostedAuthConfirmLink } from '@/lib/auth/hosted-auth-link';

export const runtime = 'nodejs';

const DEFAULT_APP_BASE = 'https://app.formaos.com.au';

const resetSchema = z.object({
  email: emailSchema,
});

function getAppBase(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_BASE).trim();
  try {
    return new URL(raw).origin.replace(/\/$/, '');
  } catch {
    return DEFAULT_APP_BASE;
  }
}

export async function POST(request: Request) {
  const { allowed, headers } = await rateLimitAuth(request);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: 'too_many_requests' },
      { status: 429, headers },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'invalid_payload' },
        { status: 400, headers },
      );
    }

    const email = parsed.data.email;
    const appBase = getAppBase();
    const redirectTo = `${appBase}/auth/reset-password`;
    const admin = createSupabaseAdminClient();

    const { data, error } = await (admin as any).auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.warn('[auth/password/reset-request] generateLink failed:', {
        email,
        error: error.message,
      });
      return NextResponse.json(
        {
          ok: true,
          message:
            'If an account exists for this email, a reset link will be sent.',
        },
        { headers },
      );
    }

    const actionLink = buildHostedAuthConfirmLink({
      appBase,
      properties: data?.properties,
      fallbackType: 'recovery',
      fallbackRedirectTo: redirectTo,
    });
    if (!actionLink) {
      return NextResponse.json(
        {
          ok: true,
          message:
            'If an account exists for this email, a reset link will be sent.',
        },
        { headers },
      );
    }

    const emailResult = await sendAuthEmail({
      to: email,
      template: 'password-reset',
      actionLink,
    });

    if (!emailResult.success) {
      console.error('[auth/password/reset-request] email send failed:', {
        email,
        error: emailResult.error,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        message:
          'If an account exists for this email, a reset link will be sent.',
      },
      { headers },
    );
  } catch (error) {
    console.error('[auth/password/reset-request] unexpected error:', error);
    return NextResponse.json(
      {
        ok: true,
        message:
          'If an account exists for this email, a reset link will be sent.',
      },
      { headers },
    );
  }
}

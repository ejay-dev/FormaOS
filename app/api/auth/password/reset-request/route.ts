import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { emailSchema } from '@/lib/security/api-validation';
import { rateLimitAuth } from '@/lib/security/rate-limiter';
import { sendAuthEmail } from '@/lib/email/send-auth-email';
import { buildHostedAuthConfirmLink } from '@/lib/auth/hosted-auth-link';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/auth/password/reset-request');

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
  const { allowed, headers, error } = await rateLimitAuth(request);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: error ?? 'too_many_requests' },
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

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo,
      },
    });

    if (error) {
      log.warn({ data: {
        email,
        error: error.message,
      } }, "[auth/password/reset-request] generateLink failed:");
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
      log.error({ err: {
        email,
        error: emailResult.error,
      } }, "[auth/password/reset-request] email send failed:");
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
    log.error({ err: error }, "[auth/password/reset-request] unexpected error:");
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

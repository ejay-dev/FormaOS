import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { resolvePlanKey } from '@/lib/plans';
import { validatePassword } from '@/lib/security/password-security';
import { emailSchema } from '@/lib/security/api-validation';
import { rateLimitAuth } from '@/lib/security/rate-limiter';
import { sendAuthEmail } from '@/lib/email/send-auth-email';

export const runtime = 'nodejs';

const DEFAULT_APP_BASE = 'https://app.formaos.com.au';

const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(12).max(256),
  plan: z.string().trim().optional().nullable(),
});

function getAppBase(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_BASE).trim();
  try {
    return new URL(raw).origin.replace(/\/$/, '');
  } catch {
    return DEFAULT_APP_BASE;
  }
}

function mapSignupError(message: string): {
  status: number;
  error: string;
} {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('already registered') ||
    normalized.includes('already exists')
  ) {
    return { status: 409, error: 'account_already_exists' };
  }

  if (normalized.includes('rate limit')) {
    return { status: 429, error: 'rate_limited' };
  }

  return { status: 400, error: 'signup_failed' };
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
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'invalid_payload' },
        { status: 400, headers },
      );
    }

    const { email, password } = parsed.data;
    const plan = resolvePlanKey(parsed.data.plan ?? null);

    const validation = await validatePassword(password);
    if (!validation.valid) {
      return NextResponse.json(
        {
          ok: false,
          error: 'password_invalid',
          errors: validation.errors,
          breached: validation.breached,
          breachCount: validation.breachCount,
        },
        { status: 400, headers },
      );
    }

    const appBase = getAppBase();
    const callbackPath = plan
      ? `/auth/callback?plan=${encodeURIComponent(plan)}`
      : '/auth/callback';
    const redirectTo = `${appBase}${callbackPath}`;
    const admin = createSupabaseAdminClient();

    const { data, error } = await (admin as any).auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo,
        data: plan ? { selected_plan: plan } : undefined,
      },
    });

    if (error) {
      const mapped = mapSignupError(error.message || 'signup_failed');
      return NextResponse.json(
        { ok: false, error: mapped.error, message: error.message },
        { status: mapped.status, headers },
      );
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return NextResponse.json(
        { ok: false, error: 'missing_confirmation_link' },
        { status: 500, headers },
      );
    }

    const emailResult = await sendAuthEmail({
      to: email,
      template: 'confirm-signup',
      actionLink,
    });

    if (!emailResult.success) {
      console.error('[auth/email-signup] confirmation email failed:', {
        email,
        error: emailResult.error,
      });
      return NextResponse.json(
        { ok: false, error: 'email_delivery_failed' },
        { status: 502, headers },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        requiresEmailConfirmation: true,
      },
      { headers },
    );
  } catch (error) {
    console.error('[auth/email-signup] unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: 'signup_failed' },
      { status: 500, headers },
    );
  }
}

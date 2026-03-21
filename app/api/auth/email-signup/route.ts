import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { resolvePlanKey } from '@/lib/plans';
import { validatePassword } from '@/lib/security/password-security';
import { emailSchema, requireJsonContentType } from '@/lib/security/api-validation';
import { rateLimitSignup } from '@/lib/security/rate-limiter';
import { sendAuthEmail } from '@/lib/email/send-auth-email';
import { buildHostedAuthConfirmLink } from '@/lib/auth/hosted-auth-link';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/auth/email-signup');

export const runtime = 'nodejs';

const DEFAULT_APP_BASE = 'https://app.formaos.com.au';
const EXTERNAL_STEP_TIMEOUT_MS = 8_000;

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

  if (
    normalized.includes('service unavailable') ||
    normalized.includes('connection timeout') ||
    normalized.includes('upstream connect error')
  ) {
    return { status: 503, error: 'backend_unavailable' };
  }

  return { status: 400, error: 'signup_failed' };
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label}_timeout`)),
      EXTERNAL_STEP_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function POST(request: Request) {
  const { allowed, headers, error } = await rateLimitSignup(request);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: error ?? 'too_many_requests' },
      { status: 429, headers },
    );
  }

  const contentTypeError = requireJsonContentType(request);
  if (contentTypeError) {
    return contentTypeError;
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
    log.info({ plan: plan ?? null }, '[auth/email-signup] request received');

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
    log.info({ plan: plan ?? null }, '[auth/email-signup] generating confirmation link');

    const { data, error } = await withTimeout(
      admin.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
        options: {
          redirectTo,
          data: plan ? { selected_plan: plan } : undefined,
        },
      }),
      'generate_link',
    );

    if (error) {
      const mapped = mapSignupError(error.message || 'signup_failed');
      log.warn({ err: error, mapped }, '[auth/email-signup] generateLink failed');
      return NextResponse.json(
        { ok: false, error: mapped.error },
        { status: mapped.status, headers },
      );
    }

    const actionLink = buildHostedAuthConfirmLink({
      appBase,
      properties: data?.properties,
      fallbackType: 'signup',
      fallbackRedirectTo: redirectTo,
    });
    if (!actionLink) {
      log.error('[auth/email-signup] missing confirmation link');
      return NextResponse.json(
        { ok: false, error: 'missing_confirmation_link' },
        { status: 500, headers },
      );
    }

    log.info('[auth/email-signup] sending confirmation email');
    const emailResult = await withTimeout(
      sendAuthEmail({
        to: email,
        template: 'confirm-signup',
        actionLink,
      }),
      'send_auth_email',
    );

    if (!emailResult.success) {
      log.error({ err: {
        email,
        error: emailResult.error,
      } }, "[auth/email-signup] confirmation email failed:");
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
    log.error({ err: error }, "[auth/email-signup] unexpected error:");
    if (error instanceof Error && error.message === 'generate_link_timeout') {
      return NextResponse.json(
        { ok: false, error: 'backend_unavailable' },
        { status: 503, headers },
      );
    }
    if (error instanceof Error && error.message === 'send_auth_email_timeout') {
      return NextResponse.json(
        { ok: false, error: 'email_delivery_failed' },
        { status: 502, headers },
      );
    }
    return NextResponse.json(
      { ok: false, error: 'signup_failed' },
      { status: 500, headers },
    );
  }
}

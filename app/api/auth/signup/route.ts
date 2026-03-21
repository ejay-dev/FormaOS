import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { resolvePlanKey } from '@/lib/plans';
import { ensureSubscription } from '@/lib/billing/subscriptions';
import { routeLog } from '@/lib/monitoring/server-logger';
import { bootstrapOrganizationAtomic } from '@/lib/supabase/transaction';
import {
  emailSchema,
  requireJsonContentType,
} from '@/lib/security/api-validation';
import { validatePassword } from '@/lib/security/password-security';

const log = routeLog('/api/auth/signup');

export const runtime = 'nodejs';

const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(12).max(256),
  plan: z.string().trim().optional().nullable(),
});

export async function POST(request: Request) {
  const contentTypeError = requireJsonContentType(request);
  if (contentTypeError) {
    return contentTypeError;
  }

  const admin = createSupabaseAdminClient();
  let createdUserId: string | null = null;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'invalid_payload' },
        { status: 400 },
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
        { status: 400 },
      );
    }

    const { data: createdUser, error: createUserError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: null },
      });

    if (createUserError) {
      log.error({ err: createUserError }, "[api/auth/signup] createUser failed:");
      const isEmailTaken =
        createUserError.message?.toLowerCase().includes('already registered') ||
        createUserError.message
          ?.toLowerCase()
          .includes('already been registered');
      return NextResponse.json(
        {
          ok: false,
          error: isEmailTaken
            ? 'email_already_registered'
            : 'user_creation_failed',
        },
        { status: isEmailTaken ? 409 : 500 },
      );
    }

    if (!createdUser.user?.id) {
      return NextResponse.json(
        { ok: false, error: 'user_creation_failed' },
        { status: 500 },
      );
    }

    createdUserId = createdUser.user.id;

    const bootstrapResult = await bootstrapOrganizationAtomic({
      userId: createdUserId,
      userEmail: email,
      orgName: email.split('@')[0],
      planKey: plan ?? 'basic',
    });

    if (bootstrapResult.error || !bootstrapResult.data?.organizationId) {
      log.error(
        { err: bootstrapResult.error },
        "[api/auth/signup] bootstrapOrganizationAtomic failed:",
      );
      if (createdUserId) {
        await admin.auth.admin.deleteUser(createdUserId).catch((cleanupErr) => {
          log.error({ err: cleanupErr }, "[api/auth/signup] auth cleanup failed:");
        });
      }
      return NextResponse.json(
        { ok: false, error: 'organization_creation_failed' },
        { status: 500 },
      );
    }

    const organizationId = bootstrapResult.data.organizationId;

    try {
      await ensureSubscription(organizationId, plan);
    } catch (subErr) {
      log.error({ err: subErr }, "[api/auth/signup] ensureSubscription failed:");
    }

    return NextResponse.json({ ok: true, userId: createdUserId, organizationId });
  } catch (err) {
    log.error({ err: err }, "[api/auth/signup] unexpected error:");
    if (createdUserId) {
      await admin.auth.admin.deleteUser(createdUserId).catch(() => undefined);
    }
    return NextResponse.json(
      { ok: false, error: 'signup_failed' },
      { status: 500 },
    );
  }
}

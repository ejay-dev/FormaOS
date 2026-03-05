import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { resolvePlanKey } from '@/lib/plans';
import { ensureSubscription } from '@/lib/billing/subscriptions';
import { ensureDebugAccess } from '@/app/api/debug/_guard';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/auth/signup');

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const guard = await ensureDebugAccess();
  if (guard) return guard;

  const admin = createSupabaseAdminClient();

  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').toString().trim();
    const password = (body.password || '').toString();
    const plan = resolvePlanKey(body.plan || null);

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'email_and_password_required' },
        { status: 400 },
      );
    }

    // Generate a user id so related rows can be created first
    const userId = randomUUID();

    const now = new Date().toISOString();

    // 1. Create org and membership first (admin client bypasses RLS)
    const { data: organization, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: email.split('@')[0],
        created_by: null,
        plan_key: plan ?? null,
        plan_selected_at: plan ? now : null,
        onboarding_completed: false,
      })
      .select('id')
      .single();

    if (orgError) {
      log.error({ err: orgError }, "[api/auth/signup] organization insert failed:");
      return NextResponse.json(
        { ok: false, error: 'organization_creation_failed' },
        { status: 500 },
      );
    }

    const organizationId = organization.id;

    const { error: memberError } = await admin.from('org_members').insert({
      organization_id: organizationId,
      user_id: userId,
      role: 'owner',
    });

    if (memberError) {
      log.error({ err: memberError, }, "[api/auth/signup] org_members insert failed:");
      return NextResponse.json(
        { ok: false, error: 'membership_creation_failed' },
        { status: 500 },
      );
    }

    const { error: onboardingError } = await admin
      .from('org_onboarding_status')
      .insert({
        organization_id: organizationId,
        current_step: plan ? 1 : 2,
        completed_steps: [],
      });

    if (onboardingError) {
      log.error({ err: onboardingError, }, "[api/auth/signup] org_onboarding_status insert failed:");
      return NextResponse.json(
        { ok: false, error: 'onboarding_setup_failed' },
        { status: 500 },
      );
    }

    // 2. Create auth user with pre-generated id
    const { data: _createdUser, error: createUserError } =
      await admin.auth.admin.createUser({
        id: userId,
        email,
        password,
        user_metadata: { full_name: null },
      });

    if (createUserError) {
      log.error({ err: createUserError }, "[api/auth/signup] createUser failed:");
      // attempt cleanup
      try {
        await admin
          .from('org_members')
          .delete()
          .match({ organization_id: organizationId, user_id: userId });
        await admin
          .from('organizations')
          .delete()
          .match({ id: organizationId });
      } catch (cleanupErr) {
        log.error({ err: cleanupErr }, "[api/auth/signup] cleanup failed:");
      }
      // Return a safe error — never leak Supabase internals to the client
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

    try {
      await ensureSubscription(organizationId, plan);
    } catch (subErr) {
      log.error({ err: subErr }, "[api/auth/signup] ensureSubscription failed:");
    }

    return NextResponse.json({ ok: true, userId, organizationId });
  } catch (err) {
    log.error({ err: err }, "[api/auth/signup] unexpected error:");
    return NextResponse.json(
      { ok: false, error: 'signup_failed' },
      { status: 500 },
    );
  }
}

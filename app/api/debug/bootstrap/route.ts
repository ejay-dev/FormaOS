import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolvePlanKey } from "@/lib/plans";
import { ensureSubscription } from "@/lib/billing/subscriptions";
import { ensureDebugAccess } from "@/app/api/debug/_guard";
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/debug/bootstrap');

export const runtime = "nodejs";

export async function POST(request: Request) {
  const guard = await ensureDebugAccess();
  if (guard) return guard;

  const admin = createSupabaseAdminClient();

  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email || `test+${Date.now()}@example.com`;
    const password = body.password || `Password123!`;
    const plan = resolvePlanKey(body.plan || "basic");

    // 1. Create user via admin API
    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: "Bootstrap Test User" },
    });

    if (createUserError) {
      log.error({ err: createUserError }, "[debug/bootstrap] createUser failed:");
      const payload = {
        message: createUserError.message ?? null,
        details: (createUserError as any)?.details ?? null,
        code: (createUserError as any)?.code ?? null,
      };

      // Fallback: try sending an invite instead of creating the user directly
      try {
        const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
          data: { invited_by: "bootstrap-script", note: "fallback-invite" },
        });

        if (inviteError) {
          log.error({ err: inviteError }, "[debug/bootstrap] inviteUserByEmail failed:");
          return NextResponse.json({ ok: false, error: { create: payload, invite: inviteError } }, { status: 500 });
        }

        return NextResponse.json({ ok: true, invited: true, inviteData });
      } catch (invErr) {
        log.error({ err: invErr }, "[debug/bootstrap] invite fallback unexpected error:");
        return NextResponse.json({ ok: false, error: { create: payload, inviteFallback: String(invErr) } }, { status: 500 });
      }
    }

    const userId = createdUser?.user?.id;
    if (!userId) {
      return NextResponse.json({ ok: false, error: "no_user_id_returned" }, { status: 500 });
    }

    // 2. Create organization and memberships (admin client bypasses RLS)
    const now = new Date().toISOString();

    const { data: organization, error: orgError } = await admin
      .from("organizations")
      .insert({
        name: `Test Org ${Date.now()}`,
        created_by: userId,
        plan_key: plan ?? null,
        plan_selected_at: plan ? now : null,
        onboarding_completed: false,
      })
      .select("id")
      .single();

    if (orgError) {
      log.error({ err: orgError }, "[debug/bootstrap] organization insert failed:");
      return NextResponse.json({ ok: false, error: orgError }, { status: 500 });
    }

    const organizationId = organization.id;

    const { error: memberError } = await admin.from("org_members").insert({
      organization_id: organizationId,
      user_id: userId,
      role: "owner",
    });

    if (memberError) {
      log.error({ err: memberError }, "[debug/bootstrap] org_members insert failed:");
      return NextResponse.json({ ok: false, error: memberError }, { status: 500 });
    }

    const { error: onboardingError } = await admin.from("org_onboarding_status").insert({
      organization_id: organizationId,
      current_step: plan ? 1 : 2,
      completed_steps: [],
    });

    if (onboardingError) {
      log.error({ err: onboardingError }, "[debug/bootstrap] org_onboarding_status insert failed:");
      return NextResponse.json({ ok: false, error: onboardingError }, { status: 500 });
    }

    try {
      await ensureSubscription(organizationId, plan);
    } catch (subErr) {
      log.error({ err: subErr }, "[debug/bootstrap] ensureSubscription failed:");
      // don't fail the whole flow for subscription sync errors
    }

    return NextResponse.json({ ok: true, userId, organizationId });
  } catch (err) {
    log.error({ err: err }, "[debug/bootstrap] unexpected error:");
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

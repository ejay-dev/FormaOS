import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolvePlanKey } from "@/lib/plans";
import { ensureSubscription } from "@/lib/billing/subscriptions";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
      console.error("[debug/bootstrap] createUser failed:", createUserError);
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
          console.error("[debug/bootstrap] inviteUserByEmail failed:", inviteError);
          return NextResponse.json({ ok: false, error: { create: payload, invite: inviteError } }, { status: 500 });
        }

        return NextResponse.json({ ok: true, invited: true, inviteData });
      } catch (invErr) {
        console.error("[debug/bootstrap] invite fallback unexpected error:", invErr);
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
      console.error("[debug/bootstrap] organization insert failed:", orgError);
      return NextResponse.json({ ok: false, error: orgError }, { status: 500 });
    }

    const organizationId = organization.id;

    const { error: memberError } = await admin.from("org_members").insert({
      organization_id: organizationId,
      user_id: userId,
      role: "owner",
    });

    if (memberError) {
      console.error("[debug/bootstrap] org_members insert failed:", memberError);
      return NextResponse.json({ ok: false, error: memberError }, { status: 500 });
    }

    const { error: onboardingError } = await admin.from("org_onboarding_status").insert({
      organization_id: organizationId,
      current_step: plan ? 1 : 2,
      completed_steps: [],
    });

    if (onboardingError) {
      console.error("[debug/bootstrap] org_onboarding_status insert failed:", onboardingError);
      return NextResponse.json({ ok: false, error: onboardingError }, { status: 500 });
    }

    try {
      await ensureSubscription(organizationId, plan);
    } catch (subErr) {
      console.error("[debug/bootstrap] ensureSubscription failed:", subErr);
      // don't fail the whole flow for subscription sync errors
    }

    return NextResponse.json({ ok: true, userId, organizationId });
  } catch (err) {
    console.error("[debug/bootstrap] unexpected error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

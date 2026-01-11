import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolvePlanKey } from "@/lib/plans";
import { ensureSubscription } from "@/lib/billing/subscriptions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createSupabaseAdminClient();

  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").toString().trim();
    const password = (body.password || "").toString();
    const plan = resolvePlanKey(body.plan || null);

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "email_and_password_required" }, { status: 400 });
    }

    // Generate a user id so related rows can be created first
    const userId = (globalThis as any).crypto?.randomUUID?.() ?? `00000000-0000-4000-8000-${Date.now()}`;

    const now = new Date().toISOString();

    // 1. Create org and membership first (admin client bypasses RLS)
    const { data: organization, error: orgError } = await admin
      .from("organizations")
      .insert({
        name: email.split("@")[0],
        created_by: null,
        plan_key: plan ?? null,
        plan_selected_at: plan ? now : null,
        onboarding_completed: false,
      })
      .select("id")
      .single();

    if (orgError) {
      console.error("[api/auth/signup] organization insert failed:", orgError);
      return NextResponse.json({ ok: false, error: orgError }, { status: 500 });
    }

    const organizationId = organization.id;

    const { error: memberError } = await admin.from("org_members").insert({
      organization_id: organizationId,
      user_id: userId,
      role: "owner",
    });

    if (memberError) {
      console.error("[api/auth/signup] org_members insert failed:", memberError);
      return NextResponse.json({ ok: false, error: memberError }, { status: 500 });
    }

    const { error: onboardingError } = await admin.from("org_onboarding_status").insert({
      organization_id: organizationId,
      current_step: plan ? 1 : 2,
      completed_steps: [],
    });

    if (onboardingError) {
      console.error("[api/auth/signup] org_onboarding_status insert failed:", onboardingError);
      return NextResponse.json({ ok: false, error: onboardingError }, { status: 500 });
    }

    // 2. Create auth user with pre-generated id
    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      id: userId,
      email,
      password,
      user_metadata: { full_name: null },
    });

    if (createUserError) {
      console.error("[api/auth/signup] createUser failed:", createUserError);
      // attempt cleanup
      try {
        await admin.from("org_members").delete().match({ organization_id: organizationId, user_id: userId });
        await admin.from("organizations").delete().match({ id: organizationId });
      } catch (cleanupErr) {
        console.error("[api/auth/signup] cleanup failed:", cleanupErr);
      }
      return NextResponse.json({ ok: false, error: { message: createUserError.message, code: (createUserError as any)?.code } }, { status: 500 });
    }

    try {
      await ensureSubscription(organizationId, plan);
    } catch (subErr) {
      console.error("[api/auth/signup] ensureSubscription failed:", subErr);
    }

    return NextResponse.json({ ok: true, userId, organizationId });
  } catch (err) {
    console.error("[api/auth/signup] unexpected error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

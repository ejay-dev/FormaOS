import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePlanKey } from "@/lib/plans";
import { ensureSubscription } from "@/lib/billing/subscriptions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const planRaw = body?.plan as string | undefined;
    const plan = resolvePlanKey(planRaw ?? null);
    if (!plan) return NextResponse.json({ ok: false, error: "Invalid plan" }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData.user;
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Check existing membership
    const { data: membership } = await supabase
      .from("org_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership?.organization_id) {
      // Already in org — ensure subscription then redirect to app
      await ensureSubscription(membership.organization_id, plan);
      return NextResponse.json({ ok: true, redirect: "/app" });
    }

    // Create organization and membership
    const fallbackName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "New Organization";
    const now = new Date().toISOString();

    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: fallbackName,
        created_by: user.id,
        plan_key: plan,
        plan_selected_at: now,
        onboarding_completed: false,
      })
      .select("id")
      .single();

    if (orgError || !organization?.id) {
      console.error("Organization bootstrap failed:", orgError);
      return NextResponse.json({ ok: false, error: "Organization creation failed" }, { status: 500 });
    }

    const { error: memberError } = await supabase.from("org_members").insert({
      organization_id: organization.id,
      user_id: user.id,
      role: "owner",
    });

    if (memberError) console.error("Membership bootstrap failed:", memberError);

    await supabase.from("org_onboarding_status").insert({
      organization_id: organization.id,
      current_step: 1,
      completed_steps: [],
    });

    await ensureSubscription(organization.id, plan);

    return NextResponse.json({ ok: true, redirect: `/onboarding?plan=${encodeURIComponent(plan)}` });
  } catch (err) {
    console.error("/api/onboarding/select-plan error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolvePlanKey } from "@/lib/plans";
import { ensureSubscription } from "@/lib/billing/subscriptions";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const plan = resolvePlanKey(searchParams.get("plan"));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  const appBase = appUrl.replace(/\/$/, "");

  if (!code) {
    return NextResponse.redirect(`${appBase}/auth/signin`);
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  // 1. Exchange the code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (error || !data?.user) {
    console.error("OAuth exchange failed:", error);
    return NextResponse.redirect(`${appBase}/auth/signin`);
  }

  if (plan) {
    try {
      await supabase.auth.updateUser({ data: { selected_plan: plan } });
    } catch (err) {
      console.error("User metadata update failed:", err);
    }
  }

  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (membershipError) {
    console.error("Membership lookup failed:", membershipError);
  }

  if (!membership?.organization_id) {
    const fallbackName =
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      data.user.email?.split("@")[0] ||
      "New Organization";

    try {
      const now = new Date().toISOString();

      // Use the admin (service-role) client for bootstrap writes so RLS doesn't block
      const { data: organization, error: orgError } = await admin
        .from("organizations")
        .insert({
          name: fallbackName,
          created_by: data.user.id,
          plan_key: plan ?? null,
          plan_selected_at: plan ? now : null,
          onboarding_completed: false,
        })
        .select("id")
        .single();

      if (orgError || !organization?.id) {
        console.error("[auth/callback] Organization bootstrap failed:", orgError?.message ?? orgError, orgError?.details ?? null, orgError);
        const planQuery = plan ? `?plan=${encodeURIComponent(plan)}` : "";
        return NextResponse.redirect(`${appBase}/onboarding${planQuery}`);
      }

      const { error: memberError } = await admin.from("org_members").insert({
        organization_id: organization.id,
        user_id: data.user.id,
        role: "owner",
      });

      if (memberError) {
        console.error("[auth/callback] Membership bootstrap failed:", memberError?.message ?? memberError, memberError?.details ?? null, memberError);
      }

      const { error: onboardingError } = await admin.from("org_onboarding_status").insert({
        organization_id: organization.id,
        current_step: plan ? 1 : 2,
        completed_steps: [],
      });

      if (onboardingError) {
        console.error("[auth/callback] org_onboarding_status insert failed:", onboardingError?.message ?? onboardingError, onboardingError?.details ?? null, onboardingError);
      }

      try {
        await ensureSubscription(organization.id, plan);
      } catch (subErr) {
        console.error("[auth/callback] ensureSubscription failed:", subErr);
      }
    } catch (err) {
      console.error("[auth/callback] Organization bootstrap failed (unexpected):", err);
    }

    const planQuery = plan ? `?plan=${encodeURIComponent(plan)}` : "";
    return NextResponse.redirect(`${appBase}/onboarding${planQuery}`);
  }

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("plan_key, industry, onboarding_completed, frameworks")
    .eq("id", membership.organization_id)
    .maybeSingle();

  if (orgError) {
    console.error("Organization lookup failed:", orgError);
  }

  const resolvedPlan = resolvePlanKey(organization?.plan_key ?? null) || plan;
  await ensureSubscription(membership.organization_id, resolvedPlan);

  const hasPlan = Boolean(organization?.plan_key ?? resolvedPlan);
  const hasIndustry = Boolean(organization?.industry);
  const hasFrameworks = Array.isArray(organization?.frameworks) && organization.frameworks.length > 0;
  const onboardingComplete = Boolean(organization?.onboarding_completed);

  if (!hasPlan || !hasIndustry || !hasFrameworks || !onboardingComplete) {
    const planQuery = resolvedPlan ? `?plan=${encodeURIComponent(resolvedPlan)}` : "";
    return NextResponse.redirect(`${appBase}/onboarding${planQuery}`);
  }

  return NextResponse.redirect(`${appBase}/app`);
}

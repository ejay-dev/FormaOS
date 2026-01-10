import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePlanKey } from "@/lib/plans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncEntitlementsForPlan } from "@/lib/billing/entitlements";

const TRIAL_DAYS = 14;

function getTrialEndIso() {
  const end = new Date();
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end.toISOString();
}

async function ensureSubscription(orgId: string, planKey: string | null) {
  if (!planKey) return;

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("org_subscriptions")
    .select("status")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (existing?.status) {
    return;
  }

  const isTrialEligible = planKey === "basic" || planKey === "pro";
  const nowIso = new Date().toISOString();

  await admin.from("org_subscriptions").upsert({
    organization_id: orgId,
    plan_key: planKey,
    status: isTrialEligible ? "trialing" : "pending",
    current_period_end: isTrialEligible ? getTrialEndIso() : null,
    updated_at: nowIso,
  });

  if (isTrialEligible) {
    await syncEntitlementsForPlan(orgId, planKey as "basic" | "pro");
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const plan = resolvePlanKey(searchParams.get("plan"));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin;
  const appBase = appUrl.replace(/\/$/, "");
  const siteBase = siteUrl.replace(/\/$/, "");

  if (!code) {
    return NextResponse.redirect(`${appBase}/auth/signin`);
  }

  const supabase = await createSupabaseServerClient();

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
    if (!plan) {
      return NextResponse.redirect(`${siteBase}/pricing`);
    }

    const fallbackName =
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      data.user.email?.split("@")[0] ||
      "New Organization";

    try {
      const now = new Date().toISOString();
      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: fallbackName,
          created_by: data.user.id,
          plan_key: plan,
          plan_selected_at: now,
          onboarding_completed: false,
        })
        .select("id")
        .single();

      if (orgError || !organization?.id) {
        console.error("Organization bootstrap failed:", orgError);
        return NextResponse.redirect(`${appBase}/onboarding?plan=${encodeURIComponent(plan)}`);
      }

      const { error: memberError } = await supabase.from("org_members").insert({
        organization_id: organization.id,
        user_id: data.user.id,
        role: "owner",
      });

      if (memberError) {
        console.error("Membership bootstrap failed:", memberError);
      }

      await supabase.from("org_onboarding_status").insert({
        organization_id: organization.id,
        current_step: 1,
        completed_steps: [],
      });

      await ensureSubscription(organization.id, plan);
    } catch (err) {
      console.error("Organization bootstrap failed:", err);
    }

    return NextResponse.redirect(`${appBase}/onboarding?plan=${encodeURIComponent(plan)}`);
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

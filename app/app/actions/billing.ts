"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeClient, getStripePriceId } from "@/lib/billing/stripe";
import { resolvePlanKey } from "@/lib/plans";

export async function startCheckout(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.organization_id) {
    redirect("/onboarding");
  }

  const orgId = membership.organization_id as string;
  const { data: organization } = await supabase
    .from("organizations")
    .select("plan_key")
    .eq("id", orgId)
    .maybeSingle();

  const planInput = formData.get("plan") as string | null;
  const planKey = resolvePlanKey(planInput ?? organization?.plan_key ?? null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? siteUrl;

  if (!planKey) {
    redirect(`${siteUrl.replace(/\/$/, "")}/pricing`);
  }

  if (planKey === "enterprise") {
    redirect("/app/billing?status=contact");
  }

  const stripe = getStripeClient();
  const admin = createSupabaseAdminClient();

  const { data: subscriptionRow } = await admin
    .from("org_subscriptions")
    .select("id, stripe_customer_id")
    .eq("organization_id", orgId)
    .maybeSingle();

  let customerId = subscriptionRow?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: {
        organization_id: orgId,
        user_id: user.id,
      },
    });
    customerId = customer.id;
  }

  const priceId = getStripePriceId(planKey);
  const siteBase = siteUrl.replace(/\/$/, "");
  const appBase = appUrl.replace(/\/$/, "");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${appBase}/app`,
    cancel_url: `${siteBase}/pricing`,
    metadata: {
      organization_id: orgId,
      plan_key: planKey,
    },
  });

  await admin.from("org_subscriptions").upsert({
    organization_id: orgId,
    plan_key: planKey,
    status: "pending",
    stripe_customer_id: customerId,
    stripe_subscription_id: null,
    updated_at: new Date().toISOString(),
  });

  if (!session.url) {
    throw new Error("Stripe checkout session missing url");
  }

  redirect(session.url);
}

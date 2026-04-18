'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getStripeClient, getStripePriceId } from '@/lib/billing/stripe';
import { isTrialEligiblePlan, resolvePlanKey } from '@/lib/plans';
import { isFounder } from '@/lib/utils/founder';
import { billingLogger } from '@/lib/observability/structured-logger';

// Legacy plan_code uses different values (starter vs basic)
function toLegacyPlanCode(planKey: string): string {
  return planKey === 'basic' ? 'starter' : planKey;
}

export async function startCheckout(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  // 🚨 FOUNDER BYPASS - Founders should not use billing checkout
  const userEmail = user?.email ?? '';
  const userId = user?.id ?? '';
  const isUserFounder = isFounder(userEmail, userId);

  if (isUserFounder) {
    redirect('/admin');
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.organization_id) {
    redirect('/onboarding');
  }

  const orgId = membership.organization_id as string;
  const { data: organization } = await supabase
    .from('organizations')
    .select('plan_key')
    .eq('id', orgId)
    .maybeSingle();

  const planInput = formData.get('plan') as string | null;
  const planKey = resolvePlanKey(planInput ?? organization?.plan_key ?? null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? siteUrl;

  if (!planKey) {
    redirect(`${siteUrl.replace(/\/$/, '')}/pricing`);
  }

  // Enterprise now follows the same priced self-serve checkout path.

  const stripe = getStripeClient();
  if (!stripe) {
    redirect('/app/billing?status=stripe_unavailable');
  }
  const admin = createSupabaseAdminClient();

  const { data: subscriptionRow } = await admin
    .from('org_subscriptions')
    .select('id, stripe_customer_id')
    .eq('organization_id', orgId)
    .maybeSingle();

  let customerId = subscriptionRow?.stripe_customer_id ?? null;

  const priceId = getStripePriceId(planKey);
  if (!priceId) {
    redirect('/app/billing?status=missing_price');
  }
  const siteBase = siteUrl.replace(/\/$/, '');
  const appBase = appUrl.replace(/\/$/, '');
  const isTrialEligible = isTrialEligiblePlan(planKey);

  try {
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

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: isTrialEligible ? 14 : undefined,
        metadata: {
          organization_id: orgId,
          plan_key: planKey,
        },
      },
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
      success_url: `${appBase}/app`,
      cancel_url: `${siteBase}/pricing`,
      metadata: {
        organization_id: orgId,
        plan_key: planKey,
        price_id: priceId,
      },
    });

    await admin.from('org_subscriptions').upsert({
      org_id: orgId,
      organization_id: orgId,
      plan_code: toLegacyPlanCode(planKey),
      plan_key: planKey,
      status: 'pending',
      stripe_customer_id: customerId,
      stripe_subscription_id: null,
      price_id: priceId,
      updated_at: new Date().toISOString(),
    });

    if (!session.url) {
      redirect('/app/billing?status=checkout_failed');
    }

    return session.url;
  } catch (err) {
    const isRedirectError =
      err instanceof Error && err.message === 'NEXT_REDIRECT';
    if (isRedirectError) throw err;
    const errorObj =
      err instanceof Error
        ? err
        : { code: 'UNKNOWN', message: String(err) };
    billingLogger.error('checkout_session_failed', errorObj, {
      planKey,
      orgId,
    });
    redirect('/app/billing?status=checkout_failed');
  }
}

export async function openCustomerPortal() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.organization_id) {
    redirect('/onboarding');
  }

  const orgId = membership.organization_id as string;
  const admin = createSupabaseAdminClient();
  const { data: subscription } = await admin
    .from('org_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (!subscription?.stripe_customer_id) {
    redirect('/app/billing?status=missing_customer');
  }

  const stripe = getStripeClient();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const returnUrl = appUrl
    ? `${appUrl.replace(/\/$/, '')}/app/billing`
    : '/app/billing';

  if (!stripe) {
    redirect('/app/billing?status=stripe_unavailable');
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: returnUrl,
  });

  if (!portalSession.url) {
    throw new Error('Stripe portal session missing url');
  }

  // Return the URL instead of redirecting for client-side handling
  return portalSession.url;
}

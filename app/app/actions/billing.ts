'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getStripeClient, getStripePriceId } from '@/lib/billing/stripe';
import { resolvePlanKey } from '@/lib/plans';
import { isFounder } from '@/lib/utils/founder';
import { billingLogger } from '@/lib/observability/structured-logger';
import { actionError, isNextInternalError } from '@/lib/actions/safe';

type BillingActionResult =
  | { success: true; url: string }
  | { success: false; error: string; status?: string };

const BILLING_ROLES = new Set(['owner', 'admin']);

function billingActionError(
  error: string,
  status?: string,
): BillingActionResult {
  return { success: false, error, status };
}

// Legacy plan_code uses different values (starter vs basic)
function toLegacyPlanCode(planKey: string): string {
  return planKey === 'basic' ? 'starter' : planKey;
}

export async function startCheckout(
  formData: FormData,
): Promise<BillingActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, url: '/auth/signin' };
    }

    // Founders bypass customer billing checkout.
    const userEmail = user?.email ?? '';
    const userId = user?.id ?? '';
    const isUserFounder = isFounder(userEmail, userId);

    if (isUserFounder) {
      return { success: true, url: '/admin' };
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      return { success: true, url: '/onboarding' };
    }

    const role = (membership.role as string | null)?.toLowerCase() ?? '';
    if (!BILLING_ROLES.has(role)) {
      return billingActionError(
        'Only organization owners and admins can manage billing.',
        'forbidden',
      );
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
      return { success: true, url: `${siteUrl.replace(/\/$/, '')}/pricing` };
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return billingActionError(
        'Billing is temporarily unavailable. Please try again shortly.',
        'stripe_unavailable',
      );
    }
    const admin = createSupabaseAdminClient();

    const { data: subscriptionRow } = await admin
      .from('org_subscriptions')
      .select('id, plan_key, status, stripe_customer_id, stripe_subscription_id')
      .eq('organization_id', orgId)
      .maybeSingle();

    let customerId = subscriptionRow?.stripe_customer_id ?? null;

    const priceId = getStripePriceId(planKey);
    if (!priceId) {
      return billingActionError(
        'This plan requires a guided billing review. Contact Formaos.team@gmail.com to proceed.',
        'missing_price',
      );
    }
    const siteBase = siteUrl.replace(/\/$/, '');
    const appBase = appUrl.replace(/\/$/, '');

    try {
      const currentStatus =
        (subscriptionRow?.status as string | null)?.toLowerCase() ?? '';
      const shouldUsePortal =
        customerId &&
        subscriptionRow?.stripe_subscription_id &&
        ['active', 'trialing', 'past_due'].includes(currentStatus);

      if (shouldUsePortal) {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${appBase}/app/billing`,
        });

        if (!portalSession.url) {
          throw new Error('Stripe portal session missing url');
        }

        return { success: true, url: portalSession.url };
      }

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
          // Explicit 0 keeps any Stripe Dashboard product-level trial default
          // from silently applying to new Foundation/Growth subscriptions.
          trial_period_days: 0,
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

      const { error: upsertError } = await admin
        .from('org_subscriptions')
        .upsert({
          organization_id: orgId,
          plan_code: toLegacyPlanCode(planKey),
          plan_key: planKey,
          status: 'pending',
          stripe_customer_id: customerId,
          stripe_subscription_id: null,
          price_id: priceId,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        throw upsertError;
      }

      if (!session.url) {
        return billingActionError(
          'Failed to start checkout. Please try again.',
          'checkout_failed',
        );
      }

      return { success: true, url: session.url };
    } catch (err) {
      const errorObj =
        err instanceof Error
          ? err
          : { code: 'UNKNOWN', message: String(err) };
      billingLogger.error('checkout_session_failed', errorObj, {
        planKey,
        orgId,
      });
      return billingActionError(
        'Failed to start checkout. Please try again.',
        'checkout_failed',
      );
    }
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    const result = actionError(error);
    return billingActionError(result.error);
  }
}

export async function openCustomerPortal(): Promise<BillingActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, url: '/auth/signin' };
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      return { success: true, url: '/onboarding' };
    }

    const role = (membership.role as string | null)?.toLowerCase() ?? '';
    if (!BILLING_ROLES.has(role)) {
      return billingActionError(
        'Only organization owners and admins can manage billing.',
        'forbidden',
      );
    }

    const orgId = membership.organization_id as string;
    const admin = createSupabaseAdminClient();
    const { data: subscription } = await admin
      .from('org_subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      return billingActionError(
        'No billing profile found. Activate a subscription to continue.',
        'missing_customer',
      );
    }

    const stripe = getStripeClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '';
    const returnUrl = appUrl
      ? `${appUrl.replace(/\/$/, '')}/app/billing`
      : '/app/billing';

    if (!stripe) {
      return billingActionError(
        'Billing is temporarily unavailable. Please try again shortly.',
        'stripe_unavailable',
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    });

    if (!portalSession.url) {
      throw new Error('Stripe portal session missing url');
    }

    return { success: true, url: portalSession.url };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    const result = actionError(error);
    return billingActionError(result.error);
  }
}

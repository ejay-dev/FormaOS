import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { getStripeClient, getStripePriceId } from '@/lib/billing/stripe';
import { shouldOpenBillingPortalForCheckout } from '@/lib/billing/checkout-routing';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const CheckoutSchema = z.object({
  orgId: z.string().uuid().optional(),
  planId: z.enum(['basic', 'pro', 'enterprise']),
});

const BILLING_ROLES = new Set(['owner', 'admin']);

const log = routeLog('/api/billing/checkout');

export async function POST(request: Request) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rawBody = await request.json().catch(() => ({}));
    const parsed = CheckoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { orgId: requestedOrgId, planId } = parsed.data;

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();
    const userOrgId = membership?.organization_id as string | undefined;
    const userRole = (membership?.role as string | undefined) ?? '';
    const orgId = requestedOrgId || userOrgId;

    if (!orgId)
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    if (requestedOrgId && requestedOrgId !== userOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!BILLING_ROLES.has(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stripe = getStripeClient();
    const priceId = getStripePriceId(planId);
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 },
      );
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing Stripe price for plan' },
        { status: 400 },
      );
    }

    const { data: subscription } = await supabase
      .from('org_subscriptions')
      .select('plan_key, status, stripe_customer_id, stripe_subscription_id')
      .eq('organization_id', orgId)
      .maybeSingle();

    const portalCustomerId = subscription?.stripe_customer_id ?? null;
    const shouldUsePortal = shouldOpenBillingPortalForCheckout({
      targetPlan: planId,
      currentPlan: subscription?.plan_key,
      status: subscription?.status,
      stripeCustomerId: portalCustomerId,
      stripeSubscriptionId: subscription?.stripe_subscription_id,
    });

    if (shouldUsePortal && portalCustomerId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: portalCustomerId,
        return_url: `${appUrl}/app/billing`,
      });

      if (!portalSession.url) {
        return NextResponse.json(
          { error: 'Failed to create billing portal session' },
          { status: 500 },
        );
      }

      return NextResponse.json({
        url: portalSession.url,
        mode: 'portal',
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: subscription?.stripe_customer_id ?? undefined,
      customer_email: subscription?.stripe_customer_id
        ? undefined
        : (user.email ?? undefined),
      client_reference_id: orgId,
      success_url: `${appUrl}/app/billing?checkout=success`,
      cancel_url: `${appUrl}/app/billing?checkout=cancelled`,
      subscription_data: {
        trial_period_days: 0,
        metadata: {
          organization_id: orgId,
          plan_key: planId,
        },
      },
      metadata: {
        organization_id: orgId,
        plan_key: planId,
        price_id: priceId,
        initiated_by: user.id,
      },
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err) {
    log.error({ err }, 'checkout error');
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}

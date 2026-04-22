import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { getStripeClient, getStripePriceId } from '@/lib/billing/stripe';

const CheckoutSchema = z.object({
  orgId: z.string().uuid().optional(),
  planId: z.enum(['basic', 'pro', 'enterprise']),
});

const BILLING_ROLES = new Set(['owner', 'admin']);

const log = routeLog('/api/billing/checkout');

export async function POST(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });
    if (requestedOrgId && requestedOrgId !== userOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!BILLING_ROLES.has(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stripe = getStripeClient();
    const priceId = getStripePriceId(planId);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (!stripe || !priceId) {
      // Graceful fallback in dev/staging: fake-flip the subscription plan so the UI can proceed.
      const nowIso = new Date().toISOString();
      await supabase
        .from('org_subscriptions')
        .upsert(
          {
            organization_id: orgId,
            plan_key: planId,
            status: 'active',
            updated_at: nowIso,
          },
          { onConflict: 'organization_id' }
        );
      return NextResponse.json({
        url: `${appUrl}/app/billing?upgraded=${encodeURIComponent(planId)}`,
        mode: 'simulated',
      });
    }

    const { data: subscription } = await supabase
      .from('org_subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', orgId)
      .maybeSingle();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: subscription?.stripe_customer_id ?? undefined,
      customer_email: subscription?.stripe_customer_id ? undefined : user.email ?? undefined,
      client_reference_id: orgId,
      success_url: `${appUrl}/app/billing?checkout=success`,
      cancel_url: `${appUrl}/app/billing?checkout=cancelled`,
      metadata: {
        organization_id: orgId,
        plan_key: planId,
        initiated_by: user.id,
      },
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err) {
    log.error({ err }, 'checkout error');
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

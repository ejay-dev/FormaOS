import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { getStripeClient } from '@/lib/billing/stripe';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { captureRouteError } from '@/lib/observability/with-route-observability';
import { isBillingRole } from '@/lib/roles';

const log = routeLog('/api/billing/portal');

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

    const body = await request.json().catch(() => ({}));
    const requestedOrgId = (body?.orgId as string | undefined) ?? null;

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();
    const userOrgId = membership?.organization_id as string | undefined;
    const orgId = requestedOrgId || userOrgId;

    if (!orgId)
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    if (requestedOrgId && requestedOrgId !== userOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isBillingRole(membership?.role ?? null)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';

    const { data: subscription } = await supabase
      .from('org_subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', orgId)
      .maybeSingle();

    const stripe = getStripeClient();
    const customerId = subscription?.stripe_customer_id as string | undefined;

    if (!stripe) {
      return NextResponse.json(
        { error: 'stripe_not_configured' },
        { status: 503 },
      );
    }
    if (!customerId) {
      // v4-025: previously returned `{ url: /app/billing, mode: 'simulated' }`
      // — the UI would redirect to the same page that surfaced the
      // "Manage billing" button, producing an infinite loop. Surface
      // a clear 409 instead so the client renders "complete checkout
      // first" instead of bouncing.
      return NextResponse.json(
        {
          error: 'no_stripe_customer',
          message:
            'This organization has no Stripe customer yet. Complete checkout to start managing billing.',
        },
        { status: 409 },
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/app/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    log.error({ err }, 'portal error');
    captureRouteError('billing.portal', err, {
      method: request.method,
      url: request.url,
    });
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 },
    );
  }
}

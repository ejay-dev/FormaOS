import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { getStripeClient } from '@/lib/billing/stripe';
import { validateCsrfOrigin } from '@/lib/security/csrf';

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

    const BILLING_ROLES = new Set(['owner', 'admin']);
    if (!membership?.role || !BILLING_ROLES.has(membership.role)) {
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

    if (!stripe || !customerId) {
      return NextResponse.json({
        url: `${appUrl}/app/billing`,
        mode: 'simulated',
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/app/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    log.error({ err }, 'portal error');
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import { logAdminAction } from '@/lib/admin/audit';
import {
  getStripeClient,
  resolvePlanKeyFromPriceId,
} from '@/lib/billing/stripe';
import { handleAdminError } from '@/app/api/admin/_helpers';

type Params = {
  params: Promise<{ orgId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { user } = await requireFounderAccess();
    const { orgId } = await params;
    const admin = createSupabaseAdminClient();

    const { data: subscription } = await admin
      .from('org_subscriptions')
      .select('stripe_subscription_id')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Missing Stripe subscription' },
        { status: 400 },
      );
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 },
      );
    }

    const stripeSub = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id,
    );
    const priceId = stripeSub.items.data[0]?.price?.id ?? null;
    const planKey = resolvePlanKeyFromPriceId(priceId);
    const currentPeriodEnd = stripeSub.current_period_end
      ? new Date(stripeSub.current_period_end * 1000).toISOString()
      : null;
    const trialExpiresAt =
      stripeSub.status === 'trialing' ? currentPeriodEnd : null;

    await admin
      .from('org_subscriptions')
      .update({
        status:
          stripeSub.status === 'canceled' ? 'cancelled' : stripeSub.status,
        current_period_end: currentPeriodEnd,
        trial_expires_at: trialExpiresAt,
        plan_key: planKey ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', orgId);

    if (planKey) {
      await admin
        .from('organizations')
        .update({ plan_key: planKey })
        .eq('id', orgId);
    }

    await logAdminAction({
      actorUserId: user.id,
      action: 'subscription_resync',
      targetType: 'organization',
      targetId: orgId,
      metadata: { stripe_subscription_id: subscription.stripe_subscription_id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(
      error,
      '/api/admin/subscriptions/[orgId]/resync-stripe',
    );
  }
}

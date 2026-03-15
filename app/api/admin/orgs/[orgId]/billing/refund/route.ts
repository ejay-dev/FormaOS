import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/app/app/admin/access';
import { logAdminAction } from '@/lib/admin/audit';
import {
  extractAdminReason,
  handleAdminError,
  parseAdminMutationPayload,
  requireAdminChangeControl,
} from '@/app/api/admin/_helpers';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { checkAdminRateLimit, getClientIp } from '@/lib/ratelimit';
import { getStripeClient } from '@/lib/billing/stripe';

type Params = {
  params: Promise<{ orgId: string }>;
};

/**
 * POST /api/admin/orgs/[orgId]/billing/refund
 *
 * Issue a full or partial refund for the most recent Stripe charge.
 * Body: { amount?: number (cents, omit for full refund), reason?: string }
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const ip = getClientIp(request);
    const rl = await checkAdminRateLimit(ip);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const access = await requireAdminAccess({ permission: 'billing:manage' });
    const { orgId } = await params;
    const { payload: body } = await parseAdminMutationPayload(request);

    // Validate optional amount — must be a positive integer (cents)
    const amountRaw = body?.amount;
    const amount =
      amountRaw != null
        ? Math.floor(Number(amountRaw))
        : undefined;
    if (amountRaw != null && (!Number.isFinite(amount) || (amount as number) <= 0)) {
      return NextResponse.json(
        { error: 'amount_must_be_positive_integer_cents' },
        { status: 400 },
      );
    }

    const reason = await requireAdminChangeControl({
      context: access,
      action: 'billing_refund',
      targetType: 'organization',
      targetId: orgId,
      reason: extractAdminReason(body, request),
      requireApproval: true,
    });

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: 'stripe_not_configured' },
        { status: 503 },
      );
    }

    const admin = createSupabaseAdminClient();

    // Fetch the org's Stripe customer ID and latest subscription
    const { data: sub } = await admin
      .from('org_subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'no_stripe_customer_for_org' },
        { status: 404 },
      );
    }

    // Find the most recent successful charge for this customer
    const charges = await stripe.charges.list({
      customer: sub.stripe_customer_id,
      limit: 5,
    });

    const successfulCharge = charges.data.find(
      (c) => c.status === 'succeeded' && !c.refunded,
    );

    if (!successfulCharge) {
      return NextResponse.json(
        { error: 'no_refundable_charge_found' },
        { status: 404 },
      );
    }

    // Issue the refund via Stripe
    const refundParams: Stripe.RefundCreateParams = {
      charge: successfulCharge.id,
      reason: 'requested_by_customer',
    };
    if (amount != null) {
      refundParams.amount = amount;
    }

    const refund = await stripe.refunds.create(refundParams);

    await logAdminAction({
      actorUserId: access.user.id,
      action: 'billing_refund',
      targetType: 'organization',
      targetId: orgId,
      metadata: {
        refundId: refund.id,
        chargeId: successfulCharge.id,
        amount: refund.amount,
        currency: refund.currency,
        reason,
      },
    });

    return NextResponse.json({
      ok: true,
      refundId: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/billing/refund');
  }
}

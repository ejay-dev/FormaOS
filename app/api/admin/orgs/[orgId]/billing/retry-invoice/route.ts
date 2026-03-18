import { NextResponse } from 'next/server';
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
 * POST /api/admin/orgs/[orgId]/billing/retry-invoice
 *
 * Manually trigger payment retry for the most recent open/past-due invoice.
 * This is the "dunning rescue" action — use when a customer has updated their
 * payment method and you want to avoid waiting for the next automatic attempt.
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

    const reason = await requireAdminChangeControl({
      context: access,
      action: 'billing_retry_invoice',
      targetType: 'organization',
      targetId: orgId,
      reason: extractAdminReason(body, request),
    });

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: 'stripe_not_configured' },
        { status: 503 },
      );
    }

    const admin = createSupabaseAdminClient();

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

    // Find the most recent open or past_due invoice for this customer
    const invoices = await stripe.invoices.list({
      customer: sub.stripe_customer_id,
      status: 'open',
      limit: 5,
    });

    const targetInvoice = invoices.data[0];

    if (!targetInvoice) {
      return NextResponse.json(
        { error: 'no_open_invoice_found' },
        { status: 404 },
      );
    }

    // Attempt payment
    const paidInvoice = await stripe.invoices.pay(targetInvoice.id, {
      forgive: false,
    });

    await logAdminAction({
      actorUserId: access.user.id,
      action: 'billing_retry_invoice',
      targetType: 'organization',
      targetId: orgId,
      metadata: {
        invoiceId: paidInvoice.id,
        status: paidInvoice.status,
        amountDue: paidInvoice.amount_due,
        reason,
      },
    });

    return NextResponse.json({
      ok: true,
      invoiceId: paidInvoice.id,
      status: paidInvoice.status,
      amountDue: paidInvoice.amount_due,
      currency: paidInvoice.currency,
    });
  } catch (error) {
    // Stripe throws a specific error when payment fails — surface it clearly.
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('card')
    ) {
      return NextResponse.json(
        { error: 'payment_failed', detail: error.message },
        { status: 402 },
      );
    }
    return handleAdminError(
      error,
      '/api/admin/orgs/[orgId]/billing/retry-invoice',
    );
  }
}

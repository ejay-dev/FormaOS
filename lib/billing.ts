/**
 * =========================================================
 * Stripe Billing Integration
 * =========================================================
 * Subscription management and payment processing
 */

import Stripe from 'stripe';
import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionTier,
} from '@/lib/billing/plans';
import { sendEmail } from '@/lib/email/send-email';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
  typescript: true,
});

export {
  SUBSCRIPTION_PLANS,
  type SubscriptionTier,
} from '@/lib/billing/plans';

function getBillingAppBase(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://app.formaos.com.au';

  try {
    return new URL(raw).origin.replace(/\/$/, '');
  } catch {
    return 'https://app.formaos.com.au';
  }
}

async function sendPaymentFailedNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
): Promise<void> {
  const [{ data: organization }, { data: memberships }] = await Promise.all([
    supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .maybeSingle(),
    supabase
      .from('org_members')
      .select('user_id, role')
      .eq('organization_id', organizationId)
      .in('role', ['owner', 'admin']),
  ]);

  const userIds = Array.from(
    new Set((memberships ?? []).map((membership: any) => membership.user_id).filter(Boolean)),
  );

  if (!userIds.length) {
    return;
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);

  const appBase = getBillingAppBase();
  const recipients = (profiles ?? []).filter((profile: any) => profile.email);

  await Promise.allSettled(
    recipients.map((profile: any) =>
      sendEmail({
        type: 'alert',
        to: profile.email,
        userName:
          profile.full_name ||
          profile.email.split('@')[0] ||
          'team member',
        alertType: 'warning',
        alertTitle: 'Payment failed',
        alertMessage:
          'A subscription payment failed and your workspace has been marked past due. Review billing details to avoid service interruption.',
        actionUrl: `${appBase}/app/billing`,
        actionText: 'Review billing',
        organizationId,
        userId: profile.id,
      }),
    ),
  );
}

/**
 * Create Stripe customer for organization
 */
export async function createStripeCustomer(
  organizationId: string,
  email: string,
  name: string,
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      organizationId,
    },
  });

  // Save customer ID
  const supabase = await createClient();
  await supabase
    .from('organizations')
    .update({ stripe_customer_id: customer.id })
    .eq('id', organizationId);

  return customer.id;
}

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(
  organizationId: string,
  tier: SubscriptionTier,
  successUrl: string,
  cancelUrl: string,
): Promise<{ sessionId: string; url: string }> {
  const plan = SUBSCRIPTION_PLANS[tier];

  if (!plan.stripePriceId) {
    throw new Error('Invalid subscription tier');
  }

  const supabase = await createClient();

  // Get or create Stripe customer
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id, name')
    .eq('id', organizationId)
    .single();

  let customerId = org?.stripe_customer_id;

  if (!customerId) {
    customerId = await createStripeCustomer(
      organizationId,
      '', // Get from org owner
      org?.name || 'Organization',
    );
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organizationId,
      tier,
    },
    subscription_data: {
      metadata: {
        organizationId,
        tier,
      },
    },
  });

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

/**
 * Handle successful checkout
 */
export async function handleCheckoutSuccess(sessionId: string): Promise<void> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new Error('Payment not completed');
  }

  const organizationId = session.metadata?.organizationId;
  const tier = session.metadata?.tier as SubscriptionTier;

  if (!organizationId || !tier) {
    throw new Error('Invalid session metadata');
  }

  const supabase = await createClient();

  // Update organization subscription
  await supabase
    .from('organizations')
    .update({
      subscription_tier: tier,
      subscription_status: 'active',
      stripe_subscription_id: session.subscription,
      subscription_updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);

  // Record subscription event
  await supabase.from('subscription_events').insert({
    organization_id: organizationId,
    event_type: 'subscription_created',
    tier,
    stripe_subscription_id: session.subscription,
  });
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  organizationId: string,
): Promise<void> {
  const supabase = await createClient();

  // Get subscription ID
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_subscription_id')
    .eq('id', organizationId)
    .single();

  if (!org?.stripe_subscription_id) {
    throw new Error('No active subscription found');
  }

  // Cancel at period end
  await stripe.subscriptions.update(org.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  // Update organization
  await supabase
    .from('organizations')
    .update({
      subscription_status: 'canceling',
    })
    .eq('id', organizationId);

  // Record event
  await supabase.from('subscription_events').insert({
    organization_id: organizationId,
    event_type: 'subscription_canceled',
    stripe_subscription_id: org.stripe_subscription_id,
  });
}

/**
 * Resume canceled subscription
 */
export async function resumeSubscription(
  organizationId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_subscription_id')
    .eq('id', organizationId)
    .single();

  if (!org?.stripe_subscription_id) {
    throw new Error('No subscription found');
  }

  // Resume subscription
  await stripe.subscriptions.update(org.stripe_subscription_id, {
    cancel_at_period_end: false,
  });

  // Update organization
  await supabase
    .from('organizations')
    .update({
      subscription_status: 'active',
    })
    .eq('id', organizationId);
}

/**
 * Update subscription tier
 */
export async function updateSubscriptionTier(
  organizationId: string,
  newTier: SubscriptionTier,
): Promise<void> {
  const newPlan = SUBSCRIPTION_PLANS[newTier];

  if (!newPlan.stripePriceId) {
    throw new Error('Invalid tier');
  }

  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_subscription_id')
    .eq('id', organizationId)
    .single();

  if (!org?.stripe_subscription_id) {
    throw new Error('No active subscription');
  }

  // Get subscription
  const subscription = await stripe.subscriptions.retrieve(
    org.stripe_subscription_id,
  );

  // Update subscription
  await stripe.subscriptions.update(org.stripe_subscription_id, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPlan.stripePriceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });

  // Update organization
  await supabase
    .from('organizations')
    .update({
      subscription_tier: newTier,
    })
    .eq('id', organizationId);

  // Record event
  await supabase.from('subscription_events').insert({
    organization_id: organizationId,
    event_type: 'subscription_updated',
    tier: newTier,
    stripe_subscription_id: org.stripe_subscription_id,
  });
}

/**
 * Get billing portal URL
 */
export async function createBillingPortalSession(
  organizationId: string,
  returnUrl: string,
): Promise<string> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', organizationId)
    .single();

  if (!org?.stripe_customer_id) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Get usage for current period
 */
export async function getCurrentUsage(organizationId: string): Promise<{
  members: number;
  tasks: number;
  storage: number;
  certificates: number;
  apiCalls: number;
}> {
  const supabase = await createClient();

  // Get current period start
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_updated_at')
    .eq('id', organizationId)
    .single();

  const periodStart = org?.subscription_updated_at || new Date().toISOString();

  // Get usage stats
  const [members, tasks, storage, certificates, apiCalls] = await Promise.all([
    supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active'),
    supabase
      .from('compliance_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', periodStart),
    supabase
      .from('evidence_documents')
      .select('file_size')
      .eq('organization_id', organizationId),
    supabase
      .from('certifications')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    supabase
      .from('api_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', periodStart),
  ]);

  // Calculate storage in GB
  const totalBytes =
    storage.data?.reduce(
      (sum: number, doc: { file_size?: number }) => sum + (doc.file_size || 0),
      0,
    ) || 0;
  const storageGB = totalBytes / (1024 * 1024 * 1024);

  return {
    members: members.count || 0,
    tasks: tasks.count || 0,
    storage: Math.round(storageGB * 100) / 100,
    certificates: certificates.count || 0,
    apiCalls: apiCalls.count || 0,
  };
}

/**
 * Check if usage exceeds limits
 */
export async function checkUsageLimits(organizationId: string): Promise<{
  withinLimits: boolean;
  exceeded: string[];
}> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_tier')
    .eq('id', organizationId)
    .single();

  const tier = (org?.subscription_tier || 'free') as SubscriptionTier;
  const plan = SUBSCRIPTION_PLANS[tier];
  const usage = await getCurrentUsage(organizationId);

  const exceeded: string[] = [];

  if (plan.limits.members !== -1 && usage.members > plan.limits.members) {
    exceeded.push('members');
  }

  if (plan.limits.tasks !== -1 && usage.tasks > plan.limits.tasks) {
    exceeded.push('tasks');
  }

  if (plan.limits.storage !== -1 && usage.storage > plan.limits.storage) {
    exceeded.push('storage');
  }

  if (
    plan.limits.certificates !== -1 &&
    usage.certificates > plan.limits.certificates
  ) {
    exceeded.push('certificates');
  }

  if (plan.limits.apiCalls !== -1 && usage.apiCalls > plan.limits.apiCalls) {
    exceeded.push('apiCalls');
  }

  return {
    withinLimits: exceeded.length === 0,
    exceeded,
  };
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  const supabase = await createClient();

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata.organizationId;

      await supabase
        .from('organizations')
        .update({
          subscription_status: subscription.status,
          subscription_updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata.organizationId;

      await supabase
        .from('organizations')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
        })
        .eq('id', organizationId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Get organization
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (org) {
        await supabase
          .from('organizations')
          .update({
            subscription_status: 'past_due',
          })
          .eq('id', org.id);

        await sendPaymentFailedNotification(supabase, org.id);
      }
      break;
    }
  }
}

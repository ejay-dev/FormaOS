/** @jest-environment node */

/* ------------------------------------------------------------------ */
/* Mock infrastructure                                                */
/* ------------------------------------------------------------------ */

// Set env vars BEFORE module load — use jest.mock factory for plans module
jest.mock('@/lib/billing/plans', () => {
  const plans = {
    free: {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      features: ['Basic'],
      limits: {
        members: 5,
        tasks: 50,
        storage: 1,
        certificates: 10,
        apiCalls: 1000,
      },
    },
    starter: {
      id: 'starter',
      name: 'Starter',
      price: 29,
      interval: 'month',
      stripePriceId: 'price_starter_test',
      features: ['Standard'],
      limits: {
        members: 20,
        tasks: -1,
        storage: 10,
        certificates: 50,
        apiCalls: 10000,
      },
    },
    pro: {
      id: 'pro',
      name: 'Professional',
      price: 99,
      interval: 'month',
      stripePriceId: 'price_pro_test',
      features: ['Advanced'],
      limits: {
        members: 100,
        tasks: -1,
        storage: 100,
        certificates: -1,
        apiCalls: 100000,
      },
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      interval: 'month',
      stripePriceId: 'price_enterprise_test',
      features: ['Unlimited'],
      limits: {
        members: -1,
        tasks: -1,
        storage: -1,
        certificates: -1,
        apiCalls: -1,
      },
    },
  };
  return { SUBSCRIPTION_PLANS: plans };
});

function createBuilder(result = { data: null, error: null } as any) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/server', () => {
  const c: Record<string, any> = { from: jest.fn(() => createBuilder()) };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});

jest.mock('stripe', () => {
  const customers = { create: jest.fn() };
  const sessions = { create: jest.fn(), retrieve: jest.fn() };
  const subs = { update: jest.fn(), retrieve: jest.fn() };
  const portal = { create: jest.fn() };
  return Object.assign(
    jest.fn().mockImplementation(() => ({
      customers,
      checkout: { sessions },
      subscriptions: subs,
      billingPortal: { sessions: portal },
    })),
    {
      __customers: customers,
      __sessions: sessions,
      __subs: subs,
      __portal: portal,
    },
  );
});

jest.mock('@/lib/email/send-email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/users/admin-profile-directory', () => ({
  getAdminProfileDirectoryEntries: jest.fn().mockResolvedValue([]),
}));

import {
  SUBSCRIPTION_PLANS,
  type SubscriptionTier,
  createStripeCustomer,
  createCheckoutSession,
  handleCheckoutSuccess,
  cancelSubscription,
  resumeSubscription,
  updateSubscriptionTier,
  createBillingPortalSession,
  getCurrentUsage,
  checkUsageLimits,
  handleStripeWebhook,
} from '@/lib/billing';

function getClient() {
  return require('@/lib/supabase/server').__client;
}
const { sendEmail } = require('@/lib/email/send-email');
const {
  getAdminProfileDirectoryEntries,
} = require('@/lib/users/admin-profile-directory');

// Get stripe mock handles created inside the jest.mock factory
const StripeMock = require('stripe');
const mockStripeInstance = StripeMock();
const stripeCustomers = mockStripeInstance.customers;
const stripeCheckoutSessions = mockStripeInstance.checkout.sessions;
const stripeSubscriptions = mockStripeInstance.subscriptions;
const stripeBillingPortalSessions = mockStripeInstance.billingPortal.sessions;

beforeEach(() => {
  jest.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/* SUBSCRIPTION_PLANS data                                            */
/* ------------------------------------------------------------------ */

describe('SUBSCRIPTION_PLANS', () => {
  const allTiers: SubscriptionTier[] = ['free', 'starter', 'pro', 'enterprise'];

  it('defines all 4 expected tiers', () => {
    expect(Object.keys(SUBSCRIPTION_PLANS)).toHaveLength(4);
    for (const tier of allTiers) {
      expect(SUBSCRIPTION_PLANS[tier]).toBeDefined();
    }
  });

  it('each plan has required fields', () => {
    for (const tier of allTiers) {
      const plan = SUBSCRIPTION_PLANS[tier];
      expect(plan.id).toBe(tier);
      expect(typeof plan.name).toBe('string');
      expect(typeof plan.price).toBe('number');
      expect(plan.limits).toBeDefined();
    }
  });

  it('free plan has $0 price and no Stripe price ID', () => {
    expect(SUBSCRIPTION_PLANS.free.price).toBe(0);
    expect(SUBSCRIPTION_PLANS.free.stripePriceId).toBeUndefined();
  });

  it('enterprise plan has unlimited (-1) for all limits', () => {
    const limits = SUBSCRIPTION_PLANS.enterprise.limits;
    expect(limits.members).toBe(-1);
    expect(limits.tasks).toBe(-1);
    expect(limits.storage).toBe(-1);
    expect(limits.certificates).toBe(-1);
    expect(limits.apiCalls).toBe(-1);
  });

  it('prices increase with tier level', () => {
    expect(SUBSCRIPTION_PLANS.free.price).toBeLessThan(
      SUBSCRIPTION_PLANS.starter.price,
    );
    expect(SUBSCRIPTION_PLANS.starter.price).toBeLessThan(
      SUBSCRIPTION_PLANS.pro.price,
    );
  });
});

/* ------------------------------------------------------------------ */
/* createStripeCustomer                                               */
/* ------------------------------------------------------------------ */

describe('createStripeCustomer', () => {
  it('creates customer and updates org', async () => {
    stripeCustomers.create.mockResolvedValue({ id: 'cus_123' });
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    const id = await createStripeCustomer('org-1', 'a@b.com', 'Acme');
    expect(id).toBe('cus_123');
    expect(stripeCustomers.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'a@b.com', name: 'Acme' }),
    );
  });
});

/* ------------------------------------------------------------------ */
/* createCheckoutSession                                              */
/* ------------------------------------------------------------------ */

describe('createCheckoutSession', () => {
  it('throws for tier with no stripePriceId (free)', async () => {
    await expect(
      createCheckoutSession('org-1', 'free', '/ok', '/cancel'),
    ).rejects.toThrow('Invalid subscription tier');
  });

  it('throws when org not found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    await expect(
      createCheckoutSession('org-1', 'starter', '/ok', '/cancel'),
    ).rejects.toThrow('Organization not found');
  });

  it('auto-creates customer when stripe_customer_id missing', async () => {
    stripeCustomers.create.mockResolvedValue({ id: 'cus_auto' });
    stripeCheckoutSessions.create.mockResolvedValue({
      id: 'cs_1',
      url: 'https://stripe.com/pay',
    });
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: { stripe_customer_id: null, name: 'Acme' },
        error: null,
      }),
    );

    const result = await createCheckoutSession(
      'org-1',
      'starter',
      '/ok',
      '/cancel',
    );
    expect(result.sessionId).toBe('cs_1');
    expect(result.url).toBe('https://stripe.com/pay');
    expect(stripeCustomers.create).toHaveBeenCalled();
  });

  it('uses existing customer when available', async () => {
    stripeCheckoutSessions.create.mockResolvedValue({
      id: 'cs_2',
      url: null,
    });
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: { stripe_customer_id: 'cus_existing', name: 'Acme' },
        error: null,
      }),
    );

    const result = await createCheckoutSession(
      'org-1',
      'starter',
      '/ok',
      '/cancel',
    );
    expect(result.url).toBe('');
    expect(stripeCustomers.create).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* handleCheckoutSuccess                                              */
/* ------------------------------------------------------------------ */

describe('handleCheckoutSuccess', () => {
  it('updates org subscription on paid session', async () => {
    stripeCheckoutSessions.retrieve.mockResolvedValue({
      payment_status: 'paid',
      metadata: { organizationId: 'org-1', tier: 'pro' },
      subscription: 'sub_123',
    });
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    await handleCheckoutSuccess('cs_123');
    expect(getClient().from).toHaveBeenCalledWith('organizations');
    expect(getClient().from).toHaveBeenCalledWith('subscription_events');
  });

  it('throws when payment not completed', async () => {
    stripeCheckoutSessions.retrieve.mockResolvedValue({
      payment_status: 'unpaid',
      metadata: { organizationId: 'org-1', tier: 'pro' },
    });
    await expect(handleCheckoutSuccess('cs_bad')).rejects.toThrow(
      'Payment not completed',
    );
  });

  it('throws when metadata missing', async () => {
    stripeCheckoutSessions.retrieve.mockResolvedValue({
      payment_status: 'paid',
      metadata: {},
    });
    await expect(handleCheckoutSuccess('cs_no_meta')).rejects.toThrow(
      'Invalid session metadata',
    );
  });
});

/* ------------------------------------------------------------------ */
/* cancelSubscription                                                 */
/* ------------------------------------------------------------------ */

describe('cancelSubscription', () => {
  it('cancels at period end and updates org', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { stripe_subscription_id: 'sub_1' }, error: null }),
    );
    stripeSubscriptions.update.mockResolvedValue({});

    await cancelSubscription('org-1');
    expect(stripeSubscriptions.update).toHaveBeenCalledWith('sub_1', {
      cancel_at_period_end: true,
    });
  });

  it('throws when no subscription', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    await expect(cancelSubscription('org-1')).rejects.toThrow(
      'No active subscription found',
    );
  });

  it('throws when stripe_subscription_id is null', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { stripe_subscription_id: null }, error: null }),
    );
    await expect(cancelSubscription('org-1')).rejects.toThrow(
      'No active subscription found',
    );
  });
});

/* ------------------------------------------------------------------ */
/* resumeSubscription                                                 */
/* ------------------------------------------------------------------ */

describe('resumeSubscription', () => {
  it('resumes subscription and sets active', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { stripe_subscription_id: 'sub_1' }, error: null }),
    );
    stripeSubscriptions.update.mockResolvedValue({});

    await resumeSubscription('org-1');
    expect(stripeSubscriptions.update).toHaveBeenCalledWith('sub_1', {
      cancel_at_period_end: false,
    });
  });

  it('throws when no subscription', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    await expect(resumeSubscription('org-1')).rejects.toThrow(
      'No subscription found',
    );
  });
});

/* ------------------------------------------------------------------ */
/* updateSubscriptionTier                                             */
/* ------------------------------------------------------------------ */

describe('updateSubscriptionTier', () => {
  it('throws for invalid tier (free)', async () => {
    await expect(updateSubscriptionTier('org-1', 'free')).rejects.toThrow(
      'Invalid tier',
    );
  });

  it('throws when no active subscription', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    await expect(updateSubscriptionTier('org-1', 'pro')).rejects.toThrow(
      'No active subscription',
    );
  });

  it('updates Stripe subscription item and org tier', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { stripe_subscription_id: 'sub_1' }, error: null }),
    );
    stripeSubscriptions.retrieve.mockResolvedValue({
      items: { data: [{ id: 'si_1' }] },
    });
    stripeSubscriptions.update.mockResolvedValue({});

    await updateSubscriptionTier('org-1', 'pro');
    expect(stripeSubscriptions.update).toHaveBeenCalledWith(
      'sub_1',
      expect.objectContaining({ proration_behavior: 'create_prorations' }),
    );
  });
});

/* ------------------------------------------------------------------ */
/* createBillingPortalSession                                         */
/* ------------------------------------------------------------------ */

describe('createBillingPortalSession', () => {
  it('creates portal session and returns URL', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { stripe_customer_id: 'cus_1' }, error: null }),
    );
    stripeBillingPortalSessions.create.mockResolvedValue({
      url: 'https://billing.stripe.com/portal',
    });

    const url = await createBillingPortalSession('org-1', '/return');
    expect(url).toBe('https://billing.stripe.com/portal');
  });

  it('throws when no Stripe customer', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    await expect(
      createBillingPortalSession('org-1', '/return'),
    ).rejects.toThrow('No Stripe customer found');
  });
});

/* ------------------------------------------------------------------ */
/* getCurrentUsage                                                    */
/* ------------------------------------------------------------------ */

describe('getCurrentUsage', () => {
  it('calculates usage from parallel queries', async () => {
    const storageData = [
      { file_size: 1024 * 1024 * 1024 },
      { file_size: 512 * 1024 * 1024 },
    ];
    getClient().from.mockImplementation((table: string) => {
      switch (table) {
        case 'organizations':
          return createBuilder({
            data: { subscription_updated_at: '2024-01-01' },
            error: null,
          });
        case 'team_members':
          return createBuilder({ data: null, error: null, count: 5 });
        case 'compliance_tasks':
          return createBuilder({ data: null, error: null, count: 10 });
        case 'evidence_documents':
          return createBuilder({ data: storageData, error: null });
        case 'certifications':
          return createBuilder({ data: null, error: null, count: 3 });
        case 'api_logs':
          return createBuilder({ data: null, error: null, count: 100 });
        default:
          return createBuilder();
      }
    });

    const usage = await getCurrentUsage('org-1');
    expect(usage.members).toBe(5);
    expect(usage.tasks).toBe(10);
    expect(usage.storage).toBe(1.5);
    expect(usage.certificates).toBe(3);
    expect(usage.apiCalls).toBe(100);
  });

  it('defaults to 0 when counts are null', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null, count: null }),
    );

    const usage = await getCurrentUsage('org-1');
    expect(usage.members).toBe(0);
    expect(usage.storage).toBe(0);
  });

  it('handles missing subscription_updated_at', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null, count: 0 }),
    );
    // Should not throw - falls back to current date
    const usage = await getCurrentUsage('org-1');
    expect(usage).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/* checkUsageLimits                                                   */
/* ------------------------------------------------------------------ */

describe('checkUsageLimits', () => {
  it('returns withinLimits:true when under limits', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return createBuilder({
          data: { subscription_tier: 'pro' },
          error: null,
        });
      }
      return createBuilder({ data: null, error: null, count: 0 });
    });

    const result = await checkUsageLimits('org-1');
    expect(result.withinLimits).toBe(true);
    expect(result.exceeded).toEqual([]);
  });

  it('detects exceeded limits', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return createBuilder({
          data: { subscription_tier: 'free' },
          error: null,
        });
      }
      // Return very high usage
      return createBuilder({ data: null, error: null, count: 999999 });
    });

    const result = await checkUsageLimits('org-1');
    expect(result.withinLimits).toBe(false);
    expect(result.exceeded.length).toBeGreaterThan(0);
  });

  it('defaults to free tier when org not found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null, count: 0 }),
    );
    const result = await checkUsageLimits('org-1');
    expect(result.withinLimits).toBe(true);
  });

  it('enterprise unlimited limits never exceed (-1)', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return createBuilder({
          data: { subscription_tier: 'enterprise' },
          error: null,
        });
      }
      return createBuilder({ data: null, error: null, count: 999999 });
    });

    const result = await checkUsageLimits('org-1');
    expect(result.withinLimits).toBe(true);
    expect(result.exceeded).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* handleStripeWebhook                                                */
/* ------------------------------------------------------------------ */

describe('handleStripeWebhook', () => {
  it('handles subscription.created event', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    await handleStripeWebhook({
      type: 'customer.subscription.created',
      data: {
        object: { metadata: { organizationId: 'org-1' }, status: 'active' },
      },
    } as any);

    expect(getClient().from).toHaveBeenCalledWith('organizations');
  });

  it('handles subscription.updated event', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    await handleStripeWebhook({
      type: 'customer.subscription.updated',
      data: {
        object: { metadata: { organizationId: 'org-1' }, status: 'past_due' },
      },
    } as any);

    expect(getClient().from).toHaveBeenCalledWith('organizations');
  });

  it('handles subscription.deleted event - resets to free', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    await handleStripeWebhook({
      type: 'customer.subscription.deleted',
      data: {
        object: { metadata: { organizationId: 'org-1' } },
      },
    } as any);

    expect(getClient().from).toHaveBeenCalledWith('organizations');
  });

  it('handles invoice.payment_failed with org found', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'organizations')
        return createBuilder({
          data: { id: 'org-1', name: 'Acme' },
          error: null,
        });
      if (table === 'org_members')
        return createBuilder({
          data: [{ user_id: 'u1', role: 'admin' }],
          error: null,
        });
      return createBuilder();
    });
    getAdminProfileDirectoryEntries.mockResolvedValue([
      { userId: 'u1', email: 'admin@test.com', fullName: 'Admin' },
    ]);

    await handleStripeWebhook({
      type: 'invoice.payment_failed',
      data: {
        object: { customer: 'cus_1' },
      },
    } as any);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        alertType: 'warning',
        alertTitle: 'Payment failed',
      }),
    );
  });

  it('handles invoice.payment_failed with no org found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    await handleStripeWebhook({
      type: 'invoice.payment_failed',
      data: {
        object: { customer: 'cus_unknown' },
      },
    } as any);

    // Should not throw, just skip notification
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('handles invoice.payment_failed with no admin members', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return createBuilder({ data: { id: 'org-1' }, error: null });
      }
      if (table === 'org_members') {
        return createBuilder({ data: [], error: null });
      }
      return createBuilder();
    });

    await handleStripeWebhook({
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_1' } },
    } as any);

    // No userIds → early return, no emails sent
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('handles unknown event type gracefully', async () => {
    getClient().from.mockImplementation(() => createBuilder());
    // Should not throw
    await handleStripeWebhook({
      type: 'unknown.event.type',
      data: { object: {} },
    } as any);
  });
});

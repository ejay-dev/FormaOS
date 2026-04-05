/**
 * Tests for Stripe Billing Integration
 */

// createBuilder is a function DECLARATION — hoisted above jest.mock by JS engine
function createBuilder(
  result: { data?: any; error?: any; count?: number } = {
    data: null,
    error: null,
  },
) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'in',
    'gte',
    'maybeSingle',
    'single',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('stripe', () => {
  const s = {
    customers: { create: jest.fn() },
    checkout: { sessions: { create: jest.fn(), retrieve: jest.fn() } },
    subscriptions: { update: jest.fn(), retrieve: jest.fn() },
    billingPortal: { sessions: { create: jest.fn() } },
  };
  const Stripe = jest.fn().mockImplementation(() => s);
  (Stripe as any).__mockStripe = s;
  return Stripe;
});
function getMockStripe() {
  return (require('stripe') as any).__mockStripe;
}

jest.mock('@/lib/supabase/server', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});
function getClient() {
  return require('@/lib/supabase/server').__client;
}

jest.mock('@/lib/email/send-email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/users/admin-profile-directory', () => ({
  getAdminProfileDirectoryEntries: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/lib/billing/plans', () => ({
  SUBSCRIPTION_PLANS: {
    free: {
      stripePriceId: null,
      limits: {
        members: 5,
        tasks: 50,
        storage: 1,
        certificates: 3,
        apiCalls: 100,
      },
    },
    starter: {
      stripePriceId: 'price_starter',
      limits: {
        members: 20,
        tasks: 500,
        storage: 10,
        certificates: -1,
        apiCalls: 5000,
      },
    },
    pro: {
      stripePriceId: 'price_pro',
      limits: {
        members: -1,
        tasks: -1,
        storage: -1,
        certificates: -1,
        apiCalls: -1,
      },
    },
  },
}));

import {
  createStripeCustomer,
  createCheckoutSession,
  handleCheckoutSuccess,
  cancelSubscription,
  resumeSubscription,
  updateSubscriptionTier,
  createBillingPortalSession,
  checkUsageLimits,
} from '@/lib/billing';

describe('createStripeCustomer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('creates Stripe customer and saves ID', async () => {
    getMockStripe().customers.create.mockResolvedValue({ id: 'cus_123' });
    const result = await createStripeCustomer('org-1', 'test@test.com', 'Acme');
    expect(result).toBe('cus_123');
    expect(getMockStripe().customers.create).toHaveBeenCalledWith({
      email: 'test@test.com',
      name: 'Acme',
      metadata: { organizationId: 'org-1' },
    });
  });
});

describe('createCheckoutSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: { stripe_customer_id: 'cus_123', name: 'Acme' },
        error: null,
      }),
    );
  });

  it('throws for invalid tier (no stripePriceId)', async () => {
    await expect(
      createCheckoutSession('org-1', 'free' as any, '/success', '/cancel'),
    ).rejects.toThrow('Invalid subscription tier');
  });

  it('creates checkout session for valid tier', async () => {
    getMockStripe().checkout.sessions.create.mockResolvedValue({
      id: 'cs_123',
      url: 'https://checkout.stripe.com/cs_123',
    });
    const result = await createCheckoutSession(
      'org-1',
      'starter' as any,
      '/success',
      '/cancel',
    );
    expect(result.sessionId).toBe('cs_123');
    expect(result.url).toContain('stripe.com');
  });

  it('throws if organization not found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    await expect(
      createCheckoutSession('org-1', 'starter' as any, '/s', '/c'),
    ).rejects.toThrow('Organization not found');
  });
});

describe('handleCheckoutSuccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('throws if payment not completed', async () => {
    getMockStripe().checkout.sessions.retrieve.mockResolvedValue({
      payment_status: 'unpaid',
    });
    await expect(handleCheckoutSuccess('cs_123')).rejects.toThrow(
      'Payment not completed',
    );
  });

  it('updates organization subscription on success', async () => {
    getMockStripe().checkout.sessions.retrieve.mockResolvedValue({
      payment_status: 'paid',
      metadata: { organizationId: 'org-1', tier: 'starter' },
      subscription: 'sub_123',
    });
    await handleCheckoutSuccess('cs_123');
    expect(getClient().from).toHaveBeenCalledWith('organizations');
    expect(getClient().from).toHaveBeenCalledWith('subscription_events');
  });

  it('throws on invalid session metadata', async () => {
    getMockStripe().checkout.sessions.retrieve.mockResolvedValue({
      payment_status: 'paid',
      metadata: {},
    });
    await expect(handleCheckoutSuccess('cs_123')).rejects.toThrow(
      'Invalid session metadata',
    );
  });
});

describe('cancelSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('throws if no active subscription', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    await expect(cancelSubscription('org-1')).rejects.toThrow(
      'No active subscription',
    );
  });

  it('cancels at period end', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'organizations')
        return createBuilder({
          data: { stripe_subscription_id: 'sub_123' },
          error: null,
        });
      return createBuilder();
    });
    getMockStripe().subscriptions.update.mockResolvedValue({});
    await cancelSubscription('org-1');
    expect(getMockStripe().subscriptions.update).toHaveBeenCalledWith(
      'sub_123',
      {
        cancel_at_period_end: true,
      },
    );
  });
});

describe('resumeSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('throws if no subscription', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    await expect(resumeSubscription('org-1')).rejects.toThrow(
      'No subscription found',
    );
  });

  it('resumes subscription', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'organizations')
        return createBuilder({
          data: { stripe_subscription_id: 'sub_123' },
          error: null,
        });
      return createBuilder();
    });
    getMockStripe().subscriptions.update.mockResolvedValue({});
    await resumeSubscription('org-1');
    expect(getMockStripe().subscriptions.update).toHaveBeenCalledWith(
      'sub_123',
      {
        cancel_at_period_end: false,
      },
    );
  });
});

describe('updateSubscriptionTier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('throws for invalid tier', async () => {
    await expect(
      updateSubscriptionTier('org-1', 'free' as any),
    ).rejects.toThrow('Invalid tier');
  });

  it('throws if no active subscription', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    await expect(updateSubscriptionTier('org-1', 'pro' as any)).rejects.toThrow(
      'No active subscription',
    );
  });

  it('updates subscription tier with prorations', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'organizations')
        return createBuilder({
          data: { stripe_subscription_id: 'sub_123' },
          error: null,
        });
      return createBuilder();
    });
    getMockStripe().subscriptions.retrieve.mockResolvedValue({
      items: { data: [{ id: 'si_123' }] },
    });
    getMockStripe().subscriptions.update.mockResolvedValue({});
    await updateSubscriptionTier('org-1', 'pro' as any);
    expect(getMockStripe().subscriptions.update).toHaveBeenCalledWith(
      'sub_123',
      expect.objectContaining({ proration_behavior: 'create_prorations' }),
    );
  });
});

describe('createBillingPortalSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('throws if no Stripe customer', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    await expect(
      createBillingPortalSession('org-1', '/return'),
    ).rejects.toThrow('No Stripe customer');
  });

  it('returns portal URL', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { stripe_customer_id: 'cus_123' }, error: null }),
    );
    getMockStripe().billingPortal.sessions.create.mockResolvedValue({
      url: 'https://billing.stripe.com/portal',
    });
    const url = await createBillingPortalSession('org-1', '/return');
    expect(url).toBe('https://billing.stripe.com/portal');
  });
});

describe('checkUsageLimits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation((table: string) => {
      if (table === 'organizations')
        return createBuilder({
          data: {
            subscription_tier: 'pro',
            subscription_updated_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        });
      if (table === 'evidence_documents')
        return createBuilder({ data: [], error: null });
      return createBuilder({ count: 10, data: null, error: null });
    });
  });

  it('returns within limits for unlimited plan', async () => {
    const result = await checkUsageLimits('org-1');
    expect(result.withinLimits).toBe(true);
    expect(result.exceeded).toEqual([]);
  });
});

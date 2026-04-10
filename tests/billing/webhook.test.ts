/** @jest-environment node */

import type Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Mocks — declared before imports that reference them
// ---------------------------------------------------------------------------

const mockConstructEvent =
  jest.fn<(body: string, sig: string, secret: string) => Stripe.Event>();
const mockSubscriptionsRetrieve =
  jest.fn<() => Promise<Partial<Stripe.Subscription>>>();

jest.mock('@/lib/billing/stripe', () => ({
  getStripeClient: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: mockSubscriptionsRetrieve },
  }),
  resolvePlanKeyFromPriceId: (priceId: string | null) => {
    if (priceId === 'price_basic') return 'basic';
    if (priceId === 'price_pro') return 'pro';
    if (priceId === 'price_enterprise') return 'enterprise';
    return null;
  },
}));

jest.mock('@/lib/plans', () => ({
  resolvePlanKey: (value: string | null) => {
    if (!value) return null;
    const valid = ['basic', 'pro', 'enterprise'];
    return valid.includes(value) ? value : null;
  },
}));

// Track calls to specific Supabase operations
const dbCalls = {
  inserts: [] as Array<{ table: string; data: unknown }>,
  upserts: [] as Array<{ table: string; data: unknown }>,
  updates: [] as Array<{ table: string; data: unknown; filter: unknown }>,
};

// Override behavior for specific tables/operations
let dbOverrides: Record<string, { error: { message: string } | null }> = {};

function resetDb() {
  dbCalls.inserts = [];
  dbCalls.upserts = [];
  dbCalls.updates = [];
  dbOverrides = {};
}

/**
 * Creates a fluent Supabase-like mock that tracks calls and supports
 * configurable error responses via dbOverrides.
 */
function mockSupabaseAdmin() {
  return {
    from: (table: string) => ({
      insert: (data: unknown) => {
        dbCalls.inserts.push({ table, data });
        const override = dbOverrides[`${table}.insert`];
        if (override) return override;
        // Default idempotency: succeed
        return { error: null };
      },
      upsert: (data: unknown) => {
        dbCalls.upserts.push({ table, data });
        const override = dbOverrides[`${table}.upsert`];
        if (override) return override;
        return { error: null };
      },
      update: (data: unknown) => ({
        eq: (col: string, val: unknown) => {
          dbCalls.updates.push({ table, data, filter: { [col]: val } });
          const override = dbOverrides[`${table}.update`];
          if (override) return override;
          return { error: null };
        },
        match: (filter: unknown) => {
          dbCalls.updates.push({ table, data, filter });
          const override = dbOverrides[`${table}.update`];
          if (override) return override;
          return { error: null };
        },
      }),
      select: () => ({
        eq: () => ({
          maybeSingle: () => ({ data: null }),
          limit: () => ({ data: null }),
        }),
        match: () => ({
          maybeSingle: () => ({ data: null }),
        }),
      }),
    }),
  };
}

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockSupabaseAdmin(),
}));

const mockSyncEntitlements = jest.fn();
jest.mock('@/lib/billing/entitlements', () => ({
  syncEntitlementsForPlan: (...args: unknown[]) =>
    mockSyncEntitlements(...args),
}));

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('server-only', () => ({}));

// ---------------------------------------------------------------------------
// Import the handler under test
// ---------------------------------------------------------------------------
import { POST } from '@/app/api/billing/webhook/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = 'org-uuid-001';
const SUB_ID = 'sub_test123';
const CUST_ID = 'cus_test456';

function makeRequest(body = '{}', signature = 'valid-sig'): Request {
  return new Request('https://app.formaos.com.au/api/billing/webhook', {
    method: 'POST',
    body,
    headers: {
      'stripe-signature': signature,
      'content-type': 'application/json',
    },
  });
}

function stripeEvent(
  type: string,
  object: Record<string, unknown>,
  id = 'evt_test_001',
): Stripe.Event {
  return {
    id,
    type,
    data: { object },
    object: 'event',
    api_version: '2024-04-10',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: null,
  } as Stripe.Event;
}

function subscriptionObject(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: SUB_ID,
    customer: CUST_ID,
    status: 'active',
    current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
    cancel_at: null,
    metadata: { organization_id: ORG_ID, plan_key: 'pro' },
    items: { data: [{ price: { id: 'price_pro' } }] },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('POST /api/billing/webhook', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    resetDb();
    process.env = { ...ORIGINAL_ENV, STRIPE_WEBHOOK_SECRET: 'whsec_test' };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  // -----------------------------------------------------------------------
  // Guard rails
  // -----------------------------------------------------------------------

  describe('guard rails', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      const req = new Request('https://test.com/api/billing/webhook', {
        method: 'POST',
        body: '{}',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: 'Missing webhook configuration',
      });
    });

    it('returns 400 when STRIPE_WEBHOOK_SECRET is not set', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const res = await POST(makeRequest());
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: 'Missing webhook configuration',
      });
    });

    it('returns 400 when signature verification fails', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Signature mismatch');
      });

      const res = await POST(makeRequest());
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Invalid signature' });
    });
  });

  // -----------------------------------------------------------------------
  // Idempotency
  // -----------------------------------------------------------------------

  describe('idempotency', () => {
    it('returns 200 and no-ops for duplicate events (code 23505)', async () => {
      const event = stripeEvent('checkout.session.completed', {
        metadata: { organization_id: ORG_ID, plan_key: 'pro' },
        subscription: SUB_ID,
        customer: CUST_ID,
      });
      mockConstructEvent.mockReturnValue(event);
      dbOverrides['billing_events.insert'] = {
        error: { message: 'duplicate key' },
      } as { error: { message: string; code?: string } };
      // Patch the code field onto the error so the handler sees 23505
      (
        dbOverrides['billing_events.insert'] as {
          error: Record<string, string>;
        }
      ).error.code = '23505';

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ received: true });

      // Should NOT have processed the event
      expect(dbCalls.upserts).toHaveLength(0);
    });

    it('returns 500 when billing_events insert fails with non-duplicate error', async () => {
      const event = stripeEvent('checkout.session.completed', {});
      mockConstructEvent.mockReturnValue(event);
      dbOverrides['billing_events.insert'] = {
        error: { message: 'permission denied' },
      } as { error: { message: string; code?: string } };
      (
        dbOverrides['billing_events.insert'] as {
          error: Record<string, string>;
        }
      ).error.code = '42501';

      const res = await POST(makeRequest());
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Webhook persistence failed' });
    });

    it('inserts event id and type for idempotency tracking', async () => {
      const event = stripeEvent(
        'invoice.paid',
        { subscription: null, customer: null },
        'evt_unique_123',
      );
      mockConstructEvent.mockReturnValue(event);

      await POST(makeRequest());

      const billingInsert = dbCalls.inserts.find(
        (c) => c.table === 'billing_events',
      );
      expect(billingInsert).toBeDefined();
      expect(billingInsert!.data).toEqual({
        id: 'evt_unique_123',
        event_type: 'invoice.paid',
      });
    });
  });

  // -----------------------------------------------------------------------
  // checkout.session.completed
  // -----------------------------------------------------------------------

  describe('checkout.session.completed', () => {
    it('upserts subscription and syncs entitlements on checkout', async () => {
      const session = {
        metadata: {
          organization_id: ORG_ID,
          plan_key: 'pro',
          price_id: 'price_pro',
        },
        subscription: SUB_ID,
        customer: CUST_ID,
      };

      mockSubscriptionsRetrieve.mockResolvedValue({
        status: 'active',
        items: { data: [{ price: { id: 'price_pro' } }] },
        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
      } as unknown as Stripe.Subscription);

      const event = stripeEvent('checkout.session.completed', session);
      mockConstructEvent.mockReturnValue(event);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);

      // Verify Stripe subscription retrieval
      expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith(SUB_ID);

      // Verify org_subscriptions upsert
      const subUpsert = dbCalls.upserts.find(
        (c) => c.table === 'org_subscriptions',
      );
      expect(subUpsert).toBeDefined();
      expect(subUpsert!.data).toEqual(
        expect.objectContaining({
          organization_id: ORG_ID,
          plan_key: 'pro',
          status: 'active',
          stripe_customer_id: CUST_ID,
          stripe_subscription_id: SUB_ID,
        }),
      );

      // Verify organizations table updated
      const orgUpdate = dbCalls.updates.find(
        (c) => c.table === 'organizations',
      );
      expect(orgUpdate).toBeDefined();
      expect(orgUpdate!.data).toEqual({ plan_key: 'pro' });

      // Verify entitlements synced
      expect(mockSyncEntitlements).toHaveBeenCalledWith(ORG_ID, 'pro');
    });

    it('sets trial fields when subscription status is trialing', async () => {
      const futureTs = Math.floor(Date.now() / 1000) + 86400 * 14;
      const session = {
        metadata: {
          organization_id: ORG_ID,
          plan_key: 'basic',
          price_id: 'price_basic',
        },
        subscription: SUB_ID,
        customer: CUST_ID,
      };

      mockSubscriptionsRetrieve.mockResolvedValue({
        status: 'trialing',
        items: { data: [{ price: { id: 'price_basic' } }] },
        current_period_end: futureTs,
      } as unknown as Stripe.Subscription);

      const event = stripeEvent('checkout.session.completed', session);
      mockConstructEvent.mockReturnValue(event);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);

      const subUpsert = dbCalls.upserts.find(
        (c) => c.table === 'org_subscriptions',
      );
      expect(subUpsert!.data).toEqual(
        expect.objectContaining({
          status: 'trialing',
          trial_started_at: expect.any(String),
          trial_expires_at: expect.any(String),
        }),
      );
    });

    it('skips upsert when orgId or planKey is missing from metadata', async () => {
      const session = {
        metadata: { organization_id: null, plan_key: null },
        subscription: null,
        customer: null,
      };

      const event = stripeEvent('checkout.session.completed', session);
      mockConstructEvent.mockReturnValue(event);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);

      expect(
        dbCalls.upserts.filter((c) => c.table === 'org_subscriptions'),
      ).toHaveLength(0);
      expect(mockSyncEntitlements).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // customer.subscription.created / updated
  // -----------------------------------------------------------------------

  describe('customer.subscription.created', () => {
    it('upserts subscription from subscription object', async () => {
      const sub = subscriptionObject();
      const event = stripeEvent('customer.subscription.created', sub);
      mockConstructEvent.mockReturnValue(event);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);

      const subUpsert = dbCalls.upserts.find(
        (c) => c.table === 'org_subscriptions',
      );
      expect(subUpsert).toBeDefined();
      expect(subUpsert!.data).toEqual(
        expect.objectContaining({
          organization_id: ORG_ID,
          plan_key: 'pro',
          status: 'active',
          stripe_subscription_id: SUB_ID,
          stripe_customer_id: CUST_ID,
        }),
      );

      expect(mockSyncEntitlements).toHaveBeenCalledWith(ORG_ID, 'pro');
    });
  });

  describe('customer.subscription.updated', () => {
    it('updates plan_key when subscription plan changes', async () => {
      const sub = subscriptionObject({
        metadata: { organization_id: ORG_ID, plan_key: 'enterprise' },
        items: { data: [{ price: { id: 'price_enterprise' } }] },
      });
      const event = stripeEvent('customer.subscription.updated', sub);
      mockConstructEvent.mockReturnValue(event);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);

      const subUpsert = dbCalls.upserts.find(
        (c) => c.table === 'org_subscriptions',
      );
      expect(subUpsert!.data).toEqual(
        expect.objectContaining({ plan_key: 'enterprise' }),
      );

      expect(mockSyncEntitlements).toHaveBeenCalledWith(ORG_ID, 'enterprise');
    });

    it('sets trial fields when status is trialing', async () => {
      const futureTs = Math.floor(Date.now() / 1000) + 86400 * 14;
      const sub = subscriptionObject({
        status: 'trialing',
        current_period_end: futureTs,
      });
      const event = stripeEvent('customer.subscription.updated', sub);
      mockConstructEvent.mockReturnValue(event);

      await POST(makeRequest());

      const subUpsert = dbCalls.upserts.find(
        (c) => c.table === 'org_subscriptions',
      );
      expect(subUpsert!.data).toEqual(
        expect.objectContaining({
          status: 'trialing',
          trial_started_at: expect.any(String),
          trial_expires_at: expect.any(String),
        }),
      );
    });

    it('clears trial fields when status is active', async () => {
      const sub = subscriptionObject({ status: 'active' });
      const event = stripeEvent('customer.subscription.updated', sub);
      mockConstructEvent.mockReturnValue(event);

      await POST(makeRequest());

      const subUpsert = dbCalls.upserts.find(
        (c) => c.table === 'org_subscriptions',
      );
      expect(subUpsert!.data).toEqual(
        expect.objectContaining({
          status: 'active',
          trial_started_at: null,
          trial_expires_at: null,
        }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // customer.subscription.deleted
  // -----------------------------------------------------------------------

  describe('customer.subscription.deleted', () => {
    it('marks subscription as canceled', async () => {
      const sub = { id: SUB_ID, customer: CUST_ID };
      const event = stripeEvent('customer.subscription.deleted', sub);
      mockConstructEvent.mockReturnValue(event);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);

      const subUpdate = dbCalls.updates.find(
        (c) => c.table === 'org_subscriptions',
      );
      expect(subUpdate).toBeDefined();
      expect(subUpdate!.data).toEqual(
        expect.objectContaining({ status: 'canceled' }),
      );
    });

    it('returns 500 when cancellation DB update fails', async () => {
      const sub = { id: SUB_ID, customer: CUST_ID };
      const event = stripeEvent('customer.subscription.deleted', sub);
      mockConstructEvent.mockReturnValue(event);

      dbOverrides['org_subscriptions.update'] = {
        error: { message: 'DB failure' },
      };

      const res = await POST(makeRequest());
      expect(res.status).toBe(500);
    });
  });

  // -----------------------------------------------------------------------
  // invoice.paid
  // -----------------------------------------------------------------------

  describe('invoice.paid', () => {
    it('sets status to active and clears trial flags', async () => {
      const invoice = { subscription: SUB_ID, customer: CUST_ID };
      const event = stripeEvent('invoice.paid', invoice);
      mockConstructEvent.mockReturnValue(event);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);

      const subUpdate = dbCalls.updates.find(
        (c) => c.table === 'org_subscriptions',
      );
      expect(subUpdate).toBeDefined();
      expect(subUpdate!.data).toEqual(
        expect.objectContaining({
          status: 'active',
          trial_started_at: null,
          trial_expires_at: null,
        }),
      );
    });

    it('matches by customer_id when subscription_id is null', async () => {
      const invoice = { subscription: null, customer: CUST_ID };
      const event = stripeEvent('invoice.paid', invoice);
      mockConstructEvent.mockReturnValue(event);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);

      const subUpdate = dbCalls.updates.find(
        (c) => c.table === 'org_subscriptions',
      );
      expect(subUpdate).toBeDefined();
      expect(subUpdate!.filter).toEqual({ stripe_customer_id: CUST_ID });
    });

    it('matches by subscription_id when available', async () => {
      const invoice = { subscription: SUB_ID, customer: CUST_ID };
      const event = stripeEvent('invoice.paid', invoice);
      mockConstructEvent.mockReturnValue(event);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);

      const subUpdate = dbCalls.updates.find(
        (c) => c.table === 'org_subscriptions',
      );
      expect(subUpdate!.filter).toEqual({ stripe_subscription_id: SUB_ID });
    });

    it('does nothing when both subscription and customer are null', async () => {
      const invoice = { subscription: null, customer: null };
      const event = stripeEvent('invoice.paid', invoice);
      mockConstructEvent.mockReturnValue(event);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);

      expect(
        dbCalls.updates.filter((c) => c.table === 'org_subscriptions'),
      ).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // invoice.payment_failed
  // -----------------------------------------------------------------------

  describe('invoice.payment_failed', () => {
    it('sets status to past_due', async () => {
      const invoice = { subscription: SUB_ID, customer: CUST_ID };
      const event = stripeEvent('invoice.payment_failed', invoice);
      mockConstructEvent.mockReturnValue(event);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);

      const subUpdate = dbCalls.updates.find(
        (c) => c.table === 'org_subscriptions',
      );
      expect(subUpdate).toBeDefined();
      expect(subUpdate!.data).toEqual(
        expect.objectContaining({ status: 'past_due' }),
      );
    });

    it('matches by customer_id when subscription_id is null', async () => {
      const invoice = { subscription: null, customer: CUST_ID };
      const event = stripeEvent('invoice.payment_failed', invoice);
      mockConstructEvent.mockReturnValue(event);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);

      const subUpdate = dbCalls.updates.find(
        (c) => c.table === 'org_subscriptions',
      );
      expect(subUpdate!.filter).toEqual({ stripe_customer_id: CUST_ID });
    });

    it('returns 500 when DB update fails', async () => {
      const invoice = { subscription: SUB_ID, customer: CUST_ID };
      const event = stripeEvent('invoice.payment_failed', invoice);
      mockConstructEvent.mockReturnValue(event);

      dbOverrides['org_subscriptions.update'] = {
        error: { message: 'DB failure' },
      };

      const res = await POST(makeRequest());
      expect(res.status).toBe(500);
    });
  });

  // -----------------------------------------------------------------------
  // Unhandled event types
  // -----------------------------------------------------------------------

  describe('unhandled event types', () => {
    it('acknowledges but ignores unknown event types', async () => {
      const event = stripeEvent('payment_intent.succeeded', {});
      mockConstructEvent.mockReturnValue(event);

      const res = await POST(makeRequest());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ received: true });

      // No subscription mutations
      expect(
        dbCalls.upserts.filter((c) => c.table === 'org_subscriptions'),
      ).toHaveLength(0);
      expect(
        dbCalls.updates.filter((c) => c.table === 'org_subscriptions'),
      ).toHaveLength(0);
      expect(mockSyncEntitlements).not.toHaveBeenCalled();
    });
  });
});

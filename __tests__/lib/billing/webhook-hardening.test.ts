/** @jest-environment node */
/**
 * Stripe Billing Hardening Tests
 *
 * Tests webhook signature verification, event handling,
 * grace period logic, and idempotency.
 */

import {
  getGracePeriodStatus,
  isOrgReadOnly,
} from '@/lib/billing/grace-period';

// ============================================
// Grace Period Logic Tests
// ============================================

describe('Grace Period Logic', () => {
  describe('getGracePeriodStatus', () => {
    it('returns non-past-due for active subscriptions', () => {
      const status = getGracePeriodStatus({
        status: 'active',
        payment_failed_at: null,
      });
      expect(status.isPastDue).toBe(false);
      expect(status.isReadOnly).toBe(false);
      expect(status.daysRemaining).toBe(3);
    });

    it('returns grace period active for recently failed payment', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const status = getGracePeriodStatus({
        status: 'past_due',
        payment_failed_at: oneHourAgo,
      });
      expect(status.isPastDue).toBe(true);
      expect(status.isReadOnly).toBe(false);
      expect(status.daysRemaining).toBe(3);
      expect(status.graceExpiresAt).toBeTruthy();
    });

    it('returns read-only after 3-day grace period expires', () => {
      const fourDaysAgo = new Date(
        Date.now() - 4 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const status = getGracePeriodStatus({
        status: 'past_due',
        payment_failed_at: fourDaysAgo,
      });
      expect(status.isPastDue).toBe(true);
      expect(status.isReadOnly).toBe(true);
      expect(status.daysRemaining).toBe(0);
    });

    it('returns correct days remaining mid-grace-period', () => {
      const twoDaysAgo = new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const status = getGracePeriodStatus({
        status: 'past_due',
        payment_failed_at: twoDaysAgo,
      });
      expect(status.isPastDue).toBe(true);
      expect(status.isReadOnly).toBe(false);
      expect(status.daysRemaining).toBe(1);
    });

    it('handles missing payment_failed_at with past_due status', () => {
      const status = getGracePeriodStatus({
        status: 'past_due',
        payment_failed_at: null,
      });
      expect(status.isPastDue).toBe(false);
      expect(status.isReadOnly).toBe(false);
    });

    it('handles canceled subscriptions as non-past-due', () => {
      const status = getGracePeriodStatus({
        status: 'canceled',
        payment_failed_at: null,
      });
      expect(status.isPastDue).toBe(false);
      expect(status.isReadOnly).toBe(false);
    });
  });

  describe('isOrgReadOnly', () => {
    it('returns false for active org', () => {
      expect(isOrgReadOnly({ status: 'active' })).toBe(false);
    });

    it('returns false within grace period', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      expect(
        isOrgReadOnly({ status: 'past_due', payment_failed_at: oneHourAgo }),
      ).toBe(false);
    });

    it('returns true after grace period', () => {
      const fiveDaysAgo = new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString();
      expect(
        isOrgReadOnly({ status: 'past_due', payment_failed_at: fiveDaysAgo }),
      ).toBe(true);
    });
  });
});

// ============================================
// Webhook Signature Verification Tests
// ============================================

const mockStripe = {
  webhooks: {
    constructEvent: jest.fn(),
  },
};

const mockAdminFrom = jest.fn();
const mockAdminClient = {
  from: mockAdminFrom,
};

jest.mock('@/lib/billing/stripe', () => ({
  getStripeClient: () => mockStripe,
  resolvePlanKeyFromPriceId: jest.fn(() => 'basic'),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockAdminClient,
}));

jest.mock('@/lib/plans', () => ({
  resolvePlanKey: (v: string) => v || null,
  PLAN_CATALOG: {
    basic: { name: 'Starter', priceMonthly: 159 },
    pro: { name: 'Professional', priceMonthly: 239 },
    enterprise: { name: 'Enterprise', priceMonthly: 399 },
  },
}));

jest.mock('@/lib/billing/entitlements', () => ({
  syncEntitlementsForPlan: jest.fn(),
}));

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

jest.mock('@/lib/email/billing-emails', () => ({
  sendBillingEmail: jest.fn(),
}));

import { POST } from '@/app/api/billing/webhook/route';

describe('Stripe Webhook Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: idempotency insert succeeds
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'billing_events') {
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        match: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        upsert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
          match: jest.fn().mockResolvedValue({ error: null }),
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
    });
  });

  describe('Signature verification', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      const request = new Request('http://localhost/api/billing/webhook', {
        method: 'POST',
        body: '{}',
        headers: {},
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Missing webhook configuration');
    });

    it('returns 400 for invalid signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new Request('http://localhost/api/billing/webhook', {
        method: 'POST',
        body: 'raw-body',
        headers: { 'stripe-signature': 'invalid-sig' },
      });

      // Need STRIPE_WEBHOOK_SECRET env var
      const original = process.env.STRIPE_WEBHOOK_SECRET;
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

      const response = await POST(request);
      expect(response.status).toBe(400);

      process.env.STRIPE_WEBHOOK_SECRET = original;
    });

    it('processes valid signature successfully', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {
              organization_id: 'org-1',
              plan_key: 'basic',
              price_id: 'price_1',
            },
            subscription: null,
            customer: 'cus_1',
          },
        },
      });

      const original = process.env.STRIPE_WEBHOOK_SECRET;
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

      const request = new Request('http://localhost/api/billing/webhook', {
        method: 'POST',
        body: 'valid-body',
        headers: { 'stripe-signature': 'valid-sig' },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      process.env.STRIPE_WEBHOOK_SECRET = original;
    });
  });

  describe('Idempotency', () => {
    it('skips duplicate events (returns 200)', async () => {
      const original = process.env.STRIPE_WEBHOOK_SECRET;
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_duplicate',
        type: 'checkout.session.completed',
        data: { object: {} },
      });

      // Simulate duplicate: insert returns unique constraint violation
      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'billing_events') {
          return {
            insert: jest.fn().mockResolvedValue({
              error: { code: '23505', message: 'duplicate key' },
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      });

      const request = new Request('http://localhost/api/billing/webhook', {
        method: 'POST',
        body: 'body',
        headers: { 'stripe-signature': 'sig' },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.received).toBe(true);

      process.env.STRIPE_WEBHOOK_SECRET = original;
    });
  });

  describe('Event handlers', () => {
    const setupEvent = (type: string, data: Record<string, unknown>) => {
      const original = process.env.STRIPE_WEBHOOK_SECRET;
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: `evt_${type}_${Date.now()}`,
        type,
        data: { object: data },
      });

      const cleanup = () => {
        process.env.STRIPE_WEBHOOK_SECRET = original;
      };

      return { cleanup };
    };

    const makeRequest = () =>
      new Request('http://localhost/api/billing/webhook', {
        method: 'POST',
        body: 'body',
        headers: { 'stripe-signature': 'sig' },
      });

    it('handles checkout.session.completed', async () => {
      const { cleanup } = setupEvent('checkout.session.completed', {
        metadata: {
          organization_id: 'org-1',
          plan_key: 'basic',
          price_id: 'price_1',
        },
        subscription: null,
        customer: 'cus_1',
      });

      const response = await POST(makeRequest());
      expect(response.status).toBe(200);
      cleanup();
    });

    it('handles customer.subscription.created', async () => {
      const { cleanup } = setupEvent('customer.subscription.created', {
        id: 'sub_1',
        customer: 'cus_1',
        metadata: { organization_id: 'org-1', plan_key: 'basic' },
        items: { data: [{ price: { id: 'price_1' } }] },
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
      });

      const response = await POST(makeRequest());
      expect(response.status).toBe(200);
      cleanup();
    });

    it('handles customer.subscription.deleted', async () => {
      const { cleanup } = setupEvent('customer.subscription.deleted', {
        id: 'sub_1',
        customer: 'cus_1',
        metadata: {},
        items: { data: [] },
        status: 'canceled',
      });

      const response = await POST(makeRequest());
      expect(response.status).toBe(200);
      cleanup();
    });

    it('handles invoice.paid', async () => {
      const { cleanup } = setupEvent('invoice.paid', {
        subscription: 'sub_1',
        customer: 'cus_1',
      });

      const response = await POST(makeRequest());
      expect(response.status).toBe(200);
      cleanup();
    });

    it('handles invoice.payment_failed', async () => {
      const { cleanup } = setupEvent('invoice.payment_failed', {
        subscription: 'sub_1',
        customer: 'cus_1',
      });

      const response = await POST(makeRequest());
      expect(response.status).toBe(200);
      cleanup();
    });

    it('handles customer.subscription.trial_will_end', async () => {
      const { cleanup } = setupEvent('customer.subscription.trial_will_end', {
        id: 'sub_1',
        customer: 'cus_1',
        metadata: { organization_id: 'org-1' },
        items: { data: [{ price: { id: 'price_1' } }] },
        status: 'trialing',
      });

      const response = await POST(makeRequest());
      expect(response.status).toBe(200);
      cleanup();
    });

    it('handles customer.created', async () => {
      const { cleanup } = setupEvent('customer.created', {
        id: 'cus_new',
        metadata: { organization_id: 'org-1' },
      });

      const response = await POST(makeRequest());
      expect(response.status).toBe(200);
      cleanup();
    });

    it('handles invoice.payment_action_required', async () => {
      const { cleanup } = setupEvent('invoice.payment_action_required', {
        subscription: 'sub_1',
        customer: 'cus_1',
      });

      const response = await POST(makeRequest());
      expect(response.status).toBe(200);
      cleanup();
    });
  });
});

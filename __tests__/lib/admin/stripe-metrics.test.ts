/** @jest-environment node */

jest.mock('@/lib/billing/stripe', () => ({
  getStripeClient: jest.fn(),
}));

import { getStripeMetrics } from '@/lib/admin/stripe-metrics';
import { getStripeClient } from '@/lib/billing/stripe';

describe('stripe-metrics', () => {
  const mockGetStripeClient = getStripeClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
  });

  it('returns correct structure when Stripe is not configured', async () => {
    mockGetStripeClient.mockReturnValue(null);

    const result = await getStripeMetrics();

    expect(result).toMatchObject({
      live_mrr_cents: 0,
      active_subscription_count: 0,
      currency: 'usd',
      stripe_mode: 'unknown',
      subscriptions_by_interval: {},
    });
    expect(result.errors).toContain('Stripe not configured');
    expect(result.computed_at).toBeDefined();
  });

  it('detects live mode from key prefix', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_live_test123';
    mockGetStripeClient.mockReturnValue(null);

    const result = await getStripeMetrics();

    expect(result.stripe_mode).toBe('live');
  });

  it('detects test mode from key prefix', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_test123';
    mockGetStripeClient.mockReturnValue(null);

    const result = await getStripeMetrics();

    expect(result.stripe_mode).toBe('test');
  });

  it('computes MRR from monthly subscriptions', async () => {
    const mockSubscriptions = [
      {
        id: 'sub_1',
        status: 'active',
        items: {
          data: [
            {
              price: {
                unit_amount: 39900,
                currency: 'usd',
                recurring: { interval: 'month' },
              },
            },
          ],
        },
      },
      {
        id: 'sub_2',
        status: 'active',
        items: {
          data: [
            {
              price: {
                unit_amount: 120000,
                currency: 'usd',
                recurring: { interval: 'month' },
              },
            },
          ],
        },
      },
    ];

    const mockStripe = {
      subscriptions: {
        list: jest.fn().mockImplementation(async function* () {
          for (const sub of mockSubscriptions) {
            yield sub;
          }
        }),
      },
    };

    mockGetStripeClient.mockReturnValue(mockStripe);

    const result = await getStripeMetrics();

    expect(result.live_mrr_cents).toBe(159900); // 39900 + 120000
    expect(result.active_subscription_count).toBe(2);
    expect(result.currency).toBe('usd');
    expect(result.subscriptions_by_interval).toEqual({ month: 2 });
  });

  it('normalizes yearly subscriptions to monthly', async () => {
    const mockSubscriptions = [
      {
        id: 'sub_1',
        status: 'active',
        items: {
          data: [
            {
              price: {
                unit_amount: 120000, // $1200/year
                currency: 'usd',
                recurring: { interval: 'year' },
              },
            },
          ],
        },
      },
    ];

    const mockStripe = {
      subscriptions: {
        list: jest.fn().mockImplementation(async function* () {
          for (const sub of mockSubscriptions) {
            yield sub;
          }
        }),
      },
    };

    mockGetStripeClient.mockReturnValue(mockStripe);

    const result = await getStripeMetrics();

    expect(result.live_mrr_cents).toBe(10000); // 120000 / 12 = 10000
    expect(result.active_subscription_count).toBe(1);
    expect(result.subscriptions_by_interval).toEqual({ year: 1 });
  });

  it('handles mixed monthly and yearly subscriptions', async () => {
    const mockSubscriptions = [
      {
        id: 'sub_1',
        status: 'active',
        items: {
          data: [
            {
              price: {
                unit_amount: 50000, // $500/month
                currency: 'usd',
                recurring: { interval: 'month' },
              },
            },
          ],
        },
      },
      {
        id: 'sub_2',
        status: 'active',
        items: {
          data: [
            {
              price: {
                unit_amount: 600000, // $6000/year = $500/month
                currency: 'usd',
                recurring: { interval: 'year' },
              },
            },
          ],
        },
      },
    ];

    const mockStripe = {
      subscriptions: {
        list: jest.fn().mockImplementation(async function* () {
          for (const sub of mockSubscriptions) {
            yield sub;
          }
        }),
      },
    };

    mockGetStripeClient.mockReturnValue(mockStripe);

    const result = await getStripeMetrics();

    expect(result.live_mrr_cents).toBe(100000); // 50000 + (600000/12) = 100000
    expect(result.active_subscription_count).toBe(2);
    expect(result.subscriptions_by_interval).toEqual({ month: 1, year: 1 });
  });

  it('handles Stripe API errors gracefully', async () => {
    const mockStripe = {
      subscriptions: {
        list: jest.fn().mockImplementation(async function* () {
          throw new Error('Stripe API error');
        }),
      },
    };

    mockGetStripeClient.mockReturnValue(mockStripe);

    const result = await getStripeMetrics();

    expect(result.live_mrr_cents).toBe(0);
    expect(result.active_subscription_count).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Stripe API error');
  });

  it('handles subscriptions with no price data', async () => {
    const mockSubscriptions = [
      {
        id: 'sub_1',
        status: 'active',
        items: {
          data: [],
        },
      },
    ];

    const mockStripe = {
      subscriptions: {
        list: jest.fn().mockImplementation(async function* () {
          for (const sub of mockSubscriptions) {
            yield sub;
          }
        }),
      },
    };

    mockGetStripeClient.mockReturnValue(mockStripe);

    const result = await getStripeMetrics();

    expect(result.live_mrr_cents).toBe(0);
    expect(result.active_subscription_count).toBe(1); // Still counts the subscription
  });
});

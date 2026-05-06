/** @jest-environment node */

const ORIGINAL_ENV = process.env;

function loadPlansWithEnv(env: NodeJS.ProcessEnv = {}) {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV, ...env };
  return require('@/lib/billing/plans')
    .SUBSCRIPTION_PLANS as typeof import('@/lib/billing/plans').SUBSCRIPTION_PLANS;
}

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

describe('SUBSCRIPTION_PLANS Stripe price IDs', () => {
  it('uses current Foundation and Growth fallback price IDs', () => {
    const plans = loadPlansWithEnv({
      STRIPE_PRICE_FOUNDATION: undefined,
      STRIPE_PRICE_GROWTH: undefined,
      STRIPE_STARTER_PRICE_ID: undefined,
      STRIPE_PRO_PRICE_ID: undefined,
      STRIPE_PRICE_BASIC: undefined,
      STRIPE_PRICE_PRO: undefined,
    });

    expect(plans.starter.stripePriceId).toBe('price_1TOdz1AHrAKKo3OlfYxjk9WL');
    expect(plans.pro.stripePriceId).toBe('price_1TU6oqAHrAKKo3OlWUhJa2ZX');
  });

  it('uses preferred Foundation and Growth env aliases', () => {
    const plans = loadPlansWithEnv({
      STRIPE_PRICE_FOUNDATION: 'price_foundation_live',
      STRIPE_PRICE_GROWTH: 'price_growth_live',
      STRIPE_STARTER_PRICE_ID: 'price_starter_legacy',
      STRIPE_PRO_PRICE_ID: 'price_pro_legacy',
      STRIPE_PRICE_BASIC: 'price_basic_legacy',
      STRIPE_PRICE_PRO: 'price_pro_alt_legacy',
    });

    expect(plans.starter.stripePriceId).toBe('price_foundation_live');
    expect(plans.pro.stripePriceId).toBe('price_growth_live');
  });

  it('ignores stale legacy aliases for Foundation and Growth', () => {
    const plans = loadPlansWithEnv({
      STRIPE_PRICE_FOUNDATION: undefined,
      STRIPE_PRICE_GROWTH: undefined,
      STRIPE_STARTER_PRICE_ID: 'price_starter_legacy',
      STRIPE_PRO_PRICE_ID: 'price_pro_legacy',
      STRIPE_PRICE_BASIC: 'price_basic_legacy',
      STRIPE_PRICE_PRO: 'price_pro_alt_legacy',
    });

    expect(plans.starter.stripePriceId).toBe('price_1TOdz1AHrAKKo3OlfYxjk9WL');
    expect(plans.pro.stripePriceId).toBe('price_1TU6oqAHrAKKo3OlWUhJa2ZX');
  });
});

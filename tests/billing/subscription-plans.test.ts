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

// High-8 (PR #19): hardcoded `price_*` fallbacks were removed from
// lib/billing/plans.ts. Plans now resolve their stripePriceId from
// STRIPE_PRICE_* env vars or undefined when missing — production
// builds fail closed via scripts/check-env.js. This test pins that
// contract so a future regression can't re-introduce the hardcoded
// IDs.
describe('SUBSCRIPTION_PLANS Stripe price IDs', () => {
  it('returns undefined for every plan when STRIPE_PRICE_* env is unset', () => {
    const env = { ...ORIGINAL_ENV };
    delete env.STRIPE_PRICE_FOUNDATION;
    delete env.STRIPE_PRICE_GROWTH;
    delete env.STRIPE_PRICE_SCALE;
    delete env.STRIPE_PRICE_ENTERPRISE;
    const plans = loadPlansWithEnv(env);
    // Override original to fully clear instead of merging.
    expect(plans.starter.stripePriceId).toBeUndefined();
    expect(plans.pro.stripePriceId).toBeUndefined();
    expect(plans.scale.stripePriceId).toBeUndefined();
    expect(plans.enterprise.stripePriceId).toBeUndefined();
  });

  it('reads STRIPE_PRICE_FOUNDATION / GROWTH / SCALE from env', () => {
    const plans = loadPlansWithEnv({
      STRIPE_PRICE_FOUNDATION: 'price_foundation_test',
      STRIPE_PRICE_GROWTH: 'price_growth_test',
      STRIPE_PRICE_SCALE: 'price_scale_test',
    });
    expect(plans.starter.stripePriceId).toBe('price_foundation_test');
    expect(plans.pro.stripePriceId).toBe('price_growth_test');
    expect(plans.scale.stripePriceId).toBe('price_scale_test');
  });

  it('treats whitespace-only env values as missing', () => {
    const plans = loadPlansWithEnv({
      STRIPE_PRICE_FOUNDATION: '   ',
      STRIPE_PRICE_GROWTH: '',
    });
    expect(plans.starter.stripePriceId).toBeUndefined();
    expect(plans.pro.stripePriceId).toBeUndefined();
  });
});

/** @jest-environment node */

/**
 * Tests for lib/billing/stripe.ts
 * - getStripePriceId: maps plan keys to Stripe price IDs
 * - resolvePlanKeyFromPriceId: reverse-maps price IDs to plan keys
 * - getStripeClient: singleton creation, missing key handling
 */

const DEFAULTS = {
  basic: 'price_1So1UsAHrAKKo3OlrgiqfEcc',
  pro: 'price_1So1VmAHrAKKo3OlP6k9TMn4',
  enterprise: 'price_1T9cPKAHrAKKo3OliQN78Q83',
};

// Must mock stripe before importing
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    subscriptions: { retrieve: jest.fn() },
  }));
});

// Silence console.error for expected missing-key paths
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  // Reset module-level singleton between tests
  jest.resetModules();
});

describe('getStripePriceId', () => {
  it('returns default price IDs when env vars are not set', () => {
    delete process.env.STRIPE_PRICE_BASIC;
    delete process.env.STRIPE_PRICE_PRO;
    delete process.env.STRIPE_PRICE_ENTERPRISE;
    // Re-import after clearing env
    const { getStripePriceId } = require('@/lib/billing/stripe');

    expect(getStripePriceId('basic')).toBe(DEFAULTS.basic);
    expect(getStripePriceId('pro')).toBe(DEFAULTS.pro);
    expect(getStripePriceId('enterprise')).toBe(DEFAULTS.enterprise);
  });

  it('uses env var overrides when present', () => {
    process.env.STRIPE_PRICE_BASIC = 'price_override_basic';
    process.env.STRIPE_PRICE_PRO = 'price_override_pro';
    process.env.STRIPE_PRICE_ENTERPRISE = 'price_override_ent';
    const { getStripePriceId } = require('@/lib/billing/stripe');

    expect(getStripePriceId('basic')).toBe('price_override_basic');
    expect(getStripePriceId('pro')).toBe('price_override_pro');
    expect(getStripePriceId('enterprise')).toBe('price_override_ent');

    delete process.env.STRIPE_PRICE_BASIC;
    delete process.env.STRIPE_PRICE_PRO;
    delete process.env.STRIPE_PRICE_ENTERPRISE;
  });

  it('returns null for unknown plan keys', () => {
    const { getStripePriceId } = require('@/lib/billing/stripe');
    expect(getStripePriceId('nonexistent')).toBeNull();
  });
});

describe('resolvePlanKeyFromPriceId', () => {
  beforeEach(() => {
    delete process.env.STRIPE_PRICE_BASIC;
    delete process.env.STRIPE_PRICE_PRO;
    delete process.env.STRIPE_PRICE_ENTERPRISE;
  });

  it('resolves default price IDs to plan keys', () => {
    const { resolvePlanKeyFromPriceId } = require('@/lib/billing/stripe');

    expect(resolvePlanKeyFromPriceId(DEFAULTS.basic)).toBe('basic');
    expect(resolvePlanKeyFromPriceId(DEFAULTS.pro)).toBe('pro');
    expect(resolvePlanKeyFromPriceId(DEFAULTS.enterprise)).toBe('enterprise');
  });

  it('resolves env-overridden price IDs', () => {
    process.env.STRIPE_PRICE_BASIC = 'price_custom_basic';
    const { resolvePlanKeyFromPriceId } = require('@/lib/billing/stripe');

    expect(resolvePlanKeyFromPriceId('price_custom_basic')).toBe('basic');

    delete process.env.STRIPE_PRICE_BASIC;
  });

  it('returns null for null/undefined/empty input', () => {
    const { resolvePlanKeyFromPriceId } = require('@/lib/billing/stripe');

    expect(resolvePlanKeyFromPriceId(null)).toBeNull();
    expect(resolvePlanKeyFromPriceId(undefined)).toBeNull();
    expect(resolvePlanKeyFromPriceId('')).toBeNull();
  });

  it('trims whitespace before matching', () => {
    const { resolvePlanKeyFromPriceId } = require('@/lib/billing/stripe');

    expect(resolvePlanKeyFromPriceId(`  ${DEFAULTS.pro}  `)).toBe('pro');
  });
});

describe('getStripeClient', () => {
  it('returns null when STRIPE_SECRET_KEY is missing', () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { getStripeClient } = require('@/lib/billing/stripe');

    expect(getStripeClient()).toBeNull();
  });

  it('returns a Stripe instance when key is set', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const { getStripeClient } = require('@/lib/billing/stripe');

    const client = getStripeClient();
    expect(client).not.toBeNull();

    delete process.env.STRIPE_SECRET_KEY;
  });

  it('returns the same instance on subsequent calls (singleton)', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const { getStripeClient } = require('@/lib/billing/stripe');

    const a = getStripeClient();
    const b = getStripeClient();
    expect(a).toBe(b);

    delete process.env.STRIPE_SECRET_KEY;
  });
});

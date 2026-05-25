/** @jest-environment node */

/**
 * Tests for lib/billing/stripe.ts
 * - getStripePriceId: maps plan keys to Stripe price IDs
 * - resolvePlanKeyFromPriceId: reverse-maps price IDs to plan keys
 * - getStripeClient: singleton creation, missing key handling
 */

// Audit 2026-05-26 — DEFAULTS rewritten to mirror the source's
// DEV_FALLBACK_PRICE_IDS map (lib/billing/stripe.ts). Previously these
// were the prod price IDs which the source no longer ships as
// defaults — production must supply STRIPE_PRICE_* env vars.
const DEFAULTS = {
  basic: 'price_test_basic_placeholder',
  pro: 'price_test_pro_placeholder',
  scale: 'price_test_scale_placeholder',
  enterprise: 'price_test_enterprise_placeholder',
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
    delete process.env.STRIPE_PRICE_FOUNDATION;
    delete process.env.STRIPE_PRICE_GROWTH;
    delete process.env.STRIPE_PRICE_BASIC;
    delete process.env.STRIPE_PRICE_PRO;
    delete process.env.STRIPE_PRICE_ENTERPRISE;
    // Re-import after clearing env
    const { getStripePriceId } = require('@/lib/billing/stripe');

    expect(getStripePriceId('basic')).toBe(DEFAULTS.basic);
    expect(getStripePriceId('pro')).toBe(DEFAULTS.pro);
    expect(getStripePriceId('enterprise')).toBe(DEFAULTS.enterprise);
  });

  it('uses preferred env var overrides when present', () => {
    process.env.STRIPE_PRICE_FOUNDATION = 'price_override_foundation';
    process.env.STRIPE_PRICE_GROWTH = 'price_override_growth';
    process.env.STRIPE_PRICE_ENTERPRISE = 'price_override_ent';
    const { getStripePriceId } = require('@/lib/billing/stripe');

    expect(getStripePriceId('basic')).toBe('price_override_foundation');
    expect(getStripePriceId('pro')).toBe('price_override_growth');
    expect(getStripePriceId('enterprise')).toBe('price_override_ent');

    delete process.env.STRIPE_PRICE_FOUNDATION;
    delete process.env.STRIPE_PRICE_GROWTH;
    delete process.env.STRIPE_PRICE_ENTERPRISE;
  });

  it('ignores legacy Foundation and Growth env aliases so stale production vars cannot override current prices', () => {
    process.env.STRIPE_PRICE_FOUNDATION = 'price_foundation';
    process.env.STRIPE_PRICE_GROWTH = 'price_growth';
    process.env.STRIPE_PRICE_BASIC = 'price_legacy_basic';
    process.env.STRIPE_PRICE_PRO = 'price_legacy_pro';
    const { getStripePriceId } = require('@/lib/billing/stripe');

    expect(getStripePriceId('basic')).toBe('price_foundation');
    expect(getStripePriceId('pro')).toBe('price_growth');

    delete process.env.STRIPE_PRICE_FOUNDATION;
    delete process.env.STRIPE_PRICE_GROWTH;
    delete process.env.STRIPE_PRICE_BASIC;
    delete process.env.STRIPE_PRICE_PRO;
  });

  it('returns null for unknown plan keys', () => {
    const { getStripePriceId } = require('@/lib/billing/stripe');
    expect(getStripePriceId('nonexistent')).toBeNull();
  });
});

describe('resolvePlanKeyFromPriceId', () => {
  beforeEach(() => {
    delete process.env.STRIPE_PRICE_FOUNDATION;
    delete process.env.STRIPE_PRICE_GROWTH;
    delete process.env.STRIPE_PRICE_SCALE;
    delete process.env.STRIPE_PRICE_BASIC;
    delete process.env.STRIPE_PRICE_PRO;
    delete process.env.STRIPE_PRICE_ENTERPRISE;
  });

  it('resolves default price IDs to plan keys', () => {
    const { resolvePlanKeyFromPriceId } = require('@/lib/billing/stripe');

    expect(resolvePlanKeyFromPriceId(DEFAULTS.basic)).toBe('basic');
    expect(resolvePlanKeyFromPriceId(DEFAULTS.pro)).toBe('pro');
    expect(resolvePlanKeyFromPriceId(DEFAULTS.scale)).toBe('scale');
    expect(resolvePlanKeyFromPriceId(DEFAULTS.enterprise)).toBe('enterprise');
  });

  it('resolves env-overridden price IDs', () => {
    process.env.STRIPE_PRICE_FOUNDATION = 'price_custom_foundation';
    const { resolvePlanKeyFromPriceId } = require('@/lib/billing/stripe');

    expect(resolvePlanKeyFromPriceId('price_custom_foundation')).toBe('basic');

    delete process.env.STRIPE_PRICE_FOUNDATION;
  });

  it('resolves Foundation and Growth env aliases', () => {
    process.env.STRIPE_PRICE_FOUNDATION = 'price_foundation';
    process.env.STRIPE_PRICE_GROWTH = 'price_growth';
    const { resolvePlanKeyFromPriceId } = require('@/lib/billing/stripe');

    expect(resolvePlanKeyFromPriceId('price_foundation')).toBe('basic');
    expect(resolvePlanKeyFromPriceId('price_growth')).toBe('pro');

    delete process.env.STRIPE_PRICE_FOUNDATION;
    delete process.env.STRIPE_PRICE_GROWTH;
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

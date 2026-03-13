/** @jest-environment node */

/**
 * Unit tests for lib/billing.ts (data structures and pure validation)
 *
 * Tests SUBSCRIPTION_PLANS data integrity and SubscriptionTier type.
 * Does not test Stripe API calls or Supabase interactions.
 */

import { SUBSCRIPTION_PLANS, type SubscriptionTier } from '@/lib/billing/plans';

// -------------------------------------------------------------------------
// SUBSCRIPTION_PLANS structure
// -------------------------------------------------------------------------

describe('SUBSCRIPTION_PLANS', () => {
  const allTiers: SubscriptionTier[] = ['free', 'starter', 'pro', 'enterprise'];

  it('defines all expected tiers', () => {
    for (const tier of allTiers) {
      expect(SUBSCRIPTION_PLANS[tier]).toBeDefined();
    }
  });

  it('has exactly 4 tiers', () => {
    expect(Object.keys(SUBSCRIPTION_PLANS)).toHaveLength(4);
  });

  it('each plan has required fields', () => {
    for (const tier of allTiers) {
      const plan = SUBSCRIPTION_PLANS[tier];
      expect(plan.id).toBe(tier);
      expect(typeof plan.name).toBe('string');
      expect(plan.name.length).toBeGreaterThan(0);
      expect(typeof plan.price).toBe('number');
      expect(plan.price).toBeGreaterThanOrEqual(0);
      expect(['month', 'year']).toContain(plan.interval);
      expect(Array.isArray(plan.features)).toBe(true);
      expect(plan.features.length).toBeGreaterThan(0);
      expect(plan.limits).toBeDefined();
    }
  });

  it('free plan has $0 price', () => {
    expect(SUBSCRIPTION_PLANS.free.price).toBe(0);
  });

  it('free plan has no Stripe price ID', () => {
    expect(SUBSCRIPTION_PLANS.free.stripePriceId).toBeUndefined();
  });

  it('plan limits have required fields', () => {
    for (const tier of allTiers) {
      const limits = SUBSCRIPTION_PLANS[tier].limits;
      expect(limits).toHaveProperty('members');
      expect(limits).toHaveProperty('tasks');
      expect(limits).toHaveProperty('storage');
      expect(limits).toHaveProperty('certificates');
      expect(limits).toHaveProperty('apiCalls');
    }
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
    expect(SUBSCRIPTION_PLANS.pro.price).toBeLessThan(
      SUBSCRIPTION_PLANS.enterprise.price,
    );
  });

  it('free plan limits are the most restrictive', () => {
    const freeLimits = SUBSCRIPTION_PLANS.free.limits;
    const starterLimits = SUBSCRIPTION_PLANS.starter.limits;

    expect(freeLimits.members).toBeLessThanOrEqual(starterLimits.members);
    expect(freeLimits.apiCalls).toBeLessThanOrEqual(starterLimits.apiCalls);
  });

  it('member limits increase with tier (excluding unlimited)', () => {
    expect(SUBSCRIPTION_PLANS.free.limits.members).toBeLessThan(
      SUBSCRIPTION_PLANS.starter.limits.members,
    );
    expect(SUBSCRIPTION_PLANS.starter.limits.members).toBeLessThan(
      SUBSCRIPTION_PLANS.pro.limits.members,
    );
  });

  it('all features are non-empty strings', () => {
    for (const tier of allTiers) {
      for (const feature of SUBSCRIPTION_PLANS[tier].features) {
        expect(typeof feature).toBe('string');
        expect(feature.length).toBeGreaterThan(0);
      }
    }
  });
});

/** @jest-environment node */

/**
 * Unit tests for lib/plans.ts
 *
 * Tests PlanKey type guards, PLAN_CATALOG structure,
 * isPlanKey(), and resolvePlanKey().
 */

import {
  PLAN_CATALOG,
  getAllBillingPlans,
  getBillingPlan,
  isPlanKey,
  resolvePlanKey,
  type PlanKey,
  type PlanConfig,
} from '@/lib/plans';

// -------------------------------------------------------------------------
// PLAN_CATALOG structure
// -------------------------------------------------------------------------

describe('PLAN_CATALOG', () => {
  // Audit Sprint 6a (2026-05-23): scale was missing from this list while
  // PLAN_CATALOG.scale already existed — the assertion silently skipped it.
  const expectedPlans: PlanKey[] = ['basic', 'pro', 'scale', 'enterprise'];

  it('contains all expected plan keys', () => {
    for (const plan of expectedPlans) {
      expect(PLAN_CATALOG[plan]).toBeDefined();
    }
  });

  it('each plan has required fields', () => {
    for (const [_key, plan] of Object.entries(PLAN_CATALOG) as [
      string,
      PlanConfig,
    ][]) {
      expect(plan).toHaveProperty('name');
      expect(typeof plan.name).toBe('string');
      expect(plan.name.length).toBeGreaterThan(0);

      expect(plan).toHaveProperty('limits');
      expect(typeof plan.limits).toBe('object');

      expect(plan).toHaveProperty('key');
      expect(plan).toHaveProperty('summary');
      expect(plan).toHaveProperty('features');
      expect(Array.isArray(plan.features)).toBe(true);
    }
  });

  it('plan limits are numbers or "unlimited"', () => {
    for (const [_key, plan] of Object.entries(PLAN_CATALOG) as [
      string,
      PlanConfig,
    ][]) {
      for (const [_limitKey, limitValue] of Object.entries(plan.limits)) {
        expect(
          typeof limitValue === 'number' || limitValue === 'unlimited',
        ).toBe(true);
      }
    }
  });

  it('enterprise plan has unlimited limits', () => {
    const enterprise = PLAN_CATALOG.enterprise;

    expect(enterprise.limits.maxSites).toBe('unlimited');
    expect(enterprise.limits.maxUsers).toBe('unlimited');
    expect(enterprise.limits.maxFrameworks).toBe('unlimited');
  });

  it('basic plan has numeric limits', () => {
    const basic = PLAN_CATALOG.basic;

    expect(typeof basic.limits.maxSites).toBe('number');
    expect(typeof basic.limits.maxUsers).toBe('number');
    expect(typeof basic.limits.maxFrameworks).toBe('number');
  });

  it('pro plan limits are >= basic plan limits', () => {
    const pro = PLAN_CATALOG.pro;
    const basic = PLAN_CATALOG.basic;

    // Both pro and basic should have numeric limits
    expect(pro.limits.maxSites).toBeGreaterThanOrEqual(
      basic.limits.maxSites as number,
    );
    expect(pro.limits.maxUsers).toBeGreaterThanOrEqual(
      basic.limits.maxUsers as number,
    );
    expect(pro.limits.maxFrameworks).toBeGreaterThanOrEqual(
      basic.limits.maxFrameworks as number,
    );
  });
});

// -------------------------------------------------------------------------
// isPlanKey
// -------------------------------------------------------------------------

describe('isPlanKey', () => {
  it('returns true for valid plan keys', () => {
    expect(isPlanKey('basic')).toBe(true);
    expect(isPlanKey('pro')).toBe(true);
    expect(isPlanKey('enterprise')).toBe(true);
  });

  it('returns false for invalid plan keys', () => {
    expect(isPlanKey('free')).toBe(false);
    expect(isPlanKey('premium')).toBe(false);
    expect(isPlanKey('starter')).toBe(false);
    expect(isPlanKey('')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isPlanKey(null)).toBe(false);
    expect(isPlanKey(undefined)).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(isPlanKey('Basic')).toBe(false);
    expect(isPlanKey('PRO')).toBe(false);
    expect(isPlanKey('ENTERPRISE')).toBe(false);
  });
});

// -------------------------------------------------------------------------
// resolvePlanKey
// -------------------------------------------------------------------------

describe('resolvePlanKey', () => {
  it('returns the same key for valid plan keys', () => {
    expect(resolvePlanKey('basic')).toBe('basic');
    expect(resolvePlanKey('pro')).toBe('pro');
    expect(resolvePlanKey('scale')).toBe('scale');
    expect(resolvePlanKey('enterprise')).toBe('enterprise');
  });

  it('returns null for invalid input', () => {
    expect(resolvePlanKey('invalid')).toBeNull();
    expect(resolvePlanKey('free')).toBeNull();
    expect(resolvePlanKey('premium')).toBeNull();
  });

  it('returns null for null/undefined input', () => {
    expect(resolvePlanKey(null)).toBeNull();
    expect(resolvePlanKey(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(resolvePlanKey('')).toBeNull();
  });

  it('normalizes case to lowercase', () => {
    expect(resolvePlanKey('Basic')).toBe('basic');
    expect(resolvePlanKey('PRO')).toBe('pro');
    expect(resolvePlanKey('Scale')).toBe('scale');
    expect(resolvePlanKey('Enterprise')).toBe('enterprise');
  });
});

// -------------------------------------------------------------------------
// getBillingPlan / getAllBillingPlans (Sprint 4b helpers, exercised by
// app/api/billing/route.ts). Sprint 6a adds explicit scale coverage so
// the tier-provisioning regression bites here first if it ever drifts.
// -------------------------------------------------------------------------

describe('getBillingPlan', () => {
  it('returns Foundation shape for basic', () => {
    const plan = getBillingPlan('basic');
    expect(plan.id).toBe('basic');
    expect(plan.name).toBe('Foundation');
    expect(plan.price).toBe(297);
    expect(plan.interval).toBe('month');
    expect(plan.limits.members).toBe(10);
  });

  it('returns Scale shape with $1,800 monthly', () => {
    const plan = getBillingPlan('scale');
    expect(plan.id).toBe('scale');
    expect(plan.name).toBe('Scale');
    expect(plan.price).toBe(1800);
    expect(plan.limits.members).toBe(75);
  });

  it('resolves stripePriceId from STRIPE_PRICE_SCALE env when set', () => {
    const original = process.env.STRIPE_PRICE_SCALE;
    process.env.STRIPE_PRICE_SCALE = 'price_scale_test_123';
    try {
      expect(getBillingPlan('scale').stripePriceId).toBe('price_scale_test_123');
    } finally {
      if (original === undefined) delete process.env.STRIPE_PRICE_SCALE;
      else process.env.STRIPE_PRICE_SCALE = original;
    }
  });

  it('returns undefined stripePriceId when env not set', () => {
    const original = process.env.STRIPE_PRICE_SCALE;
    delete process.env.STRIPE_PRICE_SCALE;
    try {
      expect(getBillingPlan('scale').stripePriceId).toBeUndefined();
    } finally {
      if (original !== undefined) process.env.STRIPE_PRICE_SCALE = original;
    }
  });
});

describe('getAllBillingPlans', () => {
  it('returns every PlanKey including scale', () => {
    const ids = getAllBillingPlans().map((p) => p.id).sort();
    expect(ids).toEqual(['basic', 'enterprise', 'pro', 'scale']);
  });
});

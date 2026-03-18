/** @jest-environment node */

/**
 * Unit tests for lib/plans.ts
 *
 * Tests PlanKey type guards, PLAN_CATALOG structure,
 * isPlanKey(), and resolvePlanKey().
 */

import {
  PLAN_CATALOG,
  isPlanKey,
  resolvePlanKey,
  type PlanKey,
  type PlanConfig,
} from '@/lib/plans';

// -------------------------------------------------------------------------
// PLAN_CATALOG structure
// -------------------------------------------------------------------------

describe('PLAN_CATALOG', () => {
  const expectedPlans: PlanKey[] = ['basic', 'pro', 'enterprise'];

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
    expect(resolvePlanKey('Enterprise')).toBe('enterprise');
  });
});

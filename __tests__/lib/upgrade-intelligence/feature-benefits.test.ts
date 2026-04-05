/**
 * Tests for lib/upgrade-intelligence/feature-benefits.ts (320 LOC)
 */

import {
  FEATURE_BENEFITS,
  getFeatureBenefit,
  getFeaturesForPlan,
  getLockedFeaturesForPlan,
  getFeaturesByCategory,
} from '@/lib/upgrade-intelligence/feature-benefits';

describe('FEATURE_BENEFITS', () => {
  it('is a non-empty object', () => {
    expect(Object.keys(FEATURE_BENEFITS).length).toBeGreaterThan(0);
  });

  it('each feature has required fields', () => {
    for (const feature of Object.values(FEATURE_BENEFITS)) {
      expect(feature.id).toBeTruthy();
      expect(feature.title).toBeTruthy();
      expect(feature.description).toBeTruthy();
      expect(feature.icon).toBeDefined();
      expect(feature.benefits.length).toBeGreaterThan(0);
      expect(feature.useCases.length).toBeGreaterThan(0);
      expect(['basic', 'pro', 'enterprise']).toContain(feature.requiredPlan);
      expect(feature.category).toBeTruthy();
    }
  });

  it('feature IDs match object keys', () => {
    for (const [key, feature] of Object.entries(FEATURE_BENEFITS)) {
      expect(feature.id).toBe(key);
    }
  });
});

describe('getFeatureBenefit', () => {
  it('returns feature for known ID', () => {
    const firstKey = Object.keys(FEATURE_BENEFITS)[0];
    const feature = getFeatureBenefit(firstKey);
    expect(feature).not.toBeNull();
    expect(feature!.id).toBe(firstKey);
  });

  it('returns null for unknown ID', () => {
    expect(getFeatureBenefit('nonexistent')).toBeNull();
  });
});

describe('getFeaturesForPlan', () => {
  it('enterprise includes all features', () => {
    const enterprise = getFeaturesForPlan('enterprise');
    expect(enterprise.length).toBe(Object.keys(FEATURE_BENEFITS).length);
  });

  it('basic includes only basic features', () => {
    const basic = getFeaturesForPlan('basic');
    for (const f of basic) {
      expect(f.requiredPlan).toBe('basic');
    }
  });

  it('pro includes basic + pro features', () => {
    const pro = getFeaturesForPlan('pro');
    for (const f of pro) {
      expect(['basic', 'pro']).toContain(f.requiredPlan);
    }
  });

  it('enterprise >= pro >= basic', () => {
    const basic = getFeaturesForPlan('basic');
    const pro = getFeaturesForPlan('pro');
    const enterprise = getFeaturesForPlan('enterprise');
    expect(pro.length).toBeGreaterThanOrEqual(basic.length);
    expect(enterprise.length).toBeGreaterThanOrEqual(pro.length);
  });
});

describe('getLockedFeaturesForPlan', () => {
  it('enterprise has no locked features', () => {
    expect(getLockedFeaturesForPlan('enterprise')).toHaveLength(0);
  });

  it('basic has the most locked features', () => {
    const basicLocked = getLockedFeaturesForPlan('basic');
    const proLocked = getLockedFeaturesForPlan('pro');
    expect(basicLocked.length).toBeGreaterThanOrEqual(proLocked.length);
  });

  it('locked + available = total for any plan', () => {
    const total = Object.keys(FEATURE_BENEFITS).length;
    for (const plan of ['basic', 'pro', 'enterprise'] as const) {
      const available = getFeaturesForPlan(plan).length;
      const locked = getLockedFeaturesForPlan(plan).length;
      expect(available + locked).toBe(total);
    }
  });
});

describe('getFeaturesByCategory', () => {
  it('returns only compliance features', () => {
    const compliance = getFeaturesByCategory('compliance');
    for (const f of compliance) {
      expect(f.category).toBe('compliance');
    }
  });

  it('returns only automation features', () => {
    const automation = getFeaturesByCategory('automation');
    for (const f of automation) {
      expect(f.category).toBe('automation');
    }
  });

  it('all categories together equal total', () => {
    const categories = [
      'compliance',
      'automation',
      'reporting',
      'team',
      'security',
      'integrations',
    ] as const;
    let totalCat = 0;
    for (const cat of categories) {
      totalCat += getFeaturesByCategory(cat).length;
    }
    expect(totalCat).toBe(Object.keys(FEATURE_BENEFITS).length);
  });
});

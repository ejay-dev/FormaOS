/**
 * High-8: plan-catalog consistency
 *
 * FormaOS historically carried two plan catalogs that drifted:
 *   - lib/plans.ts        (PLAN_CATALOG)            keys: basic|pro|scale|enterprise
 *   - lib/billing/plans.ts (SUBSCRIPTION_PLANS)     keys: free|starter|pro|scale|enterprise
 * plus a DB seed in 20250317_billing_core.sql that used yet a third price set.
 *
 * The 'free' tier was removed (no free access — payment is required on
 * signup) and the legacy 'basic' key from PLAN_CATALOG aliases to 'starter'
 * everywhere it crosses the SUBSCRIPTION_PLANS surface (see
 * app/api/billing/route.ts). This test guards both invariants so the two
 * catalogs cannot silently diverge again.
 */

import { PLAN_CATALOG } from '@/lib/plans';
import { SUBSCRIPTION_PLANS } from '@/lib/billing/plans';

describe('plan catalog consistency', () => {
  it('SUBSCRIPTION_PLANS does not include a "free" tier', () => {
    expect(Object.keys(SUBSCRIPTION_PLANS)).not.toContain('free');
  });

  it('every PLAN_CATALOG entry maps cleanly to SUBSCRIPTION_PLANS (with basic→starter alias)', () => {
    const aliasMap: Record<string, string> = { basic: 'starter' };
    for (const planKey of Object.keys(PLAN_CATALOG)) {
      const expected = aliasMap[planKey] ?? planKey;
      expect(SUBSCRIPTION_PLANS).toHaveProperty(expected);
    }
  });

  it('no plan ships with a hardcoded production-style price ID — env-only', () => {
    // Hardcoded price IDs were removed in High-8 to fix a secret-hygiene
    // smell. Plans should resolve their stripePriceId from STRIPE_PRICE_*
    // env vars, or be undefined when the env is missing. A literal string
    // matching `price_1...` in the bundled catalog (without env override)
    // is a regression.
    const keysToClear = [
      'STRIPE_PRICE_FOUNDATION',
      'STRIPE_PRICE_GROWTH',
      'STRIPE_PRICE_SCALE',
      'STRIPE_PRICE_ENTERPRISE',
    ];
    const saved: Record<string, string | undefined> = {};
    for (const k of keysToClear) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    // Re-require to pick up the cleared env. Jest's module cache makes this
    // necessary — the constants are evaluated at import time.
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SUBSCRIPTION_PLANS: fresh } =
      require('@/lib/billing/plans') as typeof import('@/lib/billing/plans');
    for (const k of keysToClear) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
    }

    for (const plan of Object.values(fresh)) {
      expect(plan.stripePriceId).toBeUndefined();
    }
  });
});

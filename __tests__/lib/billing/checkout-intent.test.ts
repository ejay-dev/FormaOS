/** @jest-environment node */

import {
  CHECKOUT_INTENT_COOKIE,
  CHECKOUT_INTENT_TTL_SECONDS,
  isSelfServePlan,
  parseCheckoutIntent,
} from '@/lib/billing/checkout-intent';
import { PLAN_CATALOG, type PlanKey } from '@/lib/plans';

// The only plan that must never reach self-serve Stripe Checkout.
const SALES_LED_PLANS: PlanKey[] = ['enterprise'];

describe('checkout-intent helpers', () => {
  describe('constants', () => {
    it('exposes a stable cookie name', () => {
      expect(CHECKOUT_INTENT_COOKIE).toBe('formaos_checkout_intent');
    });

    it('uses a 24-hour TTL so the cookie survives email verification + onboarding', () => {
      expect(CHECKOUT_INTENT_TTL_SECONDS).toBe(60 * 60 * 24);
    });
  });

  describe('isSelfServePlan', () => {
    it('treats Foundation (basic) as self-serve', () => {
      expect(isSelfServePlan('basic')).toBe(true);
    });

    it('treats Growth (pro) as self-serve', () => {
      expect(isSelfServePlan('pro')).toBe(true);
    });

    it('treats Scale as self-serve', () => {
      expect(isSelfServePlan('scale')).toBe(true);
    });

    it('blocks Enterprise — invoice-only via Stripe Invoicing', () => {
      expect(isSelfServePlan('enterprise')).toBe(false);
    });

    // Guards the catalog itself: a plan key added to PLAN_CATALOG without a
    // deliberate decision here fails this test instead of silently defaulting
    // into (or out of) self-serve checkout.
    it('classifies every plan in the catalog', () => {
      const catalogKeys = (Object.keys(PLAN_CATALOG) as PlanKey[]).sort();
      expect(catalogKeys).toEqual(['basic', 'enterprise', 'pro', 'scale']);

      for (const key of catalogKeys) {
        expect(isSelfServePlan(key)).toBe(!SALES_LED_PLANS.includes(key));
      }
    });
  });

  describe('parseCheckoutIntent', () => {
    it('returns the plan key when input is a self-serve plan', () => {
      expect(parseCheckoutIntent('basic')).toBe('basic');
      expect(parseCheckoutIntent('pro')).toBe('pro');
    });

    it('normalizes case so query params and cookie values match', () => {
      expect(parseCheckoutIntent('BASIC')).toBe('basic');
    });

    it('returns null for enterprise — invoice-only via Stripe Invoicing', () => {
      expect(parseCheckoutIntent('enterprise')).toBeNull();
    });

    // Audit 2026-08-02: this case previously re-asserted the enterprise
    // expectation verbatim, so no other plan in the sales-led/self-serve
    // split was exercised. It now walks the whole catalog: every non-
    // enterprise plan must round-trip, and enterprise alone must be null.
    it('passes through every self-serve plan and blocks only the sales-led ones', () => {
      for (const key of Object.keys(PLAN_CATALOG) as PlanKey[]) {
        expect(parseCheckoutIntent(key)).toBe(
          SALES_LED_PLANS.includes(key) ? null : key,
        );
      }
      expect(parseCheckoutIntent('scale')).toBe('scale');
    });

    it('returns null for unknown values so the auto-checkout handshake is safe', () => {
      expect(parseCheckoutIntent('foundation')).toBeNull();
      expect(parseCheckoutIntent('free')).toBeNull();
      expect(parseCheckoutIntent('')).toBeNull();
      expect(parseCheckoutIntent(null)).toBeNull();
      expect(parseCheckoutIntent(undefined)).toBeNull();
    });
  });
});

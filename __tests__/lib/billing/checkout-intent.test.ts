/** @jest-environment node */

import {
  CHECKOUT_INTENT_COOKIE,
  CHECKOUT_INTENT_TTL_SECONDS,
  isSelfServePlan,
  parseCheckoutIntent,
} from '@/lib/billing/checkout-intent';

describe('checkout-intent helpers', () => {
  describe('constants', () => {
    it('exposes a stable cookie name', () => {
      expect(CHECKOUT_INTENT_COOKIE).toBe('formaos_checkout_intent');
    });

    it('uses a 30-minute TTL so the cookie survives email verification', () => {
      expect(CHECKOUT_INTENT_TTL_SECONDS).toBe(60 * 30);
    });
  });

  describe('isSelfServePlan', () => {
    it('treats Foundation (basic) as self-serve', () => {
      expect(isSelfServePlan('basic')).toBe(true);
    });

    it('blocks Growth (pro) — sales-led', () => {
      expect(isSelfServePlan('pro')).toBe(false);
    });

    it('blocks Enterprise — invoice-only via Stripe Invoicing', () => {
      expect(isSelfServePlan('enterprise')).toBe(false);
    });
  });

  describe('parseCheckoutIntent', () => {
    it('returns the plan key when input is a self-serve plan', () => {
      expect(parseCheckoutIntent('basic')).toBe('basic');
    });

    it('normalizes case so query params and cookie values match', () => {
      expect(parseCheckoutIntent('BASIC')).toBe('basic');
    });

    it('returns null for sales-led plans even if they are valid plan keys', () => {
      expect(parseCheckoutIntent('pro')).toBeNull();
      expect(parseCheckoutIntent('enterprise')).toBeNull();
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

/** @jest-environment node */

import { shouldAutoCancelMissingStripe } from '@/lib/billing/nightly-reconciliation';
import { shouldAutoFixEntitlements } from '@/lib/billing/entitlement-drift-detector';

describe('billing integrity invariants', () => {
  it('does not auto-cancel active or trialing subscriptions when Stripe is missing', () => {
    expect(shouldAutoCancelMissingStripe('active')).toBe(false);
    expect(shouldAutoCancelMissingStripe('trialing')).toBe(false);
  });

  it('does not auto-cancel when status is unknown', () => {
    expect(shouldAutoCancelMissingStripe(null)).toBe(false);
    expect(shouldAutoCancelMissingStripe('')).toBe(false);
  });

  it('allows auto-cancel for non-active statuses', () => {
    expect(shouldAutoCancelMissingStripe('past_due')).toBe(true);
    expect(shouldAutoCancelMissingStripe('canceled')).toBe(true);
    expect(shouldAutoCancelMissingStripe('incomplete')).toBe(true);
  });

  it('only auto-fixes entitlements for active or trialing orgs', () => {
    expect(shouldAutoFixEntitlements('active')).toBe(true);
    expect(shouldAutoFixEntitlements('trialing')).toBe(true);
    expect(shouldAutoFixEntitlements('canceled')).toBe(false);
    expect(shouldAutoFixEntitlements(null)).toBe(false);
  });
});

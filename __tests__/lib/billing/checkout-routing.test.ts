import {
  planCodeForBilling,
  shouldOpenBillingPortalForCheckout,
} from '@/lib/billing/checkout-routing';

describe('billing checkout routing', () => {
  const stripeIds = {
    stripeCustomerId: 'cus_test_123',
    stripeSubscriptionId: 'sub_test_123',
  };

  it('opens the billing portal for existing paid subscriptions', () => {
    expect(
      shouldOpenBillingPortalForCheckout({
        targetPlan: 'pro',
        currentPlan: 'basic',
        status: 'active',
        ...stripeIds,
      }),
    ).toBe(true);

    expect(
      shouldOpenBillingPortalForCheckout({
        targetPlan: 'pro',
        currentPlan: 'basic',
        status: 'past_due',
        ...stripeIds,
      }),
    ).toBe(true);
  });

  it('keeps old trial users on Stripe Checkout when they change plan', () => {
    expect(
      shouldOpenBillingPortalForCheckout({
        targetPlan: 'pro',
        currentPlan: 'basic',
        status: 'trialing',
        ...stripeIds,
      }),
    ).toBe(false);
  });

  it('allows same-plan trial billing management through the portal', () => {
    expect(
      shouldOpenBillingPortalForCheckout({
        targetPlan: 'pro',
        currentPlan: 'pro',
        status: 'trialing',
        ...stripeIds,
      }),
    ).toBe(true);
  });

  it('does not open the portal without a complete Stripe customer/subscription pair', () => {
    expect(
      shouldOpenBillingPortalForCheckout({
        targetPlan: 'pro',
        currentPlan: 'pro',
        status: 'active',
        stripeCustomerId: 'cus_test_123',
        stripeSubscriptionId: null,
      }),
    ).toBe(false);
  });

  it('keeps legacy plan_code compatibility for Foundation subscriptions', () => {
    expect(planCodeForBilling('basic')).toBe('starter');
    expect(planCodeForBilling('pro')).toBe('pro');
    expect(planCodeForBilling('enterprise')).toBe('enterprise');
  });
});

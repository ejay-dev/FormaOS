import {
  getEffectiveOrganizationStatus,
  resolveSubscriptionStatusForRestore,
} from '@/lib/admin/org-lifecycle';

describe('admin org lifecycle helpers', () => {
  it('prefers retired lifecycle state over subscription status', () => {
    expect(
      getEffectiveOrganizationStatus({
        lifecycleStatus: 'retired',
        subscriptionStatus: 'active',
      }),
    ).toEqual({
      status: 'retired',
      lifecycleStatus: 'retired',
      subscriptionStatus: 'active',
    });
  });

  it('prefers suspended lifecycle state over subscription status', () => {
    expect(
      getEffectiveOrganizationStatus({
        lifecycleStatus: 'suspended',
        subscriptionStatus: 'active',
      }),
    ).toEqual({
      status: 'suspended',
      lifecycleStatus: 'suspended',
      subscriptionStatus: 'active',
    });
  });

  it('restores to active when a stripe subscription exists', () => {
    expect(
      resolveSubscriptionStatusForRestore({
        stripe_subscription_id: 'sub_123',
        payment_failures: 0,
      }),
    ).toBe('active');
  });

  it('restores to trialing when the trial is still active', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    expect(
      resolveSubscriptionStatusForRestore({
        trial_expires_at: future,
        payment_failures: 0,
      }),
    ).toBe('trialing');
  });
});

/**
 * Grace period logic for payment failures.
 *
 * When invoice.payment_failed fires:
 * - Sets org.payment_status = 'past_due', payment_failed_at = now()
 * - For 3 days: full access continues (grace period)
 * - After 3 days: organization is restricted to read-only mode
 * - On invoice.payment_succeeded: restores full access, clears flags
 */

const GRACE_PERIOD_DAYS = 3;

export interface GracePeriodStatus {
  isPastDue: boolean;
  isReadOnly: boolean;
  daysRemaining: number;
  paymentFailedAt: Date | null;
  graceExpiresAt: Date | null;
}

/**
 * Calculate grace period status from a subscription record.
 */
export function getGracePeriodStatus(subscription: {
  status?: string | null;
  payment_failed_at?: string | null;
}): GracePeriodStatus {
  const isPastDue = subscription.status === 'past_due';

  if (!isPastDue || !subscription.payment_failed_at) {
    return {
      isPastDue: false,
      isReadOnly: false,
      daysRemaining: GRACE_PERIOD_DAYS,
      paymentFailedAt: null,
      graceExpiresAt: null,
    };
  }

  const failedAt = new Date(subscription.payment_failed_at);
  const graceExpiresAt = new Date(
    failedAt.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  );
  const now = new Date();
  const msRemaining = graceExpiresAt.getTime() - now.getTime();
  const daysRemaining = Math.max(
    0,
    Math.ceil(msRemaining / (24 * 60 * 60 * 1000)),
  );
  const isReadOnly = now >= graceExpiresAt;

  return {
    isPastDue: true,
    isReadOnly,
    daysRemaining,
    paymentFailedAt: failedAt,
    graceExpiresAt,
  };
}

/**
 * Check if an organisation should be in read-only mode.
 */
export function isOrgReadOnly(subscription: {
  status?: string | null;
  payment_failed_at?: string | null;
}): boolean {
  return getGracePeriodStatus(subscription).isReadOnly;
}

import { resolvePlanKey, type PlanKey } from '@/lib/plans';

type CheckoutRoutingInput = {
  targetPlan: string | null | undefined;
  currentPlan: string | null | undefined;
  status: string | null | undefined;
  stripeCustomerId: string | null | undefined;
  stripeSubscriptionId: string | null | undefined;
};

export function shouldOpenBillingPortalForCheckout({
  targetPlan,
  currentPlan,
  status,
  stripeCustomerId,
  stripeSubscriptionId,
}: CheckoutRoutingInput): boolean {
  if (!stripeCustomerId || !stripeSubscriptionId) return false;

  const normalizedStatus = (status ?? '').toLowerCase();
  if (normalizedStatus === 'active' || normalizedStatus === 'past_due') {
    return true;
  }

  if (normalizedStatus !== 'trialing') {
    return false;
  }

  const target = resolvePlanKey(targetPlan ?? null);
  const current = resolvePlanKey(currentPlan ?? null);

  return Boolean(target && current && target === current);
}

export function planCodeForBilling(planKey: PlanKey): string {
  return planKey === 'basic' ? 'starter' : planKey;
}

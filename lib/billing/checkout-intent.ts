import type { PlanKey } from '@/lib/plans';
import { resolvePlanKey } from '@/lib/plans';

export const CHECKOUT_INTENT_COOKIE = 'formaos_checkout_intent';
export const CHECKOUT_INTENT_TTL_SECONDS = 60 * 30;

const SELF_SERVE_PLANS = new Set<PlanKey>(['basic', 'pro', 'scale']);

export function isSelfServePlan(plan: PlanKey): boolean {
  return SELF_SERVE_PLANS.has(plan);
}

export function parseCheckoutIntent(
  raw: string | null | undefined,
): PlanKey | null {
  const plan = resolvePlanKey(raw ?? null);
  if (!plan) return null;
  return isSelfServePlan(plan) ? plan : null;
}

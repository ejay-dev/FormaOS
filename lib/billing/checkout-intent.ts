import type { PlanKey } from '@/lib/plans';
import { resolvePlanKey } from '@/lib/plans';

export const CHECKOUT_INTENT_COOKIE = 'formaos_checkout_intent';
// 24h — survives email verification + the full onboarding flow so the
// auto-checkout redirect on /app fires even if the user takes their time.
export const CHECKOUT_INTENT_TTL_SECONDS = 60 * 60 * 24;

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

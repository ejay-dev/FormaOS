import 'server-only';

import { unstable_cache } from 'next/cache';
import { getStripeClient } from '@/lib/billing/stripe';
import type Stripe from 'stripe';

export interface StripeMetrics {
  live_mrr_cents: number;
  active_subscription_count: number;
  currency: string;
  stripe_mode: 'live' | 'test' | 'unknown';
  computed_at: string;
  subscriptions_by_interval: Record<string, number>;
  errors: string[];
}

/**
 * Detects Stripe mode from the secret key prefix
 */
function detectStripeMode(): 'live' | 'test' | 'unknown' {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return 'unknown';
  if (key.startsWith('sk_live_')) return 'live';
  if (key.startsWith('sk_test_')) return 'test';
  return 'unknown';
}

/**
 * Normalizes subscription amount to monthly MRR
 * Yearly subscriptions are divided by 12
 */
function normalizeToMonthlyMrr(
  unitAmount: number,
  interval: string | undefined,
): number {
  if (interval === 'year') {
    return Math.round(unitAmount / 12);
  }
  return unitAmount;
}

/**
 * Fetches live Stripe metrics by querying active subscriptions
 * This is the source of truth for revenue data
 */
async function fetchStripeMetrics(): Promise<StripeMetrics> {
  const computed_at = new Date().toISOString();
  const stripe_mode = detectStripeMode();
  const errors: string[] = [];

  const result: StripeMetrics = {
    live_mrr_cents: 0,
    active_subscription_count: 0,
    currency: 'usd',
    stripe_mode,
    computed_at,
    subscriptions_by_interval: {},
    errors,
  };

  const stripe = getStripeClient();
  
  if (!stripe) {
    errors.push('Stripe not configured');
    return result;
  }

  try {
    let totalMrrCents = 0;
    let activeCount = 0;
    let detectedCurrency = 'usd';
    const intervalCounts: Record<string, number> = {};

    // Fetch all active subscriptions with auto-pagination
    for await (const subscription of stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.items.data.price'],
    })) {
      activeCount++;

      // Extract pricing from first item
      if (subscription.items.data.length > 0) {
        const item = subscription.items.data[0];
        if (item.price && typeof item.price === 'object') {
          const unitAmount = item.price.unit_amount ?? 0;
          const interval = item.price.recurring?.interval;
          const currency = item.price.currency || 'usd';
          
          // Track currency (use first detected)
          if (activeCount === 1) {
            detectedCurrency = currency;
          }

          // Track intervals
          if (interval) {
            intervalCounts[interval] = (intervalCounts[interval] || 0) + 1;
          }

          // Normalize to monthly and add to total
          totalMrrCents += normalizeToMonthlyMrr(unitAmount, interval);
        }
      }
    }

    result.live_mrr_cents = totalMrrCents;
    result.active_subscription_count = activeCount;
    result.currency = detectedCurrency;
    result.subscriptions_by_interval = intervalCounts;

  } catch (error: any) {
    errors.push(`Stripe API error: ${error.message ?? 'Unknown error'}`);
    console.error('[stripe-metrics] Error fetching Stripe data:', error);
  }

  return result;
}

/**
 * Get Stripe metrics with short cache (10 seconds max)
 * Call this from API routes to get live revenue data
 */
const getCachedStripeMetrics = unstable_cache(
  fetchStripeMetrics,
  ['stripe-metrics-live'],
  { revalidate: 10 }, // 10 second cache, not 60
);

export async function getStripeMetrics(): Promise<StripeMetrics> {
  return getCachedStripeMetrics();
}

/**
 * Get fresh Stripe metrics without cache
 * Use for manual refresh button
 */
export async function getStripeMetricsFresh(): Promise<StripeMetrics> {
  return fetchStripeMetrics();
}

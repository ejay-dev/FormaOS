/**
 * Trial Access Verification
 *
 * Validates that a user has active trial access before allowing
 * them to view app pages. Handles:
 * - Trial expiration
 * - Missing subscription
 * - Inactive organizations
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type TrialAccessResult = {
  hasAccess: boolean;
  reason?:
    | 'not_authenticated'
    | 'no_subscription'
    | 'trial_expired'
    | 'subscription_inactive'
    | 'unknown';
  daysRemaining?: number;
  expiresAt?: Date;
};

/**
 * Calculate days remaining in trial
 */
function calculateDaysRemaining(expiresAtMs: number): number {
  const now = Date.now();
  const diffMs = expiresAtMs - now;
  const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, daysRemaining);
}

/**
 * Server-side verification of trial access
 * Call this in protected page layouts to ensure user has active trials
 *
 * @returns Trial access status and metadata
 */
export async function verifyTrialAccess(): Promise<TrialAccessResult> {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.warn('[verifyTrialAccess] User not authenticated');
      return {
        hasAccess: false,
        reason: 'not_authenticated',
      };
    }

    // Get user's membership
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership?.organization_id) {
      console.warn('[verifyTrialAccess] No organization membership');
      return {
        hasAccess: false,
        reason: 'no_subscription',
      };
    }

    // Get subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('org_subscriptions')
      .select('status, trial_expires_at, trial_started_at, plan_key')
      .eq('organization_id', membership.organization_id)
      .maybeSingle();

    if (subscriptionError || !subscription) {
      console.warn('[verifyTrialAccess] No subscription found for org', {
        orgId: membership.organization_id,
        error: subscriptionError?.message,
      });
      return {
        hasAccess: false,
        reason: 'no_subscription',
      };
    }

    // Check subscription status
    if (
      !subscription.status ||
      !['active', 'trialing'].includes(subscription.status)
    ) {
      console.warn('[verifyTrialAccess] Subscription inactive', {
        orgId: membership.organization_id,
        status: subscription.status,
      });
      return {
        hasAccess: false,
        reason: 'subscription_inactive',
      };
    }

    // If trial, check expiration
    if (subscription.status === 'trialing') {
      const trialExpiration = subscription.trial_expires_at
        ? new Date(subscription.trial_expires_at).getTime()
        : null;

      if (!trialExpiration) {
        console.warn('[verifyTrialAccess] Trial missing expiration date');
        return {
          hasAccess: false,
          reason: 'trial_expired',
        };
      }

      const now = Date.now();
      if (now > trialExpiration) {
        console.warn('[verifyTrialAccess] Trial expired', {
          expiresAt: new Date(trialExpiration).toISOString(),
          now: new Date(now).toISOString(),
        });
        return {
          hasAccess: false,
          reason: 'trial_expired',
          expiresAt: new Date(trialExpiration),
        };
      }

      // Trial is still active
      const daysRemaining = calculateDaysRemaining(trialExpiration);
      console.log('[verifyTrialAccess] Trial active', {
        daysRemaining,
        expiresAt: new Date(trialExpiration).toISOString(),
      });

      return {
        hasAccess: true,
        daysRemaining,
        expiresAt: new Date(trialExpiration),
      };
    }

    // Active paid subscription
    return {
      hasAccess: true,
    };
  } catch (error) {
    console.error('[verifyTrialAccess] Unexpected error:', error);
    return {
      hasAccess: false,
      reason: 'unknown',
    };
  }
}

/**
 * Client-side hook for checking trial state (uses localStorage cache)
 * For server: use verifyTrialAccess() instead
 */
export function useTrialAccessStatus() {
  // This is a client-side placeholder
  // Actual hook should use React.useEffect + fetch to /api/trial/status
  return null;
}

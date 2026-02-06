'use client';

import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/stores/app';
import {
  TrialStatus,
  TRIAL_EXPIRING_SOON_DAYS,
  TRIAL_URGENT_DAYS,
  TRIAL_LAST_DAY_THRESHOLD,
  SOFT_LOCKED_FEATURES_AFTER_TRIAL,
  ALWAYS_ACCESSIBLE_FEATURES,
  LS_UPGRADE_DISMISSED_AT,
  UPGRADE_SUGGESTION_COOLDOWN_MS,
} from './constants';

/**
 * =========================================================
 * useTrialState – Central trial status hook
 * =========================================================
 * Derives all trial-related UI state from the Zustand store.
 * Never triggers additional server calls — pure derived state.
 */
export function useTrialState() {
  const entitlements = useAppStore((s) => s.entitlements);
  const organization = useAppStore((s) => s.organization);
  const role = useAppStore((s) => s.role);

  const trialActive = entitlements?.trialActive ?? false;
  const daysRemaining = entitlements?.trialDaysRemaining ?? 0;
  const plan = organization?.plan ?? 'trial';

  const status: TrialStatus = useMemo(() => {
    // Already on a paid plan
    if (plan !== 'trial' && !trialActive) return 'not_applicable';
    if (['basic', 'pro', 'enterprise'].includes(plan) && !trialActive)
      return 'converted';

    // Trial expired
    if (!trialActive && daysRemaining <= 0 && plan === 'trial')
      return 'expired';

    // Active trial tiers
    if (daysRemaining <= TRIAL_LAST_DAY_THRESHOLD) return 'last_day';
    if (daysRemaining <= TRIAL_URGENT_DAYS) return 'urgent';
    if (daysRemaining <= TRIAL_EXPIRING_SOON_DAYS) return 'expiring_soon';
    return 'active';
  }, [trialActive, daysRemaining, plan]);

  const isTrialUser = useMemo(
    () => status !== 'not_applicable' && status !== 'converted',
    [status],
  );

  const isExpired = status === 'expired';
  const showBanner = isTrialUser && !isExpired;
  const showUpgradeUrgency = status === 'urgent' || status === 'last_day';

  const canManageBilling = useMemo(
    () => role === 'owner' || role === 'admin',
    [role],
  );

  /**
   * Check if a feature is soft-locked (trial expired)
   */
  const isFeatureLocked = useCallback(
    (featureId: string): boolean => {
      if (!isExpired) return false;
      return (SOFT_LOCKED_FEATURES_AFTER_TRIAL as readonly string[]).includes(
        featureId,
      );
    },
    [isExpired],
  );

  /**
   * Check if a feature is always accessible
   */
  const isFeatureAccessible = useCallback(
    (featureId: string): boolean => {
      if (!isExpired) return true;
      return (ALWAYS_ACCESSIBLE_FEATURES as readonly string[]).includes(
        featureId,
      );
    },
    [isExpired],
  );

  /**
   * Whether the upgrade suggestion should be shown (respects cooldown)
   */
  const shouldShowUpgradeSuggestion = useCallback((): boolean => {
    if (!isTrialUser || isExpired) return false;
    if (typeof window === 'undefined') return false;

    const dismissedAt = localStorage.getItem(LS_UPGRADE_DISMISSED_AT);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < UPGRADE_SUGGESTION_COOLDOWN_MS) return false;
    }
    return true;
  }, [isTrialUser, isExpired]);

  /**
   * Mark upgrade suggestion as dismissed
   */
  const dismissUpgradeSuggestion = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_UPGRADE_DISMISSED_AT, String(Date.now()));
    }
  }, []);

  return {
    // State
    status,
    daysRemaining,
    isTrialUser,
    isExpired,
    trialActive,
    plan,

    // UI flags
    showBanner,
    showUpgradeUrgency,
    canManageBilling,

    // Feature lock helpers
    isFeatureLocked,
    isFeatureAccessible,

    // Upgrade suggestion helpers
    shouldShowUpgradeSuggestion,
    dismissUpgradeSuggestion,
  };
}

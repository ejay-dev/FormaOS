'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTrialState } from '@/lib/trial/use-trial-state';
import { useFeatureUsage } from '@/lib/trial/use-feature-usage';
import { PLAN_CATALOG, type PlanKey } from '@/lib/plans';
import { startCheckout } from '@/app/app/actions/billing';
import {
  X,
  Zap,
  Clock,
  TrendingUp,
  ArrowRight,
  Crown,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';

/**
 * =========================================================
 * UpgradeModal – Smart upgrade suggestion overlay
 * =========================================================
 * Triggers automatically when:
 * - Trial has ≤3 days remaining (urgent)
 * - Feature usage exceeds threshold (high engagement)
 * - Trial is expiring and user is active
 *
 * Respects cooldown via dismissUpgradeSuggestion.
 * Non-blocking — can be dismissed with no penalty.
 */
export function UpgradeModal() {
  const {
    daysRemaining,
    isTrialUser,
    isExpired,
    showUpgradeUrgency,
    canManageBilling,
    shouldShowUpgradeSuggestion,
    dismissUpgradeSuggestion,
  } = useTrialState();

  const { isHighEngagement } = useFeatureUsage();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Determine if we should auto-open
  useEffect(() => {
    if (!canManageBilling) return;
    if (!isTrialUser && !isExpired) return;

    const shouldOpen =
      // Urgent: 3 days or less
      showUpgradeUrgency ||
      // Expired trial
      isExpired ||
      // High engagement user on trial
      (isHighEngagement && shouldShowUpgradeSuggestion());

    if (shouldOpen) {
      // Small delay to not interrupt page load
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [
    showUpgradeUrgency,
    isExpired,
    isHighEngagement,
    isTrialUser,
    canManageBilling,
    shouldShowUpgradeSuggestion,
  ]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    dismissUpgradeSuggestion();
  }, [dismissUpgradeSuggestion]);

  const handleUpgrade = async (planKey: PlanKey) => {
    setLoadingPlan(planKey);
    setError(null);

    try {
      const formData = new FormData();
      formData.set('plan', planKey);
      const result = await startCheckout(formData);
      if (typeof result === 'string' && result.startsWith('http')) {
        window.location.href = result;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoadingPlan(null);
    }
  };

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const recommendedPlan: PlanKey = 'pro';
  const catalog = PLAN_CATALOG[recommendedPlan];

  // Determine modal variant
  const variant = isExpired
    ? 'expired'
    : showUpgradeUrgency
      ? 'urgent'
      : 'engagement';

  const titles = {
    expired: 'Your Trial Has Ended',
    urgent: `Only ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Left`,
    engagement: "You're Getting Great Value from FormaOS",
  };

  const descriptions = {
    expired:
      'Upgrade now to continue with full access to all features. Your data is safe and waiting.',
    urgent:
      'Your trial is ending soon. Lock in your plan to avoid any disruption to your workflow.',
    engagement:
      "You've been actively using the platform — upgrade to unlock advanced features and remove all limits.",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl border border-white/15 bg-[hsl(var(--card))] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Upgrade your plan"
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-200"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            {variant === 'expired' ? (
              <div className="p-2 rounded-xl bg-rose-500/15">
                <Clock className="h-5 w-5 text-rose-400" />
              </div>
            ) : variant === 'urgent' ? (
              <div className="p-2 rounded-xl bg-amber-500/15">
                <Zap className="h-5 w-5 text-amber-400" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-sky-500/15">
                <TrendingUp className="h-5 w-5 text-sky-400" />
              </div>
            )}
            <h2 className="text-xl font-bold text-slate-100">
              {titles[variant]}
            </h2>
          </div>
          <p className="text-sm text-slate-400">{descriptions[variant]}</p>
        </div>

        {error && (
          <div className="mx-6 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* Recommended plan card */}
        <div className="mx-6 rounded-xl border border-sky-400/30 bg-sky-500/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-sky-400" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">
                    {catalog.name}
                  </span>
                  <span className="text-[10px] font-bold text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {catalog.summary}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-100">$99</div>
              <div className="text-xs text-slate-400">/month</div>
            </div>
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-2">
            {catalog.features.slice(0, 6).map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-1.5 text-xs text-slate-300"
              >
                <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex flex-col gap-3">
          <button
            onClick={() => handleUpgrade('pro')}
            disabled={loadingPlan !== null}
            className="w-full rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loadingPlan === 'pro' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {loadingPlan === 'pro'
              ? 'Starting checkout...'
              : 'Upgrade to Pro — $99/mo'}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleUpgrade('basic')}
              disabled={loadingPlan !== null}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingPlan === 'basic' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Starter — $29/mo
            </button>
            <button
              onClick={handleClose}
              className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
            >
              Maybe later
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-500">
            14-day free trial included · Cancel anytime · Your data is safe
          </p>
        </div>
      </div>
    </div>
  );
}

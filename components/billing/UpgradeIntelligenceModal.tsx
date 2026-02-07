'use client';

import { useState, useEffect, useCallback } from 'react';
import { startCheckout } from '@/app/app/actions/billing';
import { PLAN_CATALOG, type PlanKey } from '@/lib/plans';
import { getFeatureBenefit } from '@/lib/upgrade-intelligence/feature-benefits';
import {
  X,
  Check,
  ArrowRight,
  Loader2,
  Crown,
  Zap,
  TrendingUp,
  Users,
  Shield,
  Sparkles,
} from 'lucide-react';

interface UpgradeIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureId?: string;
  preselectedPlan?: PlanKey;
}

/**
 * =========================================================
 * UpgradeIntelligenceModal – Smart upgrade modal with context
 * =========================================================
 * Shows feature-specific benefits, plan comparison,
 * and direct checkout capability.
 */
export function UpgradeIntelligenceModal({
  isOpen,
  onClose,
  featureId,
  preselectedPlan,
}: UpgradeIntelligenceModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(
    preselectedPlan || 'pro'
  );
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const featureBenefit = featureId ? getFeatureBenefit(featureId) : null;

  // Determine recommended plan based on feature
  useEffect(() => {
    if (featureBenefit) {
      if (featureBenefit.requiredPlan === 'enterprise') {
        setSelectedPlan('enterprise');
      } else if (featureBenefit.requiredPlan === 'pro') {
        setSelectedPlan('pro');
      }
    }
  }, [featureBenefit]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleUpgrade = useCallback(async (planKey: PlanKey) => {
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
  }, []);

  if (!isOpen) return null;

  const plans: { key: PlanKey; recommended?: boolean }[] = [
    { key: 'basic' },
    { key: 'pro', recommended: true },
    { key: 'enterprise' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto py-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl mx-4 rounded-2xl border border-white/15 bg-[hsl(var(--card))] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Upgrade your plan"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-200"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20">
              {featureBenefit ? (
                <featureBenefit.icon className="h-5 w-5 text-sky-400" />
              ) : (
                <Zap className="h-5 w-5 text-sky-400" />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              {featureBenefit
                ? `Unlock ${featureBenefit.title}`
                : 'Choose Your Plan'}
            </h2>
          </div>
          <p className="text-sm text-slate-400">
            {featureBenefit?.description ??
              'Select the plan that fits your compliance needs.'}
          </p>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* Plan comparison */}
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map(({ key, recommended }) => {
              const plan = PLAN_CATALOG[key];
              const isSelected = selectedPlan === key;
              const meetsRequirement =
                !featureBenefit ||
                getPlanLevel(key) >= getPlanLevel(featureBenefit.requiredPlan);

              return (
                <div
                  key={key}
                  onClick={() => meetsRequirement && setSelectedPlan(key)}
                  className={`relative rounded-xl border p-5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-400/50 bg-sky-500/5 ring-2 ring-sky-400/30'
                      : meetsRequirement
                      ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      : 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Recommended badge */}
                  {recommended && meetsRequirement && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold text-sky-300 bg-sky-500/20 px-3 py-1 rounded-full flex items-center gap-1 border border-sky-400/20">
                        <Sparkles className="h-2.5 w-2.5" />
                        RECOMMENDED
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Crown
                      className={`h-5 w-5 ${
                        key === 'enterprise'
                          ? 'text-amber-400'
                          : key === 'pro'
                          ? 'text-sky-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="font-bold text-slate-100">{plan.name}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-slate-100">
                      ${key === 'basic' ? '29' : key === 'pro' ? '99' : '299'}
                    </span>
                    <span className="text-sm text-slate-400">/month</span>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-400 mb-4">{plan.summary}</p>

                  {/* Key features */}
                  <ul className="space-y-2 mb-4">
                    {plan.features.slice(0, 5).map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-300"
                      >
                        <Check className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Required indicator */}
                  {featureBenefit &&
                    featureBenefit.requiredPlan === key && (
                      <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Includes {featureBenefit.title}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature-specific benefits */}
        {featureBenefit && featureBenefit.useCases.length > 0 && (
          <div className="px-6 pb-4">
            <div className="rounded-xl bg-white/5 p-4">
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">
                Perfect for
              </h4>
              <div className="flex flex-wrap gap-2">
                {featureBenefit.useCases.map((useCase, idx) => (
                  <span
                    key={idx}
                    className="text-xs text-slate-300 bg-white/10 px-3 py-1 rounded-full"
                  >
                    {useCase}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-5 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => handleUpgrade(selectedPlan)}
            disabled={loadingPlan !== null}
            className="w-full sm:w-auto flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-8 py-3 text-sm font-bold text-slate-950 transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loadingPlan === selectedPlan ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {loadingPlan === selectedPlan
              ? 'Starting checkout...'
              : `Upgrade to ${PLAN_CATALOG[selectedPlan].name}`}
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Maybe later
          </button>

          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Secure checkout
            </span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get numeric plan level for comparison
 */
function getPlanLevel(plan: string): number {
  const levels: Record<string, number> = {
    trial: 0,
    basic: 1,
    pro: 2,
    enterprise: 3,
  };
  return levels[plan] ?? 0;
}

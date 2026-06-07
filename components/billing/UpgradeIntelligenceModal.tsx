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
  Shield,
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
    preselectedPlan || 'pro',
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
      if (result.success) {
        window.location.href = result.url;
        return;
      }
      setError(result.error);
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
    <div className="fixed inset-0 z-[var(--z-tour)] flex items-center justify-center overflow-y-auto py-6">
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            (e.currentTarget as HTMLElement).click();
          }
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl mx-4 rounded-2xl border border-border bg-[hsl(var(--card))] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Upgrade your plan"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1 rounded-full hover:bg-surface-2 transition-colors text-muted-foreground hover:text-foreground/90"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-edge-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-surface-2">
              {featureBenefit ? (
                <featureBenefit.icon className="h-5 w-5 text-foreground" />
              ) : (
                <Zap className="h-5 w-5 text-foreground" />
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {featureBenefit
                ? `Unlock ${featureBenefit.title}`
                : 'Choose Your Plan'}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {featureBenefit?.description ??
              'Select the plan that fits your compliance needs.'}
          </p>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
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
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).click();
                    }
                  }}
                  key={key}
                  onClick={() => meetsRequirement && setSelectedPlan(key)}
                  className={`relative rounded-xl border p-5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-surface-2 ring-2 ring-ring'
                      : meetsRequirement
                        ? 'border-border bg-surface-1 hover:border-edge-3 hover:bg-surface-2'
                        : 'border-edge-1 bg-surface-1 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Recommended badge */}
                  {recommended && meetsRequirement && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-bold text-primary-foreground bg-primary px-3 py-1 rounded-full flex items-center gap-1 border border-primary">
                        RECOMMENDED
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Crown
                      className={`h-5 w-5 ${
                        key === 'enterprise'
                          ? 'text-foreground'
                          : key === 'pro'
                            ? 'text-foreground/70'
                            : 'text-muted-foreground'
                      }`}
                    />
                    <span className="font-bold text-foreground">
                      {plan.name}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {plan.priceMonthly > 0 ? (
                      <>
                        <span className="text-3xl font-bold text-foreground">
                          ${plan.priceMonthly.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /month
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-foreground">
                        Custom
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-muted-foreground mb-4">
                    {plan.summary}
                  </p>

                  {/* Key features */}
                  <ul className="space-y-2 mb-4">
                    {plan.features.slice(0, 5).map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-foreground/70"
                      >
                        <Check className="h-3 w-3 text-success mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Required indicator */}
                  {featureBenefit && featureBenefit.requiredPlan === key && (
                    <div className="mt-2 text-xs text-success flex items-center gap-1">
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
            <div className="rounded-xl bg-surface-1 p-4">
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">
                Perfect for
              </h4>
              <div className="flex flex-wrap gap-2">
                {featureBenefit.useCases.map((useCase, idx) => (
                  <span
                    key={idx}
                    className="text-xs text-foreground/70 bg-surface-2 px-3 py-1 rounded-full"
                  >
                    {useCase}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-5 border-t border-border flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => handleUpgrade(selectedPlan)}
            disabled={loadingPlan !== null}
            className="w-full sm:w-auto flex-1 sm:flex-none rounded-xl bg-foreground text-background px-8 py-3 text-sm font-bold transition-all motion-safe:hover:scale-[1.01] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground/90 transition-colors"
          >
            Maybe later
          </button>

          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
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

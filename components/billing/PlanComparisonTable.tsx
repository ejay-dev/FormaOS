'use client';

import { useState } from 'react';
import { PLAN_CATALOG, type PlanKey } from '@/lib/plans';
import { useTrialState } from '@/lib/trial/use-trial-state';
import { startCheckout } from '@/app/app/actions/billing';
import {
  Check,
  X,
  ArrowRight,
  Zap,
  Crown,
  Building2,
  Loader2,
  Sparkles,
} from 'lucide-react';

/**
 * =========================================================
 * PlanComparisonTable – Inline upgrade comparison UI
 * =========================================================
 * Shows all plans side-by-side with feature comparison.
 * Highlights current plan and recommended upgrade path.
 * CTA buttons trigger Stripe checkout directly.
 */

const FEATURE_ROWS: {
  label: string;
  basic: string;
  pro: string;
  enterprise: string;
}[] = [
  {
    label: 'Sites',
    basic: 'Up to 2',
    pro: 'Up to 10',
    enterprise: 'Unlimited',
  },
  {
    label: 'Team Members',
    basic: 'Up to 15',
    pro: 'Up to 75',
    enterprise: 'Unlimited',
  },
  {
    label: 'Frameworks',
    basic: 'Up to 2',
    pro: 'Up to 5',
    enterprise: 'Unlimited',
  },
  { label: 'Compliance Engine', basic: '✓', pro: '✓', enterprise: '✓' },
  { label: 'Tasks & Evidence', basic: '✓', pro: '✓', enterprise: '✓' },
  { label: 'Audit Logs', basic: '✓', pro: '✓', enterprise: '✓' },
  { label: 'Standard Reporting', basic: '✓', pro: '✓', enterprise: '✓' },
  { label: 'Advanced Reporting', basic: '—', pro: '✓', enterprise: '✓' },
  { label: 'Governance Controls', basic: '—', pro: '✓', enterprise: '✓' },
  { label: 'Operational Dashboards', basic: '—', pro: '✓', enterprise: '✓' },
  { label: 'Workflow Automation', basic: '—', pro: '✓', enterprise: '✓' },
  { label: 'White-glove Onboarding', basic: '—', pro: '—', enterprise: '✓' },
  { label: 'Custom Frameworks', basic: '—', pro: '—', enterprise: '✓' },
  { label: 'Dedicated Support', basic: '—', pro: '—', enterprise: '✓' },
  { label: 'SSO & SAML', basic: '—', pro: '—', enterprise: '✓' },
];

const PLAN_PRICES: Record<PlanKey, { monthly: number; label: string }> = {
  basic: { monthly: 29, label: '/mo' },
  pro: { monthly: 99, label: '/mo' },
  enterprise: { monthly: 0, label: 'Custom' },
};

const PLAN_ICONS: Record<
  PlanKey,
  React.ComponentType<{ className?: string }>
> = {
  basic: Zap,
  pro: Crown,
  enterprise: Building2,
};

export function PlanComparisonTable() {
  const { plan, isExpired } = useTrialState();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (targetPlan: PlanKey) => {
    if (targetPlan === 'enterprise') return; // Contact sales
    setLoadingPlan(targetPlan);
    setError(null);

    try {
      const formData = new FormData();
      formData.set('plan', targetPlan);
      const result = await startCheckout(formData);
      if (typeof result === 'string' && result.startsWith('http')) {
        window.location.href = result;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans: PlanKey[] = ['basic', 'pro', 'enterprise'];
  const currentPlanIndex =
    plan === 'trial' ? -1 : plans.indexOf(plan as PlanKey);
  const recommendedPlan: PlanKey =
    plan === 'trial' || plan === 'basic' ? 'pro' : 'enterprise';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-100">
          {isExpired ? 'Reactivate Your Account' : 'Choose Your Plan'}
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
          {isExpired
            ? 'Your trial has ended. Pick a plan to continue with full access.'
            : 'Upgrade anytime — your data is always preserved.'}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 text-center">
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((planKey) => {
          const catalog = PLAN_CATALOG[planKey];
          const price = PLAN_PRICES[planKey];
          const PlanIcon = PLAN_ICONS[planKey];
          const isCurrent = plan === planKey;
          const isRecommended = planKey === recommendedPlan && !isCurrent;
          const isLoading = loadingPlan === planKey;
          const isUpgrade = plans.indexOf(planKey) > currentPlanIndex;

          return (
            <div
              key={planKey}
              className={`relative rounded-2xl border p-6 transition-all ${
                isRecommended
                  ? 'border-sky-400/50 bg-sky-500/5 ring-1 ring-sky-400/20'
                  : isCurrent
                    ? 'border-emerald-400/30 bg-emerald-500/5'
                    : 'border-white/10 bg-white/5'
              }`}
            >
              {/* Recommended badge */}
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                  <Sparkles className="h-3 w-3" />
                  RECOMMENDED
                </div>
              )}

              {/* Current badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-emerald-950 text-[10px] font-bold px-3 py-1 rounded-full">
                  CURRENT PLAN
                </div>
              )}

              <div className="text-center space-y-3 pt-2">
                <PlanIcon
                  className={`h-8 w-8 mx-auto ${
                    isRecommended ? 'text-sky-400' : 'text-slate-400'
                  }`}
                />

                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {catalog.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {catalog.summary}
                  </p>
                </div>

                <div className="text-slate-100">
                  {price.monthly > 0 ? (
                    <>
                      <span className="text-3xl font-bold">
                        ${price.monthly}
                      </span>
                      <span className="text-sm text-slate-400">
                        {price.label}
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-bold">{price.label}</span>
                  )}
                </div>

                {/* CTA */}
                {planKey === 'enterprise' ? (
                  <a
                    href="mailto:sales@formaos.com"
                    className="block w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/10 transition-all text-center"
                  >
                    Contact Sales
                  </a>
                ) : isCurrent ? (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/20 px-4 py-2.5 text-sm font-semibold text-emerald-300 text-center">
                    Active
                  </div>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(planKey)}
                    disabled={isLoading}
                    className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      isRecommended
                        ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 text-slate-950 hover:scale-[1.02] hover:shadow-lg hover:shadow-sky-500/20'
                        : 'bg-white/10 text-slate-100 hover:bg-white/15'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    {isLoading ? 'Starting checkout...' : 'Upgrade'}
                  </button>
                ) : null}
              </div>

              {/* Feature list */}
              <ul className="mt-6 space-y-2 border-t border-white/8 pt-4">
                {catalog.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-xs text-slate-300"
                  >
                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Detailed comparison table (desktop) */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-slate-400 font-medium">
                Feature
              </th>
              {plans.map((p) => (
                <th
                  key={p}
                  className="text-center px-6 py-4 text-slate-200 font-semibold"
                >
                  {PLAN_CATALOG[p].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map((row, i) => (
              <tr
                key={row.label}
                className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}
              >
                <td className="px-6 py-3 text-slate-300">{row.label}</td>
                {plans.map((p) => {
                  const value = row[p];
                  const isCheck = value === '✓';
                  const isDash = value === '—';
                  return (
                    <td key={p} className="text-center px-6 py-3">
                      {isCheck ? (
                        <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                      ) : isDash ? (
                        <X className="h-4 w-4 text-slate-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">{value}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

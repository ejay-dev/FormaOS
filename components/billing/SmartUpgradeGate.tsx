'use client';

import { useState } from 'react';
import { useTrialState } from '@/lib/trial/use-trial-state';
import { getFeatureBenefit, type FeatureBenefit } from '@/lib/upgrade-intelligence/feature-benefits';
import { Lock, ArrowRight, Zap, Check, Sparkles, Crown } from 'lucide-react';
import { UpgradeIntelligenceModal } from './UpgradeIntelligenceModal';

/**
 * =========================================================
 * SmartUpgradeGate – Enhanced feature lock with upgrade intelligence
 * =========================================================
 * Extends the basic FeatureGate with:
 * - Feature-specific benefit messaging
 * - Usage-based personalization
 * - Direct checkout capability
 * - Plan comparison inline
 */
export function SmartUpgradeGate({
  featureId,
  children,
  showPreview = true,
}: {
  featureId: string;
  children: React.ReactNode;
  showPreview?: boolean;
}) {
  const { isFeatureLocked, canManageBilling } = useTrialState();
  const [showModal, setShowModal] = useState(false);

  const locked = isFeatureLocked(featureId);
  const featureBenefit = getFeatureBenefit(featureId);

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative">
        {/* Blurred content preview */}
        {showPreview && (
          <div className="pointer-events-none select-none blur-[6px] opacity-40 max-h-[400px] overflow-hidden">
            {children}
          </div>
        )}

        {/* Smart lock overlay */}
        <div className={`${showPreview ? 'absolute inset-0' : ''} flex items-center justify-center py-12`}>
          <div className="text-center max-w-lg mx-auto px-6">
            {/* Feature-specific icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-400/20 shadow-xl">
              {featureBenefit ? (
                <featureBenefit.icon className="h-7 w-7 text-sky-400" />
              ) : (
                <Lock className="h-7 w-7 text-slate-300" />
              )}
            </div>

            {/* Feature-specific title */}
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              {featureBenefit?.title ?? 'Premium Feature'}
            </h3>

            {/* Feature-specific description */}
            <p className="text-sm text-slate-400 mb-4">
              {featureBenefit?.description ??
                'Upgrade your plan to unlock this feature and access advanced capabilities.'}
            </p>

            {/* Benefits preview */}
            {featureBenefit && featureBenefit.benefits.length > 0 && (
              <ul className="text-left bg-white/5 rounded-xl p-4 mb-6 space-y-2">
                {featureBenefit.benefits.slice(0, 3).map((benefit, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            )}

            {/* Plan badge */}
            {featureBenefit && (
              <div className="mb-6 flex items-center justify-center gap-2">
                <span className="text-xs text-slate-500">Available on</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-300 bg-sky-500/15 px-2 py-1 rounded-full">
                  <Crown className="h-3 w-3" />
                  {featureBenefit.requiredPlan.toUpperCase()}
                </span>
              </div>
            )}

            {canManageBilling ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-sky-500/20"
                >
                  <Zap className="h-4 w-4" />
                  Unlock {featureBenefit?.title ?? 'Feature'}
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  Compare all plans
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Contact your organization admin to upgrade the plan.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade intelligence modal */}
      <UpgradeIntelligenceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureId={featureId}
      />
    </>
  );
}

/**
 * =========================================================
 * SmartFeatureTeaser – Compact inline upgrade prompt
 * =========================================================
 * Smaller version for navigation or cards
 */
export function SmartFeatureTeaser({
  featureId,
  className = '',
}: {
  featureId: string;
  className?: string;
}) {
  const { isFeatureLocked, canManageBilling } = useTrialState();
  const [showModal, setShowModal] = useState(false);

  if (!isFeatureLocked(featureId)) return null;

  const featureBenefit = getFeatureBenefit(featureId);

  return (
    <>
      <div
        className={`rounded-lg border border-sky-400/20 bg-sky-500/5 p-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10">
            {featureBenefit ? (
              <featureBenefit.icon className="h-4 w-4 text-sky-400" />
            ) : (
              <Lock className="h-4 w-4 text-sky-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {featureBenefit?.title ?? 'Premium Feature'}
            </p>
            <p className="text-xs text-slate-400 truncate">
              Upgrade to unlock
            </p>
          </div>
          {canManageBilling && (
            <button
              onClick={() => setShowModal(true)}
              className="shrink-0 text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Upgrade
            </button>
          )}
        </div>
      </div>

      <UpgradeIntelligenceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureId={featureId}
      />
    </>
  );
}

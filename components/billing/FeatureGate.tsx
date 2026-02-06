'use client';

import { useTrialState } from '@/lib/trial/use-trial-state';
import { Lock, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

/**
 * =========================================================
 * FeatureGate – Soft feature lock wrapper
 * =========================================================
 * Wraps any feature section. If the user's trial has expired
 * and the feature is in the soft-lock list, shows an overlay
 * with an upgrade CTA instead of the content.
 *
 * Usage:
 *   <FeatureGate featureId="reports">
 *     <ReportsPage />
 *   </FeatureGate>
 *
 * Does NOT block navigation — user can still see the page
 * structure but content is obscured. This preserves the
 * premium feel while creating clear conversion pressure.
 */
export function FeatureGate({
  featureId,
  children,
  fallbackMessage,
}: {
  featureId: string;
  children: React.ReactNode;
  fallbackMessage?: string;
}) {
  const { isFeatureLocked, canManageBilling } = useTrialState();

  const locked = isFeatureLocked(featureId);

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none blur-[6px] opacity-40 max-h-[400px] overflow-hidden">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 shadow-xl">
            <Lock className="h-7 w-7 text-slate-300" />
          </div>

          <h3 className="text-lg font-bold text-slate-100 mb-2">
            Feature Locked
          </h3>

          <p className="text-sm text-slate-400 mb-6">
            {fallbackMessage ??
              'Your trial has ended. Upgrade your plan to unlock this feature and regain full access.'}
          </p>

          {canManageBilling ? (
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/app/billing"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-sky-500/20"
              >
                <Zap className="h-4 w-4" />
                Upgrade Now
              </Link>
              <Link
                href="/app/billing"
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                Compare plans
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Contact your organization admin to upgrade the plan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * =========================================================
 * FeatureLockBadge – Small inline lock indicator
 * =========================================================
 * Shows a small lock badge next to feature names in navigation
 * or cards when the feature is locked.
 */
export function FeatureLockBadge({
  featureId,
  className = '',
}: {
  featureId: string;
  className?: string;
}) {
  const { isFeatureLocked } = useTrialState();

  if (!isFeatureLocked(featureId)) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-full ${className}`}
      title="Upgrade to unlock"
    >
      <Lock className="h-2.5 w-2.5" />
      PRO
    </span>
  );
}

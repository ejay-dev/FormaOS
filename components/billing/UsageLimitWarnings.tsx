'use client';

import { useState, useCallback } from 'react';
import {
  useFeatureUsage,
  type FeatureUsageItem,
} from '@/lib/trial/use-feature-usage';
import { useTrialState } from '@/lib/trial/use-trial-state';
import { AlertTriangle, XCircle, X, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * =========================================================
 * UsageLimitWarnings – 80% / 100% threshold warnings
 * =========================================================
 * Shows dismissible warning banners when feature usage
 * approaches (80%) or hits (100%) plan limits.
 *
 * Renders above page content in the dashboard.
 * - 80%: amber warning with upgrade CTA
 * - 100%: red critical with hard-block messaging
 */

export function UsageLimitWarnings() {
  const { isTrialUser, isExpired, canManageBilling } = useTrialState();
  const { usage } = useFeatureUsage();
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  const dismiss = useCallback((key: string) => {
    setDismissed((prev) => ({ ...prev, [key]: true }));
  }, []);

  if (!isTrialUser && !isExpired) return null;

  const warnings = usage.filter(
    (u) => u.limit !== -1 && u.percentage >= 80 && !dismissed[u.key],
  );

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((item) => (
        <UsageWarningBanner
          key={item.key}
          item={item}
          canManageBilling={canManageBilling}
          onDismiss={() => dismiss(item.key)}
        />
      ))}
    </div>
  );
}

function UsageWarningBanner({
  item,
  canManageBilling,
  onDismiss,
}: {
  item: FeatureUsageItem;
  canManageBilling: boolean;
  onDismiss: () => void;
}) {
  const isExceeded = item.percentage >= 100;
  const Icon = isExceeded ? XCircle : AlertTriangle;

  const bgClass = isExceeded
    ? 'border-rose-400/30 bg-rose-500/10'
    : 'border-amber-400/30 bg-amber-500/10';
  const iconClass = isExceeded ? 'text-rose-400' : 'text-amber-400';
  const textClass = isExceeded ? 'text-rose-300' : 'text-amber-300';

  const message = isExceeded
    ? `${item.label} limit reached (${item.current}/${item.limit}). Upgrade to continue adding ${item.label.toLowerCase()}.`
    : `${item.label} at ${item.percentage}% of plan limit (${item.current}/${item.limit}).`;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border ${bgClass} px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300`}
      role="alert"
    >
      <Icon className={`h-5 w-5 shrink-0 ${iconClass}`} />
      <p className={`flex-1 text-sm font-medium ${textClass}`}>{message}</p>
      {canManageBilling && (
        <Link
          href="/app/billing"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:scale-[1.02] transition-transform"
        >
          <Zap className="h-3 w-3" />
          Upgrade
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
      <button
        onClick={onDismiss}
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        aria-label="Dismiss warning"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * =========================================================
 * DashboardUpgradeNudge – Persistent upgrade prompt card
 * =========================================================
 * Shown on the dashboard when user has high usage or nearing
 * trial end. Highlights the value they'd lose.
 */
export function DashboardUpgradeNudge() {
  const { isTrialUser, isExpired, daysRemaining, canManageBilling } =
    useTrialState();
  const { usage, hasHighUsage, totalActions } = useFeatureUsage();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!isTrialUser && !isExpired) return null;
  if (!canManageBilling) return null;

  // Show nudge when: expired, last 3 days, or high usage
  const shouldShow =
    isExpired || (daysRemaining !== null && daysRemaining <= 3) || hasHighUsage;
  if (!shouldShow) return null;

  const atRiskItems = usage.filter((u) => u.limit !== -1 && u.percentage >= 50);

  return (
    <div className="rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground">
            {isExpired
              ? 'Your trial has ended'
              : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {isExpired
              ? `You've built ${totalActions} actions worth of compliance data. Upgrade to keep full access.`
              : 'Upgrade now to lock in your progress and unlock all features.'}
          </p>

          {atRiskItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground/60">
                Your usage so far:
              </p>
              {atRiskItems.slice(0, 3).map((item) => (
                <div key={item.key} className="flex items-center gap-2 text-xs">
                  <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.percentage >= 100
                          ? 'bg-rose-400'
                          : item.percentage >= 80
                            ? 'bg-amber-400'
                            : 'bg-sky-400'
                      }`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                  <span className="text-foreground/70">
                    {item.label}: {item.current}/{item.limit}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/app/billing"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:scale-[1.02] hover:shadow-lg hover:shadow-sky-500/20 transition-all"
          >
            <Zap className="h-4 w-4" />
            Upgrade Now
          </Link>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * =========================================================
 * FeaturePreviewBlur – Blur overlay for locked features
 * =========================================================
 * Wraps feature content with a blur + lock overlay when
 * the user has hit their plan limit for that feature.
 *
 * Unlike FeatureGate (trial expiry lock), this activates when
 * a specific usage limit (100%) is reached.
 */
export function FeaturePreviewBlur({
  featureKey,
  children,
}: {
  featureKey: string;
  children: React.ReactNode;
}) {
  const { isTrialUser, isExpired, canManageBilling } = useTrialState();
  const { usage } = useFeatureUsage();

  if (!isTrialUser && !isExpired) return <>{children}</>;

  const item = usage.find((u) => u.key === featureKey);
  const isAtLimit = item && item.limit !== -1 && item.percentage >= 100;

  if (!isAtLimit) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[4px] opacity-50 max-h-[500px] overflow-hidden">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm rounded-xl">
        <div className="text-center max-w-sm px-6">
          <XCircle className="mx-auto h-10 w-10 text-rose-400 mb-3" />
          <h4 className="text-sm font-bold text-foreground mb-1">
            {item.label} Limit Reached
          </h4>
          <p className="text-xs text-muted-foreground mb-4">
            You&apos;ve used {item.current} of {item.limit}{' '}
            {item.label.toLowerCase()}. Upgrade your plan to continue.
          </p>
          {canManageBilling && (
            <Link
              href="/app/billing"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-bold text-slate-950 hover:scale-[1.02] transition-transform"
            >
              <Zap className="h-3 w-3" />
              Upgrade Plan
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

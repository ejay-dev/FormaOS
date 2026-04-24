'use client';

import { useTrialState } from '@/lib/trial/use-trial-state';
import { AlertTriangle, Zap } from 'lucide-react';
import Link from 'next/link';

/**
 * Tiered trial escalation banner.
 *
 * The in-topbar `TrialDaysRemaining` chip handles casual visibility.
 * This full-width banner appears only for the two states where missing
 * the message could cause loss of access or revenue:
 *
 *   - `last_day` — evaluation ends today; conversion-critical.
 *   - `expired`  — read-only mode; user needs the upgrade CTA.
 *
 * For `urgent` / `expiring_soon` / `active` we stay silent and defer
 * to the chip. Founders and paid users never see the banner.
 */
export function TrialCountdownBanner() {
  const { status, isTrialUser, isExpired, canManageBilling } = useTrialState();

  const shouldRender =
    (isTrialUser && status === 'last_day') || isExpired;
  if (!shouldRender) return null;

  const scheme = {
    bg: 'trial-banner-danger',
    accent: 'bg-rose-500 text-white hover:bg-rose-600',
  };

  const message = isExpired
    ? 'Your evaluation access has ended — activate your plan to keep full access'
    : 'Evaluation access ends today — activate your plan now';

  const subMessage = isExpired
    ? 'Read-only access to core features until you upgrade.'
    : '';

  const ctaLabel = isExpired ? 'Upgrade Now' : 'Activate Now';

  return (
    <div
      className={`border-b px-4 py-2.5 ${scheme.bg}`}
      role="status"
      aria-live="assertive"
      data-trial-state={isExpired ? 'expired' : 'last_day'}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <AlertTriangle
            className="h-4 w-4 flex-shrink-0 animate-pulse"
            aria-hidden
          />
          <div className="min-w-0">
            <span className="font-semibold text-sm">{message}</span>
            {subMessage && (
              <span className="ml-2 text-xs opacity-80 hidden sm:inline">
                {subMessage}
              </span>
            )}
          </div>
        </div>

        {canManageBilling && (
          <Link
            href="/app/billing"
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold text-xs transition-all motion-safe:hover:scale-105 flex-shrink-0 ${scheme.accent}`}
          >
            <Zap className="h-3 w-3" aria-hidden />
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

'use client';

import { useTrialState } from '@/lib/trial/use-trial-state';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

/**
 * =========================================================
 * TrialCountdownBanner – Enhanced global trial banner
 * =========================================================
 * Replaces the old TrialStatusBanner with:
 * - Animated progress bar showing days elapsed
 * - Urgency tiers: active → expiring_soon → urgent → last_day → expired
 * - Smart CTA that changes based on trial phase
 * - Collapsed mode on mobile
 * - Does NOT render for paid users or founders
 */
export function TrialCountdownBanner() {
  const { status, daysRemaining, isTrialUser, isExpired, canManageBilling } =
    useTrialState();

  // Don't render for non-trial users
  if (!isTrialUser && !isExpired) return null;

  const isLastDay = status === 'last_day';
  const isUrgent = status === 'urgent';
  const isExpiringSoon = status === 'expiring_soon';

  // Color scheme based on urgency — uses semantic classes for both light & dark
  const scheme = isExpired
    ? {
        bg: 'trial-banner-danger',
        accent: 'bg-rose-500 text-white hover:bg-rose-600',
      }
    : isLastDay
      ? {
          bg: 'trial-banner-danger',
          accent: 'bg-rose-500 text-white hover:bg-rose-600',
        }
      : isUrgent
        ? {
            bg: 'trial-banner-warning',
            accent: 'bg-amber-500 text-white hover:bg-amber-600',
          }
        : isExpiringSoon
          ? {
              bg: 'trial-banner-warning',
              accent:
                'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500',
            }
          : {
              bg: 'trial-banner-info',
              accent:
                'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500',
            };

  const Icon =
    isExpired || isLastDay
      ? AlertTriangle
      : isUrgent
        ? Clock
        : isExpiringSoon
          ? Clock
          : CheckCircle;

  // Message
  const message = isExpired
    ? 'Your trial has ended — upgrade to keep full access'
    : isLastDay
      ? 'Trial expires today — activate your plan now'
      : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left in your free trial`;

  const subMessage = isExpired
    ? 'Read-only access to core features. Upgrade to unlock everything.'
    : isLastDay || isUrgent
      ? ''
      : 'Full access to all features';

  const ctaLabel = isExpired
    ? 'Upgrade Now'
    : isLastDay
      ? 'Activate Now'
      : isUrgent
        ? 'Choose Plan'
        : 'View Plans';

  return (
    <div
      className={`border-b px-4 py-2.5 ${scheme.bg}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Icon + message */}
        <div className="flex items-center gap-3 min-w-0">
          <Icon
            className={`h-4 w-4 flex-shrink-0 ${
              isLastDay || isExpired ? 'animate-pulse' : ''
            }`}
          />
          <div className="min-w-0">
            <span className="font-semibold text-sm">{message}</span>
            {subMessage && (
              <span className="ml-2 text-xs opacity-70 hidden sm:inline">
                {subMessage}
              </span>
            )}
          </div>
        </div>

        {/* Right: CTA */}
        {canManageBilling && (
          <Link
            href="/app/billing"
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold text-xs transition-all hover:scale-105 flex-shrink-0 ${scheme.accent}`}
          >
            {isExpired || isLastDay ? (
              <Zap className="h-3 w-3" />
            ) : (
              <ArrowRight className="h-3 w-3" />
            )}
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

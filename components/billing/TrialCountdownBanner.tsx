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

  // Compute progress (14-day trial)
  const totalDays = 14;
  const elapsed = Math.max(0, totalDays - daysRemaining);
  const progressPercent = Math.min(
    100,
    Math.round((elapsed / totalDays) * 100),
  );

  // Color scheme based on urgency
  const scheme = isExpired
    ? {
        bg: 'bg-rose-500/10',
        border: 'border-rose-400/30',
        text: 'text-rose-200',
        bar: 'bg-rose-400',
        accent: 'bg-rose-400 text-rose-950 hover:bg-rose-300',
      }
    : isLastDay
      ? {
          bg: 'bg-rose-500/10',
          border: 'border-rose-400/30',
          text: 'text-rose-200',
          bar: 'bg-rose-400',
          accent: 'bg-rose-400 text-rose-950 hover:bg-rose-300',
        }
      : isUrgent
        ? {
            bg: 'bg-amber-500/10',
            border: 'border-amber-400/30',
            text: 'text-amber-200',
            bar: 'bg-amber-400',
            accent: 'bg-amber-400 text-amber-950 hover:bg-amber-300',
          }
        : isExpiringSoon
          ? {
              bg: 'bg-amber-500/8',
              border: 'border-amber-400/20',
              text: 'text-amber-200',
              bar: 'bg-amber-400',
              accent:
                'bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-400 hover:to-indigo-400',
            }
          : {
              bg: 'bg-sky-500/8',
              border: 'border-sky-400/20',
              text: 'text-sky-200',
              bar: 'bg-sky-400',
              accent:
                'bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-400 hover:to-indigo-400',
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
      className={`border-b px-4 py-2.5 ${scheme.bg} ${scheme.border} ${scheme.text}`}
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

        {/* Center: Progress bar (hidden on mobile) */}
        {!isExpired && (
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${scheme.bar}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] opacity-60 tabular-nums">
              {elapsed}/{totalDays}d
            </span>
          </div>
        )}

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

'use client';

import { useTrialState } from '@/lib/trial/use-trial-state';
import { Clock, Zap } from 'lucide-react';
import Link from 'next/link';

/**
 * =========================================================
 * TrialDaysRemaining – Compact dashboard header widget
 * =========================================================
 * Designed to sit in the topbar or dashboard header.
 * Shows days remaining as a small, non-intrusive badge.
 * Clickable — links to billing page.
 */
export function TrialDaysRemaining() {
  const { status, daysRemaining, isTrialUser, isExpired } = useTrialState();

  if (!isTrialUser && !isExpired) return null;

  const isUrgent = status === 'urgent' || status === 'last_day';

  const colorClasses = isExpired
    ? 'border-rose-400/30 bg-rose-500/10 text-rose-300'
    : isUrgent
      ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
      : 'border-sky-400/20 bg-sky-500/8 text-sky-300';

  return (
    <Link
      href="/app/billing"
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all hover:scale-105 ${colorClasses}`}
      title={
        isExpired
          ? 'Trial expired — click to upgrade'
          : `${daysRemaining} days left in trial`
      }
    >
      {isExpired ? (
        <Zap className="h-3 w-3" />
      ) : (
        <Clock className={`h-3 w-3 ${isUrgent ? 'animate-pulse' : ''}`} />
      )}
      <span className="tabular-nums">
        {isExpired ? 'Expired' : `${daysRemaining}d left`}
      </span>
    </Link>
  );
}

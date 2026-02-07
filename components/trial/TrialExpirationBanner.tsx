'use client';

import { useEffect, useState } from 'react';
import { useTrialState } from '@/lib/trial/use-trial-state';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  ArrowRight,
  TrendingUp,
  X,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { TrialValueMetrics, ValueHighlight } from '@/lib/trial-engagement/value-calculator';

/**
 * =========================================================
 * TrialExpirationBanner – Enhanced trial banner with value recap
 * =========================================================
 * Shows progressive urgency (7/3/1-day warnings) with
 * personalized value messaging based on trial activity.
 */
export function TrialExpirationBanner() {
  const {
    status,
    daysRemaining,
    isTrialUser,
    isExpired,
    canManageBilling,
  } = useTrialState();

  const [valueMetrics, setValueMetrics] = useState<TrialValueMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't render for non-trial users
  if (!isTrialUser && !isExpired) return null;
  if (isDismissed && daysRemaining > 3) return null; // Allow dismissal only for non-urgent

  // Fetch value metrics
  useEffect(() => {
    const fetchValue = async () => {
      try {
        const response = await fetch('/api/trial/value-recap');
        if (response.ok) {
          const data = await response.json();
          setValueMetrics(data.metrics);
        }
      } catch (error) {
        // Silent fail - banner still works without value data
      } finally {
        setIsLoading(false);
      }
    };

    fetchValue();
  }, []);

  const isLastDay = status === 'last_day';
  const isUrgent = status === 'urgent' || daysRemaining <= 3;
  const isExpiringSoon = status === 'expiring_soon' || (daysRemaining <= 7 && daysRemaining > 3);

  // Color scheme based on urgency
  const scheme = isExpired || isLastDay
    ? {
        bg: 'bg-gradient-to-r from-rose-500/15 to-rose-500/5',
        border: 'border-rose-400/30',
        text: 'text-rose-100',
        accent: 'text-rose-300',
        button: 'bg-rose-500 hover:bg-rose-400 text-white',
        icon: 'text-rose-400',
      }
    : isUrgent
    ? {
        bg: 'bg-gradient-to-r from-amber-500/15 to-amber-500/5',
        border: 'border-amber-400/30',
        text: 'text-amber-100',
        accent: 'text-amber-300',
        button: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
        icon: 'text-amber-400',
      }
    : isExpiringSoon
    ? {
        bg: 'bg-gradient-to-r from-sky-500/10 to-indigo-500/5',
        border: 'border-sky-400/20',
        text: 'text-sky-100',
        accent: 'text-sky-300',
        button:
          'bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white',
        icon: 'text-sky-400',
      }
    : {
        bg: 'bg-sky-500/5',
        border: 'border-sky-400/10',
        text: 'text-slate-300',
        accent: 'text-sky-300',
        button:
          'bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white',
        icon: 'text-sky-400',
      };

  const Icon = isExpired || isLastDay
    ? AlertTriangle
    : isUrgent
    ? Clock
    : isExpiringSoon
    ? Clock
    : CheckCircle;

  // Generate message
  const headline = isExpired
    ? 'Your trial has ended'
    : isLastDay
    ? 'Trial expires today'
    : isUrgent
    ? `Only ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`
    : `${daysRemaining} days remaining in your trial`;

  const ctaLabel = isExpired
    ? 'Upgrade Now'
    : isLastDay || isUrgent
    ? 'Activate Plan'
    : 'Choose Plan';

  // Value recap message
  const hasValue = valueMetrics && valueMetrics.valueScore > 20;

  return (
    <div
      className={`border-b ${scheme.border} ${scheme.bg} ${scheme.text}`}
      role="alert"
      aria-live="polite"
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon + Message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Icon
              className={`h-5 w-5 flex-shrink-0 ${scheme.icon} ${
                isLastDay || isExpired ? 'animate-pulse' : ''
              }`}
            />
            <div className="min-w-0">
              <span className="font-semibold text-sm">{headline}</span>
              {hasValue && !isLoading && (
                <span className={`ml-2 text-xs ${scheme.accent} hidden sm:inline`}>
                  — {getValueSummary(valueMetrics)}
                </span>
              )}
            </div>
          </div>

          {/* Center: Value highlights (desktop only) */}
          {hasValue && !isLoading && daysRemaining >= 3 && (
            <div className="hidden lg:flex items-center gap-4">
              {valueMetrics.highlights.slice(0, 3).map((highlight, index) => (
                <ValueBadge key={index} highlight={highlight} />
              ))}
            </div>
          )}

          {/* Right: CTA + Dismiss */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {canManageBilling && (
              <Link
                href="/app/billing"
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold text-xs transition-all hover:scale-105 ${scheme.button}`}
              >
                {isExpired || isLastDay ? (
                  <Zap className="h-3 w-3" />
                ) : (
                  <ArrowRight className="h-3 w-3" />
                )}
                {ctaLabel}
              </Link>
            )}
            {daysRemaining > 3 && !isExpired && (
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expanded value recap (for urgent states) */}
        {hasValue && (isUrgent || isLastDay || isExpired) && !isLoading && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Your progress so far:
              </span>
              {valueMetrics.highlights.map((highlight, index) => (
                <ValueBadge key={index} highlight={highlight} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ValueBadge({ highlight }: { highlight: ValueHighlight }) {
  const iconMap = {
    check: CheckCircle,
    users: () => (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
        />
      </svg>
    ),
    shield: () => (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    zap: Zap,
    file: () => (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    trend: TrendingUp,
  };

  const IconComponent = iconMap[highlight.icon] || CheckCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
        highlight.emphasis
          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20'
          : 'bg-white/10 text-slate-300'
      }`}
    >
      <IconComponent className="h-3 w-3" />
      <span className="font-medium">{highlight.value}</span>
      <span className="text-slate-400">{highlight.label}</span>
    </span>
  );
}

function getValueSummary(metrics: TrialValueMetrics): string {
  const parts: string[] = [];

  if (metrics.tasksCompleted > 0) {
    parts.push(`${metrics.tasksCompleted} tasks completed`);
  }

  if (metrics.complianceImprovement > 0) {
    parts.push(`+${metrics.complianceImprovement}% compliance`);
  }

  if (parts.length === 0 && metrics.evidenceUploaded > 0) {
    parts.push(`${metrics.evidenceUploaded} evidence items`);
  }

  return parts.length > 0 ? parts.join(', ') : "You've made progress!";
}

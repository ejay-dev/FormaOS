'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  FileCheck,
  Calendar,
  AlertTriangle,
  Heart,
  Clock,
} from 'lucide-react';
import type {
  CareScorecard,
  CareScorecardAlert,
} from '@/lib/care-scorecard/types';

interface CareScorecardResponse {
  scorecard: CareScorecard;
  alerts: CareScorecardAlert[];
  recommendations: string[];
}

function computeCareIndex(scorecard: CareScorecard): number {
  const staff = scorecard.staffCompliance.percentage ?? 0;
  const visits = scorecard.visits.completionRate ?? 0;
  const credTotal = scorecard.credentials.total || 1;
  const credVerified = (scorecard.credentials.verified / credTotal) * 100;

  return Math.round(staff * 0.4 + visits * 0.4 + credVerified * 0.2);
}

function CareIndexRing({
  score,
  isLoading,
}: {
  score: number;
  isLoading: boolean;
}) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, score));
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-40 w-40 items-center justify-center shrink-0">
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 160 160"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="care-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#00d4fb" />
          </linearGradient>
        </defs>
        <circle
          cx="80"
          cy="80"
          r={radius}
          className="stroke-glass-border"
          strokeWidth="10"
          fill="transparent"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="url(#care-stroke)"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={isLoading ? circumference : offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="font-display text-4xl font-bold leading-none text-foreground">
          {isLoading ? '—' : value}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Care index
        </span>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const toneClass = {
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-rose-400',
    neutral: 'text-muted-foreground',
  }[tone];

  return (
    <div className="flex items-center gap-2 rounded-lg border border-glass-border bg-glass-subtle px-3 py-2">
      <Icon className={`h-3.5 w-3.5 ${toneClass}`} aria-hidden="true" />
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
}

export function CareOperationsHeroBand() {
  const [data, setData] = useState<CareScorecardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        const response = await fetch('/api/care-operations/scorecard');
        if (response.status === 403) {
          setData(null);
          setIsLoading(false);
          return;
        }
        if (!response.ok) throw new Error('fetch failed');
        const json = await response.json();
        setData(json);
      } catch {
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScorecard();
    const interval = setInterval(fetchScorecard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isLoading && !data) return null;
  if (!data) {
    return (
      <div className="h-44 animate-pulse rounded-2xl border border-glass-border bg-glass-subtle" />
    );
  }

  const { scorecard } = data;
  const careIndex = computeCareIndex(scorecard);
  const expiring = scorecard.credentials.expiring30Days.slice(0, 3);
  const reviews = scorecard.carePlans.reviewsDue7Days.slice(0, 3);

  const staffTone: 'success' | 'warning' | 'danger' =
    scorecard.staffCompliance.percentage >= 95
      ? 'success'
      : scorecard.staffCompliance.percentage >= 80
        ? 'warning'
        : 'danger';

  const visitTone: 'success' | 'warning' | 'danger' =
    scorecard.visits.completionRate >= 90
      ? 'success'
      : scorecard.visits.completionRate >= 75
        ? 'warning'
        : 'danger';

  const credentialTone: 'success' | 'warning' | 'danger' =
    scorecard.credentials.expired > 0
      ? 'danger'
      : scorecard.credentials.expiring30Days.length > 0
        ? 'warning'
        : 'success';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-6 shadow-premium-lg">
      <div
        className="pointer-events-none absolute -top-16 -right-10 h-60 w-60 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.18),transparent_70%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.14),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative grid gap-6 lg:grid-cols-[auto,1fr,1fr] lg:items-center">
        {/* Left: ring + title */}
        <div className="flex items-center gap-4">
          <CareIndexRing score={careIndex} isLoading={isLoading} />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-400" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Care Operations
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {careIndex >= 85
                ? 'Operating with headroom'
                : careIndex >= 70
                  ? 'Steady — watch credentials'
                  : 'Stretched — act on alerts'}
            </h3>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <MiniStat
                icon={Users}
                label="Staff"
                value={`${scorecard.staffCompliance.percentage}%`}
                tone={staffTone}
              />
              <MiniStat
                icon={Calendar}
                label="Visits"
                value={`${scorecard.visits.completionRate}%`}
                tone={visitTone}
              />
              <MiniStat
                icon={FileCheck}
                label="Credentials"
                value={`${scorecard.credentials.verified}/${scorecard.credentials.total}`}
                tone={credentialTone}
              />
            </div>
          </div>
        </div>

        {/* Middle: expiring credentials */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Credentials expiring soon
            </span>
            {scorecard.credentials.expiring30Days.length > 3 && (
              <span className="text-[10px] text-muted-foreground/60">
                +{scorecard.credentials.expiring30Days.length - 3} more
              </span>
            )}
          </div>
          {expiring.length === 0 ? (
            <div className="rounded-lg border border-dashed border-glass-border bg-glass-subtle px-3 py-4 text-center text-xs text-muted-foreground">
              Nothing expiring in the next 30 days.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {expiring.map((cred) => (
                <li
                  key={cred.id}
                  className="flex items-center justify-between rounded-lg border border-glass-border bg-white/5 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground/90">
                      {cred.staffName}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {cred.name}
                    </p>
                  </div>
                  <span
                    className={`ml-2 shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                      cred.daysUntilExpiry <= 7
                        ? 'bg-rose-500/15 text-rose-300'
                        : 'bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    {cred.daysUntilExpiry}d
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: reviews due this week as timeline strip */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Reviews this week
            </span>
            {scorecard.carePlans.reviewsDue > 3 && (
              <span className="text-[10px] text-muted-foreground/60">
                +{scorecard.carePlans.reviewsDue - 3} more
              </span>
            )}
          </div>
          {reviews.length === 0 ? (
            <div className="rounded-lg border border-dashed border-glass-border bg-glass-subtle px-3 py-4 text-center text-xs text-muted-foreground">
              No reviews due in the next 7 days.
            </div>
          ) : (
            <div className="space-y-1.5">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="relative flex items-center gap-3 rounded-lg border border-glass-border bg-white/5 px-3 py-2"
                >
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                    <div
                      className={`absolute inset-0 rounded-full ${
                        review.daysUntilReview <= 3
                          ? 'bg-rose-500/15'
                          : 'bg-amber-500/15'
                      }`}
                    />
                    <Clock
                      className={`h-3.5 w-3.5 ${
                        review.daysUntilReview <= 3
                          ? 'text-rose-300'
                          : 'text-amber-300'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground/90">
                      {review.clientName}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {review.planTitle}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold tabular-nums text-foreground/70">
                    {review.daysUntilReview}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer row — critical alerts */}
      {data.alerts.filter((a) => a.type === 'critical').length > 0 && (
        <div className="relative mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {data.alerts.filter((a) => a.type === 'critical').length} critical
            alert
            {data.alerts.filter((a) => a.type === 'critical').length === 1
              ? ''
              : 's'}{' '}
            need immediate attention.
          </span>
        </div>
      )}
    </div>
  );
}

export default CareOperationsHeroBand;

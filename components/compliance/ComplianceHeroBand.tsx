'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Target,
  ArrowRight,
} from 'lucide-react';
import {
  useComplianceStore,
  useComplianceSummary,
} from '@/lib/stores/compliance';
import { ErrorBoundary } from '@/components/ui/error-boundary';

function ReadinessRing({
  percentage,
  isLoading,
}: {
  percentage: number;
  isLoading: boolean;
}) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, percentage || 0));
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-44 w-44 items-center justify-center shrink-0">
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 160 160"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="readiness-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00d4fb" />
            <stop offset="50%" stopColor="#3399ff" />
            <stop offset="100%" stopColor="#8864ff" />
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
          stroke="url(#readiness-stroke)"
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
          {isLoading ? '—' : Math.round(value)}
          <span className="ml-0.5 text-xl text-muted-foreground">%</span>
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Readiness
        </span>
      </div>
    </div>
  );
}

type ReadinessState = {
  label: string;
  chip: string;
  description: string;
};

function deriveState(percentage: number, overdue: number): ReadinessState {
  if (overdue > 0) {
    return {
      label: 'At risk',
      chip: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
      description: `${overdue} item${overdue === 1 ? '' : 's'} past due — resolve to restore readiness.`,
    };
  }
  if (percentage >= 80) {
    return {
      label: "You're audit-ready",
      chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      description: 'Evidence current, controls passing, no overdue items.',
    };
  }
  if (percentage >= 50) {
    return {
      label: 'On track',
      chip: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      description: 'Progress is steady — stay on top of items due this week.',
    };
  }
  return {
    label: 'Getting started',
    chip: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    description:
      'Build momentum by completing high-impact controls and uploading evidence.',
  };
}

function Tile({
  label,
  value,
  href,
  icon: Icon,
  tone,
  isLoading,
}: {
  label: string;
  value: number;
  href: string;
  icon: React.ElementType;
  tone: 'neutral' | 'danger' | 'warning' | 'success';
  isLoading: boolean;
}) {
  const toneClass = {
    neutral:
      'border-glass-border bg-glass-subtle hover:bg-glass-strong',
    danger:
      'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10',
    warning:
      'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10',
    success:
      'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10',
  }[tone];

  const iconTone = {
    neutral: 'text-muted-foreground',
    danger: 'text-rose-400',
    warning: 'text-amber-400',
    success: 'text-emerald-400',
  }[tone];

  return (
    <Link
      href={href}
      className={`group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${toneClass}`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-4 w-4 ${iconTone}`} aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xl font-bold text-foreground tabular-nums">
          {isLoading ? '—' : value}
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
      </div>
    </Link>
  );
}

/**
 * Compliance Hero Band — redesigned scorecard hero.
 * Large readiness ring + state chip on the left; 4 tiles stacked on the right.
 */
export function ComplianceHeroBand() {
  const summary = useComplianceSummary();
  const fetchSummary = useComplianceStore((s) => s.fetchSummary);
  const isLoading = useComplianceStore((s) => s.isLoading);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const state = deriveState(summary.completionPercentage, summary.overdue);

  return (
    <ErrorBoundary name="ComplianceHeroBand" level="component">
      <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-6 shadow-premium-lg">
        <div
          className="pointer-events-none absolute -top-20 -left-20 h-60 w-60 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,212,251,0.18),transparent_70%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(136,100,255,0.15),transparent_70%)]"
          aria-hidden="true"
        />

        <div className="relative grid gap-6 md:grid-cols-[auto,1fr] md:items-center">
          {/* Left — ring + state */}
          <div className="flex flex-col items-center gap-4 md:items-start">
            <div className="flex items-center gap-6">
              <ReadinessRing
                percentage={summary.completionPercentage}
                isLoading={isLoading}
              />
              <div className="flex flex-col gap-2">
                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${state.chip}`}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                  </span>
                  {state.label}
                </span>
                <p className="max-w-[18ch] text-sm text-muted-foreground md:max-w-[22ch]">
                  {state.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right — tiles */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Tile
              label="Total obligations"
              value={summary.total}
              href="/app/compliance"
              icon={Target}
              tone="neutral"
              isLoading={isLoading}
            />
            <Tile
              label="Overdue"
              value={summary.overdue}
              href="/app/compliance?status=overdue"
              icon={AlertTriangle}
              tone={summary.overdue > 0 ? 'danger' : 'neutral'}
              isLoading={isLoading}
            />
            <Tile
              label="Due this week"
              value={summary.dueSoon}
              href="/app/compliance?status=due_soon"
              icon={Clock}
              tone={summary.dueSoon > 0 ? 'warning' : 'neutral'}
              isLoading={isLoading}
            />
            <Tile
              label="Completed"
              value={summary.completed}
              href="/app/compliance?status=completed"
              icon={CheckCircle2}
              tone="success"
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default ComplianceHeroBand;

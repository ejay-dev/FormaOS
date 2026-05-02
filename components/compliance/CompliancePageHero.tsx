'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Layers, ShieldCheck } from 'lucide-react';
import {
  useComplianceStore,
  useComplianceSummary,
} from '@/lib/stores/compliance';

export function CompliancePageHero() {
  const summary = useComplianceSummary();
  const fetchSummary = useComplianceStore((s) => s.fetchSummary);
  const lastFetched = useComplianceStore((s) => s.lastFetched);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const live = lastFetched !== null;
  const open = Math.max(0, summary.total - summary.completed);
  const overdue = summary.overdue;
  const dueSoon = summary.dueSoon;
  const pct = summary.completionPercentage;

  const postureLabel =
    !live
      ? 'Loading'
      : pct >= 85
        ? 'Buyer-ready'
        : pct >= 70
          ? 'Approaching'
          : pct > 0
            ? 'Needs attention'
            : 'No data yet';

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-card mb-4">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-primary"
      />

      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8">
        {/* Left: title */}
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Compliance · Obligations Register
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Obligations Register
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track, manage, and prove compliance across all frameworks.
          </p>
        </div>

        {/* Middle: hero metrics */}
        <div className="grid grid-cols-4 gap-4 sm:gap-6">
          <HeroMetric
            value={live ? open : '—'}
            label="Open"
            sub={live ? 'obligations' : 'Loading'}
          />
          <HeroMetric
            value={live ? overdue : '—'}
            label="Overdue"
            sub={live ? (overdue > 0 ? 'past SLA' : 'on cadence') : 'Loading'}
            tone={overdue > 0 ? 'danger' : 'neutral'}
          />
          <HeroMetric
            value={live ? dueSoon : '—'}
            label="Due"
            sub={live ? 'this week' : 'Loading'}
            tone={dueSoon > 5 ? 'warning' : 'neutral'}
          />
          <HeroMetric
            value={live ? `${pct}%` : '—'}
            label="Posture"
            sub={postureLabel}
          />
        </div>

        {/* Right: actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/compliance/frameworks"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
          >
            <Layers className="h-3.5 w-3.5" />
            Frameworks
          </Link>
          <Link
            href="/app/compliance/cross-map"
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Cross-Map
          </Link>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({
  value,
  label,
  sub,
  tone = 'neutral',
}: {
  value: string | number;
  label: string;
  sub?: string;
  tone?: 'neutral' | 'warning' | 'danger';
}) {
  const valueClass =
    tone === 'warning'
      ? 'text-amber-500'
      : tone === 'danger'
        ? 'text-rose-500'
        : 'text-foreground';

  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-[32px] font-bold leading-none tabular-nums tracking-tight sm:text-[36px] ${valueClass}`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1.5 truncate text-[11px] text-muted-foreground">
          {sub}
        </div>
      )}
    </div>
  );
}

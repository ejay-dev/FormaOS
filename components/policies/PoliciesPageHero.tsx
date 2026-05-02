'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

interface PoliciesPageHeroProps {
  total: number;
  published: number;
  drafts: number;
  loading?: boolean;
}

export function PoliciesPageHero({
  total,
  published,
  drafts,
  loading = false,
}: PoliciesPageHeroProps) {
  const v = (n: number) => (loading ? '—' : n);

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
            Governance · Policy Library
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Policy Library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organization&apos;s governance framework.
          </p>
        </div>

        {/* Middle: hero metrics */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <HeroMetric value={v(total)} label="Total" sub="policies" />
          <HeroMetric
            value={v(published)}
            label="Published"
            sub={!loading && published > 0 ? 'live' : 'none yet'}
          />
          <HeroMetric
            value={v(drafts)}
            label="Drafts"
            sub={!loading && drafts > 0 ? 'in progress' : 'all published'}
            tone={drafts > 0 ? 'warning' : 'neutral'}
          />
        </div>

        {/* Right: action */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/policies/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            New Policy
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

import Link from 'next/link';
import { Suspense } from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, ListChecks } from 'lucide-react';

import { PageHero } from '@/components/ui/page-hero';
import { SkeletonCard } from '@/components/ui/skeleton';
import { getCurrentOrgId } from '@/lib/frameworks/org-frameworks';
import { getOrgHealthAggregate } from '@/lib/compliance/health/fetch';
import type {
  FrameworkHealth,
  OutstandingControl,
} from '@/lib/compliance/health/aggregate';

export const metadata = {
  title: 'Compliance Health | FormaOS',
};

const SCORE_BANDS = [
  { min: 0.9, label: 'Healthy', color: 'text-emerald-700 bg-emerald-500/10' },
  { min: 0.7, label: 'Watch', color: 'text-amber-700 bg-amber-500/10' },
  { min: 0, label: 'At risk', color: 'text-red-700 bg-red-500/10' },
] as const;

function scoreBand(score: number) {
  return SCORE_BANDS.find((b) => score >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string | null): string {
  if (!value) return 'never';
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const RISK_PILL: Record<OutstandingControl['risk_level'], string> = {
  critical: 'bg-red-500/15 text-red-700 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-700 border-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  low: 'bg-slate-500/15 text-slate-700 border-slate-500/30',
};

async function HealthBody({ orgId }: { orgId: string }) {
  const aggregate = await getOrgHealthAggregate(orgId);
  const band = scoreBand(aggregate.overall.score);
  const { overall, frameworks, outstanding } = aggregate;

  if (overall.framework_count === 0) {
    return (
      <div className="rounded-2xl border border-glass-border bg-glass-subtle p-8 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
        <div className="mt-3 text-sm font-semibold">No frameworks enabled yet</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Enable at least one framework in onboarding or via{' '}
          <Link href="/app/compliance/frameworks" className="text-primary hover:underline">
            Framework Library
          </Link>{' '}
          to populate this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl border border-glass-border bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-6 shadow-premium-lg"
        data-testid="health-overall-section"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Overall compliance health
            </p>
            <p className="mt-1 text-4xl font-bold" data-testid="health-overall-score">
              {formatPercent(overall.score)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {overall.framework_count} framework{overall.framework_count === 1 ? '' : 's'} · {overall.total} controls
            </p>
          </div>
          <span
            className={`self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${band.color}`}
            data-testid="health-overall-band"
          >
            {band.label}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatusTile label="Pass" value={overall.status_counts.pass} tone="success" />
          <StatusTile label="Partial" value={overall.status_counts.partial} tone="warning" />
          <StatusTile label="Fail" value={overall.status_counts.fail} tone="danger" />
          <StatusTile label="Manual" value={overall.status_counts.not_evaluated} tone="neutral" />
        </div>
      </section>

      <section
        className="rounded-2xl border border-glass-border bg-glass-subtle p-6"
        data-testid="health-frameworks-section"
      >
        <h2 className="text-lg font-semibold">Per-framework breakdown</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Score is the weighted mean of pass + ½·partial per control.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {frameworks.map((fw) => (
            <FrameworkCard key={fw.framework_id} framework={fw} />
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl border border-glass-border bg-glass-subtle p-6"
        data-testid="health-outstanding-section"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Top 10 outstanding controls</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Sorted by urgency (status × risk level). Fail before partial.
            </p>
          </div>
          <Link
            href="/app/controls"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:border-primary/40"
          >
            All controls
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {outstanding.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-glass-border p-6 text-center text-sm text-muted-foreground">
            Nothing outstanding — every per-control evaluation is in the pass or manual band.
          </div>
        ) : (
          <ol className="mt-4 space-y-2" data-testid="health-outstanding-list">
            {outstanding.map((row, idx) => (
              <li
                key={`${row.framework_id}-${row.control_key}`}
                className="flex items-center gap-3 rounded-lg border border-glass-border bg-card/60 px-3 py-2"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-glass-subtle text-xs font-semibold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{row.control_key}</span>
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">
                      {row.framework_slug}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.control_title ?? 'No control title in framework pack'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${RISK_PILL[row.risk_level]}`}
                >
                  {row.risk_level}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    row.status === 'fail'
                      ? 'bg-red-500/15 text-red-700 border-red-500/30'
                      : 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                  }`}
                >
                  {row.status}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function StatusTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const colors: Record<typeof tone, string> = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
    danger: 'border-red-500/30 bg-red-500/10 text-red-700',
    neutral: 'border-slate-500/30 bg-slate-500/10 text-slate-700',
  };
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${colors[tone]}`}
      data-testid={`health-status-${label.toLowerCase()}`}
    >
      <p className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function FrameworkCard({ framework }: { framework: FrameworkHealth }) {
  const band = scoreBand(framework.score);
  return (
    <div
      className="rounded-xl border border-glass-border bg-card/60 p-4"
      data-testid={`health-framework-${framework.slug}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{framework.name}</p>
          <p className="text-xs text-muted-foreground">
            {framework.total} controls · evaluated {formatDate(framework.last_evaluated_at)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold">{formatPercent(framework.score)}</p>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${band.color}`}
          >
            {band.label}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5 text-xs">
        <Mini label="Pass" value={framework.status_counts.pass} color="text-emerald-700" />
        <Mini label="Partial" value={framework.status_counts.partial} color="text-amber-700" />
        <Mini label="Fail" value={framework.status_counts.fail} color="text-red-700" />
        <Mini label="Manual" value={framework.status_counts.not_evaluated} color="text-slate-700" />
      </div>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-md border border-glass-border bg-glass-subtle px-2 py-1 text-center">
      <p className={`text-sm font-semibold leading-none ${color}`}>{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function ComplianceHealthPage() {
  const orgId = await getCurrentOrgId();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <PageHero
        eyebrow="Compliance · Health"
        title="Compliance Health"
        subtitle="Cross-framework posture, top outstanding controls, and evaluator coverage in one view."
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/app/compliance/frameworks"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:border-primary/40"
        >
          <ListChecks className="h-3.5 w-3.5" />
          Framework library
        </Link>
        <Link
          href="/app/compliance/attestations"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:border-primary/40"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Manual attestations
        </Link>
      </div>

      <Suspense fallback={<SkeletonCard className="h-96" />}>
        <HealthBody orgId={orgId} />
      </Suspense>
    </div>
  );
}

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PageHeroMetricTone = 'neutral' | 'warning' | 'danger' | 'success';

export interface PageHeroMetric {
  label: string;
  value: string | number;
  sub?: string;
  tone?: PageHeroMetricTone;
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  titleTestId?: string;
  subtitle?: string;
  metrics?: PageHeroMetric[];
  actions?: ReactNode;
  className?: string;
}

// Status tones route to functional tokens; each tile pairs the colour with a
// text label (metric.label) so meaning is never conveyed by colour alone.
const valueToneClass: Record<PageHeroMetricTone, string> = {
  neutral: 'text-foreground',
  warning: 'text-warning',
  danger: 'text-destructive',
  success: 'text-success',
};

function metricsGridClass(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-3';
  if (count === 4) return 'grid-cols-2 sm:grid-cols-4';
  if (count === 5) return 'grid-cols-2 sm:grid-cols-5';
  return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
}

function metricValueSize(count: number): string {
  // Tighter scale when 4+ metrics share the row, otherwise generous.
  return count >= 4
    ? 'text-[28px] sm:text-[32px]'
    : 'text-[32px] sm:text-[36px]';
}

/**
 * PageHero — shared hero band used at the top of /app surfaces.
 *
 * Skeleton: eyebrow + title + subtitle on the left, optional metrics row
 * in the middle (auto-grid by count), optional actions row on the right,
 * with a single primary accent stripe down the left edge.
 *
 * Used by DashboardHero (which extends with avatar/greeting),
 * CompliancePageHero, PoliciesPageHero, VaultPageHero, etc.
 */
export function PageHero({
  eyebrow,
  title,
  titleTestId,
  subtitle,
  metrics = [],
  actions,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card mb-4',
        className,
      )}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-primary" />

      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8">
        {/* Title */}
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <h1
            className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            data-testid={titleTestId}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Metrics */}
        {metrics.length > 0 && (
          <div
            className={cn(
              'grid gap-4 sm:gap-6',
              metricsGridClass(metrics.length),
            )}
          >
            {metrics.map((m, i) => (
              <PageHeroMetricTile
                key={`${m.label}-${i}`}
                metric={m}
                count={metrics.length}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </section>
  );
}

function PageHeroMetricTile({
  metric,
  count,
}: {
  metric: PageHeroMetric;
  count: number;
}) {
  const toneClass = valueToneClass[metric.tone ?? 'neutral'];
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {metric.label}
      </div>
      <div
        className={cn(
          'mt-1 font-bold leading-none tabular-nums tracking-tight',
          metricValueSize(count),
          toneClass,
        )}
      >
        {metric.value}
      </div>
      {metric.sub && (
        <div className="mt-1.5 truncate text-[11px] text-muted-foreground">
          {metric.sub}
        </div>
      )}
    </div>
  );
}

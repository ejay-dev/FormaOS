/**
 * Reusable skeleton primitives for loading states.
 * Used by route-level loading.tsx files to show instant placeholders.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-muted',
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 space-y-4', className)}>
      <Skeleton className="h-4 w-1/3" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex gap-6 px-6 py-4 border-b border-border">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 px-6 py-4 border-b border-border/60 last:border-b-0">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

// Mirrors PageHero's metric grid (components/ui/page-hero.tsx) so a hero
// skeleton holds the same geometry the loaded page settles into.
function heroMetricsGridClass(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-3';
  if (count === 4) return 'grid-cols-2 sm:grid-cols-4';
  if (count === 5) return 'grid-cols-2 sm:grid-cols-5';
  return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
}

function cardsGridClass(count: number): string {
  if (count <= 2) return 'md:grid-cols-2';
  if (count === 3) return 'md:grid-cols-2 lg:grid-cols-3';
  return 'md:grid-cols-2 lg:grid-cols-4';
}

/** Page-level skeleton: header (plain or PageHero-shaped) + stat cards + table */
export function PageSkeleton({
  title,
  label,
  hero = false,
  heroMetrics = 0,
  heroActions = 0,
  cards = 0,
  tableRows = 5,
}: {
  /** Renders as a real heading. Omit on hero routes — the band supplies it. */
  title?: string;
  /** What is loading, for the announcement ("Loading incidents"). Falls back to title. */
  label?: string;
  /** Reproduce the PageHero band instead of a plain heading. */
  hero?: boolean;
  /** Metric tiles in the hero band; must match the page's metric count. */
  heroMetrics?: number;
  /** Action buttons in the hero band. */
  heroActions?: number;
  cards?: number;
  tableRows?: number;
}) {
  const announced = label ?? title;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={announced ? `Loading ${announced}` : 'Loading'}
      className={cn(
        'animate-in fade-in duration-300',
        hero ? 'space-y-6' : 'space-y-8',
      )}
    >
      {hero ? (
        <section className="relative overflow-hidden rounded-xl border border-border bg-card">
          <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-primary" />
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8">
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>

            {heroMetrics > 0 && (
              <div
                className={cn(
                  'grid gap-4 sm:gap-6',
                  heroMetricsGridClass(heroMetrics),
                )}
              >
                {Array.from({ length: heroMetrics }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-8 w-14" />
                  </div>
                ))}
              </div>
            )}

            {heroActions > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {Array.from({ length: heroActions }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className={cn('h-8 rounded-md', i % 2 === 0 ? 'w-28' : 'w-24')}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="space-y-2">
          {title ? (
            <h1 className="text-3xl font-bold text-foreground/70 tracking-tight">{title}</h1>
          ) : (
            <Skeleton className="h-8 w-48" />
          )}
          <Skeleton className="h-4 w-72" />
        </div>
      )}

      {/* Stat cards */}
      {cards > 0 && (
        <div className={cn('grid gap-4', cardsGridClass(cards))}>
          {Array.from({ length: cards }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Table */}
      {tableRows > 0 && <SkeletonTable rows={tableRows} />}
      <span className="sr-only">Loading content, please wait.</span>
    </div>
  );
}

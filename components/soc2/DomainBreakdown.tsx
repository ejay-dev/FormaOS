'use client';

import type { Soc2DomainScore } from '@/lib/soc2/types';

interface DomainBreakdownProps {
  domains: Soc2DomainScore[];
}

function getScoreColor(score: number) {
  if (score >= 80) return 'bg-success';
  if (score >= 50) return 'bg-warning';
  return 'bg-destructive';
}

function getScoreTextColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

export function DomainBreakdown({ domains }: DomainBreakdownProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {domains.map((domain) => (
        <div
          key={domain.key}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            {domain.domain}
          </div>
          <div className={`mt-2 text-2xl font-bold tabular-nums ${getScoreTextColor(domain.score)}`}>
            {Math.round(domain.score)}%
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-surface-2">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${getScoreColor(domain.score)}`}
              style={{ width: `${Math.min(100, domain.score)}%` }}
            />
          </div>

          {/* Status counts */}
          <div className="mt-4 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-muted-foreground">{domain.satisfiedControls}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-warning" />
              <span className="text-muted-foreground">{domain.partialControls}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">{domain.missingControls}</span>
            </span>
          </div>

          <div className="mt-2 text-[10px] text-muted-foreground/40">
            {domain.totalControls} control{domain.totalControls !== 1 ? 's' : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

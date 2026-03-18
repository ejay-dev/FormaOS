'use client';

import type { Soc2DomainScore } from '@/lib/soc2/types';

interface DomainBreakdownProps {
  domains: Soc2DomainScore[];
}

function getScoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-400';
  if (score >= 50) return 'bg-amber-400';
  return 'bg-rose-400';
}

function getScoreTextColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
}

export function DomainBreakdown({ domains }: DomainBreakdownProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {domains.map((domain) => (
        <div
          key={domain.key}
          className="rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {domain.domain}
          </div>
          <div className={`mt-2 text-2xl font-black tabular-nums ${getScoreTextColor(domain.score)}`}>
            {Math.round(domain.score)}%
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${getScoreColor(domain.score)}`}
              style={{ width: `${Math.min(100, domain.score)}%` }}
            />
          </div>

          {/* Status counts */}
          <div className="mt-4 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">{domain.satisfiedControls}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-slate-400">{domain.partialControls}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              <span className="text-slate-400">{domain.missingControls}</span>
            </span>
          </div>

          <div className="mt-2 text-[10px] text-slate-600">
            {domain.totalControls} control{domain.totalControls !== 1 ? 's' : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

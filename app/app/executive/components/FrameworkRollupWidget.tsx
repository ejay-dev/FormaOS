'use client';

import { TrendingUp, TrendingDown, Minus, ShieldCheck } from 'lucide-react';
import type { FrameworkRollupItem } from '@/lib/executive/types';

interface FrameworkRollupWidgetProps {
  frameworks: FrameworkRollupItem[];
  isLoading?: boolean;
}

export function FrameworkRollupWidget({
  frameworks,
  isLoading = false,
}: FrameworkRollupWidgetProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-white/10 mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (frameworks.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <ShieldCheck className="h-12 w-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400">No compliance frameworks enabled.</p>
        <p className="text-sm text-slate-500 mt-2">
          Enable frameworks in Settings to track compliance posture.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Framework Coverage</h3>
          <p className="text-xs text-slate-400">{frameworks.length} frameworks tracked</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {frameworks.map((framework) => (
          <FrameworkCard key={framework.frameworkId} framework={framework} />
        ))}
      </div>
    </div>
  );
}

function FrameworkCard({ framework }: { framework: FrameworkRollupItem }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-400';
    if (score >= 60) return 'text-sky-400 bg-sky-400';
    if (score >= 40) return 'text-amber-400 bg-amber-400';
    return 'text-red-400 bg-red-400';
  };

  const colors = getScoreColor(framework.readinessScore);
  const [textColor, bgColor] = colors.split(' ');

  const TrendIcon =
    framework.trendDirection === 'up'
      ? TrendingUp
      : framework.trendDirection === 'down'
      ? TrendingDown
      : Minus;

  const trendColor =
    framework.trendDirection === 'up'
      ? 'text-emerald-400'
      : framework.trendDirection === 'down'
      ? 'text-red-400'
      : 'text-slate-400';

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {framework.code}
          </div>
          <div className="text-sm text-slate-300 mt-0.5 line-clamp-1">{framework.title}</div>
        </div>
        <div className={`text-2xl font-bold ${textColor}`}>{framework.readinessScore}%</div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-white/10">
        <div
          className={`h-2 rounded-full ${bgColor}`}
          style={{ width: `${framework.readinessScore}%` }}
        />
      </div>

      {/* Stats Row */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            <span className="text-emerald-400">{framework.controlsSatisfied}</span>/
            {framework.controlsTotal} controls
          </span>
          {framework.controlsPartial > 0 && (
            <span className="text-amber-400">{framework.controlsPartial} partial</span>
          )}
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />
          <span>
            {framework.trend > 0 ? '+' : ''}
            {framework.trend}%
          </span>
        </div>
      </div>
    </div>
  );
}

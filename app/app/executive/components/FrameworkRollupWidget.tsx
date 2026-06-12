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
      <div className="rounded-2xl border border-edge-2 bg-surface-1 p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-surface-2 mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-surface-2" />
          ))}
        </div>
      </div>
    );
  }

  if (frameworks.length === 0) {
    return (
      <div className="rounded-2xl border border-edge-2 bg-surface-1 p-8 text-center">
        <ShieldCheck className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
        <p className="text-muted-foreground">No compliance frameworks enabled.</p>
        <p className="text-sm text-muted-foreground/60 mt-2">
          Enable frameworks in Settings to track compliance posture.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-edge-2 bg-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge-2 bg-surface-1">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Framework Coverage</h3>
          <p className="text-xs text-muted-foreground">{frameworks.length} frameworks tracked</p>
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
    if (score >= 80) return 'text-success bg-success';
    if (score >= 60) return 'text-info bg-info';
    if (score >= 40) return 'text-warning bg-warning';
    return 'text-destructive bg-destructive';
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
      ? 'text-success'
      : framework.trendDirection === 'down'
      ? 'text-destructive'
      : 'text-muted-foreground';

  return (
    <div className="rounded-xl border border-edge-2 bg-surface-1 p-4 hover:bg-surface-2 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {framework.code}
          </div>
          <div className="text-sm text-foreground/70 mt-0.5 line-clamp-1">{framework.title}</div>
        </div>
        <div className={`text-2xl font-bold ${textColor}`}>{framework.readinessScore}%</div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-surface-2">
        <div
          className={`h-2 rounded-full ${bgColor}`}
          style={{ width: `${framework.readinessScore}%` }}
        />
      </div>

      {/* Stats Row */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            <span className="text-success">{framework.controlsSatisfied}</span>/
            {framework.controlsTotal} controls
          </span>
          {framework.controlsPartial > 0 && (
            <span className="text-warning">{framework.controlsPartial} partial</span>
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

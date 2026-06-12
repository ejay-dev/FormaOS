'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { clsx } from 'clsx';

interface KpiSparklineProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  data: number[];
  accent?: 'cyan' | 'violet' | 'emerald' | 'amber';
  trend?: { value: number; isPositive: boolean };
  description?: string;
  className?: string;
}

const ACCENTS = {
  cyan: { stroke: '#71717a', fill: 'rgba(113,113,122,0.15)' },
  violet: { stroke: '#71717a', fill: 'rgba(113,113,122,0.15)' },
  emerald: { stroke: '#10b981', fill: 'rgba(16,185,129,0.15)' },
  amber: { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.15)' },
};

function Sparkline({ data, accent }: { data: number[]; accent: keyof typeof ACCENTS }) {
  const width = 120;
  const height = 36;

  if (!data || data.length < 2) {
    return <div className="h-9 w-[120px]" aria-hidden="true" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const areaPath = `M0,${height} L${points
    .split(' ')
    .map((p) => p)
    .join(' L')} L${width},${height} Z`;

  const { stroke, fill } = ACCENTS[accent];
  const gradId = `spark-${accent}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KpiSparkline({
  title,
  value,
  icon: Icon,
  data,
  accent = 'cyan',
  trend,
  description,
  className,
}: KpiSparklineProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-premium-lg',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h3>
        </div>
        {trend && (
          <div
            className={clsx(
              'flex items-center gap-0.5 text-[11px] font-bold',
              trend.isPositive ? 'text-success' : 'text-destructive',
            )}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-4">
        <div className="flex flex-col">
          <span className="font-display text-3xl font-bold leading-none tracking-tight text-foreground">
            {value}
          </span>
          {description && (
            <span className="mt-1.5 text-xs text-muted-foreground">
              {description}
            </span>
          )}
        </div>
        <Sparkline data={data} accent={accent} />
      </div>
    </div>
  );
}

interface RiskCellProps {
  label: string;
  pressure: number; // 0–100
  grade: 'A' | 'B' | 'C' | 'D';
}

const GRADE_TONE: Record<RiskCellProps['grade'], string> = {
  A: 'text-success bg-success/10 border-success/20',
  B: 'text-info bg-info/10 border-info/20',
  C: 'text-warning bg-warning/10 border-warning/20',
  D: 'text-destructive bg-destructive/10 border-destructive/20',
};

export function RiskHeatmapCell({ label, pressure, grade }: RiskCellProps) {
  const pct = Math.max(0, Math.min(100, pressure));
  const barTone =
    grade === 'A'
      ? 'from-success/40 to-success/10'
      : grade === 'B'
        ? 'from-info/40 to-info/10'
        : grade === 'C'
          ? 'from-warning/40 to-warning/10'
          : 'from-destructive/50 to-destructive/10';

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface-1 p-4">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold ${GRADE_TONE[grade]}`}
          aria-label={`Grade ${grade}`}
        >
          {grade}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
          {pct}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barTone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  DeltaBadge,
  type TrendDirection,
} from '@/components/dashboard/tabler-primitives';

type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';

const dotColor: Record<Tone, string> = {
  blue: 'bg-[hsl(var(--app-primary))]',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500',
};

export interface KpiItem {
  id: string;
  label: string;
  value: string | number;
  delta?: { value: string; direction: TrendDirection };
  tone?: Tone;
  href?: string;
}

interface KpiBarProps {
  items: KpiItem[];
  className?: string;
}

export function KpiBar({ items, className }: KpiBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-border bg-[hsl(var(--card))] px-4 py-2.5',
        className,
      )}
    >
      {items.map((it, idx) => {
        const inner = (
          <span className="flex items-center gap-2">
            {it.tone && (
              <span
                className={cn('h-1.5 w-1.5 rounded-full', dotColor[it.tone])}
                aria-hidden
              />
            )}
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {it.label}
            </span>
            <span className="text-sm font-bold tabular-nums tracking-tight text-foreground">
              {it.value}
            </span>
            {it.delta && (
              <DeltaBadge
                direction={it.delta.direction}
                value={it.delta.value}
              />
            )}
          </span>
        );
        const wrap = it.href ? (
          <Link
            href={it.href}
            className="rounded-md transition-colors hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--app-primary))]/50"
          >
            {inner}
          </Link>
        ) : (
          inner
        );
        return (
          <span key={it.id} className="flex items-center gap-5">
            {idx > 0 && <span className="h-4 w-px bg-border" aria-hidden />}
            {wrap}
          </span>
        );
      })}
    </div>
  );
}

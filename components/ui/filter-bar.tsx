'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterChip {
  id: string;
  label: string;
  value?: string;
  count?: number;
  onRemove?: () => void;
}

interface FilterBarProps {
  filters: FilterChip[];
  onClearAll?: () => void;
  actions?: React.ReactNode;
  emptyLabel?: string;
  className?: string;
}

export function FilterBar({
  filters,
  onClearAll,
  actions,
  emptyLabel,
  className,
}: FilterBarProps) {
  const active = filters.length;
  if (active === 0 && !actions && !emptyLabel) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {active === 0 && emptyLabel && (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {emptyLabel}
        </span>
      )}
      {filters.map((f) => (
        <span
          key={f.id}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-[hsl(var(--card))] py-1 pl-2.5 pr-1 text-xs transition-colors hover:border-[hsl(var(--app-primary))]/40"
        >
          <span className="font-medium text-muted-foreground">{f.label}</span>
          {f.value && (
            <>
              <span className="text-border">:</span>
              <span className="font-semibold text-foreground">{f.value}</span>
            </>
          )}
          {typeof f.count === 'number' && (
            <span className="ml-0.5 rounded-full bg-[hsl(var(--app-primary))]/15 px-1.5 text-[10px] font-semibold text-[hsl(var(--app-primary))]">
              {f.count}
            </span>
          )}
          {f.onRemove && (
            <button
              type="button"
              onClick={f.onRemove}
              aria-label={`Remove ${f.label} filter`}
              className="rounded-full p-0.5 text-muted-foreground transition-colors outline-none hover:bg-muted/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      {active > 0 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Clear all ({active})
        </button>
      )}

      {actions && (
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

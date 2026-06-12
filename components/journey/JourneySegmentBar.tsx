import { cn } from '@/lib/utils';

export type SegmentTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted'
  | 'primary';

export interface Segment {
  key: string;
  label: string;
  value: number;
  tone: SegmentTone;
}

const FILL: Record<SegmentTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
  muted: 'bg-muted-foreground/40',
  primary: 'bg-primary',
};

const DOT: Record<SegmentTone, string> = FILL;

export interface JourneySegmentBarProps {
  segments: Segment[];
  className?: string;
  compactLegend?: boolean;
}

export function JourneySegmentBar({
  segments,
  className,
  compactLegend,
}: JourneySegmentBarProps) {
  const total = segments.reduce((n, s) => n + s.value, 0);

  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <div
        className="relative flex h-1.5 w-32 shrink-0 overflow-hidden rounded-full bg-surface-1"
        role="img"
        aria-label={segments
          .map((s) => `${s.label} ${s.value}`)
          .join(', ')}
      >
        {total > 0 &&
          segments.map((s) => {
            const pct = (s.value / total) * 100;
            if (pct <= 0) return null;
            return (
              <span
                key={s.key}
                className={cn('h-full', FILL[s.tone])}
                style={{ width: `${pct}%` }}
              />
            );
          })}
      </div>
      <ul className="flex min-w-0 items-center gap-2.5 overflow-hidden">
        {segments.map((s) => (
          <li
            key={s.key}
            className="flex min-w-0 items-center gap-1.5 text-[11px]"
          >
            <span
              className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[s.tone])}
              aria-hidden="true"
            />
            {!compactLegend && (
              <span className="truncate text-muted-foreground">{s.label}</span>
            )}
            <span className="font-semibold tabular-nums text-foreground">
              {s.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default JourneySegmentBar;

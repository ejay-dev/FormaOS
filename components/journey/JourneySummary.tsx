import { cn } from '@/lib/utils';

export interface JourneySummarySegment {
  label: string;
  value: number;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
}

const STROKE: Record<JourneySummarySegment['tone'], string> = {
  primary: 'stroke-primary',
  success: 'stroke-success',
  warning: 'stroke-warning',
  danger: 'stroke-destructive',
  info: 'stroke-info',
  muted: 'stroke-muted-foreground/40',
};

const DOT: Record<JourneySummarySegment['tone'], string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
  muted: 'bg-muted-foreground/40',
};

export interface JourneySummaryProps {
  title: string;
  description?: string;
  segments: JourneySummarySegment[];
  centerLabel?: string;
  centerValue: string;
  ariaLabel?: string;
}

export function JourneySummary({
  title,
  description,
  segments,
  centerLabel,
  centerValue,
  ariaLabel,
}: JourneySummaryProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const length = fraction * circumference;
    const arc = {
      tone: seg.tone,
      dashArray: `${length} ${circumference - length}`,
      dashOffset: -offset,
    };
    offset += length;
    return arc;
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <div
          className="relative h-36 w-36 shrink-0"
          role="img"
          aria-label={
            ariaLabel ??
            `${title}: ${segments
              .map((s) => `${s.label} ${s.value}`)
              .join(', ')}`
          }
        >
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="stroke-border"
              strokeWidth="14"
              fill="none"
              opacity={0.3}
            />
            {total > 0 &&
              arcs.map((arc, i) => (
                <circle
                  key={i}
                  cx="64"
                  cy="64"
                  r={radius}
                  className={cn(STROKE[arc.tone])}
                  strokeWidth="14"
                  fill="none"
                  strokeLinecap="butt"
                  strokeDasharray={arc.dashArray}
                  strokeDashoffset={arc.dashOffset}
                />
              ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {centerValue}
            </div>
            {centerLabel && (
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {centerLabel}
              </div>
            )}
          </div>
        </div>

        <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
          {segments.map((seg) => (
            <li
              key={seg.label}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <span
                  className={cn('h-2 w-2 shrink-0 rounded-full', DOT[seg.tone])}
                  aria-hidden="true"
                />
                <span className="truncate">{seg.label}</span>
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {seg.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default JourneySummary;

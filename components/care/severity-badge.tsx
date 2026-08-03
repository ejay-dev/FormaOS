import { cn } from '@/lib/utils';

/**
 * One severity scale for the whole care area — incident severity,
 * participant risk level and task priority all read the same four steps.
 *
 * The four steps are visually distinct from each other (solid destructive →
 * outlined destructive → warning → muted) so High and Medium can be told
 * apart at a glance, and every badge prints the level as a word so colour is
 * never the only signal.
 */
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const SEVERITY_CLASSES: Record<SeverityLevel, string> = {
  critical: 'border-destructive bg-destructive text-destructive-foreground',
  high: 'border-destructive/40 bg-destructive/10 text-destructive',
  medium: 'border-warning/40 bg-warning/10 text-warning',
  low: 'border-border bg-muted text-muted-foreground',
};

const SEVERITY_TEXT_CLASSES: Record<SeverityLevel, string> = {
  critical: 'text-destructive font-semibold',
  high: 'text-destructive',
  medium: 'text-warning',
  low: 'text-muted-foreground',
};

const ALIASES: Record<string, SeverityLevel> = {
  critical: 'critical',
  severe: 'critical',
  urgent: 'critical',
  high: 'high',
  major: 'high',
  medium: 'medium',
  moderate: 'medium',
  normal: 'medium',
  low: 'low',
  minor: 'low',
  none: 'low',
};

export function normaliseSeverity(value: string | null | undefined): SeverityLevel {
  if (!value) return 'low';
  return ALIASES[value.trim().toLowerCase()] ?? 'low';
}

export function severityLabel(value: string | null | undefined): string {
  return SEVERITY_LABELS[normaliseSeverity(value)];
}

/** Colour-only helper for places that already render the level as text. */
export function severityTextClass(value: string | null | undefined): string {
  return SEVERITY_TEXT_CLASSES[normaliseSeverity(value)];
}

export function SeverityBadge({
  level,
  className,
  size = 'md',
}: {
  level: string | null | undefined;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const step = normaliseSeverity(level);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        SEVERITY_CLASSES[step],
        className,
      )}
    >
      {SEVERITY_LABELS[step]}
    </span>
  );
}

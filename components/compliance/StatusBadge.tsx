import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

/**
 * The one tone map for compliance status across /app. Semantic tokens only —
 * every tone inverts correctly between the light and dark charcoal ramps.
 * Colour is never the only signal: each badge always renders its label.
 */
const TONE_CLASS: Record<StatusTone, string> = {
  success: 'border-success/20 bg-success/10 text-success',
  warning: 'border-warning/20 bg-warning/10 text-warning',
  danger: 'border-destructive/20 bg-destructive/10 text-destructive',
  neutral: 'border-border bg-muted text-muted-foreground',
  info: 'border-info/20 bg-info/10 text-info',
};

const SIZE_CLASS = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
} as const;

export interface StatusDescriptor {
  label: string;
  tone: StatusTone;
}

interface StatusBadgeProps extends StatusDescriptor {
  icon?: ComponentType<{ className?: string }>;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  title?: string;
}

export function StatusBadge({
  label,
  tone,
  icon: Icon,
  size = 'sm',
  className,
  title,
}: StatusBadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-md border font-medium',
        SIZE_CLASS[size],
        TONE_CLASS[tone],
        className,
      )}
    >
      {Icon ? <Icon className="h-3 w-3 shrink-0" /> : null}
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Vocabularies — one wording per domain, shared by every surface.
 * ------------------------------------------------------------------ */

/**
 * Control state. Evaluator results (pass/partial/fail/not_evaluated) and
 * stored evaluation rows (compliant/at_risk/non_compliant) resolve to the
 * same four words so a control never changes name between pages.
 */
export function controlStatus(status: string | null | undefined): StatusDescriptor {
  switch (status) {
    case 'compliant':
    case 'pass':
    case 'satisfied':
      return { label: 'Compliant', tone: 'success' };
    case 'non_compliant':
    case 'fail':
      return { label: 'Non-compliant', tone: 'danger' };
    case 'not_evaluated':
    case 'manual':
      return { label: 'Manual check', tone: 'neutral' };
    default:
      return { label: 'At risk', tone: 'warning' };
  }
}

/** Evidence and credential review state. */
export function evidenceStatus(status: string | null | undefined): StatusDescriptor {
  switch (status) {
    case 'verified':
      return { label: 'Verified', tone: 'success' };
    case 'rejected':
      return { label: 'Rejected', tone: 'danger' };
    default:
      return { label: 'Pending', tone: 'warning' };
  }
}

/** Certificate / credential expiry, driven by the expiry date itself. */
export function certificateExpiry(
  expiryDate: string | null | undefined,
): StatusDescriptor {
  if (!expiryDate) return { label: 'No expiry', tone: 'neutral' };

  const days = Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / 86_400_000,
  );
  if (days < 0) return { label: 'Expired', tone: 'danger' };
  if (days <= 30) return { label: `Expires in ${days}d`, tone: 'danger' };
  if (days <= 90) return { label: `Expires in ${days}d`, tone: 'warning' };
  return { label: 'Valid', tone: 'success' };
}

/** Severity and risk level, shared by CAPA, evidence gaps and obligations. */
export function severityStatus(
  severity: string | null | undefined,
): StatusDescriptor {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return { label: 'Critical', tone: 'danger' };
    case 'high':
      return { label: 'High', tone: 'danger' };
    case 'medium':
      return { label: 'Medium', tone: 'warning' };
    case 'low':
      return { label: 'Low', tone: 'success' };
    default:
      return { label: 'Unrated', tone: 'neutral' };
  }
}

/** Obligation / task lifecycle. */
export function obligationStatus(
  status: string | null | undefined,
): StatusDescriptor {
  switch (status) {
    case 'overdue':
      return { label: 'Overdue', tone: 'danger' };
    case 'due_soon':
      return { label: 'Due soon', tone: 'warning' };
    case 'completed':
      return { label: 'Completed', tone: 'success' };
    case 'on_track':
      return { label: 'On track', tone: 'success' };
    default:
      return { label: 'Not started', tone: 'neutral' };
  }
}

/** Document lifecycle shared by policies and policy versions. */
export function documentStatus(
  status: string | null | undefined,
): StatusDescriptor {
  switch (status) {
    case 'published':
      return { label: 'Published', tone: 'success' };
    case 'pending_approval':
    case 'review':
      return { label: 'In review', tone: 'warning' };
    case 'archived':
      return { label: 'Archived', tone: 'neutral' };
    default:
      return { label: 'Draft', tone: 'neutral' };
  }
}

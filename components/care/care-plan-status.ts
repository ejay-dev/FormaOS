/**
 * Canonical care-plan lifecycle. The detail page, the list and the journey
 * board all read this set, so a plan can never be transitioned into a state
 * one of those views cannot render.
 *
 * 'review' is a legacy value written by earlier builds of the detail page;
 * it normalises to 'under_review' rather than falling back to draft.
 */
export const CARE_PLAN_STATUSES = [
  'draft',
  'active',
  'under_review',
  'completed',
  'expired',
  'archived',
] as const;

export type CarePlanStatus = (typeof CARE_PLAN_STATUSES)[number];

const ALIASES: Record<string, CarePlanStatus> = {
  review: 'under_review',
  in_review: 'under_review',
  complete: 'completed',
  closed: 'completed',
};

export function normaliseCarePlanStatus(
  value: string | null | undefined,
): CarePlanStatus {
  const key = (value ?? '').trim().toLowerCase();
  if ((CARE_PLAN_STATUSES as readonly string[]).includes(key)) {
    return key as CarePlanStatus;
  }
  return ALIASES[key] ?? 'draft';
}

export const CARE_PLAN_STATUS_LABELS: Record<CarePlanStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  under_review: 'Under review',
  completed: 'Completed',
  expired: 'Expired',
  archived: 'Archived',
};

export const CARE_PLAN_STATUS_CLASSES: Record<CarePlanStatus, string> = {
  draft: 'text-muted-foreground bg-muted/40',
  active: 'text-success bg-success/10',
  under_review: 'text-info bg-info/10',
  completed: 'text-foreground bg-muted',
  expired: 'text-destructive bg-destructive/10',
  archived: 'text-muted-foreground bg-muted/50',
};

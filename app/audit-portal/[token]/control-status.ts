/**
 * Control status vocabulary for the auditor portal.
 *
 * public.org_controls is a view over org_control_evaluations, and two
 * generations of writer feed it: the evaluator registry writes
 * pass/partial/fail/not_evaluated, while the older heuristic engine wrote
 * compliant/at_risk/non_compliant plus satisfied/met/not_met synonyms. Rows
 * carry either, so both vocabularies are mapped here and an unrecognised
 * value is reported as unknown rather than guessed at — an external auditor
 * must never be shown a status the product did not actually record.
 */
export type ControlStatusGroup =
  | 'met'
  | 'partial'
  | 'not_met'
  | 'not_applicable'
  | 'unassessed'
  | 'unknown';

const STATUS_GROUPS: Record<string, ControlStatusGroup> = {
  pass: 'met',
  compliant: 'met',
  satisfied: 'met',
  met: 'met',
  implemented: 'met',
  partial: 'partial',
  at_risk: 'partial',
  in_progress: 'partial',
  fail: 'not_met',
  non_compliant: 'not_met',
  not_met: 'not_met',
  gap: 'not_met',
  not_started: 'not_met',
  not_applicable: 'not_applicable',
  not_evaluated: 'unassessed',
};

export const CONTROL_STATUS_LABELS: Record<
  ControlStatusGroup,
  { label: string; className: string }
> = {
  met: { label: 'Met', className: 'text-success' },
  partial: { label: 'Partially met', className: 'text-warning' },
  not_met: { label: 'Not met', className: 'text-destructive' },
  not_applicable: {
    label: 'Not applicable',
    className: 'text-muted-foreground',
  },
  unassessed: { label: 'Not assessed', className: 'text-muted-foreground' },
  unknown: { label: 'Status not recorded', className: 'text-muted-foreground' },
};

export function controlStatusGroup(
  status: string | null | undefined,
): ControlStatusGroup {
  if (!status) return 'unassessed';
  return STATUS_GROUPS[status.trim().toLowerCase()] ?? 'unknown';
}

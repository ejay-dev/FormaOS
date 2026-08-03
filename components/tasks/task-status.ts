import type { StatusDescriptor } from '@/components/compliance/StatusBadge';

/**
 * The one task status vocabulary, shared by the list, the board and the
 * calendar.
 *
 * These five values are exactly the ones `org_tasks.status` accepts
 * (`org_tasks_status_check`), so anything the board writes is a value the
 * other two views can read back. Existing rows and the public API still
 * carry 'open', 'todo' and 'done', so every read goes through
 * `normaliseTaskStatus` rather than comparing raw strings.
 */
export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'cancelled';

/** Board column order, and the order status filters are offered in. */
export const TASK_STATUSES: readonly TaskStatus[] = [
  'pending',
  'in_progress',
  'blocked',
  'completed',
  'cancelled',
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'To do',
  in_progress: 'In progress',
  blocked: 'Blocked',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_ALIASES: Record<string, TaskStatus> = {
  pending: 'pending',
  open: 'pending',
  todo: 'pending',
  to_do: 'pending',
  not_started: 'pending',
  in_progress: 'in_progress',
  active: 'in_progress',
  in_review: 'in_progress',
  review: 'in_progress',
  blocked: 'blocked',
  completed: 'completed',
  complete: 'completed',
  done: 'completed',
  cancelled: 'cancelled',
  canceled: 'cancelled',
};

export function normaliseTaskStatus(
  value: string | null | undefined,
): TaskStatus {
  if (!value) return 'pending';
  return STATUS_ALIASES[value.trim().toLowerCase()] ?? 'pending';
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function taskStatusLabel(value: string | null | undefined): string {
  return TASK_STATUS_LABELS[normaliseTaskStatus(value)];
}

/** True while a task still counts as work in hand (drives overdue counts). */
export function isTaskOpen(value: string | null | undefined): boolean {
  const status = normaliseTaskStatus(value);
  return status !== 'completed' && status !== 'cancelled';
}

/**
 * Tones come from the shared StatusBadge map, which already inverts between
 * the light and dark ramps. The label always renders, so colour is never the
 * only signal.
 */
export function taskStatus(value: string | null | undefined): StatusDescriptor {
  const status = normaliseTaskStatus(value);
  switch (status) {
    case 'in_progress':
      return { label: TASK_STATUS_LABELS.in_progress, tone: 'info' };
    case 'blocked':
      return { label: TASK_STATUS_LABELS.blocked, tone: 'danger' };
    case 'completed':
      return { label: TASK_STATUS_LABELS.completed, tone: 'success' };
    case 'cancelled':
      return { label: TASK_STATUS_LABELS.cancelled, tone: 'neutral' };
    default:
      return { label: TASK_STATUS_LABELS.pending, tone: 'neutral' };
  }
}

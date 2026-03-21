export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export function normalizeTaskPriority(
  value: string | null | undefined,
): TaskPriority {
  switch ((value ?? '').toLowerCase()) {
    case 'urgent':
      return 'critical';
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'low':
      return 'low';
    case 'standard':
    case 'medium':
    default:
      return 'medium';
  }
}

export function taskPriorityLabel(
  value: string | null | undefined,
): string {
  return normalizeTaskPriority(value);
}

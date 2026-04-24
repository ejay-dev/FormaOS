export type GoalStatus = 'pending' | 'in_progress' | 'achieved';
export const GOAL_STATUSES: readonly GoalStatus[] = [
  'pending',
  'in_progress',
  'achieved',
] as const;

export type SupportStatus = 'pending' | 'in_progress' | 'completed';
export const SUPPORT_STATUSES: readonly SupportStatus[] = [
  'pending',
  'in_progress',
  'completed',
] as const;

export type CareGoal = {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  target_date: string | null;
  progress_percentage: number;
  created_at: string;
};

export type CareSupport = {
  id: string;
  goal_id: string | null;
  description: string;
  assigned_to: string | null;
  frequency: string | null;
  status: SupportStatus;
  created_at: string;
};

export function normalizeGoal(raw: unknown): CareGoal {
  const r = (raw ?? {}) as Record<string, unknown>;
  const status = GOAL_STATUSES.includes(r.status as GoalStatus)
    ? (r.status as GoalStatus)
    : 'pending';
  const pctRaw = Number(r.progress_percentage);
  const progress = Number.isFinite(pctRaw)
    ? Math.max(0, Math.min(100, Math.round(pctRaw)))
    : 0;
  return {
    id: String(r.id ?? crypto.randomUUID()),
    title: String(r.title ?? r.goal_text ?? 'Untitled goal'),
    description:
      typeof r.description === 'string' && r.description.length > 0
        ? r.description
        : null,
    status,
    target_date:
      typeof r.target_date === 'string' && r.target_date.length > 0
        ? r.target_date
        : null,
    progress_percentage: progress,
    created_at: String(r.created_at ?? new Date().toISOString()),
  };
}

export function normalizeSupport(raw: unknown): CareSupport {
  const r = (raw ?? {}) as Record<string, unknown>;
  const status = SUPPORT_STATUSES.includes(r.status as SupportStatus)
    ? (r.status as SupportStatus)
    : 'pending';
  return {
    id: String(r.id ?? crypto.randomUUID()),
    goal_id:
      typeof r.goal_id === 'string' && r.goal_id.length > 0 ? r.goal_id : null,
    description: String(r.description ?? ''),
    assigned_to:
      typeof r.assigned_to === 'string' && r.assigned_to.length > 0
        ? r.assigned_to
        : null,
    frequency:
      typeof r.frequency === 'string' && r.frequency.length > 0
        ? r.frequency
        : null,
    status,
    created_at: String(r.created_at ?? new Date().toISOString()),
  };
}

export function computePlanProgress(goals: CareGoal[]): number {
  if (goals.length === 0) return 0;
  const sum = goals.reduce((acc, g) => acc + (g.progress_percentage ?? 0), 0);
  return Math.round(sum / goals.length);
}

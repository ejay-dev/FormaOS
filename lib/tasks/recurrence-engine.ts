import { createSupabaseAdminClient } from '@/lib/supabase/admin';

interface RecurrencePattern {
  title: string;
  description?: string;
  frequency:
    | 'daily'
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'quarterly'
    | 'annual';
  dayOfWeek?: number;
  dayOfMonth?: number;
  assigneeId?: string;
  priority?: string;
  labels?: string[];
  nextDue: string;
}

export async function createRecurrence(
  orgId: string,
  pattern: RecurrencePattern,
) {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from('task_recurrence')
    .insert({
      org_id: orgId,
      title: pattern.title,
      description: pattern.description || null,
      frequency: pattern.frequency,
      day_of_week: pattern.dayOfWeek ?? null,
      day_of_month: pattern.dayOfMonth ?? null,
      assignee_id: pattern.assigneeId || null,
      priority: pattern.priority || 'medium',
      labels: pattern.labels || [],
      next_due: pattern.nextDue,
      active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function pauseRecurrence(id: string) {
  const db = createSupabaseAdminClient();
  await db.from('task_recurrence').update({ active: false }).eq('id', id);
}

export async function resumeRecurrence(id: string) {
  const db = createSupabaseAdminClient();
  await db.from('task_recurrence').update({ active: true }).eq('id', id);
}

export async function getUpcomingRecurrences(orgId: string, days: number = 14) {
  const db = createSupabaseAdminClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  const { data } = await db
    .from('task_recurrence')
    .select('*')
    .eq('org_id', orgId)
    .eq('active', true)
    .lte('next_due', cutoff.toISOString())
    .order('next_due', { ascending: true });

  return data || [];
}

function computeNextDue(
  current: Date,
  frequency: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
): Date {
  const next = new Date(current);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      if (dayOfMonth) next.setDate(dayOfMonth);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      if (dayOfMonth) next.setDate(dayOfMonth);
      break;
    case 'annual':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export async function processRecurringTasks() {
  const db = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: dueRecurrences } = await db
    .from('task_recurrence')
    .select('*')
    .eq('active', true)
    .lte('next_due', now);

  if (!dueRecurrences?.length) return { created: 0 };

  let created = 0;
  for (const rec of dueRecurrences) {
    // Create task instance
    await db.from('org_tasks').insert({
      organization_id: rec.org_id,
      title: rec.title,
      description: rec.description,
      assignee_id: rec.assignee_id,
      priority: rec.priority,
      due_date: rec.next_due,
      status: 'todo',
    });

    // Advance next_due
    const nextDue = computeNextDue(
      new Date(rec.next_due),
      rec.frequency,
      rec.day_of_week,
      rec.day_of_month,
    );
    await db
      .from('task_recurrence')
      .update({ next_due: nextDue.toISOString() })
      .eq('id', rec.id);
    created++;
  }

  return { created };
}

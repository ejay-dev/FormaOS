import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TaskBoard, type BoardTask } from '@/components/tasks/task-board';
import { TaskViewSwitcher } from '@/components/tasks/task-view-switcher';
import {
  isTaskOpen,
  normaliseTaskStatus,
} from '@/components/tasks/task-status';

export default async function TasksBoardPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const db = await createSupabaseServerClient();
  const { data: tasks } = await db
    .from('org_tasks')
    .select('id, title, priority, due_date, status')
    .eq('organization_id', state.organization.id)
    .order('created_at', { ascending: false });

  const allTasks: BoardTask[] = tasks || [];
  const now = Date.now();

  const overdue = allTasks.filter(
    (t) =>
      t.due_date && Date.parse(t.due_date) < now && isTaskOpen(t.status),
  ).length;

  const inProgress = allTasks.filter(
    (t) => normaliseTaskStatus(t.status) === 'in_progress',
  ).length;

  // Counted over every task, not a time window: org_tasks records no
  // completion timestamp, so "this week" would have been a guess.
  const completed = allTasks.filter(
    (t) => normaliseTaskStatus(t.status) === 'completed',
  ).length;

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <div>
          <h1 className="page-title text-foreground">Task board</h1>
          <p className="page-description">
            Drag a card to another column, or change its status on the card.
            Either way it saves straight away.
          </p>
        </div>
        <TaskViewSwitcher current="board" />
      </div>

      <div className="page-content space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total tasks', value: allTasks.length },
            { label: 'Overdue', value: overdue },
            { label: 'In progress', value: inProgress },
            { label: 'Completed', value: completed },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <TaskBoard tasks={allTasks} />
      </div>
    </div>
  );
}

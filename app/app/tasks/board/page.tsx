import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { LayoutGrid, List, Calendar } from 'lucide-react';
import Link from 'next/link';

export default async function TasksBoardPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = await createSupabaseServerClient();
  const { data: tasks } = await db
    .from('org_tasks')
    .select('*')
    .eq('organization_id', state.organization.id)
    .order('created_at', { ascending: false });

  const allTasks = tasks || [];

  // Group by status
  const columns: Record<string, typeof allTasks> = {
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
    blocked: [],
  };

  for (const task of allTasks) {
    const status = task.status || 'todo';
    // Map common status names
    const mapped =
      status === 'open' ? 'todo' : status === 'completed' ? 'done' : status;
    const col = columns[mapped] || columns.todo;
    col.push(task);
  }

  const overdue = allTasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date) < new Date() &&
      t.status !== 'done' &&
      t.status !== 'completed',
  );
  const completedThisWeek = allTasks.filter((t) => {
    if (t.status !== 'done' && t.status !== 'completed') return false;
    const updated = new Date(t.updated_at || t.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return updated >= weekAgo;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Tasks — Board View
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag tasks between columns to change status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/tasks"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            <List className="h-3 w-3" /> List
          </Link>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground">
            <LayoutGrid className="h-3 w-3" /> Board
          </span>
          <Link
            href="/app/tasks/calendar"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            <Calendar className="h-3 w-3" /> Calendar
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: allTasks.length },
          { label: 'Overdue', value: overdue.length },
          { label: 'In Progress', value: columns.in_progress.length },
          { label: 'Done This Week', value: completedThisWeek.length },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <KanbanBoard
        columns={columns}
        onMoveTask={() => {}}
        onSelectTask={() => {}}
      />
    </div>
  );
}

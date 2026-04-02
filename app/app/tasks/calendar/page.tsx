import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TaskCalendarView } from '@/components/tasks/task-calendar-view';
import { LayoutGrid, List, Calendar } from 'lucide-react';
import Link from 'next/link';

export default async function TasksCalendarPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = await createSupabaseServerClient();
  const { data: tasks } = await db
    .from('org_tasks')
    .select('id, title, priority, due_date, status')
    .eq('organization_id', state.organization.id)
    .not('due_date', 'is', null)
    .order('due_date', { ascending: true });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Tasks — Calendar View
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            See tasks organized by due date
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/tasks"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            <List className="h-3 w-3" /> List
          </Link>
          <Link
            href="/app/tasks/board"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            <LayoutGrid className="h-3 w-3" /> Board
          </Link>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground">
            <Calendar className="h-3 w-3" /> Calendar
          </span>
        </div>
      </div>

      <TaskCalendarView tasks={tasks || []} />
    </div>
  );
}

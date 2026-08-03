import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TaskCalendarView } from '@/components/tasks/task-calendar-view';
import { TaskViewSwitcher } from '@/components/tasks/task-view-switcher';

export default async function TasksCalendarPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const db = await createSupabaseServerClient();
  const { data: tasks } = await db
    .from('org_tasks')
    .select('id, title, priority, due_date, status')
    .eq('organization_id', state.organization.id)
    .not('due_date', 'is', null)
    .order('due_date', { ascending: true });

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <div>
          <h1 className="page-title text-foreground">Task calendar</h1>
          <p className="page-description">
            Tasks with a due date, by the month they fall in.
          </p>
        </div>
        <TaskViewSwitcher current="calendar" />
      </div>

      <div className="page-content">
        <TaskCalendarView tasks={tasks || []} />
      </div>
    </div>
  );
}

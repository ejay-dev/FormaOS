'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { updateTaskStatus } from '@/app/app/actions/tasks';
import { KanbanBoard, type KanbanTask } from '@/components/tasks/kanban-board';
import {
  normaliseTaskStatus,
  TASK_STATUSES,
  type TaskStatus,
} from '@/components/tasks/task-status';

export interface BoardTask {
  id: string;
  title: string;
  priority?: string | null;
  due_date?: string | null;
  status?: string | null;
}

function emptyColumns(): Record<TaskStatus, KanbanTask[]> {
  return {
    pending: [],
    in_progress: [],
    blocked: [],
    completed: [],
    cancelled: [],
  };
}

export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Only holds statuses this session has moved. The server row stays the
  // source of truth for everything else, so a refresh clears the override
  // rather than fighting it.
  const [moved, setMoved] = useState<Record<string, TaskStatus>>({});
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(() => {
    const grouped = emptyColumns();
    for (const task of tasks) {
      const status = moved[task.id] ?? normaliseTaskStatus(task.status);
      grouped[status].push({
        id: task.id,
        title: task.title,
        priority: task.priority,
        due_date: task.due_date,
        status,
      });
    }
    return grouped;
  }, [tasks, moved]);

  function handleMove(taskId: string, nextStatus: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const previous = moved[taskId] ?? normaliseTaskStatus(task.status);
    if (previous === nextStatus) return;

    setError(null);
    setMoved((current) => ({ ...current, [taskId]: nextStatus }));

    startTransition(async () => {
      const result = await updateTaskStatus(taskId, nextStatus);
      if (result.success) {
        router.refresh();
        return;
      }
      setMoved((current) => ({ ...current, [taskId]: previous }));
      setError(
        result.error || 'That change could not be saved. The card has moved back.',
      );
    });
  }

  function handleSelect(task: KanbanTask) {
    router.push(`/app/tasks?q=${encodeURIComponent(task.title)}`);
  }

  const total = TASK_STATUSES.reduce(
    (sum, key) => sum + columns[key].length,
    0,
  );

  return (
    <div className="space-y-3">
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {total === 0 ? (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No tasks yet. Add one from the list view.
        </p>
      ) : (
        <KanbanBoard
          columns={columns}
          onMoveTask={handleMove}
          onSelectTask={handleSelect}
          busy={pending}
        />
      )}
    </div>
  );
}

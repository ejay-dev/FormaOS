'use client';

import { useState } from 'react';
import { GripVertical, Calendar } from 'lucide-react';
import { SeverityBadge } from '@/components/care/severity-badge';
import {
  isTaskStatus,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from '@/components/tasks/task-status';

export interface KanbanTask {
  id: string;
  title: string;
  description?: string | null;
  priority?: string | null;
  due_date?: string | null;
  status: TaskStatus;
}

interface Props {
  columns: Record<TaskStatus, KanbanTask[]>;
  /**
   * Required, both of them: an earlier version defaulted these to no-ops and
   * the board silently discarded every drag. A caller that cannot persist a
   * move should not render this component.
   */
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onSelectTask: (task: KanbanTask) => void;
  busy?: boolean;
}

export function KanbanBoard({
  columns,
  onMoveTask,
  onSelectTask,
  busy = false,
}: Props) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnKey: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) onMoveTask(taskId, columnKey);
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const isOverdue = (dueDate?: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" aria-busy={busy}>
      {TASK_STATUSES.map((columnKey) => (
        // Drag targets have no native element, so the drop handlers sit on a
        // plain container. Every move is also reachable from the per-card
        // status control below, which keyboard and touch users need because
        // HTML5 drag events never fire for them.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          key={columnKey}
          className={`flex-shrink-0 w-72 rounded-lg border bg-card ${
            dragOverColumn === columnKey
              ? 'border-primary ring-1 ring-primary/40'
              : 'border-border'
          }`}
          onDragOver={(e) => handleDragOver(e, columnKey)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, columnKey)}
        >
          <div className="flex items-center justify-between border-b border-border p-3">
            <h2 className="text-sm font-semibold text-foreground">
              {TASK_STATUS_LABELS[columnKey]}
            </h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {(columns[columnKey] || []).length}
            </span>
          </div>
          <ul className="min-h-[200px] space-y-2 p-2">
            {(columns[columnKey] || []).map((task) => (
              <li
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className={`rounded-lg border border-border bg-background p-3 transition-colors hover:border-foreground/20 ${
                  draggedTaskId === task.id ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <GripVertical
                    className="mt-0.5 h-4 w-4 cursor-grab text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onSelectTask(task)}
                      className="block w-full truncate text-left text-sm font-medium text-foreground hover:underline"
                    >
                      {task.title}
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <SeverityBadge level={task.priority} size="sm" />
                      {task.due_date && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] ${
                            isOverdue(task.due_date)
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {new Date(task.due_date).toLocaleDateString()}
                          {isOverdue(task.due_date) ? ' overdue' : ''}
                        </span>
                      )}
                    </div>
                    <select
                      aria-label={`Status for ${task.title}`}
                      value={task.status}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (isTaskStatus(next)) onMoveTask(task.id, next);
                      }}
                      className="mt-2 h-7 w-full rounded-md border border-border bg-background px-1.5 text-[11px] text-muted-foreground"
                    >
                      {TASK_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {TASK_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

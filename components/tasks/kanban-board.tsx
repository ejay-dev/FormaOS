'use client';

import { useState } from 'react';
import { GripVertical, User, Calendar, AlertTriangle } from 'lucide-react';
import { SeverityBadge } from '@/components/care/severity-badge';

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  priority: string;
  due_date?: string;
  status: string;
}

interface Props {
  columns: Record<string, Task[]>;
  onMoveTask?: (taskId: string, newStatus: string) => void;
  onSelectTask?: (task: Task) => void;
}

const COLUMN_CONFIG: { key: string; label: string; color: string }[] = [
  { key: 'todo', label: 'To do', color: 'border-t-border' },
  { key: 'in_progress', label: 'In progress', color: 'border-t-info' },
  { key: 'in_review', label: 'In review', color: 'border-t-warning' },
  { key: 'done', label: 'Done', color: 'border-t-success' },
  { key: 'blocked', label: 'Blocked', color: 'border-t-destructive' },
];

export function KanbanBoard({
  columns,
  onMoveTask = () => {},
  onSelectTask = () => {},
}: Props) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) onMoveTask(taskId, columnKey);
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMN_CONFIG.map((col) => (
        <div
          key={col.key}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
            }
          }}
          className={`flex-shrink-0 w-72 rounded-lg border border-border bg-card border-t-4 ${col.color} ${
            dragOverColumn === col.key
              ? 'ring-2 ring-primary/50 bg-primary/5'
              : ''
          }`}
          onDragOver={(e) => handleDragOver(e, col.key)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, col.key)}
        >
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {col.label}
            </h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {(columns[col.key] || []).length}
            </span>
          </div>
          <div className="p-2 space-y-2 min-h-[200px]">
            {(columns[col.key] || []).map((task) => (
              <div
                key={task.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTask(task);
                  }
                }}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onClick={() => onSelectTask(task)}
                className={`rounded-lg border border-border bg-background p-3 cursor-pointer hover:shadow-md transition-shadow ${
                  draggedTaskId === task.id ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <SeverityBadge level={task.priority} size="sm" />
                      {task.assignee_id && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <User className="h-3 w-3" />
                        </span>
                      )}
                      {task.due_date && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] ${isOverdue(task.due_date) ? 'text-destructive' : 'text-muted-foreground'}`}
                        >
                          <Calendar className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                          {isOverdue(task.due_date) ? ' overdue' : ''}
                        </span>
                      )}
                      {col.key === 'blocked' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          Blocked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

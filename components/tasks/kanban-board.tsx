'use client';

import { useState } from 'react';
import {
  GripVertical,
  User,
  Calendar,
  AlertTriangle,
  Link2,
} from 'lucide-react';

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
  onMoveTask: (taskId: string, newStatus: string) => void;
  onSelectTask: (task: Task) => void;
}

const COLUMN_CONFIG: { key: string; label: string; color: string }[] = [
  { key: 'todo', label: 'To Do', color: 'border-t-gray-400' },
  { key: 'in_progress', label: 'In Progress', color: 'border-t-blue-500' },
  { key: 'in_review', label: 'In Review', color: 'border-t-yellow-500' },
  { key: 'done', label: 'Done', color: 'border-t-green-500' },
  { key: 'blocked', label: 'Blocked', color: 'border-t-red-500' },
];

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  medium:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function KanbanBoard({ columns, onMoveTask, onSelectTask }: Props) {
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
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.medium}`}
                      >
                        {task.priority}
                      </span>
                      {task.assignee_id && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <User className="h-3 w-3" />
                        </span>
                      )}
                      {task.due_date && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] ${isOverdue(task.due_date) ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}
                        >
                          <Calendar className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {col.key === 'blocked' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-600">
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

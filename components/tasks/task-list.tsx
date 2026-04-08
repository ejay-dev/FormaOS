'use client';

import { useState } from 'react';
import { Check, RefreshCw, Calendar, Link2 } from 'lucide-react';
// We removed the server action import for now to prevent build errors if the action is missing.
// We will mock the toggle for now.

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  is_recurring: boolean;
  evidenceCount?: number;
  /** Which compliance framework this task relates to (e.g. "SOC 2 · CC6.1") */
  framework?: string | null;
  /** The specific control reference, participant name, or source context */
  control_ref?: string | null;
  /** Care participant this task is linked to */
  participant?: string | null;
};

// ✅ CORRECT EXPORT
export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);

  const handleToggle = async (taskId: string, currentStatus: string) => {
    // 1. Optimistic Update
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    // In a real scenario, you would call the server action here.
    // await completeTask(taskId);
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
      medium: 'bg-sky-500/10 text-sky-300 border-sky-400/30',
      low: 'bg-glass-strong text-muted-foreground border-white/10',
    };
    return styles[priority] || styles.low;
  };

  return (
    <div className="bg-glass-strong border border-glass-border rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[520px] w-full text-left text-sm">
          <thead className="bg-glass-strong border-b border-glass-border text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider w-16">
                Done
              </th>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">
                Task Name
              </th>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">
                Due Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              return (
                <tr
                  key={task.id}
                  className={`group transition-all duration-200 ${isCompleted ? 'bg-glass-strong' : 'hover:bg-glass-strong'}`}
                >
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(task.id, task.status)}
                      aria-label={
                        isCompleted
                          ? 'Mark task incomplete'
                          : 'Mark task complete'
                      }
                      className={`h-6 w-6 rounded-md border flex items-center justify-center transition-all duration-200
                        ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                            : 'bg-glass-strong border-glass-border text-transparent hover:border-white/20'
                        }`}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`font-medium transition-all ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                      >
                        {task.title}
                      </span>
                      {/* Context thread — links task back to its origin */}
                      {(task.framework ||
                        task.control_ref ||
                        task.participant) && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 font-medium mt-0.5">
                          <Link2 className="h-2.5 w-2.5 shrink-0" />
                          {[task.framework, task.control_ref, task.participant]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      )}
                      {task.is_recurring && (
                        <div className="flex items-center gap-1 text-xs text-purple-300 mt-0.5 font-medium">
                          <RefreshCw className="h-3 w-3" />
                          Recurring Task
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border uppercase tracking-wide ${getPriorityBadge(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div
                      className={`flex items-center justify-end gap-2 text-xs font-medium ${isCompleted ? 'text-muted-foreground' : 'text-muted-foreground'}`}
                    >
                      {task.due_date ? (
                        <>
                          <Calendar className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

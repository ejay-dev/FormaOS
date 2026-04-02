'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  priority: string;
  due_date?: string;
  status: string;
}

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-400',
};

export function TaskCalendarView({ tasks }: { tasks: Task[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  const tasksByDate = new Map<number, Task[]>();
  for (const task of tasks) {
    if (!task.due_date) continue;
    const d = new Date(task.due_date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      const existing = tasksByDate.get(day) || [];
      existing.push(task);
      tasksByDate.set(day, existing);
    }
  }

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={prev} className="p-1 hover:bg-muted rounded">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <h3 className="text-sm font-semibold text-foreground">
          {currentDate.toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          })}
        </h3>
        <button onClick={next} className="p-1 hover:bg-muted rounded">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            className="p-2 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => (
          <div
            key={i}
            className={`min-h-[80px] p-1 border-r border-b border-border ${day === null ? 'bg-muted/20' : ''}`}
          >
            {day !== null && (
              <>
                <span
                  className={`text-xs font-medium inline-block w-6 h-6 text-center leading-6 rounded-full ${isToday(day) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                >
                  {day}
                </span>
                <div className="space-y-0.5 mt-0.5">
                  {(tasksByDate.get(day) || []).slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-1 px-1 py-0.5 rounded bg-muted/30 truncate"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority] || PRIORITY_DOT.medium}`}
                      />
                      <span className="text-[10px] text-foreground truncate">
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {(tasksByDate.get(day) || []).length > 3 && (
                    <span className="text-[10px] text-muted-foreground px-1">
                      +{(tasksByDate.get(day) || []).length - 3} more
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

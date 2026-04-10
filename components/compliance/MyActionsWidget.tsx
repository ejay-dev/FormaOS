'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';

type TaskStatus =
  | 'overdue'
  | 'due_today'
  | 'due_soon'
  | 'in_progress'
  | 'pending';

interface MyAction {
  id: string;
  title: string;
  dueDate: string;
  status: TaskStatus;
  type: 'obligation' | 'task' | 'evidence_review' | 'incident';
  entityId?: string;
  entityHref?: string;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bgColor: string }
> = {
  overdue: {
    label: 'Overdue',
    color: 'text-[var(--wire-alert)]',
    bgColor: 'bg-[var(--wire-alert)]/15 border-[var(--wire-alert)]/30',
  },
  due_today: {
    label: 'Due Today',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15 border-amber-400/30',
  },
  due_soon: {
    label: 'Due Soon',
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/10 border-amber-400/20',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-[var(--wire-action)]',
    bgColor: 'bg-[var(--wire-action)]/15 border-[var(--wire-action)]/30',
  },
  pending: {
    label: 'Pending',
    color: 'text-muted-foreground',
    bgColor: 'bg-glass-subtle border-glass-border',
  },
};

function StatusDropdown({
  currentStatus,
  onUpdate,
}: {
  currentStatus: TaskStatus;
  onUpdate: (s: TaskStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const config = STATUS_CONFIG[currentStatus];

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold ${config.bgColor} ${config.color}`}
      >
        {config.label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-glass-border bg-card p-1 shadow-xl">
          {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUpdate(s);
                setOpen(false);
              }}
              className={`w-full text-left rounded px-2 py-1.5 text-xs font-medium transition-colors hover:bg-glass-subtle ${s === currentStatus ? 'bg-glass-subtle' : ''}`}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MyActionsWidgetInner() {
  const [actions, setActions] = useState<MyAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/v1/tasks/my-actions');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (mounted) setActions(data.actions ?? []);
      } catch {
        // Fallback: empty state
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleStatusUpdate = (actionId: string, newStatus: TaskStatus) => {
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status: newStatus } : a)),
    );
    // Fire-and-forget API update
    fetch(`/api/v1/tasks/${actionId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckSquare className="h-8 w-8 text-[var(--wire-success)]" />
        <p className="text-sm text-muted-foreground">
          No pending actions — you&apos;re all caught up.
        </p>
        <Link
          href="/app/tasks"
          className="rounded-lg border border-glass-border bg-glass-subtle px-4 py-2 text-xs font-medium text-foreground hover:bg-glass-strong transition-colors"
        >
          View All Tasks
        </Link>
      </div>
    );
  }

  // Sort: overdue first, then by due date
  const sortedActions = [...actions].sort((a, b) => {
    const priority: Record<TaskStatus, number> = {
      overdue: 0,
      due_today: 1,
      due_soon: 2,
      in_progress: 3,
      pending: 4,
    };
    const pDiff = priority[a.status] - priority[b.status];
    if (pDiff !== 0) return pDiff;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="space-y-1.5">
      {sortedActions.slice(0, 8).map((action) => (
        <Link
          key={action.id}
          href={action.entityHref ?? '/app/tasks'}
          className="group flex items-center gap-3 rounded-lg border border-glass-border bg-glass-subtle px-3 py-2 transition-all hover:bg-glass-strong"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {action.title}
            </p>
            <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="font-mono">
                {new Date(action.dueDate).toLocaleDateString()}
              </span>
            </p>
          </div>
          <StatusDropdown
            currentStatus={action.status}
            onUpdate={(s) => handleStatusUpdate(action.id, s)}
          />
        </Link>
      ))}
      {actions.length > 8 && (
        <Link
          href="/app/tasks"
          className="block text-center text-xs text-muted-foreground hover:text-foreground py-2"
        >
          + {actions.length - 8} more actions
        </Link>
      )}
    </div>
  );
}

/**
 * My Actions Widget — tasks assigned to current user.
 * Sorted by urgency, inline status update.
 */
export function MyActionsWidget() {
  return (
    <ErrorBoundary name="MyActionsWidget" level="component">
      <div className="rounded-xl border border-glass-border bg-glass-subtle p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-foreground/70" />
            <h3 className="text-sm font-semibold">My Actions</h3>
          </div>
          <Link
            href="/app/tasks"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <MyActionsWidgetInner />
      </div>
    </ErrorBoundary>
  );
}

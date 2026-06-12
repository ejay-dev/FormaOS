'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckSquare, ChevronDown, Clock } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMyActions,
  useMyActionsMeta,
  useMyActionsStore,
  type MyActionStatus,
} from '@/lib/stores/my-actions';

const STATUS_CONFIG: Record<
  MyActionStatus,
  { label: string; color: string; bgColor: string }
> = {
  overdue: {
    label: 'Overdue',
    color: 'text-[var(--wire-alert)]',
    bgColor: 'bg-[var(--wire-alert)]/15 border-[var(--wire-alert)]/30',
  },
  due_today: {
    label: 'Due Today',
    color: 'text-warning',
    bgColor: 'bg-warning/15 border-warning/30',
  },
  due_soon: {
    label: 'Due Soon',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/20',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-[var(--wire-action)]',
    bgColor: 'bg-[var(--wire-action)]/15 border-[var(--wire-action)]/30',
  },
  pending: {
    label: 'Pending',
    color: 'text-muted-foreground',
    bgColor: 'bg-surface-1 border-border',
  },
};

function StatusDropdown({
  currentStatus,
  onUpdate,
}: {
  currentStatus: MyActionStatus;
  onUpdate: (s: MyActionStatus) => void;
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
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold ${config.bgColor} ${config.color}`}
      >
        {config.label}
        <ChevronDown className="h-3 w-3" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-popover p-1 shadow-xl"
        >
          {(Object.keys(STATUS_CONFIG) as MyActionStatus[]).map((s) => (
            <button
              key={s}
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUpdate(s);
                setOpen(false);
              }}
              className={`w-full text-left rounded px-2 py-1.5 text-xs font-medium transition-colors hover:bg-surface-1 ${s === currentStatus ? 'bg-surface-1' : ''}`}
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
  const actions = useMyActions();
  const { isLoading, hasLoadedOnce, error } = useMyActionsMeta();
  const fetchActions = useMyActionsStore((s) => s.fetch);
  const updateStatus = useMyActionsStore((s) => s.updateStatus);

  useEffect(() => {
    const controller = new AbortController();
    fetchActions({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchActions]);

  if (!hasLoadedOnce && isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error && !hasLoadedOnce) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load actions.
        </p>
        <button
          type="button"
          onClick={() => fetchActions({ force: true })}
          className="rounded-md border border-border px-2 py-0.5 text-xs font-semibold text-foreground"
        >
          Retry
        </button>
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
          className="inline-flex min-h-[44px] md:min-h-0 items-center justify-center rounded-lg border border-border bg-surface-1 px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-2 transition-colors"
        >
          View All Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {actions.slice(0, 8).map((action) => (
        <Link
          key={action.id}
          href={action.entityHref ?? '/app/tasks'}
          className="group flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-3 py-2 transition-all hover:bg-surface-2"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {action.title}
            </p>
            <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden />
              <span className="font-mono">
                {new Date(action.dueDate).toLocaleDateString()}
              </span>
            </p>
          </div>
          <StatusDropdown
            currentStatus={action.status}
            onUpdate={(s) => updateStatus(action.id, s)}
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
 * My Actions Widget — shares data with NextActionsStrip via `useMyActionsStore`.
 * Inline status updates are optimistic and propagate across every consumer.
 */
export function MyActionsWidget() {
  return (
    <ErrorBoundary name="MyActionsWidget" level="component">
      <div className="rounded-xl border border-border bg-surface-1 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-foreground/70" />
            <h3 className="text-sm font-semibold">My Actions</h3>
          </div>
          <Link
            href="/app/tasks"
            className="inline-flex min-h-[44px] md:min-h-0 items-center px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <MyActionsWidgetInner />
      </div>
    </ErrorBoundary>
  );
}

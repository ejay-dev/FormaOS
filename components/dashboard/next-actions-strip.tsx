'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ClipboardList,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  useMyActions,
  useMyActionsMeta,
  useMyActionsStore,
  type MyAction,
  type MyActionStatus,
} from '@/lib/stores/my-actions';

const STATUS_LABEL: Record<MyActionStatus, string> = {
  overdue: 'Overdue',
  due_today: 'Due today',
  due_soon: 'Due soon',
  in_progress: 'In progress',
  pending: 'Pending',
};

const STATUS_PILL: Record<MyActionStatus, string> = {
  overdue:
    'bg-rose-500/15 text-rose-400 ring-rose-500/30 dark:text-rose-300',
  due_today:
    'bg-amber-500/15 text-amber-500 ring-amber-500/30 dark:text-amber-300',
  due_soon:
    'bg-amber-500/10 text-amber-500 ring-amber-500/25 dark:text-amber-300',
  in_progress:
    'bg-[hsl(var(--app-primary))]/15 text-[hsl(var(--app-primary))] ring-[hsl(var(--app-primary))]/30',
  pending: 'bg-muted/50 text-muted-foreground ring-border',
};

function formatRelative(iso: string): string {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return '—';
  const deltaMs = target.getTime() - Date.now();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.round(deltaMs / day);
  if (days < -1) return `${Math.abs(days)}d overdue`;
  if (days === -1) return 'yesterday';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days <= 7) return `in ${days}d`;
  return target.toLocaleDateString();
}

function trackStripEvent(event: string, payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const g = (window as unknown as { gtag?: (...args: unknown[]) => void })
    .gtag;
  if (typeof g !== 'function') return;
  g('event', event, { surface: 'next_actions_strip', ...payload });
}

function NextActionsStripInner() {
  const actions = useMyActions();
  const { isLoading, hasLoadedOnce, error } = useMyActionsMeta();
  const fetchActions = useMyActionsStore((s) => s.fetch);
  const updateStatus = useMyActionsStore((s) => s.updateStatus);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    fetchActions({ signal: controller.signal });

    const onFocus = () => fetchActions();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchActions();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      controller.abort();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchActions]);

  const topThree: MyAction[] = useMemo(
    () => actions.slice(0, 3),
    [actions],
  );

  const overdueCount = useMemo(
    () => topThree.filter((a) => a.status === 'overdue').length,
    [topThree],
  );

  const handleComplete = useCallback(
    async (e: React.MouseEvent, action: MyAction) => {
      e.preventDefault();
      e.stopPropagation();
      setPendingId(action.id);
      trackStripEvent('action_quick_complete_attempt', {
        action_id: action.id,
        status: action.status,
      });
      const ok = await updateStatus(action.id, 'in_progress');
      trackStripEvent(
        ok ? 'action_quick_complete_success' : 'action_quick_complete_failure',
        { action_id: action.id },
      );
      setPendingId(null);
    },
    [updateStatus],
  );

  const handleOpen = useCallback((action: MyAction) => {
    trackStripEvent('action_opened', {
      action_id: action.id,
      status: action.status,
    });
  }, []);

  if (error && !hasLoadedOnce) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-[hsl(var(--card))] px-4 py-3"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            Couldn&apos;t load your actions.
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => fetchActions({ force: true })}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-[hsl(var(--card))] px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-[hsl(var(--app-primary))]/50"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!hasLoadedOnce && isLoading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading your next actions"
        aria-live="polite"
        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="h-[76px] animate-pulse rounded-lg border border-border bg-[hsl(var(--card))]"
          />
        ))}
      </div>
    );
  }

  if (topThree.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-[hsl(var(--card))] px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            No assigned actions — you&apos;re caught up.
          </p>
        </div>
        <Link
          href="/app/tasks"
          className="inline-flex min-h-[44px] md:min-h-0 items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Browse tasks
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <section aria-label="Your next actions" data-testid="next-actions-strip">
      <header className="mb-1.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/85">
            Your next {topThree.length} action{topThree.length === 1 ? '' : 's'}
          </h2>
          {overdueCount > 0 && (
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 ring-1 ring-inset ring-rose-500/30 dark:text-rose-300"
            >
              <AlertTriangle className="h-2.5 w-2.5" aria-hidden />
              {overdueCount} overdue
            </span>
          )}
        </div>
        <Link
          href="/app/tasks"
          onClick={() => trackStripEvent('view_all_clicked', {})}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </header>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {topThree.map((a) => {
          const href = a.entityHref ?? '/app/tasks';
          const isPending = pendingId === a.id;
          const canQuickAdvance =
            a.status !== 'in_progress' && a.status !== 'pending';
          const dueLabel = formatRelative(a.dueDate);
          return (
            <li key={a.id}>
              <Link
                href={href}
                onClick={() => handleOpen(a)}
                aria-label={`${a.title} — ${STATUS_LABEL[a.status]}, due ${dueLabel}`}
                className="group flex h-full min-w-0 flex-col justify-between gap-2 rounded-lg border border-border bg-[hsl(var(--card))] px-3 py-2.5 transition-colors hover:border-[hsl(var(--app-primary))]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--app-primary))]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium text-foreground">
                    {a.title}
                  </p>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
                      STATUS_PILL[a.status],
                    )}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden />
                      {dueLabel}
                    </span>
                    {a.frameworkCode && (
                      <>
                        <span aria-hidden className="text-border">·</span>
                        <span className="truncate font-mono text-[10px] uppercase tracking-wide">
                          {a.frameworkCode}
                        </span>
                      </>
                    )}
                    {a.ownerName && (
                      <>
                        <span aria-hidden className="text-border">·</span>
                        <span className="truncate">{a.ownerName}</span>
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {canQuickAdvance && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={(e) => handleComplete(e, a)}
                        aria-label={`Mark "${a.title}" as in progress`}
                        className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-[hsl(var(--card))] px-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-[hsl(var(--app-primary))]/50 hover:text-foreground disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" aria-hidden />
                        {isPending ? '…' : 'Start'}
                      </button>
                    )}
                    <ArrowRight
                      className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function NextActionsStrip() {
  return (
    <ErrorBoundary name="NextActionsStrip" level="component">
      <NextActionsStripInner />
    </ErrorBoundary>
  );
}

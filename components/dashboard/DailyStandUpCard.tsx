'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sunrise,
  ArrowRight,
  CheckCircle2,
  Clock,
  Trophy,
} from 'lucide-react';

type Action = {
  id: string;
  title: string;
  dueDate: string | null;
  kind: 'task' | 'incident' | 'renewal';
  href: string;
};

type Win = {
  id: string;
  label: string;
  completedAt: string;
};

type Deadline = {
  id: string;
  label: string;
  dueDate: string;
  daysAway: number;
  href: string;
};

interface StandUpData {
  actions: Action[];
  wins: Win[];
  deadline: Deadline | null;
}

export function DailyStandUpCard() {
  const [data, setData] = useState<StandUpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/v1/dashboard/stand-up');
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Silently hide on error — don't block the dashboard
  if (error) return null;

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 rounded bg-surface-2" />
          <div className="h-4 w-48 rounded bg-surface-2" />
        </div>
        <div className="space-y-3">
          <div className="h-3 w-full rounded bg-surface-1" />
          <div className="h-3 w-3/4 rounded bg-surface-1" />
          <div className="h-3 w-2/3 rounded bg-surface-1" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { actions, wins, deadline } = data;
  const isEmpty = actions.length === 0 && wins.length === 0 && !deadline;
  if (isEmpty) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sunrise className="h-5 w-5 text-[var(--wire-action)]" />
        <h2 className="text-sm font-semibold">Your day at a glance</h2>
      </div>

      <div className="space-y-4">
        {/* Actions Section */}
        <div>
          {actions.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-[var(--wire-success)]">
              <CheckCircle2 className="h-4 w-4" />
              <span>You&rsquo;re clear for today. Nicely done.</span>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {actions.length === 1
                  ? '1 thing to tackle today'
                  : `${actions.length} things to tackle today`}
              </p>
              <ul className="space-y-1.5">
                {actions.map((action) => (
                  <li key={action.id}>
                    <Link
                      href={action.href}
                      className="group flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-surface-1 transition-colors"
                    >
                      <span className="truncate">{action.title}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 ml-3">
                        {action.dueDate && (
                          <span>
                            {formatDueLabel(action.dueDate)}
                          </span>
                        )}
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Divider */}
        {wins.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-[var(--wire-success)]" />
                This week you&hellip;
              </p>
              <ul className="space-y-1">
                {wins.map((win) => (
                  <li
                    key={win.id}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--wire-success)] shrink-0" />
                    <span className="truncate">{win.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Deadline */}
        {deadline && (
          <>
            <div className="border-t border-border" />
            <div>
              <Link
                href={deadline.href}
                className="group flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-surface-1 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>
                    Heads up &mdash;{' '}
                    <span className="font-medium">{deadline.label}</span>{' '}
                    lands in{' '}
                    <span className="font-medium">
                      {deadline.daysAway === 0
                        ? 'today'
                        : deadline.daysAway === 1
                          ? 'tomorrow'
                          : `${deadline.daysAway} days`}
                    </span>
                    .
                  </span>
                </span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatDueLabel(dateStr: string): string {
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86_400_000);

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Tomorrow';
  return `${diffDays}d`;
}

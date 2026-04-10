'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Bell, FileText } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import type { RAGStatus } from '@/lib/stores/compliance';

interface DeadlineItem {
  id: string;
  title: string;
  dueDate: string;
  type: 'obligation' | 'incident_notification' | 'audit' | 'certification';
  urgency: RAGStatus;
  regulatoryBody?: string;
  href?: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  obligation: FileText,
  incident_notification: Bell,
  audit: Calendar,
  certification: Clock,
};

const URGENCY_STYLES: Record<
  RAGStatus,
  { dot: string; text: string; border: string }
> = {
  red: {
    dot: 'bg-[var(--wire-alert)]',
    text: 'text-[var(--wire-alert)]',
    border: 'border-l-[var(--wire-alert)]',
  },
  amber: {
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    border: 'border-l-amber-400',
  },
  green: {
    dot: 'bg-[var(--wire-success)]',
    text: 'text-[var(--wire-success)]',
    border: 'border-l-[var(--wire-success)]',
  },
};

/** Regulatory notification deadlines by industry */
const _REGULATORY_DEADLINES: Record<
  string,
  { label: string; hours: number }[]
> = {
  ndis: [
    { label: 'NDIS Reportable Incident', hours: 24 },
    { label: 'SIRS Priority', hours: 24 },
    { label: 'SIRS Standard', hours: 120 },
  ],
  aged_care: [
    { label: 'SIRS Priority', hours: 24 },
    { label: 'SIRS Standard', hours: 120 },
  ],
  healthcare: [
    { label: 'SafeWork Serious Incident', hours: 48 },
    { label: 'AHPRA Adverse Event', hours: 72 },
  ],
  childcare: [{ label: 'Mandatory Reporting', hours: 24 }],
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatRelativeDate(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-AU', {
    month: 'short',
    day: 'numeric',
  });
}

function DeadlinesInner() {
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/v1/compliance/deadlines?days=30');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (mounted) setDeadlines(data.deadlines ?? []);
      } catch {
        // empty state
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Calendar className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No upcoming deadlines in the next 30 days.
        </p>
      </div>
    );
  }

  // Group by week
  const sorted = [...deadlines].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  return (
    <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
      {sorted.map((d) => {
        const Icon = TYPE_ICONS[d.type] ?? FileText;
        const style = URGENCY_STYLES[d.urgency];
        const days = daysUntil(d.dueDate);

        return (
          <Link
            key={d.id}
            href={d.href ?? '/app/compliance'}
            className={`group flex items-center gap-3 rounded-lg border border-glass-border border-l-2 bg-glass-subtle px-3 py-2 transition-all hover:bg-glass-strong ${style.border}`}
          >
            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {d.title}
              </p>
              {d.regulatoryBody && (
                <p className="text-[10px] text-muted-foreground/70">
                  {d.regulatoryBody}
                </p>
              )}
            </div>
            <span
              className={`text-xs font-mono font-bold shrink-0 ${days <= 0 ? style.text : days <= 3 ? 'text-amber-400' : 'text-muted-foreground'}`}
            >
              {formatRelativeDate(d.dueDate)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Upcoming Deadlines Timeline — 30-day rolling view
 * with regulatory notification deadlines prominently displayed.
 */
export function UpcomingDeadlinesWidget() {
  return (
    <ErrorBoundary name="UpcomingDeadlinesWidget" level="component">
      <div className="rounded-xl border border-glass-border bg-glass-subtle p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-foreground/70" />
            <h3 className="text-sm font-semibold">Upcoming Deadlines</h3>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Next 30 days
          </span>
        </div>
        <DeadlinesInner />
      </div>
    </ErrorBoundary>
  );
}

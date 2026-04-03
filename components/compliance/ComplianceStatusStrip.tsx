'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import {
  useComplianceStore,
  useComplianceSummary,
} from '@/lib/stores/compliance';

/**
 * Persistent compliance status strip shown under the topbar.
 * Shows Overdue | Due Soon | Completed counts — clickable to filter.
 */
export function ComplianceStatusStrip() {
  const summary = useComplianceSummary();
  const fetchSummary = useComplianceStore((s) => s.fetchSummary);
  const isLoading = useComplianceStore((s) => s.isLoading);
  const router = useRouter();

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 120_000); // refresh every 2 min
    return () => clearInterval(interval);
  }, [fetchSummary]);

  const items = [
    {
      label: 'Overdue',
      count: summary.overdue,
      icon: AlertTriangle,
      color: 'text-[var(--wire-alert)]',
      bg: 'hover:bg-[var(--wire-alert)]/10',
      filter: 'overdue',
    },
    {
      label: 'Due Soon',
      count: summary.dueSoon,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'hover:bg-amber-500/10',
      filter: 'due_soon',
    },
    {
      label: 'Completed',
      count: summary.completed,
      icon: CheckCircle2,
      color: 'text-[var(--wire-success)]',
      bg: 'hover:bg-[var(--wire-success)]/10',
      filter: 'completed',
    },
  ] as const;

  return (
    <div className="flex items-center gap-1 border-b border-glass-border bg-card/50 backdrop-blur-sm px-4 py-1.5">
      <div className="flex items-center gap-3 text-xs">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() =>
                router.push(`/app/compliance?status=${item.filter}`)
              }
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors ${item.bg}`}
            >
              <Icon className={`h-3 w-3 ${item.color}`} />
              <span className={`font-mono font-bold ${item.color}`}>
                {isLoading ? '—' : item.count}
              </span>
              <span className="text-muted-foreground">{item.label}</span>
            </button>
          );
        })}
        {summary.total > 0 && (
          <span className="ml-2 text-muted-foreground/60 border-l border-glass-border pl-3">
            <span className="font-mono font-semibold text-foreground/70">
              {summary.completionPercentage}%
            </span>{' '}
            complete
          </span>
        )}
      </div>
    </div>
  );
}

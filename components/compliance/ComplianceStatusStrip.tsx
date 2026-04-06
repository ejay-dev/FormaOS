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
    <div className="hidden lg:flex items-center gap-2 text-xs">
      {items.map((item) => {
        return (
          <button
            key={item.label}
            onClick={() =>
              router.push(`/app/compliance?status=${item.filter}`)
            }
            className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors ${item.bg}`}
          >
            <span className={`text-[10px] ${item.color}`}>●</span>
            <span className={`font-mono font-bold ${item.color}`}>
              {isLoading ? '—' : item.count}
            </span>
            <span className="text-muted-foreground">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

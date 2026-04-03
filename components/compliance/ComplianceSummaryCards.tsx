'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  useComplianceStore,
  useComplianceSummary,
} from '@/lib/stores/compliance';
import { ErrorBoundary } from '@/components/ui/error-boundary';

function CompletionRing({ percentage }: { percentage: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color =
    percentage >= 80
      ? 'var(--wire-success)'
      : percentage >= 50
        ? '#f59e0b'
        : 'var(--wire-alert)';

  return (
    <div className="relative flex items-center justify-center h-12 w-12">
      <svg className="transform -rotate-90 h-full w-full" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-glass-border"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className="absolute text-[10px] font-mono font-bold"
        style={{ color }}
      >
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

function SummaryCardInner({
  label,
  value,
  icon: Icon,
  color,
  href,
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  href: string;
  isLoading: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-glass-border bg-glass-subtle p-3 transition-all hover:bg-glass-strong hover:border-glass-border-strong"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-glass-border"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </p>
        <p
          className="text-xl font-bold font-mono leading-tight"
          style={{ color }}
        >
          {isLoading ? '—' : value}
        </p>
      </div>
    </Link>
  );
}

/**
 * Summary Cards Row — top of dashboard.
 * Total Obligations | Overdue (red) | Due This Week (amber) | Completed (green) | Completion %
 */
export function ComplianceSummaryCards() {
  const summary = useComplianceSummary();
  const fetchSummary = useComplianceStore((s) => s.fetchSummary);
  const isLoading = useComplianceStore((s) => s.isLoading);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <ErrorBoundary name="ComplianceSummaryCards" level="component">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <SummaryCardInner
          label="Total Obligations"
          value={summary.total}
          icon={Target}
          color="var(--wire-action)"
          href="/app/compliance"
          isLoading={isLoading}
        />
        <SummaryCardInner
          label="Overdue"
          value={summary.overdue}
          icon={AlertTriangle}
          color="var(--wire-alert)"
          href="/app/compliance?status=overdue"
          isLoading={isLoading}
        />
        <SummaryCardInner
          label="Due This Week"
          value={summary.dueSoon}
          icon={Clock}
          color="#f59e0b"
          href="/app/compliance?status=due_soon"
          isLoading={isLoading}
        />
        <SummaryCardInner
          label="Completed"
          value={summary.completed}
          icon={CheckCircle2}
          color="var(--wire-success)"
          href="/app/compliance?status=completed"
          isLoading={isLoading}
        />
        <div className="flex items-center justify-center rounded-xl border border-glass-border bg-glass-subtle p-3">
          <CompletionRing percentage={summary.completionPercentage} />
        </div>
      </div>
    </ErrorBoundary>
  );
}

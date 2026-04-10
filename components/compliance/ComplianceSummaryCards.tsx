'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Target,
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
  color: _color,
  href,
  isLoading,
  ragClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  href: string;
  isLoading: boolean;
  ragClass?: string;
}) {
  return (
    <Link
      href={href}
      className={`metric-card transition-all hover:shadow-sm ${ragClass || ''}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold leading-tight">
        {isLoading ? '—' : value}
      </p>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCardInner
          label="Total Obligations"
          value={summary.total}
          icon={Target}
          color="var(--wire-action)"
          href="/app/compliance"
          isLoading={isLoading}
          ragClass="metric-card-neutral"
        />
        <SummaryCardInner
          label="Overdue"
          value={summary.overdue}
          icon={AlertTriangle}
          color="var(--wire-alert)"
          href="/app/compliance?status=overdue"
          isLoading={isLoading}
          ragClass="metric-card-danger"
        />
        <SummaryCardInner
          label="Due This Week"
          value={summary.dueSoon}
          icon={Clock}
          color="#f59e0b"
          href="/app/compliance?status=due_soon"
          isLoading={isLoading}
          ragClass="metric-card-warning"
        />
        <SummaryCardInner
          label="Completed"
          value={summary.completed}
          icon={CheckCircle2}
          color="var(--wire-success)"
          href="/app/compliance?status=completed"
          isLoading={isLoading}
          ragClass="metric-card-success"
        />
        <div className="metric-card items-center justify-center">
          <CompletionRing percentage={summary.completionPercentage} />
        </div>
      </div>
    </ErrorBoundary>
  );
}

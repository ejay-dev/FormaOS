'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

/**
 * Industry-specific regulatory notification deadlines (hours).
 */
const INDUSTRY_DEADLINES: Record<string, Record<string, number>> = {
  ndis: {
    reportable: 24,
    sirs_priority: 24,
    sirs_standard: 120, // 5 days
  },
  aged_care: {
    sirs_priority: 24,
    sirs_standard: 120,
  },
  healthcare: {
    safework_serious: 48,
    ahpra_adverse: 72,
  },
  childcare: {
    mandatory_reporting: 24,
  },
};

interface RegulatoryCountdownProps {
  /** When the incident was created/reported */
  incidentCreatedAt: string;
  /** Organization industry */
  industry: string;
  /** Type of notification — maps to INDUSTRY_DEADLINES keys */
  notificationType: string;
  /** Whether notification has been submitted */
  submitted?: boolean;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0h 0m';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    return `${days}d ${remainHours}h`;
  }
  return `${hours}h ${minutes}m`;
}

function CountdownInner({
  incidentCreatedAt,
  industry,
  notificationType,
  submitted,
}: RegulatoryCountdownProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000); // update every minute
    return () => clearInterval(interval);
  }, []);

  const deadlineHours = INDUSTRY_DEADLINES[industry]?.[notificationType];
  if (!deadlineHours) return null;

  const createdAt = new Date(incidentCreatedAt).getTime();
  const deadlineMs = createdAt + deadlineHours * 60 * 60 * 1000;
  const remaining = deadlineMs - now;
  const isOverdue = remaining <= 0;
  const isCritical = remaining > 0 && remaining <= 2 * 60 * 60 * 1000; // < 2 hours
  const percentage = Math.max(
    0,
    Math.min(
      100,
      ((deadlineHours * 60 * 60 * 1000 - Math.max(0, remaining)) /
        (deadlineHours * 60 * 60 * 1000)) *
        100,
    ),
  );

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--wire-success)]/20 bg-[var(--wire-success)]/5 px-3 py-2">
        <div className="h-2 w-2 rounded-full bg-[var(--wire-success)]" />
        <span className="text-xs font-medium text-[var(--wire-success)]">
          Notification submitted
        </span>
      </div>
    );
  }

  const bgColor = isOverdue
    ? 'border-[var(--wire-alert)]/30 bg-[var(--wire-alert)]/5'
    : isCritical
      ? 'border-[var(--wire-alert)]/20 bg-[var(--wire-alert)]/5 animate-pulse'
      : 'border-amber-400/20 bg-amber-500/5';

  const textColor =
    isOverdue || isCritical ? 'text-[var(--wire-alert)]' : 'text-amber-400';

  const barColor = isOverdue
    ? 'bg-[var(--wire-alert)]'
    : isCritical
      ? 'bg-[var(--wire-alert)]'
      : 'bg-amber-400';

  return (
    <div className={`rounded-lg border px-3 py-2 ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOverdue ? (
            <AlertTriangle className={`h-4 w-4 ${textColor}`} />
          ) : (
            <Clock className={`h-4 w-4 ${textColor}`} />
          )}
          <span className="text-xs font-medium text-foreground">
            {notificationType
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        </div>
        <span className={`text-sm font-mono font-bold ${textColor}`}>
          {isOverdue
            ? `OVERDUE by ${formatCountdown(Math.abs(remaining))}`
            : formatCountdown(remaining)}
        </span>
      </div>

      {/* Progress bar showing time elapsed */}
      <div className="mt-2 h-1.5 w-full rounded-full bg-glass-strong">
        <div
          className={`h-1.5 rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Deadline: {deadlineHours}h from incident</span>
        {isCritical && !isOverdue && (
          <span className="text-[var(--wire-alert)] font-semibold">
            ⚠ Under 2 hours remaining
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Regulatory Countdown Timer — auto-calculates notification deadline
 * based on industry and shows countdown. Turns red when < 2 hours.
 */
export function RegulatoryCountdown(props: RegulatoryCountdownProps) {
  return (
    <ErrorBoundary name="RegulatoryCountdown" level="component">
      <CountdownInner {...props} />
    </ErrorBoundary>
  );
}

/**
 * Multi-countdown for an incident — shows all applicable regulatory deadlines.
 */
export function IncidentRegulatoryCountdowns({
  incidentCreatedAt,
  industry,
  submittedNotifications = [],
}: {
  incidentCreatedAt: string;
  industry: string;
  submittedNotifications?: string[];
}) {
  const deadlines = INDUSTRY_DEADLINES[industry];
  if (!deadlines) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Regulatory Deadlines
      </h4>
      {Object.keys(deadlines).map((type) => (
        <RegulatoryCountdown
          key={type}
          incidentCreatedAt={incidentCreatedAt}
          industry={industry}
          notificationType={type}
          submitted={submittedNotifications.includes(type)}
        />
      ))}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Scale,
  AlertTriangle,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DashboardSectionCard } from '@/components/dashboard/unified-dashboard-layout';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface Breach {
  id: string;
  breach_id: string;
  description: string;
  detected_date: string;
  reported_to_asic: boolean;
  reported_date: string | null;
  days_open: number;
  status: 'detected' | 'assessed' | 'reported' | 'closed';
}

const STATUS_COLORS: Record<string, string> = {
  detected:
    'bg-[var(--wire-alert)]/15 text-[var(--wire-alert)] border-[var(--wire-alert)]/30',
  assessed: 'bg-amber-500/15 text-amber-400 border-amber-400/30',
  reported:
    'bg-[var(--wire-action)]/15 text-[var(--wire-action)] border-[var(--wire-action)]/30',
  closed:
    'bg-[var(--wire-success)]/15 text-[var(--wire-success)] border-[var(--wire-success)]/30',
};

const STATUS_PIPELINE = ['detected', 'assessed', 'reported', 'closed'] as const;

function BreachReportForm({
  breach,
  onClose,
}: {
  breach: Breach;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/v1/registers/breach/' + breach.id + '/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breach_id: breach.breach_id,
          regulation: 's912D Corporations Act 2001',
          action: 'self-report',
        }),
      });
    } catch {
      console.warn('Failed to submit breach report');
    }
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <h4 className="text-sm font-semibold">Self-Report to ASIC (s912D)</h4>
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Breach ID:</strong> {breach.breach_id}
        </p>
        <p>
          <strong>Description:</strong> {breach.description}
        </p>
        <p>
          <strong>Detected:</strong> {breach.detected_date}
        </p>
        <p>
          <strong>Regulation:</strong> s912D Corporations Act 2001
        </p>
        <p>
          <strong>Reporting Obligation:</strong> Report significant breaches
          within 30 calendar days of becoming aware.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--wire-action)] px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-3 w-3" />
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-xs hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function BreachRegisterWidget() {
  const [breaches, setBreaches] = useState<Breach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportingBreachId, setReportingBreachId] = useState<string | null>(
    null,
  );
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/v1/registers/breach')
      .then((r) => (r.ok ? r.json() : { breaches: [] }))
      .then((data) => {
        if (mounted) setBreaches(data.breaches ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const openBreaches = breaches.filter((b) => b.status !== 'closed');
  const displayBreaches = expanded ? breaches : breaches.slice(0, 5);

  return (
    <ErrorBoundary name="BreachRegisterWidget" level="component">
      <DashboardSectionCard
        title="Breach Register"
        description="ASIC breach reporting pipeline (s912D)"
        icon={Scale}
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-full rounded bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : breaches.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No breaches recorded.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary metric */}
            <div className="flex gap-3">
              <div className="flex-1 rounded-lg border border-border p-2 text-center">
                <p className="text-lg font-bold font-mono text-[var(--wire-alert)]">
                  {openBreaches.length}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Open Breaches
                </p>
              </div>
              <div className="flex-1 rounded-lg border border-border p-2 text-center">
                <p className="text-lg font-bold font-mono">{breaches.length}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
            </div>

            {/* Breach table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 pr-2">ID</th>
                    <th className="text-left py-2 pr-2">Description</th>
                    <th className="text-left py-2 pr-2">Detected</th>
                    <th className="text-left py-2 pr-2">Days Open</th>
                    <th className="text-left py-2 pr-2">Status</th>
                    <th className="text-right py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayBreaches.map((breach) => (
                    <tr key={breach.id} className="border-b border-border/50">
                      <td className="py-2 pr-2 font-mono text-muted-foreground">
                        {breach.breach_id}
                      </td>
                      <td className="py-2 pr-2 max-w-[200px] truncate">
                        {breach.description}
                      </td>
                      <td className="py-2 pr-2 text-muted-foreground">
                        {breach.detected_date}
                      </td>
                      <td className="py-2 pr-2">
                        <span
                          className={
                            breach.days_open > 20
                              ? 'text-[var(--wire-alert)] font-semibold'
                              : ''
                          }
                        >
                          {breach.days_open}d
                        </span>
                      </td>
                      <td className="py-2 pr-2">
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[breach.status] ?? ''}
                        >
                          {breach.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-right">
                        {breach.status !== 'reported' &&
                          breach.status !== 'closed' && (
                            <button
                              type="button"
                              onClick={() =>
                                setReportingBreachId(
                                  reportingBreachId === breach.id
                                    ? null
                                    : breach.id,
                                )
                              }
                              className="inline-flex items-center gap-1 text-[var(--wire-action)] hover:underline"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Report
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inline report form */}
            {reportingBreachId && (
              <BreachReportForm
                breach={breaches.find((b) => b.id === reportingBreachId)!}
                onClose={() => setReportingBreachId(null)}
              />
            )}

            {/* Expand/collapse */}
            {breaches.length > 5 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto"
              >
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {expanded ? 'Show less' : `Show all ${breaches.length}`}
              </button>
            )}
          </div>
        )}
      </DashboardSectionCard>
    </ErrorBoundary>
  );
}

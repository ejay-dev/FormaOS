'use client';

import { useState, useEffect } from 'react';
import { Activity, Settings } from 'lucide-react';
import Link from 'next/link';
import { DashboardSectionCard } from '@/components/dashboard/unified-dashboard-layout';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface MonitoringData {
  alertsTriggered: number;
  lastReviewDate: string | null;
  nextReviewDue: string | null;
}

export function TransactionMonitoringWidget() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/v1/compliance/transaction-monitoring')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (mounted) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const hasData = data && (data.alertsTriggered > 0 || data.lastReviewDate);

  return (
    <ErrorBoundary name="TransactionMonitoringWidget" level="component">
      <DashboardSectionCard
        title="Transaction Monitoring"
        description="AML/CTF monitoring overview"
        icon={Activity}
      >
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-full rounded bg-muted animate-pulse" />
            <div className="h-8 w-full rounded bg-muted animate-pulse" />
          </div>
        ) : !hasData ? (
          <div className="text-center py-4 space-y-2">
            <Settings className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Configure AML/CTF thresholds in Settings
            </p>
            <Link
              href="/app/settings"
              className="inline-block text-xs text-[var(--wire-action)] hover:underline"
            >
              Go to Settings
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center rounded-lg border border-border p-3">
                <p className="text-xl font-bold font-mono">
                  {data.alertsTriggered}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Alerts Triggered
                </p>
              </div>
              <div className="text-center rounded-lg border border-border p-3">
                <p className="text-xs font-medium">
                  {data.lastReviewDate
                    ? new Date(data.lastReviewDate).toLocaleDateString(
                        'en-AU',
                        { month: 'short', day: 'numeric' },
                      )
                    : '\u2014'}
                </p>
                <p className="text-[10px] text-muted-foreground">Last Review</p>
              </div>
              <div className="text-center rounded-lg border border-border p-3">
                <p className="text-xs font-medium">
                  {data.nextReviewDue
                    ? new Date(data.nextReviewDue).toLocaleDateString('en-AU', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '\u2014'}
                </p>
                <p className="text-[10px] text-muted-foreground">Next Review</p>
              </div>
            </div>
            <Link
              href="/app/compliance"
              className="block text-center text-xs text-[var(--wire-action)] hover:underline"
            >
              View full compliance details
            </Link>
          </div>
        )}
      </DashboardSectionCard>
    </ErrorBoundary>
  );
}

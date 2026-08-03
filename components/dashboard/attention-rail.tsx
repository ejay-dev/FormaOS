'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Clock,
  Shield,
} from 'lucide-react';
import { DashboardSectionCard } from '@/components/dashboard/unified-dashboard-layout';
import {
  useComplianceStore,
  useComplianceSummary,
} from '@/lib/stores/compliance';

export type ActionPriority = 'critical' | 'high' | 'normal';

export interface ActionQueueItem {
  id: string;
  title: string;
  detail: string;
  href: string;
  icon: typeof CheckSquare;
  priority: ActionPriority;
}

export function PriorityActionQueue({ items }: { items: ActionQueueItem[] }) {
  const label: Record<ActionPriority, string> = {
    critical: 'Critical',
    high: 'High',
    normal: 'Normal',
  };

  // Every row is derived from a live count, so an empty queue means there is
  // genuinely nothing outstanding — rendering an empty card would invent work.
  if (items.length === 0) return null;

  return (
    <DashboardSectionCard
      title="Needs action"
      description="Derived from your current tasks, credentials, and readiness score"
      icon={AlertCircle}
    >
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent/30"
          >
            <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {item.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {item.detail}
              </p>
            </div>
            <span
              className={`status-pill ${item.priority === 'critical' ? 'status-pill-red' : item.priority === 'high' ? 'status-pill-amber' : 'status-pill-blue'}`}
            >
              {label[item.priority]}
            </span>
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </DashboardSectionCard>
  );
}

export function MobileReadinessCheckpoint({
  complianceScore,
  openTasksCount,
  expiringCertsCount,
}: {
  complianceScore: number;
  openTasksCount: number;
  expiringCertsCount: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 lg:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Readiness checkpoint
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            One-screen status before you dive into workflows.
          </p>
        </div>
        <Shield className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-border bg-surface-1 px-2 py-3">
          <p className="text-lg font-bold tabular-nums text-foreground">
            {complianceScore}%
          </p>
          <p className="text-xs text-muted-foreground">Score</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 px-2 py-3">
          <p className="text-lg font-bold tabular-nums text-foreground">{openTasksCount}</p>
          <p className="text-xs text-muted-foreground">Open tasks</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 px-2 py-3">
          <p className="text-lg font-bold tabular-nums text-foreground">
            {expiringCertsCount}
          </p>
          <p className="text-xs text-muted-foreground">Expiring</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/app/tasks"
          className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs font-medium text-foreground/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Tasks
        </Link>
        <Link
          href="/app/vault/review"
          className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs font-medium text-foreground/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Evidence review
        </Link>
        <Link
          href="/app/audit-trail"
          className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs font-medium text-foreground/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Audit trail
        </Link>
      </div>
    </div>
  );
}

/**
 * AttentionRail — an honest rail driven by live compliance summary.
 *
 * - Consumes `useComplianceSummary()` (same source as the topbar counters)
 *   so the rail can never contradict other UI.
 * - Shows nothing until data has loaded at least once — avoids the old
 *   "All clear" false positive that showed on uninitialized state.
 * - When truly clear, renders a subtle confirmation pill that references
 *   the checked signals (overdue, due soon, cert expiry). When there are
 *   signals, renders urgency-sorted tiles.
 */
export function AttentionRail({
  complianceScore,
  openTasksCount: openTasksCountProp,
  expiringCertsCount,
}: {
  complianceScore: number;
  openTasksCount: number;
  expiringCertsCount: number;
}) {
  const summary = useComplianceSummary();
  const lastFetched = useComplianceStore((s) => s.lastFetched);
  const fetchSummary = useComplianceStore((s) => s.fetchSummary);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  type AttentionItem = {
    id: string;
    label: string;
    sublabel: string;
    href: string;
    urgency: 'critical' | 'warning';
    icon: React.ElementType;
  };

  const liveReady = lastFetched !== null;
  // Prefer live overdue count, fall back to prop-derived count only when live
  // data is genuinely unavailable (SSR, store reset). Never mix signals.
  const overdueCount = liveReady ? summary.overdue : 0;
  const dueSoonCount = liveReady ? summary.dueSoon : 0;
  const openCount = liveReady
    ? Math.max(0, summary.total - summary.completed)
    : openTasksCountProp;

  const items: AttentionItem[] = [];

  if (overdueCount > 0) {
    items.push({
      id: 'overdue',
      label: `${overdueCount} overdue obligation${overdueCount === 1 ? '' : 's'}`,
      sublabel: 'Past SLA — resolve first',
      href: '/app/tasks?filter=overdue',
      urgency: 'critical',
      icon: AlertTriangle,
    });
  }

  if (dueSoonCount > 0) {
    items.push({
      id: 'due-soon',
      label: `${dueSoonCount} due this week`,
      sublabel: 'Review & assign owners',
      href: '/app/tasks?filter=due_soon',
      urgency: dueSoonCount > 5 ? 'critical' : 'warning',
      icon: Clock,
    });
  }

  if (expiringCertsCount > 0) {
    items.push({
      id: 'certs',
      label: `${expiringCertsCount} certification${expiringCertsCount === 1 ? '' : 's'} expiring`,
      sublabel: 'Renew before validity lapses',
      href: '/app/certificates',
      urgency: expiringCertsCount > 3 ? 'critical' : 'warning',
      icon: Clock,
    });
  }

  if (complianceScore > 0 && complianceScore < 70) {
    items.push({
      id: 'score',
      label: `${complianceScore}% readiness`,
      sublabel: 'Below audit threshold',
      href: '/app/reports',
      urgency: complianceScore < 50 ? 'critical' : 'warning',
      icon: AlertTriangle,
    });
  }

  // Don't render anything until we have real data — prevents flicker of
  // "all clear" before the first fetch resolves.
  if (!liveReady && items.length === 0) {
    return null;
  }

  if (items.length === 0) {
    const parts: string[] = [];
    if (liveReady) {
      parts.push(`${openCount} open`);
      parts.push(`0 overdue`);
      parts.push(`0 due this week`);
    }
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1"
      >
        <CheckCircle2
          className="h-3.5 w-3.5 shrink-0 text-success"
          aria-hidden
        />
        <p className="text-[12px] font-medium text-success">
          No critical signals
          {parts.length > 0 && (
            <span className="ml-1.5 text-muted-foreground">
              · {parts.join(' · ')}
            </span>
          )}
        </p>
      </div>
    );
  }

  const urgencyStyles: Record<AttentionItem['urgency'], string> = {
    critical: 'border-destructive/20 bg-destructive/10 hover:bg-destructive/15',
    warning: 'border-warning/20 bg-warning/10 hover:bg-warning/15',
  };

  const urgencyIconColor: Record<AttentionItem['urgency'], string> = {
    critical: 'text-destructive',
    warning: 'text-warning',
  };

  const urgencyLabelColor: Record<AttentionItem['urgency'], string> = {
    critical: 'text-destructive',
    warning: 'text-warning',
  };

  return (
    <section aria-label="Needs your attention" className="space-y-1.5">
      <p className="px-1 text-sm font-medium text-muted-foreground">
        Needs your attention
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.slice(0, 3).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] ${urgencyStyles[item.urgency]}`}
            >
              <Icon
                className={`h-3.5 w-3.5 shrink-0 ${urgencyIconColor[item.urgency]}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${urgencyLabelColor[item.urgency]}`}
                >
                  {item.label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.sublabel}
                </p>
              </div>
              <ArrowRight
                className="h-3 w-3 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

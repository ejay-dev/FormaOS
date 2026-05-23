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
  ownerLabel?: string;
  slaLabel?: string;
}

export function PriorityActionQueue({ items }: { items: ActionQueueItem[] }) {
  const label: Record<ActionPriority, string> = {
    critical: 'Critical',
    high: 'High',
    normal: 'Normal',
  };

  return (
    <DashboardSectionCard
      title="Operator Action Queue"
      description="Owner-routed actions with explicit SLAs to improve readiness now"
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
              <p className="text-sm font-medium text-foreground truncate">
                {item.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {item.ownerLabel && (
                  <span className="text-[10px] text-muted-foreground">
                    {item.ownerLabel}
                  </span>
                )}
                {item.slaLabel && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    SLA {item.slaLabel}
                  </span>
                )}
              </div>
            </div>
            <span
              className={`status-pill ${item.priority === 'critical' ? 'status-pill-red' : item.priority === 'high' ? 'status-pill-amber' : 'status-pill-blue'}`}
            >
              {label[item.priority]}
            </span>
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
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
    <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 lg:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-200">
            Readiness Checkpoint
          </p>
          <p className="mt-1 text-sm text-foreground">
            One-screen status before you dive into workflows.
          </p>
        </div>
        <Shield className="h-5 w-5 text-cyan-300" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-glass-border bg-glass-subtle px-2 py-3">
          <p className="text-lg font-bold text-foreground">
            {complianceScore}%
          </p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Score
          </p>
        </div>
        <div className="rounded-lg border border-glass-border bg-glass-subtle px-2 py-3">
          <p className="text-lg font-bold text-foreground">{openTasksCount}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Open Tasks
          </p>
        </div>
        <div className="rounded-lg border border-glass-border bg-glass-subtle px-2 py-3">
          <p className="text-lg font-bold text-foreground">
            {expiringCertsCount}
          </p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Expiring
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/app/tasks"
          className="rounded-lg border border-glass-border-strong bg-glass-subtle px-3 py-1.5 text-xs font-medium text-foreground/90"
        >
          Tasks
        </Link>
        <Link
          href="/app/vault/review"
          className="rounded-lg border border-glass-border-strong bg-glass-subtle px-3 py-1.5 text-xs font-medium text-foreground/90"
        >
          Evidence Review
        </Link>
        <Link
          href="/app/audit-trail"
          className="rounded-lg border border-glass-border-strong bg-glass-subtle px-3 py-1.5 text-xs font-medium text-foreground/90"
        >
          Audit Stream
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
        className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-3 py-1"
      >
        <CheckCircle2
          className="h-3.5 w-3.5 shrink-0 text-emerald-400"
          aria-hidden
        />
        <p className="text-[12px] font-medium text-emerald-300">
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
    critical: 'border-rose-400/30 bg-rose-500/10 hover:bg-rose-500/15',
    warning: 'border-amber-400/25 bg-amber-500/10 hover:bg-amber-500/15',
  };

  const urgencyIconColor: Record<AttentionItem['urgency'], string> = {
    critical: 'text-rose-400',
    warning: 'text-amber-400',
  };

  const urgencyLabelColor: Record<AttentionItem['urgency'], string> = {
    critical: 'text-rose-300',
    warning: 'text-amber-300',
  };

  return (
    <section aria-label="Needs your attention" className="space-y-1.5">
      <p className="px-1 text-xs font-medium uppercase tracking-widest text-muted-foreground/80">
        Needs your attention
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.slice(0, 3).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--app-primary))]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] ${urgencyStyles[item.urgency]}`}
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

'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  ArrowRight,
  AlertTriangle,
  Shield,
  Clock,
} from 'lucide-react';
import { DashboardSectionCard } from '@/components/dashboard/unified-dashboard-layout';

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
          href="/app/audit"
          className="rounded-lg border border-glass-border-strong bg-glass-subtle px-3 py-1.5 text-xs font-medium text-foreground/90"
        >
          Audit Stream
        </Link>
      </div>
    </div>
  );
}

export function AttentionRail({
  complianceScore,
  openTasksCount,
  expiringCertsCount,
}: {
  complianceScore: number;
  openTasksCount: number;
  expiringCertsCount: number;
}) {
  type AttentionItem = {
    id: string;
    label: string;
    sublabel: string;
    href: string;
    urgency: 'critical' | 'warning' | 'ok';
    icon: React.ElementType;
  };

  const items: AttentionItem[] = [];

  if (openTasksCount > 0) {
    items.push({
      id: 'tasks',
      label: `${openTasksCount} open task${openTasksCount !== 1 ? 's' : ''}`,
      sublabel:
        openTasksCount > 5 ? 'Needs immediate attention' : 'Review & assign',
      href: '/app/tasks',
      urgency: openTasksCount > 10 ? 'critical' : 'warning',
      icon: CheckSquare,
    });
  }

  if (expiringCertsCount > 0) {
    items.push({
      id: 'certs',
      label: `${expiringCertsCount} expiring soon`,
      sublabel: 'Certifications & credentials',
      href: '/app/certificates',
      urgency: expiringCertsCount > 3 ? 'critical' : 'warning',
      icon: Clock,
    });
  }

  if (complianceScore < 70 && complianceScore > 0) {
    items.push({
      id: 'score',
      label: `${complianceScore}% compliance score`,
      sublabel: 'Below target threshold',
      href: '/app/reports',
      urgency: complianceScore < 50 ? 'critical' : 'warning',
      icon: AlertTriangle,
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/5 px-3 py-2">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
        <p className="text-sm font-medium text-emerald-300">
          All clear — no immediate action required.
        </p>
      </div>
    );
  }

  const urgencyStyles = {
    critical: 'border-rose-400/30 bg-rose-500/10 hover:bg-rose-500/15',
    warning: 'border-amber-400/25 bg-amber-500/10 hover:bg-amber-500/15',
    ok: 'border-glass-border bg-glass-subtle hover:bg-glass-strong',
  };

  const urgencyIconColor = {
    critical: 'text-rose-400',
    warning: 'text-amber-400',
    ok: 'text-emerald-400',
  };

  const urgencyLabelColor = {
    critical: 'text-rose-300',
    warning: 'text-amber-300',
    ok: 'text-foreground',
  };

  return (
    <div className="space-y-1.5">
      <p className="px-1 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
        Needs your attention
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-all duration-200 ${urgencyStyles[item.urgency]}`}
            >
              <Icon
                className={`h-3.5 w-3.5 shrink-0 ${urgencyIconColor[item.urgency]}`}
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
              <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

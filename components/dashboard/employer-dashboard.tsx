'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Briefcase,
  FileText,
  Building2,
  Shield,
  CreditCard,
  Settings,
  CheckSquare,
  ArrowRight,
  HeartPulse,
  Home,
  Baby,
  UserCheck,
  NotebookPen,
  AlertTriangle,
  Lock,
  ClipboardList,
  Landmark,
  Laptop,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { DashboardSectionCard } from '@/components/dashboard/unified-dashboard-layout';
import { GettingStartedChecklist } from '@/components/onboarding/GettingStartedChecklist';
import { SystemStatusPanel } from '@/components/trust/SystemStatusPanel';
import { ComplianceIntelligenceSummary } from '@/components/intelligence/ComplianceIntelligenceSummary';
import { FrameworkHealthWidget } from '@/components/intelligence/FrameworkHealthWidget';
import { AIComplianceAssistantPanel } from '@/components/intelligence/AIComplianceAssistantPanel';
import { ComplianceScoreHistory } from '@/components/compliance/ComplianceScoreHistory';
import { IndustryGuidancePanel } from '@/components/dashboard/IndustryGuidancePanel';
import { ComplianceSummaryCards } from '@/components/compliance/ComplianceSummaryCards';
import { MyActionsWidget } from '@/components/compliance/MyActionsWidget';
import { UpcomingDeadlinesWidget } from '@/components/compliance/UpcomingDeadlinesWidget';
import {
  NDISWorkerScreeningWidget,
  NDISParticipantSnapshot,
  NDISSIRSTrackerWidget,
  HealthcarePractitionerWidget,
  HealthcareNSQHSWidget,
  AgedCareCarePlanWidget,
  AgedCareStarRatingWidget,
  ChildcareEducatorCredentialsWidget,
  ChildcareNQFWidget,
  FinancialBreachRegisterWidget,
  FinancialBoardReportButton,
} from '@/components/dashboard/industry-widgets';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import type { ChecklistCompletionCounts } from '@/lib/onboarding/industry-checklists';
import {
  getCachedProgress,
  setCachedProgress,
} from '@/lib/onboarding/progress-persistence';
import {
  trackCustomMetric,
  trackCacheEvent,
  trackAPIRequest,
  CUSTOM_METRICS,
} from '@/lib/monitoring/performance-monitor';

/**
 * Quick-action cards — industry-specific shortcuts so users
 * jump to the most relevant areas for their vertical.
 */
interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

const INDUSTRY_QUICK_ACTIONS: Record<string, QuickAction[]> = {
  ndis: [
    {
      label: 'Participants',
      description: 'Manage participant records',
      href: '/app/participants',
      icon: Users,
      color: 'text-purple-400',
    },
    {
      label: 'Service Delivery',
      description: 'Visits & service logs',
      href: '/app/visits',
      icon: Calendar,
      color: 'text-cyan-400',
    },
    {
      label: 'Incidents',
      description: 'Report & investigate',
      href: '/app/incidents',
      icon: AlertTriangle,
      color: 'text-rose-400',
    },
    {
      label: 'Staff Compliance',
      description: 'Worker screening & checks',
      href: '/app/staff-compliance',
      icon: UserCheck,
      color: 'text-emerald-400',
    },
    {
      label: 'Progress Notes',
      description: 'Participant progress',
      href: '/app/progress-notes',
      icon: NotebookPen,
      color: 'text-blue-400',
    },
    {
      label: 'Evidence Vault',
      description: 'Evidence submissions',
      href: '/app/vault',
      icon: Lock,
      color: 'text-amber-400',
    },
    {
      label: 'Reports',
      description: 'Compliance reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-sky-400',
    },
    {
      label: 'Settings',
      description: 'Organization settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  healthcare: [
    {
      label: 'Patients',
      description: 'Patient records & status',
      href: '/app/participants',
      icon: HeartPulse,
      color: 'text-rose-400',
    },
    {
      label: 'Appointments',
      description: 'Schedule & track',
      href: '/app/visits',
      icon: Calendar,
      color: 'text-cyan-400',
    },
    {
      label: 'Clinical Notes',
      description: 'Clinical documentation',
      href: '/app/progress-notes',
      icon: NotebookPen,
      color: 'text-blue-400',
    },
    {
      label: 'Staff Credentials',
      description: 'AHPRA & registrations',
      href: '/app/staff-compliance',
      icon: UserCheck,
      color: 'text-emerald-400',
    },
    {
      label: 'Incidents',
      description: 'Clinical incidents',
      href: '/app/incidents',
      icon: AlertTriangle,
      color: 'text-amber-400',
    },
    {
      label: 'Evidence Vault',
      description: 'Evidence & artifacts',
      href: '/app/vault',
      icon: Lock,
      color: 'text-purple-400',
    },
    {
      label: 'Reports',
      description: 'Accreditation reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-sky-400',
    },
    {
      label: 'Settings',
      description: 'Practice settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  aged_care: [
    {
      label: 'Residents',
      description: 'Resident records',
      href: '/app/participants',
      icon: Home,
      color: 'text-rose-400',
    },
    {
      label: 'Care Plans',
      description: 'Care plan management',
      href: '/app/care-plans',
      icon: FileText,
      color: 'text-cyan-400',
    },
    {
      label: 'Service Logs',
      description: 'Daily service logs',
      href: '/app/visits',
      icon: Calendar,
      color: 'text-blue-400',
    },
    {
      label: 'Incidents',
      description: 'SIRS reporting',
      href: '/app/incidents',
      icon: AlertTriangle,
      color: 'text-amber-400',
    },
    {
      label: 'Staff Compliance',
      description: 'Staff credentials',
      href: '/app/staff-compliance',
      icon: UserCheck,
      color: 'text-emerald-400',
    },
    {
      label: 'Progress Notes',
      description: 'Resident notes',
      href: '/app/progress-notes',
      icon: NotebookPen,
      color: 'text-purple-400',
    },
    {
      label: 'Evidence Vault',
      description: 'Audit evidence',
      href: '/app/vault',
      icon: Lock,
      color: 'text-sky-400',
    },
    {
      label: 'Settings',
      description: 'Facility settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  childcare: [
    {
      label: 'Children',
      description: 'Enrollment & records',
      href: '/app/participants',
      icon: Baby,
      color: 'text-amber-400',
    },
    {
      label: 'Safety Checks',
      description: 'Daily safety inspections',
      href: '/app/registers',
      icon: Shield,
      color: 'text-rose-400',
    },
    {
      label: 'Educator Compliance',
      description: 'WWCC & qualifications',
      href: '/app/staff-compliance',
      icon: UserCheck,
      color: 'text-emerald-400',
    },
    {
      label: 'Incidents',
      description: 'Incident reports',
      href: '/app/incidents',
      icon: AlertTriangle,
      color: 'text-purple-400',
    },
    {
      label: 'Progress Notes',
      description: 'Developmental notes',
      href: '/app/progress-notes',
      icon: NotebookPen,
      color: 'text-blue-400',
    },
    {
      label: 'Evidence Vault',
      description: 'NQF evidence',
      href: '/app/vault',
      icon: Lock,
      color: 'text-cyan-400',
    },
    {
      label: 'Reports',
      description: 'Quality reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-sky-400',
    },
    {
      label: 'Settings',
      description: 'Center settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  community_services: [
    {
      label: 'Clients',
      description: 'Client records',
      href: '/app/participants',
      icon: Users,
      color: 'text-purple-400',
    },
    {
      label: 'Service Delivery',
      description: 'Service sessions',
      href: '/app/visits',
      icon: Calendar,
      color: 'text-cyan-400',
    },
    {
      label: 'Incidents',
      description: 'Report incidents',
      href: '/app/incidents',
      icon: AlertTriangle,
      color: 'text-rose-400',
    },
    {
      label: 'Staff Compliance',
      description: 'Staff checks',
      href: '/app/staff-compliance',
      icon: UserCheck,
      color: 'text-emerald-400',
    },
    {
      label: 'Evidence Vault',
      description: 'Compliance evidence',
      href: '/app/vault',
      icon: Lock,
      color: 'text-amber-400',
    },
    {
      label: 'Tasks',
      description: 'Compliance tasks',
      href: '/app/tasks',
      icon: CheckSquare,
      color: 'text-blue-400',
    },
    {
      label: 'Reports',
      description: 'Funding reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-sky-400',
    },
    {
      label: 'Settings',
      description: 'Organization settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  financial_services: [
    {
      label: 'Organization',
      description: 'Overview & KPIs',
      href: '/app/executive',
      icon: Landmark,
      color: 'text-blue-400',
    },
    {
      label: 'Policies',
      description: 'Regulatory policies',
      href: '/app/policies',
      icon: FileText,
      color: 'text-cyan-400',
    },
    {
      label: 'Risk Registers',
      description: 'Risk & asset registers',
      href: '/app/registers',
      icon: ClipboardList,
      color: 'text-emerald-400',
    },
    {
      label: 'Tasks',
      description: 'Compliance tasks',
      href: '/app/tasks',
      icon: CheckSquare,
      color: 'text-amber-400',
    },
    {
      label: 'Evidence Vault',
      description: 'Audit evidence',
      href: '/app/vault',
      icon: Lock,
      color: 'text-purple-400',
    },
    {
      label: 'Team',
      description: 'Manage team',
      href: '/app/team',
      icon: Users,
      color: 'text-rose-400',
    },
    {
      label: 'Reports',
      description: 'Compliance reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-sky-400',
    },
    {
      label: 'Settings',
      description: 'Organization settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  saas_technology: [
    {
      label: 'Organization',
      description: 'Overview & KPIs',
      href: '/app/executive',
      icon: Building2,
      color: 'text-blue-400',
    },
    {
      label: 'Policies',
      description: 'SOC 2 / ISO policies',
      href: '/app/policies',
      icon: FileText,
      color: 'text-cyan-400',
    },
    {
      label: 'Asset Inventory',
      description: 'Asset & risk registers',
      href: '/app/registers',
      icon: Laptop,
      color: 'text-emerald-400',
    },
    {
      label: 'Control Tasks',
      description: 'Security controls',
      href: '/app/tasks',
      icon: CheckSquare,
      color: 'text-amber-400',
    },
    {
      label: 'Evidence Vault',
      description: 'Audit artifacts',
      href: '/app/vault',
      icon: Lock,
      color: 'text-purple-400',
    },
    {
      label: 'Team',
      description: 'Manage team',
      href: '/app/team',
      icon: Users,
      color: 'text-rose-400',
    },
    {
      label: 'Reports',
      description: 'Framework reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-sky-400',
    },
    {
      label: 'Settings',
      description: 'Organization settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  enterprise: [
    {
      label: 'Organization',
      description: 'Multi-site overview',
      href: '/app/executive',
      icon: Building2,
      color: 'text-blue-400',
    },
    {
      label: 'Policies',
      description: 'Enterprise policies',
      href: '/app/policies',
      icon: FileText,
      color: 'text-cyan-400',
    },
    {
      label: 'Registers',
      description: 'All registers',
      href: '/app/registers',
      icon: ClipboardList,
      color: 'text-emerald-400',
    },
    {
      label: 'Tasks',
      description: 'Task management',
      href: '/app/tasks',
      icon: CheckSquare,
      color: 'text-amber-400',
    },
    {
      label: 'Evidence Vault',
      description: 'Evidence chain',
      href: '/app/vault',
      icon: Lock,
      color: 'text-purple-400',
    },
    {
      label: 'Team',
      description: 'Workforce management',
      href: '/app/team',
      icon: Users,
      color: 'text-rose-400',
    },
    {
      label: 'Reports',
      description: 'Executive reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-sky-400',
    },
    {
      label: 'Settings',
      description: 'Enterprise settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
};

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Organization',
    description: 'Overview & KPIs',
    href: '/app/executive',
    icon: Building2,
    color: 'text-blue-400',
  },
  {
    label: 'Team',
    description: 'Manage employees',
    href: '/app/team',
    icon: Users,
    color: 'text-cyan-400',
  },
  {
    label: 'Certificates',
    description: 'All certifications',
    href: '/app/certificates',
    icon: FileText,
    color: 'text-emerald-400',
  },
  {
    label: 'Evidence',
    description: 'Evidence submissions',
    href: '/app/vault',
    icon: CheckSquare,
    color: 'text-purple-400',
  },
  {
    label: 'Tasks',
    description: 'Create & assign',
    href: '/app/tasks',
    icon: Briefcase,
    color: 'text-amber-400',
  },
  {
    label: 'Audit Logs',
    description: 'Activity history',
    href: '/app/audit',
    icon: Shield,
    color: 'text-rose-400',
  },
  {
    label: 'Billing',
    description: 'Plan & subscription',
    href: '/app/billing',
    icon: CreditCard,
    color: 'text-sky-400',
  },
  {
    label: 'Settings',
    description: 'Organization settings',
    href: '/app/settings',
    icon: Settings,
    color: 'text-muted-foreground',
  },
];

function QuickActions({ industry }: { industry?: string | null }) {
  const actions =
    (industry && INDUSTRY_QUICK_ACTIONS[industry]) || DEFAULT_QUICK_ACTIONS;
  return (
    <div
      className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3"
      data-testid="quick-actions"
    >
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href}
            href={a.href}
            className="group flex flex-col gap-2 rounded-xl border border-glass-border bg-glass-subtle p-3.5 sm:p-4 transition-all hover:bg-glass-strong hover:border-glass-border-strong"
          >
            <Icon
              className={`h-5 w-5 ${a.color} transition-transform group-hover:scale-110`}
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{a.label}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {a.description}
              </p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 ml-auto mt-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        );
      })}
    </div>
  );
}

function MobileReadinessCheckpoint({
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

/**
 * =========================================================
 * EMPLOYER DASHBOARD SECTIONS
 * =========================================================
 * Sections only visible to owner/admin roles
 * Shows organization-wide compliance data and team management
 */

interface EmployerDashboardProps {
  organizationId: string;
  organizationName: string;
  industry?: string | null;
  teamMemberCount?: number;
  complianceScore?: number;
  expiringCertsCount?: number;
  openTasksCount?: number;
}

type ActionPriority = 'critical' | 'high' | 'normal';

interface ActionQueueItem {
  id: string;
  title: string;
  detail: string;
  href: string;
  icon: typeof CheckSquare;
  priority: ActionPriority;
  ownerLabel?: string;
  slaLabel?: string;
}

interface ActivationMilestone {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  href: string;
}

function PriorityActionQueue({ items }: { items: ActionQueueItem[] }) {
  const badgeClass: Record<ActionPriority, string> = {
    critical: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
    high: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    normal: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
  };

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
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex flex-col gap-3 rounded-xl border border-glass-border bg-glass-subtle px-4 py-3 transition-colors hover:bg-glass-strong sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-glass-border bg-white/5">
                <item.icon className="h-4 w-4 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
                {(item.ownerLabel || item.slaLabel) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {item.ownerLabel && (
                      <span className="rounded-full border border-glass-border bg-glass-subtle px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                        Owner: {item.ownerLabel}
                      </span>
                    )}
                    {item.slaLabel && (
                      <span className="rounded-full border border-glass-border bg-glass-subtle px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                        SLA: {item.slaLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span
                className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-wider ${badgeClass[item.priority]}`}
              >
                {label[item.priority]}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </DashboardSectionCard>
  );
}

function ActivationMilestones({
  milestones,
  loading,
}: {
  milestones: ActivationMilestone[];
  loading: boolean;
}) {
  const completed = milestones.filter((m) => m.done).length;
  const progress = milestones.length
    ? Math.round((completed / milestones.length) * 100)
    : 0;

  return (
    <DashboardSectionCard
      title="Activation Progress"
      description="Milestone-driven path from setup to first defensible proof"
      icon={TrendingUp}
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`loading-${idx}`}
              className="h-16 animate-pulse rounded-xl border border-glass-border bg-white/5"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-200">
              Time-To-First-Proof Tracker
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-glass-strong">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-foreground/70">
              {completed} of {milestones.length} milestones completed
            </p>
          </div>

          <div className="space-y-3">
            {milestones.map((milestone) => (
              <Link
                key={milestone.id}
                href={milestone.href}
                className="group flex items-start justify-between gap-3 rounded-xl border border-glass-border bg-glass-subtle px-4 py-3 transition-colors hover:bg-glass-strong"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                      milestone.done
                        ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                        : 'border-slate-500/40 bg-slate-700/20 text-foreground/70'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {milestone.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {milestone.detail}
                    </p>
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </>
      )}
    </DashboardSectionCard>
  );
}

/**
 * Organization health overview
 */
/**
 * Industry-specific label helpers for KPIs and action queues
 */
function getExpiryLabel(industry?: string | null): string {
  switch (industry) {
    case 'ndis':
      return 'Screening Expiry';
    case 'healthcare':
      return 'Registration Expiry';
    case 'childcare':
      return 'WWCC Expiry';
    case 'aged_care':
      return 'Credential Expiry';
    case 'saas_technology':
      return 'Cert Expiry';
    default:
      return 'Expiring Soon';
  }
}

function getEntityLabel(industry?: string | null): string {
  switch (industry) {
    case 'ndis':
      return 'participant compliance';
    case 'healthcare':
      return 'clinical';
    case 'aged_care':
      return 'resident care';
    case 'childcare':
      return 'child safety';
    case 'community_services':
      return 'client service';
    case 'financial_services':
      return 'regulatory';
    case 'saas_technology':
      return 'security control';
    case 'enterprise':
      return 'enterprise compliance';
    default:
      return 'control';
  }
}

function getTasksLabel(industry?: string | null): string {
  switch (industry) {
    case 'ndis':
      return 'Compliance Tasks';
    case 'healthcare':
      return 'Clinical Tasks';
    case 'aged_care':
      return 'Care Tasks';
    case 'childcare':
      return 'Safety Tasks';
    case 'community_services':
      return 'Service Tasks';
    case 'financial_services':
      return 'Regulatory Tasks';
    case 'saas_technology':
      return 'Control Tasks';
    case 'enterprise':
      return 'Governance Tasks';
    default:
      return 'Open Tasks';
  }
}

export function OrgHealthOverview({
  industry,
  teamMemberCount = 0,
  complianceScore = 0,
  expiringCertsCount = 0,
  openTasksCount = 0,
}: {
  industry?: string | null;
  teamMemberCount: number;
  complianceScore: number;
  expiringCertsCount: number;
  openTasksCount: number;
}) {
  const expiryLabel = getExpiryLabel(industry);
  const tasksLabel = getTasksLabel(industry);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      <div className="rounded-xl border border-glass-border bg-glass-subtle p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Team Members</p>
            <p className="text-2xl sm:text-3xl font-bold">{teamMemberCount}</p>
          </div>
          <Users className="h-8 w-8 text-blue-400" />
        </div>
      </div>

      <div className="rounded-xl border border-glass-border bg-glass-subtle p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Compliance Score</p>
            <p className="text-2xl sm:text-3xl font-bold">{complianceScore}%</p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-400" />
        </div>
      </div>

      <div className="rounded-xl border border-glass-border bg-glass-subtle p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{expiryLabel}</p>
            <p className="text-2xl sm:text-3xl font-bold">
              {expiringCertsCount}
            </p>
          </div>
          <AlertCircle className="h-8 w-8 text-amber-400" />
        </div>
      </div>

      <div className="rounded-xl border border-glass-border bg-glass-subtle p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{tasksLabel}</p>
            <p className="text-2xl sm:text-3xl font-bold">{openTasksCount}</p>
          </div>
          <CheckCircle2 className="h-8 w-8 text-purple-400" />
        </div>
      </div>
    </div>
  );
}

/**
 * Team compliance overview table
 */
export function TeamComplianceTable({
  members = [],
}: {
  members?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    complianceScore: number;
    lastAction?: string;
  }>;
}) {
  return (
    <DashboardSectionCard
      title="Team Compliance"
      description="View employee compliance status and assignments"
      icon={Users}
    >
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="min-w-[480px] sm:min-w-[520px] w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Employee</th>
              <th className="px-4 py-2 text-left font-semibold">Role</th>
              <th className="px-4 py-2 text-center font-semibold">
                Compliance
              </th>
              <th className="px-4 py-2 text-left font-semibold">Last Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-4 text-center text-muted-foreground"
                >
                  No team members yet. Invite your first employee.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-glass-subtle transition-colors"
                >
                  <td className="px-4 py-2">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-2 capitalize">
                    <span className="inline-block px-2 py-1 rounded bg-slate-700/50 text-xs">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-2 w-16 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${member.complianceScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold">
                        {member.complianceScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {member.lastAction || 'Never'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardSectionCard>
  );
}

/**
 * Certificates & Licenses expiry table
 */
export function CertificatesExpiry({
  certificates = [],
}: {
  certificates?: Array<{
    id: string;
    title: string;
    employee: string;
    expiresAt: string;
    status: 'active' | 'expiring_soon' | 'expired';
  }>;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'expiring_soon':
        return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
      case 'expired':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      default:
        return 'bg-slate-500/20 text-foreground/70';
    }
  };

  return (
    <DashboardSectionCard
      title="Certificates & Licenses"
      description="Track organization-wide certifications"
      icon={FileText}
    >
      <div className="space-y-3">
        {certificates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No certificates tracked yet.
          </p>
        ) : (
          certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center justify-between p-3 rounded-lg bg-glass-subtle border border-white/10"
            >
              <div className="flex-1">
                <p className="font-medium">{cert.title}</p>
                <p className="text-xs text-muted-foreground">{cert.employee}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm">{cert.expiresAt}</p>
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold border ${getStatusColor(
                    cert.status,
                  )}`}
                >
                  {cert.status === 'active'
                    ? 'Active'
                    : cert.status === 'expiring_soon'
                      ? 'Expiring Soon'
                      : 'Expired'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardSectionCard>
  );
}

/**
 * Evidence submissions review
 */
export function EvidenceReview({
  submissions = [],
}: {
  submissions?: Array<{
    id: string;
    title: string;
    submittedBy: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'approved':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      default:
        return 'bg-slate-500/20 text-foreground/70';
    }
  };

  return (
    <DashboardSectionCard
      title="Evidence Submissions"
      description="Review and approve employee evidence"
      icon={CheckCircle2}
    >
      <div className="space-y-3">
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending submissions.
          </p>
        ) : (
          submissions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between p-3 rounded-lg bg-glass-subtle border border-white/10"
            >
              <div className="flex-1">
                <p className="font-medium">{sub.title}</p>
                <p className="text-xs text-muted-foreground">
                  {sub.submittedBy} • {sub.submittedAt}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {sub.status === 'pending' && (
                  <>
                    <button className="px-3 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors">
                      Approve
                    </button>
                    <button className="px-3 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors">
                      Reject
                    </button>
                  </>
                )}
                {sub.status !== 'pending' && (
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold border ${getStatusColor(
                      sub.status,
                    )}`}
                  >
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardSectionCard>
  );
}

/**
 * Task management
 */
export function TaskManagement({
  tasks = [],
}: {
  tasks?: Array<{
    id: string;
    title: string;
    assignedTo: string;
    dueAt: string;
    completionRate: number;
  }>;
}) {
  return (
    <DashboardSectionCard
      title="Tasks & Assignments"
      description="Create and track team tasks"
      icon={Briefcase}
    >
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active tasks.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 rounded-lg bg-glass-subtle border border-white/10"
            >
              <div className="flex-1">
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  Assigned to: {task.assignedTo} • Due: {task.dueAt}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold mb-1">
                  {task.completionRate}% Complete
                </div>
                <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${task.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardSectionCard>
  );
}

/**
 * Audit activity log
 */
export function AuditActivityLog({
  activities = [],
}: {
  activities?: Array<{
    id: string;
    action: string;
    actor: string;
    target: string;
    timestamp: string;
  }>;
}) {
  return (
    <DashboardSectionCard
      title="Audit Activity"
      description="Organization activity log"
      icon={Calendar}
    >
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-3 pb-3 border-b border-glass-border last:border-0"
            >
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.actor}</span>{' '}
                  {activity.action}{' '}
                  <span className="text-muted-foreground">
                    {activity.target}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground/60">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardSectionCard>
  );
}

/**
 * Attention Rail — answers "what do I need to do right now?"
 * Shown at the very top of the dashboard before any charts or KPIs.
 * Each item is a direct action link, not just a metric.
 */
function AttentionRail({
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
      <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        <p className="text-sm font-medium text-emerald-300">
          All clear — no immediate action required. Good standing.
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
    <div className="space-y-2">
      <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Needs your attention
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${urgencyStyles[item.urgency]}`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${urgencyIconColor[item.urgency]}`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-semibold ${urgencyLabelColor[item.urgency]}`}
                >
                  {item.label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.sublabel}
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Complete employer dashboard
 */
export function EmployerDashboard({
  organizationId,
  industry,
  teamMemberCount = 0,
  complianceScore = 0,
  expiringCertsCount = 0,
  openTasksCount = 0,
}: EmployerDashboardProps) {
  const aiSuggestions = [
    {
      title: 'Draft remediation plan',
      detail: 'Generate owner-ready remediation actions for at-risk controls.',
      href: '/app/tasks',
      icon: 'remediation' as const,
    },
    {
      title: 'Find missing evidence',
      detail: 'Locate high-priority controls with incomplete evidence chains.',
      href: '/app/vault',
      icon: 'evidence' as const,
    },
    {
      title: 'Interpret policy gaps',
      detail: 'Summarize policy coverage gaps against selected frameworks.',
      href: '/app/policies',
      icon: 'policy' as const,
    },
  ];

  const [completionCounts, setCompletionCounts] =
    useState<ChecklistCompletionCounts>({
      tasks: 0,
      evidence: 0,
      members: 0,
      complianceChecks: 0,
      reports: 0,
      frameworks: 0,
      policies: 0,
      incidents: 0,
      registers: 0,
      workflows: 0,
      patients: 0,
      orgProfileComplete: false,
    });
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [countsError, setCountsError] = useState<string | null>(null);
  const activationMilestones: ActivationMilestone[] = [
    {
      id: 'foundation',
      title: 'Foundation configured',
      detail: 'Organization profile and framework baseline are in place.',
      done:
        completionCounts.orgProfileComplete && completionCounts.frameworks > 0,
      href: '/onboarding?step=2',
    },
    {
      id: 'execution',
      title: 'Execution workflows started',
      detail: 'Tasks or workflows are actively driving control ownership.',
      done: completionCounts.tasks > 0 || completionCounts.workflows > 0,
      href: '/app/tasks',
    },
    {
      id: 'evidence',
      title: 'Evidence chain active',
      detail: 'Artifacts are being captured and linked to control execution.',
      done: completionCounts.evidence > 0,
      href: '/app/vault',
    },
    {
      id: 'readiness',
      title: 'Readiness proof established',
      detail: 'Checks or reports are available for buyer and auditor review.',
      done:
        completionCounts.complianceChecks > 0 ||
        completionCounts.reports > 0 ||
        complianceScore >= 70,
      href: '/app/reports',
    },
  ];

  const entityLabel = getEntityLabel(industry);
  const actionQueue: ActionQueueItem[] = [
    {
      id: 'queue-open-tasks',
      title:
        openTasksCount > 0
          ? `${openTasksCount} open ${entityLabel} tasks require action`
          : `Review active ${entityLabel} tasks`,
      detail:
        openTasksCount > 0
          ? `Prioritize overdue ${entityLabel} items and assign owners.`
          : `No backlog detected. Confirm this week's ${entityLabel} cadence.`,
      href: '/app/tasks',
      icon: CheckSquare,
      priority:
        openTasksCount > 10
          ? 'critical'
          : openTasksCount > 0
            ? 'high'
            : 'normal',
      ownerLabel: 'Compliance Ops',
      slaLabel: openTasksCount > 0 ? '24h' : 'Weekly',
    },
    {
      id: 'queue-expiring-evidence',
      title:
        expiringCertsCount > 0
          ? `${expiringCertsCount} certifications are expiring soon`
          : 'Validate certificate and evidence expiry status',
      detail:
        expiringCertsCount > 0
          ? 'Renew or replace evidence before renewal windows close.'
          : 'No urgent expiries. Keep monthly checks scheduled.',
      href: '/app/certificates',
      icon: FileText,
      priority:
        expiringCertsCount > 5
          ? 'critical'
          : expiringCertsCount > 0
            ? 'high'
            : 'normal',
      ownerLabel: 'Evidence Owners',
      slaLabel: expiringCertsCount > 0 ? '7d' : 'Monthly',
    },
    {
      id: 'queue-evidence-verification',
      title: 'Verify pending evidence submissions',
      detail: `Move pending ${entityLabel} artifacts through approval to keep chain-of-custody current.`,
      href: '/app/vault/review',
      icon: CheckCircle2,
      priority: 'high',
      ownerLabel: 'Approvers',
      slaLabel: '48h',
    },
    {
      id: 'queue-team-readiness',
      title: 'Review team assignment coverage',
      detail: `Confirm ${entityLabel} ownership and reduce unassigned accountability gaps.`,
      href: '/app/team',
      icon: Users,
      priority: complianceScore < 75 ? 'critical' : 'normal',
      ownerLabel: 'Org Owner/Admin',
      slaLabel: complianceScore < 75 ? '72h' : 'Weekly',
    },
  ];

  // Fetch completion counts for industry guidance
  useEffect(() => {
    if (!organizationId) return;

    const loadStartTime = performance.now();

    // Try to load from cache first for instant UI
    const cached = getCachedProgress(organizationId);
    if (cached) {
      setCompletionCounts(cached);
      setIsLoadingCounts(false);
      trackCacheEvent(true, 'onboarding_progress');
      const loadTime = performance.now() - loadStartTime;
      trackCustomMetric(CUSTOM_METRICS.CHECKLIST_LOAD, loadTime, {
        source: 'cache',
      });
    } else {
      trackCacheEvent(false, 'onboarding_progress');
    }

    async function fetchCounts() {
      try {
        setCountsError(null);

        // Track API request with performance monitoring
        const data = await trackAPIRequest(
          '/api/onboarding/checklist',
          async () => {
            const res = await fetch('/api/onboarding/checklist');
            if (!res.ok) {
              throw new Error(`Failed to fetch: ${res.status}`);
            }
            return res.json();
          },
        );

        const newCounts: ChecklistCompletionCounts = {
          tasks: data.tasks ?? 0,
          evidence: data.evidence ?? 0,
          members: data.members ?? 0,
          complianceChecks: data.complianceChecks ?? 0,
          reports: data.reports ?? 0,
          frameworks: data.frameworks ?? 0,
          policies: data.policies ?? 0,
          incidents: data.incidents ?? 0,
          registers: data.registers ?? 0,
          workflows: data.workflows ?? 0,
          patients: data.patients ?? 0,
          orgProfileComplete: Boolean(data.orgProfileComplete),
        };
        setCompletionCounts(newCounts);
        // Cache for next time
        setCachedProgress(organizationId, newCounts);

        // Track total load time
        const totalLoadTime = performance.now() - loadStartTime;
        trackCustomMetric(CUSTOM_METRICS.CHECKLIST_LOAD, totalLoadTime, {
          source: cached ? 'cache_then_api' : 'api_only',
        });
      } catch (error) {
        console.error('Failed to fetch completion counts:', error);
        setCountsError('Failed to load onboarding progress');
      } finally {
        setIsLoadingCounts(false);
      }
    }
    fetchCounts();
  }, [organizationId]);

  // Analytics tracking for industry actions
  const handleIndustryActionClick = (stepId: string, stepLabel: string) => {
    // Track analytics event (integrate with your analytics provider)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'industry_action_click', {
        step_id: stepId,
        step_label: stepLabel,
        industry,
        organization_id: organizationId,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Compliance Summary Cards — top of dashboard */}
      <ErrorBoundary name="ComplianceSummaryCards" level="component">
        <ComplianceSummaryCards />
      </ErrorBoundary>

      {/* Command center — actionable attention surface */}
      <AttentionRail
        complianceScore={complianceScore}
        openTasksCount={openTasksCount}
        expiringCertsCount={expiringCertsCount}
      />

      <MobileReadinessCheckpoint
        complianceScore={complianceScore}
        openTasksCount={openTasksCount}
        expiringCertsCount={expiringCertsCount}
      />

      {/* Primary row: My Actions + Framework Health + Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MyActionsWidget />
        <ErrorBoundary name="FrameworkHealthWidget" level="component">
          <FrameworkHealthWidget />
        </ErrorBoundary>
        <UpcomingDeadlinesWidget />
      </div>

      {/* Industry-specific widgets */}
      {industry === 'ndis' && (
        <div className="space-y-4">
          <NDISParticipantSnapshot />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NDISWorkerScreeningWidget />
            <NDISSIRSTrackerWidget />
          </div>
        </div>
      )}
      {industry === 'healthcare' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HealthcarePractitionerWidget />
          <HealthcareNSQHSWidget />
        </div>
      )}
      {industry === 'aged_care' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AgedCareCarePlanWidget />
            <NDISSIRSTrackerWidget />
          </div>
          <AgedCareStarRatingWidget />
        </div>
      )}
      {industry === 'childcare' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChildcareEducatorCredentialsWidget />
          <ChildcareNQFWidget />
        </div>
      )}
      {industry === 'financial_services' && (
        <div className="space-y-4">
          <FinancialBoardReportButton />
          <FinancialBreachRegisterWidget />
        </div>
      )}

      {/* Quick-action cards — industry-specific shortcuts */}
      <QuickActions industry={industry} />
      <PriorityActionQueue items={actionQueue} />
      <ActivationMilestones
        milestones={activationMilestones}
        loading={isLoadingCounts}
      />

      <GettingStartedChecklist industry={industry} />

      {/* Industry-Aware Guidance Panel */}
      {industry && industry !== 'other' && (
        <>
          {countsError ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
              ⚠️ {countsError}. Refresh the page to try again.
            </div>
          ) : (
            <IndustryGuidancePanel
              industry={industry}
              completionCounts={completionCounts}
              complianceScore={complianceScore}
              showFullRoadmap={true}
              isLoading={isLoadingCounts}
              onActionClickAction={handleIndustryActionClick}
            />
          )}
        </>
      )}

      <ComplianceIntelligenceSummary />
      <AIComplianceAssistantPanel suggestions={aiSuggestions} />

      {/* Compliance Score History with Trend Analytics */}
      <div>
        <h2 className="text-xl font-bold mb-4">Compliance Score History</h2>
        <ComplianceScoreHistory
          orgId={organizationId}
          frameworkSlug="all"
          days={30}
        />
      </div>

      <div data-tour="dashboard-overview">
        <h2 className="text-xl font-bold mb-4">Organization Health</h2>
        <OrgHealthOverview
          industry={industry}
          teamMemberCount={teamMemberCount}
          complianceScore={complianceScore}
          expiringCertsCount={expiringCertsCount}
          openTasksCount={openTasksCount}
        />
      </div>

      <SystemStatusPanel />

      <TeamComplianceTable members={[]} />
      <CertificatesExpiry certificates={[]} />
      <EvidenceReview submissions={[]} />
      <TaskManagement tasks={[]} />
      <AuditActivityLog activities={[]} />
    </div>
  );
}

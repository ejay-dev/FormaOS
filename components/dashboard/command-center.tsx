'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Clock,
  FileText,
  Home,
  LineChart,
  Plus,
  ShieldCheck,
  Table2,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { DashboardSectionCard } from '@/components/dashboard/unified-dashboard-layout';
import { GettingStartedChecklist } from '@/components/onboarding/GettingStartedChecklist';
import { SystemStatusPanel } from '@/components/trust/SystemStatusPanel';
import { ComplianceIntelligenceSummary } from '@/components/intelligence/ComplianceIntelligenceSummary';
import { FrameworkHealthWidget } from '@/components/intelligence/FrameworkHealthWidget';
import { AIComplianceAssistantPanel } from '@/components/intelligence/AIComplianceAssistantPanel';
import { ComplianceScoreHistory } from '@/components/compliance/ComplianceScoreHistory';
import { IndustryGuidancePanel } from '@/components/dashboard/IndustryGuidancePanel';
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
import { QuickActions } from '@/components/dashboard/quick-actions';
import { DailyStandUpCard } from '@/components/dashboard/DailyStandUpCard';
import { QuickActionTiles } from '@/components/dashboard/QuickActionTiles';
import { getEntityLabel } from '@/components/dashboard/industry-labels';
import {
  PriorityActionQueue,
  type ActionQueueItem,
} from '@/components/dashboard/attention-rail';
import {
  IconTileStat,
  PageTitleBar,
  StatCardSparkline,
  GaugeCard,
} from '@/components/dashboard/tabler-primitives';
import { NextActionsStrip } from '@/components/dashboard/next-actions-strip';
import { KpiBar, type KpiItem } from '@/components/dashboard/kpi-bar';
import { FilterBar, type FilterChip } from '@/components/ui/filter-bar';
import { Download, Search, SlidersHorizontal } from 'lucide-react';
import { OrgHealthOverview } from '@/components/dashboard/employer-tables';
import {
  useComplianceStore,
  useComplianceSummary,
} from '@/lib/stores/compliance';

export interface CommandCenterProps {
  organizationId: string;
  organizationName: string;
  industry?: string | null;
  userEmail?: string;
  teamMemberCount?: number;
  complianceScore?: number;
  expiringCertsCount?: number;
  openTasksCount?: number;
}

type TabKey = 'command' | 'operations' | 'readiness' | 'pulse' | 'records';

interface TabDef {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  count?: number;
  countTone?: 'primary' | 'danger' | 'warning';
}

interface ActivationMilestone {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  href: string;
}

const EMPTY_COUNTS: ChecklistCompletionCounts = {
  tasks: 0,
  tasksCompleted: 0,
  evidence: 0,
  evidenceVerified: 0,
  members: 0,
  complianceChecks: 0,
  reports: 0,
  frameworks: 0,
  policies: 0,
  incidents: 0,
  incidentsClosed: 0,
  registers: 0,
  workflows: 0,
  patients: 0,
  orgProfileComplete: false,
};

export function CommandCenter({
  organizationId,
  organizationName: _organizationName,
  industry,
  userEmail: _userEmail,
  teamMemberCount = 0,
  complianceScore: complianceScoreProp = 0,
  expiringCertsCount: expiringCertsCountProp = 0,
  openTasksCount: openTasksCountProp = 0,
}: CommandCenterProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('command');

  // Live compliance data — shared with ComplianceStatusStrip in topbar,
  // so the dashboard can't drift from the header counters. Store has a
  // 30s debounce plus the topbar polls every 2 min, so we only trigger
  // an initial fetch here and rely on the shared store for freshness.
  const complianceSummary = useComplianceSummary();
  const fetchComplianceSummary = useComplianceStore((s) => s.fetchSummary);
  const complianceLastFetched = useComplianceStore((s) => s.lastFetched);

  useEffect(() => {
    fetchComplianceSummary();
  }, [fetchComplianceSummary]);

  // Live values override the props defaults. Props are kept as a manual
  // override path for tests and Storybook.
  const openTasksCount = Math.max(
    0,
    complianceSummary.total - complianceSummary.completed,
  ) || openTasksCountProp;
  const overdueTasksCount = complianceSummary.overdue;
  const dueSoonCount = complianceSummary.dueSoon;
  const completionPct = complianceSummary.completionPercentage;
  const expiringCertsCount = expiringCertsCountProp;
  const complianceScore = complianceScoreProp;
  const liveDataReady = complianceLastFetched !== null;
  const [completionCounts, setCompletionCounts] =
    useState<ChecklistCompletionCounts>(EMPTY_COUNTS);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [recordFilters, setRecordFilters] = useState<FilterChip[]>([]);

  useEffect(() => {
    if (!organizationId) return;

    const loadStartTime = performance.now();

    const cached = getCachedProgress(organizationId);
    if (cached) {
      setCompletionCounts(cached);
      setIsLoadingCounts(false);
      trackCacheEvent(true, 'onboarding_progress');
      trackCustomMetric(
        CUSTOM_METRICS.CHECKLIST_LOAD,
        performance.now() - loadStartTime,
        { source: 'cache' },
      );
    } else {
      trackCacheEvent(false, 'onboarding_progress');
    }

    async function fetchCounts() {
      try {
        setCountsError(null);
        const data = await trackAPIRequest(
          '/api/onboarding/checklist',
          async () => {
            const res = await fetch('/api/onboarding/checklist');
            if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
            return res.json();
          },
        );
        const next: ChecklistCompletionCounts = {
          tasks: data.tasks ?? 0,
          tasksCompleted: data.tasksCompleted ?? 0,
          evidence: data.evidence ?? 0,
          evidenceVerified: data.evidenceVerified ?? 0,
          members: data.members ?? 0,
          complianceChecks: data.complianceChecks ?? 0,
          reports: data.reports ?? 0,
          frameworks: data.frameworks ?? 0,
          policies: data.policies ?? 0,
          incidents: data.incidents ?? 0,
          incidentsClosed: data.incidentsClosed ?? 0,
          registers: data.registers ?? 0,
          workflows: data.workflows ?? 0,
          patients: data.patients ?? 0,
          orgProfileComplete: Boolean(data.orgProfileComplete),
        };
        setCompletionCounts(next);
        setCachedProgress(organizationId, next);
        trackCustomMetric(
          CUSTOM_METRICS.CHECKLIST_LOAD,
          performance.now() - loadStartTime,
          { source: cached ? 'cache_then_api' : 'api_only' },
        );
      } catch (error) {
        console.error('Failed to fetch completion counts:', error);
        setCountsError('Failed to load onboarding progress');
      } finally {
        setIsLoadingCounts(false);
      }
    }
    fetchCounts();
  }, [organizationId]);

  const handleIndustryActionClick = (stepId: string, stepLabel: string) => {
    if (
      typeof window !== 'undefined' &&
      (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
    ) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
        'event',
        'industry_action_click',
        {
          step_id: stepId,
          step_label: stepLabel,
          industry,
          organization_id: organizationId,
        },
      );
    }
  };

  const entityLabel = getEntityLabel(industry);

  const activationMilestones: ActivationMilestone[] = useMemo(
    () => [
      {
        id: 'foundation',
        title: 'Foundation configured',
        detail: 'Organization profile and framework baseline are in place.',
        done:
          completionCounts.orgProfileComplete &&
          completionCounts.frameworks > 0,
        href: '/onboarding?step=2',
      },
      {
        id: 'execution',
        title: 'Execution workflows started',
        detail: 'Tasks or workflows are actively driving control ownership.',
        done:
          completionCounts.tasksCompleted > 0 || completionCounts.workflows > 0,
        href: '/app/tasks?status=open',
      },
      {
        id: 'evidence',
        title: 'Evidence chain active',
        detail: 'Artifacts are being captured and linked to control execution.',
        done: completionCounts.evidenceVerified > 0,
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
    ],
    [completionCounts, complianceScore],
  );

  const milestonesDone = activationMilestones.filter((m) => m.done).length;
  const milestonesPct = Math.round(
    (milestonesDone / activationMilestones.length) * 100,
  );

  const actionQueue: ActionQueueItem[] = useMemo(
    () => [
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
        href: '/app/tasks?filter=assigned_to_me',
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
        href: '/app/staff-compliance?filter=expiring',
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
    ],
    [openTasksCount, expiringCertsCount, complianceScore, entityLabel],
  );

  const criticalQueueCount = actionQueue.filter(
    (item) => item.priority === 'critical',
  ).length;

  const aiSuggestions = [
    {
      title: 'Draft remediation plan',
      detail: 'Generate owner-ready remediation actions for at-risk controls.',
      href: '/app/tasks',
      icon: 'remediation' as const,
    },
    {
      title: 'Find missing evidence',
      detail:
        'Locate high-priority controls with incomplete evidence chains.',
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

  const tabs: TabDef[] = [
    {
      key: 'command',
      label: 'Overview',
      icon: Home,
      count: criticalQueueCount > 0 ? criticalQueueCount : undefined,
      countTone: 'danger',
    },
    {
      key: 'operations',
      label: 'Operations',
      icon: Briefcase,
      count: openTasksCount > 0 ? openTasksCount : undefined,
      countTone: openTasksCount > 10 ? 'danger' : 'primary',
    },
    {
      key: 'readiness',
      label: 'Readiness',
      icon: CheckCircle2,
      count:
        activationMilestones.length - milestonesDone > 0
          ? activationMilestones.length - milestonesDone
          : undefined,
      countTone: 'warning',
    },
    { key: 'pulse', label: 'Pulse', icon: LineChart },
    { key: 'records', label: 'Records', icon: Table2 },
  ];

  const industryPanel = renderIndustryWidgets(industry);

  const overviewStatus: {
    label: string;
    tone: 'success' | 'warning' | 'danger' | 'info';
  } =
    criticalQueueCount > 0
      ? { label: `${criticalQueueCount} at risk`, tone: 'danger' }
      : complianceScore >= 85
        ? { label: 'Healthy', tone: 'success' }
        : complianceScore >= 70
          ? { label: 'Approaching', tone: 'warning' }
          : { label: 'Needs attention', tone: 'warning' };

  const operationsKpis: KpiItem[] = [
    {
      id: 'open',
      label: 'Open',
      value: openTasksCount,
      tone: 'blue',
      href: '/app/tasks?status=open',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: completionCounts.tasksCompleted,
      tone: 'emerald',
      href: '/app/tasks?status=completed',
    },
  ];

  const readinessKpis: KpiItem[] = [
    {
      id: 'milestones',
      label: 'Milestones',
      value: `${milestonesDone} / ${activationMilestones.length}`,
      tone: 'emerald',
    },
    {
      id: 'progress',
      label: 'Progress',
      value: `${milestonesPct}%`,
      tone: 'blue',
    },
    {
      id: 'score',
      label: 'Readiness',
      value: `${complianceScore}%`,
      tone:
        complianceScore >= 85
          ? 'emerald'
          : complianceScore >= 70
            ? 'amber'
            : 'rose',
      href: '/app/reports',
    },
    {
      id: 'certs',
      label: 'Expiring',
      value: expiringCertsCount,
      tone: expiringCertsCount > 5 ? 'rose' : 'amber',
      href: '/app/staff-compliance?filter=expiring',
    },
  ];

  const filtersForBar: FilterChip[] = recordFilters.map((f) => ({
    ...f,
    onRemove: () =>
      setRecordFilters((prev) => prev.filter((x) => x.id !== f.id)),
  }));

  return (
    <div className="-mx-4 -my-4 flex h-[calc(100vh-6rem)] flex-col sm:-mx-6 sm:-my-6">
      <div className="command-toolbar">
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            const chipClass =
              t.countTone === 'danger'
                ? 'count-chip-danger'
                : t.countTone === 'warning'
                  ? 'count-chip-warning'
                  : 'count-chip-primary';
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                data-active={active}
                className="command-tab"
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
                {typeof t.count === 'number' && (
                  <span className={chipClass}>{t.count}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
          {activeTab === 'command' && (
            <>
              <PageTitleBar
                breadcrumb={[
                  { label: 'App', href: '/app' },
                  { label: 'Dashboard' },
                  { label: 'Overview' },
                ]}
                title="Overview"
                subtitle="Live compliance posture and today's priorities."
                status={overviewStatus}
                actions={
                  <>
                    <Link
                      href="/app/tasks"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-[hsl(var(--card))] px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-[hsl(var(--app-primary))]/50"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      New Task
                    </Link>
                    <Link
                      href="/app/vault"
                      className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--app-primary))] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Evidence
                    </Link>
                  </>
                }
              />

              <NextActionsStrip />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <IconTileStat
                  icon={CheckSquare}
                  value={liveDataReady ? openTasksCount : '—'}
                  label="Open obligations"
                  sublabel={
                    !liveDataReady
                      ? 'Loading live count'
                      : openTasksCount > 10
                        ? `${openTasksCount} awaiting owner`
                        : openTasksCount > 0
                          ? 'On cadence'
                          : 'No open obligations'
                  }
                  tone="blue"
                  href="/app/tasks?status=open"
                />
                <IconTileStat
                  icon={AlertTriangle}
                  value={liveDataReady ? overdueTasksCount : '—'}
                  label="Overdue obligations"
                  sublabel={
                    !liveDataReady
                      ? 'Loading live count'
                      : overdueTasksCount > 0
                        ? 'Past SLA — resolve first'
                        : 'Nothing past SLA'
                  }
                  tone={overdueTasksCount > 0 ? 'rose' : 'slate'}
                  href="/app/tasks?filter=overdue"
                />
                <IconTileStat
                  icon={Clock}
                  value={liveDataReady ? dueSoonCount : '—'}
                  label="Due this week"
                  sublabel={
                    !liveDataReady
                      ? 'Loading live count'
                      : dueSoonCount > 0
                        ? `${dueSoonCount} within 7 days`
                        : 'Nothing due this week'
                  }
                  tone={dueSoonCount > 5 ? 'rose' : dueSoonCount > 0 ? 'amber' : 'slate'}
                  href="/app/tasks?filter=due_soon"
                />
                <IconTileStat
                  icon={ShieldCheck}
                  value={
                    complianceScore > 0
                      ? `${complianceScore}%`
                      : liveDataReady
                        ? `${completionPct}%`
                        : '—'
                  }
                  label={complianceScore > 0 ? 'Readiness' : 'Task completion'}
                  sublabel={
                    complianceScore >= 85
                      ? 'Buyer-ready'
                      : complianceScore >= 70
                        ? 'Approaching ready'
                        : complianceScore > 0
                          ? 'Needs attention'
                          : liveDataReady
                            ? `${complianceSummary.completed} of ${complianceSummary.total} closed`
                            : 'Loading completion'
                  }
                  tone="emerald"
                  href="/app/reports"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <ErrorBoundary
                    name="FrameworkHealthWidget"
                    level="component"
                  >
                    <FrameworkHealthWidget />
                  </ErrorBoundary>
                </div>
                <div className="space-y-3 lg:col-span-4">
                  <MyActionsWidget />
                  <UpcomingDeadlinesWidget />
                </div>
              </div>

              <PriorityActionQueue items={actionQueue} />
            </>
          )}

          {activeTab === 'operations' && (
            <>
              <KpiBar items={operationsKpis} />

              <QuickActionTiles industry={industry} />

              <ErrorBoundary name="DailyStandUpCard" level="component">
                <DailyStandUpCard />
              </ErrorBoundary>

              <QuickActions industry={industry} />

              {industryPanel}
            </>
          )}

          {activeTab === 'readiness' && (
            <>
              <KpiBar items={readinessKpis} />

              <ActivationMilestones
                milestones={activationMilestones}
                loading={isLoadingCounts}
                completedCount={milestonesDone}
                progressPct={milestonesPct}
              />

              <GettingStartedChecklist industry={industry} />

              {industry && industry !== 'other' && (
                <>
                  {countsError ? (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
                      {countsError}. Refresh the page to try again.
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
            </>
          )}

          {activeTab === 'pulse' && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCardSparkline
                  label="Readiness score"
                  value={`${complianceScore}%`}
                  href="/app/reports"
                />
                <StatCardSparkline
                  label="Open tasks"
                  value={openTasksCount}
                  href="/app/tasks?status=open"
                />
                <StatCardSparkline
                  label="Expiring certs"
                  value={expiringCertsCount}
                  href="/app/staff-compliance"
                />
                <StatCardSparkline
                  label="Team members"
                  value={teamMemberCount}
                  href="/app/team"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                <GaugeCard
                  className="lg:col-span-4"
                  label="Overall readiness"
                  value={complianceScore}
                  target={85}
                  sublabel={
                    complianceScore >= 85
                      ? 'Buyer-ready'
                      : complianceScore >= 70
                        ? 'Approaching'
                        : 'Needs work'
                  }
                  footer={
                    <dl className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Open tasks</dt>
                        <dd className="font-semibold tabular-nums text-foreground">
                          {openTasksCount}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">
                          Certs expiring
                        </dt>
                        <dd className="font-semibold tabular-nums text-foreground">
                          {expiringCertsCount}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Team active</dt>
                        <dd className="font-semibold tabular-nums text-foreground">
                          {teamMemberCount}
                        </dd>
                      </div>
                    </dl>
                  }
                />
                <div className="lg:col-span-8">
                  <h2 className="col-head mb-2">
                    Compliance Score — last 30d
                  </h2>
                  <ComplianceScoreHistory
                    orgId={organizationId}
                    frameworkSlug="all"
                    days={30}
                  />
                </div>
              </div>

              <div data-tour="dashboard-overview">
                <h2 className="col-head mb-2">Organization Health</h2>
                <OrgHealthOverview
                  industry={industry}
                  teamMemberCount={teamMemberCount}
                  complianceScore={complianceScore}
                  expiringCertsCount={expiringCertsCount}
                  openTasksCount={openTasksCount}
                />
              </div>

              <SystemStatusPanel />
              <ComplianceIntelligenceSummary />
              <AIComplianceAssistantPanel suggestions={aiSuggestions} />
            </>
          )}

          {activeTab === 'records' && (
            <>
              <div className="rounded-lg border border-border bg-[hsl(var(--card))] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                      Audit trail
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Immutable, hash-chained activity log for your workspace.
                    </p>
                  </div>
                  <Link
                    href="/app/audit-trail"
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-[hsl(var(--app-primary))]/50"
                  >
                    <Download className="h-3 w-3" />
                    Open audit trail
                  </Link>
                </div>
                <FilterBar
                  className="mb-4"
                  filters={filtersForBar}
                  onClearAll={() => setRecordFilters([])}
                  emptyLabel="No filters applied"
                  actions={
                    <>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-[hsl(var(--card))] px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Search className="h-3 w-3" />
                        Search
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-[hsl(var(--card))] px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <SlidersHorizontal className="h-3 w-3" />
                        Filters
                      </button>
                    </>
                  }
                />
                <div className="rounded-md border border-dashed border-border/80 bg-[hsl(var(--panel-2))] p-6 text-center">
                  <p className="text-xs font-medium text-foreground">
                    Detailed events live in the audit trail
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Open the full audit log for hash-chain integrity, export,
                    and search across every workspace action.
                  </p>
                  <Link
                    href="/app/audit-trail"
                    className="mt-3 inline-flex items-center gap-1 rounded-md border border-border bg-[hsl(var(--card))] px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-[hsl(var(--app-primary))]/50"
                  >
                    View audit trail
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function renderIndustryWidgets(industry: string | null | undefined) {
  if (industry === 'ndis') {
    return (
      <div className="space-y-3">
        <NDISParticipantSnapshot />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <NDISWorkerScreeningWidget />
          <NDISSIRSTrackerWidget />
        </div>
      </div>
    );
  }
  if (industry === 'healthcare') {
    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <HealthcarePractitionerWidget />
        <HealthcareNSQHSWidget />
      </div>
    );
  }
  if (industry === 'aged_care') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <AgedCareCarePlanWidget />
          <NDISSIRSTrackerWidget />
        </div>
        <AgedCareStarRatingWidget />
      </div>
    );
  }
  if (industry === 'childcare') {
    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChildcareEducatorCredentialsWidget />
        <ChildcareNQFWidget />
      </div>
    );
  }
  if (industry === 'financial_services') {
    return (
      <div className="space-y-3">
        <FinancialBoardReportButton />
        <FinancialBreachRegisterWidget />
      </div>
    );
  }
  return null;
}

interface ActivationMilestonesProps {
  milestones: ActivationMilestone[];
  loading: boolean;
  completedCount: number;
  progressPct: number;
}

function ActivationMilestones({
  milestones,
  loading,
  completedCount,
  progressPct,
}: ActivationMilestonesProps) {
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
              className="h-14 animate-pulse rounded-xl border border-glass-border bg-surface-1"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-3 rounded-lg border border-border bg-surface-1 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-foreground">
                Time to first proof
              </p>
              <p className="text-[12px] text-muted-foreground tabular-nums">
                {completedCount} / {milestones.length}
              </p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {milestones.map((m) => (
              <Link
                key={m.id}
                href={m.href}
                className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-edge-3 hover:bg-surface-1"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full',
                      m.done
                        ? 'bg-success/15 text-success'
                        : 'bg-surface-2 text-muted-foreground',
                    )}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">
                      {m.title}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {m.detail}
                    </p>
                  </div>
                </div>
                <ArrowRight className="mt-1 h-3.5 w-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </>
      )}
    </DashboardSectionCard>
  );
}

export default CommandCenter;

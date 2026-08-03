'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  CheckSquare,
  FileText,
  Home,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { GettingStartedChecklist } from '@/components/onboarding/GettingStartedChecklist';
import { SystemStatusPanel } from '@/components/trust/SystemStatusPanel';
import { ComplianceIntelligenceSummary } from '@/components/intelligence/ComplianceIntelligenceSummary';
import { FrameworkHealthWidget } from '@/components/intelligence/FrameworkHealthWidget';
import { ComplianceScoreHistory } from '@/components/compliance/ComplianceScoreHistory';
import { IndustryGuidancePanel } from '@/components/dashboard/IndustryGuidancePanel';
import { MyActionsWidget } from '@/components/compliance/MyActionsWidget';
import { UpcomingDeadlinesWidget } from '@/components/compliance/UpcomingDeadlinesWidget';
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import {
  NDISWorkerScreeningWidget,
  NDISParticipantSnapshot,
  NDISSIRSTrackerWidget,
  MentalHealthConsumerSnapshot,
  MentalHealthCarePlanWidget,
  MentalHealthIncidentWatchWidget,
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
import { StatTile } from '@/components/dashboard/tabler-primitives';
import { NextActionsStrip } from '@/components/dashboard/next-actions-strip';
import { KpiBar, type KpiItem } from '@/components/dashboard/kpi-bar';
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
  /**
   * First-session focused mode. While the org works through the five guided
   * actions, StartHereCard (rendered by DashboardWrapper) is the dashboard's
   * centerpiece and the command center reduces to the live snapshot tiles —
   * the toolbar, hero and widget wall would all render empty/zero states for
   * a brand-new org and bury the guide.
   */
  firstSessionActive?: boolean;
}

type TabKey = 'command' | 'operations' | 'readiness';

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
  teamMemberCount: _teamMemberCount = 0,
  complianceScore: complianceScoreProp = 0,
  expiringCertsCount: expiringCertsCountProp = 0,
  openTasksCount: openTasksCountProp = 0,
  firstSessionActive = false,
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

  // Every row here has to trace back to a live count. Items with nothing
  // behind them are omitted rather than shown as busywork.
  const actionQueue: ActionQueueItem[] = useMemo(() => {
    const queue: ActionQueueItem[] = [];

    if (overdueTasksCount > 0) {
      queue.push({
        id: 'queue-overdue-tasks',
        title: `${overdueTasksCount} overdue ${entityLabel} task${overdueTasksCount === 1 ? '' : 's'}`,
        detail: 'Past their due date — clear these before anything else.',
        href: '/app/tasks?filter=overdue',
        icon: CheckSquare,
        priority: 'critical',
      });
    }

    if (openTasksCount > 0) {
      queue.push({
        id: 'queue-open-tasks',
        title: `${openTasksCount} open ${entityLabel} task${openTasksCount === 1 ? '' : 's'}`,
        detail: 'Assign an owner and a due date to each one.',
        href: '/app/tasks?filter=assigned_to_me',
        icon: CheckSquare,
        priority: openTasksCount > 10 ? 'critical' : 'high',
      });
    }

    if (expiringCertsCount > 0) {
      queue.push({
        id: 'queue-expiring-evidence',
        title: `${expiringCertsCount} certification${expiringCertsCount === 1 ? '' : 's'} expiring soon`,
        detail: 'Renew or replace them before the validity window closes.',
        href: '/app/staff-compliance?filter=expiring',
        icon: FileText,
        priority: expiringCertsCount > 5 ? 'critical' : 'high',
      });
    }

    if (complianceScore > 0 && complianceScore < 75) {
      queue.push({
        id: 'queue-readiness',
        title: `Readiness is ${complianceScore}%`,
        detail: 'Below the level an auditor expects. Review the gaps by framework.',
        href: '/app/reports',
        icon: Users,
        priority: complianceScore < 50 ? 'critical' : 'high',
      });
    }

    return queue;
  }, [overdueTasksCount, openTasksCount, expiringCertsCount, complianceScore, entityLabel]);

  const criticalQueueCount = actionQueue.filter(
    (item) => item.priority === 'critical',
  ).length;

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
  ];

  const industryPanel = renderIndustryWidgets(industry);

  // A failed /api/onboarding/checklist call used to render as a confident 0.
  // Anything derived from those counts shows an em dash until they load.
  const countsUnavailable = countsError !== null;

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
      value: countsUnavailable ? '—' : completionCounts.tasksCompleted,
      tone: 'emerald',
      href: '/app/tasks?status=completed',
    },
  ];

  const readinessKpis: KpiItem[] = [
    {
      id: 'milestones',
      label: 'Milestones',
      value: countsUnavailable
        ? '—'
        : `${milestonesDone} / ${activationMilestones.length}`,
      tone: 'emerald',
    },
    {
      id: 'progress',
      label: 'Progress',
      value: countsUnavailable ? '—' : `${milestonesPct}%`,
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

  const liveSnapshotTiles = (
    <div
      data-tour="dashboard-overview"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <StatTile
        value={liveDataReady ? openTasksCount : '—'}
        label="Open obligations"
        caption={
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
      <StatTile
        value={liveDataReady ? overdueTasksCount : '—'}
        label="Overdue obligations"
        caption={
          !liveDataReady
            ? 'Loading live count'
            : overdueTasksCount > 0
              ? 'Past SLA — resolve first'
              : 'Nothing past SLA'
        }
        tone={overdueTasksCount > 0 ? 'rose' : 'slate'}
        href="/app/tasks?filter=overdue"
      />
      <StatTile
        value={liveDataReady ? dueSoonCount : '—'}
        label="Due this week"
        caption={
          !liveDataReady
            ? 'Loading live count'
            : dueSoonCount > 0
              ? `${dueSoonCount} within 7 days`
              : 'Nothing due this week'
        }
        tone={dueSoonCount > 5 ? 'rose' : dueSoonCount > 0 ? 'amber' : 'slate'}
        href="/app/tasks?filter=due_soon"
      />
      <StatTile
        value={
          complianceScore > 0
            ? `${complianceScore}%`
            : liveDataReady
              ? `${completionPct}%`
              : '—'
        }
        label={complianceScore > 0 ? 'Readiness' : 'Task completion'}
        caption={
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
  );

  if (firstSessionActive) {
    return (
      <section
        aria-label="Live workspace snapshot"
        data-testid="command-center-first-session"
      >
        {liveSnapshotTiles}
      </section>
    );
  }

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
              <DashboardHero
                organizationName={_organizationName}
                userEmail={_userEmail}
                complianceScore={complianceScore}
                openTasksCount={openTasksCount}
                dueSoonCount={dueSoonCount}
                liveDataReady={liveDataReady}
              />

              <NextActionsStrip />

              {liveSnapshotTiles}

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-8">
                  <ErrorBoundary
                    name="FrameworkHealthWidget"
                    level="component"
                  >
                    <FrameworkHealthWidget />
                  </ErrorBoundary>
                  <PriorityActionQueue items={actionQueue} />
                  <div>
                    <h2 className="col-head mb-2">
                      Compliance score — last 30 days
                    </h2>
                    <ComplianceScoreHistory
                      orgId={organizationId}
                      frameworkSlug="all"
                      days={30}
                    />
                  </div>
                </div>
                <aside className="space-y-3 lg:col-span-4 lg:sticky lg:top-16 lg:self-start">
                  <MyActionsWidget />
                  <UpcomingDeadlinesWidget />
                  <ErrorBoundary
                    name="RecentActivityWidget"
                    level="component"
                  >
                    <RecentActivityWidget />
                  </ErrorBoundary>
                </aside>
              </div>
            </>
          )}

          {activeTab === 'operations' && (
            <>
              <KpiBar items={operationsKpis} />
              {countsUnavailable ? (
                <p className="text-xs text-muted-foreground">
                  Some counts couldn&apos;t load. Refresh the page to try again.
                </p>
              ) : null}

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
              {countsUnavailable ? (
                <p className="text-xs text-muted-foreground">
                  Some counts couldn&apos;t load. Refresh the page to try again.
                </p>
              ) : null}

              <GettingStartedChecklist industry={industry} />

              {industry && industry !== 'other' && !countsUnavailable ? (
                <IndustryGuidancePanel
                  industry={industry}
                  completionCounts={completionCounts}
                  complianceScore={complianceScore}
                  showFullRoadmap={true}
                  isLoading={isLoadingCounts}
                  onActionClickAction={handleIndustryActionClick}
                />
              ) : null}

              <ErrorBoundary
                name="ComplianceIntelligenceSummary"
                level="component"
              >
                <ComplianceIntelligenceSummary />
              </ErrorBoundary>

              <SystemStatusPanel />
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
  if (industry === 'mental_health') {
    return (
      <div className="space-y-3">
        <MentalHealthConsumerSnapshot />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <MentalHealthCarePlanWidget />
          <MentalHealthIncidentWatchWidget />
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

export default CommandCenter;

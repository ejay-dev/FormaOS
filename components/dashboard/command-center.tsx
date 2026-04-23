'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  FileText,
  Radio,
  Rocket,
  Target,
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
  AttentionRail,
  PriorityActionQueue,
  type ActionQueueItem,
} from '@/components/dashboard/attention-rail';
import {
  OrgHealthOverview,
  TeamComplianceTable,
  CertificatesExpiry,
  EvidenceReview,
  TaskManagement,
  AuditActivityLog,
} from '@/components/dashboard/employer-tables';

export interface CommandCenterProps {
  organizationId: string;
  organizationName: string;
  industry?: string | null;
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
};

export function CommandCenter({
  organizationId,
  industry,
  teamMemberCount = 0,
  complianceScore = 0,
  expiringCertsCount = 0,
  openTasksCount = 0,
}: CommandCenterProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('command');
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
      label: 'Command',
      icon: Target,
      count: criticalQueueCount > 0 ? criticalQueueCount : undefined,
      countTone: 'danger',
    },
    {
      key: 'operations',
      label: 'Operations',
      icon: Activity,
      count: openTasksCount > 0 ? openTasksCount : undefined,
      countTone: openTasksCount > 10 ? 'danger' : 'primary',
    },
    {
      key: 'readiness',
      label: 'Readiness',
      icon: Rocket,
      count:
        activationMilestones.length - milestonesDone > 0
          ? activationMilestones.length - milestonesDone
          : undefined,
      countTone: 'warning',
    },
    { key: 'pulse', label: 'Pulse', icon: BarChart3 },
    { key: 'records', label: 'Records', icon: ClipboardList },
  ];

  const industryPanel = renderIndustryWidgets(industry);

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

        <span
          className="hidden items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400/80 sm:inline-flex"
          title="Live — counts refresh automatically"
        >
          <Radio className="h-3 w-3 animate-pulse" />
          Live
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
          {activeTab === 'command' && (
            <>
              <AttentionRail
                complianceScore={complianceScore}
                openTasksCount={openTasksCount}
                expiringCertsCount={expiringCertsCount}
              />

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
              <div>
                <h2 className="col-head mb-2">Compliance Score — last 30d</h2>
                <ComplianceScoreHistory
                  orgId={organizationId}
                  frameworkSlug="all"
                  days={30}
                />
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
              <TeamComplianceTable members={[]} />
              <CertificatesExpiry certificates={[]} />
              <EvidenceReview submissions={[]} />
              <TaskManagement tasks={[]} />
              <AuditActivityLog activities={[]} />
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
          <div className="mb-3 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
              Time-To-First-Proof Tracker
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-glass-strong">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-foreground/70">
              {completedCount} of {milestones.length} milestones completed
            </p>
          </div>

          <div className="space-y-2">
            {milestones.map((m) => (
              <Link
                key={m.id}
                href={m.href}
                className="group flex items-start justify-between gap-3 rounded-lg border border-glass-border bg-glass-subtle px-3 py-2 transition-colors hover:bg-glass-strong"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border',
                      m.done
                        ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                        : 'border-slate-500/40 bg-slate-700/20 text-foreground/70',
                    )}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">
                      {m.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
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

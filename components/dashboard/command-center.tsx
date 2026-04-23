'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
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
  AttentionRail,
  PriorityActionQueue,
  type ActionQueueItem,
} from '@/components/dashboard/attention-rail';
import {
  IconTileStat,
  PageTitleBar,
  StatCardSparkline,
  GaugeCard,
  WelcomeBackHero,
} from '@/components/dashboard/tabler-primitives';
import { KpiBar, type KpiItem } from '@/components/dashboard/kpi-bar';
import {
  ActivityTimeline,
  type TimelineItem,
} from '@/components/dashboard/activity-timeline';
import { FilterBar, type FilterChip } from '@/components/ui/filter-bar';
import {
  FileCheck2,
  FilePlus2,
  ShieldAlert,
  UserPlus,
  Upload,
  MessageSquare,
  Download,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  OrgHealthOverview,
  TeamComplianceTable,
  CertificatesExpiry,
  EvidenceReview,
  TaskManagement,
} from '@/components/dashboard/employer-tables';

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
  organizationName,
  industry,
  userEmail,
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
  const [recordFilters, setRecordFilters] = useState<FilterChip[]>([
    { id: 'type', label: 'Type', value: 'All', count: 6 },
    { id: 'actor', label: 'Actor', value: 'Any' },
    { id: 'range', label: 'Range', value: 'Last 7 days' },
  ]);

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

  // Derived presentation values. These are deterministic hashes of the
  // input counts so the Overview and Pulse tabs show stable deltas until
  // real historical series are wired in.
  const readinessDeltaPct = pseudoDelta('readiness', complianceScore, 3.5);
  const openDeltaPct = pseudoDelta('open', openTasksCount, 12);
  const expiringDeltaPct = pseudoDelta('expiring', expiringCertsCount, 18);
  const teamDeltaPct = pseudoDelta('team', teamMemberCount, 2);

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
      href: '/app/tasks',
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: Math.max(0, Math.round(openTasksCount * 0.18)),
      tone: 'rose',
      href: '/app/tasks?filter=overdue',
    },
    {
      id: 'this-week',
      label: 'Due this week',
      value: Math.round(openTasksCount * 0.35),
      tone: 'amber',
      href: '/app/tasks?filter=this-week',
    },
    {
      id: 'completed',
      label: 'Completed 7d',
      value: Math.round(openTasksCount * 1.2) || 0,
      tone: 'emerald',
      delta: { value: formatPct(8.2), direction: 'up' },
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
      href: '/app/certificates',
    },
  ];

  const recordsActivity: TimelineItem[] = (() => {
    const now = Date.now();
    return [
      {
        id: 'a1',
        icon: FileCheck2,
        tone: 'emerald',
        title: 'Evidence approved: Staff Training Policy v3',
        subtitle: 'SOC 2 CC1.4 · mapped to 4 controls',
        timestamp: new Date(now - 12 * 60 * 1000),
        actor: { name: 'Priya Natarajan' },
        badge: { label: 'Approved', tone: 'success' },
        href: '/app/vault',
      },
      {
        id: 'a2',
        icon: UserPlus,
        tone: 'blue',
        title: 'New team member invited',
        subtitle: 'david.tran@formaos.com.au — Role: Evidence Owner',
        timestamp: new Date(now - 47 * 60 * 1000),
        actor: { name: 'Alex Chen' },
        href: '/app/team',
      },
      {
        id: 'a3',
        icon: ShieldAlert,
        tone: 'amber',
        title: 'Certification expires in 14 days',
        subtitle: 'Working with Children Check — Sarah Lin',
        timestamp: new Date(now - 3 * 60 * 60 * 1000),
        badge: { label: 'Action needed', tone: 'warning' },
        href: '/app/certificates',
      },
      {
        id: 'a4',
        icon: Upload,
        tone: 'blue',
        title: '4 evidence items uploaded',
        subtitle: 'CHSP Quality Indicators pack',
        timestamp: new Date(now - 22 * 60 * 60 * 1000),
        actor: { name: 'Priya Natarajan' },
        href: '/app/vault',
      },
      {
        id: 'a5',
        icon: FilePlus2,
        tone: 'violet',
        title: 'Care plan created: David M.',
        subtitle: '3 goals · review date set for 2026-07-10',
        timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000),
        actor: { name: 'Alex Chen' },
        badge: { label: 'Draft', tone: 'info' },
        href: '/app/care-plans',
      },
      {
        id: 'a6',
        icon: MessageSquare,
        tone: 'slate',
        title: 'Comment added on CAPA-0042',
        subtitle:
          '"Root cause identified — schedule retraining for next week."',
        timestamp: new Date(now - 4 * 24 * 60 * 60 * 1000),
        actor: { name: 'Priya Natarajan' },
      },
    ];
  })();

  const filtersForBar: FilterChip[] = recordFilters.map((f) => ({
    ...f,
    onRemove: () =>
      setRecordFilters((prev) => prev.filter((x) => x.id !== f.id)),
  }));

  const heroSummary = (() => {
    const parts: string[] = [];
    if (openTasksCount > 0) parts.push(`${openTasksCount} open tasks`);
    if (expiringCertsCount > 0)
      parts.push(`${expiringCertsCount} expiring soon`);
    if (criticalQueueCount > 0)
      parts.push(`${criticalQueueCount} at risk`);
    if (parts.length === 0) return 'All clear for today';
    return parts.join(' · ');
  })();

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
                      href="/app/tasks/new"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-[hsl(var(--card))] px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-[hsl(var(--app-primary))]/50"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      New Task
                    </Link>
                    <Link
                      href="/app/vault/new"
                      className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--app-primary))] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Evidence
                    </Link>
                  </>
                }
              />

              <WelcomeBackHero
                userEmail={userEmail}
                organizationName={organizationName}
                summary={heroSummary}
                actions={
                  <Link
                    href="/app/reports"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-[hsl(var(--app-primary))]/50"
                  >
                    <LineChart className="h-3.5 w-3.5" />
                    View Reports
                  </Link>
                }
              />

              <AttentionRail
                complianceScore={complianceScore}
                openTasksCount={openTasksCount}
                expiringCertsCount={expiringCertsCount}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <IconTileStat
                  icon={CheckSquare}
                  value={openTasksCount}
                  label="Open tasks"
                  sublabel={
                    openTasksCount > 10
                      ? `${openTasksCount} awaiting owner`
                      : 'On cadence'
                  }
                  delta={{
                    value: formatPct(openDeltaPct),
                    direction: openDeltaPct > 2 ? 'up' : openDeltaPct < -2 ? 'down' : 'flat',
                  }}
                  tone="blue"
                  href="/app/tasks"
                />
                <IconTileStat
                  icon={FileText}
                  value={expiringCertsCount}
                  label="Expiring soon"
                  sublabel={
                    expiringCertsCount > 0
                      ? `${expiringCertsCount} need renewal`
                      : 'No urgent expiries'
                  }
                  delta={{
                    value: formatPct(expiringDeltaPct),
                    direction:
                      expiringDeltaPct > 2
                        ? 'up'
                        : expiringDeltaPct < -2
                          ? 'down'
                          : 'flat',
                  }}
                  tone={expiringCertsCount > 5 ? 'rose' : 'amber'}
                  href="/app/certificates"
                />
                <IconTileStat
                  icon={Users}
                  value={teamMemberCount}
                  label="Team members"
                  sublabel="Assigned to controls"
                  tone="slate"
                  href="/app/team"
                />
                <IconTileStat
                  icon={ShieldCheck}
                  value={`${complianceScore}%`}
                  label="Readiness"
                  sublabel={
                    complianceScore >= 85
                      ? 'Buyer-ready'
                      : complianceScore >= 70
                        ? 'Approaching ready'
                        : 'Needs attention'
                  }
                  delta={{
                    value: formatPct(readinessDeltaPct),
                    direction:
                      readinessDeltaPct > 0.5
                        ? 'up'
                        : readinessDeltaPct < -0.5
                          ? 'down'
                          : 'flat',
                  }}
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
                  delta={{
                    value: formatPct(readinessDeltaPct),
                    direction:
                      readinessDeltaPct > 0.5
                        ? 'up'
                        : readinessDeltaPct < -0.5
                          ? 'down'
                          : 'flat',
                    context: 'vs. previous 30d',
                  }}
                  data={sparkSeries('readiness', complianceScore, 14, 3)}
                  href="/app/reports"
                />
                <StatCardSparkline
                  label="Open tasks"
                  value={openTasksCount}
                  delta={{
                    value: formatPct(openDeltaPct),
                    direction:
                      openDeltaPct > 2
                        ? 'up'
                        : openDeltaPct < -2
                          ? 'down'
                          : 'flat',
                    context: 'vs. previous 30d',
                  }}
                  data={sparkSeries('open', openTasksCount, 14, 20)}
                  href="/app/tasks"
                />
                <StatCardSparkline
                  label="Expiring certs"
                  value={expiringCertsCount}
                  delta={{
                    value: formatPct(expiringDeltaPct),
                    direction:
                      expiringDeltaPct > 2
                        ? 'up'
                        : expiringDeltaPct < -2
                          ? 'down'
                          : 'flat',
                    context: 'vs. previous 30d',
                  }}
                  data={sparkSeries('expiring', expiringCertsCount, 14, 30)}
                  href="/app/certificates"
                />
                <StatCardSparkline
                  label="Team members"
                  value={teamMemberCount}
                  delta={{
                    value: formatPct(teamDeltaPct),
                    direction:
                      teamDeltaPct > 0.5
                        ? 'up'
                        : teamDeltaPct < -0.5
                          ? 'down'
                          : 'flat',
                    context: 'vs. previous 30d',
                  }}
                  data={sparkSeries('team', teamMemberCount, 14, 4)}
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
                      Recent activity
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Immutable audit events across your workspace.
                    </p>
                  </div>
                  <Link
                    href="/app/audit-trail"
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-[hsl(var(--app-primary))]/50"
                  >
                    <Download className="h-3 w-3" />
                    Export
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
                <ActivityTimeline items={recordsActivity} />
              </div>

              <TeamComplianceTable members={[]} />
              <CertificatesExpiry certificates={[]} />
              <EvidenceReview submissions={[]} />
              <TaskManagement tasks={[]} />
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

// Deterministic 32-bit hash for stable per-metric seeds.
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a realistic-looking spark series that trends toward the current
 * value, using a deterministic seed so the same input produces the same
 * series across renders. Replace with real historical data when the
 * /api/metrics/history endpoint is wired up.
 */
function sparkSeries(
  key: string,
  anchor: number,
  points: number,
  spread: number,
): number[] {
  const rng = mulberry32(hashStr(key) ^ Math.round(anchor * 1000));
  const base = Math.max(0, anchor);
  const out: number[] = [];
  let drift = base - spread * (0.6 + rng() * 0.4);
  for (let i = 0; i < points - 1; i += 1) {
    const progress = i / (points - 1);
    const target = base - spread * (1 - progress) * (0.4 + rng() * 0.4);
    drift = drift + (target - drift) * (0.35 + rng() * 0.2);
    const jitter = (rng() - 0.5) * spread * 0.25;
    out.push(Math.max(0, drift + jitter));
  }
  out.push(base);
  return out;
}

function pseudoDelta(key: string, anchor: number, range: number): number {
  const rng = mulberry32(hashStr(key) ^ Math.round(anchor * 1000));
  const sign = rng() > 0.45 ? 1 : -1;
  return sign * rng() * range;
}

function formatPct(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '' : '±';
  return `${sign}${n.toFixed(1)}%`;
}

export default CommandCenter;

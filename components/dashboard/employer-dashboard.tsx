'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  CheckCircle2,
  FileText,
  CheckSquare,
  ArrowRight,
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
import { QuickActions } from '@/components/dashboard/quick-actions';
import { getEntityLabel } from '@/components/dashboard/industry-labels';
import {
  AttentionRail,
  MobileReadinessCheckpoint,
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

interface EmployerDashboardProps {
  organizationId: string;
  organizationName: string;
  industry?: string | null;
  teamMemberCount?: number;
  complianceScore?: number;
  expiringCertsCount?: number;
  openTasksCount?: number;
}

interface ActivationMilestone {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  href: string;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).gtag) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag('event', 'industry_action_click', {
        step_id: stepId,
        step_label: stepLabel,
        industry,
        organization_id: organizationId,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Compliance Summary Cards */}
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

      {/* Primary row: Framework Health (wide) + My Actions (narrow) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-8">
          <ErrorBoundary name="FrameworkHealthWidget" level="component">
            <FrameworkHealthWidget />
          </ErrorBoundary>
        </div>
        <div className="lg:col-span-4 space-y-3">
          <MyActionsWidget />
          <UpcomingDeadlinesWidget />
        </div>
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

      {/* Quick-action cards */}
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

      <ComplianceIntelligenceSummary />
      <AIComplianceAssistantPanel suggestions={aiSuggestions} />

      {/* Compliance Score History with Trend Analytics */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Compliance Score History</h2>
        <ComplianceScoreHistory
          orgId={organizationId}
          frameworkSlug="all"
          days={30}
        />
      </div>

      <div data-tour="dashboard-overview">
        <h2 className="text-sm font-semibold mb-3">Organization Health</h2>
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

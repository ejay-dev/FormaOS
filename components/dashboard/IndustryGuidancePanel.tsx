'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getRoadmapForIndustry,
  type IndustryRoadmap,
} from '@/lib/onboarding/industry-roadmaps';
import {
  generateIndustryChecklist,
  getNextAction,
  type ChecklistCompletionCounts,
} from '@/lib/onboarding/industry-checklists';

type IndustryGuidancePanelProps = {
  industry: string;
  completionCounts: ChecklistCompletionCounts;
  complianceScore?: number;
  showFullRoadmap?: boolean;
  className?: string;
  isLoading?: boolean;
  onActionClickAction?: (stepId: string, stepLabel: string) => void;
};

type Status = 'operational' | 'advanced' | 'progressing' | 'started' | 'beginning';

const statusLabel: Record<Status, string> = {
  operational: 'Fully Operational',
  advanced: 'Advanced Setup',
  progressing: 'Making Progress',
  started: 'Getting Started',
  beginning: 'Beginning Journey',
};

const statusIcon: Record<Status, typeof CheckCircle2> = {
  operational: CheckCircle2,
  advanced: TrendingUp,
  progressing: Target,
  started: Clock,
  beginning: Clock,
};

function deriveInsights(
  complianceScore: number,
  completionCounts: ChecklistCompletionCounts,
): string[] {
  const messages: string[] = [];

  if (complianceScore < 50) {
    messages.push(
      'Compliance score needs attention — complete critical controls.',
    );
  } else if (complianceScore < 75) {
    messages.push(
      'Good progress on compliance — push toward 80% for audit readiness.',
    );
  } else if (complianceScore >= 90) {
    messages.push("Excellent compliance posture — you're audit-ready.");
  }

  if (completionCounts.frameworks === 0) {
    messages.push(
      'Activate your first compliance framework to unlock intelligence features.',
    );
  } else {
    messages.push(
      'Frameworks active — review control coverage in the framework library.',
    );
  }

  if (completionCounts.evidence === 0) {
    messages.push('Upload evidence to start building your compliance vault.');
  } else if (completionCounts.evidence < 10) {
    messages.push(
      'Continue uploading evidence to strengthen control coverage.',
    );
  } else if (completionCounts.evidence >= 50) {
    messages.push(
      'Strong evidence coverage — enable automation to maintain freshness.',
    );
  }

  if (completionCounts.members < 2) {
    messages.push('Invite team members to distribute compliance workload.');
  } else if (completionCounts.members >= 5) {
    messages.push(
      'Strong team collaboration — consider role-based access controls.',
    );
  }

  return messages;
}

export function IndustryGuidancePanel({
  industry,
  completionCounts,
  complianceScore = 0,
  showFullRoadmap = false,
  className = '',
  isLoading = false,
  onActionClickAction,
}: IndustryGuidancePanelProps) {
  const roadmap: IndustryRoadmap = useMemo(
    () => getRoadmapForIndustry(industry),
    [industry],
  );
  const checklist = useMemo(
    () => generateIndustryChecklist(industry),
    [industry],
  );
  const nextAction = useMemo(
    () => getNextAction(checklist, completionCounts),
    [checklist, completionCounts],
  );

  const progress = useMemo(() => {
    const completed = checklist.filter((item) =>
      item.completionCheck(completionCounts),
    ).length;
    const total = checklist.length;
    return {
      completed,
      total,
      percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  }, [checklist, completionCounts]);

  const status: Status = useMemo(() => {
    if (progress.percentage === 100) return 'operational';
    if (progress.percentage >= 75) return 'advanced';
    if (progress.percentage >= 50) return 'progressing';
    if (progress.percentage >= 25) return 'started';
    return 'beginning';
  }, [progress.percentage]);

  const insights = useMemo(
    () => deriveInsights(complianceScore, completionCounts),
    [complianceScore, completionCounts],
  );

  if (isLoading) {
    return (
      <div
        className={cn('space-y-3', className)}
        role="status"
        aria-label="Loading industry guidance"
      >
        <div className="animate-pulse rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-10 w-10 rounded-md bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcon[status];

  return (
    <div
      className={cn('space-y-3', className)}
      data-testid="industry-guidance-panel"
    >
      {/* Status Card */}
      <div
        className="rounded-lg border border-border bg-card p-5"
        data-testid="industry-status-card"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/40">
              <StatusIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                {roadmap.industryName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {statusLabel[status]}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-bold tabular-nums text-foreground">
              {progress.percentage}%
            </div>
            <div className="text-[11px] text-muted-foreground">
              {progress.completed} of {progress.total}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {/* Key Frameworks */}
        {roadmap.keyFrameworks.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {roadmap.keyFrameworks.map((framework) => (
              <span
                key={framework}
                className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {framework}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Next Action */}
      {nextAction && (
        <Link
          href={nextAction.href}
          onClick={() =>
            onActionClickAction?.(nextAction.id, nextAction.label)
          }
          data-testid="industry-next-action"
          className="group block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Next Recommended Action
              </div>
              <h4 className="mt-1 text-sm font-semibold text-foreground">
                {nextAction.label}
              </h4>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {nextAction.description}
              </p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />~{nextAction.estimatedMinutes}{' '}
                  min
                </span>
                {nextAction.automationTrigger && (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <Zap className="h-3 w-3" />
                    Auto-trigger enabled
                  </span>
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>
        </Link>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-1.5" data-testid="industry-insights">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Industry Insights
          </h4>
          {insights.map((insight, index) => (
            <div
              key={index}
              className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground"
            >
              {insight}
            </div>
          ))}
        </div>
      )}

      {/* View Full Roadmap CTA */}
      {showFullRoadmap && progress.percentage < 100 && (
        <Link
          href="/app/onboarding-roadmap"
          data-testid="industry-roadmap-cta"
          className="group block rounded-md border border-border bg-card px-4 py-2.5 text-center transition-colors hover:border-primary/40"
        >
          <span className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-foreground">
            View Complete {roadmap.industryName} Roadmap
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}

      {/* Completion */}
      {progress.percentage === 100 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Industry Onboarding Complete
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Your {roadmap.industryName.toLowerCase()} compliance infrastructure
            is fully operational.
          </p>
          <Link
            href="/app/compliance"
            className="mt-3 inline-flex rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40"
          >
            View Compliance Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for sidebar/widget use
 */
export function IndustryGuidanceWidget({
  industry,
  completionCounts,
}: {
  industry: string;
  completionCounts: ChecklistCompletionCounts;
}) {
  const checklist = useMemo(
    () => generateIndustryChecklist(industry),
    [industry],
  );
  const nextAction = useMemo(
    () => getNextAction(checklist, completionCounts),
    [checklist, completionCounts],
  );

  if (!nextAction) return null;

  return (
    <Link
      href={nextAction.href}
      className="group block rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/40"
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Next Step
      </div>
      <h4 className="mt-1 text-sm font-semibold text-foreground">
        {nextAction.label}
      </h4>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          ~{nextAction.estimatedMinutes} min
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
  );
}

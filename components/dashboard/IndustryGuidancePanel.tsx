/**
 * =========================================================
 * DASHBOARD INDUSTRY GUIDANCE PANEL
 * =========================================================
 * Contextual next-step recommendations based on industry
 * Shows progress, suggests actions, highlights automation opportunities
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  TrendingUp,
  Zap,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
} from 'lucide-react';
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
  onActionClickAction?: (stepId: string, stepLabel: string) => void; // Analytics tracking
};

export function IndustryGuidancePanel({
  industry,
  completionCounts,
  complianceScore = 0,
  showFullRoadmap = false,
  className = '',
  isLoading = false,
  onActionClickAction,
}: IndustryGuidancePanelProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={`space-y-4 ${className}`}
        role="status"
        aria-label="Loading industry guidance"
      >
        <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-12 w-12 rounded-xl bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-white/10" />
                <div className="h-3 w-24 rounded bg-white/10" />
              </div>
            </div>
            <div className="h-16 w-16 rounded-full bg-white/10" />
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-20 rounded-lg bg-white/5" />
            <div className="h-4 w-48 rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }
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

  // Calculate progress
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

  // Determine status
  const status = useMemo(() => {
    if (progress.percentage === 100) return 'operational';
    if (progress.percentage >= 75) return 'advanced';
    if (progress.percentage >= 50) return 'progressing';
    if (progress.percentage >= 25) return 'started';
    return 'beginning';
  }, [progress.percentage]);

  const statusConfig = {
    operational: {
      icon: CheckCircle2,
      text: 'Fully Operational',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    advanced: {
      icon: TrendingUp,
      text: 'Advanced Setup',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    progressing: {
      icon: Target,
      text: 'Making Progress',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
    started: {
      icon: Clock,
      text: 'Getting Started',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
    },
    beginning: {
      icon: Sparkles,
      text: 'Beginning Journey',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  // Get industry-specific insights
  const insights = useMemo(() => {
    const messages: string[] = [];

    // Compliance score insights
    if (complianceScore < 50) {
      messages.push(
        '⚠️ Compliance score needs attention - complete critical controls',
      );
    } else if (complianceScore < 75) {
      messages.push(
        '📈 Good progress on compliance - push towards 80% for audit readiness',
      );
    } else if (complianceScore >= 90) {
      messages.push("✅ Excellent compliance posture - you're audit-ready");
    }

    // Framework insights
    if (completionCounts.frameworks === 0) {
      messages.push(
        '🔒 Activate your first compliance framework to unlock intelligence features',
      );
    } else {
      messages.push(
        '🎯 Frameworks active - review control coverage in the framework library',
      );
    }

    // Evidence insights
    if (completionCounts.evidence === 0) {
      messages.push(
        '📁 Upload evidence to start building your compliance vault',
      );
    } else if (completionCounts.evidence < 10) {
      messages.push(
        '📂 Continue uploading evidence to strengthen control coverage',
      );
    } else if (completionCounts.evidence >= 50) {
      messages.push(
        '🏆 Strong evidence coverage - enable automation to maintain freshness',
      );
    }

    // Team insights
    if (completionCounts.members < 2) {
      messages.push('👥 Invite team members to distribute compliance workload');
    } else if (completionCounts.members >= 5) {
      messages.push(
        '✨ Strong team collaboration - consider role-based access controls',
      );
    }

    return messages;
  }, [complianceScore, completionCounts, roadmap.keyFrameworks.length]);

  return (
    <div
      className={`space-y-4 ${className}`}
      data-testid="industry-guidance-panel"
    >
      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative overflow-hidden rounded-2xl border ${currentStatus.borderColor} ${currentStatus.bgColor} p-6`}
        data-testid="industry-status-card"
      >
        {/* Background Glow */}
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl border ${currentStatus.borderColor} ${currentStatus.bgColor}`}
              >
                <StatusIcon className={`h-6 w-6 ${currentStatus.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {roadmap.industryName}
                </h3>
                <p className={`text-sm font-medium ${currentStatus.color}`}>
                  {currentStatus.text}
                </p>
              </div>
            </div>

            {/* Progress Ring (Desktop) */}
            <div className="hidden sm:block">
              <div className="relative h-16 w-16">
                <svg className="h-16 w-16 -rotate-90 transform">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-white/10"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress.percentage / 100)}`}
                    className={currentStatus.color}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {progress.percentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar (Mobile) */}
          <div className="mt-4 sm:hidden">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>
                {progress.completed} of {progress.total} completed
              </span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className={`h-2 rounded-full ${currentStatus.color} transition-all duration-500`}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Key Frameworks */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {roadmap.keyFrameworks.map((framework) => (
              <span
                key={framework}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400"
              >
                {framework}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Next Action */}
      {nextAction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          data-testid="industry-next-action"
        >
          <Link
            href={nextAction.href}
            onClick={() =>
              onActionClickAction?.(nextAction.id, nextAction.label)
            }
          >
            <div className="group rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:border-white/20 hover:bg-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Next Recommended Action</span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">
                    {nextAction.label}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {nextAction.description}
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />~
                      {nextAction.estimatedMinutes} min
                    </span>
                    {nextAction.automationTrigger && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-cyan-500">
                          <Zap className="h-3 w-3" />
                          Auto-trigger enabled
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <ArrowRight className="h-5 w-5 text-gray-500 transition-all group-hover:translate-x-1 group-hover:text-cyan-400" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-2"
          data-testid="industry-insights"
        >
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Industry Insights
          </h4>
          {insights.map((insight, index) => (
            <div
              key={index}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400"
            >
              {insight}
            </div>
          ))}
        </motion.div>
      )}

      {/* View Full Roadmap CTA */}
      {showFullRoadmap && progress.percentage < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          data-testid="industry-roadmap-cta"
        >
          <Link href="/app/onboarding-roadmap">
            <div className="group rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-center transition-all hover:border-cyan-500/30 hover:bg-cyan-500/10">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-cyan-400">
                <span>View Complete {roadmap.industryName} Roadmap</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Completion Celebration */}
      {progress.percentage === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 text-center"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-white">
            Industry Onboarding Complete! 🎉
          </h3>
          <p className="mt-2 text-sm text-gray-400">
            Your {roadmap.industryName.toLowerCase()} compliance infrastructure
            is fully operational.
          </p>
          <Link href="/app/compliance">
            <button className="mt-4 rounded-lg bg-green-500/20 px-4 py-2 text-sm font-medium text-green-400 transition-all hover:bg-green-500/30">
              View Compliance Dashboard
            </button>
          </Link>
        </motion.div>
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
    <Link href={nextAction.href}>
      <div className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
          <Zap className="h-3 w-3" />
          <span>Next Step</span>
        </div>
        <h4 className="text-sm font-semibold text-white mb-1">
          {nextAction.label}
        </h4>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500">
            ~{nextAction.estimatedMinutes} min
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-gray-500 transition-all group-hover:translate-x-1 group-hover:text-cyan-400" />
        </div>
      </div>
    </Link>
  );
}

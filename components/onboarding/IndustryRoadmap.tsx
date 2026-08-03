/**
 * =========================================================
 * INDUSTRY ROADMAP ENGINE COMPONENT
 * =========================================================
 * Premium enterprise onboarding roadmap with visual progress
 * Adapts to selected industry and guides users through compliance activation
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Heart,
  Baby,
  Users,
  DollarSign,
  Code,
  Building,
  Settings,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import {
  type IndustryRoadmap,
  type RoadmapPhase,
  type RoadmapStep,
} from '@/lib/onboarding/industry-roadmaps';
import {
  trackCustomMetric,
  CUSTOM_METRICS,
} from '@/lib/monitoring/performance-monitor';

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  Heart,
  Baby,
  Users,
  DollarSign,
  Code,
  Building,
  Settings,
  Shield,
  TrendingUp,
  AlertTriangle,
  Zap,
  CheckCircle2,
};

type IndustryRoadmapProps = {
  roadmap: IndustryRoadmap;
  completedSteps?: string[];
  onStepClickAction?: (stepId: string) => void;
  showEstimates?: boolean;
  compact?: boolean;
};

export function IndustryRoadmapEngine({
  roadmap,
  completedSteps = [],
  onStepClickAction,
  showEstimates = true,
  compact = false,
}: IndustryRoadmapProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set([roadmap.phases[0]?.id]),
  );

  const IndustryIcon = ICON_MAP[roadmap.icon] || Settings;

  // Track component mount and render performance
  useEffect(() => {
    const renderStartTime = performance.now();

    // Measure render time after paint
    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStartTime;
      trackCustomMetric(CUSTOM_METRICS.ROADMAP_RENDER, renderTime, {
        industry: roadmap.industryId,
        phase_count: roadmap.phases.length,
        completed_steps: completedSteps.length,
      });
    });
  }, [roadmap.industryId, roadmap.phases.length, completedSteps.length]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPhases(new Set(roadmap.phases.map((p) => p.id)));
  };

  const collapseAll = () => {
    setExpandedPhases(new Set([roadmap.phases[0]?.id]));
  };

  const progressStats = useMemo(() => {
    const totalSteps = roadmap.phases.reduce(
      (sum, phase) => sum + phase.steps.length,
      0,
    );
    const completed = completedSteps.length;
    const progress =
      totalSteps === 0 ? 0 : Math.round((completed / totalSteps) * 100);
    return { totalSteps, completed, progress };
  }, [roadmap, completedSteps]);

  return (
    <div className="space-y-6" data-testid="industry-roadmap">
      {/* Header */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8"
          data-testid="industry-roadmap-header"
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-edge-2 bg-surface-1">
                  <IndustryIcon className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {roadmap.industryName}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {roadmap.tagline}
                  </p>

                  {showEstimates && (
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {roadmap.estimatedTimeToOperational} to operational
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        <span>{roadmap.keyFrameworks.length} frameworks</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Ring */}
              {!compact && (
                <div
                  className="hidden sm:block"
                  data-testid="industry-roadmap-desktop-progress"
                >
                  <div className="relative h-20 w-20">
                    <svg className="h-20 w-20 -rotate-90 transform">
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-border"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 34}`}
                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressStats.progress / 100)}`}
                        className="text-primary transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-foreground tabular-nums">
                        {progressStats.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar (Mobile) */}
            {!compact && (
              <div
                className="mt-6 sm:hidden"
                data-testid="industry-roadmap-mobile-progress"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 tabular-nums">
                  <span>
                    {progressStats.completed} of {progressStats.totalSteps}{' '}
                    completed
                  </span>
                  <span>{progressStats.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressStats.progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-2 rounded-full bg-primary"
                  />
                </div>
              </div>
            )}

            {/* Expand/Collapse Controls */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={expandAll}
                className="rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Expand All
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                onClick={collapseAll}
                className="rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Collapse All
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Phases */}
      <div className="space-y-4">
        {roadmap.phases.map((phase, phaseIndex) => (
          <RoadmapPhaseCard
            key={phase.id}
            phase={phase}
            phaseNumber={phaseIndex + 1}
            isExpanded={expandedPhases.has(phase.id)}
            onToggle={() => togglePhase(phase.id)}
            completedSteps={completedSteps}
            onStepClickAction={onStepClickAction}
            showEstimates={showEstimates}
          />
        ))}
      </div>

      {/* Completion Message */}
      {progressStats.progress === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-success/20 bg-success/10 p-6 text-center"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Roadmap Complete! 🎉</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You've completed all onboarding steps. Your organization is now
            fully operational.
          </p>
        </motion.div>
      )}
    </div>
  );
}

type RoadmapPhaseCardProps = {
  phase: RoadmapPhase;
  phaseNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
  completedSteps: string[];
  onStepClickAction?: (stepId: string) => void;
  showEstimates: boolean;
};

function RoadmapPhaseCard({
  phase,
  phaseNumber,
  isExpanded,
  onToggle,
  completedSteps,
  onStepClickAction,
  showEstimates,
}: RoadmapPhaseCardProps) {
  const phaseProgress = useMemo(() => {
    const completed = phase.steps.filter((s) =>
      completedSteps.includes(s.id),
    ).length;
    const total = phase.steps.length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, progress };
  }, [phase, completedSteps]);

  const isComplete = phaseProgress.progress === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-xl border border-border bg-surface-1"
      data-testid={`industry-roadmap-phase-${phase.id}`}
    >
      {/* Phase Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Phase Number */}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold tabular-nums ${
                isComplete
                  ? 'border-success/20 bg-success/10 text-success'
                  : 'border-edge-2 bg-surface-1 text-muted-foreground'
              }`}
            >
              {isComplete ? <CheckCircle2 className="h-5 w-5" /> : phaseNumber}
            </div>

            {/* Phase Info */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">
                {phase.title}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {phase.description}
              </p>

              {showEstimates && (
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
                  <span>~{phase.estimatedDays} days</span>
                  <span>•</span>
                  <span>{phase.steps.length} steps</span>
                  {phaseProgress.progress > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-primary">
                        {phaseProgress.completed}/{phaseProgress.total} complete
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expand Icon */}
          <div className="flex items-center gap-3">
            {/* Progress Badge */}
            {phaseProgress.progress > 0 && phaseProgress.progress < 100 && (
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary tabular-nums">
                {phaseProgress.progress}%
              </div>
            )}

            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {/* Phase Steps */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-edge-2"
          >
            <div className="space-y-2 p-4">
              {phase.steps.map((step) => (
                <RoadmapStepCard
                  key={step.id}
                  step={step}
                  isCompleted={completedSteps.includes(step.id)}
                  onClickAction={onStepClickAction}
                  showEstimates={showEstimates}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type RoadmapStepCardProps = {
  step: RoadmapStep;
  isCompleted: boolean;
  onClickAction?: (stepId: string) => void;
  showEstimates: boolean;
};

function RoadmapStepCard({
  step,
  isCompleted,
  onClickAction,
  showEstimates,
}: RoadmapStepCardProps) {
  const priorityColors = {
    critical: 'border-destructive/20 bg-destructive/10 text-destructive',
    high: 'border-warning/20 bg-warning/10 text-warning',
    medium: 'border-warning/20 bg-warning/10 text-warning',
    low: 'border-border bg-muted text-muted-foreground',
  };

  const handleClick = () => {
    if (onClickAction) {
      onClickAction(step.id);
    }
  };

  return (
    <Link
      href={step.ctaHref}
      onClick={handleClick}
      data-testid={`industry-roadmap-step-${step.id}`}
    >
      <motion.div
        whileHover={{ x: 4 }}
        className={`group rounded-lg border p-4 transition-all ${
          isCompleted
            ? 'border-success/20 bg-success/10'
            : 'border-border bg-surface-1 hover:border-edge-2 hover:bg-surface-2'
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Completion Indicator */}
          <div className="mt-1">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            )}
          </div>

          {/* Step Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4
                  className={`text-sm font-semibold ${isCompleted ? 'text-muted-foreground' : 'text-foreground'}`}
                >
                  {step.title}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>

                {showEstimates && (
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />~{step.estimatedMinutes} min
                    </span>
                    {step.automationTrigger && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-primary">
                          <Zap className="h-3 w-3" />
                          Auto-trigger
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Priority Badge */}
              <div
                className={`rounded border px-2 py-1 text-xs font-medium capitalize ${priorityColors[step.priority]}`}
              >
                {step.priority}
              </div>
            </div>

            {/* CTA */}
            {!isCompleted && (
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-primary group-hover:text-primary/80">
                <span>{step.cta}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

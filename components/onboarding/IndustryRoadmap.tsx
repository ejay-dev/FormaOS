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
const ICON_MAP: Record<string, React.ComponentType<any>> = {
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
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8"
          data-testid="industry-roadmap-header"
        >
          {/* Background Glow */}
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/20 bg-white/5">
                  <IndustryIcon className="h-7 w-7 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {roadmap.industryName}
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {roadmap.tagline}
                  </p>

                  {showEstimates && (
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
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
                        className="text-white/10"
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
                        className="text-cyan-400 transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
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
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>
                    {progressStats.completed} of {progressStats.totalSteps}{' '}
                    completed
                  </span>
                  <span>{progressStats.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressStats.progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Expand/Collapse Controls */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={expandAll}
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
              >
                Expand All
              </button>
              <span className="text-gray-600">•</span>
              <button
                onClick={collapseAll}
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
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
          className="rounded-2xl border border-green-500/20 bg-green-500/10 p-6 text-center"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Roadmap Complete! 🎉</h3>
          <p className="mt-2 text-sm text-gray-400">
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
      className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
      data-testid={`industry-roadmap-phase-${phase.id}`}
    >
      {/* Phase Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Phase Number */}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold ${
                isComplete
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-white/20 bg-white/5 text-gray-400'
              }`}
            >
              {isComplete ? <CheckCircle2 className="h-5 w-5" /> : phaseNumber}
            </div>

            {/* Phase Info */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                {phase.title}
              </h3>
              <p className="mt-0.5 text-sm text-gray-400">
                {phase.description}
              </p>

              {showEstimates && (
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  <span>~{phase.estimatedDays} days</span>
                  <span>•</span>
                  <span>{phase.steps.length} steps</span>
                  {phaseProgress.progress > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-cyan-400">
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
              <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
                {phaseProgress.progress}%
              </div>
            )}

            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
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
            className="border-t border-white/10"
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
    critical: 'border-red-500/30 bg-red-500/5 text-red-400',
    high: 'border-orange-500/30 bg-orange-500/5 text-orange-400',
    medium: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
    low: 'border-gray-500/30 bg-gray-500/5 text-gray-400',
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
            ? 'border-green-500/20 bg-green-500/5'
            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Completion Indicator */}
          <div className="mt-1">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <Circle className="h-5 w-5 text-gray-500 group-hover:text-gray-400" />
            )}
          </div>

          {/* Step Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4
                  className={`text-sm font-semibold ${isCompleted ? 'text-gray-400' : 'text-white'}`}
                >
                  {step.title}
                </h4>
                <p className="mt-1 text-xs text-gray-500">{step.description}</p>

                {showEstimates && (
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />~{step.estimatedMinutes} min
                    </span>
                    {step.automationTrigger && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-cyan-500">
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
                className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider border ${priorityColors[step.priority]}`}
              >
                {step.priority}
              </div>
            </div>

            {/* CTA */}
            {!isCompleted && (
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-cyan-400 group-hover:text-cyan-300">
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

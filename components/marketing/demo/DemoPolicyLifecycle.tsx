'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  FileText, Eye, CheckCircle, BookOpen, Users,
  ArrowRight, Clock, PenLine,
} from 'lucide-react';
import { easing, duration } from '@/config/motion';

/**
 * DemoPolicyLifecycle — Animated policy document lifecycle:
 * Draft → Review → Approved → Published → Acknowledged
 * Props-driven content for theming per use-case.
 */

interface LifecycleStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  meta: string;
  color: string;
  bg: string;
  border: string;
}

const defaultSteps: LifecycleStep[] = [
  {
    id: 'draft',
    label: 'Draft',
    icon: PenLine,
    title: 'Policy Drafted',
    detail: 'Clinical Governance Policy v3.2',
    meta: 'Author: Dr Sarah Chen • Created 14 Jan 2026',
    color: 'text-slate-400',
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/20',
  },
  {
    id: 'review',
    label: 'Review',
    icon: Eye,
    title: 'Under Review',
    detail: 'Assigned to Compliance Team for review',
    meta: '2 reviewers • Comments: 3 • Due: 21 Jan 2026',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/20',
  },
  {
    id: 'approved',
    label: 'Approved',
    icon: CheckCircle,
    title: 'Policy Approved',
    detail: 'All reviewers signed off',
    meta: 'Approved by: Chief Medical Officer • 19 Jan 2026',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/20',
  },
  {
    id: 'published',
    label: 'Published',
    icon: BookOpen,
    title: 'Published to Staff',
    detail: 'Available in policy library',
    meta: 'Version 3.2 live • Previous archived',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/20',
  },
  {
    id: 'acknowledged',
    label: 'Acknowledged',
    icon: Users,
    title: 'Staff Acknowledgment',
    detail: '47/52 staff acknowledged',
    meta: '90% completion • 5 reminders pending',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/20',
  },
];

interface DemoPolicyLifecycleProps {
  steps?: LifecycleStep[];
  stepDuration?: number;
  glowColor?: string;
}

export default function DemoPolicyLifecycle({
  steps = defaultSteps,
  stepDuration = 2800,
  glowColor = 'from-blue-500/15 to-purple-500/15',
}: DemoPolicyLifecycleProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, stepDuration);
    return () => clearInterval(timer);
  }, [prefersReducedMotion, steps.length, stepDuration]);

  const handleClick = useCallback((i: number) => setActiveStep(i), []);

  return (
    <div className="relative">
      <div className={`absolute -inset-px rounded-2xl bg-gradient-to-b ${glowColor} blur-sm`} />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0b1022] p-4 sm:p-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Policy Lifecycle</span>
          </div>
          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] text-blue-400 font-medium">
            Version Controlled
          </span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0.5 sm:gap-1 mb-5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === activeStep;
            const isPast = i < activeStep;

            return (
              <div key={step.id} className="flex items-center flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleClick(i)}
                  aria-label={`Show ${step.label} stage`}
                  className={`
                    flex items-center gap-1 sm:gap-1.5 rounded-full px-1.5 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-medium transition-all w-full justify-center
                    ${isActive ? `${step.bg} ${step.color} border ${step.border}` :
                      isPast ? 'bg-white/[0.04] text-emerald-400' : 'bg-white/[0.02] text-slate-600'}
                  `}
                >
                  <Icon className="h-3 w-3 flex-shrink-0" />
                  <span className="sr-only">{step.label}</span>
                  <span className="hidden sm:inline truncate">{step.label}</span>
                </button>
                {i < steps.length - 1 && (
                  <ArrowRight className={`h-2.5 w-2.5 mx-0.5 flex-shrink-0 ${i < activeStep ? 'text-emerald-500/40' : 'text-white/[0.06]'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Active card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: duration.normal, ease: easing.signature }}
          >
            {(() => {
              const step = steps[activeStep];
              const Icon = step.icon;
              return (
                <div className={`rounded-xl border ${step.border} ${step.bg.replace('/15', '/[0.06]')} p-3 sm:p-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg ${step.bg} flex items-center justify-center`}>
                        <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${step.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[11px] sm:text-xs font-semibold ${step.color}`}>{step.title}</p>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">{step.detail}</p>
                      </div>
                    </div>
                    <div className={`hidden sm:flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${step.bg} ${step.color}`}>
                      {activeStep === steps.length - 1 ? <CheckCircle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                      {activeStep === steps.length - 1 ? 'Complete' : `${activeStep + 1}/${steps.length}`}
                    </div>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 pl-9 sm:pl-10">{step.meta}</p>
                </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

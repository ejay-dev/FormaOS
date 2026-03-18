'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { easing, duration } from '@/config/motion';

/**
 * DemoWorkflowTimeline — Generic animated workflow step card.
 * Fully props-driven: pass steps with icons, labels, colors.
 * Used across marketing pages for lifecycle visualizations.
 */

export interface WorkflowStep {
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

interface DemoWorkflowTimelineProps {
  steps: WorkflowStep[];
  stepDuration?: number;
  glowColor?: string;
  /** Optional bottom card content */
  bottomCard?: React.ReactNode;
}

export default function DemoWorkflowTimeline({
  steps,
  stepDuration = 2800,
  glowColor = 'from-cyan-500/15 to-blue-500/15',
  bottomCard,
}: DemoWorkflowTimelineProps) {
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
        {/* Step circles */}
        <div className="flex items-center gap-2 mb-5">
          {steps.map((step, i) => {
            const isActive = i === activeStep;
            const isPast = i < activeStep;

            return (
              <button
                key={step.id}
                onClick={() => handleClick(i)}
                className="flex-1 flex flex-col items-center gap-1.5"
              >
                <div
                  className={`
                    h-8 w-8 rounded-full flex items-center justify-center transition-all
                    ${isActive ? `${step.bg} ring-2 ring-offset-1 ring-offset-[#0b1022] ${step.border.replace('border-', 'ring-')}` :
                      isPast ? 'bg-emerald-500/15' : 'bg-white/[0.04]'}
                  `}
                >
                  {isPast ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <step.icon className={`h-3.5 w-3.5 ${isActive ? step.color : 'text-slate-600'}`} />
                  )}
                </div>
                <span className={`text-[9px] font-medium ${isActive ? step.color : isPast ? 'text-emerald-400/60' : 'text-slate-600'}`}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active step card */}
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
              return (
                <div className={`rounded-xl border ${step.border} ${step.bg.replace('/15', '/[0.06]')} p-3 sm:p-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg ${step.bg} flex items-center justify-center`}>
                        <step.icon className={`h-3.5 w-3.5 ${step.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold ${step.color}`}>{step.title}</p>
                        <p className="text-[11px] text-slate-400">{step.detail}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 pl-10">{step.meta}</p>
                </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>

        {bottomCard}
      </div>
    </div>
  );
}

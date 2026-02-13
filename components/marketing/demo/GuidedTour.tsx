'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, Building2, Zap, Eye, Shield, Sparkles } from 'lucide-react';
import { easing, duration } from '@/config/motion';
import { trackDemoEvent } from './demo-analytics';
import type { PhaseId } from './phase-demo-data';

// ---------------------------------------------------------------------------
// Tour Step Data
// ---------------------------------------------------------------------------

export interface TourStep {
  phase: PhaseId;
  title: string;
  description: string;
  outcome: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TOUR_STEPS: TourStep[] = [
  {
    phase: 'structure',
    title: 'Model Your Organisation',
    description: 'Select compliance frameworks, map controls to obligations, define ownership, and establish your governance baseline.',
    outcome: 'Your compliance foundation becomes structured, governed, and audit-ready by design.',
    icon: Building2,
  },
  {
    phase: 'operationalize',
    title: 'Execute Automatically',
    description: 'Workflow triggers fire automatically on evidence expiry, control failures, and task deadlines. Tasks auto-assign to the right people.',
    outcome: 'Compliance becomes part of daily operations, not a separate burden.',
    icon: Zap,
  },
  {
    phase: 'validate',
    title: 'Verify Continuously',
    description: 'Controls are verified in real-time against evidence. Deviations trigger alerts immediately. Risk indicators update live.',
    outcome: "You don't wait for audits to discover issues. You see them as they happen.",
    icon: Eye,
  },
  {
    phase: 'defend',
    title: 'Prove Instantly',
    description: 'Generate audit-ready report packs with full traceability. Every control, evidence item, and action is documented and defensible.',
    outcome: 'Audits become confirmations, not investigations.',
    icon: Shield,
  },
];

// ---------------------------------------------------------------------------
// Tour Overlay
// ---------------------------------------------------------------------------

interface GuidedTourProps {
  isActive: boolean;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onDismiss: () => void;
  onGoToPhase: (phase: PhaseId) => void;
}

export function GuidedTourOverlay({
  isActive,
  currentStep,
  onNext,
  onPrev,
  onDismiss,
  onGoToPhase,
}: GuidedTourProps) {
  const step = TOUR_STEPS[currentStep];
  if (!step) return null;

  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 z-50 flex items-end justify-center p-3 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Semi-transparent overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onDismiss} />

          {/* Tour card */}
          <motion.div
            className="relative z-10 w-full max-w-lg rounded-2xl bg-[#0d1225] border border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.95 }}
            transition={{ duration: duration.normal, ease: easing.signature }}
            key={currentStep}
          >
            {/* Progress bar */}
            <div className="flex h-1 bg-white/[0.04]">
              {TOUR_STEPS.map((_, i) => (
                <div key={i} className="flex-1" style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                  {i <= currentStep && (
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      initial={{ width: i < currentStep ? '100%' : '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Step {currentStep + 1} of {TOUR_STEPS.length}
                    </div>
                    <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    trackDemoEvent({ type: 'demo_tour_dismissed', step: currentStep });
                    onDismiss();
                  }}
                  className="h-6 w-6 rounded-md flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                >
                  <X className="h-3 w-3 text-slate-400" />
                </button>
              </div>

              {/* Description */}
              <p className="text-[12px] text-slate-400 leading-relaxed mb-3">{step.description}</p>

              {/* Outcome */}
              <div className="rounded-lg bg-gradient-to-r from-cyan-500/[0.06] to-blue-500/[0.04] border border-cyan-500/10 p-3 mb-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">Outcome</span>
                </div>
                <p className="text-[11px] text-slate-300">{step.outcome}</p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={isFirst}
                  className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                    isFirst ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowLeft className="h-3 w-3" /> Previous
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onGoToPhase(step.phase);
                    trackDemoEvent({ type: 'demo_tour_step', step: currentStep, total: TOUR_STEPS.length });
                  }}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View in demo →
                </button>

                {isLast ? (
                  <button
                    type="button"
                    onClick={() => {
                      trackDemoEvent({ type: 'demo_tour_completed' });
                      onDismiss();
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                  >
                    <Sparkles className="h-3 w-3" /> Finish Tour
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      trackDemoEvent({ type: 'demo_tour_step', step: currentStep, total: TOUR_STEPS.length });
                      onNext();
                    }}
                    className="flex items-center gap-1 rounded-lg bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/[0.1] transition-colors"
                  >
                    Next <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

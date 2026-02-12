'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  LineChart,
  BarChart3,
  PieChart,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { easing, duration } from '@/config/motion';

// ---------------------------------------------------------------------------
// Scenario: Generate a board-ready compliance report in minutes, not days
// ---------------------------------------------------------------------------

interface ScenarioStep {
  id: string;
  phase: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  screenContent: React.ReactNode;
}

const transition = { duration: duration.normal, ease: easing.signature };
const fadeVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

/* ---------- Mock screen fragments ---------- */

function MockFrameworkSelector() {
  const frameworks = [
    { name: 'ISO 27001', controls: 114, compliant: 98, selected: true },
    { name: 'SOC 2', controls: 64, compliant: 58, selected: true },
    { name: 'HIPAA', controls: 42, compliant: 36, selected: false },
  ];

  return (
    <div className="space-y-1.5 text-[10px]">
      {frameworks.map((fw) => (
        <div
          key={fw.name}
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
            fw.selected
              ? 'border-cyan-400/20 bg-cyan-500/10'
              : 'border-white/[0.06] bg-white/[0.02]'
          }`}
        >
          <div
            className={`h-3.5 w-3.5 rounded border ${
              fw.selected
                ? 'border-cyan-400 bg-cyan-400'
                : 'border-slate-600 bg-transparent'
            } flex items-center justify-center`}
          >
            {fw.selected && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
          </div>
          <span
            className={
              fw.selected ? 'text-white font-medium' : 'text-slate-400'
            }
          >
            {fw.name}
          </span>
          <span className="ml-auto text-slate-500">
            {fw.compliant}/{fw.controls} controls
          </span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
              fw.compliant / fw.controls > 0.85
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {Math.round((fw.compliant / fw.controls) * 100)}%
          </span>
        </div>
      ))}
      <p className="text-[10px] text-slate-500 mt-2">
        2 frameworks selected for board report
      </p>
    </div>
  );
}

function MockPostureSummary() {
  return (
    <div className="space-y-3">
      {/* Score ring mock */}
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="currentColor"
              className="text-white/[0.06]"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="currentColor"
              className="text-cyan-400"
              strokeWidth="3"
              strokeDasharray={`${87 * 0.975} 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white">87%</span>
            <span className="text-[8px] text-slate-500">Overall</span>
          </div>
        </div>
        <div className="space-y-1 text-[10px]">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Compliant controls</span>
            <span className="text-white font-medium">156</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-slate-300">Partially compliant</span>
            <span className="text-white font-medium">16</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-slate-300">Non-compliant</span>
            <span className="text-white font-medium">6</span>
          </div>
        </div>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-1.5 text-[10px]">
        <TrendingUp className="h-3 w-3 text-emerald-400" />
        <span className="text-emerald-200">
          +4.2% improvement vs last quarter
        </span>
      </div>
    </div>
  );
}

function MockRiskHeatmap() {
  const risks = [
    { category: 'Access Control', level: 'low', score: 2 },
    { category: 'Data Protection', level: 'medium', score: 5 },
    { category: 'Incident Response', level: 'low', score: 3 },
    { category: 'Vendor Management', level: 'high', score: 8 },
    { category: 'Business Continuity', level: 'medium', score: 6 },
    { category: 'Physical Security', level: 'low', score: 1 },
  ];

  const levelColor: Record<string, string> = {
    low: 'bg-emerald-500/30 border-emerald-400/20 text-emerald-300',
    medium: 'bg-amber-500/30 border-amber-400/20 text-amber-300',
    high: 'bg-red-500/30 border-red-400/20 text-red-300',
  };

  return (
    <div className="space-y-1.5 text-[10px]">
      {risks.map((r) => (
        <div
          key={r.category}
          className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5"
        >
          <span className="flex-1 text-slate-300">{r.category}</span>
          <div className="w-24 h-1.5 rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full ${
                r.level === 'low'
                  ? 'bg-emerald-400'
                  : r.level === 'medium'
                    ? 'bg-amber-400'
                    : 'bg-red-400'
              }`}
              style={{ width: `${r.score * 10}%` }}
            />
          </div>
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${levelColor[r.level]}`}
          >
            {r.level}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2">
        <AlertTriangle className="h-3 w-3 text-amber-400" />1 risk area flagged
        for board attention: Vendor Management
      </div>
    </div>
  );
}

function MockBoardExport() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-xs">
        <div className="flex items-center gap-2 text-cyan-300 font-medium">
          <BarChart3 className="h-3.5 w-3.5" />
          Board Report — Q1 FY26
        </div>
        <p className="mt-1 text-[10px] text-slate-400">
          Executive summary generated with live data as of 12 Feb 2026
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-lg bg-white/[0.04] px-2 py-2">
          <span className="text-slate-500">Pages</span>
          <p className="font-semibold text-white">12</p>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-2">
          <span className="text-slate-500">Frameworks</span>
          <p className="font-semibold text-white">ISO + SOC 2</p>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-2">
          <span className="text-slate-500">Format</span>
          <p className="font-semibold text-cyan-300">PDF + slides</p>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-2">
          <span className="text-slate-500">Generated in</span>
          <p className="font-semibold text-emerald-300">4.2 sec</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 rounded-lg bg-cyan-500/20 border border-cyan-400/30 px-3 py-1.5 text-[10px] text-cyan-200 font-medium">
          Download PDF
        </button>
        <button className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 text-[10px] text-slate-300 font-medium">
          Export Slides
        </button>
      </div>

      <p className="text-[10px] text-slate-500 text-center">
        Traditional board prep: 2–3 days → FormaOS: under 5 minutes
      </p>
    </div>
  );
}

/* ---------- Steps ---------- */

const STEPS: ScenarioStep[] = [
  {
    id: 'select',
    phase: 'Step 1',
    title: 'Select scope',
    description:
      'Choose which frameworks and business units to include. Coverage percentages update in real time.',
    icon: PieChart,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/20',
    screenContent: <MockFrameworkSelector />,
  },
  {
    id: 'posture',
    phase: 'Step 2',
    title: 'Review compliance posture',
    description:
      'Live posture data is pulled from your controls, evidence, and tasks — not manually assembled.',
    icon: LineChart,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/20',
    screenContent: <MockPostureSummary />,
  },
  {
    id: 'risks',
    phase: 'Step 3',
    title: 'Highlight risk areas',
    description:
      'Risk heatmap surfaces areas needing board attention. Trend data shows quarter-over-quarter movement.',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/20',
    screenContent: <MockRiskHeatmap />,
  },
  {
    id: 'export',
    phase: 'Step 4',
    title: 'Export board report',
    description:
      'One-click export to PDF or slide deck. Executive summary is auto-generated from live posture data.',
    icon: BarChart3,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/20',
    screenContent: <MockBoardExport />,
  },
];

export default function BoardReportScenario() {
  const prefersReducedMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg border border-purple-400/20 bg-purple-500/10 p-2">
          <LineChart className="h-5 w-5 text-purple-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">
            Board Report Generation
          </h3>
          <p className="text-xs text-slate-400">
            From live data to executive-ready report
          </p>
        </div>
      </div>

      {/* Progress rail */}
      <div
        className="mb-6 flex items-center gap-1"
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
      >
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrentStep(i)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentStep ? 'bg-purple-400' : 'bg-white/10'
            }`}
            aria-label={`Go to ${s.phase}: ${s.title}`}
          />
        ))}
      </div>

      {/* Content area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          variants={fadeVariants}
          initial={prefersReducedMotion ? false : 'enter'}
          animate="center"
          exit={prefersReducedMotion ? undefined : 'exit'}
          transition={transition}
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full ${step.bg} border ${step.border} px-2.5 py-1 text-[10px] font-semibold ${step.color}`}
            >
              <Icon className="h-3 w-3" />
              {step.phase}
            </span>
            <h4 className="text-sm font-semibold text-white">{step.title}</h4>
          </div>

          <p className="mb-4 text-xs text-slate-400 leading-relaxed">
            {step.description}
          </p>

          <div className="rounded-xl border border-white/[0.08] bg-marketing-bg p-3">
            {step.screenContent}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous step"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>

        <span className="text-[10px] text-slate-500">
          {currentStep + 1} / {STEPS.length}
        </span>

        <button
          onClick={goNext}
          disabled={currentStep === STEPS.length - 1}
          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/20 border border-purple-400/30 px-3 py-1.5 text-xs text-purple-200 transition-colors hover:bg-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next step"
        >
          Next
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

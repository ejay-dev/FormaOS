'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ShieldCheck,
  FileText,
  Link2,
  CheckCircle2,
  Send,
  ArrowRight,
  ArrowLeft,
  Clock,
  Paperclip,
} from 'lucide-react';
import { easing, duration } from '@/config/motion';

// ---------------------------------------------------------------------------
// Scenario: External auditor sends an audit request → org responds in one flow
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

function MockNotification() {
  return (
    <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-xs">
      <div className="flex items-center gap-2 text-cyan-300 font-medium">
        <ShieldCheck className="h-3.5 w-3.5" />
        New audit request from BDO Australia
      </div>
      <p className="mt-1 text-slate-400">
        ISO 27001 Surveillance Audit — 14 controls requested
      </p>
      <div className="mt-2 flex gap-2">
        <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-200">
          14 controls
        </span>
        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">
          Due: 21 Feb 2026
        </span>
      </div>
    </div>
  );
}

function MockEvidenceMap() {
  const controls = [
    {
      id: 'A.5.1',
      name: 'Information Security Policy',
      evidence: 3,
      linked: true,
    },
    {
      id: 'A.6.1',
      name: 'Organisation of Information Security',
      evidence: 2,
      linked: true,
    },
    { id: 'A.8.2', name: 'Asset Classification', evidence: 1, linked: true },
    { id: 'A.9.1', name: 'Access Control Policy', evidence: 4, linked: true },
    {
      id: 'A.12.4',
      name: 'Logging and Monitoring',
      evidence: 2,
      linked: false,
    },
    { id: 'A.16.1', name: 'Incident Management', evidence: 0, linked: false },
  ];

  return (
    <div className="space-y-1.5 text-[10px]">
      {controls.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5"
        >
          <span className="font-mono text-slate-500 w-10">{c.id}</span>
          <span className="flex-1 text-slate-300 truncate">{c.name}</span>
          <span className="flex items-center gap-1 text-slate-500">
            <Paperclip className="h-2.5 w-2.5" />
            {c.evidence}
          </span>
          {c.linked ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          ) : (
            <Clock className="h-3 w-3 text-amber-400" />
          )}
        </div>
      ))}
    </div>
  );
}

function MockBundlePreview() {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
        <div className="flex items-center gap-2 text-emerald-300 text-xs font-medium">
          <FileText className="h-3.5 w-3.5" />
          Evidence Bundle — ISO 27001 Surveillance
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
            <span className="text-slate-500">Controls covered</span>
            <p className="font-semibold text-white">12 / 14</p>
          </div>
          <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
            <span className="text-slate-500">Evidence items</span>
            <p className="font-semibold text-white">23 files</p>
          </div>
          <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
            <span className="text-slate-500">Auto-linked</span>
            <p className="font-semibold text-emerald-300">18 (78%)</p>
          </div>
          <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
            <span className="text-slate-500">Gaps flagged</span>
            <p className="font-semibold text-amber-300">2 controls</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
        <Link2 className="h-3 w-3 text-cyan-400" />
        Secure share link generated — expires in 14 days
      </div>
    </div>
  );
}

function MockDelivery() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium">
            <Send className="h-3.5 w-3.5 text-cyan-400" />
            Bundle delivered to auditor
          </div>
          <span className="text-[10px] text-emerald-400">Sent</span>
        </div>
        <p className="mt-1.5 text-slate-400 text-[10px]">
          Recipient: audit-team@bdo.com.au
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
        <div className="rounded-lg bg-white/[0.04] px-2 py-2">
          <p className="text-lg font-bold text-cyan-300">4h</p>
          <span className="text-slate-500">Prep time</span>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-2">
          <p className="text-lg font-bold text-emerald-300">86%</p>
          <span className="text-slate-500">Coverage</span>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-2">
          <p className="text-lg font-bold text-purple-300">0</p>
          <span className="text-slate-500">Follow-ups</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 text-center">
        Traditional prep: ~3–5 days → FormaOS: under half a day
      </p>
    </div>
  );
}

const STEPS: ScenarioStep[] = [
  {
    id: 'receive',
    phase: 'Step 1',
    title: 'Receive audit request',
    description:
      'The auditor sends a request listing controls to be evidenced. FormaOS surfaces it as a structured notification.',
    icon: ShieldCheck,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/20',
    screenContent: <MockNotification />,
  },
  {
    id: 'map',
    phase: 'Step 2',
    title: 'Map evidence to controls',
    description:
      'Previously uploaded evidence auto-links to requested controls. Gaps are flagged for immediate action.',
    icon: Link2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/20',
    screenContent: <MockEvidenceMap />,
  },
  {
    id: 'bundle',
    phase: 'Step 3',
    title: 'Generate evidence bundle',
    description:
      'One click compiles a shareable, time-limited evidence packet with coverage statistics and gap analysis.',
    icon: FileText,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/20',
    screenContent: <MockBundlePreview />,
  },
  {
    id: 'deliver',
    phase: 'Step 4',
    title: 'Deliver & track',
    description:
      'The bundle is securely delivered to the auditor with view tracking. Typical prep time drops from days to hours.',
    icon: Send,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/20',
    screenContent: <MockDelivery />,
  },
];

export default function AuditRequestScenario() {
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
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
          <ShieldCheck className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">
            Audit Request Lifecycle
          </h3>
          <p className="text-xs text-slate-400">
            From auditor request to evidence delivery
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
              i <= currentStep ? 'bg-cyan-400' : 'bg-white/10'
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
          {/* Phase label + title */}
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

          {/* Mock screen */}
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/30 px-3 py-1.5 text-xs text-cyan-200 transition-colors hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next step"
        >
          Next
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

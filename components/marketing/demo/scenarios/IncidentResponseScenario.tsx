'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Siren,
  Search,
  FileSearch,
  Wrench,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Users,
  Shield,
} from 'lucide-react';
import { easing, duration } from '@/config/motion';

// ---------------------------------------------------------------------------
// Scenario: Security incident → triage → investigate → CAPA → closure
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
  elapsed: string;
  screenContent: React.ReactNode;
}

const transition = { duration: duration.normal, ease: easing.signature };
const fadeVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

/* ---------- Mock screen fragments ---------- */

function MockIncidentAlert() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 p-3">
        <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
        <div className="text-xs">
          <p className="font-medium text-red-200">
            Unauthorised access attempt detected
          </p>
          <p className="text-slate-400 mt-0.5">
            3 failed logins to admin panel from unknown IP (203.0.113.42)
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-center">
          <span className="text-slate-500">Severity</span>
          <p className="font-semibold text-red-400">High</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-center">
          <span className="text-slate-500">Source</span>
          <p className="font-semibold text-white">Automated</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-center">
          <span className="text-slate-500">Status</span>
          <p className="font-semibold text-amber-400">Open</p>
        </div>
      </div>
    </div>
  );
}

function MockTriage() {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs">
        <div className="flex items-center gap-2 text-amber-200 font-medium">
          <Search className="h-3.5 w-3.5" />
          Triage Classification
        </div>
        <div className="mt-2 space-y-1 text-[10px] text-slate-300">
          <p>
            <strong className="text-amber-300">Category:</strong> Unauthorised
            Access
          </p>
          <p>
            <strong className="text-amber-300">Impact:</strong> Potential data
            breach — no evidence of exfiltration yet
          </p>
          <p>
            <strong className="text-amber-300">Notifiable:</strong> Under review
            (Privacy Act 1988 / NDB scheme)
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2 text-[10px]">
        <Users className="h-3 w-3 text-purple-400" />
        <span className="text-slate-400">
          Assigned to: <strong className="text-white">Marcus Rivera</strong> (IT
          Security Lead)
        </span>
      </div>
    </div>
  );
}

function MockInvestigation() {
  const findings = [
    {
      label: 'IP geolocation',
      value: 'Unknown VPN exit node',
      status: 'flagged',
    },
    {
      label: 'Account targeted',
      value: 'admin@formaos-health.com.au',
      status: 'confirmed',
    },
    {
      label: 'Access logs',
      value: '3 attempts in 12 min window',
      status: 'confirmed',
    },
    {
      label: 'Data accessed',
      value: 'None — all attempts failed',
      status: 'clear',
    },
  ];

  return (
    <div className="space-y-2 text-[10px]">
      {findings.map((f) => (
        <div
          key={f.label}
          className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5"
        >
          <FileSearch className="h-3 w-3 text-blue-400 flex-shrink-0" />
          <span className="w-28 text-slate-500">{f.label}</span>
          <span className="flex-1 text-slate-300">{f.value}</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
              f.status === 'flagged'
                ? 'bg-amber-500/20 text-amber-300'
                : f.status === 'clear'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-blue-500/20 text-blue-300'
            }`}
          >
            {f.status}
          </span>
        </div>
      ))}
      <div className="mt-2 rounded-lg bg-blue-500/10 border border-blue-400/20 p-2 text-[10px] text-blue-200">
        Root cause: credentials phishing attempt. MFA prevented access.
      </div>
    </div>
  );
}

function MockCAPA() {
  const actions = [
    {
      task: 'Block IP range 203.0.113.0/24 at WAF',
      owner: 'Marcus Rivera',
      due: 'Immediate',
      done: true,
    },
    {
      task: 'Reset admin credentials + rotate API keys',
      owner: 'Marcus Rivera',
      due: '12 Feb',
      done: true,
    },
    {
      task: 'Enable geo-blocking for admin endpoints',
      owner: 'James Liu',
      due: '14 Feb',
      done: false,
    },
    {
      task: 'Phishing awareness re-training for all staff',
      owner: 'Emma Wilson',
      due: '21 Feb',
      done: false,
    },
  ];

  return (
    <div className="space-y-1.5 text-[10px]">
      {actions.map((a) => (
        <div
          key={a.task}
          className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2"
        >
          {a.done ? (
            <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />
          ) : (
            <Clock className="h-3 w-3 text-amber-400 flex-shrink-0" />
          )}
          <span
            className={`flex-1 ${a.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}
          >
            {a.task}
          </span>
          <span className="text-slate-500 text-[9px] whitespace-nowrap">
            {a.owner}
          </span>
          <span className="text-slate-500 text-[9px] whitespace-nowrap">
            {a.due}
          </span>
        </div>
      ))}
    </div>
  );
}

function MockClosure() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-300 font-medium">
          <Shield className="h-3.5 w-3.5" />
          Incident Closed — No Data Breach
        </div>
        <p className="mt-1 text-[10px] text-slate-400">
          All corrective actions verified. Audit trail sealed.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
        <div className="rounded-lg bg-white/[0.04] px-2 py-2">
          <p className="text-lg font-bold text-cyan-300">2.4h</p>
          <span className="text-slate-500">Response time</span>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-2">
          <p className="text-lg font-bold text-emerald-300">4</p>
          <span className="text-slate-500">CAPA items</span>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-2">
          <p className="text-lg font-bold text-purple-300">100%</p>
          <span className="text-slate-500">Resolved</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Steps ---------- */

const STEPS: ScenarioStep[] = [
  {
    id: 'alert',
    phase: 'Step 1',
    title: 'Incident detected',
    description:
      'Automated monitoring flags unauthorised access attempts. An incident record is created with severity, source, and affected assets.',
    icon: Siren,
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-500/20',
    elapsed: '0 min',
    screenContent: <MockIncidentAlert />,
  },
  {
    id: 'triage',
    phase: 'Step 2',
    title: 'Triage & assign',
    description:
      'The incident is classified by category and potential impact. An owner is assigned with structured playbook guidance.',
    icon: Search,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/20',
    elapsed: '8 min',
    screenContent: <MockTriage />,
  },
  {
    id: 'investigate',
    phase: 'Step 3',
    title: 'Root-cause investigation',
    description:
      'Investigators log findings against the incident record. Evidence collection is control-linked for future audit readiness.',
    icon: FileSearch,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/20',
    elapsed: '45 min',
    screenContent: <MockInvestigation />,
  },
  {
    id: 'capa',
    phase: 'Step 4',
    title: 'Corrective actions (CAPA)',
    description:
      'Immediate and preventive actions are assigned as tracked tasks with owners and due dates.',
    icon: Wrench,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/20',
    elapsed: '1.5 h',
    screenContent: <MockCAPA />,
  },
  {
    id: 'close',
    phase: 'Step 5',
    title: 'Close & seal audit trail',
    description:
      'Once all actions are verified, the incident is closed. The full timeline is immutably recorded for regulator or auditor review.',
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/20',
    elapsed: '2.4 h',
    screenContent: <MockClosure />,
  },
];

/* ---------- Autoplay ---------- */

const AUTOPLAY_MS = 5000;

export default function IncidentResponseScenario() {
  const prefersReducedMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!autoPlay || prefersReducedMotion) {
      clearTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentStep((s) => {
        if (s >= STEPS.length - 1) {
          setAutoPlay(false);
          return s;
        }
        return s + 1;
      });
    }, AUTOPLAY_MS);

    return clearTimer;
  }, [autoPlay, prefersReducedMotion, clearTimer]);

  const goTo = useCallback(
    (i: number) => {
      setAutoPlay(false);
      clearTimer();
      setCurrentStep(i);
    },
    [clearTimer],
  );

  const goNext = useCallback(
    () => goTo(Math.min(currentStep + 1, STEPS.length - 1)),
    [currentStep, goTo],
  );
  const goPrev = useCallback(
    () => goTo(Math.max(currentStep - 1, 0)),
    [currentStep, goTo],
  );

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-2">
          <Siren className="h-5 w-5 text-red-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">
            Incident Response Workflow
          </h3>
          <p className="text-xs text-slate-400">
            From detection to closure with full audit trail
          </p>
        </div>
      </div>

      {/* Step pills */}
      <div className="mb-6 flex flex-wrap gap-1.5" role="tablist">
        {STEPS.map((s, i) => {
          const SIcon = s.icon;
          const active = i === currentStep;
          const completed = i < currentStep;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={active}
              onClick={() => goTo(i)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                active
                  ? `${s.bg} border ${s.border} ${s.color}`
                  : completed
                    ? 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-300'
                    : 'bg-white/[0.04] border border-white/[0.08] text-slate-500'
              }`}
            >
              {completed ? (
                <CheckCircle className="h-2.5 w-2.5" />
              ) : (
                <SIcon className="h-2.5 w-2.5" />
              )}
              {s.phase.replace('Step ', '')}. {s.title.split(' ')[0]}
            </button>
          );
        })}
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
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full ${step.bg} border ${step.border} px-2.5 py-1 text-[10px] font-semibold ${step.color}`}
              >
                <Icon className="h-3 w-3" />
                {step.phase}
              </span>
              <h4 className="text-sm font-semibold text-white">{step.title}</h4>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="h-3 w-3" />
              {step.elapsed}
            </span>
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 border border-red-400/30 px-3 py-1.5 text-xs text-red-200 transition-colors hover:bg-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next step"
        >
          Next
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Zap, ShieldCheck, FileCheck } from 'lucide-react';

const steps = [
  {
    id: 'model',
    badge: 'Stage 1',
    title: 'Structure Your Governance',
    description:
      'Define your governance architecture. Map obligations to controls, controls to owners, and owners to evidence requirements. The OS knows who is accountable for what.',
    icon: Box,
    color: 'from-cyan-400 to-blue-500',
    accentColor: 'cyan',
    features: [
      'Governance hierarchy as code',
      'Framework-to-control mapping',
      'Ownership and accountability chains',
    ],
  },
  {
    id: 'execute',
    badge: 'Stage 2',
    title: 'Operationalize Controls',
    description:
      'Controls become enforced workflows. Tasks are assigned, deadlines are tracked, escalations are automatic. The OS ensures execution, not just intention.',
    icon: Zap,
    color: 'from-blue-500 to-purple-500',
    accentColor: 'blue',
    features: [
      'Automated control enforcement',
      'Deadline and escalation rules',
      'Immutable execution logs',
    ],
  },
  {
    id: 'verify',
    badge: 'Stage 3',
    title: 'Validate in Real-Time',
    description:
      'The OS continuously verifies control status. Gaps are flagged instantly. Compliance posture is always current, never a point-in-time snapshot.',
    icon: ShieldCheck,
    color: 'from-purple-500 to-emerald-500',
    accentColor: 'emerald',
    features: [
      'Real-time control verification',
      'Continuous posture monitoring',
      'Instant gap detection',
    ],
  },
  {
    id: 'prove',
    badge: 'Stage 4',
    title: 'Defend with Confidence',
    description:
      'When auditors arrive, the evidence is already assembled. Chain of custody, timestamps, attestations. All exportable, all defensible, all undeniable.',
    icon: FileCheck,
    color: 'from-emerald-500 to-cyan-500',
    accentColor: 'emerald',
    features: [
      'Pre-assembled evidence packages',
      'Immutable audit trail',
      'One-click regulatory export',
    ],
  },
];

// ─── Static stage visualizations (no scroll dependency) ───────────────────────
function StaticStageViz({ stageIndex }: { stageIndex: number }) {
  // Provide a static MotionValue-compatible prop by using a constant
  // Each visualization is shown as a still image for the active tab
  return (
    <div className="w-full h-full">
      {stageIndex === 0 && <StaticStructure />}
      {stageIndex === 1 && <StaticOperationalize />}
      {stageIndex === 2 && <StaticValidate />}
      {stageIndex === 3 && <StaticDefend />}
    </div>
  );
}

function StaticStructure() {
  return (
    <svg viewBox="0 0 320 260" className="w-full h-full" aria-hidden="true">
      <rect x="110" y="10" width="100" height="44" rx="8"
        className="fill-cyan-500/20 stroke-cyan-400" strokeWidth="1.5" />
      <text x="160" y="28" textAnchor="middle" className="fill-cyan-300" fontSize="9" fontWeight="600">GOVERNANCE</text>
      <text x="160" y="42" textAnchor="middle" className="fill-cyan-400/70" fontSize="8">Framework Owner</text>
      <line x1="130" y1="54" x2="80" y2="108" stroke="#22d3ee" strokeWidth="1.5" />
      <line x1="190" y1="54" x2="240" y2="108" stroke="#22d3ee" strokeWidth="1.5" />
      <line x1="70" y1="152" x2="55" y2="196" stroke="#3b82f6" strokeWidth="1.5" />
      <line x1="250" y1="152" x2="265" y2="196" stroke="#3b82f6" strokeWidth="1.5" />
      <rect x="30" y="108" width="80" height="44" rx="8"
        className="fill-blue-500/20 stroke-blue-400" strokeWidth="1.5" />
      <text x="70" y="126" textAnchor="middle" className="fill-blue-300" fontSize="9" fontWeight="600">CONTROLS</text>
      <text x="70" y="140" textAnchor="middle" className="fill-blue-400/70" fontSize="8">Policy Layer</text>
      <rect x="210" y="108" width="80" height="44" rx="8"
        className="fill-blue-500/20 stroke-blue-400" strokeWidth="1.5" />
      <text x="250" y="126" textAnchor="middle" className="fill-blue-300" fontSize="9" fontWeight="600">EVIDENCE</text>
      <text x="250" y="140" textAnchor="middle" className="fill-blue-400/70" fontSize="8">Proof Layer</text>
      <rect x="15" y="196" width="80" height="44" rx="8"
        className="fill-purple-500/20 stroke-purple-400" strokeWidth="1.5" />
      <text x="55" y="214" textAnchor="middle" className="fill-purple-300" fontSize="9" fontWeight="600">OWNERS</text>
      <text x="55" y="228" textAnchor="middle" className="fill-purple-400/70" fontSize="8">Accountability</text>
      <rect x="225" y="196" width="80" height="44" rx="8"
        className="fill-purple-500/20 stroke-purple-400" strokeWidth="1.5" />
      <text x="265" y="214" textAnchor="middle" className="fill-purple-300" fontSize="9" fontWeight="600">AUDIT TRAIL</text>
      <text x="265" y="228" textAnchor="middle" className="fill-purple-400/70" fontSize="8">Immutable Log</text>
    </svg>
  );
}

function StaticOperationalize() {
  return (
    <svg viewBox="0 0 320 260" className="w-full h-full" aria-hidden="true">
      <rect x="110" y="98" width="100" height="64" rx="12"
        className="fill-blue-600/30 stroke-blue-400" strokeWidth="2" />
      <text x="160" y="120" textAnchor="middle" className="fill-blue-200" fontSize="10" fontWeight="700">CONTROL</text>
      <text x="160" y="136" textAnchor="middle" className="fill-blue-300/80" fontSize="8">Access Control</text>
      <text x="160" y="150" textAnchor="middle" className="fill-emerald-400" fontSize="8">● Active</text>
      <line x1="110" y1="118" x2="68" y2="76" stroke="#60a5fa" strokeWidth="1.5" />
      <line x1="160" y1="98" x2="160" y2="68" stroke="#60a5fa" strokeWidth="1.5" />
      <line x1="210" y1="118" x2="252" y2="76" stroke="#60a5fa" strokeWidth="1.5" />
      <rect x="16" y="16" width="90" height="52" rx="8"
        className="fill-gray-800/80 stroke-purple-400/60" strokeWidth="1.5" />
      <text x="61" y="33" textAnchor="middle" className="fill-purple-300" fontSize="8" fontWeight="600">TASK #1</text>
      <text x="61" y="47" textAnchor="middle" className="fill-gray-400" fontSize="7">Review policy doc</text>
      <text x="61" y="59" textAnchor="middle" className="fill-amber-400" fontSize="7">Due: 3 days</text>
      <rect x="115" y="16" width="90" height="52" rx="8"
        className="fill-gray-800/80 stroke-emerald-400/60" strokeWidth="1.5" />
      <text x="160" y="33" textAnchor="middle" className="fill-emerald-300" fontSize="8" fontWeight="600">TASK #2</text>
      <text x="160" y="47" textAnchor="middle" className="fill-gray-400" fontSize="7">Upload evidence</text>
      <text x="160" y="59" textAnchor="middle" className="fill-emerald-400" fontSize="7">✓ Complete</text>
      <rect x="214" y="16" width="90" height="52" rx="8"
        className="fill-gray-800/80 stroke-cyan-400/60" strokeWidth="1.5" />
      <text x="259" y="33" textAnchor="middle" className="fill-cyan-300" fontSize="8" fontWeight="600">TASK #3</text>
      <text x="259" y="47" textAnchor="middle" className="fill-gray-400" fontSize="7">Attest controls</text>
      <text x="259" y="59" textAnchor="middle" className="fill-cyan-400" fontSize="7">In review</text>
      <rect x="40" y="190" width="240" height="52" rx="8"
        className="fill-gray-900/60 stroke-white/10" strokeWidth="1" />
      <text x="160" y="207" textAnchor="middle" className="fill-gray-400" fontSize="8" fontWeight="600">EXECUTION LOG</text>
      <text x="160" y="222" textAnchor="middle" className="fill-gray-500" fontSize="7">Task assigned → Escalation rule active → Evidence requested</text>
      <text x="160" y="234" textAnchor="middle" className="fill-emerald-400/60" fontSize="7">Immutable · Timestamped · Auditable</text>
    </svg>
  );
}

function StaticValidate() {
  const CIRC = 565.5;
  const filled = CIRC * 0.06; // 94% complete = 6% remaining
  return (
    <svg viewBox="0 0 320 260" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="scoreGradStatic" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="128" r="90" fill="none" stroke="#1f2937" strokeWidth="16" />
      <circle cx="160" cy="128" r="90" fill="none" stroke="url(#scoreGradStatic)"
        strokeWidth="16" strokeLinecap="round"
        strokeDasharray={CIRC} strokeDashoffset={filled}
        transform="rotate(-90 160 128)" />
      <text x="160" y="122" textAnchor="middle"
        className="fill-emerald-400" fontSize="32" fontWeight="800">94%</text>
      <text x="160" y="142" textAnchor="middle" className="fill-gray-400" fontSize="11">Compliance Score</text>
      <rect x="16" y="200" width="82" height="44" rx="8"
        className="fill-emerald-500/10 stroke-emerald-500/40" strokeWidth="1.5" />
      <text x="57" y="217" textAnchor="middle" className="fill-emerald-400" fontSize="9" fontWeight="600">✓ Access</text>
      <text x="57" y="231" textAnchor="middle" className="fill-emerald-300/70" fontSize="8">Compliant</text>
      <rect x="119" y="200" width="82" height="44" rx="8"
        className="fill-emerald-500/10 stroke-emerald-500/40" strokeWidth="1.5" />
      <text x="160" y="217" textAnchor="middle" className="fill-emerald-400" fontSize="9" fontWeight="600">✓ Data</text>
      <text x="160" y="231" textAnchor="middle" className="fill-emerald-300/70" fontSize="8">Compliant</text>
      <rect x="222" y="200" width="82" height="44" rx="8"
        className="fill-amber-500/10 stroke-amber-500/40" strokeWidth="1.5" />
      <text x="263" y="217" textAnchor="middle" className="fill-amber-400" fontSize="9" fontWeight="600">⚠ Vendor</text>
      <text x="263" y="231" textAnchor="middle" className="fill-amber-300/70" fontSize="8">Review needed</text>
    </svg>
  );
}

function StaticDefend() {
  return (
    <svg viewBox="0 0 320 260" className="w-full h-full" aria-hidden="true">
      <rect x="10" y="94" width="80" height="52" rx="8"
        className="fill-gray-800/80 stroke-cyan-400/50" strokeWidth="1.5" />
      <text x="50" y="114" textAnchor="middle" className="fill-cyan-300" fontSize="8" fontWeight="600">POLICY DOC</text>
      <text x="50" y="128" textAnchor="middle" className="fill-gray-400" fontSize="7">v2.1 · Signed</text>
      <text x="50" y="138" textAnchor="middle" className="fill-emerald-400" fontSize="7">✓ Verified</text>
      <rect x="120" y="10" width="80" height="52" rx="8"
        className="fill-gray-800/80 stroke-blue-400/50" strokeWidth="1.5" />
      <text x="160" y="30" textAnchor="middle" className="fill-blue-300" fontSize="8" fontWeight="600">AUDIT LOG</text>
      <text x="160" y="44" textAnchor="middle" className="fill-gray-400" fontSize="7">248 entries</text>
      <text x="160" y="54" textAnchor="middle" className="fill-emerald-400" fontSize="7">✓ Immutable</text>
      <rect x="230" y="94" width="80" height="52" rx="8"
        className="fill-gray-800/80 stroke-purple-400/50" strokeWidth="1.5" />
      <text x="270" y="114" textAnchor="middle" className="fill-purple-300" fontSize="8" fontWeight="600">ATTESTATION</text>
      <text x="270" y="128" textAnchor="middle" className="fill-gray-400" fontSize="7">All owners</text>
      <text x="270" y="138" textAnchor="middle" className="fill-emerald-400" fontSize="7">✓ Signed</text>
      <rect x="120" y="198" width="80" height="52" rx="8"
        className="fill-gray-800/80 stroke-emerald-400/50" strokeWidth="1.5" />
      <text x="160" y="218" textAnchor="middle" className="fill-emerald-300" fontSize="8" fontWeight="600">EVIDENCE PKG</text>
      <text x="160" y="232" textAnchor="middle" className="fill-gray-400" fontSize="7">Export ready</text>
      <text x="160" y="242" textAnchor="middle" className="fill-emerald-400" fontSize="7">✓ Packaged</text>
      {/* Central seal */}
      <circle cx="160" cy="128" r="44" className="fill-emerald-500/20 stroke-emerald-400" strokeWidth="2.5" />
      <circle cx="160" cy="128" r="36" fill="none" className="stroke-emerald-400/40" strokeWidth="1" strokeDasharray="4 3" />
      <text x="160" y="122" textAnchor="middle" className="fill-emerald-300" fontSize="18">🔒</text>
      <text x="160" y="138" textAnchor="middle" className="fill-emerald-400" fontSize="9" fontWeight="700">SEALED</text>
      <text x="160" y="150" textAnchor="middle" className="fill-emerald-300/70" fontSize="7">Audit Ready</text>
    </svg>
  );
}

export function ScrollStory() {
  const [activeStep, setActiveStep] = useState(0);
  const activeStepData = steps[activeStep];
  const Icon = activeStepData.icon;

  return (
    <section className="mk-section relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            How It Works
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            The Compliance{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
              Lifecycle
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base">
            From framework mapping to audit defense — a complete workflow that transforms obligations into enforceable controls.
          </p>
        </div>

        {/* Step tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                activeStep === i
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/3 border-white/8 text-gray-400 hover:border-white/15 hover:text-gray-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0`}>
                <step.icon className="w-3 h-3 text-white" />
              </span>
              <span className="hidden sm:inline text-xs text-gray-500 mr-0.5">{step.badge}:</span>
              {step.title}
            </button>
          ))}
        </div>

        {/* Active step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="grid lg:grid-cols-2 gap-6 items-start"
          >
            {/* Left: Visualization */}
            <div className="rounded-2xl bg-gray-950/80 border border-white/8 shadow-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.04)_0%,_transparent_70%)]" />
              <div className="relative w-full h-full p-4">
                <StaticStageViz stageIndex={activeStep} />
              </div>
            </div>

            {/* Right: Description */}
            <div className="flex flex-col justify-center gap-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
                  {activeStepData.badge}
                </span>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeStepData.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-3">{activeStepData.title}</h3>
                <p className="text-gray-400 leading-relaxed">{activeStepData.description}</p>
              </div>

              <div className="space-y-3">
                {activeStepData.features.map((f) => (
                  <div key={f} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${activeStepData.color} flex-shrink-0`} />
                    <span className="text-sm text-gray-300">{f}</span>
                  </div>
                ))}
              </div>

              {/* Step indicator dots */}
              <div className="flex items-center gap-2 pt-2">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`rounded-full transition-all duration-200 ${
                      i === activeStep ? 'w-6 h-2 bg-cyan-400' : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

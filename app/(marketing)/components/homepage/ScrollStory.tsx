'use client';

import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useRef } from 'react';
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

// ─── Stage 1: SVG Org-Chart Drawing ──────────────────────────────────────────
function StageStructure({ progress }: { progress: MotionValue<number> }) {
  const pathLength1 = useTransform(progress, [0, 0.18], [0, 1]);
  const pathLength2 = useTransform(progress, [0.04, 0.22], [0, 1]);
  const pathLength3 = useTransform(progress, [0.08, 0.24], [0, 1]);
  const pathLength4 = useTransform(progress, [0.1, 0.25], [0, 1]);

  const node1Opacity = useTransform(progress, [0, 0.05], [0, 1]);
  const node2Opacity = useTransform(progress, [0.08, 0.14], [0, 1]);
  const node3Opacity = useTransform(progress, [0.12, 0.18], [0, 1]);
  const node4Opacity = useTransform(progress, [0.15, 0.21], [0, 1]);
  const node5Opacity = useTransform(progress, [0.18, 0.24], [0, 1]);

  return (
    <svg viewBox="0 0 320 260" className="w-full h-full" aria-hidden="true">
      {/* Root node */}
      <motion.g style={{ opacity: node1Opacity }}>
        <rect x="110" y="10" width="100" height="44" rx="8"
          className="fill-cyan-500/20 stroke-cyan-400" strokeWidth="1.5" />
        <text x="160" y="28" textAnchor="middle" className="fill-cyan-300" fontSize="9" fontWeight="600">GOVERNANCE</text>
        <text x="160" y="42" textAnchor="middle" className="fill-cyan-400/70" fontSize="8">Framework Owner</text>
      </motion.g>

      {/* Line root → left */}
      <motion.path d="M 130 54 L 80 108" stroke="#22d3ee" strokeWidth="1.5"
        fill="none" strokeLinecap="round" style={{ pathLength: pathLength1 }} />
      {/* Line root → right */}
      <motion.path d="M 190 54 L 240 108" stroke="#22d3ee" strokeWidth="1.5"
        fill="none" strokeLinecap="round" style={{ pathLength: pathLength2 }} />
      {/* Line left → bottom-left */}
      <motion.path d="M 70 152 L 55 196" stroke="#3b82f6" strokeWidth="1.5"
        fill="none" strokeLinecap="round" style={{ pathLength: pathLength3 }} />
      {/* Line right → bottom-right */}
      <motion.path d="M 250 152 L 265 196" stroke="#3b82f6" strokeWidth="1.5"
        fill="none" strokeLinecap="round" style={{ pathLength: pathLength4 }} />

      {/* Left mid node */}
      <motion.g style={{ opacity: node2Opacity }}>
        <rect x="30" y="108" width="80" height="44" rx="8"
          className="fill-blue-500/20 stroke-blue-400" strokeWidth="1.5" />
        <text x="70" y="126" textAnchor="middle" className="fill-blue-300" fontSize="9" fontWeight="600">CONTROLS</text>
        <text x="70" y="140" textAnchor="middle" className="fill-blue-400/70" fontSize="8">Policy Layer</text>
      </motion.g>

      {/* Right mid node */}
      <motion.g style={{ opacity: node3Opacity }}>
        <rect x="210" y="108" width="80" height="44" rx="8"
          className="fill-blue-500/20 stroke-blue-400" strokeWidth="1.5" />
        <text x="250" y="126" textAnchor="middle" className="fill-blue-300" fontSize="9" fontWeight="600">EVIDENCE</text>
        <text x="250" y="140" textAnchor="middle" className="fill-blue-400/70" fontSize="8">Proof Layer</text>
      </motion.g>

      {/* Bottom-left node */}
      <motion.g style={{ opacity: node4Opacity }}>
        <rect x="15" y="196" width="80" height="44" rx="8"
          className="fill-purple-500/20 stroke-purple-400" strokeWidth="1.5" />
        <text x="55" y="214" textAnchor="middle" className="fill-purple-300" fontSize="9" fontWeight="600">OWNERS</text>
        <text x="55" y="228" textAnchor="middle" className="fill-purple-400/70" fontSize="8">Accountability</text>
      </motion.g>

      {/* Bottom-right node */}
      <motion.g style={{ opacity: node5Opacity }}>
        <rect x="225" y="196" width="80" height="44" rx="8"
          className="fill-purple-500/20 stroke-purple-400" strokeWidth="1.5" />
        <text x="265" y="214" textAnchor="middle" className="fill-purple-300" fontSize="9" fontWeight="600">AUDIT TRAIL</text>
        <text x="265" y="228" textAnchor="middle" className="fill-purple-400/70" fontSize="8">Immutable Log</text>
      </motion.g>
    </svg>
  );
}

// ─── Stage 2: Task Cards + Arrows ─────────────────────────────────────────────
function StageOperationalize({ progress }: { progress: MotionValue<number> }) {
  const card1 = useTransform(progress, [0.25, 0.33], [0, 1]);
  const card2 = useTransform(progress, [0.28, 0.36], [0, 1]);
  const card3 = useTransform(progress, [0.31, 0.39], [0, 1]);
  const arrowLen = useTransform(progress, [0.3, 0.48], [0, 1]);

  return (
    <svg viewBox="0 0 320 260" className="w-full h-full" aria-hidden="true">
      {/* Central control node */}
      <rect x="110" y="98" width="100" height="64" rx="12"
        className="fill-blue-600/30 stroke-blue-400" strokeWidth="2" />
      <text x="160" y="120" textAnchor="middle" className="fill-blue-200" fontSize="10" fontWeight="700">CONTROL</text>
      <text x="160" y="136" textAnchor="middle" className="fill-blue-300/80" fontSize="8">Access Control</text>
      <text x="160" y="150" textAnchor="middle" className="fill-emerald-400" fontSize="8">● Active</text>

      {/* Arrow to card 1 */}
      <motion.path d="M 110 118 L 68 76" stroke="#60a5fa" strokeWidth="1.5"
        fill="none" strokeLinecap="round" markerEnd="url(#arrow)"
        style={{ pathLength: arrowLen }} />
      {/* Arrow to card 2 */}
      <motion.path d="M 160 98 L 160 58" stroke="#60a5fa" strokeWidth="1.5"
        fill="none" strokeLinecap="round" markerEnd="url(#arrow)"
        style={{ pathLength: arrowLen }} />
      {/* Arrow to card 3 */}
      <motion.path d="M 210 118 L 252 76" stroke="#60a5fa" strokeWidth="1.5"
        fill="none" strokeLinecap="round" markerEnd="url(#arrow)"
        style={{ pathLength: arrowLen }} />

      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#60a5fa" />
        </marker>
      </defs>

      {/* Task card 1 */}
      <motion.g style={{ opacity: card1 }}>
        <rect x="16" y="16" width="90" height="52" rx="8"
          className="fill-gray-800/80 stroke-purple-400/60" strokeWidth="1.5" />
        <text x="61" y="33" textAnchor="middle" className="fill-purple-300" fontSize="8" fontWeight="600">TASK #1</text>
        <text x="61" y="47" textAnchor="middle" className="fill-gray-400" fontSize="7">Review policy doc</text>
        <text x="61" y="59" textAnchor="middle" className="fill-amber-400" fontSize="7">Due: 3 days</text>
      </motion.g>

      {/* Task card 2 */}
      <motion.g style={{ opacity: card2 }}>
        <rect x="115" y="16" width="90" height="52" rx="8"
          className="fill-gray-800/80 stroke-emerald-400/60" strokeWidth="1.5" />
        <text x="160" y="33" textAnchor="middle" className="fill-emerald-300" fontSize="8" fontWeight="600">TASK #2</text>
        <text x="160" y="47" textAnchor="middle" className="fill-gray-400" fontSize="7">Upload evidence</text>
        <text x="160" y="59" textAnchor="middle" className="fill-emerald-400" fontSize="7">✓ Complete</text>
      </motion.g>

      {/* Task card 3 */}
      <motion.g style={{ opacity: card3 }}>
        <rect x="214" y="16" width="90" height="52" rx="8"
          className="fill-gray-800/80 stroke-cyan-400/60" strokeWidth="1.5" />
        <text x="259" y="33" textAnchor="middle" className="fill-cyan-300" fontSize="8" fontWeight="600">TASK #3</text>
        <text x="259" y="47" textAnchor="middle" className="fill-gray-400" fontSize="7">Attest controls</text>
        <text x="259" y="59" textAnchor="middle" className="fill-cyan-400" fontSize="7">In review</text>
      </motion.g>

      {/* Bottom execution log */}
      <motion.g style={{ opacity: card1 }}>
        <rect x="40" y="190" width="240" height="52" rx="8"
          className="fill-gray-900/60 stroke-white/10" strokeWidth="1" />
        <text x="160" y="207" textAnchor="middle" className="fill-gray-400" fontSize="8" fontWeight="600">EXECUTION LOG</text>
        <text x="160" y="222" textAnchor="middle" className="fill-gray-500" fontSize="7">Task assigned → Escalation rule active → Evidence requested</text>
        <text x="160" y="234" textAnchor="middle" className="fill-emerald-400/60" fontSize="7">Immutable · Timestamped · Auditable</text>
      </motion.g>
    </svg>
  );
}

// ─── Stage 3: Compliance Score Meter ──────────────────────────────────────────
function StageValidate({ progress }: { progress: MotionValue<number> }) {
  // Circle circumference for r=90: 2π*90 ≈ 565.5
  const CIRC = 565.5;
  const scoreProgress = useTransform(progress, [0.5, 0.72], [0, 0.94]);
  const dashOffset = useTransform(scoreProgress, (v) => CIRC * (1 - v));
  const scoreText = useTransform(scoreProgress, (v) => `${Math.round(v * 100)}%`);

  const gap1 = useTransform(progress, [0.52, 0.62], [0, 1]);
  const gap2 = useTransform(progress, [0.56, 0.66], [0, 1]);
  const gap3 = useTransform(progress, [0.60, 0.70], [0, 1]);

  return (
    <svg viewBox="0 0 320 260" className="w-full h-full" aria-hidden="true">
      {/* Background ring */}
      <circle cx="160" cy="128" r="90" fill="none" stroke="#1f2937" strokeWidth="16" />
      {/* Animated fill ring */}
      <motion.circle
        cx="160" cy="128" r="90"
        fill="none"
        stroke="url(#scoreGrad)"
        strokeWidth="16"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        style={{ strokeDashoffset: dashOffset }}
        transform="rotate(-90 160 128)"
      />
      <defs>
        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>

      {/* Score text */}
      <motion.text x="160" y="120" textAnchor="middle"
        className="fill-emerald-400" fontSize="32" fontWeight="800">
        {scoreText}
      </motion.text>
      <text x="160" y="142" textAnchor="middle" className="fill-gray-400" fontSize="11">Compliance Score</text>

      {/* Gap indicators */}
      <motion.g style={{ opacity: gap1 }}>
        <rect x="16" y="200" width="82" height="44" rx="8"
          className="fill-emerald-500/10 stroke-emerald-500/40" strokeWidth="1.5" />
        <text x="57" y="217" textAnchor="middle" className="fill-emerald-400" fontSize="9" fontWeight="600">✓ Access</text>
        <text x="57" y="231" textAnchor="middle" className="fill-emerald-300/70" fontSize="8">Compliant</text>
      </motion.g>
      <motion.g style={{ opacity: gap2 }}>
        <rect x="119" y="200" width="82" height="44" rx="8"
          className="fill-emerald-500/10 stroke-emerald-500/40" strokeWidth="1.5" />
        <text x="160" y="217" textAnchor="middle" className="fill-emerald-400" fontSize="9" fontWeight="600">✓ Data</text>
        <text x="160" y="231" textAnchor="middle" className="fill-emerald-300/70" fontSize="8">Compliant</text>
      </motion.g>
      <motion.g style={{ opacity: gap3 }}>
        <rect x="222" y="200" width="82" height="44" rx="8"
          className="fill-amber-500/10 stroke-amber-500/40" strokeWidth="1.5" />
        <text x="263" y="217" textAnchor="middle" className="fill-amber-400" fontSize="9" fontWeight="600">⚠ Vendor</text>
        <text x="263" y="231" textAnchor="middle" className="fill-amber-300/70" fontSize="8">Review needed</text>
      </motion.g>
    </svg>
  );
}

// ─── Stage 4: Evidence Convergence + Seal ─────────────────────────────────────
function StageDefend({ progress }: { progress: MotionValue<number> }) {
  const card1X = useTransform(progress, [0.75, 0.92], [-80, 0]);
  const card2Y = useTransform(progress, [0.75, 0.92], [-60, 0]);
  const card3X = useTransform(progress, [0.75, 0.92], [80, 0]);
  const card4Y = useTransform(progress, [0.75, 0.92], [60, 0]);
  const sealScale = useTransform(progress, [0.88, 1.0], [0, 1]);
  const sealOpacity = useTransform(progress, [0.88, 0.96], [0, 1]);

  return (
    <svg viewBox="0 0 320 260" className="w-full h-full" aria-hidden="true">
      {/* Evidence card 1 - left */}
      <motion.g style={{ x: card1X }}>
        <rect x="10" y="94" width="80" height="52" rx="8"
          className="fill-gray-800/80 stroke-cyan-400/50" strokeWidth="1.5" />
        <text x="50" y="114" textAnchor="middle" className="fill-cyan-300" fontSize="8" fontWeight="600">POLICY DOC</text>
        <text x="50" y="128" textAnchor="middle" className="fill-gray-400" fontSize="7">v2.1 · Signed</text>
        <text x="50" y="138" textAnchor="middle" className="fill-emerald-400" fontSize="7">✓ Verified</text>
      </motion.g>

      {/* Evidence card 2 - top */}
      <motion.g style={{ y: card2Y }}>
        <rect x="120" y="10" width="80" height="52" rx="8"
          className="fill-gray-800/80 stroke-blue-400/50" strokeWidth="1.5" />
        <text x="160" y="30" textAnchor="middle" className="fill-blue-300" fontSize="8" fontWeight="600">AUDIT LOG</text>
        <text x="160" y="44" textAnchor="middle" className="fill-gray-400" fontSize="7">248 entries</text>
        <text x="160" y="54" textAnchor="middle" className="fill-emerald-400" fontSize="7">✓ Immutable</text>
      </motion.g>

      {/* Evidence card 3 - right */}
      <motion.g style={{ x: card3X }}>
        <rect x="230" y="94" width="80" height="52" rx="8"
          className="fill-gray-800/80 stroke-purple-400/50" strokeWidth="1.5" />
        <text x="270" y="114" textAnchor="middle" className="fill-purple-300" fontSize="8" fontWeight="600">ATTESTATION</text>
        <text x="270" y="128" textAnchor="middle" className="fill-gray-400" fontSize="7">All owners</text>
        <text x="270" y="138" textAnchor="middle" className="fill-emerald-400" fontSize="7">✓ Signed</text>
      </motion.g>

      {/* Evidence card 4 - bottom */}
      <motion.g style={{ y: card4Y }}>
        <rect x="120" y="198" width="80" height="52" rx="8"
          className="fill-gray-800/80 stroke-emerald-400/50" strokeWidth="1.5" />
        <text x="160" y="218" textAnchor="middle" className="fill-emerald-300" fontSize="8" fontWeight="600">EVIDENCE PKG</text>
        <text x="160" y="232" textAnchor="middle" className="fill-gray-400" fontSize="7">Export ready</text>
        <text x="160" y="242" textAnchor="middle" className="fill-emerald-400" fontSize="7">✓ Packaged</text>
      </motion.g>

      {/* Central seal */}
      <motion.g style={{ scale: sealScale, opacity: sealOpacity }}
        transform-origin="160 128">
        <circle cx="160" cy="128" r="44" className="fill-emerald-500/20 stroke-emerald-400" strokeWidth="2.5" />
        <circle cx="160" cy="128" r="36" fill="none" className="stroke-emerald-400/40" strokeWidth="1" strokeDasharray="4 3" />
        <text x="160" y="122" textAnchor="middle" className="fill-emerald-300" fontSize="18">🔒</text>
        <text x="160" y="138" textAnchor="middle" className="fill-emerald-400" fontSize="9" fontWeight="700">SEALED</text>
        <text x="160" y="150" textAnchor="middle" className="fill-emerald-300/70" fontSize="7">Audit Ready</text>
      </motion.g>
    </svg>
  );
}

// ─── Stage selector ────────────────────────────────────────────────────────────
function StageViz({ stageIndex, progress }: { stageIndex: number; progress: MotionValue<number> }) {
  if (stageIndex === 0) return <StageStructure progress={progress} />;
  if (stageIndex === 1) return <StageOperationalize progress={progress} />;
  if (stageIndex === 2) return <StageValidate progress={progress} />;
  return <StageDefend progress={progress} />;
}

// ─── Right-side step info card ─────────────────────────────────────────────────
function StepCard({
  step,
  index,
  activeStage,
}: {
  step: (typeof steps)[0];
  index: number;
  activeStage: MotionValue<number>;
}) {
  const Icon = step.icon;
  const cardOpacity = useTransform(activeStage, (v) => {
    const dist = Math.abs(v - index);
    return dist < 0.5 ? 1 : dist < 1.2 ? 0.5 : 0.3;
  });
  const cardScale = useTransform(activeStage, (v) => {
    const dist = Math.abs(v - index);
    return dist < 0.5 ? 1 : 0.97;
  });

  return (
    <motion.div
      style={{ opacity: cardOpacity, scale: cardScale }}
      className={`group relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 transition-all duration-300 hover:border-cyan-500/20`}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400`}>
          {step.badge}
        </span>
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <h3 className="text-lg font-bold mb-2">{step.title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed mb-4">{step.description}</p>
      <div className="space-y-2">
        {step.features.map((f) => (
          <div key={f} className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.color} flex-shrink-0`} />
            <span className="text-xs text-gray-500">{f}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Which stage (0-3) we're in, as a continuous float
  const activeStage = useTransform(scrollYProgress, [0, 1], [0, 3]);

  // Active stage index (0-3) for picking the visualization
  const stageIndex = useTransform(activeStage, (v) => Math.min(3, Math.floor(v + 0.08)));

  // Progress bar
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={containerRef} className="mk-section relative" style={{ minHeight: '400vh' }}>
      {/* ── Progress bar ── */}
      <div className="sticky top-0 z-30 h-1 w-full bg-white/5">
        <motion.div
          className="h-full origin-left bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
          style={{ scaleX: progressScaleX }}
        />
      </div>

      {/* ── Sticky split layout ── */}
      <div className="hidden lg:block">
        {/* Sticky visualization panel - left half */}
        <div
          className="sticky top-1 h-screen flex items-center justify-center"
          style={{ float: 'left', width: '50%' }}
        >
          <div className="w-full max-w-lg px-8">
            {/* Section header */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                How It Works
              </div>
              <h2 className="text-3xl font-bold">
                The Compliance
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  {' '}Lifecycle
                </span>
              </h2>
            </div>

            {/* Visualization canvas */}
            <motion.div
              className="relative rounded-3xl bg-gray-950/80 border border-white/8 shadow-2xl shadow-black/40 overflow-hidden"
              style={{ aspectRatio: '4/3' }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.05)_0%,_transparent_70%)]" />
              <div className="absolute inset-0 p-6">
                {/* Render all 4 stages, show based on stageIndex */}
                {steps.map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-6"
                    style={{
                      opacity: useTransform(stageIndex, (v) => (Math.round(v) === i ? 1 : 0)),
                    }}
                  >
                    <StageViz stageIndex={i} progress={scrollYProgress} />
                  </motion.div>
                ))}
              </div>

              {/* Stage dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {steps.map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/30"
                    style={{
                      backgroundColor: useTransform(stageIndex, (v) =>
                        Math.round(v) === i ? '#22d3ee' : 'rgba(255,255,255,0.2)'
                      ),
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right side scroll content */}
        <div style={{ marginLeft: '50%' }}>
          <div className="px-12 py-32 space-y-16 max-w-xl">
            {steps.map((step, i) => (
              <StepCard key={step.id} step={step} index={i} activeStage={activeStage} />
            ))}
          </div>
        </div>

        {/* Clearfix */}
        <div style={{ clear: 'both' }} />
      </div>

      {/* ── Mobile: sequential cards ── */}
      <div className="lg:hidden px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            How It Works
          </div>
          <h2 className="text-3xl font-bold mb-4">
            The Compliance
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
              {' '}Lifecycle
            </span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            From framework mapping to audit defense — a complete workflow that transforms obligations into enforceable controls.
          </p>
        </div>
        <div className="space-y-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.id}
                className={`p-6 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-white/5`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                    {step.badge}
                  </span>
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-base font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-3">{step.description}</p>
                <div className="space-y-1.5">
                  {step.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.color} flex-shrink-0`} />
                      <span className="text-xs text-gray-500">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

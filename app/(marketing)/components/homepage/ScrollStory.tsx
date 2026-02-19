'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Zap, ShieldCheck, FileCheck, ChevronRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

// ─── Step data ────────────────────────────────────────────────────────────────
const steps = [
  {
    id: 'model',
    num: '01',
    badge: 'Stage 1',
    title: 'Structure Your Governance',
    description:
      'Define your governance architecture. Map obligations to controls, controls to owners, and owners to evidence requirements. The OS knows who is accountable for what.',
    icon: Box,
    gradient: 'from-cyan-500 to-blue-600',
    ring: 'ring-cyan-500/40',
    glow: 'rgba(6,182,212,0.15)',
    features: [
      'Governance hierarchy as code',
      'Framework-to-control mapping',
      'Ownership and accountability chains',
    ],
  },
  {
    id: 'execute',
    num: '02',
    badge: 'Stage 2',
    title: 'Operationalize Controls',
    description:
      'Controls become enforced workflows. Tasks are assigned, deadlines are tracked, escalations are automatic. The OS ensures execution, not just intention.',
    icon: Zap,
    gradient: 'from-blue-500 to-violet-600',
    ring: 'ring-blue-500/40',
    glow: 'rgba(59,130,246,0.15)',
    features: [
      'Automated control enforcement',
      'Deadline and escalation rules',
      'Immutable execution logs',
    ],
  },
  {
    id: 'verify',
    num: '03',
    badge: 'Stage 3',
    title: 'Validate in Real-Time',
    description:
      'The OS continuously verifies control status. Gaps are flagged instantly. Compliance posture is always current, never a point-in-time snapshot.',
    icon: ShieldCheck,
    gradient: 'from-violet-500 to-emerald-500',
    ring: 'ring-violet-500/40',
    glow: 'rgba(139,92,246,0.15)',
    features: [
      'Real-time control verification',
      'Continuous posture monitoring',
      'Instant gap detection',
    ],
  },
  {
    id: 'prove',
    num: '04',
    badge: 'Stage 4',
    title: 'Defend with Confidence',
    description:
      'When auditors arrive, the evidence is already assembled. Chain of custody, timestamps, attestations. All exportable, all defensible, all undeniable.',
    icon: FileCheck,
    gradient: 'from-emerald-500 to-cyan-500',
    ring: 'ring-emerald-500/40',
    glow: 'rgba(16,185,129,0.15)',
    features: [
      'Pre-assembled evidence packages',
      'Immutable audit trail',
      'One-click regulatory export',
    ],
  },
];

const AUTO_ADVANCE_MS = 5000;

// ─── Stage visualizations ─────────────────────────────────────────────────────

/** Stage 1 – governance hierarchy tree draws in node-by-node */
function VizStructure() {
  const nodes = [
    { label: 'GOVERNANCE', sub: 'Framework Owner', x: 120, y: 0, color: '#22d3ee', fill: 'rgba(6,182,212,0.15)', delay: 0 },
    { label: 'CONTROLS', sub: 'Policy Layer', x: 30, y: 90, color: '#60a5fa', fill: 'rgba(59,130,246,0.12)', delay: 0.18 },
    { label: 'EVIDENCE', sub: 'Proof Layer', x: 210, y: 90, color: '#60a5fa', fill: 'rgba(59,130,246,0.12)', delay: 0.28 },
    { label: 'OWNERS', sub: 'Accountability', x: 0, y: 180, color: '#a78bfa', fill: 'rgba(139,92,246,0.12)', delay: 0.42 },
    { label: 'AUDIT TRAIL', sub: 'Immutable Log', x: 60, y: 180, color: '#a78bfa', fill: 'rgba(139,92,246,0.12)', delay: 0.52 },
    { label: 'MAPPING', sub: 'Control Links', x: 180, y: 180, color: '#a78bfa', fill: 'rgba(139,92,246,0.12)', delay: 0.62 },
    { label: 'ATTESTATION', sub: 'Sign-off Layer', x: 250, y: 180, color: '#a78bfa', fill: 'rgba(139,92,246,0.12)', delay: 0.72 },
  ];
  const edges = [
    { x1: 170, y1: 36, x2: 96, y2: 90, delay: 0.1 },
    { x1: 170, y1: 36, x2: 246, y2: 90, delay: 0.2 },
    { x1: 96, y1: 126, x2: 36, y2: 180, delay: 0.35 },
    { x1: 96, y1: 126, x2: 96, y2: 180, delay: 0.45 },
    { x1: 246, y1: 126, x2: 216, y2: 180, delay: 0.55 },
    { x1: 246, y1: 126, x2: 286, y2: 180, delay: 0.65 },
  ];
  return (
    <svg viewBox="0 0 340 240" className="w-full h-full" aria-hidden="true">
      {edges.map((e, i) => (
        <motion.line
          key={i}
          x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          stroke="rgba(148,163,184,0.25)" strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.35, delay: e.delay }}
        />
      ))}
      {nodes.map((n) => (
        <motion.g
          key={n.label}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: n.delay, type: 'spring', stiffness: 260, damping: 20 }}
          style={{ transformOrigin: `${n.x + 60}px ${n.y + 18}px` }}
        >
          <rect x={n.x} y={n.y} width="100" height="36" rx="8"
            fill={n.fill} stroke={n.color} strokeWidth="1.5" />
          <text x={n.x + 50} y={n.y + 13} textAnchor="middle"
            fill={n.color} fontSize="8.5" fontWeight="700">{n.label}</text>
          <text x={n.x + 50} y={n.y + 26} textAnchor="middle"
            fill="rgba(148,163,184,0.7)" fontSize="7.5">{n.sub}</text>
        </motion.g>
      ))}
    </svg>
  );
}

/** Stage 2 – kanban board with tasks ticking through statuses */
function VizOperationalize() {
  const lanes = [
    { label: 'ASSIGNED', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
    { label: 'IN PROGRESS', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)' },
    { label: 'COMPLETE', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  ];
  const cards = [
    { task: 'Review Access Policy', owner: 'J. Chen', lane: 1, delay: 0.1 },
    { task: 'Upload ISO Evidence', owner: 'M. Park', lane: 2, delay: 0.22 },
    { task: 'Attest Data Controls', owner: 'L. Torres', lane: 2, delay: 0.34 },
    { task: 'Map Vendor Risks', owner: 'K. Sharma', lane: 0, delay: 0.46 },
    { task: 'Sign-off Policy v2', owner: 'R. Osei', lane: 2, delay: 0.58 },
  ];
  const laneCards = lanes.map((_, li) => cards.filter((c) => c.lane === li));
  return (
    <div className="w-full h-full flex flex-col gap-3 p-1">
      <motion.div
        className="flex gap-2 text-[10px] font-semibold"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      >
        {lanes.map((l) => (
          <div key={l.label} className="flex-1 text-center py-1 rounded-lg" style={{ color: l.color, background: l.bg, border: `1px solid ${l.border}` }}>
            {l.label}
          </div>
        ))}
      </motion.div>
      <div className="flex gap-2 flex-1">
        {lanes.map((l, li) => (
          <div key={l.label} className="flex-1 flex flex-col gap-2">
            {laneCards[li].map((c) => (
              <motion.div
                key={c.task}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: c.delay }}
                className="rounded-lg p-2.5"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.1)' }}
              >
                <div className="text-[9.5px] font-semibold text-white leading-tight mb-1">{c.task}</div>
                <div className="text-[8.5px] text-slate-400">{c.owner}</div>
                {li === 2 && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-[8px] text-emerald-400 font-medium">Verified</span>
                  </div>
                )}
                {li === 1 && (
                  <div className="mt-1.5 h-1 rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-blue-400"
                      initial={{ width: '0%' }}
                      animate={{ width: '65%' }}
                      transition={{ duration: 0.8, delay: c.delay + 0.3 }}
                    />
                  </div>
                )}
                {li === 0 && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span className="text-[8px] text-amber-400">Pending</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="rounded-lg px-3 py-2 text-[8.5px] text-slate-400"
        style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.08)' }}
      >
        <span className="text-emerald-400 font-semibold">Log:</span> Task escalated → Evidence requested → Control attested&nbsp;·&nbsp;
        <span className="text-slate-500">Immutable · Timestamped</span>
      </motion.div>
    </div>
  );
}

/** Stage 3 – animated compliance gauge + live status rows */
function VizValidate() {
  const CIRC = 2 * Math.PI * 72; // r=72
  const controls = [
    { name: 'Access Control', status: 'compliant', pct: 100 },
    { name: 'Data Protection', status: 'compliant', pct: 100 },
    { name: 'Incident Response', status: 'compliant', pct: 100 },
    { name: 'Vendor Management', status: 'gap', pct: 62 },
    { name: 'Audit Logging', status: 'compliant', pct: 100 },
  ];
  return (
    <div className="w-full h-full flex flex-col gap-3 p-1">
      {/* Gauge */}
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 160 160" aria-hidden="true">
            <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(31,41,55,1)" strokeWidth="14" />
            <motion.circle
              cx="80" cy="80" r="72" fill="none"
              stroke="url(#vg)" strokeWidth="14" strokeLinecap="round"
              strokeDasharray={CIRC}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: CIRC * (1 - 0.94) }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
              transform="rotate(-90 80 80)"
            />
            <defs>
              <linearGradient id="vg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <text x="80" y="74" textAnchor="middle" fill="#34d399" fontSize="26" fontWeight="800">94%</text>
            <text x="80" y="92" textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="10">Score</text>
          </svg>
        </div>
        <div className="flex-1 space-y-1.5">
          {controls.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: 0.15 + i * 0.1 }}
              className="flex items-center gap-2"
            >
              {c.status === 'compliant'
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                : <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              }
              <span className="text-[10px] text-slate-300 flex-1 truncate">{c.name}</span>
              <span className={`text-[9px] font-semibold ${c.status === 'compliant' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {c.status === 'compliant' ? '✓' : '⚠'}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Live feed */}
      <div className="flex-1 rounded-xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.08)' }}>
        <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-emerald-400"
          />
          <span className="text-[9.5px] font-semibold text-slate-300">LIVE POSTURE FEED</span>
        </div>
        {[
          { msg: 'Access Control verified — ISO 27001 A.9', time: 'just now', ok: true },
          { msg: 'Vendor Management gap detected', time: '2 min ago', ok: false },
          { msg: 'Evidence bundle updated — SOC 2 CC6', time: '4 min ago', ok: true },
        ].map((row, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.15 }}
            className="px-3 py-1.5 flex items-start gap-2 border-b border-white/[0.04] last:border-0"
          >
            <span className={`text-[9px] mt-0.5 ${row.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{row.ok ? '✓' : '⚠'}</span>
            <span className="text-[9px] text-slate-400 flex-1 leading-tight">{row.msg}</span>
            <span className="text-[8.5px] text-slate-600 whitespace-nowrap">{row.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Stage 4 – evidence cards converge toward a sealed package */
function VizDefend() {
  const cards = [
    { label: 'Policy Doc', sub: 'v2.1 · Signed', color: '#22d3ee', x: -60, y: -30, delay: 0 },
    { label: 'Audit Log', sub: '248 entries', color: '#60a5fa', x: 60, y: -30, delay: 0.1 },
    { label: 'Attestations', sub: 'All owners', color: '#a78bfa', x: -60, y: 30, delay: 0.2 },
    { label: 'Evidence Pkg', sub: 'Export ready', color: '#34d399', x: 60, y: 30, delay: 0.3 },
  ];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-2">
      <div className="relative w-full flex items-center justify-center" style={{ height: 160 }}>
        {/* Central seal */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5, type: 'spring', stiffness: 200, damping: 16 }}
          className="relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.5)', boxShadow: '0 0 32px rgba(16,185,129,0.2)' }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.4, delay: 1.0 }}
            className="text-2xl mb-0.5"
          >🔒</motion.div>
          <span className="text-[10px] font-bold text-emerald-400">SEALED</span>
          <span className="text-[8px] text-emerald-300/70">Audit Ready</span>
        </motion.div>
        {/* Evidence cards */}
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ x: c.x * 1.8, y: c.y * 1.8, opacity: 0, scale: 0.8 }}
            animate={{ x: c.x, y: c.y, opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: c.delay, type: 'spring', stiffness: 180, damping: 18 }}
            className="absolute rounded-lg px-3 py-2 text-center"
            style={{
              background: 'rgba(15,23,42,0.9)',
              border: `1px solid ${c.color}40`,
              minWidth: 88,
            }}
          >
            <div className="text-[9.5px] font-semibold mb-0.5" style={{ color: c.color }}>{c.label}</div>
            <div className="text-[8.5px] text-slate-400">{c.sub}</div>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-[7.5px] text-emerald-400">Verified</span>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Export bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full rounded-xl px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
      >
        <div>
          <div className="text-[10px] font-semibold text-emerald-300">Evidence Package Ready</div>
          <div className="text-[8.5px] text-slate-400 mt-0.5">ISO 27001 · SOC 2 · HIPAA · 4 frameworks</div>
        </div>
        <motion.div
          whileHover={{ scale: 1.04 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9.5px] font-semibold text-emerald-900 cursor-default flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#10b981,#34d399)' }}
        >
          Export
          <ChevronRight className="w-3 h-3" />
        </motion.div>
      </motion.div>
    </div>
  );
}

const VIZ_COMPONENTS = [VizStructure, VizOperationalize, VizValidate, VizDefend];

// ─── Main component ────────────────────────────────────────────────────────────
export function ScrollStory() {
  const [activeStep, setActiveStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const goTo = useCallback((i: number) => {
    setActiveStep(i);
    setProgress(0);
  }, []);

  const advance = useCallback(() => {
    setActiveStep((s) => (s + 1) % steps.length);
    setProgress(0);
  }, []);

  // Auto-advance with smooth progress bar
  useEffect(() => {
    if (paused) return;
    const interval = 40; // ms per tick
    const ticks = AUTO_ADVANCE_MS / interval;
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      setProgress(tick / ticks);
      if (tick >= ticks) {
        advance();
      }
    }, interval);
    return () => clearInterval(id);
  }, [activeStep, paused, advance]);

  const activeStepData = steps[activeStep];
  const Icon = activeStepData.icon;
  const VizComponent = VIZ_COMPONENTS[activeStep];

  const accentColors: Record<number, string> = {
    0: '#22d3ee',
    1: '#60a5fa',
    2: '#a78bfa',
    3: '#34d399',
  };
  const accent = accentColors[activeStep];

  return (
    <section
      className="mk-section relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">

        {/* ── Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-cyan-400"
            />
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

        {/* ── Stage selector tabs */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-8"
          role="tablist"
          aria-label="Compliance lifecycle stages"
        >
          {steps.map((step, i) => {
            const isActive = activeStep === i;
            return (
              <button
                key={step.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${step.id}`}
                onClick={() => goTo(i)}
                className={`relative group flex flex-col items-start gap-2 p-4 rounded-2xl border text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                  isActive
                    ? 'border-white/20 bg-white/[0.07]'
                    : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                }`}
                style={isActive ? { boxShadow: `0 0 24px ${accentColors[i]}22, inset 0 0 0 1px ${accentColors[i]}20` } : {}}
              >
                {/* Number badge */}
                <div className="flex items-center gap-2 w-full">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-all duration-300 flex-shrink-0 ${
                      isActive ? `bg-gradient-to-br ${step.gradient} text-white` : 'bg-white/[0.06] text-gray-500'
                    }`}
                  >
                    {step.num}
                  </span>
                  <step.icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  {/* Active glow line at top */}
                  {isActive && (
                    <motion.div
                      layoutId="tab-glow"
                      className="ml-auto h-1 w-8 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${accentColors[i]}, transparent)` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    />
                  )}
                </div>
                {/* Label */}
                <span className={`text-xs font-semibold leading-tight transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                  {step.title}
                </span>
                {/* Progress bar for active tab */}
                {isActive && !paused && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl overflow-hidden bg-white/5">
                    <motion.div
                      className="h-full"
                      style={{ background: `linear-gradient(90deg, ${accentColors[i]}, ${accentColors[(i + 1) % 4]})`, scaleX: progress, transformOrigin: 'left' }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            id={`panel-${activeStepData.id}`}
            role="tabpanel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="grid lg:grid-cols-2 gap-5 items-stretch"
          >
            {/* Left: animated visualization */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(15,23,42,0.95), rgba(2,6,23,0.98))',
                border: `1px solid ${accent}22`,
                boxShadow: `0 0 40px ${accent}0d`,
                minHeight: 300,
              }}
            >
              {/* Corner glow */}
              <div
                className="absolute top-0 right-0 w-48 h-48 pointer-events-none rounded-full"
                style={{ background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }}
              />
              <div className="relative w-full h-full p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
                    style={{ minHeight: 260 }}
                  >
                    <VizComponent />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Right: description */}
            <div className="flex flex-col justify-center gap-5">
              {/* Stage badge + icon */}
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
                >
                  {activeStepData.badge}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${activeStepData.gradient}`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Title + description */}
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
                  {activeStepData.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{activeStepData.description}</p>
              </div>

              {/* Feature list */}
              <div className="space-y-2.5">
                {activeStepData.features.map((f, fi) => (
                  <motion.div
                    key={f}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: fi * 0.1 + 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: `${accent}08`, border: `1px solid ${accent}15` }}
                  >
                    <div
                      className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${accent}20` }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: accent }} />
                    </div>
                    <span className="text-sm text-gray-200">{f}</span>
                  </motion.div>
                ))}
              </div>

              {/* Navigation: dots + prev/next */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      aria-label={`Go to ${steps[i].title}`}
                      className="rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      style={{
                        width: i === activeStep ? 24 : 8,
                        height: 8,
                        background: i === activeStep ? accent : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => goTo((activeStep - 1 + steps.length) % steps.length)}
                    aria-label="Previous stage"
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <button
                    onClick={() => goTo((activeStep + 1) % steps.length)}
                    aria-label="Next stage"
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}

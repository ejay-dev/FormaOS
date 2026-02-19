'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock, FileText, Shield, Lock } from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────────
const controls = [
  { name: 'Access Control Policy', status: 'compliant' as const },
  { name: 'Evidence Review', status: 'compliant' as const },
  { name: 'Incident Response', status: 'compliant' as const },
  { name: 'Data Retention', status: 'compliant' as const },
  { name: 'Vendor Assessment', status: 'review' as const },
];

const timeline = [
  {
    icon: FileText,
    label: 'Evidence uploaded',
    detail: 'Access Control v2.1',
    time: '2m ago',
  },
  {
    icon: Shield,
    label: 'Control verified',
    detail: 'Incident Response',
    time: '14m ago',
  },
  {
    icon: Lock,
    label: 'Audit package sealed',
    detail: 'SOC 2 Type II',
    time: '1h ago',
  },
];

// ─── Circular compliance score gauge ──────────────────────────────────────────
function ComplianceGauge() {
  // r=52 → circumference ≈ 326.7
  const CIRC = 326.7;
  const FILLED = CIRC * 0.94; // 94%

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
          {/* Track */}
          <circle cx="60" cy="60" r="52" fill="none" stroke="#1f2937" strokeWidth="10" />
          {/* Fill */}
          <motion.circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: CIRC - FILLED }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.5 }}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>
        {/* Score text centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-extrabold text-emerald-400 leading-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            94%
          </motion.span>
          <span className="text-[10px] text-gray-500 mt-0.5">score</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-300">Compliance Score</p>
        <p className="text-[10px] text-emerald-400/80 mt-0.5">↑ 3% this month</p>
      </div>
    </div>
  );
}

// ─── Control Status Panel ──────────────────────────────────────────────────────
function ControlStatusPanel() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Control Status
      </p>
      {controls.map((c, i) => (
        <motion.div
          key={c.name}
          className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
        >
          <span className="text-[11px] text-gray-300 truncate">{c.name}</span>
          {c.status === 'compliant' ? (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3" />
              Compliant
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400 whitespace-nowrap">
              <AlertCircle className="w-3 h-3" />
              Review
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Evidence Timeline ─────────────────────────────────────────────────────────
function EvidenceTimeline() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Recent Activity
      </p>
      <div className="relative pl-4">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/10" />
        <div className="flex flex-col gap-3">
          {timeline.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                className="flex items-start gap-2.5"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
              >
                {/* Dot */}
                <div className="relative flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-400/60 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-gray-300 truncate">{item.label}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{item.detail}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5 text-gray-600" />
                    <span className="text-[9px] text-gray-600">{item.time}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function ProductHeroMorph() {
  return (
    <motion.div
      className="w-full max-w-[800px] mx-auto"
      initial={{ opacity: 0, y: 80, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        scale: 1.01,
        boxShadow: '0 0 80px 8px rgba(16, 185, 129, 0.12)',
      }}
    >
      {/* Glass panel */}
      <div className="relative rounded-2xl bg-gray-950/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] via-transparent to-emerald-500/[0.03] pointer-events-none" />

        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-[11px] text-gray-500 ml-2 font-medium">
            FormaOS — Compliance Dashboard
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Three-panel body */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
          {/* Panel 1: Control Status */}
          <div className="p-4">
            <ControlStatusPanel />
          </div>

          {/* Panel 2: Compliance Score */}
          <div className="p-4 flex items-center justify-center sm:min-w-[160px]">
            <ComplianceGauge />
          </div>

          {/* Panel 3: Evidence Timeline */}
          <div className="p-4">
            <EvidenceTimeline />
          </div>
        </div>

        {/* Footer bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-white/[0.02]">
          <span className="text-[10px] text-gray-600">Last sync: just now</span>
          <span className="text-[10px] text-emerald-400/80 font-medium">
            SOC 2 · ISO 27001 · NIST
          </span>
        </div>
      </div>
    </motion.div>
  );
}

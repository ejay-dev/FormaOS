'use client';

import { memo } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';

/* ─── Glass panel shared styling ─── */
const GLASS =
  'rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02]';

/* ─── Entrance stagger per layer ─── */
const ENTRANCE_DELAYS = [0.2, 0.4, 0.6] as const;

/* ─── Cursor tilt intensities (degrees) ─── */
const TILT = [4, 3, 2] as const;

/* ─── Depth offsets ─── */
const Z_DEPTHS = [0, -30, -60] as const;

/* ─── Blur per depth layer ─── */
const LAYER_BLUR = ['none', 'blur(1px)', 'blur(2px)'] as const;

/* ────────────────────────────────────────────────────────────────────── */
/*  ProductHeroVisual                                                    */
/*  Compliance OS Dashboard — 3 stacked glass panels in CSS 3D          */
/* ────────────────────────────────────────────────────────────────────── */

function ProductHeroVisualInner() {
  const prefersReduced = useReducedMotion();
  const { mouseX, mouseY, isActive } = useCursorPosition();

  /* ── Per-layer cursor transforms ── */
  const frontRotateY = useTransform(mouseX, [0, 1], [TILT[0], -TILT[0]]);
  const frontRotateX = useTransform(mouseY, [0, 1], [-TILT[0], TILT[0]]);

  const midRotateY = useTransform(mouseX, [0, 1], [TILT[1], -TILT[1]]);
  const midRotateX = useTransform(mouseY, [0, 1], [-TILT[1], TILT[1]]);

  const backRotateY = useTransform(mouseX, [0, 1], [TILT[2], -TILT[2]]);
  const backRotateX = useTransform(mouseY, [0, 1], [-TILT[2], TILT[2]]);

  const cursorActive = isActive && !prefersReduced;

  /* ── Reduced-motion: static render ── */
  if (prefersReduced) {
    return (
      <div className="hidden lg:flex items-center justify-end pointer-events-none ml-auto">
        <div className="relative w-[550px] h-[400px] xl:w-[600px] xl:h-[450px]" style={{ perspective: 1000 }}>
          <div className="preserve-3d relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
            <PanelShell z={Z_DEPTHS[0]} blur={LAYER_BLUR[0]}>
              <ComplianceDashboard />
            </PanelShell>
            <PanelShell z={Z_DEPTHS[1]} blur={LAYER_BLUR[1]}>
              <EvidenceChecklist />
            </PanelShell>
            <PanelShell z={Z_DEPTHS[2]} blur={LAYER_BLUR[2]}>
              <AuditReport />
            </PanelShell>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center justify-end pointer-events-none ml-auto">
      <motion.div
        className="relative w-[550px] h-[400px] xl:w-[600px] xl:h-[450px]"
        style={{ perspective: 1000 }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* ─── Front Panel: Compliance Dashboard ─── */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: ENTRANCE_DELAYS[0], ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              transformStyle: 'preserve-3d',
              translateZ: Z_DEPTHS[0],
              rotateY: cursorActive ? frontRotateY : 0,
              rotateX: cursorActive ? frontRotateX : 0,
            }}
          >
            <div className={`${GLASS} w-full h-full p-5 shadow-[0_0_60px_rgba(6,182,212,0.06)]`}>
              <ComplianceDashboard />
            </div>
          </motion.div>

          {/* ─── Middle Panel: Evidence Checklist ─── */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: ENTRANCE_DELAYS[1], ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              transformStyle: 'preserve-3d',
              translateZ: Z_DEPTHS[1],
              filter: LAYER_BLUR[1],
              rotateY: cursorActive ? midRotateY : 0,
              rotateX: cursorActive ? midRotateX : 0,
            }}
          >
            <div className={`${GLASS} w-full h-full p-5 shadow-[0_0_60px_rgba(16,185,129,0.06)]`}>
              <EvidenceChecklist />
            </div>
          </motion.div>

          {/* ─── Back Panel: Audit Report ─── */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: ENTRANCE_DELAYS[2], ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              transformStyle: 'preserve-3d',
              translateZ: Z_DEPTHS[2],
              filter: LAYER_BLUR[2],
              rotateY: cursorActive ? backRotateY : 0,
              rotateX: cursorActive ? backRotateX : 0,
            }}
          >
            <div className={`${GLASS} w-full h-full p-5 shadow-[0_0_60px_rgba(139,92,246,0.06)]`}>
              <AuditReport />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Static panel shell (reduced-motion fallback)                         */
/* ────────────────────────────────────────────────────────────────────── */

function PanelShell({
  z,
  blur,
  children,
}: {
  z: number;
  blur: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute inset-0 ${GLASS} p-5`}
      style={{ transform: `translateZ(${z}px)`, filter: blur }}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Front Panel — Compliance Dashboard                                   */
/* ────────────────────────────────────────────────────────────────────── */

function ComplianceDashboard() {
  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-sm font-semibold text-white/80 tracking-wide">Compliance Dashboard</span>
        </div>
        {/* Score badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25">
          <span className="text-xs font-bold text-emerald-400">94%</span>
        </div>
      </div>

      {/* Section label */}
      <div className="text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium mb-3">
        Framework Status
      </div>

      {/* Status rows */}
      <div className="space-y-2.5">
        <StatusRow color="emerald" label="SOC 2 Type II" sublabel="All controls passing" />
        <StatusRow color="emerald" label="ISO 27001" sublabel="Certified — next audit Q3" />
        <StatusRow color="amber" label="GDPR Article 30" sublabel="2 items need review" />
        <StatusRow color="emerald" label="HIPAA Security Rule" sublabel="Fully compliant" />
        <StatusRow color="rose" label="PCI DSS v4.0" sublabel="Action required — 1 finding" />
      </div>
    </>
  );
}

function StatusRow({
  color,
  label,
  sublabel,
}: {
  color: 'emerald' | 'amber' | 'rose';
  label: string;
  sublabel: string;
}) {
  const dotColor = {
    emerald: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]',
    amber: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]',
    rose: 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.5)]',
  }[color];

  const badgeStyle = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  }[color];

  const badgeText = { emerald: 'Pass', amber: 'Review', rose: 'Critical' }[color];

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-white/70 truncate">{label}</div>
        <div className="text-[10px] text-white/30 truncate">{sublabel}</div>
      </div>
      <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
        {badgeText}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Middle Panel — Evidence Collection Checklist                         */
/* ────────────────────────────────────────────────────────────────────── */

function EvidenceChecklist() {
  const items = [
    { label: 'Access review completed', checked: true },
    { label: 'Policy attestation signed', checked: true },
    { label: 'Backup verification run', checked: true },
    { label: 'Vulnerability scan pending', checked: false },
    { label: 'Incident response drill', checked: false },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/[0.06]">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="text-sm font-semibold text-white/80 tracking-wide">Evidence Collection</span>
        <span className="ml-auto text-[10px] text-white/30 font-medium">3 / 5 complete</span>
      </div>

      {/* Section label */}
      <div className="text-[10px] uppercase tracking-[0.15em] text-white/25 font-medium mb-3">
        Required Evidence
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03]"
          >
            {/* Check circle */}
            {item.checked ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
                <circle cx="10" cy="10" r="9" className="fill-emerald-500/20 stroke-emerald-500/50" strokeWidth="1" />
                <path d="M6.5 10.5L9 13L13.5 7.5" className="stroke-emerald-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
                <circle cx="10" cy="10" r="9" className="stroke-white/15" strokeWidth="1" />
              </svg>
            )}
            <span className={`text-xs ${item.checked ? 'text-white/60 line-through decoration-white/20' : 'text-white/50'}`}>
              {item.label}
            </span>
            {item.checked && (
              <span className="ml-auto text-[9px] text-emerald-400/60 font-medium">Done</span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Back Panel — Audit Report Summary                                    */
/* ────────────────────────────────────────────────────────────────────── */

function AuditReport() {
  /* SVG progress ring values */
  const RADIUS = 42;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const PROGRESS = 0.94;
  const DASH_OFFSET = CIRCUMFERENCE * (1 - PROGRESS);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
        <div className="w-2.5 h-2.5 rounded-full bg-violet-400" />
        <span className="text-sm font-semibold text-white/80 tracking-wide">Audit Report</span>
        <span className="ml-auto text-[10px] text-violet-400/60 font-medium">Q1 2026</span>
      </div>

      {/* Progress ring + label */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-[110px] h-[110px]">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="50" cy="50" r={RADIUS}
              fill="none"
              strokeWidth="6"
              className="stroke-white/[0.06]"
            />
            {/* Progress arc */}
            <circle
              cx="50" cy="50" r={RADIUS}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className="stroke-violet-400"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={DASH_OFFSET}
              style={{ filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.4))' }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white/90">94%</span>
            <span className="text-[9px] text-white/30 mt-0.5">Overall Score</span>
          </div>
        </div>
      </div>

      {/* 3-column stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <StatCell label="Controls" value="142/148" accent="cyan" />
        <StatCell label="Evidence" value="98%" accent="emerald" />
        <StatCell label="Findings" value="3 Low" accent="amber" />
      </div>

      {/* Mini bar chart row */}
      <div className="mt-3 flex items-end gap-1.5 h-8 px-1">
        {[0.7, 0.85, 0.65, 0.92, 0.88, 0.94, 0.78, 0.96].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-gradient-to-t from-violet-500/30 to-violet-400/10"
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </div>
    </>
  );
}

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'cyan' | 'emerald' | 'amber';
}) {
  const textColor = {
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  }[accent];

  return (
    <div className="text-center p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
      <div className={`text-sm font-bold ${textColor}`}>{value}</div>
      <div className="text-[9px] text-white/30 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Export                                                                */
/* ────────────────────────────────────────────────────────────────────── */

export const ProductHeroVisual = memo(ProductHeroVisualInner);
export default ProductHeroVisual;

'use client';

import { useRef, useState, useCallback } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { ShieldCheck, ShieldOff, Clock, Link2, UserCheck } from 'lucide-react';
import { duration, easing } from '@/config/motion';

const signatureEase: [number, number, number, number] = [
  ...easing.signature,
] as [number, number, number, number];

const ARC_R = 54;
const ARC_C = 2 * Math.PI * ARC_R; // circumference

/* ════════════════════════════════════════════════════════════
   Shared: interactive glass card wrapper
   ════════════════════════════════════════════════════════════ */

function GlassCard({
  children,
  className = '',
  accent = 'rgba(20,184,166,0.7)',
  index = 0,
  isInView,
  noMotion,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
  index?: number;
  isInView: boolean;
  noMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [hovered, setHovered] = useState(false);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current || noMotion) return;
      const r = ref.current.getBoundingClientRect();
      setMouse({
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
      });
    },
    [noMotion],
  );

  return (
    <motion.div
      initial={noMotion ? false : { opacity: 0, y: 28, scale: 0.96 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{
        duration: duration.slower,
        delay: 0.15 + index * 0.1,
        ease: signatureEase,
      }}
      className={className}
    >
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setMouse({ x: 0.5, y: 0.5 });
        }}
        className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-colors duration-300 hover:border-white/[0.1]"
      >
        {/* Mouse spotlight */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: hovered
              ? `radial-gradient(400px circle at ${mouse.x * 100}% ${mouse.y * 100}%, ${accent.replace(/[\d.]+\)$/, '0.07)')}, transparent 40%)`
              : 'none',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
        {/* Top accent */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 15%, ${accent.replace(/[\d.]+\)$/, '0.2)')}, transparent 85%)`,
            opacity: hovered ? 1 : 0.4,
            transition: 'opacity 0.3s ease',
          }}
        />
        <div className="relative h-full p-6 sm:p-7">{children}</div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   Card 1: Compliance Posture (hero — col-span-2)
   ════════════════════════════════════════════════════════════ */

function PostureCard({
  isInView,
  noMotion,
}: {
  isInView: boolean;
  noMotion: boolean;
}) {
  const stats = [
    { value: '47/50', label: 'Active Controls', color: 'text-teal-400' },
    { value: '312', label: 'Evidence Items', color: 'text-sky-400' },
    { value: '9', label: 'Frameworks', color: 'text-violet-400' },
  ] as const;

  return (
    <GlassCard
      className="md:col-span-2"
      index={0}
      isInView={isInView}
      noMotion={noMotion}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
        {/* Animated progress arc */}
        <div className="relative shrink-0">
          <svg
            viewBox="0 0 128 128"
            className="w-36 h-36 sm:w-40 sm:h-40"
            style={{ filter: 'drop-shadow(0 0 20px rgba(20,184,166,0.15))' }}
          >
            {/* Track */}
            <circle
              cx="64"
              cy="64"
              r={ARC_R}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="10"
            />
            {/* Progress */}
            <motion.circle
              cx="64"
              cy="64"
              r={ARC_R}
              fill="none"
              stroke="url(#posture-arc-grad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={ARC_C}
              initial={{ strokeDashoffset: ARC_C }}
              animate={
                isInView
                  ? { strokeDashoffset: ARC_C * (1 - 0.94) }
                  : { strokeDashoffset: ARC_C }
              }
              transition={{
                duration: noMotion ? 0 : 2,
                delay: 0.4,
                ease: signatureEase,
              }}
              transform="rotate(-90 64 64)"
            />
            {/* Glow layer */}
            <motion.circle
              cx="64"
              cy="64"
              r={ARC_R}
              fill="none"
              stroke="url(#posture-arc-grad)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={ARC_C}
              opacity={0.15}
              style={{ filter: 'blur(6px)' }}
              initial={{ strokeDashoffset: ARC_C }}
              animate={
                isInView
                  ? { strokeDashoffset: ARC_C * (1 - 0.94) }
                  : { strokeDashoffset: ARC_C }
              }
              transition={{
                duration: noMotion ? 0 : 2,
                delay: 0.4,
                ease: signatureEase,
              }}
              transform="rotate(-90 64 64)"
            />
            <defs>
              <linearGradient
                id="posture-arc-grad"
                x1="0"
                y1="0"
                x2="128"
                y2="128"
              >
                <stop offset="0%" stopColor="rgba(20,184,166,1)" />
                <stop offset="100%" stopColor="rgba(56,189,248,1)" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-3xl sm:text-4xl font-black tabular-nums text-white"
              initial={noMotion ? false : { opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : undefined}
              transition={{ delay: 1.2, duration: 0.4, ease: signatureEase }}
            >
              94%
            </motion.span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Posture
            </span>
          </div>
        </div>

        {/* Copy + metrics */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
            Continuous Compliance Posture
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-md">
            Real-time visibility into your entire compliance program.
            Not point-in-time snapshots reconstructed before an audit —
            live, always-current posture across every framework.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={noMotion ? false : { opacity: 0, y: 8 }}
                animate={isInView ? { opacity: 1, y: 0 } : undefined}
                transition={{
                  delay: 0.8 + i * 0.12,
                  duration: duration.normal,
                  ease: signatureEase,
                }}
              >
                <div
                  className={`text-xl sm:text-2xl font-bold tabular-nums ${s.color}`}
                >
                  {s.value}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/* ════════════════════════════════════════════════════════════
   Card 2: Workflow Enforcement
   ════════════════════════════════════════════════════════════ */

function EnforcementCard({
  isInView,
  noMotion,
}: {
  isInView: boolean;
  noMotion: boolean;
}) {
  return (
    <GlassCard
      accent="rgba(244,63,94,0.6)"
      index={1}
      isInView={isInView}
      noMotion={noMotion}
    >
      <h3 className="text-base font-bold text-white mb-1.5">
        Workflow Enforcement
      </h3>
      <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
        Controls gate work in real time. Non-compliant actions are blocked
        before they happen.
      </p>

      <div className="space-y-2.5">
        {/* Blocked */}
        <motion.div
          initial={noMotion ? false : { opacity: 0, x: -12 }}
          animate={isInView ? { opacity: 1, x: 0 } : undefined}
          transition={{ delay: 0.5, duration: duration.normal, ease: signatureEase }}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-rose-500/[0.05] border border-rose-500/[0.12]"
        >
          <ShieldOff className="w-4 h-4 text-rose-400 shrink-0" />
          <div>
            <div className="text-[11px] font-semibold text-rose-400">
              Blocked
            </div>
            <div className="text-[10px] text-slate-500">
              Missing approval — A.9.2 Access Control
            </div>
          </div>
        </motion.div>

        {/* Approved */}
        <motion.div
          initial={noMotion ? false : { opacity: 0, x: -12 }}
          animate={isInView ? { opacity: 1, x: 0 } : undefined}
          transition={{ delay: 0.65, duration: duration.normal, ease: signatureEase }}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-teal-500/[0.05] border border-teal-500/[0.12]"
        >
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <div>
            <div className="text-[11px] font-semibold text-teal-400">
              Approved
            </div>
            <div className="text-[10px] text-slate-500">
              Control satisfied — CC6.1 Logical Access
            </div>
          </div>
        </motion.div>

        {/* Approved */}
        <motion.div
          initial={noMotion ? false : { opacity: 0, x: -12 }}
          animate={isInView ? { opacity: 1, x: 0 } : undefined}
          transition={{ delay: 0.8, duration: duration.normal, ease: signatureEase }}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-teal-500/[0.05] border border-teal-500/[0.12]"
        >
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <div>
            <div className="text-[11px] font-semibold text-teal-400">
              Approved
            </div>
            <div className="text-[10px] text-slate-500">
              Evidence attached — HIPAA §164.312
            </div>
          </div>
        </motion.div>
      </div>
    </GlassCard>
  );
}

/* ════════════════════════════════════════════════════════════
   Card 3: Evidence Chain
   ════════════════════════════════════════════════════════════ */

const EVIDENCE_EVENTS = [
  { text: 'Control created', time: 'Mar 2', color: 'bg-sky-400' },
  { text: 'Evidence uploaded — J. Chen', time: 'Mar 5', color: 'bg-teal-400' },
  { text: 'Review approved — S. Patel', time: 'Mar 6', color: 'bg-violet-400' },
  { text: 'Audit-sealed — immutable', time: 'Mar 6', color: 'bg-emerald-400' },
] as const;

function EvidenceCard({
  isInView,
  noMotion,
}: {
  isInView: boolean;
  noMotion: boolean;
}) {
  return (
    <GlassCard
      accent="rgba(56,189,248,0.6)"
      index={2}
      isInView={isInView}
      noMotion={noMotion}
    >
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-4 h-4 text-sky-400" />
        <h3 className="text-base font-bold text-white">Evidence Chain</h3>
      </div>
      <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
        Every action is timestamped, immutable, and traceable. No
        reconstruction needed.
      </p>

      {/* Timeline */}
      <div className="space-y-0">
        {EVIDENCE_EVENTS.map((ev, i) => (
          <motion.div
            key={ev.text}
            initial={noMotion ? false : { opacity: 0, x: -10 }}
            animate={isInView ? { opacity: 1, x: 0 } : undefined}
            transition={{
              delay: 0.5 + i * 0.12,
              duration: duration.normal,
              ease: signatureEase,
            }}
            className="flex items-start gap-3"
          >
            {/* Dot + line */}
            <div className="flex flex-col items-center pt-1">
              <motion.div
                className={`w-2.5 h-2.5 rounded-full ${ev.color} shrink-0`}
                initial={noMotion ? false : { scale: 0 }}
                animate={isInView ? { scale: 1 } : undefined}
                transition={{
                  delay: 0.55 + i * 0.12,
                  duration: 0.25,
                  ease: signatureEase,
                }}
              />
              {i < EVIDENCE_EVENTS.length - 1 && (
                <div className="w-px h-6 bg-white/[0.06] mt-1" />
              )}
            </div>
            {/* Text */}
            <div className="pb-3">
              <div className="text-[11px] text-slate-300 leading-snug">
                {ev.text}
              </div>
              <div className="text-[10px] text-slate-600 tabular-nums mt-0.5">
                {ev.time}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

/* ════════════════════════════════════════════════════════════
   Card 4: Named Ownership
   ════════════════════════════════════════════════════════════ */

const OWNERS = [
  {
    initials: 'SL',
    name: 'Sarah L.',
    role: 'Access Control',
    gradient: 'from-teal-500/30 to-cyan-500/30',
  },
  {
    initials: 'DK',
    name: 'David K.',
    role: 'Data Encryption',
    gradient: 'from-violet-500/30 to-indigo-500/30',
  },
  {
    initials: 'PM',
    name: 'Priya M.',
    role: 'Incident Response',
    gradient: 'from-amber-500/30 to-orange-500/30',
  },
] as const;

function OwnershipCard({
  isInView,
  noMotion,
}: {
  isInView: boolean;
  noMotion: boolean;
}) {
  return (
    <GlassCard
      accent="rgba(139,92,246,0.6)"
      index={3}
      isInView={isInView}
      noMotion={noMotion}
    >
      <div className="flex items-center gap-2 mb-4">
        <UserCheck className="w-4 h-4 text-violet-400" />
        <h3 className="text-base font-bold text-white">Named Ownership</h3>
      </div>
      <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
        Every control is assigned to a named person. No ambiguity when
        regulators ask &ldquo;who owns this?&rdquo;
      </p>

      <div className="space-y-3">
        {OWNERS.map((o, i) => (
          <motion.div
            key={o.name}
            initial={noMotion ? false : { opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{
              delay: 0.5 + i * 0.1,
              duration: duration.normal,
              ease: signatureEase,
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.015] border border-white/[0.04]"
          >
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${o.gradient} border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/80 shrink-0`}
            >
              {o.initials}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-slate-300 truncate">
                {o.name}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {o.role}
              </div>
            </div>
            <div className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-teal-400/60" />
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

/* ════════════════════════════════════════════════════════════
   Card 5: Audit-Ready
   ════════════════════════════════════════════════════════════ */

function AuditCard({
  isInView,
  noMotion,
}: {
  isInView: boolean;
  noMotion: boolean;
}) {
  return (
    <GlassCard
      accent="rgba(251,191,36,0.5)"
      index={4}
      isInView={isInView}
      noMotion={noMotion}
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-amber-400" />
        <h3 className="text-base font-bold text-white">Audit-Ready</h3>
      </div>
      <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
        Export complete audit packets — evidence, ownership, control
        history — without scrambling.
      </p>

      {/* Big metric */}
      <div className="text-center py-4">
        <motion.div
          initial={noMotion ? false : { opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : undefined}
          transition={{ delay: 0.6, duration: 0.5, ease: signatureEase }}
        >
          <span className="text-5xl sm:text-6xl font-black bg-clip-text" style={{
            backgroundImage: 'linear-gradient(135deg, rgba(251,191,36,1), rgba(245,158,11,0.8))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Minutes
          </span>
          <div className="text-sm text-slate-500 mt-2 font-medium">
            not weeks
          </div>
        </motion.div>
      </div>

      {/* Sub-stats */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[
          { label: 'Export formats', value: 'PDF, CSV, JSON' },
          { label: 'History depth', value: 'Full trail' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg bg-white/[0.015] border border-white/[0.04] px-3 py-2"
          >
            <div className="text-[11px] font-semibold text-slate-300">
              {s.value}
            </div>
            <div className="text-[9px] text-slate-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/* ════════════════════════════════════════════════════════════
   Main Section
   ════════════════════════════════════════════════════════════ */

export function ValueProposition() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const noMotion = Boolean(useReducedMotion());
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-6 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
      style={{
        background:
          'linear-gradient(180deg, #020617 0%, #070b18 40%, #0a1020 60%, #020617 100%)',
      }}
    >
      {/* ── Ambient lighting ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{
            left: '10%',
            top: '5%',
            background: 'rgba(20, 184, 166, 0.035)',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{
            right: '5%',
            top: '40%',
            background: 'rgba(139, 92, 246, 0.025)',
          }}
        />
      </div>

      {/* ── Grid texture ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* ── Section edges ── */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.06) 50%, transparent 90%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.06) 50%, transparent 90%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* ── Header ── */}
        <div className="text-center mb-14">
          <motion.div
            initial={noMotion ? false : { opacity: 0, y: 16, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : undefined}
            transition={{ duration: duration.slow, ease: signatureEase }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-sm font-medium text-slate-300">
              Operating System Architecture
            </span>
          </motion.div>

          <div className="relative">
            {!noMotion && (
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[80%] rounded-full blur-[50px] pointer-events-none"
                animate={{ opacity: [0.08, 0.16, 0.08] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  background:
                    'linear-gradient(135deg, rgba(20,184,166,0.4), rgba(56,189,248,0.3))',
                }}
              />
            )}
            <motion.h2
              initial={noMotion ? false : { opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: duration.slow,
                delay: 0.1,
                ease: signatureEase,
              }}
              className="relative text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5"
            >
              Not a repository.{' '}
              <span
                className="bg-clip-text"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, rgba(20,184,166,1) 0%, rgba(56,189,248,0.85) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                A live system.
              </span>
            </motion.h2>
          </div>

          <motion.p
            initial={noMotion ? false : { opacity: 0, y: 14 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{
              duration: duration.slow,
              delay: 0.15,
              ease: signatureEase,
            }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Other tools store documents. FormaOS enforces your compliance
            program — controls are gated, ownership is structural, and
            evidence is generated as teams operate.
          </motion.p>
        </div>

        {/* ── Bento grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          <PostureCard isInView={isInView} noMotion={noMotion} />
          <EnforcementCard isInView={isInView} noMotion={noMotion} />
          <EvidenceCard isInView={isInView} noMotion={noMotion} />
          <OwnershipCard isInView={isInView} noMotion={noMotion} />
          <AuditCard isInView={isInView} noMotion={noMotion} />
        </div>
      </div>
    </section>
  );
}

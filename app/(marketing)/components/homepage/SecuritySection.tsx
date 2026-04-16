'use client';

import {
  memo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import Link from 'next/link';
import {
  motion,
  useInView,
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
} from 'framer-motion';
import {
  Shield,
  Lock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  FileLock2,
  BadgeCheck,
  ClipboardCheck,
  Fingerprint,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { duration, easing } from '@/config/motion';

const signatureEase: [number, number, number, number] = [
  ...easing.signature,
] as [number, number, number, number];

/* ════════════════════════════════════════════════════════════
   Shared — GlassCard with 3D tilt + spotlight
   ════════════════════════════════════════════════════════════ */

function GlassCard({
  children,
  className = '',
  glowColor = 'rgba(99,102,241,0.12)',
  noMotion,
  delay = 0,
  isInView,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  noMotion: boolean;
  delay?: number;
  isInView: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  const tiltX = hovered && !noMotion ? (mouse.y - 0.5) * -5 : 0;
  const tiltY = hovered && !noMotion ? (mouse.x - 0.5) * 5 : 0;

  return (
    <motion.div
      initial={noMotion ? false : { opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: duration.slow, delay, ease: signatureEase }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setMouse({ x: 0.5, y: 0.5 });
      }}
      className={`group relative ${className}`}
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm transition-colors duration-300 hover:bg-white/[0.04] hover:border-white/[0.1]"
        style={{
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: hovered
            ? 'transform 0.15s ease-out'
            : 'transform 0.4s ease-out',
        }}
      >
        {hovered && !noMotion && (
          <div
            className="absolute inset-0 pointer-events-none opacity-50 z-10"
            style={{
              background: `radial-gradient(400px circle at ${mouse.x * 100}% ${mouse.y * 100}%, ${glowColor}, transparent 70%)`,
            }}
          />
        )}
        <div className="relative z-20 h-full">{children}</div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   AnimatedCounter
   ════════════════════════════════════════════════════════════ */

function AnimatedCounter({
  value,
  isInView,
  noMotion,
  delay = 0,
}: {
  value: number;
  isInView: boolean;
  noMotion: boolean;
  delay?: number;
}) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const [display, setDisplay] = useState(noMotion ? value : 0);

  useEffect(() => {
    if (!isInView || noMotion) return;
    const ctrl = animate(motionVal, value, {
      duration: 1.4,
      delay,
      ease: signatureEase,
    });
    return () => ctrl.stop();
  }, [isInView, noMotion, value, motionVal, delay]);

  useEffect(() => {
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return unsub;
  }, [rounded]);

  return <>{display}</>;
}

/* ════════════════════════════════════════════════════════════
   PostureRing — animated SVG security score
   ════════════════════════════════════════════════════════════ */

function PostureRing({
  score,
  isInView,
  noMotion,
}: {
  score: number;
  isInView: boolean;
  noMotion: boolean;
}) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const dashMotion = useMotionValue(circumference);
  const dashTransform = useTransform(dashMotion, (v) => `${v} ${circumference}`);

  useEffect(() => {
    if (!isInView || noMotion) return;
    const ctrl = animate(dashMotion, offset, {
      duration: 1.8,
      delay: 0.3,
      ease: signatureEase,
    });
    return () => ctrl.stop();
  }, [isInView, noMotion, offset, dashMotion, circumference]);

  return (
    <div className="relative w-[160px] h-[160px] mx-auto">
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full -rotate-90"
        fill="none"
      >
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r="54"
          stroke="rgba(99,102,241,0.1)"
          strokeWidth="6"
        />
        {/* Progress */}
        <motion.circle
          cx="60"
          cy="60"
          r="54"
          stroke="url(#postureGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          style={{ strokeDasharray: dashTransform }}
        />
        {/* Outer glow ring */}
        <circle
          cx="60"
          cy="60"
          r="57"
          stroke="rgba(99,102,241,0.06)"
          strokeWidth="1"
        />
        <defs>
          <linearGradient
            id="postureGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white leading-none">
          <AnimatedCounter
            value={score}
            isInView={isInView}
            noMotion={noMotion}
            delay={0.3}
          />
          <span className="text-lg text-indigo-400/80">%</span>
        </span>
        <span className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">
          Posture Score
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Data
   ════════════════════════════════════════════════════════════ */

const AUDIT_LOG_ENTRIES = [
  {
    action: 'Evidence approved',
    control: 'CC6.1 — Logical access controls',
    actor: 'Sarah M.',
    time: '2 min ago',
    status: 'verified' as const,
  },
  {
    action: 'Control drift detected',
    control: 'A1.2 — Availability monitoring',
    actor: 'System',
    time: '14 min ago',
    status: 'alert' as const,
  },
  {
    action: 'Audit packet exported',
    control: 'SOC 2 Type II — Full pack',
    actor: 'James T.',
    time: '1 hr ago',
    status: 'verified' as const,
  },
  {
    action: 'Policy acknowledged',
    control: 'ISO 27001 — A.5.1 Policies',
    actor: 'Rachel K.',
    time: '3 hr ago',
    status: 'verified' as const,
  },
  {
    action: 'Worker credential updated',
    control: 'NDIS — Worker Screening',
    actor: 'Michael D.',
    time: '5 hr ago',
    status: 'verified' as const,
  },
];

const POSTURE_CONTROLS = [
  { label: 'SOC 2 Controls', mapped: 47, total: 50, color: '#818cf8' },
  { label: 'ISO 27001', mapped: 93, total: 93, color: '#06b6d4' },
  { label: 'NDIS Standards', mapped: 38, total: 38, color: '#34d399' },
];

const ENCRYPTION_LAYERS = [
  { label: 'Data at rest', protocol: 'AES-256', status: 'active' },
  { label: 'Data in transit', protocol: 'TLS 1.3', status: 'active' },
  { label: 'Key management', protocol: 'AWS KMS', status: 'active' },
  { label: 'Backup encryption', protocol: 'AES-256', status: 'active' },
];

const ACCESS_FEATURES = [
  { label: 'SAML 2.0 SSO', detail: 'Okta · Azure AD · Google', active: true },
  { label: 'MFA Enforcement', detail: 'All plans · Policy-driven', active: true },
  { label: 'Role-based Access', detail: '4 roles · Granular perms', active: true },
  { label: 'Session Management', detail: 'Timeout · IP lockdown', active: true },
];

const trustedSectors = [
  'Healthcare & NDIS teams',
  'Aged care operators',
  'Financial services',
  'Education & research',
  'Government programs',
  'Multi-site operators',
];

/* ════════════════════════════════════════════════════════════
   PostureCard — security score + control bars
   ════════════════════════════════════════════════════════════ */

const PostureCard = memo(function PostureCard({
  isInView,
  noMotion,
}: {
  isInView: boolean;
  noMotion: boolean;
}) {
  return (
    <GlassCard
      className="md:col-span-2 md:row-span-2"
      glowColor="rgba(99,102,241,0.12)"
      noMotion={noMotion}
      delay={0.1}
      isInView={isInView}
    >
      <div className="p-5 lg:p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Security Posture
          </span>
        </div>
        <p className="text-[11px] text-slate-600 mb-5">
          Real-time compliance health across all active frameworks
        </p>

        <PostureRing score={98} isInView={isInView} noMotion={noMotion} />

        {/* Control mapping bars */}
        <div className="mt-5 space-y-3 flex-1">
          {POSTURE_CONTROLS.map((ctrl, i) => {
            const pct = Math.round((ctrl.mapped / ctrl.total) * 100);
            return (
              <motion.div
                key={ctrl.label}
                initial={noMotion ? false : { opacity: 0, x: -12 }}
                animate={isInView ? { opacity: 1, x: 0 } : undefined}
                transition={{
                  duration: duration.normal,
                  delay: 0.6 + i * 0.1,
                  ease: signatureEase,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 font-medium">
                    {ctrl.label}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {ctrl.mapped}/{ctrl.total}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: ctrl.color }}
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${pct}%` } : undefined}
                    transition={{
                      duration: 1.2,
                      delay: 0.8 + i * 0.1,
                      ease: signatureEase,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom badge row */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/[0.06]">
          {['SOC 2', 'ISO 27001', 'NDIS', 'HIPAA', 'PCI DSS'].map((fw) => (
            <span
              key={fw}
              className="inline-flex items-center rounded-md border border-indigo-400/15 bg-indigo-500/[0.08] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-400/80"
            >
              {fw}
            </span>
          ))}
        </div>
      </div>
    </GlassCard>
  );
});

/* ════════════════════════════════════════════════════════════
   EncryptionCard — visual lock + layer status
   ════════════════════════════════════════════════════════════ */

const EncryptionCard = memo(function EncryptionCard({
  isInView,
  noMotion,
}: {
  isInView: boolean;
  noMotion: boolean;
}) {
  return (
    <GlassCard
      glowColor="rgba(6,182,212,0.12)"
      noMotion={noMotion}
      delay={0.2}
      isInView={isInView}
    >
      <div className="p-5 lg:p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Encryption
          </span>
        </div>

        {/* Visual lock */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/[0.1] border border-cyan-400/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-cyan-400" />
            </div>
            {!noMotion && (
              <motion.div
                className="absolute inset-0 rounded-xl border border-cyan-400/20"
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </div>
        </div>

        {/* Encryption layers */}
        <div className="space-y-2 flex-1">
          {ENCRYPTION_LAYERS.map((layer, i) => (
            <motion.div
              key={layer.label}
              initial={noMotion ? false : { opacity: 0 }}
              animate={isInView ? { opacity: 1 } : undefined}
              transition={{
                duration: duration.normal,
                delay: 0.5 + i * 0.08,
                ease: signatureEase,
              }}
              className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0"
            >
              <span className="text-xs text-slate-400">{layer.label}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/80 bg-cyan-500/[0.08] border border-cyan-400/15 rounded px-1.5 py-0.5">
                {layer.protocol}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
});

/* ════════════════════════════════════════════════════════════
   AccessCard — identity & access control
   ════════════════════════════════════════════════════════════ */

const AccessCard = memo(function AccessCard({
  isInView,
  noMotion,
}: {
  isInView: boolean;
  noMotion: boolean;
}) {
  return (
    <GlassCard
      glowColor="rgba(52,211,153,0.12)"
      noMotion={noMotion}
      delay={0.3}
      isInView={isInView}
    >
      <div className="p-5 lg:p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Fingerprint className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Identity & Access
          </span>
        </div>

        <div className="space-y-2.5 flex-1">
          {ACCESS_FEATURES.map((feat, i) => (
            <motion.div
              key={feat.label}
              initial={noMotion ? false : { opacity: 0, x: -8 }}
              animate={isInView ? { opacity: 1, x: 0 } : undefined}
              transition={{
                duration: duration.normal,
                delay: 0.5 + i * 0.08,
                ease: signatureEase,
              }}
              className="flex items-start gap-2.5"
            >
              <div className="mt-0.5 shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400/70" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/90 leading-snug">
                  {feat.label}
                </p>
                <p className="text-[10px] text-slate-600">{feat.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
});

/* ════════════════════════════════════════════════════════════
   AuditLogCard — live terminal
   ════════════════════════════════════════════════════════════ */

const AuditLogCard = memo(function AuditLogCard({
  isInView,
  noMotion,
}: {
  isInView: boolean;
  noMotion: boolean;
}) {
  return (
    <GlassCard
      className="md:col-span-4"
      glowColor="rgba(99,102,241,0.1)"
      noMotion={noMotion}
      delay={0.35}
      isInView={isInView}
    >
      <div className="h-full">
        {/* Terminal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">
              Live Audit Log
            </span>
          </div>
          <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">
            Immutable &middot; Timestamped
          </span>
        </div>

        {/* Scanning line */}
        {!noMotion && (
          <div className="relative">
            <motion.div
              className="absolute inset-x-0 h-px pointer-events-none z-30"
              style={{
                background:
                  'linear-gradient(90deg, transparent 5%, rgba(99,102,241,0.4) 30%, rgba(6,182,212,0.6) 50%, rgba(99,102,241,0.4) 70%, transparent 95%)',
                boxShadow: '0 0 12px rgba(99,102,241,0.3)',
              }}
              animate={{ top: ['0px', '64px', '0px'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}

        {/* Entries — horizontal grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-5">
          {AUDIT_LOG_ENTRIES.map((entry, i) => (
            <motion.div
              key={i}
              initial={noMotion ? false : { opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: duration.normal,
                delay: 0.5 + i * 0.06,
                ease: signatureEase,
              }}
              className={`group/entry flex flex-col gap-1.5 px-4 py-3.5 hover:bg-white/[0.02] transition-colors relative ${
                i < 4 ? 'md:border-r md:border-white/[0.04]' : ''
              }`}
            >
              {/* Top accent line */}
              <div
                className="absolute inset-x-3 top-0 h-[2px] rounded-full transition-opacity duration-300 opacity-0 group-hover/entry:opacity-100"
                style={{
                  background:
                    entry.status === 'verified'
                      ? 'linear-gradient(90deg, rgba(52,211,153,0.5), transparent)'
                      : 'linear-gradient(90deg, rgba(251,191,36,0.5), transparent)',
                }}
              />
              <div className="flex items-center gap-2">
                {entry.status === 'verified' ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400/70 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
                )}
                <p className="text-[13px] font-medium text-white/90 truncate">
                  {entry.action}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {entry.control}
              </p>
              <div className="flex items-center gap-1.5 mt-auto">
                <span className="text-[10px] text-slate-600">
                  {entry.actor}
                </span>
                <span className="text-[10px] text-slate-700">&middot;</span>
                <span className="text-[10px] text-slate-600">{entry.time}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats footer */}
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-5 py-3 grid grid-cols-4 gap-3">
          {[
            { value: 9, label: 'Framework packs', suffix: 'packs' },
            { value: 100, label: 'Audit coverage', suffix: '%' },
            { value: 4, label: 'Access roles', suffix: 'roles' },
            { value: 14, label: 'Free trial', suffix: 'days' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={noMotion ? false : { opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: duration.normal,
                delay: 0.8 + i * 0.06,
                ease: signatureEase,
              }}
              className="text-center"
            >
              <p className="text-sm font-bold text-indigo-400">
                <AnimatedCounter
                  value={stat.value}
                  isInView={isInView}
                  noMotion={noMotion}
                  delay={0.8 + i * 0.06}
                />
                <span className="text-[10px] text-indigo-400/60 ml-0.5 font-medium">
                  {stat.suffix}
                </span>
              </p>
              <p className="text-[9px] text-slate-600 mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
});

/* ════════════════════════════════════════════════════════════
   DataResidencyCard — AU hosting visual
   ════════════════════════════════════════════════════════════ */

const DataResidencyCard = memo(function DataResidencyCard({
  isInView,
  noMotion,
}: {
  isInView: boolean;
  noMotion: boolean;
}) {
  return (
    <GlassCard
      glowColor="rgba(52,211,153,0.1)"
      noMotion={noMotion}
      delay={0.35}
      isInView={isInView}
    >
      <div className="p-5 lg:p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="relative mb-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/[0.1] border border-emerald-400/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          {!noMotion && (
            <motion.div
              className="absolute inset-0 rounded-xl border border-emerald-400/15"
              animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>
        <p className="text-sm font-semibold text-white mb-1">AU-Hosted</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Australian data residency by default. Sovereignty-first
          infrastructure.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-emerald-400/15 bg-emerald-500/[0.08] px-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
            Sovereignty
          </span>
        </div>
      </div>
    </GlassCard>
  );
});

/* ════════════════════════════════════════════════════════════
   AuditReadyCard — tamper-evident visual
   ════════════════════════════════════════════════════════════ */

const AuditReadyCard = memo(function AuditReadyCard({
  isInView,
  noMotion,
}: {
  isInView: boolean;
  noMotion: boolean;
}) {
  return (
    <GlassCard
      glowColor="rgba(251,191,36,0.1)"
      noMotion={noMotion}
      delay={0.4}
      isInView={isInView}
    >
      <div className="p-5 lg:p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="relative mb-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/[0.1] border border-amber-400/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          {!noMotion && (
            <motion.div
              className="absolute inset-0 rounded-xl border border-amber-400/15"
              animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
              transition={{
                duration: 4,
                delay: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>
        <p className="text-sm font-semibold text-white mb-1">Tamper-Evident</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Immutable audit trails. Every action logged, timestamped, and
          regulator-ready.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-400/15 bg-amber-500/[0.08] px-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
            Immutable
          </span>
        </div>
      </div>
    </GlassCard>
  );
});

/* ════════════════════════════════════════════════════════════
   Main SecuritySection
   ════════════════════════════════════════════════════════════ */

export const SecuritySection = memo(function SecuritySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const noMotion = Boolean(useReducedMotion());
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="mk-section home-section home-section--proof relative overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #020617 0%, #070c1f 30%, #0c1129 60%, #020617 100%)',
      }}
    >
      {/* Edge lines */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(99,102,241,0.12) 30%, rgba(99,102,241,0.2) 50%, rgba(99,102,241,0.12) 70%, transparent 95%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(99,102,241,0.08) 50%, transparent 95%)',
        }}
      />

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{ left: '-5%', top: '10%', background: 'rgba(99,102,241,0.06)' }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[130px]"
          style={{ right: '0%', bottom: '5%', background: 'rgba(6,182,212,0.04)' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ left: '30%', top: '50%', background: 'rgba(52,211,153,0.03)' }}
          animate={noMotion ? false : { opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Heading — centered */}
        <div className="text-center mb-12 lg:mb-14">
          <motion.div
            initial={noMotion ? false : { opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: duration.slow, ease: signatureEase }}
            className="mb-5"
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/[0.08] border border-indigo-400/20 text-indigo-400 text-xs font-medium">
              <span className="relative flex h-1.5 w-1.5">
                {!noMotion && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
                )}
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
              </span>
              Security &amp; Trust
            </span>
          </motion.div>

          <motion.div
            initial={noMotion ? false : { opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{
              duration: duration.slow,
              delay: 0.05,
              ease: signatureEase,
            }}
            className="relative"
          >
            {!noMotion && (
              <motion.div
                className="absolute -inset-x-16 -inset-y-6 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse 40% 60% at 50% 50%, rgba(99,102,241,0.08), transparent)',
                  filter: 'blur(24px)',
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
            <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Security built into{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #818cf8, #6366f1, #a78bfa)',
                }}
              >
                the platform layer
              </span>
            </h2>
          </motion.div>

          <motion.p
            initial={noMotion ? false : { opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{
              duration: duration.slow,
              delay: 0.1,
              ease: signatureEase,
            }}
            className="text-sm sm:text-base text-slate-400 mt-4 max-w-2xl mx-auto leading-relaxed"
          >
            Controls are enforced, not just documented. Encryption, identity
            governance, and tamper-evident audit logs are infrastructure — not
            add-ons.
          </motion.p>
        </div>

        {/* ══ Bento Grid ══ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 lg:gap-4">
          {/* Row 1: Posture (2 cols, 2 rows) | Encryption | DataResidency */}
          <PostureCard isInView={isInView} noMotion={noMotion} />
          <EncryptionCard isInView={isInView} noMotion={noMotion} />
          <DataResidencyCard isInView={isInView} noMotion={noMotion} />

          {/* Row 2 (Posture continues cols 1-2) | Access | AuditReady */}
          <AccessCard isInView={isInView} noMotion={noMotion} />
          <AuditReadyCard isInView={isInView} noMotion={noMotion} />

          {/* Row 3: AuditLog — full width */}
          <AuditLogCard isInView={isInView} noMotion={noMotion} />
        </div>

        {/* Trusted sectors */}
        <motion.div
          initial={noMotion ? false : { opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{
            duration: duration.slow,
            delay: 0.6,
            ease: signatureEase,
          }}
          className="mt-10"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 mb-4 text-center">
            Trusted by regulated teams across Australia
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {trustedSectors.map((sector, i) => (
              <motion.div
                key={sector}
                initial={noMotion ? false : { opacity: 0, y: 8 }}
                animate={isInView ? { opacity: 1, y: 0 } : undefined}
                transition={{
                  duration: duration.normal,
                  delay: 0.7 + i * 0.04,
                  ease: signatureEase,
                }}
                className="group flex items-center justify-center p-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-400/15 transition-all duration-300"
              >
                <span className="text-slate-500 group-hover:text-slate-300 transition-colors duration-300 text-xs font-medium text-center">
                  {sector}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA links */}
        <motion.div
          initial={noMotion ? false : { opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{
            duration: duration.slow,
            delay: 0.75,
            ease: signatureEase,
          }}
          className="mt-6 grid gap-3 md:grid-cols-3"
        >
          <Link
            href="/trust/packet"
            className="mk-btn mk-btn-primary group flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-indigo-100"
          >
            <span className="inline-flex items-center gap-2 font-medium">
              <FileLock2 className="h-4 w-4" />
              Security Review Packet
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/frameworks"
            className="mk-btn mk-btn-secondary group flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
          >
            <span className="inline-flex items-center gap-2 font-medium">
              <BadgeCheck className="h-4 w-4" />
              Framework Coverage
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/customer-stories"
            className="mk-btn mk-btn-secondary group flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
          >
            <span className="inline-flex items-center gap-2 font-medium">
              <ClipboardCheck className="h-4 w-4" />
              Customer Stories
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
});

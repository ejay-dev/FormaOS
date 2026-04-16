'use client';

import { memo, useRef, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  FileCheck,
  Heart,
  CreditCard,
  Globe,
  Layers,
} from 'lucide-react';
import LogoLoop from './LogoLoop';
import { duration, easing } from '@/config/motion';

const signatureEase: [number, number, number, number] = [
  ...easing.signature,
] as [number, number, number, number];

/* ════════════════════════════════════════════════════════════
   Badge color system — by category
   ════════════════════════════════════════════════════════════ */

type Accent = 'teal' | 'rose' | 'amber' | 'violet' | 'cyan';

const ACCENT_MAP: Record<Accent, { icon: string; bg: string; border: string }> =
  {
    teal: {
      icon: 'text-teal-400',
      bg: 'bg-teal-500/[0.08]',
      border: 'hover:border-teal-400/25',
    },
    cyan: {
      icon: 'text-cyan-400',
      bg: 'bg-cyan-500/[0.08]',
      border: 'hover:border-cyan-400/25',
    },
    rose: {
      icon: 'text-rose-400',
      bg: 'bg-rose-500/[0.06]',
      border: 'hover:border-rose-400/20',
    },
    amber: {
      icon: 'text-amber-400',
      bg: 'bg-amber-500/[0.07]',
      border: 'hover:border-amber-400/20',
    },
    violet: {
      icon: 'text-violet-400',
      bg: 'bg-violet-500/[0.07]',
      border: 'hover:border-violet-400/20',
    },
  };

interface FrameworkItem {
  icon: ReactNode;
  label: string;
  accent: Accent;
}

/* Row 1 — Australian + some intl, scrolls left */
const ROW_1: FrameworkItem[] = [
  { icon: <Heart size={14} />, label: 'NDIS Practice Standards', accent: 'rose' },
  { icon: <Heart size={14} />, label: 'Aged Care Quality Standards', accent: 'rose' },
  { icon: <ShieldCheck size={14} />, label: 'NSQHS Standards', accent: 'teal' },
  { icon: <Shield size={14} />, label: 'AHPRA', accent: 'teal' },
  { icon: <CreditCard size={14} />, label: 'ASIC s912A', accent: 'amber' },
  { icon: <Shield size={14} />, label: 'APRA CPS 230', accent: 'amber' },
  { icon: <FileCheck size={14} />, label: 'AUSTRAC AML/CTF', accent: 'amber' },
  { icon: <Layers size={14} />, label: 'ACECQA NQF', accent: 'violet' },
  { icon: <ShieldCheck size={14} />, label: 'WHS Act', accent: 'teal' },
];

/* Row 2 — International standards, scrolls right */
const ROW_2: FrameworkItem[] = [
  { icon: <Shield size={14} />, label: 'SafeWork Australia', accent: 'teal' },
  { icon: <Shield size={14} />, label: 'ISO 27001', accent: 'cyan' },
  { icon: <ShieldCheck size={14} />, label: 'SOC 2', accent: 'cyan' },
  { icon: <Globe size={14} />, label: 'GDPR', accent: 'violet' },
  { icon: <Layers size={14} />, label: 'NIST CSF', accent: 'cyan' },
  { icon: <CreditCard size={14} />, label: 'PCI DSS', accent: 'amber' },
  { icon: <Heart size={14} />, label: 'HIPAA', accent: 'rose' },
  { icon: <FileCheck size={14} />, label: 'CIS Controls', accent: 'cyan' },
  { icon: <Shield size={14} />, label: 'ISO 9001', accent: 'cyan' },
];

/* ════════════════════════════════════════════════════════════
   Badge component — color-coded by category
   ════════════════════════════════════════════════════════════ */

const FrameworkBadge = memo(function FrameworkBadge({
  icon,
  label,
  accent,
}: FrameworkItem) {
  const a = ACCENT_MAP[accent];
  return (
    <span
      className={`group inline-flex items-center gap-2.5 rounded-full border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 backdrop-blur-sm transition-all duration-300 ${a.border} hover:bg-white/[0.06] hover:-translate-y-px`}
    >
      <span
        className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full ${a.bg} ${a.icon} transition-colors duration-300`}
      >
        {icon}
      </span>
      <span className="whitespace-nowrap text-[13px] font-medium leading-none tracking-wide text-slate-400 transition-colors duration-300 group-hover:text-slate-200">
        {label}
      </span>
    </span>
  );
});

/* Build LogoLoop-compatible arrays */
function toLogoItems(items: FrameworkItem[]) {
  return items.map((item) => ({
    node: (
      <FrameworkBadge
        icon={item.icon}
        label={item.label}
        accent={item.accent}
      />
    ),
    title: item.label,
    ariaLabel: item.label,
  }));
}

const row1Logos = toLogoItems(ROW_1);
const row2Logos = toLogoItems(ROW_2);

const FADE_COLOR = '#030712';

/* ════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════ */

export const FrameworkTrustStrip = memo(function FrameworkTrustStrip({
  className = '',
}: {
  className?: string;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const noMotion = Boolean(useReducedMotion());
  const isInView = useInView(sectionRef, { once: true, margin: '-40px' });

  return (
    <section
      ref={sectionRef}
      className={`relative z-10 overflow-hidden py-4 sm:py-5 ${className}`}
      style={{
        background:
          'linear-gradient(180deg, #020617 0%, #050a15 50%, #020617 100%)',
      }}
      aria-label="Supported compliance frameworks"
    >
      {/* Ambient center glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full blur-[120px]"
          style={{ background: 'rgba(6,182,212,0.03)' }}
        />
      </div>

      {/* Top/bottom edge lines */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.05) 50%, transparent 90%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.05) 50%, transparent 90%)',
        }}
      />

      <div className="relative z-10">
        {/* Heading */}
        <motion.div
          initial={noMotion ? false : { opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: duration.slow, ease: signatureEase }}
          className="text-center mb-4 sm:mb-5 px-6"
        >
          <div className="inline-flex items-center gap-3 text-sm text-slate-500">
            <span
              className="h-px w-8 sm:w-12"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.15))',
              }}
            />
            <span className="font-medium tracking-wide">
              <span className="text-white font-bold">18+</span> compliance
              frameworks built in
            </span>
            <span
              className="h-px w-8 sm:w-12"
              style={{
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0.15), transparent)',
              }}
            />
          </div>
        </motion.div>

        {/* Row 1 — scrolls left */}
        <motion.div
          initial={noMotion ? false : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : undefined}
          transition={{ duration: duration.slow, delay: 0.1, ease: signatureEase }}
          className="mb-4"
        >
          <LogoLoop
            logos={row1Logos}
            speed={30}
            direction="left"
            logoHeight={44}
            gap={14}
            hoverSpeed={10}
            fadeOut
            fadeOutColor={FADE_COLOR}
            ariaLabel="Australian compliance frameworks"
          />
        </motion.div>

        {/* Row 2 — scrolls right */}
        <motion.div
          initial={noMotion ? false : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : undefined}
          transition={{ duration: duration.slow, delay: 0.2, ease: signatureEase }}
        >
          <LogoLoop
            logos={row2Logos}
            speed={25}
            direction="right"
            logoHeight={44}
            gap={14}
            hoverSpeed={10}
            fadeOut
            fadeOutColor={FADE_COLOR}
            ariaLabel="International compliance frameworks"
          />
        </motion.div>
      </div>
    </section>
  );
});

export default FrameworkTrustStrip;

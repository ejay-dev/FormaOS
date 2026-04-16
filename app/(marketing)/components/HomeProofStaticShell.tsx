'use client';

import { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { ArrowRight, ShieldCheck, Building2, FileCheck2 } from 'lucide-react';
import { duration, easing } from '@/config/motion';

const signatureEase: [number, number, number, number] = [
  ...easing.signature,
] as [number, number, number, number];

/* ════════════════════════════════════════════════════════════
   Data
   ════════════════════════════════════════════════════════════ */

const PROOF_BLOCKS = [
  {
    icon: FileCheck2,
    eyebrow: 'For Operators',
    title: 'Controls run as workflows, not as documents',
    body: 'Named tasks, approval gates, and evidence chains execute inside daily operations — not in a separate compliance layer.',
    href: '/product',
    cta: 'See how it works',
    step: '01',
    color: {
      accent: 'rgba(6, 182, 212, 1)',
      glow: 'rgba(6, 182, 212, 0.12)',
      border: 'rgba(6, 182, 212, 0.25)',
      iconBg: 'bg-cyan-500/10',
      iconBorder: 'border-cyan-400/25',
      iconText: 'text-cyan-300',
      eyebrow: 'text-cyan-300',
    },
  },
  {
    icon: Building2,
    eyebrow: 'For Enterprise Buyers',
    title: 'One evaluation flow from security review to rollout',
    body: 'Identity controls, audit exports, hosting posture, and procurement artifacts stay in a single narrative buyers can verify.',
    href: '/enterprise',
    cta: 'See enterprise path',
    step: '02',
    color: {
      accent: 'rgba(139, 92, 246, 1)',
      glow: 'rgba(139, 92, 246, 0.12)',
      border: 'rgba(139, 92, 246, 0.25)',
      iconBg: 'bg-violet-500/10',
      iconBorder: 'border-violet-400/25',
      iconText: 'text-violet-300',
      eyebrow: 'text-violet-300',
    },
  },
  {
    icon: ShieldCheck,
    eyebrow: 'For Security Reviewers',
    title: 'Trust evidence is visible before the first call',
    body: 'Trust documentation, evidence defensibility, and review-ready context surface early so reviewers can verify substance upfront.',
    href: '/trust',
    cta: 'Visit trust center',
    step: '03',
    color: {
      accent: 'rgba(16, 185, 129, 1)',
      glow: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.25)',
      iconBg: 'bg-emerald-500/10',
      iconBorder: 'border-emerald-400/25',
      iconText: 'text-emerald-300',
      eyebrow: 'text-emerald-300',
    },
  },
] as const;

/* Deterministic particle positions (SSR-safe) */
const PARTICLES = [
  { left: '8%', top: '18%', size: 2, delay: 0, dur: 14 },
  { left: '25%', top: '72%', size: 1.5, delay: 2.2, dur: 16 },
  { left: '42%', top: '28%', size: 2.5, delay: 4, dur: 12 },
  { left: '60%', top: '82%', size: 1, delay: 1.4, dur: 15 },
  { left: '78%', top: '22%', size: 2, delay: 3.2, dur: 13 },
  { left: '90%', top: '60%', size: 1.5, delay: 5, dur: 14 },
];

/* ════════════════════════════════════════════════════════════
   Interactive Tilt Card
   ════════════════════════════════════════════════════════════ */

function ConvictionCard({
  block,
  index,
  isInView,
  noMotion,
}: {
  block: (typeof PROOF_BLOCKS)[number];
  index: number;
  isInView: boolean;
  noMotion: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [hovered, setHovered] = useState(false);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || noMotion) return;
      const r = cardRef.current.getBoundingClientRect();
      setMouse({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    },
    [noMotion],
  );

  const tiltX = hovered && !noMotion ? (mouse.y - 0.5) * -10 : 0;
  const tiltY = hovered && !noMotion ? (mouse.x - 0.5) * 10 : 0;

  return (
    <motion.div
      initial={noMotion ? false : { opacity: 0, y: 48, scale: 0.92 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{
        duration: duration.slower,
        delay: 0.3 + index * 0.18,
        ease: signatureEase,
      }}
    >
      <article
        ref={cardRef}
        onMouseMove={onMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setMouse({ x: 0.5, y: 0.5 });
        }}
        className="group relative h-full"
        style={{ perspective: '1200px' }}
      >
        <div
          className="relative h-full overflow-hidden rounded-2xl"
          style={{
            transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
            transition: 'transform 0.2s ease-out',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* ── Rotating conic gradient border ── */}
          <div className="absolute inset-0 rounded-2xl p-[1px] overflow-hidden">
            <motion.div
              className="absolute inset-[-200%]"
              animate={noMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{
                background: `conic-gradient(from 0deg, transparent 0%, ${block.color.accent} 8%, transparent 16%, transparent 100%)`,
                opacity: hovered ? 0.9 : 0.25,
                transition: 'opacity 0.4s ease',
              }}
            />
          </div>

          {/* ── Card surface ── */}
          <div className="relative h-full rounded-2xl bg-slate-950/90 backdrop-blur-xl p-6 sm:p-8">
            {/* Mouse-tracking spotlight */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: hovered
                  ? `radial-gradient(480px circle at ${mouse.x * 100}% ${mouse.y * 100}%, ${block.color.glow}, transparent 40%)`
                  : 'none',
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />

            {/* Step watermark */}
            <span
              className="absolute top-2 right-4 text-8xl font-black pointer-events-none select-none"
              style={{
                background: `linear-gradient(180deg, ${block.color.accent}, transparent)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                opacity: hovered ? 0.09 : 0.04,
                transition: 'opacity 0.4s ease',
              }}
            >
              {block.step}
            </span>

            {/* Icon + pulse rings */}
            <div className="relative inline-flex">
              <div
                className={`relative z-10 inline-flex rounded-xl border ${block.color.iconBorder} ${block.color.iconBg} p-3.5 backdrop-blur-sm`}
              >
                <block.icon
                  className={`h-5 w-5 ${block.color.iconText}`}
                  aria-hidden="true"
                />
              </div>
              {!noMotion && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    animate={{ scale: [1, 1.7], opacity: [0.3, 0] }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'easeOut',
                      delay: index * 0.35,
                    }}
                    style={{ border: `1.5px solid ${block.color.accent}` }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    animate={{ scale: [1, 2.1], opacity: [0.15, 0] }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'easeOut',
                      delay: index * 0.35 + 0.7,
                    }}
                    style={{ border: `1px solid ${block.color.accent}` }}
                  />
                </>
              )}
            </div>

            {/* Text content */}
            <p
              className={`mt-5 text-xs font-semibold uppercase tracking-[0.2em] ${block.color.eyebrow}`}
            >
              {block.eyebrow}
            </p>
            <h3 className="mt-2.5 text-xl font-semibold leading-snug text-white">
              {block.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {block.body}
            </p>

            {/* CTA */}
            <Link
              href={block.href}
              className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${block.color.eyebrow} transition-all duration-300 hover:gap-3`}
            >
              {block.cta}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </article>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   Main Section
   ════════════════════════════════════════════════════════════ */

export function HomeProofStaticShell() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const noMotion = Boolean(useReducedMotion());
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 overflow-hidden px-6 pt-20 pb-4 sm:px-8 sm:pt-24 sm:pb-6 lg:px-12 lg:pt-28 lg:pb-8"
      style={{
        background:
          'linear-gradient(180deg, #020617 0%, #0a0f1f 40%, #0f172a 70%, #020617 100%)',
      }}
    >
      {/* ── Ambient background orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ left: '5%', top: '25%', background: 'rgba(6, 182, 212, 0.06)' }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{ left: '35%', top: '15%', background: 'rgba(139, 92, 246, 0.05)' }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ right: '5%', top: '30%', background: 'rgba(16, 185, 129, 0.06)' }}
        />
      </div>

      {/* ── Subtle grid overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* ── Floating particles ── */}
      {!noMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/20"
              style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
              animate={{ y: [0, -35, 0], opacity: [0.15, 0.45, 0.15] }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Top edge glow ── */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.3) 25%, rgba(139,92,246,0.3) 50%, rgba(16,185,129,0.3) 75%, transparent 100%)',
        }}
      />
      {/* ── Bottom edge glow ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.15) 25%, rgba(139,92,246,0.15) 50%, rgba(16,185,129,0.15) 75%, transparent 100%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* ── Section header ── */}
        <div className="text-center max-w-3xl mx-auto">
          {/* Animated pill badge */}
          <motion.div
            initial={noMotion ? false : { opacity: 0, y: 16, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : undefined}
            transition={{ duration: duration.slow, ease: signatureEase }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] mb-6"
          >
            {!noMotion ? (
              <motion.span
                className="w-2 h-2 rounded-full"
                style={{ background: 'rgba(6, 182, 212, 1)' }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            ) : (
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: 'rgba(6, 182, 212, 1)' }}
              />
            )}
            <span className="text-sm font-medium text-slate-300">
              Why Buyers Stay
            </span>
          </motion.div>

          {/* Heading with ambient glow bloom */}
          <div className="relative">
            {/* Soft glow bloom behind the subtitle text */}
            {!noMotion ? (
              <motion.div
                className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[70%] h-[60%] rounded-full blur-[60px] pointer-events-none"
                animate={{ opacity: [0.12, 0.22, 0.12] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background:
                    'linear-gradient(135deg, rgba(6,182,212,0.5), rgba(139,92,246,0.35))',
                }}
              />
            ) : (
              <div
                className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[70%] h-[60%] rounded-full blur-[60px] pointer-events-none"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(139,92,246,0.2))',
                  opacity: 0.15,
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
              className="relative text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
            >
              <span className="text-white">Three paths to conviction</span>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> — </span>
              <span
                className="bg-clip-text"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, rgba(6,182,212,1) 0%, rgba(167,139,250,0.85) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                visible before the first call
              </span>
            </motion.h2>
          </div>

          <motion.p
            initial={noMotion ? false : { opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{
              duration: duration.slow,
              delay: 0.2,
              ease: signatureEase,
            }}
            className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Operators see accountable workflows. Security reviewers see
            defensible evidence. Procurement sees a structured evaluation path.
            Each audience gets substance without waiting for a demo.
          </motion.p>
        </div>

        {/* ── Card grid ── */}
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {PROOF_BLOCKS.map((block, i) => (
            <ConvictionCard
              key={block.title}
              block={block}
              index={i}
              isInView={isInView}
              noMotion={noMotion}
            />
          ))}
        </div>
      </div>

    </section>
  );
}

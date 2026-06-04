'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Building2, FileCheck2 } from 'lucide-react';
import { duration, easing } from '@/config/motion';

const signatureEase: [number, number, number, number] = [
  ...easing.signature,
] as [number, number, number, number];

/* ════════════════════════════════════════════════════════════
   Data, three audiences, one evaluation. No per-card colour
   identity: the palette stays monochrome so the copy carries it.
   ════════════════════════════════════════════════════════════ */

const PROOF_BLOCKS = [
  {
    icon: FileCheck2,
    eyebrow: 'For operators',
    title: 'Controls run as workflows, not as documents',
    body: 'Named tasks, approval gates, and evidence chains execute inside daily operations, not in a separate compliance layer.',
    href: '/product',
    cta: 'See how it works',
    step: '01',
  },
  {
    icon: Building2,
    eyebrow: 'For enterprise buyers',
    title: 'One evaluation flow from security review to rollout',
    body: 'Identity controls, audit exports, hosting posture, and procurement artifacts stay in a single narrative buyers can verify.',
    href: '/enterprise',
    cta: 'See enterprise path',
    step: '02',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'For security reviewers',
    title: 'Trust evidence is visible before the first call',
    body: 'Trust documentation, evidence defensibility, and review-ready context surface early so reviewers can verify substance upfront.',
    href: '/trust',
    cta: 'Visit trust center',
    step: '03',
  },
] as const;

/* ════════════════════════════════════════════════════════════
   Card, restrained surface, hairline border, quiet hover lift.
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
  return (
    <motion.article
      initial={noMotion ? false : { opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: duration.slow,
        delay: 0.12 + index * 0.1,
        ease: signatureEase,
      }}
      className="group relative flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 transition-colors duration-300 hover:border-white/20 sm:p-8"
    >
      {/* Quiet step index, typographic, not a watermark gimmick */}
      <span className="absolute right-6 top-6 text-sm font-medium tabular-nums text-slate-600">
        {block.step}
      </span>

      {/* Monochrome icon tile */}
      <div className="inline-flex w-fit rounded-xl border border-white/10 bg-white/[0.05] p-3">
        <block.icon className="h-5 w-5 text-slate-300" aria-hidden="true" />
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {block.eyebrow}
      </p>
      <h3 className="mt-2.5 text-lg font-semibold leading-snug text-white">
        {block.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{block.body}</p>

      <Link
        href={block.href}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white"
      >
        {block.cta}
        <ArrowRight
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </motion.article>
  );
}

/* ════════════════════════════════════════════════════════════
   Section
   ════════════════════════════════════════════════════════════ */

export function HomeProofStaticShell() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const noMotion = Boolean(useReducedMotion());
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 overflow-hidden bg-slate-950 px-6 pt-20 pb-4 sm:px-8 sm:pt-24 sm:pb-6 lg:px-12 lg:pt-28 lg:pb-8"
    >
      {/* Single hairline top seam, no rainbow edge glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-14">
          <motion.p
            initial={noMotion ? false : { opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: duration.slow, ease: signatureEase }}
            className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
          >
            Why buyers stay
          </motion.p>

          <motion.h2
            initial={noMotion ? false : { opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: duration.slow, delay: 0.08, ease: signatureEase }}
            className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.6rem]"
          >
            Three paths to conviction,
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            <span className="text-slate-400">visible before the first call</span>
          </motion.h2>

          <motion.p
            initial={noMotion ? false : { opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: duration.slow, delay: 0.16, ease: signatureEase }}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400"
          >
            Operators see accountable workflows. Security reviewers see
            defensible evidence. Procurement sees a structured evaluation path.
            Each audience gets substance without waiting for a demo.
          </motion.p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
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

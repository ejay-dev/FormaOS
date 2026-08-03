'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ClipboardList, FileCheck2, GitPullRequestArrow, ShieldCheck, Workflow } from 'lucide-react';
import { duration, easing } from '@/config/motion';

const signatureEase: [number, number, number, number] = [
  ...easing.signature,
] as [number, number, number, number];

const steps = [
  {
    icon: ClipboardList,
    title: 'Define compliance workflow',
    body: 'Map the operational process, owners, due dates, evidence, and review points.',
  },
  {
    icon: GitPullRequestArrow,
    title: 'Assign rules',
    body: 'Set what must be present before work can move forward.',
  },
  {
    icon: Workflow,
    title: 'System enforces execution',
    body: 'FormaOS runs checks continuously and blocks incomplete paths.',
  },
  {
    icon: FileCheck2,
    title: 'Evidence generated automatically',
    body: 'Actions, approvals, timestamps, and context become audit evidence.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit ready anytime',
    body: 'Export the evidence chain instead of rebuilding it under pressure.',
  },
];

export function HowItWorks({ className = '' }: { className?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const noMotion = Boolean(useReducedMotion());
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className={`relative isolate overflow-hidden bg-marketing-bg px-6 py-20 sm:py-24 lg:px-12 ${className}`}
    >
      {/* Single hairline top seam — no rainbow edge glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-14">
          <motion.h2
            initial={noMotion ? false : { opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: duration.slow, delay: 0.08, ease: signatureEase }}
            className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.6rem]"
          >
            From obligation to <span className="text-zinc-400">enforced evidence chain</span>
          </motion.h2>

          <motion.p
            initial={noMotion ? false : { opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: duration.slow, delay: 0.16, ease: signatureEase }}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400"
          >
            FormaOS turns compliance into a continuous operating loop rather
            than a document clean-up project before an audit.
          </motion.p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={noMotion ? false : { opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: duration.slow,
                delay: 0.12 + index * 0.08,
                ease: signatureEase,
              }}
              className="group relative flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-colors duration-300 hover:border-white/20"
            >
              {/* The steps are a real sequence, so the order is carried by
                  the connecting rule and left-to-right position rather than
                  a stencilled "01"/"02" on every card. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-full top-[2.15rem] hidden h-px w-4 bg-white/10 group-last:hidden md:block"
              />
              <div className="inline-flex w-fit rounded-xl border border-white/10 bg-white/[0.05] p-3">
                <step.icon className="h-5 w-5 text-zinc-300" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{step.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

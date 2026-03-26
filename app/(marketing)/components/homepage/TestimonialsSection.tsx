'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const PROOF_PATTERNS = [
  {
    sector: 'Healthcare operators',
    title: 'Keep evidence close to the work that created it',
    detail:
      'Progress notes, approvals, and follow-up tasks stay linked to the workflow that generated them.',
    proof: 'Evidence stays attached to care delivery',
    accentClass: 'from-cyan-500/20 to-blue-500/20',
    borderClass: 'border-cyan-500/20',
  },
  {
    sector: 'NDIS and social care teams',
    title: 'Standardize incidents, credentials, and approvals',
    detail:
      'Critical records move through one governed process instead of separate folders, inboxes, and spreadsheets.',
    proof: 'Operational records stay review-ready',
    accentClass: 'from-blue-500/20 to-violet-500/20',
    borderClass: 'border-blue-500/20',
  },
  {
    sector: 'Financial and governance teams',
    title: 'Replace stitched-together status updates with one posture view',
    detail:
      'Leaders can review control ownership, exceptions, and evidence readiness without waiting for manual rollups.',
    proof: 'Governance reporting becomes a live operating view',
    accentClass: 'from-violet-500/20 to-indigo-500/20',
    borderClass: 'border-violet-500/20',
  },
  {
    sector: 'Multi-site regulated groups',
    title: 'Run one compliance model across teams and locations',
    detail:
      'Shared controls, assigned ownership, and exportable history make multi-entity oversight easier to defend.',
    proof: 'Shared operating model with local accountability',
    accentClass: 'from-emerald-500/20 to-teal-500/20',
    borderClass: 'border-emerald-500/20',
  },
] as const;

export function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-16 max-w-2xl text-center"
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Operating Proof
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Proof patterns from regulated operations
        </h2>
        <p className="mt-4 text-base text-slate-400">
          The strongest FormaOS signal is not a slogan. It is a clearer
          operating model for teams that need accountable workflows and
          review-ready evidence.
        </p>
      </motion.div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2">
        {PROOF_PATTERNS.map((pattern, i) => (
          <motion.article
            key={pattern.title}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: i * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`relative flex flex-col rounded-2xl border bg-white/[0.03] p-5 sm:p-8 backdrop-blur-sm ${pattern.borderClass}`}
          >
            <div
              className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${pattern.accentClass} opacity-40`}
            />

            <div className="relative inline-flex items-center gap-2 self-start rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              {pattern.sector}
            </div>

            <div className="relative mt-5 flex-1">
              <h3 className="text-xl font-semibold text-white">
                {pattern.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-slate-300">
                {pattern.detail}
              </p>
            </div>

            <div className="relative mt-6 border-t border-white/[0.06] pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                Enterprise signal
              </p>
              <p className="mt-2 text-sm text-slate-200">{pattern.proof}</p>
            </div>
          </motion.article>
        ))}
      </div>

      {/* CTA under testimonials */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-12 text-center"
      >
        <a
          href="/use-cases/healthcare"
          className="text-sm font-semibold text-cyan-400 underline-offset-4 hover:underline"
        >
          Explore regulated use cases <ArrowRight className="ml-1 inline h-4 w-4" />
        </a>
      </motion.div>
    </section>
  );
}

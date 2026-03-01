'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote:
      'FormaOS eliminated three weeks of scramble before every NDIS audit. Our team maintains continuous readiness instead of firefighting once a year.',
    name: 'Sarah M.',
    role: 'Operations Manager',
    org: 'Disability Services Provider',
    sector: 'NDIS',
    accentClass: 'from-cyan-500/20 to-blue-500/20',
    borderClass: 'border-cyan-500/20',
  },
  {
    quote:
      'The evidence chain reduced our SOC 2 audit cycle from six months to six weeks. Auditors now have everything they need in a single defensible package.',
    name: 'James T.',
    role: 'Chief Information Security Officer',
    org: 'Healthcare Technology Platform',
    sector: 'Healthcare',
    accentClass: 'from-blue-500/20 to-violet-500/20',
    borderClass: 'border-blue-500/20',
  },
  {
    quote:
      "Finally, a compliance platform designed for operations teams, not just IT. Our frontline staff actually use it — because the workflows make sense to them.",
    name: 'Rachel K.',
    role: 'Head of Governance & Risk',
    org: 'Regional Financial Services Group',
    sector: 'Financial Services',
    accentClass: 'from-violet-500/20 to-indigo-500/20',
    borderClass: 'border-violet-500/20',
  },
  {
    quote:
      'Standard 8 reporting used to consume two full weeks per quarter. With FormaOS we close the same governance cycle in under two days — with a traceable evidence trail the Commission accepts without question.',
    name: 'Michael D.',
    role: 'Quality & Compliance Lead',
    org: 'Residential Aged Care Group',
    sector: 'Aged Care',
    accentClass: 'from-emerald-500/20 to-teal-500/20',
    borderClass: 'border-emerald-500/20',
  },
  {
    quote:
      'Our SafeWork audit was the first one where we walked in with a complete digital evidence package. Incident logs, corrective actions, worker credential records — all exportable in under five minutes.',
    name: 'Priya N.',
    role: 'WHS & Compliance Manager',
    org: 'Construction & Infrastructure Group',
    sector: 'Construction',
    accentClass: 'from-amber-500/20 to-orange-500/20',
    borderClass: 'border-amber-500/20',
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
          From the teams using FormaOS
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Proof from regulated operations
        </h2>
        <p className="mt-4 text-base text-slate-400">
          Healthcare, disability services, and financial teams running compliance as governance — not guesswork.
        </p>
      </motion.div>

      {/* Cards */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <motion.article
            key={t.name}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className={`relative flex flex-col rounded-2xl border bg-white/[0.03] p-8 backdrop-blur-sm ${t.borderClass}`}
          >
            {/* Gradient tint */}
            <div
              className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${t.accentClass} opacity-40`}
            />

            {/* Quote icon */}
            <Quote className="relative mb-5 h-6 w-6 text-slate-500" aria-hidden="true" />

            {/* Quote text */}
            <blockquote className="relative flex-1 text-base leading-relaxed text-slate-200">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            {/* Attribution */}
            <div className="relative mt-8 border-t border-white/[0.06] pt-6">
              <div className="flex items-start gap-4">
                {/* Avatar placeholder */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-sm font-bold text-slate-300">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{t.role}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{t.org}</div>
                </div>
              </div>
              <span className="mt-4 inline-block rounded-full bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                {t.sector}
              </span>
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
          href="/customer-stories"
          className="text-sm font-semibold text-cyan-400 underline-offset-4 hover:underline"
        >
          Read full customer stories →
        </a>
      </motion.div>
    </section>
  );
}

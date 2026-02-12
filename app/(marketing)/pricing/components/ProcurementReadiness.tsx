'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ClipboardCheck, FileCheck2, ShieldCheck, Sparkles } from 'lucide-react';

const assurancePillars = [
  {
    icon: ClipboardCheck,
    title: 'Security review workflow',
    detail:
      'Use a structured packet for architecture, identity, encryption, and audit defensibility questions.',
  },
  {
    icon: FileCheck2,
    title: 'Procurement-ready artifacts',
    detail:
      'Accelerate legal and security review with trust-center links, walkthrough support, and buyer-facing evidence context.',
  },
  {
    icon: ShieldCheck,
    title: 'Operational assurance',
    detail:
      'Map controls into accountable workflows, then export posture snapshots without spreadsheet reconstruction.',
  },
] as const;

export function ProcurementReadiness() {
  return (
    <section className="relative overflow-hidden py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.12),transparent_42%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_80%,rgba(56,189,248,0.12),transparent_40%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            Procurement Assurance
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Designed for security and procurement scrutiny
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Move from vendor questionnaire to buyer confidence faster with a
            clear review path and defensible operational proof.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {assurancePillars.map((pillar, idx) => (
            <motion.article
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: idx * 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <div className="inline-flex rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-2">
                <pillar.icon className="h-5 w-5 text-emerald-200" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {pillar.detail}
              </p>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/security-review"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white"
          >
            Review Security Packet
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Talk with Sales Engineering
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { ArrowRight, ClipboardCheck, FileLock2, ShieldCheck } from 'lucide-react';
import { AmbientParticleLayer } from '@/components/motion/AmbientParticleLayer';

const trustedBy = [
  'Healthcare & NDIS teams',
  'Aged care operators',
  'Financial services teams',
  'Education & research',
  'Government programs',
  'Community services',
  'Enterprise compliance',
  'Multi-site operators',
];

export function TrustSection() {
  const trustSignals = [
    { value: '7 packs', label: 'Framework mappings available' },
    { value: 'Immutable', label: 'Audit event history' },
    { value: 'RBAC', label: 'Least-privilege access control' },
    { value: 'Buyer-ready', label: 'Security review workflow' },
  ] as const;

  return (
    <section className="mk-section relative border-y border-white/5 overflow-hidden">
      <AmbientParticleLayer intensity="subtle" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="fadeUp" range={[0, 0.3]} className="text-center mb-12">
          <p className="text-sm uppercase tracking-wider text-gray-500 mb-8">
            Built for regulated teams and enterprise buyers
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Trust architecture that holds up under review
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-2xl mx-auto">
            Move from first conversation to procurement confidence with
            structure, evidence traceability, and review-ready context.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {trustedBy.map((company, index) => (
            <ScrollReveal
              key={company}
              variant="scaleUp"
              range={[index * 0.04, 0.3 + index * 0.04]}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative flex items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-gray-900/30 to-gray-950/30 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-300 cursor-pointer shadow-lg shadow-black/10"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/5 transition-all duration-500" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/0 group-hover:via-cyan-400/40 to-transparent transition-all duration-500" />

                <span className="relative text-gray-400 group-hover:text-cyan-400 transition-colors duration-300 text-sm font-medium text-center">
                  {company}
                </span>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal variant="scaleUp" range={[0.05, 0.4]} className="mt-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {trustSignals.map((stat, index) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05, y: -3 }}
              className="text-center p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-default"
            >
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
        </ScrollReveal>

        <ScrollReveal variant="slideUp" range={[0.05, 0.35]} className="mt-12">
        <div className="grid gap-3 md:grid-cols-3">
          <Link
            href="/security-review"
            className="mk-btn mk-btn-primary group flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-cyan-100"
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
              <ShieldCheck className="h-4 w-4" />
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
              Outcome Stories
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

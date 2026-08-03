'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Map, ShieldCheck, FileBarChart } from 'lucide-react';

const steps = [
  {
    icon: <Map className="h-6 w-6" />,
    title: 'Map your obligations',
    description:
      'Pre-built frameworks load your obligations automatically. Every requirement mapped, named and owned.',
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: 'Govern with evidence',
    description:
      'Every obligation gets an owner, a deadline and an immutable evidence chain. No more spreadsheets, no more scrambling before audits.',
  },
  {
    icon: <FileBarChart className="h-6 w-6" />,
    title: 'Prove compliance',
    description:
      'Regulator visits, accreditation assessments, board reviews: export the evidence pack in minutes.',
  },
];

export function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-marketing-bg" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[var(--font-display)] leading-[1.1]">
            Three Steps to Audit-Ready
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-[72px] left-[16.67%] right-[16.67%] h-px bg-white/[0.08]" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-slate-300">
                {step.icon}
              </div>

              <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

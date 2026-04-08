'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Map, ShieldCheck, FileBarChart } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: <Map className="h-6 w-6" />,
    title: 'Map Your Obligations',
    description:
      'Pre-built frameworks load your obligations automatically. Every requirement — mapped, named, and owned.',
    color: 'cyan',
  },
  {
    number: '02',
    icon: <ShieldCheck className="h-6 w-6" />,
    title: 'Govern With Evidence',
    description:
      'Every obligation gets an owner, a deadline, and an immutable evidence chain. No more spreadsheets. No more scrambling before audits.',
    color: 'violet',
  },
  {
    number: '03',
    icon: <FileBarChart className="h-6 w-6" />,
    title: 'Prove Compliance Instantly',
    description:
      'One-click audit-ready reports. Regulator visits, accreditation assessments, board reviews — export your evidence pack in minutes.',
    color: 'emerald',
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  cyan: {
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    glow: 'from-cyan-500/20',
  },
  violet: {
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    glow: 'from-violet-500/20',
  },
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    glow: 'from-emerald-500/20',
  },
};

export function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-[#080b14] via-[#0d1117] to-[#0a0e1a]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-cyan-400 mb-6">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[var(--font-display)] leading-[1.1]">
            Three Steps to Audit-Ready
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-[72px] left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-cyan-500/30 via-violet-500/30 to-emerald-500/30" />

          {steps.map((step, i) => {
            const c = colorMap[step.color];
            return (
              <motion.div
                key={step.number}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative text-center"
              >
                {/* Step number circle */}
                <div className="relative mx-auto mb-6">
                  <div
                    className={`mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-2xl border ${c.border} ${c.bg}`}
                  >
                    <div className={c.text}>{step.icon}</div>
                  </div>
                  <div
                    className={`absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border ${c.border} bg-[#0d1117] text-xs font-bold ${c.text}`}
                  >
                    {step.number}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

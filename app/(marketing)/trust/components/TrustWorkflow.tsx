'use client';

import { motion } from 'framer-motion';
import { Reveal } from '@/components/motion';
import { easing, duration } from '@/config/motion';

const trustWorkflow = [
  {
    step: 'Evaluate',
    detail:
      'Security and procurement teams review architecture, data handling, and governance posture.',
  },
  {
    step: 'Validate',
    detail:
      'Buyer stakeholders verify control ownership, evidence traceability, and operational accountability.',
  },
  {
    step: 'Accelerate',
    detail:
      'Teams move into trial or procurement with fewer blockers and reusable trust artifacts.',
  },
] as const;

const stepVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: duration.normal,
      ease: easing.signature,
    },
  }),
};

export function TrustWorkflow() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <Reveal variant="fadeInUp">
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-transparent p-7 backdrop-blur-sm lg:p-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Trust Workflow
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            FormaOS trust artifacts are structured to support enterprise review
            gates from early evaluation through procurement.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {trustWorkflow.map((item, i) => (
              <motion.article
                key={item.step}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stepVariants}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
                  {item.step}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {item.detail}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

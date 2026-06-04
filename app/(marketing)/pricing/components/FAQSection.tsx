'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { duration } from '@/config/motion';
import { PRICING_FAQS } from './faq-data';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_45%_at_50%_0%,rgba(255,255,255,0.03),transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-12">
        {/* Section header — left vertical-bar accent */}
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="mb-12 flex items-start gap-5"
        >
          <span className="mt-1.5 hidden h-14 w-px flex-shrink-0 bg-gradient-to-b from-white/35 to-transparent sm:block" />
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Questions
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Answers for the people who sign off.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-400">
              For compliance leaders, procurement, and IT security evaluating
              platform fit, data handling, and enterprise readiness.
            </p>
          </div>
        </ScrollReveal>

        {/* FAQ Items */}
        <SectionChoreography
          pattern="cascade"
          stagger={0.05}
          className="space-y-4"
        >
          {PRICING_FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const buttonId = `pricing-faq-trigger-${idx}`;
            const panelId = `pricing-faq-panel-${idx}`;
            return (
              <div
                key={faq.question}
                className={`rounded-2xl border bg-white/[0.02] transition-colors duration-300 ${
                  isOpen
                    ? 'border-white/20'
                    : 'border-white/[0.08] hover:border-white/[0.16]'
                }`}
              >
                <h3 className="m-0">
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl p-6 text-left text-lg font-semibold text-white"
                  >
                    <span className="pr-4">{faq.question}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : duration.fast,
                      }}
                      className="flex-shrink-0"
                      aria-hidden="true"
                    >
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </motion.span>
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                >
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : duration.fast,
                        }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 leading-relaxed text-slate-300">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </SectionChoreography>
      </div>
    </section>
  );
}

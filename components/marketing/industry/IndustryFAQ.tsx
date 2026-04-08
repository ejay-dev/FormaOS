'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface IndustryFAQProps {
  industry: string;
  faqs: FaqItem[];
}

export function IndustryFAQ({ industry, faqs }: IndustryFAQProps) {
  const shouldReduceMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0d1117] to-[#080b14]" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-6">
            <HelpCircle className="h-3.5 w-3.5" />
            {industry} FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-[var(--font-display)] leading-[1.1]">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={faq.question}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`rounded-xl border transition-all ${
                  isOpen
                    ? 'border-cyan-500/20 bg-cyan-500/[0.03]'
                    : 'border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-[15px] font-medium text-white pr-4 leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/[0.04] pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

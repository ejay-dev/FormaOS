'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { duration } from '@/config/motion';
import { PRICING_FAQS } from './faq-data';
import { DotGrid } from '@/components/marketing/SectionBackgrounds';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        <DotGrid />
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.15, 1],
                  opacity: [0.1, 0.2, 0.1],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 14,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          className="absolute bottom-1/4 right-1/3 h-1/3 w-1/3 rounded-full bg-gradient-to-br from-teal-500/12 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <ScrollReveal
          variant="depthScale"
          range={[0, 0.35]}
          className="text-center mb-16"
        >
          <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6">
              <HelpCircle className="h-3 w-3 text-teal-300" />
              <span className="text-gray-300">FAQ</span>
            </div>
          </ScrollReveal>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Frequently Asked
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>

          <p className="text-lg text-gray-400">
            Answers for compliance leaders, procurement teams, and IT security
            evaluating platform fit, data handling, and enterprise readiness
          </p>
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
                className={`backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? 'border-teal-400/30'
                    : 'border-white/10 hover:border-white/20'
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
                      <ChevronDown className="w-5 h-5 text-gray-400" />
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
                        <p className="text-gray-300 px-6 pb-6 leading-relaxed">
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

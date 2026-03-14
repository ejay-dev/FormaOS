'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { duration } from '@/config/motion';
import { PRICING_FAQS } from './faq-data';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-1/4 right-1/3 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-purple-500/15 to-transparent blur-3xl"
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
              <HelpCircle className="h-3 w-3 text-purple-400" />
              <span className="text-gray-300">FAQ</span>
            </div>
          </ScrollReveal>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Frequently Asked
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
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
          {PRICING_FAQS.map((faq, idx) => (
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className={`w-full text-left backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border transition-all duration-300 ${
                openIndex === idx
                  ? 'border-purple-500/30'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white pr-4">
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: openIndex === idx ? 180 : 0 }}
                  transition={{ duration: duration.fast }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              </div>

              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: duration.fast }}
                    className="overflow-hidden"
                  >
                    <p className="text-gray-400 mt-4 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          ))}
        </SectionChoreography>
      </div>
    </section>
  );
}

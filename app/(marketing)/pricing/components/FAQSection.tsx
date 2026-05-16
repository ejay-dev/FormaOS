'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { duration } from '@/config/motion';
import { PRICING_FAQS } from './faq-data';
import {
  AccentText,
  SectionEyebrow,
  SystemSection,
  systemPanelCompactClass,
} from '@/components/marketing/SystemMarketingPrimitives';

/**
 * FAQSection — accordion list of pricing FAQs. Keeps the existing accordion
 * mechanics; strips the DotGrid + pulsing teal blur background, gradient
 * pill eyebrow, and glassmorphism-on-gradient item shells. Items now use
 * the standard systemPanelCompactClass.
 */
export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <SystemSection variant="cyan" containerClassName="max-w-4xl">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <SectionEyebrow icon={HelpCircle} tone="neutral">
          Frequently asked
        </SectionEyebrow>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Answers for{' '}
          <AccentText>compliance, procurement, and IT.</AccentText>
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Quick answers on platform fit, data handling, and enterprise
          readiness — written for the people who actually evaluate FormaOS.
        </p>
      </div>

      <div className="space-y-3">
        {PRICING_FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const buttonId = `pricing-faq-trigger-${idx}`;
          const panelId = `pricing-faq-panel-${idx}`;
          return (
            <div
              key={faq.question}
              className={`${systemPanelCompactClass} ${isOpen ? 'border-teal-300/25' : ''}`}
            >
              <h3 className="m-0">
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-4 rounded-xl p-5 text-left text-base font-semibold text-white sm:text-lg"
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
                    <ChevronDown className="h-5 w-5 text-slate-400" />
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
                      <p className="px-5 pb-5 text-sm leading-relaxed text-slate-300 sm:text-base">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </SystemSection>
  );
}

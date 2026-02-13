'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { duration } from '@/config/motion';

const faqs = [
  {
    question: 'Can we run a security review before purchase?',
    answer:
      'Yes. Start with the FormaOS security review packet and request a guided walkthrough for your security or procurement team.',
  },
  {
    question: 'Do you support enterprise identity requirements?',
    answer:
      'Google OAuth is available for all plans. Enterprise plans can enable SAML SSO (Okta/Azure AD and similar IdPs). If you need SCIM provisioning, raise it during security review so we can confirm scope and workarounds.',
  },
  {
    question: 'How does procurement and billing work?',
    answer:
      'Self-serve plans use card billing. Enterprise engagements can include invoice-based procurement and implementation planning.',
  },
  {
    question: 'Can we pilot first and expand later?',
    answer:
      'Yes. Most teams start with one operating unit, prove workflow fit, and then expand to additional entities or sites.',
  },
  {
    question: 'What happens after the trial ends?',
    answer:
      'You can choose a plan, continue with procurement, or pause and restart when ready. No long-term lock-in is required to evaluate fit.',
  },
  {
    question: 'Do you provide onboarding support?',
    answer:
      'Yes. All plans include guided resources, and higher tiers include deeper implementation and operational enablement support.',
  },
];

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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <HelpCircle className="h-3 w-3 text-purple-400" />
            <span className="text-gray-300">FAQ</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Frequently Asked
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>

          <p className="text-lg text-gray-400">
            Answers for buyers evaluating platform fit, risk, and rollout
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: duration.normal }}
            >
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
                    transition={{ duration: 0.3 }}
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
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-gray-400 mt-4 leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

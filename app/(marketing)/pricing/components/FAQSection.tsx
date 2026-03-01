'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { duration } from '@/config/motion';

const faqs = [
  {
    question: 'Can we run a security review before purchase?',
    answer:
      'Yes. Request the FormaOS security review packet — it includes our security posture summary, penetration test overview, vulnerability disclosure policy, and vendor assurance documentation. Guided walkthroughs for procurement and security teams are available on Enterprise engagements.',
  },
  {
    question: 'Do you support enterprise identity and access requirements?',
    answer:
      'Google OAuth and MFA enforcement are available on all plans. Enterprise plans include SAML 2.0 SSO with support for Okta, Azure AD, and Google Workspace. Session policy management, IP restrictions, and SCIM provisioning can be discussed during security review.',
  },
  {
    question: 'Where is data stored, and can we select our region?',
    answer:
      'FormaOS stores data on infrastructure based in Australia by default. Enterprise plans can enable data residency controls for AU, US, or EU regions. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). A full Data Processing Agreement (DPA) is available on request.',
  },
  {
    question: 'What are your uptime and SLA commitments?',
    answer:
      'FormaOS targets 99.9% monthly uptime for production services. Enterprise plans include a formal SLA with defined incident response, escalation paths, and remediation credits. Our status page provides real-time availability and incident history.',
  },
  {
    question: 'How does procurement and billing work?',
    answer:
      'Starter and Professional plans are self-serve with monthly card billing. Enterprise engagements support invoice-based procurement, multi-year agreements, and purchase-order workflows. All plans include the security and vendor assurance documentation required for enterprise procurement.',
  },
  {
    question: 'Can we pilot one team first and expand later?',
    answer:
      'Yes. Most enterprise teams start with a single operating unit, validate workflow fit during the trial, then expand to additional entities or sites. Your data, configurations, and audit history carry forward when you scale.',
  },
  {
    question: 'What happens to our data if we leave?',
    answer:
      'Your compliance data belongs to you. On exit, we provide a full data export (evidence, audit trails, control mappings) in portable formats (CSV, ZIP, PDF). Data is purged from our systems within 30 days of account termination, per our retention policy.',
  },
  {
    question: 'Do you provide onboarding and implementation support?',
    answer:
      'All plans include access to onboarding documentation and setup guides. Professional plans include priority support. Enterprise engagements include a dedicated implementation engineer, framework configuration, control mapping review, and staff enablement sessions.',
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
        <ScrollReveal variant="depthScale" range={[0, 0.35]} className="text-center mb-16">
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
            Answers for compliance leaders, procurement teams, and IT security evaluating platform fit, data handling, and enterprise readiness
          </p>
        </ScrollReveal>

        {/* FAQ Items */}
        <SectionChoreography pattern="cascade" stagger={0.05} className="space-y-4">
          {faqs.map((faq, idx) => (
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

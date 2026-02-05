'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Shield,
  Database,
  Plug,
  CreditCard,
  Headphones,
  ChevronDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import { VisualDivider } from '@/components/motion';
import CinematicField from '../components/motion/CinematicField';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

// ============================================================================
// FAQ DATA - Enterprise-Grade Content
// ============================================================================

const faqCategories = [
  {
    id: 'product',
    title: 'Product & Platform',
    icon: Sparkles,
    color: 'cyan',
    questions: [
      {
        q: 'What is FormaOS?',
        a: 'FormaOS is an enterprise compliance operating system designed for regulated industries. It connects governance frameworks, operational controls, evidence collection, and audit defense into a single, unified platform. Unlike document repositories or checklists, FormaOS enforces accountability through structured workflows, immutable audit trails, and real-time compliance verification.',
      },
      {
        q: 'How is FormaOS different from task or compliance software?',
        a: 'Traditional compliance tools store documents and rely on manual tracking. FormaOS is an operating system that actively runs your compliance program. It enforces control ownership, generates evidence automatically as work is completed, maintains immutable audit trails, and provides real-time compliance state visibility. This means you move from reactive compliance to proactive operational assurance.',
      },
      {
        q: 'What industries is FormaOS built for?',
        a: 'FormaOS is purpose-built for regulated industries including NDIS and disability services, healthcare, aged care, financial services, education, and government. Any organization that must demonstrate compliance to regulators, auditors, or accreditation bodies can benefit from our platform.',
      },
      {
        q: 'Can FormaOS handle multiple regulatory frameworks?',
        a: 'Yes. FormaOS is framework-agnostic and supports multiple compliance frameworks simultaneously. Whether you need to comply with NDIS Practice Standards, ISO 27001, SOC 2, healthcare regulations, or industry-specific requirements, our platform adapts to your regulatory landscape.',
      },
      {
        q: 'How does workflow modeling work?',
        a: 'FormaOS allows you to model your operational workflows as structured processes with defined steps, control points, and evidence requirements. Each workflow can be assigned ownership, linked to policies, and configured to automatically capture evidence as tasks are completed. This creates a defensible chain of accountability.',
      },
    ],
  },
  {
    id: 'security',
    title: 'Security & Compliance',
    icon: Shield,
    color: 'purple',
    questions: [
      {
        q: 'Is FormaOS SOC 2 compliant?',
        a: 'FormaOS is built with SOC 2 controls in mind and follows security best practices aligned with SOC 2 Type II requirements. We implement comprehensive security controls including encryption, access management, audit logging, and incident response procedures. Enterprise customers can request our security documentation and compliance attestations.',
      },
      {
        q: 'How is data encrypted?',
        a: 'All data is encrypted both in transit and at rest. We use TLS 1.3 for data transmission and AES-256 encryption for data storage. Encryption keys are managed using industry-standard key management practices with regular rotation. Sensitive fields can be additionally encrypted at the application level.',
      },
      {
        q: 'Does FormaOS support SSO and MFA?',
        a: 'Yes. FormaOS supports Single Sign-On via Google Workspace OAuth. Enterprise SAML 2.0 integration with identity providers like Okta and Azure AD is available on Enterprise plans. Multi-Factor Authentication (MFA/2FA) with TOTP authenticator apps is available for all accounts and can be enforced at the organization level.',
      },
      {
        q: 'Where is data stored?',
        a: 'FormaOS infrastructure is hosted on enterprise-grade cloud platforms with data centers in Australia. For enterprise customers with specific data residency requirements, we offer region-specific deployment options. All infrastructure is configured with high availability, automated backups, and disaster recovery capabilities.',
      },
      {
        q: 'How do you handle data privacy?',
        a: 'We are committed to data privacy and comply with Australian Privacy Principles (APPs) and GDPR where applicable. We collect only necessary data, provide clear data handling policies, and give you control over your organizational data. Customer data is never used for advertising or sold to third parties.',
      },
    ],
  },
  {
    id: 'evidence',
    title: 'Data & Evidence',
    icon: Database,
    color: 'blue',
    questions: [
      {
        q: 'How does FormaOS generate audit trails?',
        a: 'Every action in FormaOS is automatically logged with full context, who did what, when, and in relation to which control or workflow. Audit trails are immutable and timestamped, providing a complete chain of evidence that satisfies regulatory requirements. You can filter, search, and export audit logs at any time.',
      },
      {
        q: 'Is evidence immutable?',
        a: 'Yes. Once evidence is captured in FormaOS, it cannot be altered or deleted. All evidence records are cryptographically sealed with timestamps and user attribution. This immutability is essential for regulatory audits and ensures that your compliance records can withstand scrutiny.',
      },
      {
        q: 'Can we export regulatory reports?',
        a: 'Absolutely. FormaOS provides comprehensive reporting capabilities including compliance status reports, evidence summaries, audit trail exports, and control verification reports. Reports can be exported in multiple formats (PDF, CSV, Excel) and customized to meet specific regulatory requirements.',
      },
      {
        q: 'How long is data retained?',
        a: 'Data retention policies are configurable based on your regulatory requirements. By default, we retain all compliance data, evidence, and audit trails for the duration of your subscription plus a configurable retention period. Enterprise customers can specify custom retention policies aligned with their compliance obligations.',
      },
      {
        q: 'Can we import existing compliance data?',
        a: 'Yes. FormaOS supports data import from existing systems including spreadsheets, legacy compliance tools, and document management systems. Our onboarding team provides migration assistance to ensure your historical compliance data is properly structured and accessible in the platform.',
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations & APIs',
    icon: Plug,
    color: 'green',
    questions: [
      {
        q: 'Does FormaOS integrate with existing systems?',
        a: 'Yes. FormaOS integrates with Slack and Microsoft Teams for real-time notifications, Google Workspace for authentication, and provides webhooks for 17 event types to connect with your existing tools. Our REST API enables custom integrations with any system. Integration capabilities depend on your plan tier.',
      },
      {
        q: 'Are APIs available?',
        a: 'FormaOS provides a comprehensive REST API for enterprise customers. The API allows you to programmatically query audit logs, compliance status, evidence, and tasks. Full API documentation is available for development teams.',
      },
      {
        q: 'Do you support webhooks?',
        a: 'Yes. FormaOS supports webhooks for real-time event notifications. You can configure webhooks to trigger on compliance events such as task completion, evidence submission, control verification, or audit trail entries. This enables seamless integration with external systems and automation workflows.',
      },
      {
        q: 'Can FormaOS connect to our existing systems?',
        a: 'FormaOS provides native integrations with Slack and Microsoft Teams for real-time compliance notifications. For HR, CRM, and other systems, our comprehensive webhook and REST API capabilities enable custom integration development. Enterprise customers receive dedicated integration support.',
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing & Trials',
    icon: CreditCard,
    color: 'amber',
    questions: [
      {
        q: 'Is there a free trial?',
        a: 'Yes. FormaOS offers a 14-day free trial with full platform access. No credit card is required to start. During the trial, you can explore all features, model workflows, and evaluate how FormaOS fits your compliance needs. Our team is available to provide guidance throughout your trial.',
      },
      {
        q: 'Can we upgrade or downgrade plans?',
        a: 'Absolutely. You can upgrade your plan at any time and the change takes effect immediately. Downgrades take effect at the end of your current billing period. Our flexible pricing ensures you only pay for the capabilities you need as your organization grows.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'We accept all major credit cards and bank transfers for annual subscriptions. Enterprise customers can arrange invoiced billing with net-30 or net-60 payment terms. All payments are processed securely through our payment provider.',
      },
      {
        q: 'Are there discounts for annual billing?',
        a: 'Yes. Annual subscriptions receive a discount compared to monthly billing. Enterprise customers may also qualify for volume discounts and custom pricing based on deployment size and requirements. Contact our sales team for detailed pricing.',
      },
      {
        q: 'Is there a money-back guarantee?',
        a: 'If you are not satisfied within the first 30 days of your paid subscription, we offer a full refund. We are confident that FormaOS will deliver value, but we want you to feel secure in your investment.',
      },
    ],
  },
  {
    id: 'support',
    title: 'Support & Onboarding',
    icon: Headphones,
    color: 'rose',
    questions: [
      {
        q: 'What onboarding is provided?',
        a: 'All paid plans include structured onboarding with a dedicated success manager. Onboarding covers platform configuration, user setup, workflow modeling, and best practices for your industry. Enterprise plans include extended onboarding with custom training sessions and implementation support.',
      },
      {
        q: 'Is enterprise support available?',
        a: 'Yes. Enterprise plans include priority support with dedicated success managers, custom SLAs, direct access to our product team, and 24/7 availability for critical issues. We partner with our enterprise customers to ensure their compliance programs run smoothly.',
      },
      {
        q: 'How do I get help if I have an issue?',
        a: 'Support is available through multiple channels: in-app help center, email support, and live chat during business hours. Professional and Enterprise plans include phone support and faster response times. Our knowledge base provides self-service documentation for common questions.',
      },
      {
        q: 'Do you provide training for our team?',
        a: 'Yes. FormaOS provides comprehensive training resources including documentation, video tutorials, and live webinars. Enterprise customers receive custom training sessions tailored to their workflows and can request on-site training for large deployments.',
      },
      {
        q: 'What is your support response time?',
        a: 'Response times vary by plan tier. Starter plans receive responses within 24 hours. Professional plans include priority support with responses within 4 business hours. Enterprise plans include dedicated support with response times as fast as 1 hour for critical issues.',
      },
    ],
  },
];

// ============================================================================
// HERO SECTION
// ============================================================================

function FAQHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24"
    >
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-purple-500/15 via-pink-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-cyan-500/5 to-transparent rounded-full" />
      </div>

      {/* Cinematic Particle Field */}
      <div className="absolute inset-0 z-1">
        <CinematicField />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <motion.div style={{ opacity, scale, y }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8 backdrop-blur-sm"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium tracking-wide">
                Help Center
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              Frequently Asked{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Questions
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto text-center leading-relaxed"
            >
              Everything you need to know about FormaOS, from platform
              capabilities and security to integrations, pricing, and support.
            </motion.p>

            {/* Category Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600"
            >
              {faqCategories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700/50 hover:border-cyan-500/30 hover:bg-gray-800/80 transition-all duration-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {cat.title}
                </a>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-gray-600/50 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================================================
// FAQ ACCORDION ITEM
// ============================================================================

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b border-white/5 last:border-b-0"
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base sm:text-lg font-medium text-white group-hover:text-cyan-400 transition-colors pr-8">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-gray-400 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// FAQ CATEGORY SECTION
// ============================================================================

function FAQCategory({
  category,
  index,
}: {
  category: (typeof faqCategories)[0];
  index: number;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const Icon = category.icon;

  const colorMap: Record<string, { bg: string; text: string; border: string }> =
    {
      cyan: {
        bg: 'bg-cyan-500/20',
        text: 'text-cyan-400',
        border: 'border-cyan-500/30',
      },
      purple: {
        bg: 'bg-purple-500/20',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
      },
      blue: {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
      },
      green: {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
      },
      amber: {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
      },
      rose: {
        bg: 'bg-rose-500/20',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
      },
    };

  const colors = colorMap[category.color] || colorMap.cyan;

  return (
    <motion.div
      id={category.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="scroll-mt-24"
    >
      <div className="relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-500 shadow-2xl shadow-black/30">
        {/* Top accent line */}
        <div
          className={`absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent`}
        />

        {/* Category Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
          <div
            className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}
          >
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
          <h2 className="text-2xl font-bold text-white">{category.title}</h2>
        </div>

        {/* Questions */}
        <div>
          {category.questions.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.q}
              answer={faq.a}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              index={i}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// FAQ CONTENT
// ============================================================================

function FAQContent() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 lg:px-12 space-y-8">
        {faqCategories.map((category, index) => (
          <FAQCategory key={category.id} category={category} index={index} />
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// CTA SECTION
// ============================================================================

function FAQCTA() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-[#0d1421] to-[#0a0f1c]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative p-10 rounded-3xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/30"
        >
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Our team is ready to help. Contact us for personalized answers or
              schedule a demo to see FormaOS in action.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="/contact"
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
              >
                <span>Contact Us</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <Link
                href={`${appBase}/auth/signup`}
                className="group px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-lg flex items-center gap-3 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function FAQPageContent() {
  return (
    <div className="relative min-h-screen bg-[#0a0f1c]">
      {/* Fixed particle background */}
      <div className="fixed inset-0 z-0">
        <div className="opacity-30">
          <CinematicField />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 via-transparent to-purple-500/3" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <FAQHero />
        <VisualDivider gradient />
        <FAQContent />
        <VisualDivider gradient />
        <FAQCTA />
      </div>
    </div>
  );
}

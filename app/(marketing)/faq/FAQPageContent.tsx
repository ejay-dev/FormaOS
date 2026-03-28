'use client';

import { useState } from 'react';
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
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { duration } from '@/config/motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { FAQHeroVisual } from './components/FAQHeroVisual';
import { brand } from '@/config/brand';
import { DotGrid } from '@/components/marketing/SectionBackgrounds';

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
        a: 'FormaOS is an enterprise compliance operating system designed for regulated industries. It connects governance frameworks, operational controls, evidence collection, and audit defense into a single, unified platform. Unlike document repositories or checklists, FormaOS enforces accountability through structured workflows, immutable audit trails, and compliance visibility.',
      },
      {
        q: 'How is FormaOS different from task or compliance software?',
        a: 'Traditional compliance tools store documents and rely on manual tracking. FormaOS is an operating system that runs your compliance program. It enforces control ownership, captures evidence as work is completed, maintains immutable audit trails, and provides continuous compliance visibility. This means you move from reactive compliance to proactive operational assurance.',
      },
      {
        q: 'What industries is FormaOS built for?',
        a: 'FormaOS is purpose-built for regulated industries including NDIS and disability services, healthcare, aged care, financial services, education, and government. Any organization that must demonstrate compliance to regulators, auditors, or accreditation bodies can benefit from our platform.',
      },
      {
        q: 'Can FormaOS handle multiple regulatory frameworks?',
        a: `Yes. FormaOS ships with ${brand.frameworks.count} pre-built framework packs (${brand.frameworks.packs.join(', ')}) and supports multiple frameworks simultaneously. The platform is designed to accommodate additional regulatory requirements beyond the included packs, so it adapts to your specific regulatory landscape.`,
      },
      {
        q: 'How does workflow modeling work?',
        a: 'FormaOS allows you to model operational workflows as structured processes with defined steps, control points, and evidence requirements. Workflow automation can be configured by request, creating a defensible chain of accountability.',
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
        q: 'Is FormaOS SOC 2 aligned?',
        a: 'FormaOS is built with SOC 2-aligned controls across the Common Criteria, Availability, and Confidentiality trust service categories. We implement AES-256 encryption, identity governance, tamper-evident audit logs, and structured incident response procedures aligned with the framework. Our security review packet - covering architecture, controls, and data handling - is available for enterprise procurement and security teams on request.',
      },
      {
        q: 'How is data encrypted?',
        a: 'Primary platform data is encrypted at rest using AES-256 and in transit using TLS 1.3. Encryption key management follows enterprise cloud-provider best practices, and encryption controls are documented in our security review packet.',
      },
      {
        q: 'Does FormaOS support SSO and MFA?',
        a: 'FormaOS supports Google OAuth on all plans. Enterprise plans include SAML 2.0 SSO for Okta, Azure AD, and Google Workspace. MFA policy enforcement is supported across supported identity flows, and session duration controls plus access governance policies are configurable at the organizational level. Additional identity-lifecycle requirements are reviewed during enterprise deployment.',
      },
      {
        q: 'Where is data stored and what residency options exist?',
        a: 'FormaOS is AU-hosted by default, designed for Australian-regulated organizations. Additional residency and cross-border handling requirements are reviewed during procurement. A Data Processing Agreement (DPA) is available for enterprise review, covering privacy and transfer considerations relevant to your deployment.',
      },
      {
        q: 'How do you handle data privacy and the Australian Privacy Principles?',
        a: 'FormaOS is built with privacy-by-design principles aligned with the Australian Privacy Principles (APPs) under the Privacy Act 1988. We collect only the data necessary to operate the platform, provide full organizational data control, and never sell customer data to third parties. APP-aligned data handling documentation, breach response workflows, and our DPA are available for privacy and legal review.',
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
        a: 'Yes. Evidence records in FormaOS are append-only and tamper-evident. Once uploaded, evidence cannot be modified or deleted - only superseded by a new version, with the original preserved in the audit trail. Every upload, update, approval, and version change is recorded with an immutable timestamp, the identity of the actor, and a correlation ID linking it to the originating control or workflow. This chain-of-custody model ensures that auditors and regulators see a complete, unaltered history of every compliance artifact from creation through current state.',
      },
      {
        q: 'Can we export regulatory reports?',
        a: 'Yes. FormaOS provides compliance status reports, evidence summaries, audit trail exports, and control verification reports. Exports are available in CSV/ZIP formats, with PDF/Excel options available by request.',
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
        a: 'FormaOS provides Google OAuth for authentication, REST API access, and live integrations with Slack and Microsoft Teams. Jira, Linear, and Google Drive integrations are coming soon. Enterprise plans include SAML 2.0 SSO for Okta, Azure AD, and Google Workspace. Additional integrations including GitHub, Make, and SharePoint are in beta or coming soon.',
      },
      {
        q: 'Are APIs available?',
        a: 'FormaOS provides a REST API for authorized customers to query audit logs, compliance status, evidence, and tasks. API documentation is available on request.',
      },
      {
        q: 'Do you support webhooks?',
        a: 'Yes - FormaOS includes webhook endpoints for real-time event notifications out of the box via our REST API v1.',
      },
      {
        q: 'Can FormaOS connect to our existing systems?',
        a: 'FormaOS provides REST API and webhook capabilities to connect with external systems. We do not ship native HRIS/CRM connectors (e.g., Workday/Salesforce) as first-party integrations today, but teams can integrate via API/webhooks and middleware (Zapier/Make/custom). Slack and Microsoft Teams integrations are available by request, and enterprise customers can request dedicated integration support.',
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
        a: 'If you have concerns during onboarding or early adoption, contact our team and we will work with you on a fair resolution based on your plan and terms.',
      },
    ],
  },
  {
    id: 'enterprise',
    title: 'Enterprise & Procurement',
    icon: Building2,
    color: 'blue',
    questions: [
      {
        q: 'What procurement documentation is available for enterprise sign-off?',
        a: 'FormaOS provides a core enterprise review pack that includes a Data Processing Agreement (DPA), vendor assurance materials, SLA review documentation, and a security review packet covering architecture, encryption, identity governance, and data handling. These materials are shared during evaluation and procurement review, with additional artifacts handled case by case.',
      },
      {
        q: 'What are the SLA commitments for Enterprise customers?',
        a: 'Enterprise agreements can include documented availability expectations, incident handling processes, maintenance communications, and escalation paths. Exact support and service terms depend on the plan and executed commercial agreement.',
      },
      {
        q: 'What are our options if we need to exit the platform?',
        a: 'Compliance data, evidence, audit trails, and control records can be exported in portable formats such as CSV, JSON, and ZIP. Export support and deletion timing are handled under your plan and commercial agreement so teams can complete an orderly transition.',
      },
      {
        q: 'Can FormaOS support multi-entity or multi-site deployments?',
        a: 'Yes. Enterprise plans support multi-entity and multi-site deployments with separate organizational boundaries, role-based access governance per entity, and consolidated compliance posture reporting across the group. Identity requirements are reviewed during deployment planning so governance can scale with your structure.',
      },
      {
        q: 'Does FormaOS conduct penetration testing?',
        a: 'FormaOS uses independent security review processes and documents its vulnerability disclosure and remediation approach. Current assessment artifacts may be shared with enterprise buyers during security review when available and appropriate.',
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
        a: 'All paid plans include structured onboarding covering platform configuration, first framework setup, workflow design, evidence structure, and control ownership. Enterprise onboarding can include additional implementation support for more complex deployments. Timing depends on scope, data readiness, and the number of teams involved.',
      },
      {
        q: 'Is enterprise support available?',
        a: 'Yes. Enterprise plans can include shared support channels, priority email handling, named contacts, and review cadences aligned to the deployment. Support coverage and response expectations are documented in the applicable agreement.',
      },
      {
        q: 'How do I get help if I have an issue?',
        a: 'All customers have access to the in-app help center, the FormaOS knowledge base, and email support at Formaos.team@gmail.com. Professional and Enterprise plans include higher-touch support options, and critical platform issues are prioritized under the applicable support process.',
      },
      {
        q: 'Do you provide training for our team?',
        a: 'Yes. All paid plans include a live onboarding call with your team, recorded walkthrough videos for key workflows (control setup, evidence management, audit export), and access to the self-service knowledge base. Enterprise customers can request custom training sessions tailored to specific roles (compliance managers, control owners, executive dashboard users) and specific frameworks. We also provide quarterly check-in sessions for Enterprise customers to review new features and optimize workflows.',
      },
      {
        q: 'What is your support response time?',
        a: 'Support response expectations vary by plan and, for Enterprise, by executed agreement. If your team requires documented response commitments, we review those during procurement and include them in the relevant service terms.',
      },
      {
        q: 'What happens during an audit if we need urgent help?',
        a: 'Enterprise customers can scope audit-period support for evidence export, posture snapshots, and reviewer access configuration during active audits or regulator visits. Additional assistance for other plans can be discussed based on the engagement and timing.',
      },
    ],
  },
];

// ============================================================================
// HERO SECTION
// ============================================================================

function FAQHero() {
  return (
    <ImmersiveHero
      theme="faq"
      visualContent={<FAQHeroVisual />}
      badge={{ icon: <HelpCircle className="w-4 h-4" />, text: 'Help Center' }}
      headline={
        <>
          Frequently Asked{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Questions
          </span>
        </>
      }
      subheadline="Straight answers on platform capabilities, enterprise security, procurement documentation, data residency, integrations, and support."
      extras={
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
          {faqCategories.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] hover:border-cyan-500/30 hover:bg-white/[0.08] transition-all duration-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              {cat.title}
            </a>
          ))}
        </div>
      }
      primaryCta={{ href: '/contact', label: 'Contact Us' }}
      secondaryCta={{
        href: `${appBase}/auth/signup`,
        label: 'Start Free Trial',
      }}
    />
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
    <ScrollReveal variant="blurIn" range={[index * 0.04, 0.3 + index * 0.04]}>
      <div className="border-b border-white/5 last:border-b-0">
        <button
          onClick={onClick}
          className="w-full flex items-center justify-between py-5 text-left group"
        >
          <span className="text-base sm:text-lg font-medium text-white group-hover:text-cyan-400 transition-colors pr-8">
            {question}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: duration.fast }}
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
              transition={{ duration: duration.fast }}
              className="overflow-hidden"
            >
              <p className="pb-5 text-gray-400 leading-relaxed">{answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScrollReveal>
  );
}

// ============================================================================
// FAQ CATEGORY SECTION
// ============================================================================

function FAQCategory({ category }: { category: (typeof faqCategories)[0] }) {
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
    <div id={category.id} className="scroll-mt-24">
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
    </div>
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
        <DotGrid />
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

      <SectionChoreography
        pattern="cascade"
        className="relative max-w-4xl mx-auto px-6 lg:px-12 space-y-8"
      >
        {faqCategories.map((category) => (
          <FAQCategory key={category.id} category={category} />
        ))}
      </SectionChoreography>
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
        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <div className="relative p-10 rounded-3xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/30">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Still have questions?
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Our team is ready to help. Contact us for personalized answers
                or schedule a demo to see FormaOS in action.
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
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function FAQPageContent() {
  return (
    <MarketingPageShell className="bg-[#0a0f1c]">
      <FAQHero />
      <VisualDivider gradient />
      <DeferredSection minHeight={800}>
        <FAQContent />
      </DeferredSection>
      <VisualDivider gradient />
      <DeferredSection minHeight={250}>
        <FAQCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}

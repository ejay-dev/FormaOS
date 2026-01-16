'use client';

import { useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  Shield,
  User,
  Ban,
  Database,
  Lock,
  Server,
  CreditCard,
  Copyright,
  XCircle,
  Scale,
  AlertTriangle,
  Gavel,
  Mail,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { VisualDivider } from '@/components/motion';
import CinematicField from '../../components/motion/CinematicField';

// ============================================================================
// HERO SECTION
// ============================================================================

function TermsHero() {
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
      className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24"
    >
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-purple-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl"
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
      </div>

      {/* Cinematic Particle Field */}
      <div className="absolute inset-0 z-1 opacity-40">
        <CinematicField />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <motion.div style={{ opacity, scale, y }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-8 backdrop-blur-sm"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-indigo-400 font-medium tracking-wide">
                Legal
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] text-white"
            >
              Terms &{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Conditions
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-6 max-w-2xl mx-auto text-center leading-relaxed"
            >
              The framework for responsible platform usage, data integrity, and
              shared accountability between FormaOS and your organization.
            </motion.p>

            {/* Effective Date */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500"
            >
              <span>Effective Date: January 16, 2026</span>
              <span className="hidden sm:inline">•</span>
              <span>Last Updated: January 16, 2026</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// TABLE OF CONTENTS
// ============================================================================

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms', icon: FileText },
  { id: 'description', title: '2. Description of Services', icon: Server },
  {
    id: 'eligibility',
    title: '3. Eligibility & Account Responsibility',
    icon: User,
  },
  { id: 'acceptable-use', title: '4. Acceptable Use', icon: Ban },
  {
    id: 'data-ownership',
    title: '5. Data Ownership & Customer Content',
    icon: Database,
  },
  { id: 'confidentiality', title: '6. Confidentiality', icon: Lock },
  { id: 'security', title: '7. Security & Compliance', icon: Shield },
  { id: 'availability', title: '8. Service Availability', icon: Server },
  { id: 'fees', title: '9. Fees & Subscriptions', icon: CreditCard },
  { id: 'ip', title: '10. Intellectual Property', icon: Copyright },
  { id: 'termination', title: '11. Termination', icon: XCircle },
  { id: 'liability', title: '12. Limitation of Liability', icon: Scale },
  { id: 'indemnification', title: '13. Indemnification', icon: AlertTriangle },
  { id: 'governing-law', title: '14. Governing Law', icon: Gavel },
  { id: 'contact', title: '15. Contact', icon: Mail },
];

function TableOfContents() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="relative py-16 bg-[#0a0f1c]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl"
        >
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-semibold text-white">
              Table of Contents
            </h2>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2"
            >
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <section.icon className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm">{section.title}</span>
                </a>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// TERMS SECTIONS
// ============================================================================

type TermsSectionProps = {
  id: string;
  number: string;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  delay?: number;
};

function TermsSection({
  id,
  number,
  title,
  icon: Icon,
  children,
  delay = 0,
}: TermsSectionProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="scroll-mt-24"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <span className="text-sm text-indigo-400 font-medium">{number}</span>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
      </div>
      <div className="ml-14 text-gray-400 leading-relaxed space-y-4">
        {children}
      </div>
    </motion.div>
  );
}

function TermsContent() {
  return (
    <section className="relative py-16 bg-[#0a0f1c]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 space-y-16">
        <TermsSection
          id="acceptance"
          number="1"
          title="Acceptance of Terms"
          icon={FileText}
        >
          <p>
            By accessing or using the FormaOS platform, website, or related
            services (&quot;Services&quot;), you agree to be bound by these
            Terms &amp; Conditions. If you do not agree, you may not access or
            use the Services.
          </p>
        </TermsSection>

        <TermsSection
          id="description"
          number="2"
          title="Description of Services"
          icon={Server}
          delay={0.05}
        >
          <p>
            FormaOS provides an enterprise compliance operating system designed
            to help organizations model governance, manage controls, track
            actions, and generate audit-ready evidence.
          </p>
          <p>
            All services are provided subject to these Terms and applicable
            laws.
          </p>
        </TermsSection>

        <TermsSection
          id="eligibility"
          number="3"
          title="Eligibility & Account Responsibility"
          icon={User}
          delay={0.1}
        >
          <p>You must:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Be authorized to act on behalf of your organization</li>
            <li>Provide accurate and current information</li>
            <li>Maintain the security of your credentials</li>
          </ul>
          <p>
            You are responsible for all activity occurring under your account.
          </p>
        </TermsSection>

        <TermsSection
          id="acceptable-use"
          number="4"
          title="Acceptable Use"
          icon={Ban}
          delay={0.15}
        >
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              Use the platform for unlawful, fraudulent, or unauthorized
              purposes
            </li>
            <li>Interfere with or disrupt system integrity or performance</li>
            <li>Reverse engineer, scrape, or exploit the platform</li>
            <li>Upload malicious code or harmful data</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate access for violations.
          </p>
        </TermsSection>

        <TermsSection
          id="data-ownership"
          number="5"
          title="Data Ownership & Customer Content"
          icon={Database}
          delay={0.2}
        >
          <p>
            You retain ownership of all data you upload (&quot;Customer
            Data&quot;).
          </p>
          <p>By using FormaOS, you grant us a limited license to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              Process, store, and display your data solely to provide the
              Services
            </li>
            <li>Maintain system backups and operational continuity</li>
          </ul>
          <p className="font-medium text-white">
            We do not sell or claim ownership over your data.
          </p>
        </TermsSection>

        <TermsSection
          id="confidentiality"
          number="6"
          title="Confidentiality"
          icon={Lock}
          delay={0.25}
        >
          <p>
            Each party agrees to protect confidential information disclosed in
            the course of using the Services, including business data, technical
            architecture, and proprietary workflows.
          </p>
        </TermsSection>

        <TermsSection
          id="security"
          number="7"
          title="Security & Compliance"
          icon={Shield}
          delay={0.3}
        >
          <p>FormaOS is built for regulated environments. We implement:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Encryption in transit and at rest</li>
            <li>Role-based access control</li>
            <li>Audit logging and integrity safeguards</li>
          </ul>
          <p>
            However, you acknowledge that no system can guarantee absolute
            security.
          </p>
        </TermsSection>

        <TermsSection
          id="availability"
          number="8"
          title="Service Availability"
          icon={Server}
          delay={0.35}
        >
          <p>
            We aim to maintain high system uptime but do not guarantee
            uninterrupted availability. Maintenance, updates, or unforeseen
            technical events may temporarily impact access.
          </p>
        </TermsSection>

        <TermsSection
          id="fees"
          number="9"
          title="Fees & Subscriptions"
          icon={CreditCard}
          delay={0.4}
        >
          <p>Where applicable:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Subscription fees are billed in advance</li>
            <li>Payments are non-refundable unless required by law</li>
            <li>Pricing and features may change with notice</li>
          </ul>
        </TermsSection>

        <TermsSection
          id="ip"
          number="10"
          title="Intellectual Property"
          icon={Copyright}
          delay={0.45}
        >
          <p>
            All FormaOS software, designs, branding, and proprietary processes
            are owned by FormaOS.
          </p>
          <p>
            You may not copy, modify, distribute, or create derivative works
            without written permission.
          </p>
        </TermsSection>

        <TermsSection
          id="termination"
          number="11"
          title="Termination"
          icon={XCircle}
          delay={0.5}
        >
          <p>We may suspend or terminate access if:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Terms are violated</li>
            <li>Required payments are not made</li>
            <li>Use creates legal or operational risk</li>
          </ul>
          <p>
            Upon termination, your access will cease and data may be deleted in
            accordance with our data retention policies.
          </p>
        </TermsSection>

        <TermsSection
          id="liability"
          number="12"
          title="Limitation of Liability"
          icon={Scale}
          delay={0.55}
        >
          <p>To the maximum extent permitted by law:</p>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-white">
              FormaOS is not liable for indirect, incidental, or consequential
              damages, including business interruption, data loss, or regulatory
              penalties arising from use of the Services.
            </p>
          </div>
        </TermsSection>

        <TermsSection
          id="indemnification"
          number="13"
          title="Indemnification"
          icon={AlertTriangle}
          delay={0.6}
        >
          <p>
            You agree to indemnify and hold harmless FormaOS from claims arising
            from:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Your use of the Services</li>
            <li>Violation of laws or third-party rights</li>
            <li>Uploaded data or operational decisions</li>
          </ul>
        </TermsSection>

        <TermsSection
          id="governing-law"
          number="14"
          title="Governing Law"
          icon={Gavel}
          delay={0.65}
        >
          <p>These Terms are governed by the laws of Australia.</p>
          <p>
            Disputes shall be subject to the exclusive jurisdiction of
            Australian courts.
          </p>
        </TermsSection>

        <TermsSection
          id="contact"
          number="15"
          title="Contact"
          icon={Mail}
          delay={0.7}
        >
          <p>For legal inquiries:</p>
          <div className="flex flex-col gap-2 mt-4">
            <a
              href="mailto:formaos.team@gmail.com"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Mail className="w-4 h-4" />
              formaos.team@gmail.com
            </a>
            <a
              href="tel:+61469715062"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              📞 +61 469 715 062
            </a>
          </div>
        </TermsSection>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function TermsPageContent() {
  return (
    <div className="relative">
      <TermsHero />
      <VisualDivider />
      <TableOfContents />
      <TermsContent />
      <VisualDivider />
    </div>
  );
}

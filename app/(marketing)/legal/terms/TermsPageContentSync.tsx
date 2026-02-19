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
  ArrowRight,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { duration } from '@/config/motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../../components/shared';
import { MarketingPageShell } from '../../components/shared/MarketingPageShell';

// ============================================================================
// HERO SECTION - Synced with Home Page Design
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
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24"
    >
      {/* Premium Background Effects - Cinematic Gradient Layers (Home Page Pattern) */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient orb - top left */}
        <motion.div
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Secondary gradient orb - bottom right */}
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
        {/* Tertiary accent - center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-indigo-500/5 to-transparent rounded-full" />
      </div>


      {/* Main Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <motion.div style={{ opacity, scale, y }}>
            {/* Badge - Home Page Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slow, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8 backdrop-blur-sm"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium tracking-wide">
                Legal
              </span>
            </motion.div>

            {/* Headline - Enterprise Typography Scale */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slower, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              Terms &{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Conditions
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slower, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto text-center leading-relaxed"
            >
              The framework for responsible platform usage, data integrity, and
              shared accountability between FormaOS and your organization.
            </motion.p>

            {/* Effective Date Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slower, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600"
            >
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Effective: January 16, 2026
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Last Updated: January 16, 2026
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

    </section>
  );
}

// ============================================================================
// TABLE OF CONTENTS - Glassmorphism Card
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
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="relative py-16 bg-[#0a0f1c]">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="blurIn">
        <div
          className="relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all shadow-2xl shadow-black/30"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between text-left group"
          >
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Table of Contents
            </h2>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          </button>

          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: duration.normal }}
              className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
            >
              {sections.map((section, index) => (
                <motion.a
                  key={section.id}
                  href={`#${section.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <section.icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-sm group-hover:translate-x-1 transition-transform duration-300">
                    {section.title}
                  </span>
                </motion.a>
              ))}
            </motion.div>
          )}
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ============================================================================
// TERMS SECTIONS - Home Page Container Style
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
}: TermsSectionProps) {
  return (
    <ScrollReveal variant="fadeUp" className="scroll-mt-24">
      <div id={id}>
      {/* Section Card - Glassmorphism */}
      <div className="relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-500 group">
        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative">
          {/* Section Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <span className="text-sm text-cyan-400 font-medium">
                Section {number}
              </span>
              <h3 className="text-xl font-semibold text-white">{title}</h3>
            </div>
          </div>

          {/* Section Content */}
          <div className="text-gray-400 leading-relaxed space-y-4 pl-16">
            {children}
          </div>
        </div>
      </div>
      </div>
    </ScrollReveal>
  );
}

function TermsContent() {
  return (
    <section className="relative py-16 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
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
          className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 lg:px-12 space-y-8">
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
          <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10">
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
          <div className="flex flex-col gap-3 mt-4">
            <motion.a
              href="mailto:hello@formaos.com.au"
              whileHover={{ scale: 1.02, x: 5 }}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors group"
            >
              <Mail className="w-4 h-4" />
              <span className="group-hover:underline decoration-cyan-400/50 underline-offset-4">
                hello@formaos.com.au
              </span>
            </motion.a>
            <motion.a
              href="tel:+61469715062"
              whileHover={{ scale: 1.02, x: 5 }}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors group"
            >
              📞{' '}
              <span className="group-hover:underline decoration-cyan-400/50 underline-offset-4">
                +61 469 715 062
              </span>
            </motion.a>
          </div>
        </TermsSection>
      </div>
    </section>
  );
}

// ============================================================================
// CTA SECTION - Home Page Style
// ============================================================================

function TermsCTA() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-[#0d1421] to-[#0a0f1c]">
      {/* Background effects */}
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
        <ScrollReveal variant="scaleUp">
        <div
          className="relative p-10 rounded-3xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-500 shadow-2xl shadow-black/30"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Questions about our terms?
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Need clarification on our Terms?
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Contact our team for any questions regarding platform usage,
                data handling, or compliance requirements.
              </p>
            </div>
            <motion.a
              href="/contact"
              whileHover={{
                scale: 1.05,
                boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
              }}
              whileTap={{ scale: 0.98 }}
              className="group px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all whitespace-nowrap"
            >
              <span>Contact Us</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.a>
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

export default function TermsPageContentSync() {
  return (
    <MarketingPageShell className="bg-[#0a0f1c]">
      <TermsHero />
      <VisualDivider gradient />
      <DeferredSection minHeight={260}>
        <TableOfContents />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={1600}>
        <TermsContent />
      </DeferredSection>
      <VisualDivider gradient />
      <DeferredSection minHeight={300}>
        <TermsCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}

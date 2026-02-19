'use client';

import { useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Shield,
  FileText,
  Database,
  Lock,
  Users,
  Globe,
  Cookie,
  RefreshCw,
  Mail,
  ChevronDown,
  ChevronUp,
  Eye,
  Server,
  Share2,
  Clock,
  UserCheck,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { duration } from '@/config/motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../../components/shared';
import { MarketingPageShell } from '../../components/shared/MarketingPageShell';

// ============================================================================
// HERO SECTION
// ============================================================================

function PrivacyHero() {
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
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-emerald-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-teal-500/15 via-green-500/10 to-transparent rounded-full blur-3xl"
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


      {/* Main Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <motion.div style={{ opacity, scale, y }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slow, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8 backdrop-blur-sm"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium tracking-wide">
                Privacy
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slower, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] text-white"
            >
              Privacy{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                Policy
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slower, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-6 max-w-2xl mx-auto text-center leading-relaxed"
            >
              FormaOS is designed for regulated industries where
              confidentiality, accountability, and data integrity are essential.
              We are committed to protecting your personal and organizational
              information.
            </motion.p>

            {/* Effective Date */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slower, delay: 0.6 }}
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
  { id: 'commitment', title: '1. Our Commitment to Privacy', icon: Shield },
  { id: 'collection', title: '2. Information We Collect', icon: Database },
  { id: 'usage', title: '3. How We Use Your Information', icon: Eye },
  { id: 'legal-basis', title: '4. Legal Basis for Processing', icon: FileText },
  { id: 'storage', title: '5. Data Storage & Security', icon: Lock },
  { id: 'sharing', title: '6. Data Sharing', icon: Share2 },
  { id: 'retention', title: '7. Data Retention', icon: Clock },
  { id: 'rights', title: '8. Your Rights', icon: UserCheck },
  { id: 'transfers', title: '9. International Data Transfers', icon: Globe },
  { id: 'cookies', title: '10. Cookies & Tracking', icon: Cookie },
  { id: 'updates', title: '11. Updates to This Policy', icon: RefreshCw },
  { id: 'contact', title: '12. Contact', icon: Mail },
];

function TableOfContents() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="relative py-16 bg-[#0a0f1c]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="blurIn">
        <div
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
                  <section.icon className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">{section.title}</span>
                </a>
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
// PRIVACY SECTIONS
// ============================================================================

type PrivacySectionProps = {
  id: string;
  number: string;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  delay?: number;
};

function PrivacySection({
  id,
  number,
  title,
  icon: Icon,
  children,
}: PrivacySectionProps) {
  return (
    <ScrollReveal variant="fadeUp" className="scroll-mt-24">
      <div id={id}>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <span className="text-sm text-emerald-400 font-medium">{number}</span>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
      </div>
      <div className="ml-14 text-gray-400 leading-relaxed space-y-4">
        {children}
      </div>
      </div>
    </ScrollReveal>
  );
}

function PrivacyContent() {
  return (
    <section className="relative py-16 bg-[#0a0f1c]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 space-y-16">
        <PrivacySection
          id="commitment"
          number="1"
          title="Our Commitment to Privacy"
          icon={Shield}
        >
          <p>
            FormaOS is designed for regulated industries where confidentiality,
            accountability, and data integrity are essential. We are committed
            to protecting your personal and organizational information.
          </p>
        </PrivacySection>

        <PrivacySection
          id="collection"
          number="2"
          title="Information We Collect"
          icon={Database}
          delay={0.05}
        >
          <p className="font-medium text-white">a) Information You Provide</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Name, email, phone number</li>
            <li>Organization and role</li>
            <li>Account credentials</li>
            <li>Communications and support requests</li>
          </ul>

          <p className="font-medium text-white mt-6">b) Usage Data</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Login timestamps</li>
            <li>Activity logs</li>
            <li>Feature usage patterns</li>
            <li>IP address and device metadata</li>
          </ul>

          <p className="font-medium text-white mt-6">c) Customer Data</p>
          <p>Data uploaded into the platform, including:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Compliance records</li>
            <li>Evidence files</li>
            <li>Task logs</li>
            <li>Organizational structures</li>
          </ul>
        </PrivacySection>

        <PrivacySection
          id="usage"
          number="3"
          title="How We Use Your Information"
          icon={Eye}
          delay={0.1}
        >
          <p>We use information to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide and operate the platform</li>
            <li>Authenticate users and secure accounts</li>
            <li>Generate audit logs and compliance records</li>
            <li>Respond to inquiries and provide support</li>
            <li>Improve system performance and features</li>
          </ul>
          <p className="font-medium text-white mt-4">
            We do not sell or monetize your data.
          </p>
        </PrivacySection>

        <PrivacySection
          id="legal-basis"
          number="4"
          title="Legal Basis for Processing"
          icon={FileText}
          delay={0.15}
        >
          <p>We process data based on:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Contractual necessity (providing the service)</li>
            <li>Legal obligations</li>
            <li>Legitimate business interests</li>
            <li>Your explicit consent (where required)</li>
          </ul>
        </PrivacySection>

        <PrivacySection
          id="storage"
          number="5"
          title="Data Storage & Security"
          icon={Lock}
          delay={0.2}
        >
          <p>We implement enterprise-grade protections including:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {[
              { icon: Lock, label: 'Encryption at rest' },
              { icon: Shield, label: 'Encrypted transmission (TLS)' },
              { icon: Users, label: 'Role-based access control' },
              { icon: Server, label: 'Immutable audit logs' },
              { icon: Database, label: 'Secure infrastructure environments' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <item.icon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4">
            Access to data is restricted to authorized personnel only.
          </p>
        </PrivacySection>

        <PrivacySection
          id="sharing"
          number="6"
          title="Data Sharing"
          icon={Share2}
          delay={0.25}
        >
          <p>We may share information only with:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              Trusted infrastructure providers (hosting, security, analytics)
            </li>
            <li>Legal authorities where required by law</li>
          </ul>
          <p className="font-medium text-white mt-4">
            We never share data for advertising or resale.
          </p>
        </PrivacySection>

        <PrivacySection
          id="retention"
          number="7"
          title="Data Retention"
          icon={Clock}
          delay={0.3}
        >
          <p>We retain personal data only as long as:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Necessary to provide the Services</li>
            <li>Required for legal or compliance obligations</li>
            <li>Permitted by contractual agreements</li>
          </ul>
          <p className="mt-4">
            Customer data may be deleted upon account termination in accordance
            with retention policies.
          </p>
        </PrivacySection>

        <PrivacySection
          id="rights"
          number="8"
          title="Your Rights"
          icon={UserCheck}
          delay={0.35}
        >
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Access your data</li>
            <li>Request corrections</li>
            <li>Request deletion (where legally permissible)</li>
            <li>Withdraw consent</li>
          </ul>
          <p className="mt-4">To exercise your rights, contact:</p>
          <a
            href="mailto:hello@formaos.com.au"
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors mt-2"
          >
            <Mail className="w-4 h-4" />
            hello@formaos.com.au
          </a>
        </PrivacySection>

        <PrivacySection
          id="transfers"
          number="9"
          title="International Data Transfers"
          icon={Globe}
          delay={0.4}
        >
          <p>If data is transferred outside Australia, we ensure:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Contractual safeguards</li>
            <li>Compliance with applicable data protection regulations</li>
          </ul>
        </PrivacySection>

        <PrivacySection
          id="cookies"
          number="10"
          title="Cookies & Tracking"
          icon={Cookie}
          delay={0.45}
        >
          <p>We use minimal cookies for:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Authentication</li>
            <li>Session management</li>
            <li>Performance monitoring</li>
          </ul>
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mt-4">
            <p className="text-emerald-400 font-medium">
              No third-party advertising trackers are used.
            </p>
          </div>
        </PrivacySection>

        <PrivacySection
          id="updates"
          number="11"
          title="Updates to This Policy"
          icon={RefreshCw}
          delay={0.5}
        >
          <p>
            We may update this Privacy Policy to reflect regulatory, technical,
            or operational changes.
          </p>
          <p>Material changes will be communicated on our website.</p>
        </PrivacySection>

        <PrivacySection
          id="contact"
          number="12"
          title="Contact"
          icon={Mail}
          delay={0.55}
        >
          <p>For privacy concerns:</p>
          <div className="flex flex-col gap-2 mt-4">
            <a
              href="mailto:hello@formaos.com.au"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Mail className="w-4 h-4" />
              hello@formaos.com.au
            </a>
            <a
              href="tel:+61469715062"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              📞 +61 469 715 062
            </a>
          </div>
        </PrivacySection>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function PrivacyPageContent() {
  return (
    <MarketingPageShell>
      <PrivacyHero />
      <VisualDivider />
      <DeferredSection minHeight={260}>
        <TableOfContents />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={1600}>
        <PrivacyContent />
      </DeferredSection>
      <VisualDivider />
    </MarketingPageShell>
  );
}

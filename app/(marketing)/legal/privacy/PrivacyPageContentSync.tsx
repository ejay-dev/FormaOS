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
  Eye,
  Server,
  Share2,
  Clock,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { VisualDivider } from '@/components/motion';
import CinematicField from '../../components/motion/CinematicField';

// ============================================================================
// HERO SECTION - Synced with Home Page Design
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-emerald-500/5 to-transparent rounded-full" />
      </div>

      {/* Cinematic Particle Field */}
      <div className="absolute inset-0 z-1">
        <CinematicField />
      </div>

      {/* Grid Pattern - Home Page Style */}
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
            {/* Badge - Home Page Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8 backdrop-blur-sm"
            >
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium tracking-wide">
                Privacy
              </span>
            </motion.div>

            {/* Headline - Enterprise Typography Scale */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              Privacy{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Policy
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto text-center leading-relaxed"
            >
              FormaOS is designed for regulated industries where
              confidentiality, accountability, and data integrity are essential.
              We are committed to protecting your personal and organizational
              information.
            </motion.p>

            {/* Effective Date Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
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

      {/* Scroll Indicator - Home Page Pattern */}
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
// TABLE OF CONTENTS - Glassmorphism Card
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
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
              transition={{ duration: 0.4 }}
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
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// PRIVACY SECTIONS - Home Page Container Style
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
  delay = 0,
}: PrivacySectionProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay }}
      className="scroll-mt-24"
    >
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
    </motion.div>
  );
}

function PrivacyContent() {
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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-cyan-500/30 transition-colors"
              >
                <item.icon className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-gray-300">{item.label}</span>
              </motion.div>
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
          <motion.a
            href="mailto:formaos.team@gmail.com"
            whileHover={{ scale: 1.02, x: 5 }}
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mt-2 group"
          >
            <Mail className="w-4 h-4" />
            <span className="group-hover:underline decoration-cyan-400/50 underline-offset-4">
              formaos.team@gmail.com
            </span>
          </motion.a>
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
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 mt-4">
            <p className="text-cyan-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
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
          <div className="flex flex-col gap-3 mt-4">
            <motion.a
              href="mailto:formaos.team@gmail.com"
              whileHover={{ scale: 1.02, x: 5 }}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors group"
            >
              <Mail className="w-4 h-4" />
              <span className="group-hover:underline decoration-cyan-400/50 underline-offset-4">
                formaos.team@gmail.com
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
        </PrivacySection>
      </div>
    </section>
  );
}

// ============================================================================
// CTA SECTION - Home Page Style
// ============================================================================

function PrivacyCTA() {
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
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative p-10 rounded-3xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-500 shadow-2xl shadow-black/30"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Privacy-first platform
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Questions about your data?
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Contact our team for any questions regarding data handling,
                security practices, or to exercise your privacy rights.
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
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function PrivacyPageContentSync() {
  return (
    <div className="relative min-h-screen bg-[#0a0f1c]">
      {/* Fixed particle background - Home Page Pattern */}
      <div className="fixed inset-0 z-0">
        <div className="opacity-30">
          <CinematicField />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 via-transparent to-blue-500/3" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <PrivacyHero />
        <VisualDivider gradient />
        <TableOfContents />
        <PrivacyContent />
        <VisualDivider gradient />
        <PrivacyCTA />
      </div>
    </div>
  );
}

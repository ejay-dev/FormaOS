'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Shield,
  Lock,
  Database,
  Users,
  FileCheck,
  Clock,
  User,
  Link2,
  Archive,
  ArrowRight,
  CheckCircle,
  Fingerprint,
  Key,
  Server,
} from 'lucide-react';
import { useRef } from 'react';
import CinematicField from '../components/motion/CinematicField';
import { VisualDivider } from '@/components/motion';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');


// ============================================================================
// SECURITY PAGE - DESIGN SYNCED WITH HOME/PRODUCT VISUAL SYSTEM
// ============================================================================

// ----------------------------------------------------------------------------
// SecurityHero - Red/orange theme with cinematic effects
// ----------------------------------------------------------------------------
function SecurityHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 50]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100vh] flex items-center justify-center overflow-hidden"
    >
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-[#0a0f1c]">
        <CinematicField />
      </div>

      {/* Security-themed gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-red-500/30 via-orange-500/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-tl from-orange-500/30 via-red-500/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-amber-500/25 via-red-600/15 to-transparent blur-3xl"
        />
      </div>

      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 pb-24"
      >
        {/* Security Shield Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/40 to-orange-500/40 blur-xl"
            />
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-6 rounded-2xl border border-white/20 shadow-2xl">
              <Shield className="h-12 w-12 text-red-400" strokeWidth={1.5} />
            </div>
          </div>
        </motion.div>

        {/* Hero Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-8 backdrop-blur-sm"
        >
          <Lock className="h-3 w-3 text-red-400" />
          <span className="text-gray-300">Enterprise Security</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8"
        >
          <span className="text-white">Security that protects</span>
          <br />
          <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
            what matters most
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          Enterprise-grade security architecture designed for healthcare,
          government, and regulated industries. Every layer built to protect
          sensitive data and ensure compliance.
        </motion.p>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-12"
        >
          {[
            { label: 'SOC 2-aligned', icon: CheckCircle },
            { label: 'ISO 27001-aligned', icon: Shield },
            { label: 'GDPR-ready workflows', icon: Lock },
            { label: 'HIPAA Aligned', icon: FileCheck },
          ].map((cert, index) => (
            <motion.div
              key={cert.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
              className="flex items-center gap-2"
            >
              <cert.icon className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-gray-300">
                {cert.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/contact"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <span className="relative z-10">Request Security Overview</span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
          <Link
            href={`${appBase}/auth/signup`}
            className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-white hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
          >
            <span>Start Secure Trial</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
        >
          <motion.div className="w-1 h-2 rounded-full bg-red-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Security Architecture Section
// ----------------------------------------------------------------------------
function SecurityArchitecture() {
  const securityLayers = [
    {
      icon: Database,
      title: 'Encrypted Data Storage',
      description:
        'Encryption at rest and in transit with data isolation across tenants.',
      color: 'from-red-500/20 to-orange-500/20',
      borderColor: 'border-red-500/30',
      iconColor: 'text-red-400',
    },
    {
      icon: Users,
      title: 'Role-Based Access Control',
      description:
        '6 role types with granular permissions. Principle of least privilege enforced across all actions.',
      color: 'from-orange-500/20 to-amber-500/20',
      borderColor: 'border-orange-500/30',
      iconColor: 'text-orange-400',
    },
    {
      icon: Server,
      title: 'Multi-Tenant Isolation',
      description:
        'Complete data isolation between organizations via Row Level Security. Zero cross-tenant data leakage.',
      color: 'from-amber-500/20 to-yellow-500/20',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
    },
    {
      icon: FileCheck,
      title: 'Immutable Audit Logging',
      description:
        'Comprehensive audit trails that cannot be modified or deleted. Every action timestamped and attributed.',
      color: 'from-yellow-500/20 to-lime-500/20',
      borderColor: 'border-yellow-500/30',
      iconColor: 'text-yellow-400',
    },
  ];

  const certifications = [
    {
      name: 'SOC 2-aligned',
      description: 'Comprehensive security controls',
      icon: Shield,
    },
    {
      name: 'Compliance Scanning',
      description: 'Framework mapping: SOC 2, ISO, HIPAA, GDPR, NIST, PCI',
      icon: Lock,
    },
    {
      name: 'SSO & MFA',
      description: 'Google OAuth + Enterprise SAML + TOTP',
      icon: Fingerprint,
    },
    {
      name: 'AES 256-bit',
      description: 'Military-grade encryption',
      icon: Key,
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0f1c]">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-red-500/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, -30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
          className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-tl from-orange-500/20 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Lock className="h-3 w-3 text-red-400" />
            <span className="text-gray-300">Security Architecture</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Defense in depth.</span>
            <br />
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              Protection at every layer.
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Our security architecture implements multiple layers of protection,
            ensuring that no single point of failure can compromise your data.
          </p>
        </motion.div>

        {/* Security Layers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-20">
          {securityLayers.map((layer, index) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className={`group relative backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border ${layer.borderColor} p-8 hover:from-white/[0.12] hover:to-white/[0.04] transition-all duration-500`}
            >
              {/* Hover glow effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${layer.color} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10`}
              />

              <div className="flex items-start gap-5">
                <div
                  className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${layer.color} border ${layer.borderColor} flex items-center justify-center`}
                >
                  <layer.icon className={`h-7 w-7 ${layer.iconColor}`} />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">
                    {layer.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {layer.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 lg:p-10"
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-white mb-3">
              Compliance & Certifications
            </h3>
            <p className="text-gray-400">
              Enterprise-grade security verified by independent auditors
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group text-center p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <cert.icon className="h-6 w-6 text-red-400" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {cert.name}
                </h4>
                <p className="text-xs text-gray-500">{cert.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Evidence Integrity Section
// ----------------------------------------------------------------------------
function EvidenceIntegrity() {
  const evidenceProperties = [
    {
      number: '01',
      icon: Clock,
      title: 'Time-Stamped',
      description:
        'Every piece of evidence carries cryptographic timestamps that prove when it was created or modified.',
      detail: 'Immutable temporal records',
    },
    {
      number: '02',
      icon: User,
      title: 'User-Attributed',
      description:
        'Complete attribution chain from creation through every modification. Know exactly who did what.',
      detail: 'Full accountability trail',
    },
    {
      number: '03',
      icon: Link2,
      title: 'Control-Linked',
      description:
        'Evidence automatically links to specific controls and requirements, maintaining compliance context.',
      detail: 'Automated compliance mapping',
    },
    {
      number: '04',
      icon: Archive,
      title: 'Audit-Preserved',
      description:
        'Once captured, evidence cannot be altered without creating a new version with full audit trail.',
      detail: 'Version-controlled history',
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Animated orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-orange-500/15 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <FileCheck className="h-3 w-3 text-orange-400" />
            <span className="text-gray-300">Evidence Integrity</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Evidence that auditors</span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              can actually trust.
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            In governance, the quality of evidence determines the quality of
            decisions. FormaOS ensures every piece of evidence maintains its
            integrity from creation through audit.
          </p>
        </motion.div>

        {/* Evidence Properties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {evidenceProperties.map((property, index) => (
            <motion.div
              key={property.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group relative backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 hover:border-orange-500/30 transition-all duration-500"
            >
              {/* Number indicator */}
              <div className="absolute top-6 right-6">
                <span className="text-5xl font-bold text-white/[0.06] group-hover:text-orange-500/20 transition-colors duration-300">
                  {property.number}
                </span>
              </div>

              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <property.icon className="h-7 w-7 text-orange-400" />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {property.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-3">
                    {property.description}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <CheckCircle className="h-3 w-3 text-orange-400" />
                    <span className="text-xs font-medium text-orange-300">
                      {property.detail}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quality Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 backdrop-blur-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-3xl border border-white/10 p-8 lg:p-10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '100%', label: 'Evidence Traceability' },
              { value: 'Zero', label: 'Data Tampering Risk' },
              { value: 'Real-time', label: 'Integrity Verification' },
              { value: 'Complete', label: 'Audit Coverage' },
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
              >
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent mb-2">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-500">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Compliance by Design Section
// ----------------------------------------------------------------------------
function ComplianceByDesign() {
  const transparencyPrinciples = [
    {
      icon: Database,
      title: 'No Hidden State',
      description:
        "Every system state is visible, documented, and auditable. No background processes that can't be inspected. Complete transparency in how data flows through the system.",
      metrics: ['100% State Visibility', 'Full Process Documentation'],
    },
    {
      icon: FileCheck,
      title: 'Traceable Actions',
      description:
        'Every action has a clear origin, destination, and rationale. From user input to system output, the complete chain is preserved and queryable.',
      metrics: ['End-to-End Tracing', 'Complete Audit Logs'],
    },
    {
      icon: Archive,
      title: 'Documented Outcomes',
      description:
        'Every decision, approval, and change is recorded with full context. Not just what happened, but why it happened and who was responsible.',
      metrics: ['Decision Context Capture', 'Responsibility Attribution'],
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0f1c]">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.2, 0.1],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-1/4 left-1/3 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-amber-500/15 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
          className="absolute top-1/3 right-1/4 w-1/4 h-1/4 rounded-full bg-gradient-to-tl from-red-500/15 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <CheckCircle className="h-3 w-3 text-amber-400" />
            <span className="text-gray-300">Compliance by Design</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Transparency is not optional.</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-lime-400 bg-clip-text text-transparent">
              It is the architecture.
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            FormaOS is built on the principle that governance systems must be
            inherently transparent. Security through obscurity has no place in
            compliance.
          </p>
        </motion.div>

        {/* Transparency Principles */}
        <div className="space-y-6">
          {transparencyPrinciples.map((principle, index) => (
            <motion.div
              key={principle.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 lg:p-10 hover:border-amber-500/30 transition-all duration-500"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <principle.icon className="h-8 w-8 text-amber-400" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {principle.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    {principle.description}
                  </p>

                  {/* Metrics */}
                  <div className="flex flex-wrap gap-3">
                    {principle.metrics.map((metric) => (
                      <div
                        key={metric}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20"
                      >
                        <CheckCircle className="h-3 w-3 text-amber-400" />
                        <span className="text-xs font-medium text-amber-300">
                          {metric}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Final Security CTA Section
// ----------------------------------------------------------------------------
function FinalSecurityCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-red-500/20 via-orange-500/15 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
          className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-gradient-to-tl from-amber-500/20 via-yellow-500/10 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Executive Security Panel */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-w-4xl mx-auto">
            {/* Security CTA Header */}
            <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-8 sm:px-12 py-8 sm:py-10">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.12] border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6 text-red-400"
                >
                  <Shield className="h-3 w-3" />
                  Security First
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
                >
                  <span className="text-white">Security is not a feature.</span>
                  <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                    It is the foundation of governance.
                  </span>
                </motion.h2>

                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="w-24 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 mx-auto rounded-full mb-8"
                />
              </div>
            </div>

            {/* Security CTA Content */}
            <div className="px-8 sm:px-12 py-10 sm:py-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Security Promise */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-center lg:text-left"
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">
                    Enterprise security meets compliance requirements
                  </h3>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-sm text-gray-400">
                        SOC 2 and ISO 27001-aligned infrastructure practices
                      </span>
                    </div>
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-sm text-gray-400">
                        End-to-end encryption with enterprise key management
                      </span>
                    </div>
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="text-sm text-gray-400">
                        Immutable audit trails with cryptographic verification
                      </span>
                    </div>
                  </div>

                  <p className="text-base text-gray-500 leading-relaxed">
                    Get a comprehensive security overview tailored to your
                    compliance requirements and regulatory environment.
                  </p>
                </motion.div>

                {/* Security CTA Actions */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="text-center"
                >
                  <div className="space-y-4 mb-8">
                    <Link
                      href="/contact"
                      className="group w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-block"
                    >
                      <span className="relative z-10">
                        Request Security Overview
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>

                    <Link
                      href={`${appBase}/auth/signup`}
                      className="group w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-white hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                    >
                      <span>Start Secure Trial</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>

                  <div className="text-xs text-gray-500">
                    SOC 2-aligned • GDPR-ready • Enterprise security standards
                  </div>
                </motion.div>
              </div>
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
export default function SecurityPageContentNew() {
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white overflow-hidden">
      <SecurityHero />
      <VisualDivider gradient />
      <SecurityArchitecture />
      <VisualDivider />
      <EvidenceIntegrity />
      <VisualDivider gradient />
      <ComplianceByDesign />
      <VisualDivider />
      <FinalSecurityCTA />
    </div>
  );
}

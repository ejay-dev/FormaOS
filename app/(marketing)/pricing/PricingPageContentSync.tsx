'use client';

import Link from 'next/link';
import { useRef } from 'react';
import {
  Shield,
  ArrowRight,
  Check,
  Building2,
  Users,
  FileCheck,
  Lock,
  Database,
  CheckCircle,
  HelpCircle,
  DollarSign,
  Zap,
  Target,
  ChevronDown,
} from 'lucide-react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import { useState } from 'react';
import { VisualDivider } from '@/components/motion';
import CinematicField from '../components/motion/CinematicField';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

// ============================================================================
// PRICING PAGE - DESIGN SYNCED WITH HOME/PRODUCT VISUAL SYSTEM
// ============================================================================

// ----------------------------------------------------------------------------
// Pricing Hero Section
// ----------------------------------------------------------------------------
function PricingHero() {
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
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24"
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
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-blue-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl"
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
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-emerald-500/5 to-transparent rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
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
            'radial-gradient(circle at 1px 1px, rgba(16, 185, 129, 0.15) 1px, transparent 0)',
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8 backdrop-blur-sm"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium tracking-wide">
                Transparent Pricing
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              Compliance Infrastructure,
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                Scaled to Your Organization
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-4 max-w-3xl mx-auto text-center leading-relaxed"
            >
              FormaOS is not a productivity tool.
              <br />
              It is a compliance operating system.
            </motion.p>

            {/* Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-base text-gray-500 mb-8 max-w-2xl mx-auto text-center leading-relaxed"
            >
              Our pricing reflects the level of governance, automation, and
              regulatory accountability your organization requires, from
              foundational process tracking to enterprise-wide audit
              infrastructure.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-xs text-gray-500 mb-6 max-w-2xl mx-auto text-center"
            >
              Used by compliance teams. Aligned to ISO/SOC frameworks. Built for
              audit defensibility.
            </motion.p>

            {/* Value Props */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col items-center gap-4 mb-10"
            >
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Clear feature tiers
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Transparent entitlements
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Upgrade any time
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href={`${appBase}/auth/signup`}
                data-testid="pricing-hero-start-trial"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">Start Free Trial</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                href="/contact"
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-white hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
              >
                <span>Contact Sales</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
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
          <motion.div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Pricing Tiers Data
// ----------------------------------------------------------------------------
const pricingTiers = [
  {
    name: 'Starter',
    price: '$159',
    period: '/ month',
    tagline: 'For small teams establishing structured compliance',
    description:
      'Best for organizations beginning to formalize workflows, evidence, and audit readiness.',
    features: [
      'Core workflow modeling (Model → Execute → Verify → Prove)',
      'Task management & recurring compliance activities',
      'Evidence storage with audit trail history',
      'Framework mapping for SOC 2, ISO 27001, and GDPR',
      'Document change tracking in audit logs',
      'Basic analytics & reporting',
      'Role-based access control (RBAC)',
      'Secure audit logs',
      'Standard support',
    ],
    useCase:
      'You need structured processes, traceable actions, and defensible records without enterprise complexity.',
    cta: 'Start Free Trial',
    href: `${appBase}/auth/signup?plan=basic`,
    featured: false,
    color: 'cyan',
    gradientFrom: 'from-cyan-500/20',
    gradientTo: 'to-cyan-500/5',
    borderColor: 'border-cyan-500/30',
    accentColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
  },
  {
    name: 'Professional',
    price: '$239',
    period: '/ month',
    tagline: 'For growing organizations managing active regulatory obligations',
    description:
      'Designed for teams that must demonstrate compliance consistently and efficiently.',
    starterPlus: true,
    features: [
      'Advanced analytics & compliance dashboards',
      'Full audit trail with export (CSV/ZIP)',
      'Evidence activity history in audit logs',
      'Automation engine with triggers and task routing (custom workflows by request)',
      'Organization management',
      'Real-time activity feed & notifications',
      'Training & asset registers',
      'REST API access & integration capabilities',
      'Multi-entity / multi-site support',
      'Shift tracking & staff workflows',
      'Visit scheduling & service logs',
      'Priority support',
    ],
    useCase:
      'You must reduce audit effort, automate controls, and manage compliance across teams or departments.',
    cta: 'Start Free Trial',
    href: `${appBase}/auth/signup?plan=pro`,
    featured: true,
    color: 'emerald',
    gradientFrom: 'from-emerald-500/25',
    gradientTo: 'to-emerald-500/5',
    borderColor: 'border-emerald-500/50',
    accentColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    tagline:
      'For regulated organizations requiring operational governance at scale',
    description:
      'Built for healthcare providers, NDIS operators, financial institutions, education bodies, and government agencies.',
    professionalPlus: true,
    features: [
      'Google OAuth + enterprise SSO (SAML by request)',
      'MFA options available by request',
      'Executive dashboard with risk analytics',
      'Compliance score engine with trend insights',
      'Cross-framework control mappings (SOC 2, NIST, CIS)',
      'Compliance Gate Enforcement for audit-blocking controls',
      'Compliance score history tracking',
      'Compliance intelligence with scoring',
      'Custom reporting & regulatory export bundles',
      'Dedicated onboarding & implementation support',
    ],
    useCase:
      'Compliance is mission-critical, audits are frequent, and regulatory defensibility is non-negotiable.',
    cta: 'Contact Sales',
    href: '/contact',
    featured: false,
    color: 'purple',
    gradientFrom: 'from-purple-500/20',
    gradientTo: 'to-purple-500/5',
    borderColor: 'border-purple-500/30',
    accentColor: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
  },
];

// ----------------------------------------------------------------------------
// Pricing Tiers Section
// ----------------------------------------------------------------------------
function PricingTiers() {
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
          className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent blur-3xl"
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
          className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-tl from-purple-500/20 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Target className="h-3 w-3 text-emerald-400" />
            <span className="text-gray-300">Choose Your Plan</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Choose Your Compliance
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Operating Level
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            All plans include the complete FormaOS compliance engine with
            transparent monthly pricing.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {pricingTiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{
                y: tier.featured ? -16 : -8,
                transition: { duration: 0.3 },
              }}
              className={`group relative ${tier.featured ? 'lg:-mt-4 lg:mb-4' : ''}`}
            >
              {/* Featured badge */}
              {tier.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full text-sm font-bold text-white shadow-lg shadow-emerald-500/30"
                  >
                    Most Popular
                  </motion.div>
                </div>
              )}

              {/* Card */}
              <div
                className={`relative backdrop-blur-xl bg-gradient-to-br ${tier.gradientFrom} ${tier.gradientTo} rounded-3xl p-8 border-2 ${tier.featured ? tier.borderColor : 'border-white/10'} shadow-2xl transition-all duration-500 group-hover:shadow-3xl ${tier.featured ? 'group-hover:shadow-emerald-500/20' : ''} group-hover:border-opacity-100 overflow-hidden h-full`}
              >
                {/* Hover glow effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${tier.gradientFrom} ${tier.gradientTo} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10`}
                />

                {/* Tier Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {tier.name}
                  </h3>
                  <p className={`text-sm font-medium ${tier.accentColor}`}>
                    {tier.tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span
                      className={`text-5xl font-bold bg-gradient-to-r ${tier.color === 'cyan' ? 'from-cyan-400 to-blue-400' : tier.color === 'emerald' ? 'from-emerald-400 to-cyan-400' : 'from-purple-400 to-pink-400'} bg-clip-text text-transparent`}
                    >
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-lg text-gray-500 ml-2">
                        {tier.period}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  {tier.description}
                </p>

                {/* Includes Label */}
                {tier.starterPlus && (
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-semibold">
                    Everything in Starter, plus:
                  </p>
                )}
                {tier.professionalPlus && (
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-semibold">
                    Everything in Professional, plus:
                  </p>
                )}
                {!tier.starterPlus && !tier.professionalPlus && (
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-semibold">
                    Includes:
                  </p>
                )}

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
                      className="flex items-start gap-3 text-sm text-gray-300"
                    >
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded-full ${tier.iconBg} flex items-center justify-center mt-0.5`}
                      >
                        <Check className={`w-3 h-3 ${tier.accentColor}`} />
                      </div>
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Use When */}
                <div className="mb-8 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                    Use when:
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {tier.useCase}
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href={tier.href}
                  data-testid={`pricing-${tier.name.toLowerCase()}-cta`}
                  className={`group/btn relative block w-full py-4 px-6 rounded-2xl text-center font-semibold transition-all duration-300 overflow-hidden ${
                    tier.featured
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105'
                      : `bg-white/10 hover:bg-white/20 text-white border ${tier.borderColor} hover:border-opacity-100`
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {tier.cta}
                    {!tier.featured && (
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    )}
                  </span>
                  {tier.featured && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                  )}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// All Plans Include Section
// ----------------------------------------------------------------------------
const allPlansFeatures = [
  {
    icon: FileCheck,
    title: 'Immutable Audit Trail',
    description: 'Every action recorded and time-stamped',
  },
  {
    icon: Database,
    title: 'Evidence Vault',
    description: 'Versioned, secure, and defensible documentation',
  },
  {
    icon: Shield,
    title: 'Workflow Governance',
    description: 'Enforce how work is executed, not just recorded',
  },
  {
    icon: Lock,
    title: 'Role-Based Security',
    description: 'Strict access controls by function and responsibility',
  },
  {
    icon: Users,
    title: 'Operational Transparency',
    description: 'Real-time insight into compliance activity',
  },
];

function AllPlansInclude() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
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
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-cyan-500/15 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Zap className="h-3 w-3 text-cyan-400" />
            <span className="text-gray-300">Core Foundation</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            What All Plans Include
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Every FormaOS plan provides the foundations of a true compliance
            operating system
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {allPlansFeatures.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group text-center p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-emerald-500/30 transition-all duration-500"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" />

              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 backdrop-blur-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-3xl border border-white/10 p-8 text-center"
        >
          <p className="text-gray-400 text-base">
            No tier compromises your ability to meet regulatory expectations.
            <span className="text-emerald-400 font-medium ml-1">
              Upgrade or downgrade anytime.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Free Trial Section
// ----------------------------------------------------------------------------
function FreeTrial() {
  const trialFeatures = [
    'Model your compliance workflows',
    'Run live operations',
    'Generate audit records',
    'Evaluate fit before committing',
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0f1c]">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/3 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/20 via-white/[0.08] to-white/[0.04] rounded-3xl border border-cyan-500/30 p-12 text-center shadow-2xl"
        >
          {/* Floating glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 rounded-3xl blur-2xl -z-10" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.12] border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Zap className="h-3 w-3 text-cyan-400" />
            <span className="text-cyan-300">Risk-Free</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            14-Day Free Trial
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            All plans start with a 14-day free trial. No credit card required.
          </p>

          {/* Trial features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {trialFeatures.map((feature, idx) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
                className="p-4 rounded-xl bg-white/[0.06] border border-white/10"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-sm text-gray-300">{feature}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Link
              href={`${appBase}/auth/signup`}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-10 py-4 text-lg font-semibold text-white shadow-xl hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10">Start Your Free Trial</span>
              <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>

            <p className="text-sm text-gray-500 mt-4">
              No credit card • Full access • Cancel anytime
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// FAQ Section
// ----------------------------------------------------------------------------
const faqs = [
  {
    question: 'Can I change plans anytime?',
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any billing adjustments.",
  },
  {
    question: 'Is there a setup fee?',
    answer:
      'No setup fees, ever. You can start with our free Starter plan and upgrade when your team grows or needs additional features.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards and can arrange invoicing for Enterprise customers. All transactions are processed securely through Stripe.',
  },
  {
    question: 'How does data migration work?',
    answer:
      'Our customer success team provides guided migration assistance for Enterprise customers. We also offer import tools and API access for bulk data transfer.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes, you can cancel your subscription at any time. Your data remains accessible for 30 days after cancellation to ensure smooth transitions.',
  },
  {
    question: 'Do you offer training?',
    answer:
      'All plans include self-service resources. Professional and Enterprise plans include live onboarding sessions and ongoing training support.',
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        {/* Animated gradient orbs */}
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
          transition={{ duration: 0.8 }}
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
            Common questions about FormaOS pricing and plans
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
              transition={{ delay: idx * 0.1, duration: 0.5 }}
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

// ----------------------------------------------------------------------------
// Final CTA Section
// ----------------------------------------------------------------------------
function FinalCTA() {
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
          className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-emerald-500/20 via-cyan-500/15 to-transparent blur-3xl"
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
          className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-gradient-to-tl from-blue-500/20 via-purple-500/10 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Executive Panel */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-8 sm:px-12 py-8 sm:py-10">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.12] border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6 text-emerald-400"
                >
                  <Building2 className="h-3 w-3" />
                  Ready to Start
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6"
                >
                  <span className="text-white">
                    Build your compliance foundation
                  </span>
                  <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    with FormaOS
                  </span>
                </motion.h2>

                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="w-24 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 mx-auto rounded-full"
                />
              </div>
            </div>

            {/* Content */}
            <div className="px-8 sm:px-12 py-10 sm:py-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Value Props */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-center lg:text-left"
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">
                    Start transforming compliance today
                  </h3>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-sm text-gray-400">
                        14-day free trial on all plans
                      </span>
                    </div>
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span className="text-sm text-gray-400">
                        No credit card required to start
                      </span>
                    </div>
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-sm text-gray-400">
                        Cancel or change plans anytime
                      </span>
                    </div>
                  </div>

                  <p className="text-base text-gray-500 leading-relaxed">
                    Join organizations building audit-ready compliance
                    infrastructure with FormaOS.
                  </p>
                </motion.div>

                {/* CTA Actions */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="text-center"
                >
                  <div className="space-y-4 mb-8">
                    <Link
                      href={`${appBase}/auth/signup`}
                      className="group w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-block"
                    >
                      <span className="relative z-10">Start Free Trial</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>

                    <Link
                      href="/contact"
                      className="group w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-white hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                    >
                      <span>Talk to Sales</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>

                  <div className="text-xs text-gray-500">
                    Region-aware hosting • GDPR-ready workflows •
                    Enterprise-ready
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
export default function PricingPageContentSync() {
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white overflow-hidden">
      <PricingHero />
      <VisualDivider gradient />
      <PricingTiers />
      <VisualDivider />
      <AllPlansInclude />
      <VisualDivider gradient />
      <FreeTrial />
      <VisualDivider />
      <FAQSection />
      <VisualDivider gradient />
      <FinalCTA />
    </div>
  );
}

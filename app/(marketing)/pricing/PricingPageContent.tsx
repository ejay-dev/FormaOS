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
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { VisualDivider } from '@/components/motion';
import CinematicField from '../components/motion/CinematicField';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');


// ============================================================================
// HERO SECTION
// ============================================================================

export function PricingHero() {
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
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium tracking-wide">
                Pricing
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
              regulatory accountability your organization requires — from
              foundational process tracking to enterprise-wide audit
              infrastructure.
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
                  No hidden modules
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  No feature lock-outs
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Clear tiers aligned to maturity
                </span>
              </div>
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

// ============================================================================
// PRICING TIERS SECTION
// ============================================================================

const pricingTiers = [
  {
    name: 'Starter',
    tagline: 'For small teams establishing structured compliance',
    description:
      'Best for organizations beginning to formalize workflows, evidence, and audit readiness.',
    features: [
      'Core workflow modeling (Model → Execute → Verify → Prove)',
      'Task management & recurring compliance activities',
      'Evidence storage with version history',
      'Basic analytics & reporting',
      'Role-based access control (RBAC)',
      'Secure audit logs',
      'Standard support',
    ],
    useCase:
      'You need structured processes, traceable actions, and defensible records without enterprise complexity.',
    cta: 'Start Free Trial',
    href: '/auth/signup?plan=starter',
    featured: false,
    color: 'cyan',
  },
  {
    name: 'Professional',
    tagline: 'For growing organizations managing active regulatory obligations',
    description:
      'Designed for teams that must demonstrate compliance consistently and efficiently.',
    starterPlus: true,
    features: [
      'Advanced analytics & compliance dashboards',
      'Full audit trail with export (PDF/CSV)',
      'Evidence versioning & change history',
      'Workflow automation engine',
      'Multi-organization management',
      'Real-time notifications & activity monitoring',
      'Priority support',
    ],
    useCase:
      'You must reduce audit effort, automate controls, and manage compliance across teams or departments.',
    cta: 'Start Free Trial',
    href: '/auth/signup?plan=professional',
    featured: true,
    color: 'emerald',
  },
  {
    name: 'Enterprise',
    tagline:
      'For regulated organizations requiring operational governance at scale',
    description:
      'Built for healthcare providers, NDIS operators, financial institutions, education bodies, and government agencies.',
    starterPlus: false,
    professionalPlus: true,
    features: [
      'Advanced security controls (SSO, MFA, enterprise access policies)',
      'Organization-wide governance and cross-unit visibility',
      'AI-assisted risk analysis & compliance scanning',
      'Custom reporting & regulatory export frameworks',
      'API access & system integrations',
      'Dedicated onboarding & implementation support',
      'SLA, data residency options, and compliance review assistance',
    ],
    useCase:
      'Compliance is mission-critical, audits are frequent, and regulatory defensibility is non-negotiable.',
    cta: 'Contact Sales',
    href: '/contact',
    featured: false,
    color: 'purple',
  },
];

function PricingTiers() {
  return (
    <section className="relative py-32 bg-[#0a0f1c]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Choose Your Compliance Operating Level
          </h2>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {pricingTiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                tier.featured
                  ? 'bg-gradient-to-br from-emerald-500/20 via-white/[0.08] to-white/[0.04] border-2 border-emerald-500/40'
                  : 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10'
              } backdrop-blur-xl`}
            >
              {tier.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 rounded-full text-sm font-medium text-white">
                  Most Popular
                </div>
              )}

              {/* Tier Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {tier.name}
                </h3>
                <p
                  className={`text-sm font-medium ${
                    tier.color === 'cyan'
                      ? 'text-cyan-400'
                      : tier.color === 'emerald'
                        ? 'text-emerald-400'
                        : 'text-purple-400'
                  }`}
                >
                  {tier.tagline}
                </p>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                {tier.description}
              </p>

              {/* Includes Label */}
              {tier.starterPlus && (
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
                  Everything in Starter, plus:
                </p>
              )}
              {tier.professionalPlus && (
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
                  Everything in Professional, plus:
                </p>
              )}
              {!tier.starterPlus && !tier.professionalPlus && (
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
                  Includes:
                </p>
              )}

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-gray-300"
                  >
                    <CheckCircle2
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        tier.color === 'cyan'
                          ? 'text-cyan-400'
                          : tier.color === 'emerald'
                            ? 'text-emerald-400'
                            : 'text-purple-400'
                      }`}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Use When */}
              <div className="mb-8 p-4 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  Use when:
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {tier.useCase}
                </p>
              </div>

              {/* CTA */}
              <Link
                href={tier.href}
                className={`block w-full py-3 px-6 rounded-lg text-center font-medium transition-all duration-300 ${
                  tier.featured
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// WHAT ALL PLANS INCLUDE
// ============================================================================

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
    <section className="relative py-32 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="text-center p-6 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-xl"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-gray-500 mt-12 text-sm"
        >
          No tier compromises your ability to meet regulatory expectations.
        </motion.p>
      </div>
    </section>
  );
}

// ============================================================================
// FREE TRIAL SECTION
// ============================================================================

function FreeTrial() {
  return (
    <section className="relative py-32 bg-[#0a0f1c]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center rounded-2xl p-12 bg-gradient-to-br from-cyan-500/20 via-white/[0.08] to-white/[0.04] border border-cyan-500/30 backdrop-blur-xl"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            14-Day Free Trial
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            All plans start with a 14-day free trial.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              'Model your compliance workflows',
              'Run live operations',
              'Generate audit records',
              'Test reporting and evidence export',
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="p-4 rounded-lg bg-white/[0.05] border border-white/10"
              >
                <p className="text-sm text-gray-300">{item}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 mb-8">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              Cancel anytime
            </span>
          </div>

          <Link
            href={`${appBase}/auth/signup`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition-all duration-300"
          >
            Start Your Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// ENTERPRISE IMPLEMENTATION
// ============================================================================

function EnterpriseImplementation() {
  return (
    <section className="relative py-32 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Enterprise Implementation & Customization
          </h2>
          <p className="text-lg text-gray-400">
            For complex environments, FormaOS offers tailored deployment
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {[
            {
              icon: Building2,
              title: 'Custom Onboarding',
              description: 'Custom onboarding & system configuration',
            },
            {
              icon: Shield,
              title: 'Industry Frameworks',
              description: 'Industry-specific compliance frameworks',
            },
            {
              icon: Database,
              title: 'System Integration',
              description:
                'Integration with identity, document, and operational systems',
            },
            {
              icon: Users,
              title: 'Architecture Support',
              description: 'Dedicated compliance architecture support',
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex items-start gap-4 p-6 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-gray-400 mb-8"
        >
          If your organization operates across multiple regulatory regimes, we
          will configure FormaOS to match your structure.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-medium transition-all duration-300"
          >
            Contact Sales for Enterprise Implementation
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// TRANSPARENT PRICING
// ============================================================================

function TransparentPricing() {
  return (
    <section className="relative py-32 bg-[#0a0f1c]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Transparent, Defensible Pricing
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Based On */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10"
          >
            <h3 className="text-xl font-semibold text-white mb-6">
              FormaOS pricing is based on:
            </h3>
            <ul className="space-y-4">
              {[
                'Organizational scale',
                'Compliance complexity',
                'Governance requirements',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* We Do Not Charge For */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-xl bg-gradient-to-br from-emerald-500/10 to-white/[0.02] border border-emerald-500/20"
          >
            <h3 className="text-xl font-semibold text-white mb-6">
              We do not charge for:
            </h3>
            <ul className="space-y-4">
              {[
                'Audit logs',
                'Evidence retention',
                'Security controls',
                'Compliance reporting',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center text-gray-400 mt-12 text-lg"
        >
          Because in regulated environments, these are not &quot;premium
          features&quot; — they are necessities.
        </motion.p>
      </div>
    </section>
  );
}

// ============================================================================
// FAQ SECTION
// ============================================================================

const faqs = [
  {
    question: 'Is FormaOS just a task or document system?',
    answer:
      'No. FormaOS is a compliance operating system. Tasks, evidence, and reports are governed within auditable workflows.',
  },
  {
    question: 'Can we upgrade as we grow?',
    answer:
      'Yes. You can move between plans as your compliance requirements expand.',
  },
  {
    question: 'Does every plan include audit trails?',
    answer: 'Yes. Auditability is foundational to FormaOS.',
  },
  {
    question: 'Do you support regulated industries?',
    answer:
      'Yes. FormaOS is designed specifically for healthcare, NDIS, finance, education, and government.',
  },
  {
    question: 'Is enterprise security included?',
    answer:
      'Enterprise-grade security features such as SSO, MFA, advanced governance, and custom compliance reporting are available on the Enterprise plan.',
  },
];

function FAQ() {
  return (
    <section className="relative py-32 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 mb-6">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-400">
              Frequently Asked Questions
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Common Questions
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="p-6 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-3">
                {faq.question}
              </h3>
              <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FINAL CTA
// ============================================================================

function FinalCTA() {
  return (
    <section className="relative py-32 bg-[#0a0f1c]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Pricing should reflect accountability, not feature lists.
          </h2>

          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            FormaOS gives your organization the infrastructure to:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              'Control how work is executed',
              'Prove compliance with evidence',
              'Defend outcomes under audit',
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-medium">{item}</p>
              </motion.div>
            ))}
          </div>

          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Whether you are establishing structure or operating at enterprise
            scale, FormaOS provides the governance your operations require.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`${appBase}/auth/signup`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all duration-300"
            >
              Contact Sales
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export function PricingContent() {
  return (
    <div className="relative">
      <PricingTiers />
      <VisualDivider />
      <AllPlansInclude />
      <VisualDivider />
      <FreeTrial />
      <VisualDivider />
      <EnterpriseImplementation />
      <VisualDivider />
      <TransparentPricing />
      <VisualDivider />
      <FAQ />
      <VisualDivider />
      <FinalCTA />
    </div>
  );
}

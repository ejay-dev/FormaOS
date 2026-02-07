'use client';

import { useRef } from 'react';
import {
  Building2,
  Heart,
  Users,
  FileCheck,
  Shield,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Zap,
  Activity,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { VisualDivider } from '@/components/motion';
import CinematicField from '../components/motion/CinematicField';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');


// ============================================
// HERO COMPONENT (Already matches Product style)
// ============================================

function IndustriesHero() {
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
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl"
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-cyan-500/5 to-transparent rounded-full" />
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
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium tracking-wide">
                Industry Solutions
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              One OS. Multiple
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                Regulatory Frameworks.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-4 max-w-2xl mx-auto text-center leading-relaxed"
            >
              FormaOS adapts to your industry&apos;s requirements. Pre-built
              frameworks. Enforced controls. Evidence that auditors trust.
            </motion.p>

            {/* Industry Context */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.65 }}
              className="mb-10 max-w-2xl mx-auto text-center"
            >
              <p className="text-sm text-gray-500 mb-3">
                Framework-agnostic compliance infrastructure
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                  NDIS & Aged Care
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Healthcare
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Financial Services
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <motion.a
                href={`${appBase}/auth/signup`}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.a
                href="/contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-lg flex items-center gap-3 hover:border-emerald-400/50 hover:bg-emerald-400/5 transition-all"
              >
                <span>Request Demo</span>
              </motion.a>
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

// ============================================
// MISSION CRITICAL CONTEXT
// ============================================

function MissionCriticalContext() {
  const consequences = [
    { label: 'Legal liability and penalties', color: 'bg-rose-400' },
    { label: 'License suspension or revocation', color: 'bg-orange-400' },
    { label: 'Reputational and operational damage', color: 'bg-amber-400' },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Ambient Background */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
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
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Industry Use
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Built for Environments Where
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {' '}
              Accountability Is Non-Negotiable
            </span>
          </h2>
        </motion.div>

        {/* Mission Critical Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 sm:p-12"
        >
          <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-8">
            When compliance failures have serious consequences
          </h3>

          <div className="grid sm:grid-cols-3 gap-8">
            {consequences.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div
                  className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-4`}
                />
                <p className="text-gray-400 font-medium">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// INDUSTRY VERTICALS
// ============================================

const industries = [
  {
    icon: Heart,
    title: 'Disability and Aged Care',
    description:
      'Operationalize NDIS, quality standards, safeguarding, incident management, and audits.',
    features: [
      'Practice Standards 1-8',
      'Incident Management',
      'Worker Screening',
    ],
    color: 'pink',
    gradient: 'from-pink-500/20 to-pink-500/10',
    border: 'border-pink-500/20',
    hoverBorder: 'hover:border-pink-400/40',
    textColor: 'text-pink-400',
    dotColor: 'bg-pink-400',
  },
  {
    icon: Shield,
    title: 'Healthcare and Allied Health',
    description:
      'Manage accreditation, clinical governance, compliance workflows, and evidence tracking.',
    features: ['NSQHS Standards', 'Clinical Governance', 'Safety & Risk'],
    color: 'blue',
    gradient: 'from-blue-500/20 to-blue-500/10',
    border: 'border-blue-500/20',
    hoverBorder: 'hover:border-blue-400/40',
    textColor: 'text-blue-400',
    dotColor: 'bg-blue-400',
  },
  {
    icon: TrendingUp,
    title: 'Financial Services',
    description:
      'Track regulatory obligations, risk controls, internal audits, and compliance reporting.',
    features: ['Regulatory Tracking', 'Risk Controls', 'Internal Audits'],
    color: 'green',
    gradient: 'from-green-500/20 to-green-500/10',
    border: 'border-green-500/20',
    hoverBorder: 'hover:border-green-400/40',
    textColor: 'text-green-400',
    dotColor: 'bg-green-400',
  },
  {
    icon: Building2,
    title: 'Construction and Infrastructure',
    description:
      'Manage safety systems, contractor compliance, incident reporting, and regulatory audits.',
    features: ['Safety Systems', 'Contractor Compliance', 'Incident Reporting'],
    color: 'orange',
    gradient: 'from-orange-500/20 to-orange-500/10',
    border: 'border-orange-500/20',
    hoverBorder: 'hover:border-orange-400/40',
    textColor: 'text-orange-400',
    dotColor: 'bg-orange-400',
  },
  {
    icon: Users,
    title: 'Education and Childcare',
    description:
      'Control policy adherence, staff compliance, risk management, and inspection readiness.',
    features: ['Policy Adherence', 'Staff Compliance', 'Inspection Readiness'],
    color: 'purple',
    gradient: 'from-purple-500/20 to-purple-500/10',
    border: 'border-purple-500/20',
    hoverBorder: 'hover:border-purple-400/40',
    textColor: 'text-purple-400',
    dotColor: 'bg-purple-400',
  },
];

function IndustryVerticals() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Ambient Background */}
      <motion.div
        className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-l from-blue-500/10 to-transparent rounded-full blur-3xl"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/10 to-transparent rounded-full blur-3xl"
        animate={{
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 3,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
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
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Example Verticals
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Compliance Infrastructure
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-500 bg-clip-text text-transparent">
              {' '}
              Across Industries
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Pre-built frameworks tailored to specific regulatory environments
          </p>
        </motion.div>

        {/* Industries Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            return (
              <motion.div
                key={industry.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className={`group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 ${industry.hoverBorder} p-6 transition-all duration-300`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${industry.gradient} ${industry.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`h-6 w-6 ${industry.textColor}`} />
                  </div>
                  <div className="flex-1">
                    <h4
                      className={`font-bold text-lg mb-1 text-white group-hover:${industry.textColor} transition-colors duration-300`}
                    >
                      {industry.title}
                    </h4>
                  </div>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  {industry.description}
                </p>

                <div className="space-y-2">
                  {industry.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-xs text-gray-500"
                    >
                      <div
                        className={`w-1.5 h-1.5 ${industry.dotColor} rounded-full`}
                      />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================
// CROSS-INDUSTRY PRINCIPLES
// ============================================

const principles = [
  {
    number: '1',
    icon: FileCheck,
    title: 'Obligations are structured as system logic',
    description:
      'Regulatory requirements become enforceable workflows, not checklists',
    color: 'from-indigo-500 to-blue-500',
    iconBg: 'from-indigo-500/20 to-indigo-500/10',
    iconBorder: 'border-indigo-500/20',
    iconColor: 'text-indigo-400',
    hoverColor: 'group-hover:text-indigo-400',
  },
  {
    number: '2',
    icon: Shield,
    title: 'Controls are enforced operationally',
    description:
      'Compliance happens through daily work, not separate activities',
    color: 'from-green-500 to-emerald-500',
    iconBg: 'from-green-500/20 to-green-500/10',
    iconBorder: 'border-green-500/20',
    iconColor: 'text-green-400',
    hoverColor: 'group-hover:text-green-400',
  },
  {
    number: '3',
    icon: Activity,
    title: 'Evidence is captured continuously',
    description:
      'Proof of compliance accumulates as workflows are completed',
    color: 'from-purple-500 to-violet-500',
    iconBg: 'from-purple-500/20 to-purple-500/10',
    iconBorder: 'border-purple-500/20',
    iconColor: 'text-purple-400',
    hoverColor: 'group-hover:text-purple-400',
  },
  {
    number: '4',
    icon: Zap,
    title: 'Audits become reporting, not reconstruction',
    description:
      'Audit trails are available for inspection and reporting',
    color: 'from-orange-500 to-red-500',
    iconBg: 'from-orange-500/20 to-orange-500/10',
    iconBorder: 'border-orange-500/20',
    iconColor: 'text-orange-400',
    hoverColor: 'group-hover:text-orange-400',
  },
];

function CrossIndustryPrinciples() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Ambient Background */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
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
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            Why It Works Across Industries
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Universal Compliance
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-500 bg-clip-text text-transparent">
              {' '}
              Design Principles
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Four core principles that make FormaOS effective across all
            regulated environments
          </p>
        </motion.div>

        {/* Principles Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {principles.map((principle, index) => {
            const Icon = principle.icon;
            return (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group text-center backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 hover:border-purple-500/30 p-6 transition-all duration-300"
              >
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${principle.iconBg} ${principle.iconBorder} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className={`h-8 w-8 ${principle.iconColor}`} />
                    </div>
                    <div
                      className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${principle.color} text-white text-xs font-bold flex items-center justify-center`}
                    >
                      {principle.number}
                    </div>
                  </div>
                </div>

                <h4
                  className={`font-bold text-base mb-3 text-white ${principle.hoverColor} transition-colors duration-300`}
                >
                  {principle.title}
                </h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {principle.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Design Philosophy Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 sm:p-12 text-center"
        >
          <h4 className="text-xl font-bold mb-4 text-white">
            This design philosophy makes FormaOS effective across any regulatory
            environment
          </h4>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Whether managing NDIS obligations, healthcare accreditation,
            financial regulations, or construction safety – the core principle
            remains the same: compliance should be operational, not
            administrative.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// NDIS DEEP DIVE
// ============================================

const ndisFeatures = [
  {
    icon: FileCheck,
    title: 'Practice Standards Workflows',
    description:
      'NDIS-aligned controls and templates (configurable; mapping depth varies)',
  },
  {
    icon: Shield,
    title: 'Incident Management',
    description:
      'Incident reporting and investigation workflows (regulator notifications by request)',
  },
  {
    icon: Users,
    title: 'Worker Screening',
    description:
      'Credential and training tracking with review reminders',
  },
  {
    icon: Building2,
    title: 'Governance & Leadership',
    description:
      'Governance oversight, risk management, and executive reporting',
  },
  {
    icon: Heart,
    title: 'Person-Centered Practice',
    description:
      'Participant plans, service documentation, and feedback tracking (configurable)',
  },
  {
    icon: TrendingUp,
    title: 'Continuous Improvement',
    description:
      'Service review cycles, corrective actions, and quality improvement planning',
  },
];

function NDISDeepDive() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Ambient Background */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5"
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
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
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-medium mb-6"
          >
            <Heart className="w-4 h-4" />
            NDIS Service Providers
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            NDIS-aligned Practice Standards
            <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-purple-500 bg-clip-text text-transparent">
              {' '}
              for Audit Readiness
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Configurable workflows aligned to NDIS Quality and Safeguarding
            Commission requirements
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {ndisFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 hover:border-pink-500/30 p-6 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-pink-400" />
                </div>
                <h4 className="font-bold text-white mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* NDIS CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 overflow-hidden"
        >
          <div className="grid lg:grid-cols-2 gap-8 p-8 sm:p-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Built to support NDIS audit readiness
              </h3>
              <p className="text-gray-400 mb-6">
                Our NDIS framework includes aligned controls, evidence templates,
                and configurable workflows. Mapping depth varies by deployment,
                with participant management and progress notes available.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.a
                  href="/contact"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all"
                >
                  Book NDIS Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </motion.a>
                <motion.a
                  href={`${appBase}/auth/signup`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 transition-all"
                >
                  Start Free Trial
                </motion.a>
              </div>
            </div>

            <div className="backdrop-blur-sm bg-white/[0.03] rounded-2xl border border-white/5 p-6">
              <h4 className="font-semibold text-white mb-4">
                Included NDIS Components:
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {[
                  'NDIS Practice Standards framework packs (configurable)',
                  'Incident reporting workflows (regulator notifications by request)',
                  'Credential and training tracking',
                  'Audit preparation tools and export packs',
                  'Participant feedback tracking (by request)',
                  'Risk management and mitigation workflows',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// HEALTHCARE SECTION
// ============================================

function HealthcareSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Ambient Background */}
      <motion.div
        className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-gradient-to-l from-cyan-500/10 to-transparent rounded-full blur-3xl"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
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
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <Shield className="w-4 h-4" />
            Healthcare & Allied Health
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Integrated Health Service
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
              {' '}
              Compliance Frameworks
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            AHPRA registration, clinical governance, and safety requirements in
            one system
          </p>
        </motion.div>

        {/* Healthcare Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {[
              {
                title: 'Clinical Governance',
                description:
                  'Evidence-based practice protocols, incident management, and quality improvement workflows aligned to NSQHS standards.',
              },
              {
                title: 'Professional Standards',
                description:
                  'AHPRA registration tracking, CPD management, and supervision documentation with review reminders.',
              },
              {
                title: 'Safety & Risk Management',
                description:
                  'Patient safety incident reporting, risk assessment workflows, and corrective action tracking with clinical review processes.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 hover:border-cyan-500/30 p-6 transition-all duration-300"
              >
                <h3 className="text-xl font-bold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-white/[0.02] rounded-3xl border border-cyan-500/20 p-8"
          >
            <h4 className="text-xl font-bold text-white mb-6">
              Healthcare Framework Includes:
            </h4>
            <div className="space-y-3 text-sm text-gray-400 mb-8">
              {[
                'NSQHS Standards tracking templates',
                'Clinical incident and near-miss reporting workflows',
                'Medication management templates (by request)',
                'Infection prevention and control templates',
                'Patient rights and engagement workflows',
                'Clinical handover and communication templates',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            >
              Healthcare Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FINAL CTA
// ============================================

function FinalCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-8 py-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.12] border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6 text-emerald-400"
            >
              <Building2 className="h-3 w-3" />
              Ready for Enterprise
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-white"
            >
              If your organization operates under regulation,
              <br className="hidden lg:inline" />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                FormaOS provides the system to run compliance as part of daily
                operations.
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

          {/* Content */}
          <div className="px-8 py-10">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Industry Promise */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">
                  Pre-built compliance infrastructure for your industry
                </h3>

                <div className="space-y-4 mb-8">
                  {[
                    {
                      color: 'bg-green-400',
                      text: 'Industry-specific frameworks ready from day one',
                    },
                    {
                      color: 'bg-blue-400',
                      text: 'Complete regulatory mapping and controls',
                    },
                    {
                      color: 'bg-purple-400',
                      text: 'Audit-ready evidence capture and reporting',
                    },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-sm text-gray-400">{item.text}</span>
                    </div>
                  ))}
                </div>

                <p className="text-gray-500">
                  See how FormaOS transforms compliance from a quarterly burden
                  into daily operational certainty for your specific regulatory
                  environment.
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
                <div className="space-y-4 mb-6">
                  <motion.a
                    href="/contact"
                    whileHover={{
                      scale: 1.05,
                      boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    Request Industry Demo
                  </motion.a>

                  <motion.a
                    href={`${appBase}/auth/signup`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-white/20 text-white font-semibold hover:bg-white/[0.08] hover:border-white/30 transition-all"
                  >
                    <span>Start Free Trial</span>
                    <ArrowRight className="h-5 w-5" />
                  </motion.a>
                </div>

                <p className="text-xs text-gray-500">
                  No credit card required • Full platform access • Industry
                  framework included
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// MAIN EXPORT
// ============================================

export default function IndustriesPageContent() {
  return (
    <div className="relative bg-[#0a0f1c]">
      <IndustriesHero />
      <VisualDivider />
      <MissionCriticalContext />
      <VisualDivider />
      <IndustryVerticals />
      <VisualDivider />
      <CrossIndustryPrinciples />
      <VisualDivider />
      <NDISDeepDive />
      <VisualDivider />
      <HealthcareSection />
      <VisualDivider />
      <FinalCTA />
    </div>
  );
}

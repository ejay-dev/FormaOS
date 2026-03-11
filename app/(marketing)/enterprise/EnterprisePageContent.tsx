'use client';

import { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Globe,
  Users,
  FileText,
  CheckCircle,
  ArrowRight,
  Building2,
  Clock,
  Server,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  Sparkles,
  Shield,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

/* ─── Types & Data ──────────────────────────────────────── */

interface EnterpriseFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  highlights?: string[];
}

const enterpriseFeatures: EnterpriseFeature[] = [
  {
    icon: Lock,
    title: 'SAML 2.0 SSO & MFA Enforcement',
    description:
      'Metadata-based SAML 2.0 configuration with Okta, Microsoft Entra ID (Azure AD), and Google Workspace. MFA enforcement and session policy management. SCIM provisioning for automated user lifecycle management.',
    highlights: ['Okta', 'Entra ID', 'Google Workspace', 'SCIM 2.0'],
  },
  {
    icon: Globe,
    title: 'Data Residency',
    description:
      'AU-based hosting by default. Enterprise data residency expansion to US and EU regions is on the roadmap. Standard Contractual Clauses available for international transfers.',
    highlights: ['AU Region Live', 'US/EU Planned', 'SCCs Available'],
  },
  {
    icon: Users,
    title: 'Multi-Entity Management',
    description:
      'Manage compliance across multiple entities, sites, or business units with entity-scoped controls, evidence, and audit trails. Centralized executive dashboard with cross-entity rollup.',
    highlights: [
      'Entity Scoping',
      'Cross-Entity Rollup',
      'Executive Dashboard',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'MFA Enforcement',
    description:
      'Enforce MFA across your entire tenant from the identity governance settings. Supports TOTP, hardware keys, and provider-managed MFA via SAML SSO session validation.',
    highlights: ['TOTP', 'Hardware Keys', 'SAML Session Validation'],
  },
  {
    icon: Server,
    title: '99.9% Monthly Uptime SLA',
    description:
      'SLA target incorporated into your executed MSA/SOW. P1 critical incident acknowledgement within 1 business hour; P2 within 4 business hours. 48-hour advance notice for planned maintenance.',
    highlights: ['99.9% SLA', 'P1 < 1hr', 'P2 < 4hrs'],
  },
  {
    icon: FileText,
    title: 'Procurement Artifacts on Day One',
    description:
      'DPA, vendor assurance questionnaire, security review packet, subprocessor disclosures, and penetration test executive summary - available before procurement asks the first question.',
    highlights: ['DPA', 'Vendor Questionnaire', 'Pen Test Summary'],
  },
];

const procurementChecklist = [
  {
    label: 'Data Processing Agreement (DPA)',
    href: '/trust/dpa',
    icon: FileText,
  },
  {
    label: 'Vendor Assurance Questionnaire',
    href: '/trust/vendor-assurance',
    icon: CheckCircle,
  },
  {
    label: 'Subprocessor List + Data Flow Diagram',
    href: '/trust/subprocessors',
    icon: Globe,
  },
  {
    label: 'Penetration Test Executive Summary (NDA)',
    href: '/contact',
    icon: Shield,
  },
  {
    label: 'Trust Packet PDF (architecture, encryption, identity)',
    href: '/trust/packet',
    icon: Lock,
  },
  {
    label: 'Security Review Packet',
    href: '/security-review',
    icon: ShieldCheck,
  },
  {
    label: 'SLA Terms (99.9% uptime, P1/P2 response)',
    href: '/trust/sla',
    icon: Clock,
  },
  {
    label: 'Data Residency Confirmation',
    href: '/trust/data-handling',
    icon: Server,
  },
];

const slaCommitments = [
  { label: 'Monthly uptime SLA', value: '99.9%', icon: Server },
  { label: 'P1 critical - acknowledgement', value: '< 1 hr', icon: Zap },
  {
    label: 'P2 high priority - acknowledgement',
    value: '< 4 hrs',
    icon: Clock,
  },
  {
    label: 'Planned maintenance notice',
    value: '48 hrs min',
    icon: CalendarDays,
  },
  { label: 'Annual uptime report', value: 'On request', icon: FileText },
  { label: 'Named escalation path', value: 'Included', icon: Users },
];

const testimonials = [
  {
    quote:
      'Our procurement team had a complete vendor risk package within 24 hours of requesting it. DPA countersigned, penetration test summary reviewed, SLA confirmed. No delays to the project timeline.',
    name: 'Darren F.',
    role: 'Head of IT Procurement',
    org: 'National Healthcare Network',
    sector: 'Healthcare',
    accentColor: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    quote:
      'We manage compliance for 14 registered NDIS sites. FormaOS gives each site its own audit trail while our compliance team has a single view across all of them. The multi-entity model is exactly what enterprise buyers need.',
    name: 'Alicia W.',
    role: 'Group Compliance Director',
    org: 'Multi-Site Disability Services Organisation',
    sector: 'NDIS',
    accentColor: 'from-violet-500/20 to-blue-500/20',
  },
];

const trustSignals = [
  { label: 'SOC 2 Type II', sublabel: 'In progress', color: 'text-violet-400' },
  { label: 'ISO 27001', sublabel: 'Framework mapped', color: 'text-blue-400' },
  {
    label: 'GDPR Compliant',
    sublabel: 'DPA available',
    color: 'text-emerald-400',
  },
  { label: 'HIPAA Ready', sublabel: 'BAA available', color: 'text-cyan-400' },
];

/* ─── Animated Background ───────────────────────────────── */

function EnterpriseHeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-40 left-1/3 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.06] blur-[140px]"
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 40, 0],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -top-20 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.05] blur-[120px]"
        animate={{
          scale: [1.1, 1, 1.1],
          x: [0, -30, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-60 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-violet-500/[0.03] blur-[120px]"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  );
}

/* ─── Hero ──────────────────────────────────────────────── */

function EnterpriseHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, -50]);

  return (
    <div ref={heroRef} className="relative overflow-hidden pb-8 pt-24 sm:pt-32">
      <EnterpriseHeroBackground />
      <motion.div
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative mx-auto max-w-4xl px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-medium text-emerald-400">
            <Building2 className="h-3.5 w-3.5" />
            Enterprise-Grade Compliance
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          FormaOS for{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Enterprise
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-2xl text-base text-slate-400 leading-relaxed sm:text-lg"
        >
          Enterprise-grade compliance governance — SAML 2.0 SSO, data residency,
          99.9% SLA, multi-entity management, and procurement artifacts. Built
          for regulated industries.
        </motion.p>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {trustSignals.map((signal) => (
            <div
              key={signal.label}
              className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5"
            >
              <ShieldCheck className={`h-3.5 w-3.5 ${signal.color}`} />
              <span className="text-xs font-medium text-white">
                {signal.label}
              </span>
              <span className="text-[9px] text-slate-500">
                {signal.sublabel}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Hero CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:shadow-emerald-500/30 hover:brightness-110"
          >
            Schedule Security Walkthrough
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/trust/packet"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-slate-300 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
          >
            Download Trust Packet
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─── Feature Card ──────────────────────────────────────── */

function FeatureCard({
  feature,
  index,
}: {
  feature: EnterpriseFeature;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm transition-all duration-500 hover:border-emerald-500/20 hover:bg-white/[0.04] hover:shadow-[0_0_30px_rgba(52,211,153,0.08)]"
    >
      {/* Top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative p-6">
        {/* Icon + Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/[0.08] ring-1 ring-emerald-500/20 transition-all duration-300 group-hover:bg-emerald-500/[0.12] group-hover:ring-emerald-500/30 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.1)]">
            <Icon className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-snug">
              {feature.title}
            </h3>
            {feature.highlights && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {feature.highlights.map((h) => (
                  <span
                    key={h}
                    className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium text-slate-400 ring-1 ring-white/[0.06]"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={isExpanded ? 'expanded' : 'collapsed'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`text-xs text-slate-400 leading-relaxed ${
                !isExpanded ? 'line-clamp-2' : ''
              }`}
            >
              {feature.description}
            </motion.p>
          </AnimatePresence>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-400 transition-colors">
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            />
            {isExpanded ? 'Less' : 'Read more'}
          </div>
        </button>
      </div>

      {/* Bottom glow */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-emerald-500/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </motion.div>
  );
}

/* ─── SLA Section ───────────────────────────────────────── */

function SLASection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-8 sm:p-10"
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 h-60 w-60 rounded-full bg-emerald-500/[0.04] blur-[80px] pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <Clock className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">SLA Commitments</h2>
            <p className="text-xs text-slate-500">Enterprise plan</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slaCommitments.map(({ label, value, icon: SlaIcon }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: index * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-3">
                <SlaIcon className="h-4 w-4 text-slate-500 transition-colors group-hover:text-emerald-400" />
                <span className="text-sm text-slate-400">{label}</span>
              </div>
              <span className="text-sm font-bold text-white ml-3">{value}</span>
            </motion.div>
          ))}
        </div>

        <p className="mt-5 text-xs text-slate-500 max-w-2xl">
          SLA terms are incorporated into your executed MSA/SOW. Contact us to
          initiate the enterprise agreement process.
        </p>
      </div>
    </motion.section>
  );
}

/* ─── Procurement Checklist ─────────────────────────────── */

function ProcurementChecklist() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/20"
        >
          <BadgeCheck className="h-5 w-5 text-cyan-400" />
        </motion.div>
        <div>
          <h2 className="text-lg font-bold text-white">
            Procurement Artifact Checklist
          </h2>
          <p className="text-xs text-slate-500">
            Available before your team asks
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-3xl">
        Every artifact your legal, security, and risk teams need is available
        before they ask. Enterprise customers receive countersigned copies of
        the DPA and NDA-gated artifacts within 2 business days of request.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {procurementChecklist.map(({ label, href, icon: ItemIcon }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.4,
              delay: index * 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Link
              href={href}
              className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(52,211,153,0.05)]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/[0.08] ring-1 ring-emerald-500/15 transition-all duration-300 group-hover:bg-emerald-500/[0.12]">
                <ItemIcon className="h-3.5 w-3.5 text-emerald-400/70" />
              </div>
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">
                {label}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-600 transition-all duration-300 group-hover:text-emerald-400 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ─── Testimonials ──────────────────────────────────────── */

function TestimonialSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-violet-400" />
        Enterprise Teams on FormaOS
      </h2>

      <div className="grid gap-6 sm:grid-cols-2">
        {testimonials.map((t, index) => (
          <motion.blockquote
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: index * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.04]"
          >
            {/* Quote accent */}
            <div
              className={`absolute top-0 left-0 h-full w-1 bg-gradient-to-b ${t.accentColor} rounded-l-2xl`}
            />

            {/* Large quote mark */}
            <div className="mb-4 text-4xl font-serif text-white/[0.06] leading-none select-none">
              &ldquo;
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6 relative">
              {t.quote}
            </p>

            <footer className="relative flex items-center gap-3 border-t border-white/[0.06] pt-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                {t.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{t.name}</div>
                <div className="text-xs text-slate-500 truncate">
                  {t.role} · {t.org}
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                {t.sector}
              </span>
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </motion.section>
  );
}

/* ─── Security Architecture Visual ──────────────────────── */

function SecurityArchitectureVisual() {
  const layers = [
    {
      label: 'Frontend Gating',
      description: 'Role-based routing & component guards',
      color: 'border-cyan-500/30 bg-cyan-500/[0.04]',
      textColor: 'text-cyan-400',
    },
    {
      label: 'API Guards',
      description: 'Authentication, RBAC, rate limiting',
      color: 'border-blue-500/30 bg-blue-500/[0.04]',
      textColor: 'text-blue-400',
    },
    {
      label: 'Database RLS',
      description: 'Row-level security on all tables',
      color: 'border-violet-500/30 bg-violet-500/[0.04]',
      textColor: 'text-violet-400',
    },
    {
      label: 'Environment Isolation',
      description: 'Dev/staging/prod separation',
      color: 'border-emerald-500/30 bg-emerald-500/[0.04]',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Service Role Restriction',
      description: 'Least-privilege service accounts',
      color: 'border-amber-500/30 bg-amber-500/[0.04]',
      textColor: 'text-amber-400',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-8 sm:p-10"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
          <Shield className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">
            5-Layer Security Architecture
          </h2>
          <p className="text-xs text-slate-500">
            Defence in depth — validated to production grade
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {layers.map((layer, index) => (
          <motion.div
            key={layer.label}
            initial={{ opacity: 0, x: -20, scaleX: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: index * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 hover:bg-white/[0.02] ${layer.color}`}
            style={{ marginLeft: index * 16 }}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-xs font-bold ${layer.textColor}`}
            >
              L{index + 1}
            </div>
            <div>
              <div className={`text-sm font-semibold ${layer.textColor}`}>
                {layer.label}
              </div>
              <div className="text-xs text-slate-500">{layer.description}</div>
            </div>
            <CheckCircle
              className={`ml-auto h-4 w-4 ${layer.textColor} opacity-50`}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ─── Enterprise CTA ────────────────────────────────────── */

function EnterpriseCTA() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-cyan-500/[0.04] to-violet-500/[0.06] p-10"
    >
      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-emerald-400/20"
          style={{
            top: `${10 + ((i * 12) % 80)}%`,
            left: `${5 + ((i * 13) % 90)}%`,
          }}
          animate={{
            y: [0, -25, 0],
            x: [0, 15, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 5 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.6,
          }}
        />
      ))}

      <div className="relative text-center">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20"
        >
          <CalendarDays className="h-6 w-6 text-emerald-400" />
        </motion.div>

        <h2 className="text-xl font-bold text-white mb-3">
          Start Your Enterprise Evaluation
        </h2>
        <p className="mx-auto max-w-lg text-sm text-slate-400 mb-8 leading-relaxed">
          Request a security review walkthrough, download the Trust Packet, or
          initiate procurement. Most enterprise security reviews complete within
          5–7 business days.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:shadow-emerald-500/30 hover:brightness-110"
          >
            Schedule Security Walkthrough
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/trust/packet"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-slate-300 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
          >
            Download Trust Packet
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`${appBase}/auth/signup?source=enterprise`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-slate-300 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
          >
            Start Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

/* ─── Footer Links ──────────────────────────────────────── */

function FooterLinks() {
  const links = [
    { label: '← Trust Center', href: '/trust' },
    { label: 'Security Review Packet →', href: '/security-review' },
    { label: 'Enterprise Pricing →', href: '/pricing' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mt-16 flex flex-wrap justify-center gap-6 text-sm"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-emerald-400/70 hover:text-emerald-400 transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </motion.div>
  );
}

/* ─── Main Component ────────────────────────────────────── */

export default function EnterprisePageContent() {
  return (
    <div className="relative min-h-screen bg-canvas-900">
      <EnterpriseHero />

      <div className="mx-auto max-w-5xl space-y-20 px-6 pb-24">
        {/* Enterprise features grid */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Enterprise-Grade Capabilities
              </h2>
              <p className="text-xs text-slate-500">
                Purpose-built for regulated industries
              </p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {enterpriseFeatures.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                feature={feature}
                index={index}
              />
            ))}
          </div>
        </motion.section>

        <SLASection />

        <SecurityArchitectureVisual />

        <ProcurementChecklist />

        <TestimonialSection />

        <EnterpriseCTA />

        <FooterLinks />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Shield,
  TrendingUp,
  Building2,
  Users,
  Brain,
  ArrowRight,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { useDeviceTier } from '@/lib/device-tier';

const industries = [
  {
    icon: Heart,
    href: '/ndis-providers',
    title: 'Disability and Aged Care',
    description:
      'Operationalize NDIS Practice Standards, Aged Care Quality Standards, safeguarding, reportable incident obligations, and NDIS Commission audit readiness, for providers where unannounced visits are real.',
    features: [
      'NDIS Practice Standards (all 8 modules)',
      'NDIS Commission Reportable Incidents',
      'NDIS Worker Screening + SIRS',
    ],
    color: 'pink',
    gradient: 'from-zinc-700/20 to-zinc-700/10',
    border: 'border-zinc-600/20',
    hoverBorder: 'hover:border-white/20',
    textColor: 'text-slate-300',
    dotColor: 'bg-slate-400',
    metrics: [
      { label: 'NDIS Practice Standards Modules', value: '8/8' },
      { label: 'Reportable Incident Response', value: '<24h' },
      { label: 'Audit Pack Export', value: '< 4 hrs' },
    ],
  },
  {
    icon: Brain,
    href: '/mental-health-compliance',
    title: 'Mental Health Services',
    description:
      'Operationalize the National Standards for Mental Health Services, restrictive-practice governance, reportable incidents, consumer rights, and worker screening, with continuous evidence, not pre-review scrambles.',
    features: [
      'National Standards for Mental Health Services',
      'Restrictive Practices Register & Reviews',
      'Reportable Incidents + Worker Screening',
    ],
    color: 'teal',
    gradient: 'from-zinc-700/20 to-zinc-700/10',
    border: 'border-zinc-600/20',
    hoverBorder: 'hover:border-white/20',
    textColor: 'text-slate-300',
    dotColor: 'bg-slate-400',
    metrics: [
      { label: 'NSMHS Standards Covered', value: '10/10' },
      { label: 'Restrictive Practice Reviews', value: 'Tracked' },
      { label: 'Review Pack Export', value: '1-click' },
    ],
  },
  {
    icon: Shield,
    href: '/healthcare-compliance',
    title: 'Healthcare and Allied Health',
    description:
      'Manage AHPRA practitioner registration, NSQHS Standards accreditation, clinical governance, credential expiry, Privacy Act compliance, and adverse event tracking, continuously, not just before audits.',
    features: [
      'AHPRA Registration & CPD Tracking',
      'NSQHS Standards (8/8 covered)',
      'RACGP Accreditation & Privacy Act NDB',
    ],
    color: 'blue',
    gradient: 'from-zinc-700/20 to-zinc-700/10',
    border: 'border-zinc-600/20',
    hoverBorder: 'hover:border-white/20',
    textColor: 'text-slate-300',
    dotColor: 'bg-slate-400',
    metrics: [
      { label: 'NSQHS Standards Covered', value: '8/8' },
      { label: 'Clinical Governance Tasks', value: '120+' },
      { label: 'Credential Renewal Lead Time', value: '90 days' },
    ],
  },
  {
    icon: TrendingUp,
    href: '/financial-services-compliance',
    title: 'Financial Services',
    description:
      'Track ASIC, APRA, AUSTRAC, and AML/CTF regulatory obligations, risk controls, internal audit programs, and board-level compliance reporting, with named ownership at every level.',
    features: [
      'ASIC, APRA & AUSTRAC Obligations',
      'AML/CTF Risk Control Mapping',
      'Internal Audit + Board Reporting',
    ],
    color: 'green',
    gradient: 'from-zinc-700/20 to-zinc-700/10',
    border: 'border-zinc-600/20',
    hoverBorder: 'hover:border-white/20',
    textColor: 'text-slate-300',
    dotColor: 'bg-slate-400',
    metrics: [
      { label: 'Regulatory Obligations Tracked', value: '250+' },
      { label: 'Risk Control Coverage', value: '98%' },
      { label: 'Audit Findings Resolved', value: '<48h' },
    ],
  },
  {
    icon: Building2,
    href: '/construction-compliance',
    title: 'Construction and Infrastructure',
    description:
      'Manage WHS Act safety systems, contractor compliance programs, incident reporting, SafeWork obligations, and multi-site regulatory audit readiness, with defensible evidence at every stage.',
    features: [
      'WHS Act & SafeWork Obligations',
      'Contractor License Verification',
      'Multi-site Incident Reporting',
    ],
    color: 'orange',
    gradient: 'from-zinc-700/20 to-zinc-700/10',
    border: 'border-zinc-600/20',
    hoverBorder: 'hover:border-white/20',
    textColor: 'text-slate-300',
    dotColor: 'bg-slate-400',
    metrics: [
      { label: 'Safety System Controls', value: '180+' },
      { label: 'Contractor Compliance Rate', value: '99.5%' },
      { label: 'Incident Report Time', value: '<1h' },
    ],
  },
  {
    icon: Users,
    href: '/childcare-compliance',
    title: 'Education and Childcare',
    description:
      'Operationalize ACECQA National Quality Framework compliance, staff credential governance, child safety policy adherence, and inspection readiness, with continuous evidence, not pre-visit scrambles.',
    features: [
      'ACECQA National Quality Framework (NQF)',
      'Child Safety Compliance Workflows',
      'Staff Credential & WWC Tracking',
    ],
    color: 'purple',
    gradient: 'from-zinc-700/20 to-zinc-700/10',
    border: 'border-zinc-600/20',
    hoverBorder: 'hover:border-white/20',
    textColor: 'text-slate-300',
    dotColor: 'bg-slate-400',
    metrics: [
      { label: 'NQF Quality Areas Covered', value: '7/7' },
      { label: 'Staff Compliance Rate', value: '97%' },
      { label: 'Inspection Readiness', value: 'Continuous' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  IndustryCard, flip card revealing per-industry metrics           */
/* ------------------------------------------------------------------ */
function IndustryCard({
  industry,
  reducedMotion,
}: {
  industry: (typeof industries)[number];
  reducedMotion: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const Icon = industry.icon;

  // Reduced-motion: static card without flip
  if (reducedMotion) {
    return (
      <div
        className={`group bg-white/[0.03] rounded-2xl border border-white/[0.08] ${industry.hoverBorder} p-6 transition-all duration-300`}
      >
        <CardFrontContent industry={industry} />
      </div>
    );
  }

  return (
    <motion.div
      onClick={() => setFlipped(!flipped)}
      whileHover={{ y: -4 }}
      style={{ perspective: 1000 }}
      className="cursor-pointer"
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative"
      >
        {/* ---------- FRONT FACE ---------- */}
        <div
          className={`group bg-white/[0.03] rounded-2xl border border-white/[0.08] ${industry.hoverBorder} p-6 transition-[border-color] duration-300 relative overflow-hidden`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardFrontContent industry={industry} />

          {/* Tap to flip indicator */}
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500/70 select-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
              <path d="M9 18l6-6-6-6" />
            </svg>
            Tap to flip
          </div>
        </div>

        {/* ---------- BACK FACE ---------- */}
        <div
          className={`absolute inset-0 bg-white/[0.03] rounded-2xl border border-white/[0.08] ${industry.hoverBorder} p-6 transition-[border-color] duration-300 overflow-hidden flex flex-col justify-between`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${industry.gradient} ${industry.border} flex items-center justify-center`}
              >
                <Icon className={`h-5 w-5 ${industry.textColor}`} />
              </div>
              <h4 className="font-bold text-white text-base">{industry.title}</h4>
            </div>

            {/* Metrics */}
            <div className="space-y-4">
              {industry.metrics.map((metric) => (
                <div key={metric.label}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs text-slate-400">{metric.label}</span>
                    <span className={`text-lg font-bold ${industry.textColor}`}>
                      {metric.value}
                    </span>
                  </div>
                  <div className="h-px w-full bg-gradient-to-r from-white/[0.06] via-white/[0.10] to-white/[0.06]" />
                </div>
              ))}
            </div>
          </div>

          {/* Learn more link */}
          <Link
            href={industry.href}
            onClick={(e) => e.stopPropagation()}
            className={`mt-4 inline-flex items-center gap-1.5 text-xs font-medium ${industry.textColor} hover:underline`}
          >
            Learn more <ArrowRight className="h-3 w-3" />
          </Link>

          {/* Tap to flip back indicator */}
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500/70 select-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 rotate-180">
              <path d="M9 18l6-6-6-6" />
            </svg>
            Tap to flip back
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  CardFrontContent, extracted so reduced-motion path can reuse it  */
/* ------------------------------------------------------------------ */
function CardFrontContent({
  industry,
}: {
  industry: (typeof industries)[number];
}) {
  const Icon = industry.icon;
  return (
    <>
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${industry.gradient} ${industry.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className={`h-6 w-6 ${industry.textColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${industry.dotColor}`} />
            <h4
              className={`font-bold text-lg mb-1 text-white group-hover:${industry.textColor} transition-colors duration-300`}
            >
              {industry.title}
            </h4>
          </div>
        </div>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed mb-4">
        {industry.description}
      </p>

      <div className="space-y-2">
        {industry.features.map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-2 text-xs text-slate-500"
          >
            <div
              className={`w-1.5 h-1.5 ${industry.dotColor} rounded-full`}
            />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  IndustryVerticals, main section                                  */
/* ------------------------------------------------------------------ */
export function IndustryVerticals() {
  const prefersReducedMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const reducedMotion =
    Boolean(prefersReducedMotion) ||
    tierConfig.tier !== 'high' ||
    tierConfig.isTouch;

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="depthScale" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="scaleUp" range={[0.02, 0.3]}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Example Verticals
              </p>
            </ScrollReveal>

            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-6 text-white">
              Compliance Infrastructure
              <span className="text-foreground">
                {' '}
                Across Industries
              </span>
            </h2>

            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              Pre-built frameworks tailored to specific regulatory environments
            </p>
          </div>
        </ScrollReveal>

        {/* Industries Grid */}
        <SectionChoreography pattern="stagger-wave" stagger={0.05} className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {industries.map((industry) => (
            <IndustryCard
              key={industry.title}
              industry={industry}
              reducedMotion={reducedMotion}
            />
          ))}
        </SectionChoreography>
      </div>
    </section>
  );
}

export default IndustryVerticals;

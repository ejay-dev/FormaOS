'use client';

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
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const industries = [
  {
    icon: Heart,
    href: '/ndis-providers',
    title: 'Disability and Aged Care',
    description:
      'Operationalise NDIS Practice Standards, Aged Care Quality Standards, safeguarding, reportable incident obligations, and NDIS Commission audit readiness, for providers where unannounced visits are real.',
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
  },
  {
    icon: Brain,
    href: '/mental-health-compliance',
    title: 'Mental Health Services',
    description:
      'Operationalise the National Standards for Mental Health Services, restrictive-practice governance, reportable incidents, consumer rights, and worker screening, with continuous evidence, not pre-review scrambles.',
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
  },
  {
    icon: Building2,
    href: '/construction-compliance',
    title: 'Construction and Infrastructure',
    description:
      'Manage WHS Act safety systems, contractor compliance programs, incident reporting, SafeWork obligations, and multi-site regulatory audit readiness, with defensible evidence at every stage.',
    features: [
      'WHS Act & SafeWork Obligations',
      'Contractor Licence Verification',
      'Multi-site Incident Reporting',
    ],
    color: 'orange',
    gradient: 'from-zinc-700/20 to-zinc-700/10',
    border: 'border-zinc-600/20',
    hoverBorder: 'hover:border-white/20',
    textColor: 'text-slate-300',
    dotColor: 'bg-slate-400',
  },
  {
    icon: Users,
    href: '/childcare-compliance',
    title: 'Education and Childcare',
    description:
      'Operationalise ACECQA National Quality Framework compliance, staff credential governance, child safety policy adherence, and inspection readiness, with continuous evidence, not pre-visit scrambles.',
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
  },
];

/* ------------------------------------------------------------------ */
/*  IndustryCard, the whole card routes to the industry page          */
/* ------------------------------------------------------------------ */
function IndustryCard({
  industry,
}: {
  industry: (typeof industries)[number];
}) {
  const Icon = industry.icon;

  return (
    <Link
      href={industry.href}
      className={`group block h-full bg-white/[0.03] rounded-2xl border border-white/[0.08] ${industry.hoverBorder} p-6 transition-colors duration-300`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${industry.gradient} ${industry.border} flex items-center justify-center`}
        >
          <Icon className={`h-6 w-6 ${industry.textColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${industry.dotColor}`} />
            <h4 className="font-bold text-lg mb-1 text-white">
              {industry.title}
            </h4>
            <ArrowRight
              className="ml-auto h-4 w-4 flex-shrink-0 text-slate-500 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
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
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  IndustryVerticals, main section                                  */
/* ------------------------------------------------------------------ */
export function IndustryVerticals() {
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
            <IndustryCard key={industry.title} industry={industry} />
          ))}
        </SectionChoreography>
      </div>
    </section>
  );
}

export default IndustryVerticals;

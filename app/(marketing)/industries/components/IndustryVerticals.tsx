'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Heart,
  Shield,
  TrendingUp,
  Building2,
  Users,
} from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { useDeviceTier } from '@/lib/device-tier';

/** Inline pulse color values for each industry (Tailwind can't animate these dynamically) */
const pulseColors: Record<string, string> = {
  pink: 'rgb(244,114,182)',    // rose/pink-400
  blue: 'rgb(96,165,250)',     // blue-400
  green: 'rgb(52,211,153)',    // emerald-400
  orange: 'rgb(251,146,60)',   // amber/orange-400
  purple: 'rgb(192,132,252)',  // purple-400
};

const industries = [
  {
    icon: Heart,
    title: 'Disability and Aged Care',
    description:
      'Operationalize NDIS Practice Standards, Aged Care Quality Standards, safeguarding, reportable incident obligations, and NDIS Commission audit readiness — for providers where unannounced visits are real.',
    features: [
      'NDIS Practice Standards (all 8 modules)',
      'NDIS Commission Reportable Incidents',
      'NDIS Worker Screening + SIRS',
    ],
    color: 'pink',
    gradient: 'from-pink-500/20 to-pink-500/10',
    border: 'border-pink-500/20',
    hoverBorder: 'hover:border-pink-400/40',
    textColor: 'text-pink-400',
    dotColor: 'bg-pink-400',
    metrics: [
      { label: 'NDIS Practice Standards Modules', value: '8/8' },
      { label: 'Reportable Incident Response', value: '<24h' },
      { label: 'Audit Pack Export', value: '< 4 hrs' },
    ],
  },
  {
    icon: Shield,
    title: 'Healthcare and Allied Health',
    description:
      'Manage AHPRA practitioner registration, NSQHS Standards accreditation, clinical governance, credential expiry, Privacy Act compliance, and adverse event tracking — continuously, not just before audits.',
    features: [
      'AHPRA Registration & CPD Tracking',
      'NSQHS Standards (8/8 covered)',
      'RACGP Accreditation & Privacy Act NDB',
    ],
    color: 'blue',
    gradient: 'from-blue-500/20 to-blue-500/10',
    border: 'border-blue-500/20',
    hoverBorder: 'hover:border-blue-400/40',
    textColor: 'text-blue-400',
    dotColor: 'bg-blue-400',
    metrics: [
      { label: 'NSQHS Standards Covered', value: '8/8' },
      { label: 'Clinical Governance Tasks', value: '120+' },
      { label: 'Credential Renewal Lead Time', value: '90 days' },
    ],
  },
  {
    icon: TrendingUp,
    title: 'Financial Services',
    description:
      'Track ASIC, APRA, AUSTRAC, and AML/CTF regulatory obligations, risk controls, internal audit programs, and board-level compliance reporting — with named ownership at every level.',
    features: [
      'ASIC, APRA & AUSTRAC Obligations',
      'AML/CTF Risk Control Mapping',
      'Internal Audit + Board Reporting',
    ],
    color: 'green',
    gradient: 'from-green-500/20 to-green-500/10',
    border: 'border-green-500/20',
    hoverBorder: 'hover:border-green-400/40',
    textColor: 'text-green-400',
    dotColor: 'bg-green-400',
    metrics: [
      { label: 'Regulatory Obligations Tracked', value: '250+' },
      { label: 'Risk Control Coverage', value: '98%' },
      { label: 'Audit Findings Resolved', value: '<48h' },
    ],
  },
  {
    icon: Building2,
    title: 'Construction and Infrastructure',
    description:
      'Manage WHS Act safety systems, contractor compliance programs, incident reporting, SafeWork obligations, and multi-site regulatory audit readiness — with defensible evidence at every stage.',
    features: [
      'WHS Act & SafeWork Obligations',
      'Contractor License Verification',
      'Multi-site Incident Reporting',
    ],
    color: 'orange',
    gradient: 'from-orange-500/20 to-orange-500/10',
    border: 'border-orange-500/20',
    hoverBorder: 'hover:border-orange-400/40',
    textColor: 'text-orange-400',
    dotColor: 'bg-orange-400',
    metrics: [
      { label: 'Safety System Controls', value: '180+' },
      { label: 'Contractor Compliance Rate', value: '99.5%' },
      { label: 'Incident Report Time', value: '<1h' },
    ],
  },
  {
    icon: Users,
    title: 'Education and Childcare',
    description:
      'Operationalize ACECQA National Quality Framework compliance, staff credential governance, child safety policy adherence, and inspection readiness — with continuous evidence, not pre-visit scrambles.',
    features: [
      'ACECQA National Quality Framework (NQF)',
      'Child Safety Compliance Workflows',
      'Staff Credential & WWC Tracking',
    ],
    color: 'purple',
    gradient: 'from-purple-500/20 to-purple-500/10',
    border: 'border-purple-500/20',
    hoverBorder: 'hover:border-purple-400/40',
    textColor: 'text-purple-400',
    dotColor: 'bg-purple-400',
    metrics: [
      { label: 'NQF Quality Areas Covered', value: '7/7' },
      { label: 'Staff Compliance Rate', value: '97%' },
      { label: 'Inspection Readiness', value: 'Continuous' },
    ],
  },
];

/** RGB glow values keyed by industry color name */
const glowRGB: Record<string, string> = {
  pink: '244,114,182',
  blue: '96,165,250',
  green: '52,211,153',
  orange: '251,146,60',
  purple: '192,132,252',
};

/* ------------------------------------------------------------------ */
/*  IndustryCard – flip card with cursor-tracking glow                */
/* ------------------------------------------------------------------ */
function IndustryCard({
  industry,
  index,
  reducedMotion,
}: {
  industry: (typeof industries)[number];
  index: number;
  reducedMotion: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = industry.icon;

  // --- cursor-tracking glow (from GlassDepthCard pattern) ---
  const localX = useMotionValue(0.5);
  const localY = useMotionValue(0.5);
  const smoothX = useSpring(localX, { stiffness: 200, damping: 25 });
  const smoothY = useSpring(localY, { stiffness: 200, damping: 25 });

  const rgb = glowRGB[industry.color] ?? '34,211,238';
  const lightGradient = useTransform(
    [smoothX, smoothY] as MotionValue<number>[],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(${rgb},0.14) 0%, transparent 60%)`,
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      localX.set((e.clientX - rect.left) / rect.width);
      localY.set((e.clientY - rect.top) / rect.height);
    },
    [reducedMotion, localX, localY],
  );

  const handleMouseLeave = useCallback(() => {
    localX.set(0.5);
    localY.set(0.5);
  }, [localX, localY]);

  // Reduced-motion: static card without flip or glow
  if (reducedMotion) {
    return (
      <div
        className={`group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/[0.08] ${industry.hoverBorder} p-6 transition-all duration-300`}
      >
        <CardFrontContent industry={industry} index={index} reducedMotion={reducedMotion} />
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      onClick={() => setFlipped(!flipped)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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
          className={`group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/[0.08] ${industry.hoverBorder} p-6 transition-[border-color] duration-300 relative overflow-hidden`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardFrontContent industry={industry} index={index} reducedMotion={reducedMotion} />

          {/* Tap to flip indicator */}
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-500/70 select-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
              <path d="M9 18l6-6-6-6" />
            </svg>
            Tap to flip
          </div>

          {/* Cursor-tracking light sweep */}
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-[inherit] z-10"
            style={{ background: lightGradient } as Record<string, unknown>}
          />
        </div>

        {/* ---------- BACK FACE ---------- */}
        <div
          className={`absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/[0.08] ${industry.hoverBorder} p-6 transition-[border-color] duration-300 overflow-hidden flex flex-col justify-between`}
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
                    <span className="text-xs text-gray-400">{metric.label}</span>
                    <span className={`text-lg font-bold ${industry.textColor}`}>
                      {metric.value}
                    </span>
                  </div>
                  <div className="h-px w-full bg-gradient-to-r from-white/[0.06] via-white/[0.10] to-white/[0.06]" />
                </div>
              ))}
            </div>
          </div>

          {/* Tap to flip back indicator */}
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-500/70 select-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 rotate-180">
              <path d="M9 18l6-6-6-6" />
            </svg>
            Tap to flip back
          </div>

          {/* Cursor-tracking light sweep (back face too) */}
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-[inherit] z-10"
            style={{ background: lightGradient } as Record<string, unknown>}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  CardFrontContent – extracted so reduced-motion path can reuse it  */
/* ------------------------------------------------------------------ */
function CardFrontContent({
  industry,
  index,
  reducedMotion,
}: {
  industry: (typeof industries)[number];
  index: number;
  reducedMotion: boolean;
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
            {/* Industry-specific animated pulse dot */}
            <motion.div
              className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: pulseColors[industry.color] ?? 'rgb(34,211,238)' }}
              animate={
                reducedMotion
                  ? undefined
                  : {
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                      boxShadow: [
                        `0 0 0 0 ${pulseColors[industry.color] ?? 'rgb(34,211,238)'}40`,
                        `0 0 8px 3px ${pulseColors[industry.color] ?? 'rgb(34,211,238)'}30`,
                        `0 0 0 0 ${pulseColors[industry.color] ?? 'rgb(34,211,238)'}40`,
                      ],
                    }
              }
              transition={{
                duration: 2.5,
                delay: index * 0.4,
                repeat: reducedMotion ? 0 : Infinity,
                ease: 'easeInOut',
              }}
            />
            <h4
              className={`font-bold text-lg mb-1 text-white group-hover:${industry.textColor} transition-colors duration-300`}
            >
              {industry.title}
            </h4>
          </div>
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
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  IndustryVerticals – main section                                  */
/* ------------------------------------------------------------------ */
export function IndustryVerticals() {
  const prefersReducedMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const reducedMotion =
    Boolean(prefersReducedMotion) ||
    tierConfig.tier !== 'high' ||
    tierConfig.isTouch;
  const allowAmbientMotion = !reducedMotion;

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Ambient Background */}
      <motion.div
        className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-l from-blue-500/10 to-transparent rounded-full blur-3xl"
        animate={allowAmbientMotion ? { opacity: [0.3, 0.5, 0.3] } : undefined}
        transition={allowAmbientMotion ? { duration: 10, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
      <motion.div
        className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/10 to-transparent rounded-full blur-3xl"
        animate={allowAmbientMotion ? { opacity: [0.2, 0.4, 0.2] } : undefined}
        transition={
          allowAmbientMotion
            ? {
                duration: 12,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 3,
              }
            : undefined
        }
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="depthScale" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="scaleUp" range={[0.02, 0.3]}>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Example Verticals
              </div>
            </ScrollReveal>

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
          </div>
        </ScrollReveal>

        {/* Industries Grid */}
        <SectionChoreography pattern="stagger-wave" stagger={0.05} className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {industries.map((industry, index) => (
            <IndustryCard
              key={industry.title}
              industry={industry}
              index={index}
              reducedMotion={reducedMotion}
            />
          ))}
        </SectionChoreography>
      </div>
    </section>
  );
}

export default IndustryVerticals;

'use client';

import {
  Heart,
  Shield,
  TrendingUp,
  Building2,
  Users,
  GraduationCap,
  Clock,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { isCareLaunchMode } from '@/lib/vertical-launch';

/** Inline pulse color values for each industry (Tailwind can't animate these dynamically) */
const pulseColors: Record<string, string> = {
  pink: 'rgb(244,114,182)',    // rose/pink-400
  blue: 'rgb(96,165,250)',     // blue-400
  green: 'rgb(52,211,153)',    // emerald-400
  orange: 'rgb(251,146,60)',   // amber/orange-400
  purple: 'rgb(192,132,252)',  // purple-400
  amber: 'rgb(251,191,36)',    // amber-400
};

const allIndustries = [
  {
    icon: Users,
    title: 'NDIS Providers',
    description:
      'Operationalize NDIS Practice Standards, safeguarding, incident management, and Quality & Safeguards Commission audits.',
    features: [
      'Practice Standards 1-8',
      'Incident Management',
      'Worker Screening',
    ],
    color: 'blue',
    gradient: 'from-blue-500/20 to-blue-500/10',
    border: 'border-blue-500/20',
    hoverBorder: 'hover:border-blue-400/40',
    textColor: 'text-blue-400',
    dotColor: 'bg-blue-400',
    careVertical: true,
  },
  {
    icon: Heart,
    title: 'Aged Care',
    description:
      'Manage Aged Care Quality Standards, SIRS mandatory reporting, resident care plans, and Commission audits.',
    features: ['Quality Standards', 'SIRS Reporting', 'Clinical Governance'],
    color: 'orange',
    gradient: 'from-orange-500/20 to-orange-500/10',
    border: 'border-orange-500/20',
    hoverBorder: 'hover:border-orange-400/40',
    textColor: 'text-orange-400',
    dotColor: 'bg-orange-400',
    careVertical: true,
  },
  {
    icon: Shield,
    title: 'Healthcare & Allied Health',
    description:
      'Manage accreditation, clinical governance, compliance workflows, and evidence tracking.',
    features: ['NSQHS Standards', 'Clinical Governance', 'Safety & Risk'],
    color: 'pink',
    gradient: 'from-pink-500/20 to-pink-500/10',
    border: 'border-pink-500/20',
    hoverBorder: 'hover:border-pink-400/40',
    textColor: 'text-pink-400',
    dotColor: 'bg-pink-400',
    careVertical: true,
  },
  {
    icon: GraduationCap,
    title: 'Child Care & Early Learning',
    description:
      'Control NQF compliance, educator credentials, child protection reporting, and Assessment & Rating readiness.',
    features: ['NQF Quality Areas', 'WWCC Tracking', 'Child Protection'],
    color: 'amber',
    gradient: 'from-amber-500/20 to-amber-500/10',
    border: 'border-amber-500/20',
    hoverBorder: 'hover:border-amber-400/40',
    textColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
    careVertical: true,
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
    careVertical: false,
  },
  {
    icon: Building2,
    title: 'Construction and Infrastructure',
    description:
      'Manage safety systems, contractor compliance, incident reporting, and regulatory audits.',
    features: ['Safety Systems', 'Contractor Compliance', 'Incident Reporting'],
    color: 'purple',
    gradient: 'from-purple-500/20 to-purple-500/10',
    border: 'border-purple-500/20',
    hoverBorder: 'hover:border-purple-400/40',
    textColor: 'text-purple-400',
    dotColor: 'bg-purple-400',
    careVertical: false,
  },
];

export function IndustryVerticals() {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? false;
  const careLaunchMode = isCareLaunchMode();

  const visibleIndustries = careLaunchMode
    ? allIndustries.filter((i) => i.careVertical)
    : allIndustries;

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
        <ScrollReveal variant="fadeUp" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="scaleUp" range={[0.02, 0.3]}>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                {careLaunchMode ? 'Care Provider Verticals' : 'Example Verticals'}
              </div>
            </ScrollReveal>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              {careLaunchMode ? (
                <>
                  Built for
                  <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-500 bg-clip-text text-transparent">
                    {' '}Care Providers
                  </span>
                </>
              ) : (
                <>
                  Compliance Infrastructure
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-500 bg-clip-text text-transparent">
                    {' '}
                    Across Industries
                  </span>
                </>
              )}
            </h2>

            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              {careLaunchMode
                ? 'Pre-built frameworks tailored to NDIS, Aged Care, Healthcare, and Child Care regulatory environments'
                : 'Pre-built frameworks tailored to specific regulatory environments'}
            </p>
          </div>
        </ScrollReveal>

        {/* Industries Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleIndustries.map((industry, index) => {
            const Icon = industry.icon;
            return (
              <ScrollReveal key={industry.title} variant={index % 2 === 0 ? 'fadeLeft' : 'fadeRight'} range={[index * 0.04, 0.3 + index * 0.04]}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className={`group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/[0.08] ${industry.hoverBorder} p-6 transition-all duration-300`}
                >
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
                            repeat: Infinity,
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
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* "More industries coming" — shown only in care-launch mode */}
        {careLaunchMode && (
          <ScrollReveal variant="fadeUp" range={[0.1, 0.4]} className="mt-12">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-800/60 border border-white/10 text-gray-400 text-xs font-medium mb-4">
                <Clock className="w-3.5 h-3.5" />
                More industries coming
              </div>
              <p className="text-gray-500 text-sm max-w-lg mx-auto">
                FormaOS supports additional regulated industries. During our care provider launch we&apos;re focusing on the verticals above. Additional sectors will be promoted as we expand.
              </p>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}

export default IndustryVerticals;

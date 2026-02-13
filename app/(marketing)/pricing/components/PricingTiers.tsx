'use client';

import Link from 'next/link';
import { ArrowRight, Check, Target } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { brand } from '@/config/brand';
import { easing, duration } from '@/config/motion';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

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
      'Google OAuth and MFA included; enterprise SSO (SAML) on roadmap',
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

export function PricingTiers() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0f1c]">
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.2, 1],
                  opacity: [0.15, 0.25, 0.15],
                  x: [0, 50, 0],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 15,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.3, 1],
                  opacity: [0.1, 0.2, 0.1],
                  x: [0, -30, 0],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 18,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 3,
                }
          }
          className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-tl from-purple-500/20 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower, ease: easing.signature }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold uppercase tracking-wider mb-6"
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
              transition={{ duration: duration.slow, delay: idx * 0.15, ease: easing.signature }}
              whileHover={{
                y: tier.featured ? -16 : -8,
                transition: { duration: duration.fast, ease: easing.smooth },
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
                    transition={{ delay: 0.4, duration: duration.normal, ease: easing.signature }}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full text-sm font-bold text-white shadow-lg shadow-emerald-500/30"
                  >
                    Most Popular
                  </motion.div>
                </div>
              )}

              {/* Card */}
              <div
                className={`relative backdrop-blur-xl bg-gradient-to-br ${tier.gradientFrom} ${tier.gradientTo} rounded-3xl p-8 border-2 ${tier.featured ? tier.borderColor : 'border-white/[0.08]'} shadow-2xl transition-all duration-500 group-hover:shadow-3xl ${tier.featured ? 'group-hover:shadow-emerald-500/20' : ''} group-hover:border-opacity-100 overflow-hidden h-full`}
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
                      transition={{ delay: 0.3 + i * 0.05, duration: duration.normal, ease: easing.signature }}
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
                <div className="mb-8 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
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

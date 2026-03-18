'use client';

import {
  FileCheck,
  Shield,
  Users,
  Building2,
  Heart,
  TrendingUp,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { brand } from '@/config/brand';
import { useDeviceTier } from '@/lib/device-tier';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

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

export function NDISDeepDive() {
  const shouldReduceMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const allowAmbientMotion =
    !shouldReduceMotion && tierConfig.tier === 'high' && !tierConfig.isTouch;

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Ambient Background */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5"
        animate={allowAmbientMotion ? { opacity: [0.5, 0.8, 0.5] } : undefined}
        transition={
          allowAmbientMotion
            ? { duration: 10, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="blurIn" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="scaleUp" range={[0.02, 0.3]}>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-medium mb-6"
              >
                <Heart className="w-4 h-4" />
                NDIS Service Providers
              </div>
            </ScrollReveal>

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
          </div>
        </ScrollReveal>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {ndisFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <ScrollReveal key={feature.title} variant="slideUp" range={[index * 0.04, 0.3 + index * 0.04]}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/[0.08] hover:border-pink-500/30 p-6 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-pink-400" />
                  </div>
                  <h4 className="font-bold text-white mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* NDIS CTA Card */}
        <ScrollReveal variant="slideUp" range={[0.04, 0.38]}>
          <div
            className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/[0.08] overflow-hidden"
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
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all"
                  >
                    Book NDIS Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.a>
                  <motion.a
                    href={`${appBase}/auth/signup`}
                    whileHover={{ scale: 1.03 }}
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
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default NDISDeepDive;

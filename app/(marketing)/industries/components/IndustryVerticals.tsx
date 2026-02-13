'use client';

import {
  Heart,
  Shield,
  TrendingUp,
  Building2,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/motion';
import { duration, easing, stagger } from '@/config/motion';

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

export function IndustryVerticals() {
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
        <Reveal>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: duration.slower, ease: ([...easing.signature] as [number, number, number, number]) }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: duration.normal, ease: ([...easing.signature] as [number, number, number, number]) }}
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
        </Reveal>

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
                transition={{ duration: duration.normal, delay: index * stagger.normal, ease: ([...easing.signature] as [number, number, number, number]) }}
                whileHover={{ y: -6, scale: 1.02 }}
                className={`group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/[0.08] ${industry.hoverBorder} p-6 transition-all duration-300`}
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

export default IndustryVerticals;

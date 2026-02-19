'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { duration } from '@/config/motion';
import { useState } from 'react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Heart,
  Users,
  TrendingUp,
  GraduationCap,
  Building2,
  Shield,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

interface IndustrySolution {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color: string;
  accentColor: string;
  problemStatement: string;
  solutionMapping: {
    title: string;
    features: string[];
  };
  capabilities: {
    icon: LucideIcon;
    title: string;
    description: string;
  }[];
  cta: {
    text: string;
    href: string;
  };
}

const industrySolutions: IndustrySolution[] = [
  {
    icon: Heart,
    title: 'Healthcare',
    subtitle: 'HIPAA, RACGP, AHPRA Compliance',
    color: 'from-rose-400 to-pink-600',
    accentColor: 'rose',
    problemStatement:
      'Healthcare providers face mounting pressure from patient safety requirements, clinical governance obligations, and audit cycles that demand instant evidence retrieval. One compliance gap can mean regulatory sanctions, accreditation loss, or worse: patient harm.',
    solutionMapping: {
      title: 'FormaOS Healthcare Module',
      features: [
        'Patient records and progress notes with role-based access',
        'Clinical incident reporting (advanced routing available by request)',
        'Staff credential tracking with review reminders',
        'Audit-ready evidence bundles and exports',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Clinical Governance',
        description:
          'Audit trails for compliance actions, evidence updates, and policy acknowledgments',
      },
      {
        icon: FileText,
        title: 'Incident Management (Early Access)',
        description:
          'Category-based incident capture and investigation workflows (regulator-specific flows by request)',
      },
      {
        icon: CheckCircle,
        title: 'Accreditation Ready',
        description:
          'Aligned to RACGP, AHPRA, and NSQHS standards with configurable templates',
      },
    ],
    cta: {
      text: 'Explore Healthcare Solution',
      href: '/use-cases/healthcare',
    },
  },
  {
    icon: Users,
    title: 'NDIS Providers',
    subtitle: 'NDIS Practice Standards, Quality & Safeguards',
    color: 'from-cyan-400 to-blue-600',
    accentColor: 'cyan',
    problemStatement:
      'NDIS providers operate under intense scrutiny from the Quality and Safeguards Commission. Participant safety incidents, worker screening lapses, and missing evidence during audits can result in registration revocation and service shutdown.',
    solutionMapping: {
      title: 'FormaOS NDIS Module',
      features: [
        'Participant records and support plans (configurable)',
        'Incident reporting workflows (advanced regulator flows by request)',
        'Credential tracking and screening records',
        'Self-assessment checklists aligned to NDIS Practice Standards (by request)',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Safeguarding System',
        description:
          'Safeguarding registers and participant consent tracking (early access)',
      },
      {
        icon: FileText,
        title: 'Incident Reporting',
        description:
          'Incident reporting workflows with configurable timelines (early access)',
      },
      {
        icon: CheckCircle,
        title: 'Audit Evidence',
        description: 'Evidence bundles and exports to support NDIS audits',
      },
    ],
    cta: {
      text: 'Explore NDIS Solution',
      href: '/use-cases/ndis',
    },
  },
  {
    icon: TrendingUp,
    title: 'Financial Services',
    subtitle: 'Multi-framework compliance alignment',
    color: 'from-emerald-400 to-green-600',
    accentColor: 'emerald',
    problemStatement:
      'Financial institutions face relentless compliance demands from multiple frameworks simultaneously. Manual evidence collection for audits consumes significant time, while security incidents require immediate documentation and response.',
    solutionMapping: {
      title: 'FormaOS Financial Module',
      features: [
        'Multi-framework compliance packs (SOC 2, ISO, PCI) with configurable mapping',
        'Evidence collection workflows and control tracking',
        'Vendor risk tracking (available by request)',
        'Incident response documentation workflows',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Control Monitoring',
        description:
          'Control status dashboards with gap visibility and trend insights',
      },
      {
        icon: FileText,
        title: 'Evidence Automation',
        description:
          'Evidence collection workflows and audit-ready export packs',
      },
      {
        icon: CheckCircle,
        title: 'Audit Acceleration',
        description: 'Framework packs aligned to common trust service criteria',
      },
    ],
    cta: {
      text: 'Explore Financial Solution',
      href: '/use-cases/financial-services',
    },
  },
  {
    icon: GraduationCap,
    title: 'Education & Accreditation',
    subtitle: 'TEQSA, ASQA, RTO Standards',
    color: 'from-purple-400 to-violet-600',
    accentColor: 'purple',
    problemStatement:
      'Education providers preparing for TEQSA registration or ASQA audits spend months gathering evidence across departments. Missing documentation, outdated policies, or incomplete staff records can delay registration or trigger compliance conditions.',
    solutionMapping: {
      title: 'FormaOS Education Module',
      features: [
        'Academic governance frameworks with approval workflows',
        'Course and unit compliance mapping',
        'Trainer and assessor credential management',
        'Student complaint and appeal tracking',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Academic Governance',
        description:
          'Policy lifecycle management with academic board approvals',
      },
      {
        icon: FileText,
        title: 'RTO Compliance',
        description:
          'Training package mapping, validation records, and learner file audits',
      },
      {
        icon: CheckCircle,
        title: 'Registration Ready',
        description:
          'Evidence organized by TEQSA/ASQA standard for instant retrieval',
      },
    ],
    cta: {
      text: 'Explore Education Solution',
      href: '/use-cases/education',
    },
  },
  {
    icon: Building2,
    title: 'Government & Public Sector',
    subtitle: 'FOI, ISM, PSPF Compliance',
    color: 'from-amber-400 to-orange-600',
    accentColor: 'amber',
    problemStatement:
      'Government agencies face unique accountability requirements: Freedom of Information requests, ministerial briefings, and public sector performance reporting. Every decision must be documented, defensible, and retrievable on demand.',
    solutionMapping: {
      title: 'FormaOS Government Module',
      features: [
        'Decision registers with approval chains and rationale capture',
        'FOI request management and document tracking',
        'Service delivery performance dashboards',
        'Cross-agency collaboration with access controls',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Accountability',
        description:
          'Complete decision audit trails with ministerial-ready documentation',
      },
      {
        icon: FileText,
        title: 'Information Management',
        description:
          'Records classification, retention scheduling, and disposal tracking',
      },
      {
        icon: CheckCircle,
        title: 'Performance Reporting',
        description:
          'Automated KPI dashboards and public accountability statements',
      },
    ],
    cta: {
      text: 'Explore Government Solution',
      href: '/use-cases/government',
    },
  },
];

export function Industries() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section className="mk-section relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/5 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <ScrollReveal variant="blurIn" range={[0, 0.3]} className="text-center mb-16 lg:mb-20">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Industry Solutions
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Built for{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent">
              High-Accountability
            </span>
            <br />
            Industries
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            When compliance failure means regulatory action, accreditation loss,
            or operational shutdown, FormaOS delivers the evidence
            infrastructure your industry demands.
          </p>
        </ScrollReveal>

        <div className="space-y-4">
          {industrySolutions.map((solution, index) => {
            const Icon = solution.icon;
            const isExpanded = expandedIndex === index;

            return (
              <ScrollReveal
                key={solution.title}
                variant="fadeUp"
                range={[index * 0.04, 0.3 + index * 0.04]}
                className="group"
              >
                <motion.button
                  onClick={() => toggleExpand(index)}
                  className={`w-full p-6 lg:p-8 rounded-2xl border text-left transition-all duration-300 ${
                    isExpanded
                      ? 'bg-gradient-to-br from-gray-900/90 to-gray-950/90 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                      : 'bg-gradient-to-br from-gray-900/60 to-gray-950/60 border-white/10 hover:border-cyan-500/30'
                  }`}
                  style={{
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 lg:gap-6">
                      <div
                        className={`p-3 lg:p-4 rounded-xl bg-gradient-to-br ${solution.color} shadow-lg transition-transform duration-300 ${
                          isExpanded ? 'scale-110' : 'group-hover:scale-105'
                        }`}
                      >
                        <Icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">
                          {solution.title}
                        </h3>
                        <p className="text-sm lg:text-base text-gray-400">
                          {solution.subtitle}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-cyan-400"
                    >
                      <ChevronDown className="w-6 h-6" />
                    </motion.div>
                  </div>
                </motion.button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: duration.normal, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 lg:p-10 mt-2 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-white/5">
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-10">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-rose-400 text-sm font-medium">
                              <AlertCircle className="w-4 h-4" />
                              The Challenge
                            </div>
                            <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
                              {solution.problemStatement}
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              {solution.solutionMapping.title}
                            </div>
                            <ul className="space-y-3">
                              {solution.solutionMapping.features.map(
                                (feature, i) => (
                                  <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="flex items-start gap-3"
                                  >
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${solution.color} mt-2 flex-shrink-0`}
                                    />
                                    <span className="text-gray-200 text-sm lg:text-base">
                                      {feature}
                                    </span>
                                  </motion.li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 lg:gap-6 mb-8">
                          {solution.capabilities.map((capability, i) => {
                            const CapIcon = capability.icon;
                            return (
                              <motion.div
                                key={capability.title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="p-5 lg:p-6 rounded-xl bg-gray-800/40 border border-white/5 hover:border-cyan-500/20 transition-colors"
                              >
                                <div
                                  className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${solution.color} bg-opacity-20 mb-3`}
                                >
                                  <CapIcon className="w-5 h-5 text-white" />
                                </div>
                                <h4 className="text-white font-semibold mb-2">
                                  {capability.title}
                                </h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                  {capability.description}
                                </p>
                              </motion.div>
                            );
                          })}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
                          <p className="text-gray-400 text-sm">
                            See how FormaOS transforms{' '}
                            {solution.title.toLowerCase()} compliance
                          </p>
                          <Link
                            href={solution.cta.href}
                            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${solution.color} text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5`}
                          >
                            {solution.cta.text}
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal variant="slideUp" range={[0.05, 0.35]} className="mt-16 text-center">
          <p className="text-gray-400 mb-6">
            Not sure which solution fits your organization?
          </p>
          <Link
            href="/contact"
            className="mk-btn mk-btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold"
          >
            Talk to a Compliance Expert
            <ArrowRight className="w-5 h-5" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

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
  problemStatement: string;
  regulators: string;
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
    subtitle: 'HIPAA · RACGP · AHPRA · NSQHS',
    regulators: 'RACGP, AHPRA, NSQHS',
    problemStatement:
      'Healthcare providers face mounting pressure from patient safety requirements, clinical governance obligations, and audit cycles that demand instant evidence retrieval. One compliance gap can mean regulatory sanctions, accreditation loss, or worse: patient harm.',
    solutionMapping: {
      title: 'FormaOS Healthcare Module',
      features: [
        'Patient records and progress notes with role-based access',
        'Clinical incident reporting with configurable routing',
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
        title: 'Incident Management',
        description:
          'Category-based incident capture and investigation workflows aligned to regulator requirements',
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
    subtitle: 'NDIS Practice Standards · Quality & Safeguards Commission',
    regulators: 'NDIS Quality and Safeguards Commission',
    problemStatement:
      'NDIS providers operate under intense scrutiny from the Quality and Safeguards Commission. Participant safety incidents, worker screening lapses, and missing evidence during audits can result in registration revocation and service shutdown.',
    solutionMapping: {
      title: 'FormaOS NDIS Module',
      features: [
        'Participant records and support plans (configurable)',
        'Incident reporting workflows aligned to Commission timelines',
        'Credential tracking and worker screening records',
        'Self-assessment checklists aligned to NDIS Practice Standards',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Safeguarding System',
        description:
          'Safeguarding registers and participant consent tracking with audit trail',
      },
      {
        icon: FileText,
        title: 'Incident Reporting',
        description:
          'Incident reporting workflows with Commission-mandated notification timelines',
      },
      {
        icon: CheckCircle,
        title: 'Audit Evidence',
        description: 'Evidence bundles and exports structured for NDIS auditor access',
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
    subtitle: 'SOC 2 · ISO 27001 · ASIC · APRA',
    regulators: 'ASIC, APRA, ACCC',
    problemStatement:
      'Financial institutions face relentless compliance demands from multiple frameworks simultaneously. Manual evidence collection for audits consumes significant time, while security incidents require immediate documentation and defensible response trails.',
    solutionMapping: {
      title: 'FormaOS Financial Module',
      features: [
        'Multi-framework compliance packs (SOC 2, ISO 27001, PCI-DSS) with cross-mapping',
        'Evidence collection workflows and control tracking',
        'Vendor risk tracking with supplier assessment records',
        'Incident response documentation with regulatory timelines',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Control Monitoring',
        description:
          'Control status dashboards with gap visibility, trend insights, and APRA/ASIC alignment',
      },
      {
        icon: FileText,
        title: 'Evidence Automation',
        description:
          'Evidence collection workflows and audit-ready export packs for external reviewers',
      },
      {
        icon: CheckCircle,
        title: 'Audit Acceleration',
        description: 'Average audit prep reduced from weeks to under 2 days for financial services teams',
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
    subtitle: 'TEQSA · ASQA · RTO Standards · VRQA',
    regulators: 'TEQSA, ASQA, VRQA',
    problemStatement:
      'Education providers preparing for TEQSA registration or ASQA audits spend months gathering evidence across departments. Missing documentation, outdated policies, or incomplete staff records can delay registration or trigger compliance conditions.',
    solutionMapping: {
      title: 'FormaOS Education Module',
      features: [
        'Academic governance frameworks with approval workflows',
        'Course and unit compliance mapping to TEQSA standards',
        'Trainer and assessor credential management',
        'Student complaint and appeal tracking with outcome records',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Academic Governance',
        description:
          'Policy lifecycle management with academic board approval trails',
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
          'Evidence organized by TEQSA/ASQA standard for instant retrieval during site audits',
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
    subtitle: 'FOI · ISM · PSPF · Essential Eight',
    regulators: 'ASD, AGD, OAIC',
    problemStatement:
      'Government agencies face unique accountability requirements: Freedom of Information requests, ministerial briefings, and public sector performance reporting. Every decision must be documented, defensible, and retrievable on demand.',
    solutionMapping: {
      title: 'FormaOS Government Module',
      features: [
        'Decision registers with approval chains and rationale capture',
        'FOI request management and document classification tracking',
        'Essential Eight control mapping and gap analysis',
        'Cross-agency collaboration with granular access controls',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Accountability',
        description:
          'Complete decision audit trails with ministerial-ready documentation packages',
      },
      {
        icon: FileText,
        title: 'Information Management',
        description:
          'Records classification, retention scheduling, and disposal tracking per PSPF',
      },
      {
        icon: CheckCircle,
        title: 'Essential Eight',
        description:
          'Essential Eight maturity tracking with evidence mapped to each mitigation strategy',
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
    <section className="mk-section home-section home-section--contrast relative overflow-hidden">
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <ScrollReveal variant="slideUp" range={[0, 0.3]} className="text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-400/20 text-teal-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            Industry Solutions
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Built for{' '}
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
              High-Accountability
            </span>{' '}
            Industries
          </h2>
          <p className="text-base md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            When compliance failure means regulatory action, accreditation loss,
            or operational shutdown, FormaOS delivers the evidence
            infrastructure your industry demands.
          </p>
        </ScrollReveal>

        <div className="space-y-3">
          {industrySolutions.map((solution, index) => {
            const Icon = solution.icon;
            const isExpanded = expandedIndex === index;

            return (
              <ScrollReveal
                key={solution.title}
                variant="fadeUp"
                range={[index * 0.04, 0.3 + index * 0.04]}
              >
                {/* Accordion trigger */}
                <button
                  onClick={() => toggleExpand(index)}
                  className={`w-full p-5 lg:p-6 rounded-2xl border text-left transition-all duration-300 ${
                    isExpanded
                      ? 'bg-white/[0.06] border-teal-400/25'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-teal-400/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 lg:gap-5">
                      <div className={`inline-flex items-center justify-center rounded-xl border border-teal-400/20 bg-teal-500/10 p-3 transition-transform duration-300 ${isExpanded ? 'scale-110' : ''}`}>
                        <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-base lg:text-xl font-bold text-white mb-0.5">
                          {solution.title}
                        </h3>
                        <p className="text-xs lg:text-sm text-slate-500">
                          {solution.subtitle}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-teal-400 ml-4 shrink-0"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </div>
                </button>

                {/* Expanded panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: duration.normal, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 lg:p-8">
                        {/* Regulator badge */}
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-6">
                          Regulated by: <span className="text-teal-400">{solution.regulators}</span>
                        </p>

                        <div className="grid lg:grid-cols-2 gap-8 mb-8">
                          {/* Challenge */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-rose-400 text-sm font-medium">
                              <AlertCircle className="w-4 h-4" />
                              The Challenge
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              {solution.problemStatement}
                            </p>
                          </div>

                          {/* Solution */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              {solution.solutionMapping.title}
                            </div>
                            <ul className="space-y-2.5">
                              {solution.solutionMapping.features.map((feature, i) => (
                                <motion.li
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.1 + i * 0.08 }}
                                  className="flex items-start gap-2.5"
                                >
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400/60" />
                                  <span className="text-slate-300 text-sm">{feature}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Capability cards */}
                        <div className="grid md:grid-cols-3 gap-3 mb-8">
                          {solution.capabilities.map((capability, i) => {
                            const CapIcon = capability.icon;
                            return (
                              <motion.div
                                key={capability.title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
                              >
                                <div className="inline-flex items-center justify-center rounded-lg border border-teal-400/20 bg-teal-500/10 p-2 mb-3">
                                  <CapIcon className="w-4 h-4 text-teal-400" />
                                </div>
                                <h4 className="text-white text-sm font-semibold mb-1.5">
                                  {capability.title}
                                </h4>
                                <p className="text-slate-500 text-xs leading-relaxed">
                                  {capability.description}
                                </p>
                              </motion.div>
                            );
                          })}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-white/[0.06]">
                          <p className="text-slate-500 text-sm">
                            See how FormaOS transforms {solution.title.toLowerCase()} compliance
                          </p>
                          <Link
                            href={solution.cta.href}
                            className="mk-btn mk-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
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

        <ScrollReveal variant="slideUp" range={[0.05, 0.35]} className="mt-12 text-center">
          <p className="text-slate-500 mb-5">
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

'use client';

import { AnimatePresence, motion } from 'framer-motion';
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
  regulators: string;
  problemStatement: string;
  solutionMapping: { title: string; features: string[] };
  capabilities: { icon: LucideIcon; title: string; description: string }[];
  cta: { text: string; href: string };
}

const industrySolutions: IndustrySolution[] = [
  {
    icon: Heart,
    title: 'Healthcare',
    subtitle: 'HIPAA · RACGP · AHPRA · NSQHS',
    regulators: 'RACGP, AHPRA, NSQHS',
    problemStatement:
      'Healthcare providers face mounting pressure from patient safety requirements, clinical governance obligations, and audit cycles that demand instant evidence retrieval.',
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
    cta: { text: 'Explore Healthcare Solution', href: '/use-cases/healthcare' },
  },
  {
    icon: Users,
    title: 'NDIS Providers',
    subtitle: 'NDIS Practice Standards · Quality & Safeguards Commission',
    regulators: 'NDIS Quality and Safeguards Commission',
    problemStatement:
      'NDIS providers operate under intense scrutiny from the Quality and Safeguards Commission. Participant safety incidents, worker screening lapses, and missing evidence during audits can result in registration revocation.',
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
        description:
          'Evidence bundles and exports structured for NDIS auditor access',
      },
    ],
    cta: { text: 'Explore NDIS Solution', href: '/use-cases/ndis-aged-care' },
  },
  {
    icon: TrendingUp,
    title: 'Financial Services',
    subtitle: 'SOC 2 · ISO 27001 · ASIC · APRA',
    regulators: 'ASIC, APRA, ACCC',
    problemStatement:
      'Financial institutions face relentless compliance demands from multiple frameworks simultaneously. Manual evidence collection consumes significant time, while security incidents require immediate documentation.',
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
        description:
          'Average audit prep reduced from weeks to under 2 days for financial services teams',
      },
    ],
    cta: {
      text: 'Explore Financial Solution',
      href: '/soc2-compliance-automation',
    },
  },
  {
    icon: GraduationCap,
    title: 'Education & Accreditation',
    subtitle: 'TEQSA · ASQA · RTO Standards · VRQA',
    regulators: 'TEQSA, ASQA, VRQA',
    problemStatement:
      'Education providers preparing for TEQSA registration or ASQA audits spend months gathering evidence across departments. Missing documentation or incomplete staff records can delay registration.',
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
    cta: { text: 'Explore Education Solution', href: '/industries' },
  },
  {
    icon: Building2,
    title: 'Government & Public Sector',
    subtitle: 'FOI · ISM · PSPF · Essential Eight',
    regulators: 'ASD, AGD, OAIC',
    problemStatement:
      'Government agencies face unique accountability requirements: Freedom of Information requests, ministerial briefings, and public sector performance reporting. Every decision must be documented and defensible.',
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
    cta: { text: 'Explore Government Solution', href: '/industries' },
  },
];

export function Industries() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <section className="mk-section relative">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal variant="fadeUp" className="text-center mb-12">
          <span className="mk-badge mk-badge--section mb-6">
            Industry Solutions
          </span>

          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-white">
            Built for <span className="text-teal-400">High-Accountability</span>{' '}
            Industries
          </h2>
          <p className="text-base md:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
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
              <div key={solution.title}>
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className={`w-full p-5 rounded-xl border text-left transition-colors duration-200 ${
                    isExpanded
                      ? 'bg-slate-900/80 border-teal-500/20'
                      : 'bg-slate-900/50 border-white/[0.06] hover:border-teal-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="inline-flex items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 p-2.5">
                        <Icon className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          {solution.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {solution.subtitle}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-slate-400 ml-4 shrink-0"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 rounded-xl border border-white/[0.06] bg-slate-900/50 p-6">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-5">
                          Regulated by:{' '}
                          <span className="text-teal-400">
                            {solution.regulators}
                          </span>
                        </p>

                        <div className="grid lg:grid-cols-2 gap-6 mb-6">
                          <div>
                            <div className="flex items-center gap-2 text-rose-400 text-sm font-medium mb-2">
                              <AlertCircle className="w-4 h-4" />
                              The Challenge
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                              {solution.problemStatement}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
                              <CheckCircle className="w-4 h-4" />
                              {solution.solutionMapping.title}
                            </div>
                            <ul className="space-y-2">
                              {solution.solutionMapping.features.map(
                                (feature, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2"
                                  >
                                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-400/60" />
                                    <span className="text-slate-400 text-sm">
                                      {feature}
                                    </span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3 mb-6">
                          {solution.capabilities.map((cap) => {
                            const CapIcon = cap.icon;
                            return (
                              <div
                                key={cap.title}
                                className="rounded-lg border border-white/[0.06] bg-slate-800/30 p-4"
                              >
                                <div className="inline-flex items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 p-2 mb-3">
                                  <CapIcon className="w-4 h-4 text-teal-400" />
                                </div>
                                <h4 className="text-white text-sm font-semibold mb-1">
                                  {cap.title}
                                </h4>
                                <p className="text-slate-500 text-xs leading-relaxed">
                                  {cap.description}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
                          <p className="text-slate-500 text-sm">
                            See how FormaOS transforms{' '}
                            {solution.title.toLowerCase()} compliance
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
              </div>
            );
          })}
        </div>

        <ScrollReveal variant="fadeUp" className="mt-10 text-center">
          <p className="text-slate-500 mb-4 text-sm">
            Not sure which solution fits your organization?
          </p>
          <Link
            href="/contact"
            className="mk-btn mk-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium"
          >
            Talk to a Compliance Expert
            <ArrowRight className="w-4 h-4" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

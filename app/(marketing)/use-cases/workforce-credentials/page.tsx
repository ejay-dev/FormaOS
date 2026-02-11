import React from 'react';
import { Metadata } from 'next';
import {
  Award,
  Calendar,
  UserCheck,
  FileCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { brand } from '@/config/brand';
import DemoCredentialTracker from '@/components/marketing/demo/DemoCredentialTracker';
import DemoComplianceScore from '@/components/marketing/demo/DemoComplianceScore';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Workforce Credential Management | FormaOS',
  description:
    'Credential tracking for workforce compliance with reminders, competency management, and audit-ready reporting.',
};

export default function WorkforceUseCasePage() {
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white overflow-hidden">
      <main className="relative">
        {/* Hero Section */}
        <section className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/5 via-[#0d1424] to-[#0a0f1c]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 mb-6">
                Workforce Management
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                  Stay Ahead
                </span>
                <br />
                A Certificate Expiry
              </h1>

              <p className="text-lg sm:text-xl text-gray-400 mb-8">
                Credential tracking and workforce compliance management.
                Professional registrations, certifications, training records,
                and competency assessments in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`${appBase}/auth/signup?plan=pro`}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-white/20 bg-white/5 text-white font-semibold hover:border-emerald-400/50 hover:bg-emerald-400/5 transition-all"
                >
                  Book Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm font-medium text-red-400 mb-4">
                The Challenge
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Workforce Compliance Complexity
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Organizations managing credentials face constant challenges
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
              {[
                {
                  icon: AlertCircle,
                  title: 'Expired Credentials',
                  description:
                    'Staff working with expired registrations, certificates, or licenses — creating legal and insurance liability.',
                  risk: 'HIGH RISK',
                },
                {
                  icon: FileCheck,
                  title: 'Spreadsheet Hell',
                  description:
                    'Multiple Excel files tracking different credential types, often out of date, difficult to maintain, no automation.',
                  risk: 'INEFFICIENT',
                },
                {
                  icon: Calendar,
                  title: 'Manual Tracking',
                  description:
                    'Admin staff manually checking expiry dates, sending reminder emails, chasing staff for renewals — time-consuming and error-prone.',
                  risk: 'TIME DRAIN',
                },
                {
                  icon: TrendingUp,
                  title: 'Audit Nightmares',
                  description:
                    'Scrambling to gather evidence for audits, verifying current credentials, compiling reports from disparate sources.',
                  risk: 'AUDIT FAIL',
                },
              ].map((pain, idx) => (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-gradient-to-br from-red-500/[0.08] to-red-500/[0.02] rounded-2xl border border-red-500/20 p-6 hover:border-red-500/40 transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <pain.icon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {pain.title}
                      </h3>
                      <span className="inline-block text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                        {pain.risk}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {pain.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Demo: Credential Management in Action */}
        <section className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 mb-4">
                Live Platform Preview
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                See Credential Management in Action
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Watch how FormaOS tracks and manages workforce credentials
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <DemoCredentialTracker />
              <DemoComplianceScore glowColor="from-emerald-500/15 to-cyan-500/15" />
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 mb-4">
                The Solution
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Credential Management
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Tracking, reminders, and complete audit trails
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  icon: Award,
                  title: 'Professional Registrations',
                  items: [
                    'AHPRA registration (medical, nursing, allied health)',
                    'Teacher registration (VIT, NESA, etc.)',
                    'Trade licenses (builders, electricians, plumbers)',
                    'Professional indemnity insurance',
                  ],
                },
                {
                  icon: FileCheck,
                  title: 'Certifications & Qualifications',
                  items: [
                    'Working with Children Checks',
                    'Police checks and NDIS screening',
                    'First aid and CPR certifications',
                    'Food safety and hygiene certificates',
                  ],
                },
                {
                  icon: UserCheck,
                  title: 'Training & Competency',
                  items: [
                    'Mandatory training completion',
                    'Competency assessments and sign-offs',
                    'CPD/CPE hours tracking',
                    'Skill matrix and capability records',
                  ],
                },
              ].map((category, idx) => (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-emerald-500/30 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <category.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {category.title}
                  </h3>
                  <ul className="space-y-2">
                    {category.items.map((item, iIdx) => (
                      <li
                        key={iIdx}
                        className="flex items-start gap-2 text-sm text-gray-400"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Automation Features */}
        <section className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-400 mb-4">
                Automation
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Credential Workflow Support
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Configurable reminders and review workflows (by request)
              </p>
            </div>

            <div className="space-y-4 max-w-4xl mx-auto">
              {[
                {
                  feature: 'Multi-Stage Expiry Reminders',
                  description:
                    'Configurable reminder schedules for upcoming expiries (by request).',
                  benefit: 'Reduce missed renewals',
                },
                {
                  feature: 'Document Upload & Verification',
                  description:
                    'Staff upload renewal certificates directly. Managers review and approve with audit trails.',
                  benefit: 'Streamlined reviews',
                },
                {
                  feature: 'Rostering Integration Flags',
                  description:
                    'Rostering integration flags available by request to highlight expired credentials.',
                  benefit: 'Reduce scheduling risk',
                },
                {
                  feature: 'Bulk Import & Export',
                  description:
                    'Import existing credential data via CSV. Export current status reports for management or auditors.',
                  benefit: 'Faster data onboarding',
                },
                {
                  feature: 'Customizable Credential Types',
                  description:
                    'Configure credential types and review workflows to fit your organization (by request).',
                  benefit: 'Adapts to different roles',
                },
                {
                  feature: 'Mobile Access',
                  description:
                    'Staff can view credentials and upload renewals from mobile devices.',
                  benefit: 'Accessible on the go',
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 sm:p-8 hover:border-cyan-500/30 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-xl font-semibold text-white">{feature.feature}</h3>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                    <TrendingUp className="h-3 w-3" />
                    {feature.benefit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Example */}
        <section className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 mb-4">
                Example Workflow
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                AHPRA Registration Renewal
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                A configurable review flow for professional registrations
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="space-y-4">
                {[
                  {
                    step: 'Review cadence defined',
                    action:
                      'Set renewal cadence and reminder schedules based on policy.',
                  },
                  {
                    step: 'Staff notified',
                    action:
                      'Staff receive reminders when renewals are due (by request).',
                  },
                  {
                    step: 'Upload renewal',
                    action:
                      'Staff upload renewal documents via web or mobile.',
                  },
                  {
                    step: 'Manager review',
                    action:
                      'Managers review submissions and update expiry dates.',
                  },
                  {
                    step: 'Audit trail complete',
                    action:
                      'All actions are logged to support audit readiness.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-emerald-500/30 transition-all duration-300"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-sm font-bold text-emerald-400">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-emerald-400 mb-1">
                        {item.step}
                      </div>
                      <div className="text-sm text-gray-400">
                        {item.action}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <section className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 mb-4">
                Industries
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Used Across Regulated Industries
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Any organization managing workforce credentials
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  industry: 'Healthcare',
                  examples: [
                    'AHPRA registrations',
                    'Professional indemnity',
                    'Immunization records',
                    'CPD hours',
                  ],
                },
                {
                  industry: 'Education',
                  examples: [
                    'Teacher registration',
                    'Working with Children',
                    'First aid certification',
                    'Mandatory reporting training',
                  ],
                },
                {
                  industry: 'Aged Care & NDIS',
                  examples: [
                    'NDIS Worker Screening',
                    'Police checks',
                    'Certificate III/IV',
                    'Medication competency',
                  ],
                },
                {
                  industry: 'Construction',
                  examples: [
                    'Trade licenses',
                    'White Card',
                    'Height safety',
                    'Asbestos awareness',
                  ],
                },
                {
                  industry: 'Hospitality',
                  examples: [
                    'RSA/RCG certificates',
                    'Food safety',
                    'First aid',
                    'Allergen training',
                  ],
                },
                {
                  industry: 'Manufacturing',
                  examples: [
                    'Forklift licenses',
                    'Machinery operation',
                    'Safety training',
                    'Quality system auditor',
                  ],
                },
                {
                  industry: 'Transport',
                  examples: [
                    'Driver licenses',
                    'Heavy vehicle',
                    'Dangerous goods',
                    'Fatigue management',
                  ],
                },
                {
                  industry: 'Professional Services',
                  examples: [
                    'CPA/CA registration',
                    'Legal practicing cert',
                    'PI insurance',
                    'CPD requirements',
                  ],
                },
              ].map((sector, idx) => (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-emerald-500/30 transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {sector.industry}
                  </h3>
                  <ul className="space-y-2">
                    {sector.examples.map((example, eIdx) => (
                      <li
                        key={eIdx}
                        className="text-sm text-gray-400 flex items-start gap-2"
                      >
                        <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0 mt-1" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI Section */}
        <section className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 mb-4">
                ROI
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Time Saved, Risk Reduced
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Organizations using FormaOS for credential management
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[
                {
                  metric: 'Clear',
                  label: 'Credential status',
                  description: 'Reminder workflows available by request',
                },
                {
                  metric: 'Less',
                  label: 'Admin overhead',
                  description: 'Centralized tracking for teams',
                },
                {
                  metric: 'Audit-ready',
                  label: 'Evidence',
                  description: 'Exports and audit trails when needed',
                },
                {
                  metric: 'Streamlined',
                  label: 'Approval flow',
                  description: 'Manager review with audit trails',
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="text-center backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-emerald-500/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent mb-2">
                    {stat.metric}
                  </div>
                  <div className="text-sm font-semibold text-white mb-2">{stat.label}</div>
                  <div className="text-xs text-gray-500">
                    {stat.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-10 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Stop chasing{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                  expired credentials
                </span>
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                Start your 14-day free trial. No credit card required. Full
                platform access.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`${appBase}/auth/signup?plan=pro`}
                  className="group inline-flex items-center justify-center px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-white/20 bg-white/5 text-white font-semibold hover:border-emerald-400/50 hover:bg-emerald-400/5 transition-all"
                >
                  Schedule Demo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

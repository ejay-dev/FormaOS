import React from 'react';
import { Metadata } from 'next';
import {
  Heart,
  Users,
  Shield,
  FileCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { brand } from '@/config/brand';
import DemoPolicyLifecycle from '@/components/marketing/demo/DemoPolicyLifecycle';
import DemoComplianceScore from '@/components/marketing/demo/DemoComplianceScore';
import DemoIncidentFlow from '@/components/marketing/demo/DemoIncidentFlow';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'NDIS & Aged Care Compliance | FormaOS',
  description:
    'Compliance management for NDIS providers and aged care facilities. Support worker screening records, incident workflows, and audit readiness.',
};

export default function NDISUseCasePage() {
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-[#0d1424] to-[#0a0f1c]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-400 mb-6">
              NDIS & Aged Care
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                NDIS Practice Standards
              </span>
              <br />
              Made Simple
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 mb-8">
              Complete compliance solution for NDIS providers and aged care
              facilities. Meet NDIS Practice Standards and Aged Care Quality
              Standards with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`${appBase}/auth/signup?plan=pro`}
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-white/20 bg-white/5 text-white font-semibold hover:border-purple-400/50 hover:bg-purple-400/5 transition-all"
              >
                Book Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Modules Section */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-400 mb-4">
              Core Modules
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need for NDIS Compliance
            </h2>
            <p className="text-lg text-gray-400">
              Purpose-built modules for disability and aged care service providers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Shield,
                title: 'Worker Screening',
                description:
                  'Track worker screening checks, police checks, and WWCC with review reminders. Renewal dates configured per role.',
              },
              {
                icon: Heart,
                title: 'Participant Management',
                description:
                  'Complete participant records with care status, risk levels, emergency flags, service agreements, and support plans. Evidence-linked tracking automatically supports NDIS audits.',
              },
              {
                icon: AlertTriangle,
                title: 'Incident & Safeguarding',
                description:
                  'Report incidents, allegations, and safeguarding concerns with severity classification. Auto-mapped to NDIS Quality & Safeguards Commission reporting requirements.',
              },
              {
                icon: FileCheck,
                title: 'Policy & Procedures',
                description:
                  'Maintain NDIS Practice Standards policies with acknowledgments and review reminders (by request). Track acknowledgment dates for audit evidence.',
              },
              {
                icon: Users,
                title: 'Training & Competency',
                description:
                  'Track mandatory training, worker orientation, and competency records linked to participant support. Evidence of workforce readiness for inspections.',
              },
              {
                icon: Award,
                title: 'Quality & Audit',
                description:
                  'Internal audits, quality improvement activities, and evidence repository with export packs. All participant-related actions automatically become audit evidence.',
              },
            ].map((module, idx) => (
              <div
                key={idx}
                className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
                  <module.icon className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{module.title}</h3>
                <p className="text-sm text-gray-400">
                  {module.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo: NDIS Compliance in Action */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-400 mb-4">
              Live Platform Preview
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              See NDIS Compliance in Action
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Interactive previews of FormaOS managing NDIS and aged care compliance
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <DemoPolicyLifecycle glowColor="from-purple-500/15 to-pink-500/15" />
            <DemoIncidentFlow glowColor="from-purple-500/15 to-red-500/15" />
            <DemoComplianceScore glowColor="from-purple-500/15 to-pink-500/15" />
          </div>
        </div>
      </section>

      {/* NDIS Practice Standards Mapping */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-400 mb-4">
              Practice Standards
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Aligned with NDIS Practice Standards
            </h2>
            <p className="text-lg text-gray-400">
              Preconfigured modules mapped to all core and supplementary practice standards
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                category: 'Core Module: Rights and Responsibilities',
                standards: [
                  'Human rights approach to service delivery',
                  'Active communication and information provision',
                  'Privacy and dignity protocols',
                  'Independence and informed choice documentation',
                ],
              },
              {
                category:
                  'Core Module: Governance and Operational Management',
                standards: [
                  'Organization management and leadership evidence',
                  'Regulatory compliance tracking',
                  'Risk management framework and register',
                  'Continuity of supports and service withdrawal protocols',
                  'Records management and information security',
                ],
              },
              {
                category: 'Core Module: Provision of Supports',
                standards: [
                  'Assessment and planning documentation',
                  'Support plan implementation and monitoring',
                  'Mealtime management (where applicable)',
                  'Support plan reviews and participant feedback',
                ],
              },
              {
                category: 'Supplementary: High Intensity Supports',
                standards: [
                  'Behavior support plan management',
                  'Specialist behavior support practitioner oversight',
                  'Restrictive practice authorization tracking',
                  'Incident reporting for unauthorized restrictive practices',
                ],
              },
            ].map((module, idx) => (
              <div
                key={idx}
                className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 sm:p-8 hover:border-purple-500/30 transition-all duration-300"
              >
                <h3 className="text-xl font-semibold text-white mb-4">
                  {module.category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {module.standards.map((standard, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-400">
                        {standard}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Aged Care Quality Standards */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-sm font-medium text-pink-400 mb-4">
              Aged Care
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Aged Care Quality Standards Support
            </h2>
            <p className="text-lg text-gray-400">
              Also supports Commonwealth aged care quality and safety requirements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                standard: 'Standard 1: Consumer Dignity and Choice',
                features: [
                  'Resident rights and responsibilities documentation',
                  'Consent and advance care planning',
                  'Cultural and spiritual preferences',
                  'Complaints and feedback management',
                ],
              },
              {
                standard: 'Standard 2: Ongoing Assessment and Planning',
                features: [
                  'Comprehensive assessment tools',
                  'Care plan development and review',
                  'Medication management protocols',
                  'Allied health referrals and coordination',
                ],
              },
              {
                standard: 'Standard 3: Personal and Clinical Care',
                features: [
                  'Clinical care protocols and procedures',
                  'Skin integrity and wound care documentation',
                  'Falls prevention and management',
                  'Palliative and end-of-life care planning',
                ],
              },
              {
                standard:
                  'Standard 4: Services and Supports for Daily Living',
                features: [
                  'Activities and lifestyle programs',
                  'Catering and dietary management',
                  'Facilities and equipment maintenance',
                  'Transport and outing coordination',
                ],
              },
              {
                standard: 'Standard 5: Organization Service Environment',
                features: [
                  'WHS policies and risk assessments',
                  'Infection prevention and control',
                  'Emergency and disaster planning',
                  'Building and equipment compliance',
                ],
              },
              {
                standard: 'Standard 6: Feedback and Complaints',
                features: [
                  'Complaints register and investigation',
                  'Satisfaction surveys and feedback loops',
                  'Continuous improvement evidence',
                  'Open disclosure protocols',
                ],
              },
              {
                standard: 'Standard 7: Human Resources',
                features: [
                  'Workforce screening and qualification checks',
                  'Orientation and ongoing training',
                  'Performance management and supervision',
                  'Staffing levels and skill mix monitoring',
                ],
              },
              {
                standard: 'Standard 8: Organizational Governance',
                features: [
                  'Corporate governance structure',
                  'Quality and risk management systems',
                  'Financial management transparency',
                  'Continuous improvement framework',
                ],
              },
            ].map((standard, idx) => (
              <div
                key={idx}
                className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-pink-500/30 transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  {standard.standard}
                </h3>
                <ul className="space-y-2">
                  {standard.features.map((feature, fIdx) => (
                    <li
                      key={fIdx}
                      className="flex items-start gap-2 text-sm text-gray-400"
                    >
                      <CheckCircle className="h-4 w-4 text-pink-400 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflows Section */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-400 mb-4">
              Workflows
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Compliance Workflows
            </h2>
            <p className="text-lg text-gray-400">
              Configurable workflows and reminders for routine compliance tasks
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                workflow: 'Participant Care & Evidence Generation',
                description:
                  'Workers log participant interactions, care updates, and progress notes. Each note automatically linked to NDIS Practice Standards controls and included in audit evidence export. Sign-off workflow ensures supervisor oversight.',
                timeframe: 'Real-time audit readiness',
              },
              {
                workflow: 'Reportable Incident Management',
                description:
                  'Capture incident details, classify severity, document investigations, and track corrective actions. Auto-mapped to NDIS Quality & Safeguards Commission requirements. Incidents linked to participant records create complete incident history for audits.',
                timeframe: 'Regulatory timeframes configurable by policy',
              },
              {
                workflow: 'Worker Screening Expiry Management',
                description:
                  'Track screening expiry dates with reminders and escalation workflows. Renewal documentation becomes part of evidence trail. Audit reports show complete workforce screening compliance history.',
                timeframe: 'Review cadence configurable',
              },
              {
                workflow: 'Service Agreement Review',
                description:
                  'Schedule service agreement reviews, document amendments, and store executed agreements. Review dates automatically tracked for evidence. Participant consent documentation preserved for audit bundles.',
                timeframe: 'Review cycle configurable',
              },
              {
                workflow: 'Policy Review and Acknowledgment',
                description:
                  'Schedule policy reviews, approvals, and acknowledgment tracking. Staff acknowledgment dates recorded as evidence. Audit-ready proof of workforce policy understanding.',
                timeframe: 'Review cycle configurable',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 sm:p-8 hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-xl font-semibold text-white">{item.workflow}</h3>
                  <Clock className="h-6 w-6 text-purple-400 shrink-0" />
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  {item.description}
                </p>
                <div className="inline-flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 rounded-full px-3 py-1">
                  <Clock className="h-3 w-3" />
                  {item.timeframe}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-400 mb-4">
              Impact
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Real Results for NDIS & Aged Care Providers
            </h2>
            <p className="text-lg text-gray-400">
              Organizations using FormaOS for NDIS and aged care compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                metric: 'Faster',
                label: 'Incident reporting',
                description: 'Workflow templates improve consistency',
              },
              {
                metric: 'Fewer',
                label: 'Overdue screenings',
                description: 'Review reminders reduce missed renewals',
              },
              {
                metric: 'Less',
                label: 'Admin overhead',
                description: 'Centralized tracking reduces manual follow-up',
              },
              {
                metric: 'Audit-ready',
                label: 'Evidence',
                description: 'Export packs available when needed',
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="text-center backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all duration-300"
              >
                <Award className="h-10 w-10 text-purple-400 mx-auto mb-4" />
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-purple-500/5 to-[#0a0f1c]" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready for your next{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              NDIS Commission audit?
            </span>
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Start your 14-day free trial. No credit card required. Full
            platform access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`${appBase}/auth/signup?plan=pro`}
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-white/20 bg-white/5 text-white font-semibold hover:border-purple-400/50 hover:bg-purple-400/5 transition-all"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

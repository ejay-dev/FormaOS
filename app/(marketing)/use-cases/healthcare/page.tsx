import React from 'react';
import { Metadata } from 'next';
import {
  Shield,
  FileText,
  Users,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Healthcare Compliance Management | FormaOS',
  description:
    'Compliance solution for healthcare organizations. Manage policies, evidence, certificates, patient records, and incident reporting in one AHPRA-aligned platform.',
};

export default function HealthcareUseCasePage() {
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white overflow-hidden">
      <main className="relative">
        {/* Hero Section */}
        <section className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-[#0d1424] to-[#0a0f1c]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 mb-6">
                Healthcare Compliance
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  AHPRA-Aligned
                </span>
                <br />
                Healthcare Compliance
              </h1>

              <p className="text-lg sm:text-xl text-gray-400 mb-8">
                Complete compliance management for medical practices, allied
                health clinics, and healthcare organizations. Meet AHPRA, RACGP,
                and NDIS standards with aligned workflows.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`${appBase}/auth/signup?plan=pro`}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-white/20 bg-white/5 text-white font-semibold hover:border-blue-400/50 hover:bg-blue-400/5 transition-all"
                >
                  Book Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Key Challenges Section */}
        <section className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 mb-4">
                Healthcare Challenges
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Built for Healthcare Compliance Reality
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                We understand the unique compliance challenges healthcare
                organizations face
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  icon: FileText,
                  title: 'Patient Management System',
                  description:
                    'Complete patient records with care status tracking, risk stratification, emergency flags, and episode management. HIPAA-aligned design supports multi-site healthcare networks.',
                },
                {
                  icon: Shield,
                  title: 'Certificate Tracking',
                  description:
                    'Track registrations, CPD, immunizations, and mandatory training with reminder workflows (by request).',
                },
                {
                  icon: Users,
                  title: 'Progress Notes & Clinical Documentation',
                  description:
                    'Structured progress notes automatically become audit evidence. Sign-off workflows, status tagging (routine/follow-up/incident/risk), and supervisor approval built-in.',
                },
                {
                  icon: AlertCircle,
                  title: 'Incident Reporting',
                  description:
                    'Capture and investigate adverse events with corrective actions and configurable reporting workflows. Links to patient records and incidents auto-map to compliance evidence.',
                },
                {
                  icon: ClipboardCheck,
                  title: 'Evidence Management',
                  description:
                    'Patient-linked evidence tracking. Every progress note, incident, and task completion automatically tagged to relevant compliance controls. Audit-ready exports by standard.',
                },
                {
                  icon: TrendingUp,
                  title: 'Audit Readiness',
                  description:
                    'Export compliance packages with complete audit trails. Patient-level evidence bundles with automated control mapping for AHPRA, RACGP, or ACHS audits.',
                },
              ].map((challenge, idx) => (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-blue-500/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center mb-4">
                    <challenge.icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {challenge.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {challenge.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 mb-4">
                Healthcare Workflows
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Compliance Workflows Built for Healthcare
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Streamlined processes for common healthcare compliance scenarios
              </p>
            </div>

            <div className="space-y-8">
              {[
                {
                  title: 'New Clinician Onboarding',
                  steps: [
                    'Verify AHPRA registration and professional indemnity',
                    'Check immunization status and infectious disease screening',
                    'Complete orientation modules and competency assessments',
                    'Acknowledge all clinical policies and procedures',
                    'Grant system access based on role and credentials',
                  ],
                },
                {
                  title: 'Patient Care & Progress Notes (Evidence Generation)',
                  steps: [
                    'Clinician accesses patient record with care status, risk level, emergency flags',
                    'Creates structured progress note with status tag (routine/follow-up/incident/risk)',
                    'Note automatically linked to compliance framework controls',
                    'Manager reviews and signs off on progress note (supervisor approval workflow)',
                    'Note becomes audit evidence - automatically exported in compliance audit bundles',
                  ],
                },
                {
                  title: 'Clinical Incident Management',
                  steps: [
                    'Staff member logs incident with severity classification (SAC rating)',
                    'Incident linked to patient record and auto-mapped to compliance evidence',
                    'Manager reviews and initiates investigation with root cause analysis',
                    'Corrective actions implemented and tracked to completion',
                    'Regulatory reporting to AHPRA/SA Health if required with evidence artifacts attached',
                  ],
                },
                {
                  title: 'Credential Expiry & Audit Readiness',
                  steps: [
                    'Track all practitioner certificates with configurable expiry cadences',
                    'Reminder workflows flag renewals 90/60/30/7 days out',
                    'Renewal documentation uploaded and reviewed automatically',
                    'Complete audit trail of all credential changes preserved',
                    'Export auditor-ready credential reports with verification timestamps',
                  ],
                },
              ].map((workflow, idx) => (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 sm:p-8 hover:border-blue-500/30 transition-all duration-300"
                >
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-cyan-400" />
                    {workflow.title}
                  </h3>
                  <ol className="space-y-3">
                    {workflow.steps.map((step, stepIdx) => (
                      <li
                        key={stepIdx}
                        className="flex items-start gap-3 text-sm text-gray-400"
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-semibold text-cyan-400">
                          {stepIdx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Standards & Frameworks */}
        <section className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 mb-4">
                Compliance Standards
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Built for Australian Healthcare Standards
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Framework packs aligned with regulatory requirements
                (configurable)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  standard: 'AHPRA',
                  description:
                    'Australian Health Practitioner Regulation Agency compliance',
                  features: [
                    'Practitioner registration tracking',
                    'CPD record tracking',
                    'Mandatory reporting checklists',
                    'Professional indemnity records',
                  ],
                },
                {
                  standard: 'RACGP',
                  description:
                    'Royal Australian College of General Practitioners standards',
                  features: [
                    'QI&CPD criteria tracking',
                    'Clinical governance framework templates',
                    'Infection control protocols',
                    'Patient safety workflows',
                  ],
                },
                {
                  standard: 'NDIS',
                  description:
                    'National Disability Insurance Scheme practice standards',
                  features: [
                    'Worker screening records',
                    'Incident management workflows',
                    'Service agreement documentation',
                    'Provider registration evidence',
                  ],
                },
                {
                  standard: 'ACHS',
                  description:
                    'Australian Council on Healthcare Standards accreditation',
                  features: [
                    'Clinical governance framework',
                    'Consumer partnership evidence',
                    'Safe environment protocols',
                    'Medication safety systems',
                  ],
                },
                {
                  standard: 'Aged Care Quality Standards',
                  description:
                    'Commonwealth aged care quality and safety requirements',
                  features: [
                    'Consumer dignity and choice',
                    'Personal and clinical care',
                    'Service environment safety',
                    'Feedback and complaints',
                  ],
                },
                {
                  standard: 'Privacy Act',
                  description:
                    'Australian Privacy Principles for health information',
                  features: [
                    'Patient consent management',
                    'Data breach protocols',
                    'Access and correction rights',
                    'Security safeguards',
                  ],
                },
              ].map((standard, idx) => (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-blue-500/30 transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {standard.standard}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {standard.description}
                  </p>
                  <ul className="space-y-2">
                    {standard.features.map((feature, fIdx) => (
                      <li
                        key={fIdx}
                        className="flex items-start gap-2 text-sm text-gray-400"
                      >
                        <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                        {feature}
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
              <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 mb-4">
                ROI & Impact
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Time Saved, Risk Reduced
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Healthcare organizations using FormaOS report significant
                operational improvements
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[
                {
                  metric: 'Faster',
                  label: 'Audit preparation',
                  description: 'Export complete audit packages in minutes',
                },
                {
                  metric: 'Reduced',
                  label: 'Credential gaps',
                  description: 'Automated reminders ensure timely renewals',
                },
                {
                  metric: 'Hours',
                  label: 'Admin time saved weekly',
                  description: 'Streamlined compliance tracking per manager',
                },
                {
                  metric: 'Full',
                  label: 'Audit trail coverage',
                  description: 'Every action timestamped and preserved',
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="text-center backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-blue-500/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                    {stat.metric}
                  </div>
                  <div className="text-sm font-semibold text-white mb-2">
                    {stat.label}
                  </div>
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

          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready for your next{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                AHPRA audit?
              </span>
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Start your 14-day free trial. No credit card required. Full
              platform access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`${appBase}/auth/signup?plan=pro`}
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-white/20 bg-white/5 text-white font-semibold hover:border-blue-400/50 hover:bg-blue-400/5 transition-all"
              >
                Schedule Demo
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

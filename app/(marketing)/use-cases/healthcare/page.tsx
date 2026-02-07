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
import {
  SystemBackground,
  SectionGlow,
  SectionHeader,
  ScrollGradient,
  Reveal,
  Parallax,
  AmbientOrbs,
} from '@/components/motion';
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
    <ScrollGradient>
      <main className="relative min-h-screen">
        {/* Hero Section */}
        <SystemBackground variant="info" className="py-20 sm:py-28 lg:py-32">
          <SectionGlow color="blue" intensity="medium" position="top" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 mb-6">
                Healthcare Compliance
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-gradient-system">AHPRA-Aligned</span>
                <br />
                Healthcare Compliance
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                Complete compliance management for medical practices, allied
                health clinics, and healthcare organizations. Meet AHPRA, RACGP,
                and NDIS standards with aligned workflows.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`${appBase}/auth/signup?plan=pro`}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-semibold shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Book Demo
                </Link>
              </div>
            </div>
          </div>
        </SystemBackground>

        {/* Key Challenges Section */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Healthcare Challenges"
              title="Built for Healthcare Compliance Reality"
              subtitle="We understand the unique compliance challenges healthcare organizations face"
              alignment="center"
            />

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
                  className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors"
                >
                  <challenge.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {challenge.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {challenge.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SystemBackground>

        {/* Workflow Section */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <SectionGlow color="purple" intensity="low" position="center" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Healthcare Workflows"
              title="Compliance Workflows Built for Healthcare"
              subtitle="Streamlined processes for common healthcare compliance scenarios"
              alignment="center"
            />

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
                  className="rounded-lg border border-border bg-card p-6 sm:p-8"
                >
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    {workflow.title}
                  </h3>
                  <ol className="space-y-3">
                    {workflow.steps.map((step, stepIdx) => (
                      <li
                        key={stepIdx}
                        className="flex items-start gap-3 text-sm text-muted-foreground"
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
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
        </SystemBackground>

        {/* Standards & Frameworks */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Compliance Standards"
              title="Built for Australian Healthcare Standards"
              subtitle="Framework packs aligned with regulatory requirements (configurable)"
              alignment="center"
            />

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
                  className="rounded-lg border border-border bg-card p-6"
                >
                  <h3 className="text-lg font-semibold mb-2">
                    {standard.standard}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {standard.description}
                  </p>
                  <ul className="space-y-2">
                    {standard.features.map((feature, fIdx) => (
                      <li
                        key={fIdx}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </SystemBackground>

        {/* ROI Section */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <SectionGlow color="blue" intensity="medium" position="bottom" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="ROI & Impact"
              title="Time Saved, Risk Reduced"
              subtitle="Healthcare organizations using FormaOS report significant operational improvements"
              alignment="center"
            />

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
                  className="text-center rounded-lg border border-border bg-card p-6"
                >
                  <Clock className="h-10 w-10 text-primary mx-auto mb-4" />
                  <div className="text-4xl font-bold text-primary mb-2">
                    {stat.metric}
                  </div>
                  <div className="text-sm font-semibold mb-2">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {stat.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SystemBackground>

        {/* CTA Section */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready for your next{' '}
              <span className="text-gradient-system">AHPRA audit?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start your 14-day free trial. No credit card required. Full
              platform access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`${appBase}/auth/signup?plan=pro`}
                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-semibold shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Schedule Demo
              </Link>
            </div>
          </div>
        </SystemBackground>
      </main>
    </ScrollGradient>
  );
}

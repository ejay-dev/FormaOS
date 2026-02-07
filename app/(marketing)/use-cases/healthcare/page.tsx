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
    'Complete compliance solution for healthcare organizations. Manage policies, evidence, certificates, patient records, and incident reporting in one AHPRA-ready platform.',
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
                <span className="text-gradient-system">AHPRA-Ready</span>
                <br />
                Healthcare Compliance
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                Complete compliance management for medical practices, allied
                health clinics, and healthcare organizations. Meet AHPRA, RACGP,
                and NDIS standards with confidence.
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
                  title: 'Policy Management',
                  description:
                    'Keep clinical policies current and accessible. Version control, approval workflows, and automated staff acknowledgment.',
                },
                {
                  icon: Shield,
                  title: 'Certificate Tracking',
                  description:
                    'Never miss a credential expiry. Track registrations, CPD, immunizations, and mandatory training with automated reminders.',
                },
                {
                  icon: Users,
                  title: 'Patient Records & Progress Notes',
                  description:
                    'Maintain compliant patient documentation with structured progress notes, consent forms, care plans, and automated retention policies. Complete audit trails for regulatory compliance.',
                },
                {
                  icon: AlertCircle,
                  title: 'Incident Reporting',
                  description:
                    'Capture and investigate adverse events. Root cause analysis, corrective actions, and regulatory reporting workflows.',
                },
                {
                  icon: ClipboardCheck,
                  title: 'Evidence Management',
                  description:
                    'Centralized repository for compliance evidence. Policies, procedures, training records, and meeting minutes - all audit-ready.',
                },
                {
                  icon: TrendingUp,
                  title: 'Audit Readiness',
                  description:
                    'Export complete compliance packages in minutes. Everything AHPRA, RACGP, or ACHS auditors need, organized and timestamped.',
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
                  title: 'Clinical Incident Management',
                  steps: [
                    'Staff member submits incident report (near miss or adverse event)',
                    'Manager reviews and classifies severity (SAC rating)',
                    'Investigation assigned with root cause analysis framework',
                    'Corrective actions implemented and tracked to completion',
                    'Regulatory reporting to AHPRA/SA Health if required',
                  ],
                },
                {
                  title: 'Credential Expiry Management',
                  steps: [
                    'System monitors certificate expiry dates automatically',
                    '90-day alert sent to clinician and practice manager',
                    '30-day escalation if no renewal documentation uploaded',
                    '7-day final warning with rostering implications noted',
                    'Expired credential triggers workflow restrictions',
                  ],
                },
                {
                  title: 'Policy Review & Update',
                  steps: [
                    'Scheduled review triggered for policy due for update',
                    'Clinical lead reviews and updates content with version control',
                    'Stakeholder consultation and approval workflow',
                    'All staff notified and required to acknowledge new version',
                    'Old version archived with full audit trail maintained',
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
              subtitle="Preconfigured frameworks aligned with regulatory requirements"
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
                    'CPD hours monitoring',
                    'Mandatory reporting protocols',
                    'Professional indemnity verification',
                  ],
                },
                {
                  standard: 'RACGP',
                  description:
                    'Royal Australian College of General Practitioners standards',
                  features: [
                    'QI&CPD criteria tracking',
                    'Clinical governance framework',
                    'Infection control protocols',
                    'Patient safety systems',
                  ],
                },
                {
                  standard: 'NDIS',
                  description:
                    'National Disability Insurance Scheme practice standards',
                  features: [
                    'Worker screening compliance',
                    'Incident management requirements',
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
                  metric: '85%',
                  label: 'Time saved on audits',
                  description: 'Export complete audit packages in minutes',
                },
                {
                  metric: '70%',
                  label: 'Reduction in expired credentials',
                  description: 'Automated reminders ensure renewals',
                },
                {
                  metric: '3 hours',
                  label: 'Weekly admin time saved',
                  description: 'Per practice manager on compliance tasks',
                },
                {
                  metric: '100%',
                  label: 'Audit trail completeness',
                  description: 'Every action timestamped and immutable',
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

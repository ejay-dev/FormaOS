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
  title: 'Workforce Credential Management | FormaOS',
  description:
    'Credential tracking for workforce compliance with reminders, competency management, and audit-ready reporting.',
};

export default function WorkforceUseCasePage() {
  return (
    <ScrollGradient>
      <main className="relative min-h-screen">
        {/* Hero Section */}
        <SystemBackground variant="info" className="py-20 sm:py-28 lg:py-32">
          <SectionGlow color="blue" intensity="medium" position="top" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 mb-6">
                Workforce Management
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-gradient-system">Stay Ahead</span>
                <br />A Certificate Expiry
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                Credential tracking and workforce compliance management.
                Professional registrations, certifications, training records,
                and competency assessments in one place.
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

        {/* Pain Points Section */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="The Challenge"
              title="Workforce Compliance Complexity"
              subtitle="Organizations managing credentials face constant challenges"
              alignment="center"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
              {[
                {
                  icon: AlertCircle,
                  title: 'Expired Credentials',
                  description:
                    'Staff working with expired registrations, certificates, or licenses - creating legal and insurance liability.',
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
                    'Admin staff manually checking expiry dates, sending reminder emails, chasing staff for renewals - time-consuming and error-prone.',
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
                  className="rounded-lg border border-destructive/50 bg-destructive/5 p-6"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <pain.icon className="h-10 w-10 text-destructive shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {pain.title}
                      </h3>
                      <span className="inline-block text-xs font-semibold text-destructive bg-destructive/10 rounded-full px-2 py-0.5 mb-2">
                        {pain.risk}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pain.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SystemBackground>

        {/* Solution Section */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <SectionGlow color="purple" intensity="low" position="center" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="The Solution"
              title="Credential Management"
              subtitle="Tracking, reminders, and complete audit trails"
              alignment="center"
            />

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
                  className="rounded-lg border border-border bg-card p-6"
                >
                  <category.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-4">
                    {category.title}
                  </h3>
                  <ul className="space-y-2">
                    {category.items.map((item, iIdx) => (
                      <li
                        key={iIdx}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </SystemBackground>

        {/* Automation Features */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Automation"
              title="Credential Workflow Support"
              subtitle="Configurable reminders and review workflows (by request)"
              alignment="center"
            />

            <div className="space-y-6 max-w-4xl mx-auto">
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
                  className="rounded-lg border border-border bg-card p-6 sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-xl font-semibold">{feature.feature}</h3>
                    <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {feature.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1">
                    <TrendingUp className="h-3 w-3" />
                    {feature.benefit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SystemBackground>

        {/* Workflow Example */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <SectionGlow color="blue" intensity="low" position="center" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Example Workflow"
              title="AHPRA Registration Renewal"
              subtitle="A configurable review flow for professional registrations"
              alignment="center"
            />

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
                    className="flex items-start gap-4 rounded-lg border border-border bg-card p-6"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-primary mb-1">
                        {item.step}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.action}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SystemBackground>

        {/* Industries Section */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Industries"
              title="Used Across Regulated Industries"
              subtitle="Any organization managing workforce credentials"
              alignment="center"
            />

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
                  className="rounded-lg border border-border bg-card p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">
                    {sector.industry}
                  </h3>
                  <ul className="space-y-2">
                    {sector.examples.map((example, eIdx) => (
                      <li
                        key={eIdx}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <CheckCircle className="h-3 w-3 text-primary shrink-0 mt-1" />
                        {example}
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
          <SectionGlow color="purple" intensity="medium" position="bottom" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="ROI"
              title="Time Saved, Risk Reduced"
              subtitle="Organizations using FormaOS for credential management"
              alignment="center"
            />

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
              Stop chasing{' '}
              <span className="text-gradient-system">expired credentials</span>
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

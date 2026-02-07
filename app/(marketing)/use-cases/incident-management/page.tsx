import React from 'react';
import { Metadata } from 'next';
import {
  AlertTriangle,
  FileSearch,
  Users,
  ClipboardCheck,
  TrendingDown,
  Shield,
  CheckCircle,
  Clock,
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
  title: 'Incident Management & Investigation | FormaOS',
  description:
    'Incident reporting and investigation workflows with corrective actions, audit trails, and configurable regulator templates.',
};

export default function IncidentManagementPage() {
  return (
    <ScrollGradient>
      <main className="relative min-h-screen">
        {/* Hero Section */}
        <SystemBackground variant="info" className="py-20 sm:py-28 lg:py-32">
          <SectionGlow color="purple" intensity="medium" position="top" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm font-medium text-red-400 mb-6">
                Incident Management
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-gradient-system">Professional</span>
                <br />
                Incident Management
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                Capture, investigate, and resolve workplace incidents with
                confidence. Root cause analysis, corrective actions, regulator
                templates by request, and complete audit trails.
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

        {/* Incident Types Section */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Incident Types"
              title="Comprehensive Incident Coverage"
              subtitle="Manage all incident types in one system"
              alignment="center"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  icon: AlertTriangle,
                  title: 'Workplace Safety',
                  items: [
                    'Injuries and near misses',
                    'Equipment failures',
                    'Hazardous substance exposure',
                    'Unsafe work practices',
                  ],
                },
                {
                  icon: Users,
                  title: 'Clinical & Patient Safety',
                  items: [
                    'Adverse events and complications',
                    'Medication errors',
                    'Falls and patient injuries',
                    'Infection control breaches',
                  ],
                },
                {
                  icon: Shield,
                  title: 'Safeguarding & Abuse',
                  items: [
                    'Allegations of abuse or neglect',
                    'Restrictive practice incidents',
                    'Rights violations',
                    'Dignity and respect concerns',
                  ],
                },
                {
                  icon: FileSearch,
                  title: 'Operational Incidents',
                  items: [
                    'Service delivery failures',
                    'Data breaches and privacy',
                    'Property damage',
                    'Security incidents',
                  ],
                },
                {
                  icon: TrendingDown,
                  title: 'Quality & Compliance',
                  items: [
                    'Policy violations',
                    'Audit findings',
                    'Complaints and feedback',
                    'Regulatory breaches',
                  ],
                },
                {
                  icon: ClipboardCheck,
                  title: 'Environmental',
                  items: [
                    'Spills and contamination',
                    'Fire and emergency events',
                    'Utility failures',
                    'Natural disasters',
                  ],
                },
              ].map((category, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors"
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

        {/* Investigation Workflow */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <SectionGlow color="purple" intensity="low" position="center" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Investigation Process"
              title="Structured Investigation Framework"
              subtitle="Follow best-practice investigation methodology with built-in guidance"
              alignment="center"
            />

            <div className="space-y-6 max-w-4xl mx-auto">
              {[
                {
                  phase: '1. Immediate Response',
                  description:
                    'Staff member or witness submits incident report via mobile or desktop with key incident details.',
                  timeframe: 'Timing defined by policy',
                },
                {
                  phase: '2. Initial Assessment',
                  description:
                    'Manager reviews report, classifies severity, and determines reportability requirements.',
                  timeframe: 'Timing defined by policy',
                },
                {
                  phase: '3. Investigation Assignment',
                  description:
                    'Investigation assigned to the appropriate person based on severity.',
                  timeframe: 'Timing defined by policy',
                },
                {
                  phase: '4. Evidence Collection',
                  description:
                    'Investigator collects witness statements, media, documents, and policies.',
                  timeframe: 'Ongoing during investigation',
                },
                {
                  phase: '5. Root Cause Analysis',
                  description:
                    'Apply RCA methodology to identify contributing factors, system issues, and human factors.',
                  timeframe: 'Timing defined by policy',
                },
                {
                  phase: '6. Corrective Actions',
                  description:
                    'Develop corrective and preventive actions (CAPA) with owners and due dates.',
                  timeframe: 'Documented in investigation report',
                },
                {
                  phase: '7. Regulatory Reporting',
                  description:
                    'If reportable, use regulator-specific templates and track submission status (by request).',
                  timeframe: 'Regulatory timeframes configurable',
                },
                {
                  phase: '8. Closure & Learning',
                  description:
                    'Investigation report approved and closed. Lessons learned shared with team. Incident trends analyzed for systemic issues. Archive for audit.',
                  timeframe: 'After all actions completed',
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-card p-6 sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-xl font-semibold">{step.phase}</h3>
                    <Clock className="h-6 w-6 text-primary shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {step.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-full px-3 py-1">
                    <Clock className="h-3 w-3" />
                    {step.timeframe}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SystemBackground>

        {/* Features Section */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Features"
              title="Professional Investigation Tools"
              subtitle="Everything you need for thorough incident investigation"
              alignment="center"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {[
                {
                  feature: 'Mobile Incident Reporting',
                  description:
                    'Staff submit incident reports from mobile or desktop with optional media attachments.',
                },
                {
                  feature: 'Severity Classification',
                  description:
                    'SAC rating matrices, consequence/likelihood grids, and configurable escalation workflows (by request).',
                },
                {
                  feature: 'Investigation Templates',
                  description:
                    'Configurable templates for different incident types (by request).',
                },
                {
                  feature: 'Root Cause Analysis Tools',
                  description:
                    'Structured RCA checklists and guidance (by request).',
                },
                {
                  feature: 'CAPA Management',
                  description:
                    'Track corrective and preventive actions with owners and due dates.',
                },
                {
                  feature: 'Regulatory Reporting',
                  description:
                    'Regulator-specific templates available by request with submission tracking.',
                },
                {
                  feature: 'Witness Management',
                  description:
                    'Record witness details, collect statements, maintain confidentiality. Manage conflicts of interest in investigation process.',
                },
                {
                  feature: 'Document Repository',
                  description:
                    'Centralized storage for incident evidence with audit trails.',
                },
                {
                  feature: 'Timeline Builder',
                  description:
                    'Document chronological timelines of events within investigation notes.',
                },
                {
                  feature: 'Trend Analysis',
                  description:
                    'Basic incident trend views and filters (early access).',
                },
                {
                  feature: 'Privacy & Confidentiality',
                  description:
                    'Role-based access controls. Redaction tools for de-identification. Secure sharing with external investigators or regulators.',
                },
                {
                  feature: 'Audit Trail',
                  description:
                    'Every action timestamped and logged. Who viewed, edited, approved reports. Complete chain of custody for evidence.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-card p-6"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {item.feature}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SystemBackground>

        {/* Regulatory Compliance */}
        <SystemBackground variant="info" className="py-16 sm:py-20">
          <SectionGlow color="blue" intensity="low" position="center" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Regulatory Compliance"
              title="Aligned to Australian Regulators"
              subtitle="Regulatory reference checklists; templates available by request"
              alignment="center"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  regulator: 'NDIS Commission',
                  requirements: [
                    'Reportable incidents within timeframes',
                    'Death, serious injury, abuse/neglect',
                    'Unauthorized restrictive practices',
                    'Reportable incidents log maintained',
                  ],
                },
                {
                  regulator: 'SafeWork (WHS)',
                  requirements: [
                    'Notifiable incidents within 24 hours',
                    'Serious injury, illness, dangerous incidents',
                    'Preserve incident site',
                    'Investigation records retained',
                  ],
                },
                {
                  regulator: 'AHPRA',
                  requirements: [
                    'Mandatory reporting obligations',
                    'Impairment, intoxication, significant departure',
                    'Sexual misconduct',
                    'Written report within 30 days',
                  ],
                },
                {
                  regulator: 'TGA (Therapeutic Goods)',
                  requirements: [
                    'Adverse event reporting',
                    'Medical device incidents',
                    'Medicine quality defects',
                    'MAIC report submission',
                  ],
                },
                {
                  regulator: 'Aged Care Quality & Safety',
                  requirements: [
                    'Priority 1 incidents within 24 hours',
                    'Unexplained absence, serious injury',
                    'Reportable assaults',
                    'Incident register maintained',
                  ],
                },
                {
                  regulator: 'Privacy Commissioner',
                  requirements: [
                    'Notifiable data breaches',
                    'Serious harm or large scale',
                    'Within 30 days of awareness',
                    'Affected individuals notified',
                  ],
                },
              ].map((reg, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-card p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">
                    {reg.regulator}
                  </h3>
                  <ul className="space-y-2">
                    {reg.requirements.map((req, rIdx) => (
                      <li
                        key={rIdx}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {req}
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
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Impact"
              title="Reduce Risk, Improve Response"
              subtitle="Organizations using FormaOS for incident management"
              alignment="center"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[
                {
                  metric: 'Clear',
                  label: 'Regulatory reporting',
                  description: 'Deadline tracking and templates by request',
                },
                {
                  metric: 'Structured',
                  label: 'Investigation closure',
                  description: 'Guided process improves consistency',
                },
                {
                  metric: 'Actionable',
                  label: 'Corrective actions',
                  description: 'CAPA tracking for accountability',
                },
                {
                  metric: 'Less',
                  label: 'Manual admin',
                  description: 'Centralized workflows and templates',
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="text-center rounded-lg border border-border bg-card p-6"
                >
                  <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
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
          <SectionGlow color="purple" intensity="medium" position="bottom" />

          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Respond to incidents with{' '}
              <span className="text-gradient-system">confidence</span>
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

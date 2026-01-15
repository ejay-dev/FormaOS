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
import {
  SystemBackground,
  SectionGlow,
  SectionHeader,
} from '@/components/motion';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'NDIS & Aged Care Compliance | FormaOS',
  description:
    'Complete compliance management for NDIS providers and aged care facilities. Meet quality standards with automated worker screening, incident management, and audit readiness.',
};

export default function NDISUseCasePage() {
  return (
    <main className="relative min-h-screen">
      {/* Hero Section */}
      <SystemBackground variant="info" className="py-20 sm:py-28 lg:py-32">
        <SectionGlow color="purple" intensity="medium" position="top" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-400 mb-6">
              NDIS & Aged Care
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-gradient-system">
                NDIS Practice Standards
              </span>
              <br />
              Made Simple
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              Complete compliance solution for NDIS providers and aged care
              facilities. Meet NDIS Practice Standards and Aged Care Quality
              Standards with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup?plan=pro"
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

      {/* Core Modules Section */}
      <SystemBackground variant="info" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Core Modules"
            title="Everything You Need for NDIS Compliance"
            subtitle="Purpose-built modules for disability and aged care service providers"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Shield,
                title: 'Worker Screening',
                description:
                  'Track NDIS Worker Screening Checks, police checks, and WWCC. Automated expiry reminders ensure continuous compliance.',
              },
              {
                icon: Heart,
                title: 'Client Management',
                description:
                  'NDIS participant records, service agreements, support plans, and consent documentation. Privacy-compliant and audit-ready.',
              },
              {
                icon: AlertTriangle,
                title: 'Incident & Safeguarding',
                description:
                  'Report incidents, allegations, and safeguarding concerns. Reportable incidents to NDIS Commission with full investigation workflows.',
              },
              {
                icon: FileCheck,
                title: 'Policy & Procedures',
                description:
                  'Maintain all required NDIS Practice Standards policies. Version control, staff acknowledgment, and scheduled reviews.',
              },
              {
                icon: Users,
                title: 'Training & Competency',
                description:
                  'Track mandatory training, NDIS worker orientation, and competency assessments. CPD hours and skill development records.',
              },
              {
                icon: Award,
                title: 'Quality & Audit',
                description:
                  'Internal audits, quality improvement activities, and compliance evidence repository. Export packages for NDIS Commission audits.',
              },
            ].map((module, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors"
              >
                <module.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {module.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SystemBackground>

      {/* NDIS Practice Standards Mapping */}
      <SystemBackground variant="info" className="py-16 sm:py-20">
        <SectionGlow color="blue" intensity="low" position="center" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Practice Standards"
            title="Aligned with NDIS Practice Standards"
            subtitle="Preconfigured modules mapped to all core and supplementary practice standards"
            alignment="center"
          />

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
                category: 'Core Module: Governance and Operational Management',
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
                className="rounded-lg border border-border bg-card p-6 sm:p-8"
              >
                <h3 className="text-xl font-semibold mb-4">
                  {module.category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {module.standards.map((standard, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        {standard}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SystemBackground>

      {/* Aged Care Quality Standards */}
      <SystemBackground variant="info" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Aged Care"
            title="Aged Care Quality Standards Support"
            subtitle="Also supports Commonwealth aged care quality and safety requirements"
            alignment="center"
          />

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
                standard: 'Standard 4: Services and Supports for Daily Living',
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
                className="rounded-lg border border-border bg-card p-6"
              >
                <h3 className="text-lg font-semibold mb-4">
                  {standard.standard}
                </h3>
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

      {/* Workflows Section */}
      <SystemBackground variant="info" className="py-16 sm:py-20">
        <SectionGlow color="purple" intensity="low" position="center" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Workflows"
            title="Automated Compliance Workflows"
            subtitle="Streamline routine compliance tasks with intelligent automation"
            alignment="center"
          />

          <div className="space-y-6">
            {[
              {
                workflow: 'Reportable Incident Management',
                description:
                  'Capture incident details, classify severity, investigate with root cause analysis, implement corrective actions, report to NDIS Commission within required timeframes.',
                timeframe:
                  'Commission reporting: 24 hours (critical) / 5 days (other)',
              },
              {
                workflow: 'Worker Screening Expiry Management',
                description:
                  'Monitor NDIS Worker Screening Check expiry dates, send automated reminders at 90/60/30 days, escalate to management if renewal not received, suspend roster access on expiry.',
                timeframe: 'Automated checks: Daily',
              },
              {
                workflow: 'Service Agreement Review',
                description:
                  'Schedule service agreement reviews, notify support coordinators and participants, document agreement amendments, obtain signatures, store executed agreements.',
                timeframe: 'Review cycle: Annually or on plan change',
              },
              {
                workflow: 'Policy Review and Acknowledgment',
                description:
                  'Trigger scheduled policy reviews, stakeholder consultation, management approval, staff notification, acknowledgment tracking, evidence of currency.',
                timeframe: 'Review cycle: Annually or on regulatory change',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-card p-6 sm:p-8"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-xl font-semibold">{item.workflow}</h3>
                  <Clock className="h-6 w-6 text-primary shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {item.description}
                </p>
                <div className="inline-flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-full px-3 py-1">
                  <Clock className="h-3 w-3" />
                  {item.timeframe}
                </div>
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
            title="Real Results for NDIS & Aged Care Providers"
            subtitle="Organizations using FormaOS for NDIS and aged care compliance"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                metric: '100%',
                label: 'Incident reporting compliance',
                description: 'All reportable incidents submitted on time',
              },
              {
                metric: '90%',
                label: 'Reduction in overdue screenings',
                description: 'Automated reminders ensure renewals',
              },
              {
                metric: '5 hours',
                label: 'Weekly admin time saved',
                description: 'Per quality manager on compliance tracking',
              },
              {
                metric: '24/7',
                label: 'Audit-ready evidence',
                description: 'Export complete packages anytime',
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="text-center rounded-lg border border-border bg-card p-6"
              >
                <Award className="h-10 w-10 text-primary mx-auto mb-4" />
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
            Ready for your next{' '}
            <span className="text-gradient-system">NDIS Commission audit?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your 14-day free trial. No credit card required. Full platform
            access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup?plan=pro"
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
  );
}

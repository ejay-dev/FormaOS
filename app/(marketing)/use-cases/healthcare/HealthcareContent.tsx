'use client';

import dynamic from 'next/dynamic';
import {
  Activity,
  ClipboardCheck,
  FileCheck2,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react';
import {
  UseCasePageTemplate,
  type UseCaseChallenge,
  type UseCaseWorkflow,
  type UseCaseStandard,
  type UseCaseMetric,
} from '../components/UseCasePageTemplate';

const DemoPolicyLifecycle = dynamic(
  () => import('@/components/marketing/demo/DemoPolicyLifecycle'),
  { ssr: false },
);
const DemoComplianceScore = dynamic(
  () => import('@/components/marketing/demo/DemoComplianceScore'),
  { ssr: false },
);
const DemoCredentialTracker = dynamic(
  () => import('@/components/marketing/demo/DemoCredentialTracker'),
  { ssr: false },
);
const DemoAuditTrailCard = dynamic(
  () => import('@/components/marketing/demo/DemoAuditTrailCard'),
  { ssr: false },
);

const challenges: UseCaseChallenge[] = [
  {
    icon: ClipboardCheck,
    title: 'Fragmented policy and procedure ownership',
    description:
      'Clinical governance controls often live in disconnected tools, creating ownership blind spots and inconsistent review cadence.',
  },
  {
    icon: Stethoscope,
    title: 'Credential and registration drift',
    description:
      'Tracking AHPRA registrations, CPD, immunizations, and workforce requirements manually creates renewal risk and audit friction.',
  },
  {
    icon: ShieldAlert,
    title: 'Incident and corrective-action bottlenecks',
    description:
      'Adverse events are recorded, but follow-up actions and approvals are hard to prove end-to-end during audits.',
  },
  {
    icon: FileCheck2,
    title: 'Evidence reconstruction under pressure',
    description:
      'Audit preparation becomes a manual reconstruction exercise rather than a continuous, defensible evidence chain.',
  },
];

const workflows: UseCaseWorkflow[] = [
  {
    title: 'Clinical policy lifecycle',
    description:
      'Policies are versioned, assigned to accountable owners, and moved through review and acknowledgement workflows — with full audit trail for RACGP and NSQHS inspections.',
    steps: [
      'Map each policy to NSQHS Standards, RACGP, or Privacy Act controls',
      'Assign named owner, review due date, and escalation path',
      'Capture acknowledgements and approvals with immutable timestamps',
      'Auto-generate policy coverage report for auditors on demand',
    ],
  },
  {
    title: 'Credential and registration governance',
    description:
      'AHPRA registrations, CPD hours, immunizations, and competency certificates are monitored with automated reminder and renewal workflows.',
    steps: [
      'Track AHPRA registration expiry by practitioner and specialty',
      'Trigger renewal reminders at 90/60/30/7-day intervals',
      'Store renewal evidence with immutable timestamps and verifier sign-off',
      'Export workforce credential status for RACGP quality reviews',
    ],
  },
  {
    title: 'Incident to remediation',
    description:
      'Adverse events, near-misses, and reportable incidents route through investigation, corrective action assignment, and closure evidence — defensible for NSQHS Standard 1 and 2.',
    steps: [
      'Capture incident context, severity, and patient safety classification',
      'Assign corrective action to accountable clinical or governance lead',
      'Verify closure with sign-off evidence and root-cause documentation',
      'Export complete incident chain for AHPRA or regulator review',
    ],
  },
  {
    title: 'Privacy and data breach response',
    description:
      'Privacy Act and Notifiable Data Breach (NDB) obligations managed through structured assessment, notification, and closure workflows.',
    steps: [
      'Assess breach severity against APP and NDB scheme thresholds',
      'Document notification decisions with legal sign-off records',
      'Retain breach response evidence for Office of the Australian Information Commissioner (OAIC)',
    ],
  },
];

const standards: UseCaseStandard[] = [
  {
    name: 'AHPRA',
    description: 'Practitioner registration and professional standards — Australian Health Practitioner Regulation Agency',
    features: [
      'AHPRA registration expiry tracking by practitioner and specialty',
      'CPD hours and competency evidence capture with timestamps',
      'Supervisor sign-off records with immutable decision history',
      'Renewal reminder cadence at 90/60/30/7-day intervals',
    ],
  },
  {
    name: 'RACGP & Primary Care',
    description: 'Practice quality and governance expectations for GP and primary care settings',
    features: [
      'Clinical governance policy workflows with version control',
      'Staff acknowledgement chains and policy review evidence',
      'Quality improvement cycle documentation',
      'Audit-ready reporting packs for RACGP accreditation visits',
    ],
  },
  {
    name: 'NSQHS Standards',
    description: 'National Safety and Quality Health Service Standards — all 8 applicable standards',
    features: [
      'Standard 1 (Clinical Governance): leadership accountability and control mapping',
      'Standard 2 (Partnering with Consumers): feedback and safety workflow evidence',
      'Safety and risk incident workflows with corrective action tracking',
      'Continuous improvement evidence across all NSQHS requirements',
    ],
  },
  {
    name: 'Privacy Act 1988 & NDB',
    description: 'Australian Privacy Principles (APPs) and Notifiable Data Breach scheme obligations',
    features: [
      'Patient information access and handling control mapping',
      'Notifiable Data Breach assessment and notification workflow',
      'OAIC-ready breach response documentation and audit trail',
      'Defensible data handling evidence for regulatory inquiries',
    ],
  },
];

const metrics: UseCaseMetric[] = [
  {
    value: '< 2 hrs',
    label: 'Audit Pack Export',
    description: 'Generate framework-mapped evidence bundles without manual reconstruction — export-ready on demand.',
  },
  {
    value: '90 days',
    label: 'Renewal Lead Time',
    description: 'Automated alert windows for AHPRA, CPD, and immunization renewals — never miss an expiry.',
  },
  {
    value: '100%',
    label: 'Incident Traceability',
    description: 'Every adverse event linked from intake through corrective action to verified closure.',
  },
  {
    value: 'Real-time',
    label: 'Compliance Posture',
    description: 'Continuous coverage visibility across AHPRA, NSQHS Standards, RACGP, and Privacy Act obligations.',
  },
];

export default function HealthcareContent() {
  return (
    <UseCasePageTemplate
      badge="Healthcare Compliance"
      badgeIcon={<Activity className="h-4 w-4" />}
      title={
        <>
          Healthcare compliance that runs
          <br />
          as operational workflow
        </>
      }
      description="Run clinical policy governance, credential tracking, incident management, and safety controls in one purpose-built system — continuously audit-ready for AHPRA, NSQHS, RACGP, and Privacy Act obligations."
      challenges={challenges}
      demoTitle="Healthcare workflow simulation"
      demoDescription="Preview policy lifecycle, credential monitoring, compliance posture, and audit trail integrity."
      demoSlot={
        <>
          <DemoPolicyLifecycle glowColor="from-cyan-500/15 to-blue-500/15" />
          <DemoCredentialTracker glowColor="from-emerald-500/15 to-cyan-500/15" />
          <DemoComplianceScore glowColor="from-cyan-500/15 to-blue-500/15" />
          <DemoAuditTrailCard glowColor="from-cyan-500/15 to-emerald-500/15" />
        </>
      }
      workflows={workflows}
      standards={standards}
      metrics={metrics}
      ctaTitle="Build a healthcare compliance operating model that holds up at audit time"
      ctaDescription="Start with pre-built control frameworks mapped to AHPRA, NSQHS Standards, and the Privacy Act. Every action stays tied to accountable ownership and defensible timestamped evidence — no reconstruction required."
    />
  );
}

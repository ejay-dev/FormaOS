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
      'Policies are versioned, assigned to accountable owners, and moved through review and acknowledgement workflows.',
    steps: [
      'Map each policy to relevant standards and controls',
      'Assign owner, due date, and escalation path',
      'Capture approvals and acknowledgements automatically',
    ],
  },
  {
    title: 'Credential governance',
    description:
      'Registrations, certifications, and competency artifacts are monitored with reminder and renewal workflows.',
    steps: [
      'Track registration status by staff member',
      'Trigger reminders at 90/60/30/7-day intervals',
      'Store renewal evidence with immutable timestamps',
    ],
  },
  {
    title: 'Incident to remediation',
    description:
      'Incident reports route to investigation, corrective actions, and closure evidence in one operational trail.',
    steps: [
      'Capture incident context and severity',
      'Assign actions to accountable roles',
      'Verify closure and include in evidence exports',
    ],
  },
];

const standards: UseCaseStandard[] = [
  {
    name: 'AHPRA',
    description: 'Practitioner registration and professional standards',
    features: [
      'Registration and renewal tracking',
      'Competency and training evidence',
      'Supervisor sign-off records',
    ],
  },
  {
    name: 'RACGP / Primary Care',
    description: 'Practice quality and governance expectations',
    features: [
      'Clinical governance workflows',
      'Policy acknowledgement chains',
      'Audit-ready reporting packs',
    ],
  },
  {
    name: 'NSQHS',
    description: 'National Safety and Quality Health Service standards',
    features: [
      'Safety and risk workflows',
      'Corrective action tracking',
      'Continuous improvement evidence',
    ],
  },
  {
    name: 'Privacy Act',
    description: 'Patient information governance and accountability',
    features: [
      'Access and handling controls',
      'Breach response workflow mapping',
      'Defensible audit trail context',
    ],
  },
];

const metrics: UseCaseMetric[] = [
  {
    value: '2x',
    label: 'Faster Audits',
    description: 'Move from reconstruction to evidence-on-demand.',
  },
  {
    value: '35%',
    label: 'Less Admin',
    description: 'Reduce manual compliance coordination overhead.',
  },
  {
    value: 'Hours',
    label: 'To Evidence',
    description: 'Collect export-ready controls and artifacts quickly.',
  },
  {
    value: 'Full',
    label: 'Traceability',
    description: 'Keep a continuous chain from task to proof.',
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
      description="Run policy governance, clinical controls, credential tracking, and incident response in one system designed for continuous audit readiness."
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
      ctaTitle="Make healthcare compliance continuously audit-ready"
      ctaDescription="Start with pre-built healthcare control frameworks and adapt them to your operating model. Keep every action tied to accountable ownership and defensible evidence."
    />
  );
}

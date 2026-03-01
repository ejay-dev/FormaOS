'use client';

import dynamic from 'next/dynamic';
import {
  BadgeCheck,
  BellRing,
  FileCheck2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  UseCasePageTemplate,
  type UseCaseChallenge,
  type UseCaseWorkflow,
  type UseCaseStandard,
  type UseCaseMetric,
} from '../components/UseCasePageTemplate';

const DemoCredentialTracker = dynamic(
  () => import('@/components/marketing/demo/DemoCredentialTracker'),
  { ssr: false },
);
const DemoComplianceScore = dynamic(
  () => import('@/components/marketing/demo/DemoComplianceScore'),
  { ssr: false },
);

const challenges: UseCaseChallenge[] = [
  {
    icon: BadgeCheck,
    title: 'Credential sprawl across systems',
    description:
      'Licenses, clearances, and certifications are often tracked in fragmented spreadsheets and inbox workflows.',
  },
  {
    icon: BellRing,
    title: 'Renewal and expiry blind spots',
    description:
      'Without structured reminders and escalation, teams discover compliance risk late.',
  },
  {
    icon: Users,
    title: 'Weak ownership for workforce controls',
    description:
      'It is unclear who is accountable for approvals, evidence verification, and remediation.',
  },
  {
    icon: FileCheck2,
    title: 'Audit stress during workforce reviews',
    description:
      'Regulator and procurement checks require rapid proof of current and historical credential status.',
  },
];

const workflows: UseCaseWorkflow[] = [
  {
    title: 'Credential intake and verification',
    description:
      'Collect artifacts, validate completeness, and assign verification ownership in one workflow.',
    steps: [
      'Define required credential schema by role',
      'Capture artifact and verification status',
      'Record reviewer decision history',
    ],
  },
  {
    title: 'Renewal and escalation engine',
    description:
      'Trigger reminder cadences and escalate overdue renewals before they become high-risk gaps.',
    steps: [
      'Set policy-based renewal intervals',
      'Send reminders at configured thresholds',
      'Escalate to managers for unresolved items',
    ],
  },
  {
    title: 'Audit and assurance output',
    description:
      'Generate workforce readiness views with linked evidence and status by individual, team, or credential type.',
    steps: [
      'View live compliance posture by role',
      'Drill into artifact verification chain',
      'Export audit-ready evidence package',
    ],
  },
];

const standards: UseCaseStandard[] = [
  {
    name: 'Workforce Compliance Programs',
    description: 'Credential governance for regulated teams',
    features: [
      'Role-based credential requirements',
      'Verification and approval history',
      'Defensible renewal recordkeeping',
    ],
  },
  {
    name: 'Healthcare / Care Workforce',
    description: 'Registration, screening, and competency expectations',
    features: [
      'Expiry and renewal reminders',
      'Supervisor oversight workflows',
      'Evidence linkage to policy controls',
    ],
  },
  {
    name: 'Security and Trust Reviews',
    description: 'Buyer and regulator assurance readiness',
    features: [
      'Current status and historical traceability',
      'Control ownership visibility',
      'Exportable proof artifacts',
    ],
  },
  {
    name: 'Operational Governance',
    description: 'Leadership visibility into workforce risk posture',
    features: [
      'Gap and overdue tracking',
      'Escalation accountability',
      'Continuous readiness reporting',
    ],
  },
];

const metrics: UseCaseMetric[] = [
  {
    value: '90/60/30',
    label: 'Day Renewal Alerts',
    description: 'Automated reminder cadence — no more expiry surprises for licenses and clearances.',
  },
  {
    value: '< 2 min',
    label: 'Credential Status Check',
    description: 'Live posture view by team, role, or individual — audit-ready at any moment.',
  },
  {
    value: 'Named',
    label: 'Verifier — Always',
    description: 'Every credential item has a documented reviewer and approval decision on record.',
  },
  {
    value: '100%',
    label: 'Audit Traceability',
    description: 'Current and historical credential proof in one exportable chain — no reconstruction.',
  },
];

export default function WorkforceContent() {
  return (
    <UseCasePageTemplate
      badge="Workforce Credentials"
      badgeIcon={<ShieldCheck className="h-4 w-4" />}
      title={
        <>
          Workforce credential governance
          <br />
          with continuous audit readiness
        </>
      }
      description="Manage credential obligations, automated renewal alerts, verification workflows, and audit-ready evidence for every role — in a system built for regulated operational environments where expiry has consequences."
      challenges={challenges}
      demoTitle="Credential operations simulation"
      demoDescription="See credential lifecycle tracking and live compliance posture as obligations change."
      demoSlot={
        <>
          <DemoCredentialTracker />
          <DemoComplianceScore glowColor="from-emerald-500/15 to-cyan-500/15" />
        </>
      }
      workflows={workflows}
      standards={standards}
      metrics={metrics}
      ctaTitle="Operationalize credential compliance — with zero expiry surprises"
      ctaDescription="Replace fragmented spreadsheets and ad-hoc reminders with a governed credential system. Named owners, automated renewal cadences, and export-ready evidence for every workforce compliance review."
    />
  );
}

'use client';

import dynamic from 'next/dynamic';
import {
  ClipboardCheck,
  Heart,
  ShieldAlert,
  UserCheck,
  Users,
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
const DemoIncidentFlow = dynamic(
  () => import('@/components/marketing/demo/DemoIncidentFlow'),
  { ssr: false },
);

const challenges: UseCaseChallenge[] = [
  {
    icon: Users,
    title: 'Participant care and compliance disconnected',
    description:
      'Service delivery records and compliance controls are frequently stored in separate systems, increasing audit risk.',
  },
  {
    icon: ShieldAlert,
    title: 'Incident obligations under time pressure',
    description:
      'Reportable incidents require timely, traceable actions with clear accountability and evidence continuity.',
  },
  {
    icon: UserCheck,
    title: 'Workforce screening and credential drift',
    description:
      'Screening, training, and competency records are difficult to maintain consistently across teams.',
  },
  {
    icon: ClipboardCheck,
    title: 'Manual preparation for NDIS and aged care audits',
    description:
      'Teams spend weeks rebuilding proof sets instead of running compliance as part of daily operations.',
  },
];

const workflows: UseCaseWorkflow[] = [
  {
    title: 'Participant evidence chain',
    description:
      'Progress notes, incidents, and actions are linked to mapped controls to preserve audit context.',
    steps: [
      'Capture service and participant context',
      'Map records to relevant standards',
      'Retain sign-off and timestamp history',
    ],
  },
  {
    title: 'Incident and safeguarding response',
    description:
      'Route incidents through assessment, escalation, corrective action, and closure with full accountability.',
    steps: [
      'Classify incidents by severity',
      'Assign remediation owners and due dates',
      'Export closure evidence for inspection',
    ],
  },
  {
    title: 'Workforce and policy assurance',
    description:
      'Monitor worker screening, policy acknowledgements, and recurring obligations with reminder workflows.',
    steps: [
      'Track screening/credential expiries',
      'Trigger renewal and review reminders',
      'Store proof artifacts automatically',
    ],
  },
];

const standards: UseCaseStandard[] = [
  {
    name: 'NDIS Practice Standards',
    description: 'Core and supplementary provider obligations',
    features: [
      'Participant rights and safeguards',
      'Incident and complaints management',
      'Governance and workforce controls',
    ],
  },
  {
    name: 'Aged Care Quality Standards',
    description: 'Quality and safety expectations for aged care services',
    features: [
      'Care planning and delivery evidence',
      'Workforce capability tracking',
      'Continuous improvement workflows',
    ],
  },
  {
    name: 'Risk and Safeguarding',
    description: 'Operational controls for high-consequence environments',
    features: [
      'Escalation and response workflows',
      'Corrective action verification',
      'Traceable management approvals',
    ],
  },
  {
    name: 'Provider Governance',
    description: 'Executive and board-level accountability posture',
    features: [
      'Open obligations visibility',
      'Audit-ready control status reporting',
      'Defensible trust artifacts',
    ],
  },
];

const metrics: UseCaseMetric[] = [
  {
    value: 'Faster',
    label: 'Audit Prep',
    description: 'Reduce evidence collation lead time significantly.',
  },
  {
    value: 'Fewer',
    label: 'Control Gaps',
    description: 'Operational workflows keep obligations active daily.',
  },
  {
    value: 'Less',
    label: 'Admin Friction',
    description: 'Automate reminders and ownership tracking.',
  },
  {
    value: 'Audit-Ready',
    label: 'By Default',
    description: 'Maintain continuous proof for review events.',
  },
];

export default function NDISContent() {
  return (
    <UseCasePageTemplate
      badge="NDIS & Aged Care"
      badgeIcon={<Heart className="h-4 w-4" />}
      title={
        <>
          NDIS and aged care compliance
          <br />
          as daily operational practice
        </>
      }
      description="Apply mapped controls, ownership workflows, and evidence capture to participant-focused services where accountability is non-negotiable."
      challenges={challenges}
      demoTitle="NDIS and aged-care workflow simulation"
      demoDescription="Preview policy operations, incident response, and live compliance posture across provider obligations."
      demoSlot={
        <>
          <DemoPolicyLifecycle glowColor="from-purple-500/15 to-pink-500/15" />
          <DemoIncidentFlow glowColor="from-purple-500/15 to-red-500/15" />
          <DemoComplianceScore glowColor="from-purple-500/15 to-pink-500/15" />
        </>
      }
      workflows={workflows}
      standards={standards}
      metrics={metrics}
      ctaTitle="Build a defensible provider compliance operating model"
      ctaDescription="Start with NDIS and aged-care aligned workflows, then adapt controls and evidence rules to your service delivery model."
    />
  );
}

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
    description: 'Core module and supplementary module obligations — NDIS Quality and Safeguards Commission',
    features: [
      'Module 1 (Rights and Responsibility): participant rights controls and safeguard evidence',
      'Module 3 (Supporting Effective Transitions): incident and complaints management workflows',
      'Supplementary modules: High Intensity, Specialist Behaviour Support, Early Childhood',
      'Workforce screening records with NDIS Worker Screening Check evidence tracking',
    ],
  },
  {
    name: 'Aged Care Quality Standards',
    description: 'Aged Care Quality and Safety Commission standards — 8 standards applicable',
    features: [
      'Standard 1 (Consumer Dignity): rights and care planning evidence chain',
      'Standard 8 (Organisational Governance): board-level accountability and posture reporting',
      'Workforce capability and competency tracking across care teams',
      'Continuous improvement cycle documentation for Commission visits',
    ],
  },
  {
    name: 'Incident and Safeguarding',
    description: 'Reportable incident and safeguarding obligations under NDIS and Aged Care regimes',
    features: [
      'NDIS reportable incident classification and 24-hour initial response tracking',
      'Aged care serious incident response scheme (SIRS) workflow and evidence',
      'Corrective action assignment with named owners and verified closure',
      'Traceable management approval records for Commission review',
    ],
  },
  {
    name: 'Provider Governance',
    description: 'Executive, board, and quality management accountability expectations',
    features: [
      'Open obligation visibility for executive and quality managers',
      'Audit-ready compliance posture reports for NDIS Commission unannounced visits',
      'Continuous improvement evidence across all standards and modules',
      'Defensible trust artifacts for re-registration and renewal reviews',
    ],
  },
];

const metrics: UseCaseMetric[] = [
  {
    value: '< 24 hr',
    label: 'Incident Response',
    description: 'Reportable incidents routed with named owner and SLA target — within hours of intake.',
  },
  {
    value: '4 hrs',
    label: 'Audit Preparation',
    description: 'vs. weeks of manual reconstruction — evidence packs ready on demand for NDIS Commission visits.',
  },
  {
    value: 'Named',
    label: 'Owner — Always',
    description: 'Every control, participant record, and obligation has a traceable accountable owner.',
  },
  {
    value: 'Zero',
    label: 'Credential Gaps',
    description: 'Renewal engine eliminates expiry surprises for NDIS worker screening requirements.',
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
      description="Apply mapped NDIS Practice Standards controls, named ownership workflows, and continuous evidence capture to participant-focused services where accountability is non-negotiable and auditors arrive unannounced."
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
      ctaTitle="Build a provider compliance operating model auditors can verify — not just review"
      ctaDescription="Start with NDIS Practice Standards-aligned workflows, then adapt controls and evidence rules to your service delivery model. Full defensibility from governance board to participant record."
    />
  );
}

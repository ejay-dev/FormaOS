'use client';

import dynamic from 'next/dynamic';
import {
  AlertOctagon,
  Building2,
  FileCheck2,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import {
  UseCasePageTemplate,
  type UseCaseChallenge,
  type UseCaseWorkflow,
  type UseCaseStandard,
  type UseCaseMetric,
} from '../components/UseCasePageTemplate';

const DemoComplianceScore = dynamic(
  () => import('@/components/marketing/demo/DemoComplianceScore'),
  { ssr: false },
);
const DemoAuditTrailCard = dynamic(
  () => import('@/components/marketing/demo/DemoAuditTrailCard'),
  { ssr: false },
);

const challenges: UseCaseChallenge[] = [
  {
    icon: Landmark,
    title: 'Controls exist, but ownership drifts',
    description:
      'Financial services teams often have documented controls without a consistently enforced accountability model across operations.',
  },
  {
    icon: AlertOctagon,
    title: 'Incidents trigger manual reconstruction',
    description:
      'Regulator and board requests create pressure to rebuild timelines, approvals, and remediation evidence from scattered systems.',
  },
  {
    icon: Building2,
    title: 'Vendor and internal assurance stay fragmented',
    description:
      'Third-party reviews, procurement evidence, and internal control attestations rarely sit in one defensible workflow.',
  },
  {
    icon: FileCheck2,
    title: 'Audit readiness depends on project sprints',
    description:
      'Preparation spikes around audits because control evidence is not generated continuously as teams work.',
  },
] as const;

const workflows: UseCaseWorkflow[] = [
  {
    title: 'Control ownership and attestation',
    description:
      'Convert control libraries into named work with review cadences, evidence requirements, and attestation checkpoints.',
    steps: [
      'Map controls to business owners, reviewers, and due dates',
      'Require evidence submission before attestation completion',
      'Escalate overdue or failed controls to risk and leadership',
      'Preserve approval history for each attestation cycle',
    ],
  },
  {
    title: 'Incident, breach, and remediation chain',
    description:
      'Link incidents directly to corrective actions, decision records, and export-ready regulator evidence.',
    steps: [
      'Capture incident intake with severity and obligation mapping',
      'Assign remediation owners and countdown-based due dates',
      'Record review decisions and closure sign-off evidence',
      'Export incident chronology for regulator and board review',
    ],
  },
  {
    title: 'Vendor assurance and procurement evidence',
    description:
      'Keep third-party assessments, control exceptions, and security review artifacts in a single governed path.',
    steps: [
      'Track vendor questionnaires and supporting evidence by supplier',
      'Tie exceptions to risk treatment actions and owners',
      'Retain signed approvals and review notes alongside each vendor record',
      'Package evidence for procurement, legal, and risk committees on demand',
    ],
  },
] as const;

const standards: UseCaseStandard[] = [
  {
    name: 'SOC 2 / ISO 27001',
    description: 'Cross-mapped control programs for security and operational compliance.',
    features: [
      'Control ownership with recurring attestations',
      'Evidence chains linked to individual controls',
      'Reviewer sign-off records and export bundles',
      'Gap visibility and escalation history',
    ],
  },
  {
    name: 'ASIC / APRA',
    description: 'Regulator-facing evidence for reportable situations and information-security obligations.',
    features: [
      'Incident chronology with accountable owners',
      'Control-drift and remediation evidence',
      'Board-ready summaries and exportable artifacts',
      'Third-party assurance documentation linked to decisions',
    ],
  },
  {
    name: 'Vendor Risk & Procurement',
    description: 'Assurance workflows for suppliers, partners, and internal review committees.',
    features: [
      'Vendor questionnaire tracking and evidence review',
      'Exception workflows with named approvers',
      'Procurement packet assembly from governed artifacts',
      'Historical auditability of supplier decisions',
    ],
  },
] as const;

const metrics: UseCaseMetric[] = [
  {
    value: 'Continuous',
    label: 'Control Posture',
    description: 'Control execution and evidence status stay current instead of spiking before audit windows.',
  },
  {
    value: '< 30 min',
    label: 'Evidence Export',
    description: 'Prepare regulator or buyer evidence packages without manual reconstruction.',
  },
  {
    value: 'Named',
    label: 'Owners & Reviewers',
    description: 'Every control and remediation step resolves to accountable people and timestamps.',
  },
  {
    value: 'Board-ready',
    label: 'Assurance View',
    description: 'Status, exceptions, and remediation trails can be reviewed by leadership at any time.',
  },
] as const;

export default function FinancialServicesContent() {
  return (
    <UseCasePageTemplate
      badge="Financial Services"
      badgeIcon={<ShieldCheck className="h-4 w-4" />}
      title={
        <>
          Financial services compliance
          <br />
          with accountable execution
        </>
      }
      description="Run control ownership, attestations, incidents, and vendor assurance in one governed operating system so readiness is visible before regulators, buyers, or the board ask for proof."
      challenges={challenges}
      demoTitle="Financial controls workflow"
      demoDescription="Preview live posture scoring and an immutable audit trail for control reviews and remediation."
      demoSlot={
        <>
          <DemoComplianceScore glowColor="from-cyan-500/15 to-blue-500/15" />
          <DemoAuditTrailCard glowColor="from-amber-500/15 to-cyan-500/15" />
        </>
      }
      workflows={workflows}
      standards={standards}
      metrics={metrics}
      industryKey="financial_services"
      ctaTitle="Move from control documentation to control truth"
      ctaDescription="Give risk, compliance, and operations a shared system for ownership, evidence, remediation, and procurement proof - without separate spreadsheet programs."
    />
  );
}

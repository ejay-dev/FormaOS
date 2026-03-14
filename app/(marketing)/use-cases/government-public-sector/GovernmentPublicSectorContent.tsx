'use client';

import dynamic from 'next/dynamic';
import {
  Archive,
  BookCheck,
  Building2,
  ShieldCheck,
  Stamp,
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
const DemoAuditTrailCard = dynamic(
  () => import('@/components/marketing/demo/DemoAuditTrailCard'),
  { ssr: false },
);

const challenges: UseCaseChallenge[] = [
  {
    icon: Stamp,
    title: 'Approval chains are hard to reconstruct',
    description:
      'Government teams need defensible decision records, but approvals often live across email, documents, and ticketing tools.',
  },
  {
    icon: Archive,
    title: 'Records and evidence governance stay fragmented',
    description:
      'Retention decisions, control evidence, and policy acknowledgements frequently sit in different systems with weak traceability.',
  },
  {
    icon: Building2,
    title: 'Cross-team accountability is unclear',
    description:
      'Program, security, policy, and procurement teams all contribute to compliance, but ownership rarely stays visible end to end.',
  },
  {
    icon: BookCheck,
    title: 'Audit and review cycles create manual work',
    description:
      'Internal review, procurement scrutiny, and external oversight often force teams into reactive document assembly.',
  },
] as const;

const workflows: UseCaseWorkflow[] = [
  {
    title: 'Policy and approval lifecycle',
    description:
      'Track drafting, review, approval, publication, and acknowledgement in one governed chain with named approvers and timestamps.',
    steps: [
      'Assign policy owners and approval authorities',
      'Capture reviewer comments and revision history',
      'Require approval sign-off before publication',
      'Retain acknowledgement evidence for downstream audits',
    ],
  },
  {
    title: 'Records-backed control evidence',
    description:
      'Keep decisions, supporting records, and control artifacts attached so evidence survives public-sector scrutiny.',
    steps: [
      'Store supporting evidence alongside each control or policy action',
      'Maintain timestamps, reviewers, and status changes',
      'Preserve export-ready evidence bundles for review teams',
      'Show historical snapshots of who approved what and when',
    ],
  },
  {
    title: 'Procurement and assurance review',
    description:
      'Organize vendor assessments, internal approvals, and security review materials without starting a separate workstream.',
    steps: [
      'Collect supplier and internal assurance artifacts in one workflow',
      'Assign risk, legal, and procurement reviewers explicitly',
      'Track exceptions and remediation commitments with owners',
      'Export decision-ready packs for governance committees',
    ],
  },
] as const;

const standards: UseCaseStandard[] = [
  {
    name: 'PSPF / ISM / Essential Eight',
    description: 'Security and control governance for public-sector programs and digital services.',
    features: [
      'Policy and control approval chains with immutable history',
      'Evidence and remediation artifacts linked to each control',
      'Role-based visibility for reviewers and approvers',
      'Exportable snapshots for assurance and oversight',
    ],
  },
  {
    name: 'FOI / Records Accountability',
    description: 'Decision and document governance that supports defensible retrieval and review.',
    features: [
      'Documented decision chronology',
      'Linked evidence and supporting records',
      'Retention-aware governance workflows',
      'Review-ready export bundles',
    ],
  },
  {
    name: 'Procurement & Vendor Assurance',
    description: 'Structured internal review for supplier risk and contract assurance.',
    features: [
      'Supplier assessment workflows with named approvers',
      'Exception and remediation tracking',
      'Shared review history across risk, legal, and procurement',
      'Board- and committee-ready evidence packages',
    ],
  },
] as const;

const metrics: UseCaseMetric[] = [
  {
    value: 'Single chain',
    label: 'Decision History',
    description: 'Approvals, comments, evidence, and exports stay attached to the same governed record.',
  },
  {
    value: '< 1 hr',
    label: 'Review Pack Prep',
    description: 'Assemble oversight and procurement artifacts without chasing multiple systems.',
  },
  {
    value: 'Named',
    label: 'Approvers',
    description: 'Every policy, exception, and review step resolves to an accountable authority.',
  },
  {
    value: 'Always-on',
    label: 'Governance Readiness',
    description: 'Teams can answer audit and review questions without launching a separate preparation sprint.',
  },
] as const;

export default function GovernmentPublicSectorContent() {
  return (
    <UseCasePageTemplate
      badge="Government & Public Sector"
      badgeIcon={<ShieldCheck className="h-4 w-4" />}
      title={
        <>
          Government governance workflows
          <br />
          with defensible accountability
        </>
      }
      description="Run policy approvals, records-backed evidence, and procurement assurance in one governed operating system so oversight, audit, and review teams can verify real decision history on demand."
      challenges={challenges}
      demoTitle="Governance workflow simulation"
      demoDescription="See policy lifecycle steps and audit trail integrity in a public-sector governance context."
      demoSlot={
        <>
          <DemoPolicyLifecycle glowColor="from-cyan-500/15 to-emerald-500/15" />
          <DemoAuditTrailCard glowColor="from-cyan-500/15 to-amber-500/15" />
        </>
      }
      workflows={workflows}
      standards={standards}
      metrics={metrics}
      industryKey="government_public_sector"
      ctaTitle="Give oversight teams proof that survives scrutiny"
      ctaDescription="Replace fragmented approval trails with a single governed workflow for policies, evidence, procurement reviews, and export-ready oversight artifacts."
    />
  );
}

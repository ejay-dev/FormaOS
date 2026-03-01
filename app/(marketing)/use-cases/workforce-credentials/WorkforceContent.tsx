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
      'Collect artifacts, validate completeness, and assign verification ownership in one governed workflow — from initial hire through ongoing role changes.',
    steps: [
      'Define required credential schema by role, site, and regulatory jurisdiction (AHPRA, NDIS, SafeWork)',
      'Capture credential artifacts: registration certificates, clearance letters, training records, and photo ID',
      'Validate completeness against role-specific requirements — block assignment to regulated roles until all credentials are verified',
      'Assign named verifier for each credential with segregation of duties (verifier cannot be the credential holder)',
      'Record reviewer decision history: approved, rejected with reason, or pending further documentation',
      'Link verified credentials to the individual\'s compliance profile with tamper-evident timestamps',
    ],
  },
  {
    title: 'Renewal and escalation engine',
    description:
      'Trigger reminder cadences and escalate overdue renewals before they become high-risk gaps — with automatic role-restriction for expired credentials.',
    steps: [
      'Set policy-based renewal intervals per credential type: annual AHPRA, biennial WWC, 3-year first aid',
      'Send automated reminders at 90, 60, 30, 14, and 7 days before expiry to the credential holder and their manager',
      'Escalate unresolved renewals to department heads and compliance leads at configurable thresholds',
      'Automatically flag expired credentials and restrict the individual from rostering in regulated roles',
      'Track renewal evidence submission: new certificate uploaded, verifier assigned, approval recorded',
      'Generate weekly credential expiry dashboard for compliance officers showing upcoming, overdue, and critical gaps',
    ],
  },
  {
    title: 'Audit and assurance output',
    description:
      'Generate workforce readiness views with linked evidence and verification status by individual, team, site, or credential type — audit-ready at any moment.',
    steps: [
      'View live compliance posture by role, team, site, or business unit with red/amber/green status indicators',
      'Drill into any individual\'s credential chain: artifact → verifier → decision → timestamp → linked control',
      'Filter by credential type across the entire workforce: who holds current AHPRA, who has expired WWC, who lacks WHS induction',
      'Export audit-ready evidence packages for NDIS Commission quality reviews, AHPRA audits, or procurement assessments',
      'Generate historical compliance snapshots: prove who was credentialed at any point in time for retrospective audits',
    ],
  },
  {
    title: 'Contractor and locum credential onboarding',
    description:
      'Apply the same credential governance to short-term contractors, locums, and agency staff — ensuring temporary workers meet the same regulatory standards as permanent employees.',
    steps: [
      'Define contractor-specific credential requirements by engagement type: locum doctor, agency support worker, IT contractor',
      'Capture and verify credentials before the contractor\'s first shift — block rostering until all requirements are met',
      'Track agency-supplied credential evidence separately with source attribution (agency-verified vs self-declared)',
      'Set engagement-end date triggers: archive credentials, revoke system access, and generate exit compliance summary',
      'Maintain full contractor credential history for retrospective audits even after engagement ends',
    ],
  },
];

const standards: UseCaseStandard[] = [
  {
    name: 'AHPRA & Health Practitioner Regulation',
    description: 'Australian Health Practitioner Regulation Agency — registration, CPD, and scope-of-practice obligations',
    features: [
      'AHPRA registration expiry tracking by practitioner, profession, and specialty',
      'CPD hour and competency evidence capture with immutable timestamps',
      'Supervisor sign-off workflows for provisional and limited registrations',
      'Renewal reminder cadence at 90/60/30/7-day intervals with escalation',
    ],
  },
  {
    name: 'NDIS Worker Screening',
    description: 'NDIS Worker Screening Check and state-based Working With Children Check requirements',
    features: [
      'NDIS Worker Screening Check status tracking per employee and contractor',
      'State-based WWC Check expiry monitoring (VIC, NSW, QLD, SA, WA, TAS)',
      'Clearance-to-role mapping ensuring only screened workers in risk-assessed roles',
      'Audit-ready screening status export for NDIS Commission quality reviews',
    ],
  },
  {
    name: 'ISO 27001 / SOC 2 Competency',
    description: 'Information security competency and awareness requirements under Annex A.7 and SOC 2 CC1.4',
    features: [
      'Security awareness training completion tracking per employee and role',
      'Annual competency assessment evidence with verifier sign-off records',
      'Role-based access prerequisite validation (training → access grant)',
      'Exportable competency matrix for SOC 2 Type II and ISO 27001 auditors',
    ],
  },
  {
    name: 'SafeWork & WHS Inductions',
    description: 'Work Health and Safety induction, licensing, and high-risk work credentials',
    features: [
      'High-risk work licence tracking (forklift, scaffolding, crane, rigging)',
      'Site-specific WHS induction completion records with expiry dates',
      'SafeWork NSW / WorkSafe VIC credential alignment and gap detection',
      'Contractor credential verification workflows with evidence chain',
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

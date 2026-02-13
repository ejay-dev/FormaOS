'use client';

import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  ClipboardList,
  Clock3,
  FileSearch,
  ShieldCheck,
} from 'lucide-react';
import {
  UseCasePageTemplate,
  type UseCaseChallenge,
  type UseCaseWorkflow,
  type UseCaseStandard,
  type UseCaseMetric,
} from '../components/UseCasePageTemplate';

const DemoIncidentFlow = dynamic(
  () => import('@/components/marketing/demo/DemoIncidentFlow'),
  { ssr: false },
);
const DemoAuditTrailCard = dynamic(
  () => import('@/components/marketing/demo/DemoAuditTrailCard'),
  { ssr: false },
);

const challenges: UseCaseChallenge[] = [
  {
    icon: AlertTriangle,
    title: 'Inconsistent intake and severity triage',
    description:
      'Incident quality varies across teams, making prioritization and escalation unreliable.',
  },
  {
    icon: Clock3,
    title: 'Delayed investigation and closure',
    description:
      'Actions are tracked in multiple places, slowing investigation timelines and executive visibility.',
  },
  {
    icon: ClipboardList,
    title: 'Weak corrective-action accountability',
    description:
      'Remediation ownership and due dates are often unclear, creating repeat incidents and unresolved risk.',
  },
  {
    icon: FileSearch,
    title: 'Audit pressure during major events',
    description:
      'Regulator and customer requests trigger manual reconstruction of timelines, approvals, and outcomes.',
  },
];

const workflows: UseCaseWorkflow[] = [
  {
    title: 'Intake and risk classification',
    description:
      'Route incidents through standardized intake, severity assignment, and escalation paths.',
    steps: [
      'Capture who/what/when context at intake',
      'Apply severity rules and escalation routing',
      'Notify responsible leads with SLA targets',
    ],
  },
  {
    title: 'Investigation and remediation',
    description:
      'Assign root-cause analysis and corrective actions to accountable owners with explicit due dates.',
    steps: [
      'Document investigation findings',
      'Create and track corrective actions',
      'Escalate overdue items automatically',
    ],
  },
  {
    title: 'Closure and audit package',
    description:
      'Finalize incidents with sign-off evidence and export-ready reporting for auditors and governance teams.',
    steps: [
      'Record resolution outcomes and approvals',
      'Link closure to policy/control updates',
      'Export complete event chain for review',
    ],
  },
];

const standards: UseCaseStandard[] = [
  {
    name: 'ISO 27001 / SOC 2',
    description: 'Security and operational incident governance',
    features: [
      'Structured incident response workflow',
      'Corrective-action ownership tracking',
      'Immutable audit trail for evidence',
    ],
  },
  {
    name: 'Healthcare / Safety Regimes',
    description: 'Operational incident capture and remediation controls',
    features: [
      'Severity-based escalation matrix',
      'Risk and mitigation logging',
      'Management sign-off workflow',
    ],
  },
  {
    name: 'Internal Governance',
    description: 'Board and executive reporting expectations',
    features: [
      'Open/overdue incident dashboards',
      'Trend and recurrence reporting',
      'Decision-grade evidence exports',
    ],
  },
  {
    name: 'Customer Assurance',
    description: 'External trust and transparency requirements',
    features: [
      'Defensible incident chronology',
      'Ownership and approval history',
      'Regulator/customer-ready narrative',
    ],
  },
];

const metrics: UseCaseMetric[] = [
  {
    value: 'Clear',
    label: 'Ownership',
    description: 'Every incident action has a named owner and due date.',
  },
  {
    value: 'Structured',
    label: 'Escalation',
    description: 'High-risk events route quickly to accountable leaders.',
  },
  {
    value: 'Actionable',
    label: 'Insights',
    description: 'Trends and root causes become visible in real time.',
  },
  {
    value: 'Less',
    label: 'Manual Work',
    description: 'Reduce spreadsheet coordination and follow-up overhead.',
  },
];

export default function IncidentContent() {
  return (
    <UseCasePageTemplate
      badge="Incident Management"
      badgeIcon={<ShieldCheck className="h-4 w-4" />}
      title={
        <>
          Incident response with
          <br />
          defensible operational evidence
        </>
      }
      description="Coordinate intake, triage, investigation, corrective action, and closure in one incident system that stays audit-ready by design."
      challenges={challenges}
      demoTitle="Incident workflow simulation"
      demoDescription="Follow incident lifecycle state changes and see how closure evidence is preserved."
      demoSlot={
        <>
          <DemoIncidentFlow />
          <DemoAuditTrailCard glowColor="from-amber-500/15 to-rose-500/15" />
        </>
      }
      workflows={workflows}
      standards={standards}
      metrics={metrics}
      ctaTitle="Run incidents as accountable operations"
      ctaDescription="Move from reactive reporting to structured response workflows with provable remediation history."
    />
  );
}

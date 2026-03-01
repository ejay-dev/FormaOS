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
      'Route incidents through standardized intake, severity assignment, and escalation paths — with structured context capture from the first moment.',
    steps: [
      'Capture who, what, when, where, and affected-party context at intake using structured forms',
      'Apply severity classification rules: critical (immediate regulator notification), high (24-hour SLA), medium, low',
      'Route to named incident lead based on incident type, business unit, and escalation matrix',
      'Notify responsible leads and backup escalation contacts with SLA countdown timers',
      'Attach initial evidence (photos, screenshots, witness statements) with tamper-evident timestamps',
      'Flag reportable incidents for SIRS, SafeWork, ASIC, or APRA notification workflows automatically',
    ],
  },
  {
    title: 'Investigation and remediation',
    description:
      'Assign root-cause analysis and corrective actions to accountable owners with explicit due dates, decision records, and linked evidence at every stage.',
    steps: [
      'Document investigation findings with structured root-cause analysis (5-Why, fishbone, or timeline method)',
      'Create corrective actions with named owners, due dates, priority levels, and required evidence types',
      'Link each corrective action to the originating control gap or policy deficiency',
      'Track remediation progress with automatic status updates and overdue escalation to management',
      'Record investigation decisions: who approved the finding, when, and with what authority',
      'Attach remediation evidence (updated procedures, training records, system changes) to close the loop',
    ],
  },
  {
    title: 'Closure and audit package',
    description:
      'Finalize incidents with multi-party sign-off, lessons-learned capture, and export-ready reporting for auditors, regulators, and governance teams.',
    steps: [
      'Record resolution outcomes with verifier sign-off and segregation of duties enforcement',
      'Capture lessons learned and link to policy or procedure updates triggered by the incident',
      'Generate regulator-ready incident chronology: intake → investigation → actions → closure with full timestamps',
      'Export complete evidence chain as a packaged audit bundle (PDF or structured data) in under 2 minutes',
      'Update control registers and risk assessments to reflect incident outcomes and residual risk',
    ],
  },
  {
    title: 'Cross-framework incident classification',
    description:
      'Map a single incident to every applicable framework and regulator obligation — so one event triggers the right reporting, evidence, and corrective workflows across all jurisdictions.',
    steps: [
      'Classify the incident against all mapped frameworks simultaneously (ISO 27001, WHS, SIRS, APRA, ASIC)',
      'Identify reportable-incident thresholds per framework: 24-hour SIRS, immediate SafeWork, 30-day ASIC',
      'Generate framework-specific notification templates pre-populated with incident context',
      'Track notification deadlines per regulator with countdown alerts and named responsible officers',
      'Produce per-framework evidence bundles so each regulator receives only the documentation they require',
    ],
  },
];

const standards: UseCaseStandard[] = [
  {
    name: 'ISO 27001 / SOC 2',
    description: 'Information security incident management — Annex A.16 and SOC 2 CC7/CC8 controls',
    features: [
      'Structured incident response aligned to Annex A.16.1 requirements',
      'Corrective-action ownership with Annex A.16.1.5 root-cause analysis',
      'Immutable audit trail for SOC 2 CC7.4 and CC7.5 evidence',
      'Post-incident review documentation for continual improvement (A.16.1.6)',
    ],
  },
  {
    name: 'WHS Act & SafeWork',
    description: 'Work Health and Safety Act 2011 — notifiable incident and SafeWork reporting obligations',
    features: [
      'Notifiable incident classification per WHS Act s35–37 (death, serious injury, dangerous incident)',
      'SafeWork notification evidence with timestamps and decision records',
      'Corrective action tracking for PCBU duty-of-care obligations',
      'Incident trend reporting for WHS committee and board governance reviews',
    ],
  },
  {
    name: 'NDIS / SIRS',
    description: 'NDIS Serious Incident Response Scheme — reportable incident obligations under the NDIS Commission',
    features: [
      'SIRS reportable incident intake aligned to NDIS (Incident Management and Reportable Incidents) Rules 2018',
      'Severity classification and 24-hour / 5-day notification workflow',
      'Investigation and corrective action records for NDIS Commission review',
      'Quarterly SIRS report generation with linked evidence chains',
    ],
  },
  {
    name: 'ASIC / APRA',
    description: 'Financial services incident reporting — ASIC breach reporting and APRA CPS 234 obligations',
    features: [
      'ASIC reportable situation classification and notification timelines',
      'APRA CPS 234 material information security incident reporting',
      'Board-ready incident summary with decision and escalation history',
      'Defensible incident chronology for regulator inquiry and external audit',
    ],
  },
];

const metrics: UseCaseMetric[] = [
  {
    value: '< 4 hr',
    label: 'Triage to Owner',
    description: 'High-severity incidents routed to a named, accountable owner within hours of intake.',
  },
  {
    value: '100%',
    label: 'Action Traceability',
    description: 'Every corrective action has a named owner, due date, and verified closure evidence.',
  },
  {
    value: 'Export-ready',
    label: 'Evidence Chain',
    description: 'Regulator and customer evidence packages generated without manual timeline reconstruction.',
  },
  {
    value: '< 30 min',
    label: 'Regulator Response',
    description: 'Incident chronology with full approval and decision history exported on demand.',
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
      description="Coordinate intake, triage, investigation, corrective action, and closure in one incident system with named ownership, timestamped evidence, and regulator-ready export — audit-ready by design, not by sprint."
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
      ctaTitle="Run incidents as accountable operations — with proof that holds under scrutiny"
      ctaDescription="Replace reactive reporting with structured response workflows. Every incident gets a named owner, documented investigation, and closure evidence — ready for regulators, customers, or the board in minutes."
    />
  );
}

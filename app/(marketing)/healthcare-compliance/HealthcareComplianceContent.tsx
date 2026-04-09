'use client';

import {
  AlertTriangle,
  Clock,
  FileWarning,
  ShieldAlert,
  UserX,
  Bell,
  Shield,
  Users,
  FileCheck,
  Stethoscope,
  ClipboardList,
  Activity,
} from 'lucide-react';
import {
  IndustryHero,
  PainPointsGrid,
  FrameworkCoverage,
  HowItWorks,
  IndustryFeatures,
  SocialProof,
  IndustryCTA,
  IndustryFAQ,
  InteractiveDashboard,
} from '@/components/marketing/industry';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { VisualDivider } from '@/components/motion';

/* ── Interactive Dashboard visual ────────────────────── */

function HealthcareDashboardVisual() {
  return (
    <InteractiveDashboard
      title="AHPRA Registration Status"
      subtitle="Practitioner Register"
      tabs={[
        { id: 'all', label: 'All Practitioners', count: 5 },
        { id: 'expiring', label: 'Credential Alerts', count: 2 },
        { id: 'nsqhs', label: 'NSQHS Tracker', count: 8 },
      ]}
      statusCounts={[
        { label: 'Current', count: 3, color: 'green' },
        { label: 'Expiring', count: 1, color: 'amber' },
        { label: 'Expired', count: 1, color: 'red' },
      ]}
      columns={[
        { key: 'practitioner', label: 'Practitioner' },
        { key: 'profession', label: 'Profession', hideOnMobile: true },
        { key: 'status', label: 'AHPRA' },
        { key: 'cpd', label: 'CPD Hours', hideOnMobile: true },
      ]}
      rows={[
        {
          id: 'p1',
          status: 'green',
          cells: {
            practitioner: 'Dr Sarah Mitchell',
            profession: 'Medical Practitioner',
            status: 'Current',
            cpd: '42 / 50 hrs',
          },
          expandedContent: {
            label: 'Practitioner Details',
            items: [
              { key: 'AHPRA Number', value: 'MED0001234567' },
              { key: 'Indemnity Expiry', value: '18 Nov 2027' },
              { key: 'Specialty', value: 'General Practice' },
              { key: 'CPD Deadline', value: '30 Sep 2026' },
            ],
          },
        },
        {
          id: 'p2',
          status: 'green',
          cells: {
            practitioner: 'James Nguyen',
            profession: 'Registered Nurse',
            status: 'Current',
            cpd: '18 / 20 hrs',
          },
          expandedContent: {
            label: 'Practitioner Details',
            items: [
              { key: 'AHPRA Number', value: 'NMW0001987654' },
              { key: 'Indemnity Expiry', value: '03 Jun 2027' },
              { key: 'Division', value: 'Registered Nurse (Div 1)' },
              { key: 'CPD Deadline', value: '31 May 2026' },
            ],
          },
        },
        {
          id: 'p3',
          status: 'amber',
          cells: {
            practitioner: 'Dr Priya Sharma',
            profession: 'Dentist',
            status: 'Expiring',
            cpd: '12 / 60 hrs',
          },
          expandedContent: {
            label: 'Practitioner Details — REVIEW',
            items: [
              { key: 'AHPRA Number', value: 'DEN0001456789' },
              { key: 'Registration Expiry', value: '22 May 2026' },
              { key: 'CPD Gap', value: '48 hrs behind schedule' },
              { key: 'Alert Status', value: '90-day and 60-day alerts sent' },
            ],
          },
        },
        {
          id: 'p4',
          status: 'red',
          cells: {
            practitioner: "Michael O'Brien",
            profession: 'Physiotherapist',
            status: 'Expired',
            cpd: '5 / 20 hrs',
          },
          expandedContent: {
            label: 'Practitioner Details — ACTION REQUIRED',
            items: [
              { key: 'AHPRA Number', value: 'PHY0001876543' },
              { key: 'Expired', value: '39 days ago' },
              { key: 'Action', value: 'Renewal application pending' },
              {
                key: 'Practice Status',
                value: 'Suspended from clinical duties',
              },
            ],
          },
        },
        {
          id: 'p5',
          status: 'green',
          cells: {
            practitioner: 'Lisa Chen',
            profession: 'Pharmacist',
            status: 'Current',
            cpd: '38 / 40 hrs',
          },
          expandedContent: {
            label: 'Practitioner Details',
            items: [
              { key: 'AHPRA Number', value: 'PHA0001654321' },
              { key: 'Indemnity Expiry', value: '14 Sep 2027' },
              { key: 'Pharmacy', value: 'Main Campus Dispensary' },
              { key: 'CPD Deadline', value: '30 Sep 2026' },
            ],
          },
        },
      ]}
      notifications={[
        {
          message: 'Dr Priya Sharma — AHPRA registration expiring in 43 days',
          time: '1 hour ago',
          type: 'alert',
        },
        {
          message: "Michael O'Brien — registration expired, practice suspended",
          time: '2 days ago',
          type: 'alert',
        },
        {
          message: 'Lisa Chen — CPD hours on track (38/40)',
          time: '5 days ago',
          type: 'success',
        },
      ]}
      exportLabel="Export Register"
    />
  );
}

/* ── Feature visuals ─────────────────────────────────── */

function FeatureVisual({
  label,
  rows,
}: {
  label: string;
  rows: { k: string; v: string; status?: string }[];
}) {
  return (
    <div className="p-5 space-y-3">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.k}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
          >
            <span className="text-xs text-white">{r.k}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{r.v}</span>
              {r.status && (
                <span
                  className={`h-2 w-2 rounded-full ${
                    r.status === 'green'
                      ? 'bg-emerald-500'
                      : r.status === 'amber'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main content ────────────────────────────────────── */

export default function HealthcareComplianceContent() {
  return (
    <MarketingPageShell>
      <IndustryHero
        eyebrow="AHPRA + NSQHS Compliance"
        headline={
          <>
            AHPRA Audits Don&apos;t Wait.
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Neither Should You.
            </span>
          </>
        }
        subheadline="AHPRA registrations, NSQHS accreditation, and credential expiry across 16 health professions. FormaOS keeps audit-ready evidence continuous."
        primaryCta={{ label: 'Start Free Trial', href: '/auth/signup' }}
        secondaryCta={{ label: 'See Healthcare Demo', href: '/contact' }}
        trustSignals={[
          'AU-hosted by default',
          '14-day free trial',
          'No credit card required',
          'AHPRA credential tracking',
        ]}
        dashboardVisual={<HealthcareDashboardVisual />}
      />

      <VisualDivider />

      <PainPointsGrid
        headline="The Healthcare Compliance Reality"
        subheadline="These are the risks that keep healthcare compliance officers awake at night."
        painPoints={[
          {
            icon: <UserX className="h-5 w-5" />,
            title:
              'AHPRA registration lapses discovered only at point of service delivery',
            description:
              'A practitioner with a lapsed AHPRA registration is practising unlawfully. When lapses are discovered at the point of care, patient safety is compromised and your organisation faces serious regulatory consequences.',
          },
          {
            icon: <Clock className="h-5 w-5" />,
            title:
              'CPD hours not tracked — practitioners non-compliant at annual audit',
            description:
              'Each AHPRA-regulated profession has different CPD requirements. Without centralised tracking, practitioners fall behind on hours and your organisation cannot demonstrate workforce competency at audit.',
          },
          {
            icon: <FileWarning className="h-5 w-5" />,
            title:
              'NSQHS accreditation cycles causing last-minute evidence scrambles',
            description:
              'NSQHS accreditation visits assess all 8 standards simultaneously. Organisations that rely on manual evidence collection spend weeks assembling documentation that should be continuously maintained.',
          },
          {
            icon: <AlertTriangle className="h-5 w-5" />,
            title:
              'Adverse events not documented to clinical governance standards',
            description:
              'Clinical incidents require structured documentation, root cause analysis, and escalation workflows. Informal reporting leads to incomplete records and governance failures.',
          },
          {
            icon: <ShieldAlert className="h-5 w-5" />,
            title: 'Privacy Act NDB notifications missed or late',
            description:
              'The Notifiable Data Breaches scheme requires notification to the OAIC and affected individuals within strict timeframes. Missing these windows exposes your organisation to enforcement action and reputational harm.',
          },
          {
            icon: <Bell className="h-5 w-5" />,
            title:
              'Clinical governance framework evidence scattered across departments',
            description:
              'Clinical governance evidence lives in ward folders, shared drives, email threads, and departmental systems. When accreditation assessors arrive, pulling a coherent evidence trail is a manual nightmare.',
          },
        ]}
      />

      <VisualDivider />

      <FrameworkCoverage
        headline="Every Healthcare Framework. Pre-Built."
        description="FormaOS ships with every major Australian healthcare regulatory framework pre-loaded. Your obligations are mapped from day one — no manual setup required."
        frameworks={[
          {
            name: 'NSQHS Standards',
            body: 'Australian Commission on Safety and Quality in Health Care (ACSQHC)',
            obligationCount: '350+',
            areas: [
              'Clinical Governance',
              'Partnering with Consumers',
              'Preventing and Controlling Healthcare-Associated Infections',
              'Medication Safety',
              'Comprehensive Care',
              'Communicating for Safety',
              'Blood Management',
              'Recognising and Responding to Acute Deterioration',
            ],
          },
          {
            name: 'AHPRA Registration Obligations',
            body: 'Australian Health Practitioner Regulation Agency',
            obligationCount: '200+',
            areas: [
              'Registration renewal and currency',
              'CPD requirements per profession',
              'Professional indemnity insurance',
              'Recency of practice requirements',
              'Criminal history declarations',
              'Mandatory notifications',
            ],
          },
          {
            name: 'Privacy Act 1988 — NDB Scheme',
            body: 'Office of the Australian Information Commissioner (OAIC)',
            obligationCount: '80+',
            areas: [
              'Notifiable Data Breaches scheme',
              'Australian Privacy Principles',
              'Health records handling',
              'Patient consent management',
            ],
          },
          {
            name: 'Clinical Governance Framework',
            body: 'ACSQHC / State Health Departments',
            obligationCount: '150+',
            areas: [
              'Clinical incident management',
              'Credentialing and scope of practice',
              'Mortality and morbidity review',
              'Open disclosure',
              'Consumer feedback and complaints',
              'Clinical audit and effectiveness',
            ],
          },
          {
            name: 'RACGP Standards (4th Edition)',
            body: 'Royal Australian College of General Practitioners',
            obligationCount: '120+',
            areas: [
              'Communication and patient participation',
              'Rights and needs of patients',
              'Comprehensiveness of care',
              'Coordination of care',
              'Education and training',
              'Practice management',
            ],
          },
        ]}
      />

      <VisualDivider />

      <HowItWorks />

      <VisualDivider />

      <IndustryFeatures
        headline="Purpose-Built for Healthcare Organisations"
        subheadline="Every feature designed around real healthcare compliance workflows — not generic task management."
        features={[
          {
            title: 'Practitioner Register',
            description:
              'Track AHPRA registration status, CPD hours progress, and professional indemnity insurance expiry for every practitioner across all 16 AHPRA-regulated professions. One dashboard for your entire workforce.',
            details: [
              'AHPRA registration status and renewal tracking per practitioner',
              'CPD hours progress against profession-specific requirements',
              'Professional indemnity insurance expiry monitoring',
              'Scope of practice and credentialing documentation',
            ],
            visual: (
              <FeatureVisual
                label="Practitioner Status"
                rows={[
                  {
                    k: 'Dr S. Mitchell — Medical',
                    v: '42 / 50 CPD hrs',
                    status: 'green',
                  },
                  {
                    k: 'J. Nguyen — Nursing',
                    v: '18 / 20 CPD hrs',
                    status: 'green',
                  },
                  {
                    k: 'Dr P. Sharma — Dental',
                    v: '12 / 60 CPD hrs',
                    status: 'amber',
                  },
                  {
                    k: "M. O'Brien — Physio",
                    v: 'AHPRA Expired',
                    status: 'red',
                  },
                ]}
              />
            ),
          },
          {
            title: 'NSQHS Standards Tree',
            description:
              'Navigate all 8 NSQHS standards with criterion-level completion tracking. Attach evidence directly to each action item and monitor coverage across your entire organisation.',
            details: [
              'All 8 NSQHS standards with full criterion hierarchy',
              'Criterion-level completion percentage tracking',
              'Evidence attachment per action item',
              'Gap analysis showing missing evidence per standard',
            ],
            visual: (
              <FeatureVisual
                label="NSQHS Standards Coverage"
                rows={[
                  {
                    k: 'Standard 1: Clinical Governance',
                    v: '96% complete',
                    status: 'green',
                  },
                  {
                    k: 'Standard 2: Partnering with Consumers',
                    v: '91% complete',
                    status: 'green',
                  },
                  {
                    k: 'Standard 3: Infection Prevention',
                    v: '78% complete',
                    status: 'amber',
                  },
                  {
                    k: 'Standard 5: Comprehensive Care',
                    v: '100% complete',
                    status: 'green',
                  },
                ]}
              />
            ),
          },
          {
            title: 'Adverse Event Pipeline',
            description:
              'Clinical governance escalation workflow for adverse events. Structured intake, investigation, root cause analysis, and NDB notification timer for privacy breaches — every step timestamped and evidence-linked.',
            details: [
              'Structured adverse event intake with severity classification',
              'Clinical governance escalation workflow',
              'NDB notification countdown timer for eligible breaches',
              'Root cause analysis and corrective action tracking',
            ],
            visual: (
              <div className="p-5 space-y-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Adverse Event Pipeline
                </div>
                {[
                  'Reported',
                  'Under Investigation',
                  'Root Cause Analysis',
                  'NDB Notified',
                  'Closed',
                ].map((stage, i) => (
                  <div key={stage} className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                        i < 4
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-white/[0.06] text-slate-500 border border-white/[0.08]'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`text-xs ${i < 4 ? 'text-white' : 'text-slate-500'}`}
                    >
                      {stage}
                    </span>
                    {i < 4 && (
                      <span className="text-[10px] text-emerald-500 ml-auto">
                        Complete
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ),
          },
          {
            title: 'Credential Expiry Alerts',
            description:
              'Automatic alerts at 90, 60, and 30 days before AHPRA registration, indemnity insurance, or CPD deadline expiry. Escalation paths ensure no credential lapses silently.',
            details: [
              'Configurable alert windows at 90, 60, and 30 days before expiry',
              'AHPRA registration, indemnity insurance, and CPD deadline tracking',
              'Escalation paths from practitioner to line manager to compliance lead',
              'Bulk renewal tracking dashboard',
            ],
            visual: (
              <FeatureVisual
                label="Upcoming Expiries"
                rows={[
                  {
                    k: 'Dr P. Sharma — AHPRA Rego',
                    v: '43 days remaining',
                    status: 'amber',
                  },
                  {
                    k: "M. O'Brien — Indemnity",
                    v: 'Expired 9 days ago',
                    status: 'red',
                  },
                  {
                    k: 'L. Chen — CPD Deadline',
                    v: '87 days remaining',
                    status: 'green',
                  },
                  {
                    k: 'J. Nguyen — AHPRA Rego',
                    v: '214 days remaining',
                    status: 'green',
                  },
                ]}
              />
            ),
          },
          {
            title: 'Accreditation Evidence Pack',
            description:
              'One-click evidence pack generation structured to NSQHS standards. When accreditation assessors arrive, your evidence is already organised — not being assembled from shared drives and inboxes.',
            details: [
              'One-click export organised by NSQHS standard and criterion',
              'Evidence completeness scoring before export',
              'PDF evidence pack with table of contents and cross-references',
              'Gap analysis report highlighting missing evidence per standard',
            ],
            visual: (
              <FeatureVisual
                label="Accreditation Evidence Pack"
                rows={[
                  {
                    k: 'NSQHS Standard 1: Clinical Governance',
                    v: '96% complete',
                    status: 'green',
                  },
                  {
                    k: 'NSQHS Standard 3: Infection Prevention',
                    v: '78% complete',
                    status: 'amber',
                  },
                  {
                    k: 'NSQHS Standard 4: Medication Safety',
                    v: '100% complete',
                    status: 'green',
                  },
                  {
                    k: 'NSQHS Standard 8: Acute Deterioration',
                    v: '94% complete',
                    status: 'green',
                  },
                ]}
              />
            ),
          },
        ]}
      />

      <VisualDivider />

      <SocialProof
        metricsBanner={[
          '95+ routes',
          '206+ tables with RLS',
          'AU-hosted by default',
          'SOC 2 in progress',
        ]}
        trustCards={[
          {
            persona: 'Hospital Group, 400+ practitioners across 3 campuses',
            need: 'AHPRA credential tracking and NSQHS evidence management across all departments with zero manual reconciliation',
            delivers:
              'Automated practitioner register, credential expiry alerts, NSQHS standards tree with evidence attachment, and one-click accreditation evidence packs',
          },
          {
            persona: 'GP Practice Network, 25 clinics',
            need: 'RACGP accreditation readiness and CPD tracking for GPs, nurses, and allied health staff across all sites',
            delivers:
              'Pre-built RACGP standards framework, centralised CPD tracking per profession, and accreditation-ready evidence export for every clinic',
          },
          {
            persona: 'Allied Health Network, 80+ practitioners',
            need: 'AHPRA registration monitoring across physiotherapy, occupational therapy, psychology, and speech pathology',
            delivers:
              'Multi-profession credential dashboard, profession-specific CPD rules, indemnity insurance tracking, and 90/60/30-day expiry escalation paths',
          },
        ]}
        regulatoryBodies={[
          { name: 'AHPRA', icon: <Stethoscope className="h-4 w-4" /> },
          { name: 'ACSQHC', icon: <Shield className="h-4 w-4" /> },
          { name: 'OAIC', icon: <FileCheck className="h-4 w-4" /> },
        ]}
      />

      <VisualDivider />

      <IndustryCTA industry="Healthcare" />

      <VisualDivider />

      <IndustryFAQ
        industry="Healthcare"
        faqs={[
          {
            question:
              'Does FormaOS track AHPRA registration for all 16 regulated professions?',
            answer:
              'Yes. FormaOS supports all 16 AHPRA-regulated health professions — including medical practitioners, nurses and midwives, dentists, pharmacists, physiotherapists, psychologists, optometrists, osteopaths, chiropractors, podiatrists, Chinese medicine practitioners, occupational therapists, medical radiation practitioners, Aboriginal and Torres Strait Islander health practitioners, paramedicine practitioners, and speech pathologists. Each profession has its own CPD requirements and renewal cycles, all tracked automatically.',
          },
          {
            question: 'How does FormaOS help with NSQHS accreditation?',
            answer:
              'FormaOS maps all 8 NSQHS standards with full criterion-level detail. Evidence is attached to specific actions as your team completes them, so accreditation readiness is continuous — not a pre-visit scramble. When assessors arrive, you generate a structured evidence pack in one click, organised by standard and criterion.',
          },
          {
            question: 'Can FormaOS track CPD hours for different professions?',
            answer:
              'Yes. Each AHPRA-regulated profession has unique CPD requirements — different hour thresholds, activity types, and audit cycles. FormaOS tracks CPD hours per practitioner against their profession-specific requirements, with alerts when practitioners fall behind pace for their annual cycle.',
          },
          {
            question:
              'Does FormaOS support Notifiable Data Breach (NDB) notifications?',
            answer:
              'Yes. FormaOS includes an NDB notification workflow aligned with the Privacy Act 1988 Notifiable Data Breaches scheme. When a data breach is identified, the platform tracks assessment, OAIC notification, and affected individual notification within the required timeframes.',
          },
          {
            question:
              'How does FormaOS handle clinical governance requirements?',
            answer:
              'FormaOS provides structured workflows for clinical incident management, credentialing and scope of practice, mortality and morbidity review, open disclosure, consumer feedback, and clinical audit. All evidence is linked to NSQHS Standard 1 (Clinical Governance) for accreditation readiness.',
          },
          {
            question:
              'Does FormaOS help with Privacy Act compliance for health records?',
            answer:
              'Yes. FormaOS maps Privacy Act 1988 obligations including the Australian Privacy Principles, health records handling requirements, patient consent management, and the Notifiable Data Breaches scheme. Evidence of compliance is captured continuously and linked to the relevant privacy framework controls.',
          },
          {
            question: "Is my organisation's data stored in Australia?",
            answer:
              'Yes. FormaOS is AU-hosted by default. All patient data, practitioner records, evidence, and compliance documentation remain on Australian infrastructure. Your data never leaves Australia.',
          },
        ]}
      />
    </MarketingPageShell>
  );
}

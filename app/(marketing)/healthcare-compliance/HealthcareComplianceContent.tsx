'use client';

import { RelatedIndustries } from '@/components/marketing/RelatedIndustries';
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
  Monitor,
  FileText,
} from 'lucide-react';
import {
  IndustryHero,
  IndustryFeatures,
  SocialProof,
  IndustryCTA,
  IndustryFAQ,
  InteractiveDashboard,
  BeforeAfterSection,
  FrameworkExplorer,
  VerticalTimeline,
  HeroStatsBar,
  CompareTable,
  SeeItInAction,
  DemoDashboardContent,
  DemoAuditExport,
  DemoNotificationTimeline,
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
            practitioner: 'Michael O’Brien',
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
          message: 'Michael O’Brien — registration expired, practice suspended',
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
        accent="cyan-violet"
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
        statsBar={
          <HeroStatsBar
            stats={[
              '1,204 practitioners tracked',
              '8/8 NSQHS Standards covered',
              'Zero evidence gaps at accreditation',
              'AU-hosted',
            ]}
          />
        }
      />

      <VisualDivider />

      <BeforeAfterSection
        headline="The Healthcare Compliance Gap"
        subheadline="The difference between scrambling and being accreditation-ready."
        without={[
          'AHPRA registration lapse discovered at point of care — practitioner practising unlawfully for 39 days',
          'NSQHS accreditation evidence assembled in a 3-week sprint — critical gaps found 48 hours before visit',
          'CPD hours untracked across 4 departments — 12 practitioners non-compliant at annual audit',
          'Adverse event documentation incomplete — clinical governance review cannot proceed',
        ]}
        withFormaOS={[
          'Automatic AHPRA expiry alerts 90/60/30 days before lapse — no practitioner slips through',
          'Continuous evidence chain across all 8 NSQHS Standards — accreditation-ready every day',
          'CPD hours tracked per profession with progress dashboards and gap alerts',
          'Structured adverse event workflows with root cause analysis and open disclosure tracking',
        ]}
      />

      <CompareTable
        headline="FormaOS vs. The Status Quo"
        description="See how purpose-built healthcare compliance software compares."
        rows={[
          {
            feature: 'NSQHS Standards pre-built',
            spreadsheets: 'no',
            genericGrc: 'partial',
            formaos: 'yes',
          },
          {
            feature: 'AHPRA credential tracking',
            spreadsheets: 'no',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'CPD hours monitoring',
            spreadsheets: 'no',
            genericGrc: 'partial',
            formaos: 'yes',
          },
          {
            feature: 'Accreditation-ready export',
            spreadsheets: 'no',
            genericGrc: 'partial',
            formaos: 'yes',
          },
          {
            feature: 'Named ownership per obligation',
            spreadsheets: 'no',
            genericGrc: 'yes',
            formaos: 'yes',
          },
          {
            feature: 'Immutable evidence chain',
            spreadsheets: 'no',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'AU data residency',
            spreadsheets: 'no',
            genericGrc: 'partial',
            formaos: 'yes',
          },
          {
            feature: 'Clinical governance workflows',
            spreadsheets: 'no',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'Onboarding time',
            spreadsheets: 'Weeks',
            genericGrc: 'Days',
            formaos: 'Hours',
          },
          {
            feature: 'Price',
            spreadsheets: 'Hidden',
            genericGrc: '$$$+',
            formaos: 'From $159/mo',
          },
        ]}
      />

      <VisualDivider />

      <FrameworkExplorer
        headline="Every Healthcare Framework. Pre-Built."
        description="FormaOS ships with every major Australian healthcare regulatory framework pre-loaded. Your obligations are mapped from day one — no manual setup required."
        frameworks={[
          {
            id: 'nsqhs',
            name: 'NSQHS Standards',
            body: 'Australian Commission on Safety and Quality in Health Care (ACSQHC)',
            updated: '2025-11-01',
            obligationCount: '350',
            categories: [
              { name: 'Clinical Governance', pct: 98 },
              { name: 'Partnering with Consumers', pct: 96 },
              {
                name: 'Preventing and Controlling Healthcare-Associated Infections',
                pct: 100,
              },
              { name: 'Medication Safety', pct: 97 },
              { name: 'Comprehensive Care', pct: 95 },
              { name: 'Communicating for Safety', pct: 98 },
              { name: 'Blood Management', pct: 100 },
              {
                name: 'Recognising and Responding to Acute Deterioration',
                pct: 96,
              },
            ],
            requirements: [
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
            id: 'ahpra',
            name: 'AHPRA Registration Obligations',
            body: 'Australian Health Practitioner Regulation Agency',
            updated: '2026-01-15',
            obligationCount: '200',
            categories: [
              { name: 'Registration renewal and currency', pct: 100 },
              { name: 'CPD requirements per profession', pct: 95 },
              { name: 'Professional indemnity insurance', pct: 100 },
              { name: 'Recency of practice requirements', pct: 92 },
              { name: 'Criminal history declarations', pct: 98 },
              { name: 'Mandatory notifications', pct: 96 },
            ],
            requirements: [
              'Registration renewal and currency',
              'CPD requirements per profession',
              'Professional indemnity insurance',
              'Recency of practice requirements',
              'Criminal history declarations',
              'Mandatory notifications',
            ],
          },
          {
            id: 'privacy-act',
            name: 'Privacy Act 1988 — NDB Scheme',
            body: 'Office of the Australian Information Commissioner (OAIC)',
            updated: '2025-09-20',
            obligationCount: '80',
            categories: [
              { name: 'Notifiable Data Breaches scheme', pct: 100 },
              { name: 'Australian Privacy Principles', pct: 96 },
              { name: 'Health records handling', pct: 94 },
              { name: 'Patient consent management', pct: 92 },
            ],
            requirements: [
              'Notifiable Data Breaches scheme',
              'Australian Privacy Principles',
              'Health records handling',
              'Patient consent management',
            ],
          },
          {
            id: 'clinical-governance',
            name: 'Clinical Governance Framework',
            body: 'ACSQHC / State Health Departments',
            updated: '2025-12-10',
            obligationCount: '150',
            categories: [
              { name: 'Clinical incident management', pct: 97 },
              { name: 'Credentialing and scope of practice', pct: 95 },
              { name: 'Mortality and morbidity review', pct: 93 },
              { name: 'Open disclosure', pct: 98 },
              { name: 'Consumer feedback and complaints', pct: 96 },
              { name: 'Clinical audit and effectiveness', pct: 94 },
            ],
            requirements: [
              'Clinical incident management',
              'Credentialing and scope of practice',
              'Mortality and morbidity review',
              'Open disclosure',
              'Consumer feedback and complaints',
              'Clinical audit and effectiveness',
            ],
          },
          {
            id: 'racgp',
            name: 'RACGP Standards (4th Edition)',
            body: 'Royal Australian College of General Practitioners',
            updated: '2025-08-05',
            obligationCount: '120',
            categories: [
              { name: 'Communication and patient participation', pct: 96 },
              { name: 'Rights and needs of patients', pct: 98 },
              { name: 'Comprehensiveness of care', pct: 94 },
              { name: 'Coordination of care', pct: 95 },
              { name: 'Education and training', pct: 97 },
              { name: 'Practice management', pct: 93 },
            ],
            requirements: [
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

      <VerticalTimeline
        steps={[
          {
            number: '01',
            title: 'Connect Your Healthcare Obligations',
            description:
              'FormaOS ships with NSQHS Standards, AHPRA registration requirements, and clinical governance frameworks pre-built. Select your service type and your obligation register is live in minutes.',
            gradient:
              'from-cyan-500/20 to-violet-500/20 border-cyan-500/30 text-cyan-300',
            visual: (
              <FeatureVisual
                label="Framework Activation"
                rows={[
                  {
                    k: 'NSQHS Standards (8 Standards)',
                    v: 'Activated',
                    status: 'green',
                  },
                  {
                    k: 'AHPRA Registration Obligations',
                    v: 'Activated',
                    status: 'green',
                  },
                  {
                    k: 'Clinical Governance Framework',
                    v: 'Activated',
                    status: 'green',
                  },
                  {
                    k: 'Privacy Act 1988 — NDB Scheme',
                    v: 'Activated',
                    status: 'green',
                  },
                ]}
              />
            ),
          },
          {
            number: '02',
            title: 'Map Evidence to Every Standard',
            description:
              'Upload clinical governance documents, credentials, training records. FormaOS links each to specific NSQHS standards and AHPRA requirements — building continuous evidence chains.',
            gradient:
              'from-violet-500/20 to-cyan-500/20 border-violet-500/30 text-violet-300',
            visual: (
              <FeatureVisual
                label="Evidence Mapping"
                rows={[
                  {
                    k: 'Standard 1: Clinical Governance',
                    v: '42 evidence items',
                    status: 'green',
                  },
                  {
                    k: 'Standard 3: Infection Prevention',
                    v: '35 evidence items',
                    status: 'green',
                  },
                  {
                    k: 'AHPRA Practitioner Register',
                    v: '5 practitioners linked',
                    status: 'green',
                  },
                  {
                    k: 'Standard 5: Comprehensive Care',
                    v: '22 evidence items',
                    status: 'amber',
                  },
                ]}
              />
            ),
          },
          {
            number: '03',
            title: 'Stay Accreditation-Ready Every Day',
            description:
              'Automated alerts for every credential expiry, CPD deadline, and evidence gap. When accreditation assessors arrive, your evidence pack is one click away.',
            gradient:
              'from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 text-emerald-300',
            visual: (
              <FeatureVisual
                label="Readiness Score"
                rows={[
                  { k: 'Overall NSQHS Readiness', v: '96%', status: 'green' },
                  { k: 'AHPRA Credentials Current', v: '4/5', status: 'amber' },
                  { k: 'CPD Compliance Rate', v: '88%', status: 'green' },
                  {
                    k: 'Evidence Pack Status',
                    v: 'Ready to export',
                    status: 'green',
                  },
                ]}
              />
            ),
          },
        ]}
      />

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
                    k: 'M. O’Brien — Physio',
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
                    k: 'M. O’Brien — Indemnity',
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

      <SeeItInAction
        tabs={[
          {
            id: 'dashboard',
            label: 'Healthcare Dashboard',
            icon: <Monitor className="h-4 w-4" />,
            content: (
              <DemoDashboardContent
                title="Healthcare Compliance Overview"
                rows={[
                  {
                    label: 'NSQHS Standard 1 — Clinical Governance',
                    value: '96%',
                    status: 'green',
                  },
                  {
                    label: 'NSQHS Standard 2 — Partnering with Consumers',
                    value: '94%',
                    status: 'green',
                  },
                  {
                    label: 'AHPRA Practitioner Register',
                    value: '4/5 current',
                    status: 'amber',
                  },
                  {
                    label: 'CPD Compliance Rate',
                    value: '88%',
                    status: 'amber',
                  },
                  {
                    label: 'Clinical Incidents — Open',
                    value: '3 active',
                    status: 'amber',
                  },
                  {
                    label: 'Privacy Act — NDB Register',
                    value: 'Nil breaches',
                    status: 'green',
                  },
                ]}
              />
            ),
          },
          {
            id: 'audit',
            label: 'Audit Export',
            icon: <FileText className="h-4 w-4" />,
            content: (
              <DemoAuditExport
                sections={[
                  {
                    name: 'Standard 1 — Clinical Governance',
                    score: '96%',
                    items: 42,
                  },
                  {
                    name: 'Standard 2 — Partnering with Consumers',
                    score: '94%',
                    items: 28,
                  },
                  {
                    name: 'Standard 3 — Infection Prevention',
                    score: '100%',
                    items: 35,
                  },
                  {
                    name: 'Standard 5 — Comprehensive Care',
                    score: '91%',
                    items: 22,
                  },
                  {
                    name: 'Practitioner Credential Register',
                    score: '95%',
                    items: 56,
                  },
                ]}
              />
            ),
          },
          {
            id: 'notifications',
            label: 'Adverse Event Flow',
            icon: <Bell className="h-4 w-4" />,
            content: (
              <DemoNotificationTimeline
                steps={[
                  {
                    time: 'T+0:00',
                    label: 'Clinical incident logged by ward nurse',
                    status: 'complete',
                  },
                  {
                    time: 'T+0:30',
                    label:
                      'Clinical governance team notified — SAC rating assigned',
                    status: 'complete',
                  },
                  {
                    time: 'T+2:00',
                    label:
                      'Investigation commenced — root cause analysis initiated',
                    status: 'complete',
                  },
                  {
                    time: 'T+24:00',
                    label: 'Open disclosure meeting with patient/family',
                    status: 'active',
                  },
                  {
                    time: 'T+72:00',
                    label: 'Corrective action plan drafted and assigned',
                    status: 'pending',
                  },
                  {
                    time: 'T+30d',
                    label:
                      'Follow-up review — action plan effectiveness assessed',
                    status: 'pending',
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
          '206+ tables with row-level security',
          'AU-hosted by default — data never leaves Australia',
          'Zero evidence gaps at audit — immutable chain',
          'SOC 2 compliance in progress',
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

      <IndustryCTA
        industry="Healthcare"
        urgencyCallout="NSQHS accreditation cycles don't pause. Your evidence chain shouldn't either."
      />

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
            question: 'How long does setup take for a healthcare organisation?',
            answer:
              'Most healthcare organisations are fully operational within hours, not weeks. FormaOS ships with NSQHS Standards, AHPRA registration obligations, Privacy Act requirements, and clinical governance frameworks pre-built. You select your service type, invite your compliance team, and your obligation register is live. Practitioner records can be bulk-imported from existing spreadsheets or HR systems.',
          },
          {
            question: 'Can FormaOS integrate with existing clinical systems?',
            answer:
              'FormaOS provides a REST API and webhook infrastructure for integration with clinical systems, HR platforms, and credentialing databases. Practitioner data can be synchronised from existing systems, and compliance events can be pushed to your clinical governance dashboards. The platform also supports bulk CSV import for initial data migration.',
          },
          {
            question: 'What happens when NSQHS Standards are updated?',
            answer:
              'When the Australian Commission on Safety and Quality in Health Care updates NSQHS Standards, FormaOS pushes framework updates automatically. New criteria are added to your obligation register, existing evidence mappings are preserved, and gap analysis highlights any new requirements that need attention — so you are never caught off guard by standard revisions.',
          },
        ]}
      />
      <RelatedIndustries currentSlug="healthcare-compliance" />
    </MarketingPageShell>
  );
}

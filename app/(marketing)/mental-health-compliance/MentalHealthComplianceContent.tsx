'use client';

import { RelatedIndustries } from '@/components/marketing/RelatedIndustries';
import { SectionMedia } from '@/components/marketing/SectionMedia';
import {
  compliancePlanHref,
  demoHref,
  PUBLIC_CTA_LABELS,
} from '@/lib/marketing/cta';
import { Bell, Monitor, FileText } from 'lucide-react';
import {
  IndustryHero,
  IndustryFeatures,
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

/* ── Interactive Dashboard visual ────────────────────── */

function MentalHealthDashboardVisual() {
  return (
    <InteractiveDashboard
      title="Worker Screening Status"
      subtitle="Clinical & Support Worker Register"
      industry="Mental Health Services"
      tabs={[
        { id: 'all', label: 'All Workers', count: 5 },
        { id: 'expiring', label: 'Expiring Soon', count: 1 },
        { id: 'incidents', label: 'Incident Watch', count: 3 },
      ]}
      statusCounts={[
        { label: 'Valid', count: 3, color: 'green' },
        { label: 'Expiring', count: 1, color: 'amber' },
        { label: 'Expired', count: 1, color: 'red' },
      ]}
      columns={[
        { key: 'worker', label: 'Worker' },
        { key: 'role', label: 'Role', hideOnMobile: true },
        { key: 'status', label: 'Status' },
        { key: 'expiry', label: 'Expiry', hideOnMobile: true },
      ]}
      rows={[
        {
          id: 'w1',
          status: 'green',
          cells: {
            worker: 'Min Park',
            role: 'Mental Health Clinician',
            status: 'Valid',
            expiry: '14 Mar 2027',
          },
          expandedContent: {
            label: 'Worker Details',
            items: [
              { key: 'State', value: 'SA' },
              { key: 'Check Type', value: 'Worker Screening + Police Check' },
              { key: 'Last Verified', value: '12 Jan 2026' },
              { key: 'Sites', value: 'Adelaide CBD' },
            ],
          },
        },
        {
          id: 'w2',
          status: 'amber',
          cells: {
            worker: 'Aaron Hassan',
            role: 'Team Leader',
            status: 'Expiring',
            expiry: '22 Apr 2026',
          },
          expandedContent: {
            label: 'Worker Details',
            items: [
              { key: 'State', value: 'VIC' },
              { key: 'Check Type', value: 'Worker Screening + Police Check' },
              { key: 'Days Until Expiry', value: '13 days' },
              { key: 'Alert Sent', value: '90, 60, 30 day alerts sent' },
            ],
          },
        },
        {
          id: 'w3',
          status: 'green',
          cells: {
            worker: 'Maria Lopez',
            role: 'Peer Support Worker',
            status: 'Valid',
            expiry: '08 Sep 2027',
          },
          expandedContent: {
            label: 'Worker Details',
            items: [
              { key: 'State', value: 'QLD' },
              { key: 'Check Type', value: 'Worker Screening + Police Check' },
              { key: 'Last Verified', value: '05 Mar 2026' },
              { key: 'Sites', value: 'Brisbane North' },
            ],
          },
        },
        {
          id: 'w4',
          status: 'red',
          cells: {
            worker: 'Marcus Tan',
            role: 'Clinical Psychologist',
            status: 'Expired',
            expiry: '01 Feb 2026',
          },
          expandedContent: {
            label: 'Worker Details - ACTION REQUIRED',
            items: [
              { key: 'State', value: 'NSW' },
              { key: 'Check Type', value: 'Worker Screening + Police Check' },
              { key: 'Expired', value: '67 days ago' },
              { key: 'Action', value: 'Renewal application submitted' },
            ],
          },
        },
        {
          id: 'w5',
          status: 'green',
          cells: {
            worker: 'Anika Sharma',
            role: 'Support Worker',
            status: 'Valid',
            expiry: '30 Nov 2027',
          },
          expandedContent: {
            label: 'Worker Details',
            items: [
              { key: 'State', value: 'WA' },
              { key: 'Check Type', value: 'Worker Screening + Police Check' },
              { key: 'Last Verified', value: '18 Feb 2026' },
              { key: 'Sites', value: 'Perth Metro' },
            ],
          },
        },
      ]}
      notifications={[
        {
          message: 'Aaron Hassan screening expires in 13 days',
          time: '2 hours ago',
          type: 'alert',
        },
        {
          message: 'Marcus Tan screening expired - renewal pending',
          time: '1 day ago',
          type: 'alert',
        },
        {
          message: 'Min Park screening verified successfully',
          time: '3 days ago',
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
      <div>
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </div>
        <div className="mt-0.5 text-[9px] text-slate-600">
          Illustrative · sample data
        </div>
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

export default function MentalHealthComplianceContent() {
  return (
    <MarketingPageShell>
      <div className="relative isolate overflow-hidden">
        <SectionMedia
          src="/marketing-media/ndis-compliance-system.jpg"
          objectPosition="50% 35%"
          opacity={0.5}
          scrim="center"
        />
        <IndustryHero
          eyebrow="National Standards for Mental Health Services"
          headline={
            <>
              Defensible Compliance for
              <br />
              <span className="text-foreground">Mental Health Services</span>
            </>
          }
          subheadline="Operationalise the National Standards for Mental Health Services — consumer rights, restrictive-practice governance and incidents, continuously evidenced."
          primaryCta={{
            label: PUBLIC_CTA_LABELS.compliancePlan,
            href: compliancePlanHref('mental_health'),
          }}
          secondaryCta={{
            label: PUBLIC_CTA_LABELS.seeDemo,
            href: demoHref('mental_health'),
          }}
          trustSignals={[
            'AU-hosted by default',
            'Assessment-led onboarding',
            'Compliance plan scoped by framework',
            'NSMHS aligned',
          ]}
          dashboardVisual={<MentalHealthDashboardVisual />}
          statsBar={
            <HeroStatsBar
              stats={[
                'NSMHS standards pre-built',
                'Restrictive practices register',
                'Worker screening automated',
                'AU-hosted',
              ]}
            />
          }
          jurisdictionBadges={[
            { label: 'National Standards for Mental Health Services' },
            { label: 'Reportable Incidents' },
            { label: 'Restrictive Practices' },
          ]}
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <BeforeAfterSection
        headline="The Mental Health Compliance Gap"
        subheadline="The difference between reconstructing evidence and being review-ready."
        without={[
          'Reviewers request consumer-rights and complaints evidence - scattered across shared drives, email, and spreadsheets',
          'Worker screening check expired weeks ago - discovered only when the register is requested',
          'A reportable incident not escalated within required timeframes - exposure to enforcement and harm',
          'Seclusion or restraint applied without current authorisation - no documented review on file',
        ]}
        withFormaOS={[
          'Continuous evidence chain across every NSMHS standard - review-ready export in one click',
          'Automatic screening expiry alerts at 90, 60, and 30 days - zero workers operating without clearance',
          'Reportable-incident workflow with notification timers and submission status tracking',
          'Restrictive practices register linked to authorisations and scheduled review cycles',
        ]}
      />

      <CompareTable
        headline="FormaOS vs. The Status Quo"
        description="See how purpose-built mental health compliance software compares."
        col2Label="Care Software"
        rows={[
          {
            feature: 'NSMHS standards pre-built',
            spreadsheets: 'no',
            genericGrc: 'partial',
            formaos: 'yes',
          },
          {
            feature: 'Worker screening tracking',
            spreadsheets: 'no',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'Reportable incident workflow',
            spreadsheets: 'no',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'Review-ready export',
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
            feature: 'Restrictive practices register',
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
            formaos: 'from $297/mo',
          },
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <FrameworkExplorer
        headline="Mental Health Frameworks. Pre-Built."
        description="FormaOS ships with the National Standards for Mental Health Services pre-loaded, alongside the supporting registers mental health providers rely on. Your obligations are mapped from day one - no manual setup required."
        frameworks={[
          {
            id: 'nsmhs',
            name: 'National Standards for Mental Health Services',
            body: 'Australian Health Ministers',
            updated: '2025-11-01',
            obligationCount: '10 standards',
            categories: [
              { name: 'Rights and responsibilities', pct: 98 },
              { name: 'Safety', pct: 96 },
              { name: 'Consumer and carer participation', pct: 95 },
              { name: 'Diversity responsiveness', pct: 94 },
              { name: 'Promotion and prevention', pct: 96 },
              { name: 'Consumers', pct: 97 },
              { name: 'Carers', pct: 95 },
              { name: 'Governance, leadership and management', pct: 99 },
              { name: 'Integration', pct: 93 },
              { name: 'Delivery of care', pct: 96 },
            ],
            requirements: [
              'Rights and responsibilities',
              'Safety',
              'Consumer and carer participation',
              'Diversity responsiveness',
              'Promotion and prevention',
              'Consumers and carers',
              'Governance, leadership and management',
              'Integration and delivery of care',
            ],
          },
          {
            id: 'restrictive-practices',
            name: 'Restrictive Practices Oversight',
            body: 'Service Governance',
            updated: '2026-01-10',
            obligationCount: 'Register + reviews',
            categories: [
              { name: 'Authorisation documentation', pct: 100 },
              { name: 'Seclusion and restraint logging', pct: 96 },
              { name: 'Minimisation and review cycles', pct: 94 },
              { name: 'Reporting and oversight', pct: 98 },
            ],
            requirements: [
              'Authorisation documentation per consumer',
              'Seclusion and restraint event logging',
              'Minimisation strategies and review cycles',
              'Reporting and governance oversight',
            ],
          },
          {
            id: 'reportable-incidents',
            name: 'Reportable Incidents',
            body: 'Service Governance',
            updated: '2026-01-10',
            obligationCount: 'Pipeline',
            categories: [
              { name: 'Incident capture and triage', pct: 100 },
              { name: 'Investigation and root cause', pct: 94 },
              { name: 'Notification and submission tracking', pct: 96 },
              { name: 'Corrective action and closure', pct: 98 },
            ],
            requirements: [
              'Incident capture and triage',
              'Investigation and root cause analysis',
              'Notification with submission tracking',
              'Corrective action tracking and closure',
            ],
          },
          {
            id: 'worker-screening',
            name: 'Worker Screening Requirements',
            body: 'State and Territory Screening Units',
            updated: '2025-11-20',
            obligationCount: 'Per worker',
            categories: [
              { name: 'Worker screening by state', pct: 100 },
              { name: 'Police check validation', pct: 98 },
              { name: 'Professional registration', pct: 96 },
              { name: 'Continuous monitoring', pct: 95 },
            ],
            requirements: [
              'Worker screening clearance by state',
              'National Police Check validation',
              'Professional registration where applicable',
              'Continuous monitoring of clearance status',
            ],
          },
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <VerticalTimeline
        steps={[
          {
            number: '01',
            title: 'Connect Your NSMHS Obligations',
            description:
              'FormaOS ships with the National Standards for Mental Health Services, restrictive-practice oversight, and worker screening rules pre-built. Confirm your service scope and your obligation register is live in minutes.',
            gradient:
              'from-zinc-700/20 to-zinc-900/20 border-zinc-600/30 text-zinc-300',
            visual: (
              <FeatureVisual
                label="Framework Activation"
                rows={[
                  {
                    k: 'NSMHS (10 Standards)',
                    v: 'Activated',
                    status: 'green',
                  },
                  {
                    k: 'Restrictive Practices Oversight',
                    v: 'Activated',
                    status: 'green',
                  },
                  {
                    k: 'Worker Screening Requirements',
                    v: 'Activated',
                    status: 'green',
                  },
                  {
                    k: 'Reportable Incidents Pipeline',
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
              'Upload policies, worker credentials, and incident records. FormaOS links each document to specific NSMHS standards - building continuous evidence chains.',
            gradient:
              'from-zinc-700/20 to-zinc-900/20 border-zinc-600/30 text-zinc-300',
            visual: (
              <FeatureVisual
                label="Evidence Mapping"
                rows={[
                  {
                    k: 'Standard 1: Rights & Responsibilities',
                    v: '32 evidence items',
                    status: 'green',
                  },
                  {
                    k: 'Standard 8: Governance',
                    v: '27 evidence items',
                    status: 'green',
                  },
                  {
                    k: 'Worker Screening Register',
                    v: '5 workers linked',
                    status: 'amber',
                  },
                  {
                    k: 'Standard 10: Delivery of Care',
                    v: '24 evidence items',
                    status: 'green',
                  },
                ]}
              />
            ),
          },
          {
            number: '03',
            title: 'Stay Review-Ready Every Day',
            description:
              'Automated alerts for every screening expiry, incident deadline, and evidence gap. When a review or accreditation cycle opens, your evidence pack is one click away.',
            gradient:
              'from-zinc-700/20 to-zinc-900/20 border-zinc-600/30 text-zinc-300',
            visual: (
              <FeatureVisual
                label="Readiness Score"
                rows={[
                  {
                    k: 'Overall NSMHS coverage',
                    v: '96%',
                    status: 'green',
                  },
                  { k: 'Worker Screening Current', v: '4/5', status: 'amber' },
                  { k: 'Restrictive Practices Review', v: 'Current', status: 'green' },
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <IndustryFeatures
        headline="Purpose-Built for Mental Health Services"
        subheadline="Every feature designed around real mental health compliance workflows - not generic task management."
        features={[
          {
            title: 'Worker Screening Dashboard',
            description:
              "See every worker's screening status at a glance. State-specific requirements tracked with expiry countdown alerts at 90, 60, and 30 days.",
            details: [
              'Worker screening clearance status per worker',
              'State-specific screening requirements (NSW, VIC, QLD, SA, WA, TAS, NT, ACT)',
              'Automatic expiry alerts at configurable intervals',
              'Bulk export for reviews and audits',
            ],
            visual: (
              <FeatureVisual
                label="Worker Screening Status"
                rows={[
                  {
                    k: 'Min Park - SA',
                    v: 'Valid to Mar 2027',
                    status: 'green',
                  },
                  {
                    k: 'Aaron Hassan - VIC',
                    v: 'Expiring Apr 2026',
                    status: 'amber',
                  },
                  {
                    k: 'Maria Lopez - QLD',
                    v: 'Valid to Sep 2027',
                    status: 'green',
                  },
                  { k: 'Marcus Tan - NSW', v: 'Expired Feb 2026', status: 'red' },
                ]}
              />
            ),
          },
          {
            title: 'Restrictive Practices Register',
            description:
              'Track seclusion and restraint events with authorisation documentation, minimisation strategies, and scheduled review cycles linked to each consumer.',
            details: [
              'Authorisation documentation per consumer',
              'Seclusion and restraint event logging',
              'Minimisation strategies and review cycles',
              'Governance oversight and reporting',
            ],
            visual: (
              <FeatureVisual
                label="Restrictive Practices"
                rows={[
                  { k: 'Active authorisations', v: '3', status: 'amber' },
                  { k: 'Reviews due this month', v: '1', status: 'amber' },
                  { k: 'Events logged (30d)', v: '6', status: 'green' },
                  { k: 'Overdue reviews', v: '0', status: 'green' },
                ]}
              />
            ),
          },
          {
            title: 'Consumer Compliance View',
            description:
              'Compliance posture per consumer - care plans, restrictive practices, incident history, and consent documentation all linked to the individual.',
            details: [
              'Care plan documentation with version history',
              'Restrictive practices register per consumer',
              'Incident history and investigation records',
              'Consent and authorisation tracking',
            ],
            visual: (
              <FeatureVisual
                label="Consumer: Alex Thompson"
                rows={[
                  { k: 'Care Plan', v: 'v3 - Current', status: 'green' },
                  {
                    k: 'Restrictive Practices',
                    v: '1 Active',
                    status: 'amber',
                  },
                  { k: 'Incidents (12mo)', v: '2 Closed', status: 'green' },
                  { k: 'Consent Forms', v: 'All current', status: 'green' },
                ]}
              />
            ),
          },
          {
            title: 'Reportable Incident Pipeline',
            description:
              'Structured workflow from incident report to investigation to notification to closure. Every step timestamped and evidence-linked.',
            details: [
              'Reported → Investigated → Notified → Closed workflow',
              'Immutable audit trail on every state change',
              'Evidence attachment at each pipeline stage',
              'Notification receipt tracking',
            ],
            visual: (
              <div className="p-5 space-y-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Incident Pipeline
                </div>
                {[
                  'Reported',
                  'Under Investigation',
                  'Notified',
                  'Closed',
                ].map((stage, i) => (
                  <div key={stage} className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                        i < 3
                          ? 'bg-white/[0.12] text-white border border-white/20'
                          : 'bg-white/[0.06] text-slate-500 border border-white/[0.08]'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`text-xs ${i < 3 ? 'text-white' : 'text-slate-500'}`}
                    >
                      {stage}
                    </span>
                    {i < 3 && (
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
            title: 'Review Preparation Export',
            description:
              'One-click evidence pack generation structured to the National Standards for Mental Health Services. When a review opens, your evidence is ready - not being assembled.',
            details: [
              'One-click export organised by NSMHS standard',
              'Evidence completeness scoring before export',
              'PDF evidence pack with table of contents',
              'Gap analysis showing missing evidence per standard',
            ],
            visual: (
              <FeatureVisual
                label="Review Evidence Pack"
                rows={[
                  {
                    k: 'Standard 1: Rights & Responsibilities',
                    v: '98% complete',
                    status: 'green',
                  },
                  {
                    k: 'Standard 2: Safety',
                    v: '94% complete',
                    status: 'green',
                  },
                  {
                    k: 'Standard 8: Governance',
                    v: '87% complete',
                    status: 'amber',
                  },
                  {
                    k: 'Standard 10: Delivery of Care',
                    v: '100% complete',
                    status: 'green',
                  },
                ]}
              />
            ),
          },
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <SeeItInAction
        tabs={[
          {
            id: 'dashboard',
            label: 'Compliance Dashboard',
            icon: <Monitor className="h-4 w-4" />,
            content: (
              <DemoDashboardContent
                title="Mental Health Compliance Overview"
                rows={[
                  {
                    label: 'NSMHS - Standard 1 (Rights)',
                    value: '98%',
                    status: 'green',
                  },
                  {
                    label: 'NSMHS - Standard 2 (Safety)',
                    value: '94%',
                    status: 'green',
                  },
                  {
                    label: 'Worker Screening Register',
                    value: '4/5 current',
                    status: 'amber',
                  },
                  {
                    label: 'Open Reportable Incidents',
                    value: '1 open',
                    status: 'amber',
                  },
                  {
                    label: 'Restrictive Practices Register',
                    value: 'All authorised',
                    status: 'green',
                  },
                  {
                    label: 'Consumer Rights Training',
                    value: '100% complete',
                    status: 'green',
                  },
                ]}
              />
            ),
          },
          {
            id: 'audit',
            label: 'Review Export',
            icon: <FileText className="h-4 w-4" />,
            content: (
              <DemoAuditExport
                sections={[
                  {
                    name: 'Standard 1 - Rights & Responsibilities',
                    score: '98%',
                    items: 32,
                  },
                  { name: 'Standard 2 - Safety', score: '94%', items: 28 },
                  {
                    name: 'Standard 8 - Governance',
                    score: '87%',
                    items: 27,
                  },
                  {
                    name: 'Standard 10 - Delivery of Care',
                    score: '100%',
                    items: 24,
                  },
                  {
                    name: 'Worker Screening Register',
                    score: '95%',
                    items: 42,
                  },
                ]}
              />
            ),
          },
          {
            id: 'notifications',
            label: 'Incident Timeline',
            icon: <Bell className="h-4 w-4" />,
            content: (
              <DemoNotificationTimeline
                steps={[
                  {
                    time: 'T+0:00',
                    label: 'Incident reported by support worker on site',
                    status: 'complete',
                  },
                  {
                    time: 'T+1:00',
                    label:
                      'Incident triaged and classified - notification clock starts',
                    status: 'complete',
                  },
                  {
                    time: 'T+4:00',
                    label:
                      'Investigation commenced - witness statements collected',
                    status: 'complete',
                  },
                  {
                    time: 'T+18:00',
                    label: 'Notification drafted for submission',
                    status: 'active',
                  },
                  {
                    time: 'T+24:00',
                    label: 'Notification submitted before deadline',
                    status: 'pending',
                  },
                  {
                    time: 'T+5d',
                    label: 'Investigation closed - corrective actions assigned',
                    status: 'pending',
                  },
                ]}
              />
            ),
          },
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <div className="relative isolate overflow-hidden">
        <SectionMedia
          src="/marketing-media/use-case-ndis-aged-care.jpg"
          objectPosition="50% 40%"
          opacity={0.6}
          scrim="center"
        />
        <IndustryCTA
          industry="Mental Health Services"
          urgencyCallout="Reviews and accreditation cycles arrive on their own schedule. Is your evidence chain current right now?"
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <IndustryFAQ
        industry="Mental Health Services"
        faqs={[
          {
            question:
              'Does FormaOS cover the National Standards for Mental Health Services?',
            answer:
              'Yes. FormaOS ships the NSMHS as a pre-built framework so your obligations across the ten standards are mapped from day one - no manual setup required.',
          },
          {
            question: 'Can FormaOS track restrictive practices?',
            answer:
              'Yes. FormaOS maintains a restrictive practices register per consumer, links seclusion and restraint events to authorisations and review cycles, and keeps the documentation needed to evidence minimisation and oversight.',
          },
          {
            question: 'How does FormaOS handle reportable incidents?',
            answer:
              'FormaOS tracks reportable incidents through a structured pipeline - report, investigation, notification, and closure - with notification timers and submission status tracking so deadlines are not missed.',
          },
          {
            question:
              'How does FormaOS handle state-specific worker screening?',
            answer:
              'FormaOS tracks worker screening requirements by state and territory. Each jurisdiction has different screening units and processes - FormaOS maps these and alerts you to expiring clearances at 90, 60, and 30 days.',
          },
          {
            question: 'Can FormaOS support consumer and carer participation?',
            answer:
              'Yes. FormaOS captures consent documentation, complaints and feedback records, and consumer-rights evidence, linking them to the relevant NSMHS standards for continuous, demonstrable compliance.',
          },
          {
            question: 'How long does setup take for a mental health service?',
            answer:
              'Most services are operational within hours, not weeks. FormaOS ships with the NSMHS, restrictive-practice oversight, and worker screening rules pre-built. You confirm your service scope, invite your compliance team, and your obligation register is live. Worker records can be bulk-imported from existing spreadsheets.',
          },
          {
            question: 'Is my data stored in Australia?',
            answer:
              'Yes. FormaOS is AU-hosted by default. All consumer data, evidence, and compliance records remain on Australian infrastructure. Your data never leaves Australia.',
          },
        ]}
      />
      <RelatedIndustries currentSlug="mental-health-compliance" />
    </MarketingPageShell>
  );
}

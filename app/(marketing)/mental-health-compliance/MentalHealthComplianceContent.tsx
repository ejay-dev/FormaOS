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
  FrameworkExplorer,
  HeroStatsBar,
  CompareTable,
  SeeItInAction,
  DemoDashboardContent,
  DemoAuditExport,
  DemoNotificationTimeline,
} from '@/components/marketing/industry';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { PUBLIC_PRICING_TIERS, priceLabelFor } from '@/lib/marketing/pricing';

/* The comparison row reads the entry plan from the public pricing tiers so it
   cannot drift from /pricing. */
const foundationTier = PUBLIC_PRICING_TIERS.find(
  (tier) => tier.id === 'foundation',
);
const ENTRY_PRICE = foundationTier
  ? `from ${priceLabelFor(foundationTier)}/mo`
  : 'See pricing';

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
            label: 'Worker Details: action required',
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
          message: 'Marcus Tan screening expired, renewal pending',
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
        <div className="text-xs font-medium text-slate-400">{label}</div>
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
                      ? 'bg-success'
                      : r.status === 'amber'
                        ? 'bg-warning'
                        : 'bg-destructive'
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
          headline={
            <>
              Ten standards,
              <br />
              evidenced <span className="mk-accent">daily</span>
            </>
          }
          subheadline="Operationalise the National Standards for Mental Health Services, consumer rights, restrictive-practice governance and incidents, continuously evidenced."
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
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <FrameworkExplorer
        headline="The ten standards, and the registers that sit under them"
        description="The National Standards for Mental Health Services ship pre-loaded, alongside restrictive practices, reportable incidents and worker screening."
        frameworks={[
          {
            id: 'nsmhs',
            name: 'National Standards for Mental Health Services',
            body: 'Australian Health Ministers',
            updated: '2025-11-01',
            obligationCount: '10 standards',
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

      <IndustryFeatures
        headline="Built around consumers, authorisations and incidents"
        subheadline="Worker screening, restrictive practices, consumer records and reportable incidents, held as one connected register."
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
                    k: 'Min Park, SA',
                    v: 'Valid to Mar 2027',
                    status: 'green',
                  },
                  {
                    k: 'Aaron Hassan, VIC',
                    v: 'Expiring Apr 2026',
                    status: 'amber',
                  },
                  {
                    k: 'Maria Lopez, QLD',
                    v: 'Valid to Sep 2027',
                    status: 'green',
                  },
                  {
                    k: 'Marcus Tan, NSW',
                    v: 'Expired Feb 2026',
                    status: 'red',
                  },
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
              'Compliance posture per consumer, care plans, restrictive practices, incident history, and consent documentation all linked to the individual.',
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
                  { k: 'Care Plan', v: 'v3, Current', status: 'green' },
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
                <div className="text-xs font-medium text-slate-400">
                  Incident pipeline
                </div>
                {['Reported', 'Under Investigation', 'Notified', 'Closed'].map(
                  (stage, i) => (
                    <div key={stage} className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          i < 3 ? 'bg-success' : 'bg-white/20'
                        }`}
                      />
                      <span
                        className={`text-xs ${i < 3 ? 'text-white' : 'text-slate-500'}`}
                      >
                        {stage}
                      </span>
                      {i < 3 && (
                        <span className="text-[10px] text-success ml-auto">
                          Complete
                        </span>
                      )}
                    </div>
                  ),
                )}
              </div>
            ),
          },
          {
            title: 'Review Preparation Export',
            description:
              'One-click evidence pack generation structured to the National Standards for Mental Health Services. When a review opens, your evidence is ready, not being assembled.',
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
                    label: 'NSMHS, Standard 1 (Rights)',
                    value: '98%',
                    status: 'green',
                  },
                  {
                    label: 'NSMHS, Standard 2 (Safety)',
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
                    name: 'Standard 1, Rights & Responsibilities',
                    score: '98%',
                    items: 32,
                  },
                  { name: 'Standard 2, Safety', score: '94%', items: 28 },
                  {
                    name: 'Standard 8, Governance',
                    score: '87%',
                    items: 27,
                  },
                  {
                    name: 'Standard 10, Delivery of Care',
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
                      'Incident triaged and classified, notification clock starts',
                    status: 'complete',
                  },
                  {
                    time: 'T+4:00',
                    label:
                      'Investigation commenced, witness statements collected',
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
                    label: 'Investigation closed, corrective actions assigned',
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

      <CompareTable
        headline="Compared with spreadsheets and care software"
        description="Clinical and care systems record the episode. Neither they nor a spreadsheet hold the authorisation, the review cycle and the evidence together."
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
            formaos: ENTRY_PRICE,
          },
        ]}
      />

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
              'Yes. FormaOS ships the NSMHS as a pre-built framework so your obligations across the ten standards are mapped from day one, no manual setup required.',
          },
          {
            question: 'Can FormaOS track restrictive practices?',
            answer:
              'Yes. FormaOS maintains a restrictive practices register per consumer, links seclusion and restraint events to authorisations and review cycles, and keeps the documentation needed to evidence minimisation and oversight.',
          },
          {
            question: 'How does FormaOS handle reportable incidents?',
            answer:
              'FormaOS tracks reportable incidents through a structured pipeline, report, investigation, notification, and closure, with notification timers and submission status tracking so deadlines are not missed.',
          },
          {
            question:
              'How does FormaOS handle state-specific worker screening?',
            answer:
              'FormaOS tracks worker screening requirements by state and territory. Each jurisdiction has different screening units and processes, FormaOS maps these and alerts you to expiring clearances at 90, 60, and 30 days.',
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
      <div className="relative isolate overflow-hidden">
        <IndustryCTA
          industry="Mental Health Services"
          urgencyCallout="Reviews and accreditation cycles arrive on their own schedule. Is your evidence chain current right now?"
        />
      </div>

      <RelatedIndustries currentSlug="mental-health-compliance" />
    </MarketingPageShell>
  );
}

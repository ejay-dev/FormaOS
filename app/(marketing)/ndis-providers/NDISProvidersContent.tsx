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
  Timer,
  GitBranch,
  FileCheck,
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

function NDISDashboardVisual() {
  return (
    <InteractiveDashboard
      title="NDIS Worker Check Status"
      subtitle="Worker Screening Register"
      tabs={[
        { id: 'all', label: 'All Workers', count: 5 },
        { id: 'expiring', label: 'Expiring Soon', count: 1 },
        { id: 'incidents', label: 'SIRS Tracker', count: 3 },
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
            worker: 'Sarah Chen',
            role: 'Support Worker',
            status: 'Valid',
            expiry: '14 Mar 2027',
          },
          expandedContent: {
            label: 'Worker Details',
            items: [
              { key: 'State', value: 'NSW' },
              { key: 'Check Type', value: 'NDIS Worker Screening' },
              { key: 'Last Verified', value: '12 Jan 2026' },
              { key: 'Sites', value: 'Parramatta, Bankstown' },
            ],
          },
        },
        {
          id: 'w2',
          status: 'amber',
          cells: {
            worker: 'James Patel',
            role: 'Team Leader',
            status: 'Expiring',
            expiry: '22 Apr 2026',
          },
          expandedContent: {
            label: 'Worker Details',
            items: [
              { key: 'State', value: 'VIC' },
              { key: 'Check Type', value: 'NDIS Worker Screening' },
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
            role: 'Support Coordinator',
            status: 'Valid',
            expiry: '08 Sep 2027',
          },
          expandedContent: {
            label: 'Worker Details',
            items: [
              { key: 'State', value: 'QLD' },
              { key: 'Check Type', value: 'NDIS Worker Screening' },
              { key: 'Last Verified', value: '05 Mar 2026' },
              { key: 'Sites', value: 'Brisbane CBD' },
            ],
          },
        },
        {
          id: 'w4',
          status: 'red',
          cells: {
            worker: 'David Kim',
            role: 'Behaviour Practitioner',
            status: 'Expired',
            expiry: '01 Feb 2026',
          },
          expandedContent: {
            label: 'Worker Details — ACTION REQUIRED',
            items: [
              { key: 'State', value: 'SA' },
              { key: 'Check Type', value: 'NDIS Worker Screening' },
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
              { key: 'State', value: 'NSW' },
              { key: 'Check Type', value: 'NDIS Worker Screening' },
              { key: 'Last Verified', value: '18 Feb 2026' },
              { key: 'Sites', value: 'Liverpool, Campbelltown' },
            ],
          },
        },
      ]}
      notifications={[
        {
          message: 'James Patel screening expires in 13 days',
          time: '2 hours ago',
          type: 'alert',
        },
        {
          message: 'David Kim screening expired — renewal pending',
          time: '1 day ago',
          type: 'alert',
        },
        {
          message: 'Sarah Chen screening verified successfully',
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

export default function NDISProvidersContent() {
  return (
    <MarketingPageShell>
      <IndustryHero
        eyebrow="NDIS Commission Aligned Framework"
        accent="cyan-blue"
        headline={
          <>
            Stop Dreading
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Unannounced NDIS Audits
            </span>
          </>
        }
        subheadline="The NDIS Commission can visit without notice. FormaOS maintains your evidence chain continuously — defensible every day, not just before audits."
        primaryCta={{ label: 'Start Free Trial', href: '/auth/signup' }}
        secondaryCta={{ label: 'See NDIS Demo', href: '/contact' }}
        trustSignals={[
          'AU-hosted by default',
          '14-day free trial',
          'No credit card required',
          'NDIS Commission aligned',
        ]}
        dashboardVisual={<NDISDashboardVisual />}
        statsBar={
          <HeroStatsBar
            stats={[
              '400+ NDIS obligations mapped',
              'SIRS notification in 24hr',
              'Worker screening automated',
              'AU-hosted',
            ]}
          />
        }
      />

      <VisualDivider />

      <BeforeAfterSection
        headline="The NDIS Compliance Gap"
        subheadline="The difference between scrambling and being audit-ready."
        without={[
          'NDIS Commission arrives unannounced — evidence scattered across shared drives, email, and spreadsheets',
          'Worker screening check expired 67 days ago — discovered only when Commission requests the register',
          'Priority reportable incident not notified within 24 hours — enforcement action exposure',
          'Restrictive practice without current behaviour support plan — no documented authorisation on file',
        ]}
        withFormaOS={[
          'Continuous evidence chain across all 8 Practice Standards — audit-ready export in one click',
          'Automatic screening expiry alerts at 90, 60, and 30 days — zero workers operating without clearance',
          'SIRS notification workflow with 24-hour countdown timer and Commission submission tracking',
          'Restrictive practices register linked to behaviour support plans with authorisation documentation',
        ]}
      />

      <CompareTable
        headline="FormaOS vs. The Status Quo"
        description="See how purpose-built NDIS compliance software compares."
        rows={[
          {
            feature: 'NDIS Practice Standards pre-built',
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
            feature: 'SIRS notification workflow',
            spreadsheets: 'no',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'Regulator-ready export',
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
            formaos: 'From $159/mo',
          },
        ]}
      />

      <VisualDivider />

      <FrameworkExplorer
        headline="Every NDIS Framework. Pre-Built."
        description="FormaOS ships with every major NDIS regulatory framework pre-loaded. Your obligations are mapped from day one — no manual setup required."
        frameworks={[
          {
            id: 'practice-standards',
            name: 'NDIS Practice Standards',
            body: 'NDIS Quality and Safeguards Commission',
            updated: '2025-10-15',
            obligationCount: '400+',
            categories: [
              { name: 'Rights and Responsibilities', pct: 98 },
              { name: 'Governance and Operational Management', pct: 96 },
              { name: 'Provision of Supports', pct: 95 },
              { name: 'Support Provision Environment', pct: 100 },
              { name: 'Verification Module', pct: 94 },
              { name: 'Specialist Disability Accommodation', pct: 92 },
              { name: 'Early Childhood Supports', pct: 97 },
              { name: 'Behaviour Support', pct: 93 },
            ],
            requirements: [
              'Rights and Responsibilities',
              'Governance and Operational Management',
              'Provision of Supports',
              'Support Provision Environment',
              'Verification Module for lower-risk providers',
              'Supplementary modules (SDA, early childhood)',
            ],
          },
          {
            id: 'aged-care',
            name: 'Aged Care Quality Standards',
            body: 'Aged Care Quality and Safety Commission',
            updated: '2025-12-01',
            obligationCount: '200+',
            categories: [
              { name: 'Consumer dignity and choice', pct: 97 },
              { name: 'Ongoing assessment and planning', pct: 95 },
              { name: 'Personal and clinical care', pct: 94 },
              { name: 'Services and supports for daily living', pct: 96 },
              { name: 'Organisation service environment', pct: 100 },
              { name: 'Feedback and complaints', pct: 98 },
              { name: 'Human resources', pct: 93 },
              { name: 'Organisational governance', pct: 99 },
            ],
            requirements: [
              'Consumer dignity and choice',
              'Ongoing assessment and planning',
              'Personal and clinical care',
              'Services and supports for daily living',
              'Organisation service environment',
              'Feedback and complaints',
              'Human resources',
              'Organisational governance',
            ],
          },
          {
            id: 'code-of-conduct',
            name: 'NDIS Code of Conduct',
            body: 'NDIS Quality and Safeguards Commission',
            updated: '2025-09-01',
            obligationCount: '50+',
            categories: [
              { name: 'Respect for individual rights', pct: 100 },
              { name: 'Privacy and confidentiality', pct: 98 },
              { name: 'Safe and competent supports', pct: 96 },
              { name: 'Integrity and honesty', pct: 100 },
              { name: 'Violence and abuse prevention', pct: 97 },
            ],
            requirements: [
              'Acting with respect for individual rights',
              'Respecting privacy and confidentiality',
              'Providing safe and competent supports',
              'Acting with integrity and honesty',
              'Preventing and responding to violence and abuse',
            ],
          },
          {
            id: 'sirs',
            name: 'SIRS — Serious Incident Response Scheme',
            body: 'NDIS Quality and Safeguards Commission',
            updated: '2026-01-10',
            obligationCount: '80+',
            categories: [
              { name: 'Priority reportable incidents (24hrs)', pct: 100 },
              { name: 'Standard reportable incidents (5 days)', pct: 96 },
              { name: 'Investigation and root cause analysis', pct: 94 },
              { name: 'Corrective action and closure', pct: 98 },
            ],
            requirements: [
              'Priority reportable incident notification (24hrs)',
              'Standard reportable incident notification (5 business days)',
              'Incident investigation and root cause analysis',
              'Corrective action tracking and closure',
            ],
          },
          {
            id: 'worker-screening',
            name: 'Worker Screening Requirements',
            body: 'State and Territory Screening Units',
            updated: '2025-11-20',
            obligationCount: '40+',
            categories: [
              { name: 'NDIS Worker Screening Check by state', pct: 100 },
              { name: 'Working With Children Check', pct: 98 },
              { name: 'National Police Check validation', pct: 96 },
              { name: 'Continuous monitoring', pct: 95 },
            ],
            requirements: [
              'NDIS Worker Screening Check by state',
              'Working With Children Check requirements',
              'National Police Check validation',
              'Continuous monitoring of clearance status',
            ],
          },
        ]}
      />

      <VisualDivider />

      <VerticalTimeline
        steps={[
          {
            number: '01',
            title: 'Connect Your NDIS Obligations',
            description:
              'FormaOS ships with NDIS Practice Standards, SIRS requirements, and worker screening rules pre-built. Select your registration groups and your obligation register is live in minutes.',
            gradient:
              'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300',
            visual: (
              <FeatureVisual
                label="Framework Activation"
                rows={[
                  {
                    k: 'NDIS Practice Standards (8 Modules)',
                    v: 'Activated',
                    status: 'green',
                  },
                  {
                    k: 'SIRS — Incident Response Scheme',
                    v: 'Activated',
                    status: 'green',
                  },
                  {
                    k: 'Worker Screening Requirements',
                    v: 'Activated',
                    status: 'green',
                  },
                  {
                    k: 'NDIS Code of Conduct',
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
              'Upload policies, worker credentials, incident records. FormaOS links each document to specific Practice Standards and SIRS requirements — building continuous evidence chains.',
            gradient:
              'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300',
            visual: (
              <FeatureVisual
                label="Evidence Mapping"
                rows={[
                  {
                    k: 'Module 1: Rights & Responsibilities',
                    v: '38 evidence items',
                    status: 'green',
                  },
                  {
                    k: 'Module 2: Governance',
                    v: '25 evidence items',
                    status: 'green',
                  },
                  {
                    k: 'Worker Screening Register',
                    v: '5 workers linked',
                    status: 'amber',
                  },
                  {
                    k: 'Module 3: Provision of Supports',
                    v: '22 evidence items',
                    status: 'green',
                  },
                ]}
              />
            ),
          },
          {
            number: '03',
            title: 'Stay Audit-Ready Every Day',
            description:
              'Automated alerts for every screening expiry, incident deadline, and evidence gap. When the Commission arrives unannounced, your evidence pack is one click away.',
            gradient:
              'from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 text-emerald-300',
            visual: (
              <FeatureVisual
                label="Readiness Score"
                rows={[
                  {
                    k: 'Overall Practice Standards',
                    v: '96%',
                    status: 'green',
                  },
                  { k: 'Worker Screening Current', v: '4/5', status: 'amber' },
                  { k: 'SIRS Compliance', v: '100%', status: 'green' },
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
        headline="Purpose-Built for NDIS Providers"
        subheadline="Every feature designed around real NDIS compliance workflows — not generic task management."
        features={[
          {
            title: 'Worker Screening Dashboard',
            description:
              "See every worker's NDIS screening status at a glance. State-specific requirements automatically tracked with expiry countdown alerts at 90, 60, and 30 days.",
            details: [
              'NDIS Worker Screening Check status per worker',
              'State-specific screening requirements (NSW, VIC, QLD, SA, WA, TAS, NT, ACT)',
              'Automatic expiry alerts at configurable intervals',
              'Bulk export for Commission reporting',
            ],
            visual: (
              <FeatureVisual
                label="Worker Screening Status"
                rows={[
                  {
                    k: 'Sarah Chen — NSW',
                    v: 'Valid to Mar 2027',
                    status: 'green',
                  },
                  {
                    k: 'James Patel — VIC',
                    v: 'Expiring Apr 2026',
                    status: 'amber',
                  },
                  {
                    k: 'Maria Lopez — QLD',
                    v: 'Valid to Sep 2027',
                    status: 'green',
                  },
                  { k: 'David Kim — SA', v: 'Expired Feb 2026', status: 'red' },
                ]}
              />
            ),
          },
          {
            title: 'SIRS Notification Tracker',
            description:
              'Track every reportable incident through its full lifecycle. 24-hour countdown timers for priority incidents, 5-business-day tracking for standard incidents, with Commission notification workflow built in.',
            details: [
              '24-hour countdown timer for priority reportable incidents',
              '5-business-day tracking for standard reportable incidents',
              'NDIS Commission notification status tracking',
              'Investigation → Notified → Closed pipeline',
            ],
            visual: (
              <FeatureVisual
                label="SIRS Notification Pipeline"
                rows={[
                  {
                    k: 'INC-0042 (Priority)',
                    v: '18hrs remaining',
                    status: 'amber',
                  },
                  { k: 'INC-0041 (Standard)', v: 'Notified', status: 'green' },
                  { k: 'INC-0040 (Priority)', v: 'Closed', status: 'green' },
                  {
                    k: 'INC-0039 (Standard)',
                    v: '2 days remaining',
                    status: 'amber',
                  },
                ]}
              />
            ),
          },
          {
            title: 'Participant Compliance View',
            description:
              'Compliance posture per participant — support plans, restrictive practices register, incident history, and consent documentation all linked to the individual.',
            details: [
              'Support plan documentation with version history',
              'Restrictive practices register per participant',
              'Incident history and investigation records',
              'Consent and authorisation tracking',
            ],
            visual: (
              <FeatureVisual
                label="Participant: Alex Thompson"
                rows={[
                  { k: 'Support Plan', v: 'v3 — Current', status: 'green' },
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
              'Structured workflow from incident report to investigation to Commission notification to closure. Every step timestamped and evidence-linked.',
            details: [
              'Reported → Investigated → Notified → Closed workflow',
              'Immutable audit trail on every state change',
              'Evidence attachment at each pipeline stage',
              'Commission notification receipt tracking',
            ],
            visual: (
              <div className="p-5 space-y-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Incident Pipeline
                </div>
                {[
                  'Reported',
                  'Under Investigation',
                  'Notified to Commission',
                  'Closed',
                ].map((stage, i) => (
                  <div key={stage} className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                        i < 3
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
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
            title: 'Audit Preparation Export',
            description:
              'One-click evidence pack generation structured to NDIS Practice Standards. When the Commission arrives, your evidence is ready — not being assembled.',
            details: [
              'One-click export organised by Practice Standard module',
              'Evidence completeness scoring before export',
              'PDF evidence pack with table of contents',
              'Gap analysis showing missing evidence per standard',
            ],
            visual: (
              <FeatureVisual
                label="Audit Evidence Pack"
                rows={[
                  {
                    k: 'Module 1: Rights & Responsibilities',
                    v: '98% complete',
                    status: 'green',
                  },
                  {
                    k: 'Module 2: Governance',
                    v: '94% complete',
                    status: 'green',
                  },
                  {
                    k: 'Module 3: Provision of Supports',
                    v: '87% complete',
                    status: 'amber',
                  },
                  {
                    k: 'Module 4: Support Environment',
                    v: '100% complete',
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
            label: 'NDIS Dashboard',
            icon: <Monitor className="h-4 w-4" />,
            content: (
              <DemoDashboardContent
                title="NDIS Compliance Overview"
                rows={[
                  {
                    label: 'Practice Standards — Module 1',
                    value: '98%',
                    status: 'green',
                  },
                  {
                    label: 'Practice Standards — Module 2',
                    value: '94%',
                    status: 'green',
                  },
                  {
                    label: 'Worker Screening Register',
                    value: '4/5 current',
                    status: 'amber',
                  },
                  {
                    label: 'SIRS — Open Incidents',
                    value: '1 priority',
                    status: 'amber',
                  },
                  {
                    label: 'Restrictive Practices Register',
                    value: 'All authorised',
                    status: 'green',
                  },
                  {
                    label: 'Code of Conduct Training',
                    value: '100% complete',
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
                    name: 'Module 1 — Rights & Responsibilities',
                    score: '98%',
                    items: 38,
                  },
                  { name: 'Module 2 — Governance', score: '94%', items: 25 },
                  {
                    name: 'Module 3 — Provision of Supports',
                    score: '87%',
                    items: 22,
                  },
                  {
                    name: 'Module 4 — Support Environment',
                    score: '100%',
                    items: 18,
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
            label: 'SIRS Timeline',
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
                      'Incident classified as priority reportable — 24hr clock starts',
                    status: 'complete',
                  },
                  {
                    time: 'T+4:00',
                    label:
                      'Investigation commenced — witness statements collected',
                    status: 'complete',
                  },
                  {
                    time: 'T+18:00',
                    label: 'Commission notification drafted — 6hrs remaining',
                    status: 'active',
                  },
                  {
                    time: 'T+24:00',
                    label: 'Commission notification submitted before deadline',
                    status: 'pending',
                  },
                  {
                    time: 'T+5d',
                    label: 'Investigation closed — corrective actions assigned',
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
            persona: 'NDIS Registered Provider, 50+ participants',
            need: 'Worker screening compliance across 3 sites with zero manual tracking',
            delivers:
              'Automated expiry alerts, SIRS notification workflows, audit-ready export for every unannounced visit',
          },
          {
            persona: 'NDIS Plan Manager, 200+ participants',
            need: 'Evidence chain integrity for Practice Standards across all 8 modules',
            delivers:
              'Pre-built Practice Standards framework, immutable evidence chain, one-click audit evidence pack',
          },
          {
            persona: 'Disability Services Group, multi-state operations',
            need: 'State-specific worker screening requirements tracked centrally',
            delivers:
              'Per-state screening rules, centralised dashboard, credential expiry countdown with escalation paths',
          },
        ]}
        regulatoryBodies={[
          { name: 'NDIS Commission', icon: <Shield className="h-4 w-4" /> },
          { name: 'Aged Care Commission', icon: <Users className="h-4 w-4" /> },
          {
            name: 'State Screening Units',
            icon: <FileCheck className="h-4 w-4" />,
          },
        ]}
      />

      <VisualDivider />

      <IndustryCTA
        industry="NDIS"
        urgencyCallout="The NDIS Commission can visit without notice. Is your evidence chain current right now?"
      />

      <VisualDivider />

      <IndustryFAQ
        industry="NDIS"
        faqs={[
          {
            question:
              'Does FormaOS cover all 8 NDIS Practice Standards modules?',
            answer:
              'Yes. All 8 modules are pre-built including the Verification module for lower-risk providers and supplementary modules for specialist disability accommodation and early childhood supports.',
          },
          {
            question: 'Can FormaOS help with unannounced audits?',
            answer:
              'FormaOS maintains continuous evidence chains so your compliance posture is audit-ready at all times — not just before scheduled visits. When the NDIS Commission arrives unannounced, your evidence pack is one click away.',
          },
          {
            question: 'Does FormaOS handle SIRS notifications?',
            answer:
              'Yes. FormaOS tracks Priority and Standard reportable incidents with 24-hour and 5-business-day notification timers and submission status tracking. Every incident follows a structured pipeline from report to investigation to Commission notification to closure.',
          },
          {
            question:
              'How does FormaOS handle state-specific worker screening?',
            answer:
              'FormaOS tracks NDIS Worker Screening Check requirements by state and territory. Each jurisdiction has different screening units and processes — FormaOS maps these automatically and alerts you to expiring clearances at 90, 60, and 30 days.',
          },
          {
            question: 'Can I track restrictive practices in FormaOS?',
            answer:
              'Yes. FormaOS maintains a restrictive practices register per participant, tracks authorisation documentation, links to behaviour support plans, and supports Commission reporting obligations for regulated restrictive practices.',
          },
          {
            question: 'Does FormaOS integrate with the NDIS Commission portal?',
            answer:
              'FormaOS generates Commission-structured reports and evidence packs ready for submission. While direct API integration with the Commission portal is on our roadmap, the current export format aligns with Commission requirements.',
          },
          {
            question: 'How long does setup take for an NDIS provider?',
            answer:
              'Most NDIS providers are fully operational within hours, not weeks. FormaOS ships with Practice Standards, SIRS requirements, and worker screening rules pre-built. You select your registration groups, invite your compliance team, and your obligation register is live. Worker records can be bulk-imported from existing spreadsheets.',
          },
          {
            question: 'Is my data stored in Australia?',
            answer:
              'Yes. FormaOS is AU-hosted by default. All participant data, evidence, and compliance records remain on Australian infrastructure. Your data never leaves Australia.',
          },
        ]}
      />
    </MarketingPageShell>
  );
}

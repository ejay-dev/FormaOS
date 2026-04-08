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
} from '@/components/marketing/industry';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { VisualDivider } from '@/components/motion';

/* ── Dashboard visual ────────────────────────────────── */

function NDISDashboardVisual() {
  const workers = [
    { name: 'Sarah Chen', role: 'Support Worker', status: 'Valid', expiry: '14 Mar 2027', color: 'emerald' },
    { name: 'James Patel', role: 'Team Leader', status: 'Expiring', expiry: '22 Apr 2026', color: 'amber' },
    { name: 'Maria Lopez', role: 'Support Coordinator', status: 'Valid', expiry: '08 Sep 2027', color: 'emerald' },
    { name: 'David Kim', role: 'Behaviour Practitioner', status: 'Expired', expiry: '01 Feb 2026', color: 'red' },
    { name: 'Anika Sharma', role: 'Support Worker', status: 'Valid', expiry: '30 Nov 2027', color: 'emerald' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 mb-0.5">Worker Screening Register</div>
          <div className="text-sm font-semibold text-white">NDIS Worker Check Status</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            3 Valid
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
            1 Expiring
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
            1 Expired
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-white/[0.06]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-3 py-2 font-medium text-slate-500">Worker</th>
              <th className="px-3 py-2 font-medium text-slate-500 hidden sm:table-cell">Role</th>
              <th className="px-3 py-2 font-medium text-slate-500">Status</th>
              <th className="px-3 py-2 font-medium text-slate-500 hidden sm:table-cell">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.name} className="border-b border-white/[0.04] last:border-0">
                <td className="px-3 py-2.5 text-white font-medium">{w.name}</td>
                <td className="px-3 py-2.5 text-slate-500 hidden sm:table-cell">{w.role}</td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      w.color === 'emerald'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : w.color === 'amber'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      w.color === 'emerald'
                        ? 'bg-emerald-500'
                        : w.color === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`} />
                    {w.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-slate-500 hidden sm:table-cell">{w.expiry}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Feature visuals ─────────────────────────────────── */

function FeatureVisual({ label, rows }: { label: string; rows: { k: string; v: string; status?: string }[] }) {
  return (
    <div className="p-5 space-y-3">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.k} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="text-xs text-white">{r.k}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{r.v}</span>
              {r.status && (
                <span className={`h-2 w-2 rounded-full ${
                  r.status === 'green' ? 'bg-emerald-500' : r.status === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
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
        headline={
          <>
            Stop Dreading
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Unannounced NDIS Audits
            </span>
          </>
        }
        subheadline="The NDIS Quality and Safeguards Commission can visit without notice. FormaOS maintains your evidence chain continuously — so your compliance posture is defensible every single day, not just before scheduled assessments."
        primaryCta={{ label: 'Start Free Trial', href: '/auth/signup' }}
        secondaryCta={{ label: 'See NDIS Demo', href: '/contact' }}
        trustSignals={[
          'AU-hosted by default',
          '14-day free trial',
          'No credit card required',
          'NDIS Commission aligned',
        ]}
        dashboardVisual={<NDISDashboardVisual />}
      />

      <VisualDivider />

      <PainPointsGrid
        headline="The NDIS Compliance Reality"
        subheadline="These are the risks that keep NDIS compliance managers awake at night."
        painPoints={[
          {
            icon: <AlertTriangle className="h-5 w-5" />,
            title: 'Unannounced NDIS Commission audits with zero notice',
            description:
              'The Commission can arrive any day. Providers caught without current evidence face conditions on registration — or worse, revocation.',
          },
          {
            icon: <UserX className="h-5 w-5" />,
            title: 'Worker Screening Checks expiring unnoticed',
            description:
              'NDIS Worker Screening Checks vary by state. One expired check means a worker operating without valid clearance — a reportable breach.',
          },
          {
            icon: <Clock className="h-5 w-5" />,
            title: 'Reportable incidents not notified within 24 hours',
            description:
              'Priority reportable incidents must be notified to the NDIS Commission within 24 hours. Miss this window and you face enforcement action.',
          },
          {
            icon: <FileWarning className="h-5 w-5" />,
            title: 'Restrictive practices without proper authorisation',
            description:
              'Every regulated restrictive practice requires documented authorisation, behaviour support plans, and ongoing reporting to the Commission.',
          },
          {
            icon: <ShieldAlert className="h-5 w-5" />,
            title: 'SIRS notifications missed or late',
            description:
              'The Serious Incident Response Scheme demands structured notification workflows. Paper-based tracking leads to missed deadlines and compliance gaps.',
          },
          {
            icon: <Bell className="h-5 w-5" />,
            title: 'Practice Standards evidence scattered across systems',
            description:
              'All 8 NDIS Practice Standards modules require documented evidence. When evidence lives in email, drives, and spreadsheets, audits become scrambles.',
          },
        ]}
      />

      <VisualDivider />

      <FrameworkCoverage
        headline="Every NDIS Framework. Pre-Built."
        description="FormaOS ships with every major NDIS regulatory framework pre-loaded. Your obligations are mapped from day one — no manual setup required."
        frameworks={[
          {
            name: 'NDIS Practice Standards',
            body: 'NDIS Quality and Safeguards Commission',
            obligationCount: '400+',
            areas: [
              'Rights and Responsibilities',
              'Governance and Operational Management',
              'Provision of Supports',
              'Support Provision Environment',
              'Verification Module for lower-risk providers',
              'Supplementary modules (specialist disability accommodation, early childhood)',
            ],
          },
          {
            name: 'Aged Care Quality Standards',
            body: 'Aged Care Quality and Safety Commission',
            obligationCount: '200+',
            areas: [
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
            name: 'NDIS Code of Conduct',
            body: 'NDIS Quality and Safeguards Commission',
            obligationCount: '50+',
            areas: [
              'Acting with respect for individual rights',
              'Respecting privacy and confidentiality',
              'Providing safe and competent supports',
              'Acting with integrity and honesty',
              'Preventing and responding to violence and abuse',
            ],
          },
          {
            name: 'SIRS — Serious Incident Response Scheme',
            body: 'NDIS Quality and Safeguards Commission',
            obligationCount: '80+',
            areas: [
              'Priority reportable incident notification (24hrs)',
              'Standard reportable incident notification (5 business days)',
              'Incident investigation and root cause analysis',
              'Corrective action tracking and closure',
            ],
          },
          {
            name: 'Worker Screening Requirements',
            body: 'State and Territory Screening Units',
            obligationCount: '40+',
            areas: [
              'NDIS Worker Screening Check by state',
              'Working With Children Check requirements',
              'National Police Check validation',
              'Continuous monitoring of clearance status',
            ],
          },
        ]}
      />

      <VisualDivider />

      <HowItWorks />

      <VisualDivider />

      <IndustryFeatures
        headline="Purpose-Built for NDIS Providers"
        subheadline="Every feature designed around real NDIS compliance workflows — not generic task management."
        features={[
          {
            title: 'Worker Screening Dashboard',
            description:
              'See every worker\'s NDIS screening status at a glance. State-specific requirements automatically tracked with expiry countdown alerts at 90, 60, and 30 days.',
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
                  { k: 'Sarah Chen — NSW', v: 'Valid to Mar 2027', status: 'green' },
                  { k: 'James Patel — VIC', v: 'Expiring Apr 2026', status: 'amber' },
                  { k: 'Maria Lopez — QLD', v: 'Valid to Sep 2027', status: 'green' },
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
                  { k: 'INC-0042 (Priority)', v: '18hrs remaining', status: 'amber' },
                  { k: 'INC-0041 (Standard)', v: 'Notified', status: 'green' },
                  { k: 'INC-0040 (Priority)', v: 'Closed', status: 'green' },
                  { k: 'INC-0039 (Standard)', v: '2 days remaining', status: 'amber' },
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
                  { k: 'Restrictive Practices', v: '1 Active', status: 'amber' },
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
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Incident Pipeline</div>
                {['Reported', 'Under Investigation', 'Notified to Commission', 'Closed'].map((stage, i) => (
                  <div key={stage} className="flex items-center gap-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                      i < 3 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/[0.06] text-slate-500 border border-white/[0.08]'
                    }`}>
                      {i + 1}
                    </div>
                    <span className={`text-xs ${i < 3 ? 'text-white' : 'text-slate-500'}`}>{stage}</span>
                    {i < 3 && <span className="text-[10px] text-emerald-500 ml-auto">Complete</span>}
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
                  { k: 'Module 1: Rights & Responsibilities', v: '98% complete', status: 'green' },
                  { k: 'Module 2: Governance', v: '94% complete', status: 'green' },
                  { k: 'Module 3: Provision of Supports', v: '87% complete', status: 'amber' },
                  { k: 'Module 4: Support Environment', v: '100% complete', status: 'green' },
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
            persona: 'NDIS Registered Provider, 50+ participants',
            need: 'Worker screening compliance across 3 sites with zero manual tracking',
            delivers: 'Automated expiry alerts, SIRS notification workflows, audit-ready export for every unannounced visit',
          },
          {
            persona: 'NDIS Plan Manager, 200+ participants',
            need: 'Evidence chain integrity for Practice Standards across all 8 modules',
            delivers: 'Pre-built Practice Standards framework, immutable evidence chain, one-click audit evidence pack',
          },
          {
            persona: 'Disability Services Group, multi-state operations',
            need: 'State-specific worker screening requirements tracked centrally',
            delivers: 'Per-state screening rules, centralised dashboard, credential expiry countdown with escalation paths',
          },
        ]}
        regulatoryBodies={[
          { name: 'NDIS Commission', icon: <Shield className="h-4 w-4" /> },
          { name: 'Aged Care Commission', icon: <Users className="h-4 w-4" /> },
          { name: 'State Screening Units', icon: <FileCheck className="h-4 w-4" /> },
        ]}
      />

      <VisualDivider />

      <IndustryCTA industry="NDIS" />

      <VisualDivider />

      <IndustryFAQ
        industry="NDIS"
        faqs={[
          {
            question: 'Does FormaOS cover all 8 NDIS Practice Standards modules?',
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
            question: 'How does FormaOS handle state-specific worker screening?',
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
            question: 'Is my data stored in Australia?',
            answer:
              'Yes. FormaOS is AU-hosted by default. All participant data, evidence, and compliance records remain on Australian infrastructure. Your data never leaves Australia.',
          },
        ]}
      />
    </MarketingPageShell>
  );
}

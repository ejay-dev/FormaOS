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

/* ── NQF Quality Areas dashboard visual ─────────────── */

function NQFDashboardVisual() {
  const qualityAreas = [
    { area: 'QA1', name: 'Educational program and practice', pct: 92, color: 'emerald' },
    { area: 'QA2', name: "Children's health and safety", pct: 88, color: 'emerald' },
    { area: 'QA3', name: 'Physical environment', pct: 95, color: 'emerald' },
    { area: 'QA4', name: 'Staffing arrangements', pct: 78, color: 'amber' },
    { area: 'QA5', name: 'Relationships with children', pct: 100, color: 'emerald' },
    { area: 'QA6', name: 'Collaborative partnerships', pct: 85, color: 'emerald' },
    { area: 'QA7', name: 'Governance and leadership', pct: 90, color: 'emerald' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 mb-0.5">NQF Compliance Dashboard</div>
          <div className="text-sm font-semibold text-white">Quality Area Readiness</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            6 On Track
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
            1 Needs Attention
          </span>
        </div>
      </div>

      {/* Quality area rows */}
      <div className="space-y-2.5">
        {qualityAreas.map((qa) => (
          <div key={qa.area} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white font-medium">
                <span className="text-slate-500 mr-1.5">{qa.area}</span>
                {qa.name}
              </span>
              <span className={`text-[10px] font-medium ${
                qa.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {qa.pct}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full ${
                  qa.color === 'emerald' ? 'bg-emerald-500/70' : 'bg-amber-500/70'
                }`}
                style={{ width: `${qa.pct}%` }}
              />
            </div>
          </div>
        ))}
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

export default function ChildcareComplianceContent() {
  return (
    <MarketingPageShell>
      <IndustryHero
        eyebrow="NQF + ACECQA Aligned"
        headline={
          <>
            NQF Assessment Ready.
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Every Day.
            </span>
          </>
        }
        subheadline="NQF assessment and rating visits can arrive with as little as 48 hours notice. Educator credentials expire, Quality Improvement Plans fall behind, and evidence scatters across folders and inboxes. FormaOS keeps your childcare service assessment-ready continuously — so you demonstrate quality, not scramble for proof."
        primaryCta={{ label: 'Start Free Trial', href: '/auth/signup' }}
        secondaryCta={{ label: 'See Childcare Demo', href: '/contact' }}
        trustSignals={[
          'AU-hosted by default',
          '14-day free trial',
          'No credit card required',
          'ACECQA NQF aligned',
        ]}
        dashboardVisual={<NQFDashboardVisual />}
      />

      <VisualDivider />

      <PainPointsGrid
        headline="The Childcare Compliance Reality"
        subheadline="These are the risks that keep nominated supervisors and service managers awake at night."
        painPoints={[
          {
            icon: <AlertTriangle className="h-5 w-5" />,
            title: 'NQF assessment visit with 48-hour notice — evidence not ready',
            description:
              'Assessment and rating visits can land with minimal notice. Services caught without organised evidence for each quality area face lower ratings — or working towards ratings that trigger improvement requirements.',
          },
          {
            icon: <Clock className="h-5 w-5" />,
            title: 'Educator WWC cards and first aid certs expiring without alerts',
            description:
              'Working with Children checks, first aid certificates, and anaphylaxis training all have expiry dates. One lapsed credential means an educator may be non-compliant — a finding at any assessment visit.',
          },
          {
            icon: <FileWarning className="h-5 w-5" />,
            title: 'Quality Improvement Plan not updated — regulatory requirement breached',
            description:
              'Every approved service must maintain a current Quality Improvement Plan. When QIPs fall behind, your service cannot demonstrate continuous improvement — a core NQF expectation.',
          },
          {
            icon: <ShieldAlert className="h-5 w-5" />,
            title: 'Child safety incidents not documented to mandatory reporting standards',
            description:
              'Mandatory reporting obligations vary by state and territory. Incidents must be documented, reported to authorities within required timeframes, and notified to ACECQA where applicable.',
          },
          {
            icon: <UserX className="h-5 w-5" />,
            title: 'Working with Children checks for volunteers not tracked',
            description:
              'Volunteers, students on placement, and visiting professionals all require valid Working with Children checks. Without centralised tracking, gaps appear — and assessors look for exactly this.',
          },
          {
            icon: <Bell className="h-5 w-5" />,
            title: 'Self-assessment not completed — unable to demonstrate continuous improvement',
            description:
              'Services are expected to conduct regular self-assessment against the NQS. Without a structured process, you cannot demonstrate the reflective practice that assessors and regulatory authorities expect.',
          },
        ]}
      />

      <VisualDivider />

      <FrameworkCoverage
        headline="Every Childcare Framework. Pre-Built."
        description="FormaOS ships with every major childcare regulatory framework pre-loaded. Your obligations are mapped from day one — no manual setup required."
        frameworks={[
          {
            name: 'ACECQA National Quality Framework',
            body: 'ACECQA',
            obligationCount: '300+',
            areas: [
              'QA1: Educational program and practice',
              "QA2: Children's health and safety",
              'QA3: Physical environment',
              'QA4: Staffing arrangements',
              'QA5: Relationships with children',
              'QA6: Collaborative partnerships with families and communities',
              'QA7: Governance and leadership',
            ],
          },
          {
            name: 'National Quality Standard',
            body: 'ACECQA',
            obligationCount: '200+',
            areas: [
              '18 standards across 7 quality areas',
              'Element-level requirements for each standard',
              'Exceeding themes: practice is embedded, informed by critical reflection, shaped by meaningful engagement',
              'Assessment and rating descriptors',
            ],
          },
          {
            name: 'Child Protection Legislation',
            body: 'State and Territory Governments',
            obligationCount: '100+',
            areas: [
              'Mandatory reporting obligations by state and territory',
              'Reportable conduct schemes',
              'Child-safe organisation standards',
              'Record-keeping requirements for incidents and disclosures',
            ],
          },
          {
            name: 'Working with Children Check Requirements',
            body: 'State and Territory Screening Agencies',
            obligationCount: '40+',
            areas: [
              'WWC check requirements by jurisdiction',
              'Volunteer and student placement screening',
              'Ongoing validity and renewal tracking',
              'Notification obligations for adverse findings',
            ],
          },
          {
            name: 'Early Childhood Australia Code of Ethics',
            body: 'Early Childhood Australia',
            obligationCount: '30+',
            areas: [
              'Ethical responsibilities to children',
              'Ethical responsibilities to families',
              'Ethical responsibilities to colleagues',
              'Ethical responsibilities to communities and society',
            ],
          },
        ]}
      />

      <VisualDivider />

      <HowItWorks />

      <VisualDivider />

      <IndustryFeatures
        headline="Purpose-Built for Childcare Services"
        subheadline="Every feature designed around real childcare compliance workflows — not generic task management."
        features={[
          {
            title: 'Educator Credentials Table',
            description:
              'See every educator\'s credential status at a glance. WWC cards, first aid certificates, qualifications, and anaphylaxis training — all tracked with RAG status and expiry countdown alerts.',
            details: [
              'Working with Children check status per educator',
              'First aid and CPR certificate expiry tracking',
              'Qualification verification (Cert III, Diploma, Degree)',
              'Anaphylaxis and asthma management training currency',
            ],
            visual: (
              <FeatureVisual
                label="Educator Credential Status"
                rows={[
                  { k: 'Emma Wilson — WWC Check', v: 'Valid to Nov 2027', status: 'green' },
                  { k: 'Priya Sharma — First Aid', v: 'Expiring May 2026', status: 'amber' },
                  { k: 'Liam Chen — Diploma ECEC', v: 'Verified', status: 'green' },
                  { k: 'Sarah Nguyen — Anaphylaxis', v: 'Expired Mar 2026', status: 'red' },
                ]}
              />
            ),
          },
          {
            title: 'NQF Quality Areas Dashboard',
            description:
              'Track compliance across all 7 quality areas with element-level completion tracking. Built-in self-assessment tools help your service demonstrate continuous improvement to assessors.',
            details: [
              '7 quality areas with element-level completion tracking',
              'Self-assessment workflow built into daily operations',
              'Evidence linkage per element and standard',
              'Rating predictor based on current evidence coverage',
            ],
            visual: (
              <FeatureVisual
                label="Quality Area Completion"
                rows={[
                  { k: 'QA1: Educational program', v: '92% — Meeting', status: 'green' },
                  { k: 'QA2: Health and safety', v: '88% — Meeting', status: 'green' },
                  { k: 'QA4: Staffing arrangements', v: '78% — Review', status: 'amber' },
                  { k: 'QA5: Relationships', v: '100% — Exceeding', status: 'green' },
                ]}
              />
            ),
          },
          {
            title: 'Quality Improvement Plan Builder',
            description:
              'Maintain a living QIP that links improvement actions to specific quality areas, tracks progress, and attaches evidence. Always current, always assessment-ready.',
            details: [
              'QIP template aligned to NQF quality areas',
              'Improvement actions with owners and due dates',
              'Evidence attachment per improvement action',
              'Progress tracking with completion history',
            ],
            visual: (
              <FeatureVisual
                label="QIP — Active Improvements"
                rows={[
                  { k: 'QA1: Update curriculum documentation', v: 'In Progress', status: 'amber' },
                  { k: 'QA3: Outdoor learning space plan', v: 'Completed', status: 'green' },
                  { k: 'QA4: Staff-to-child ratio review', v: 'In Progress', status: 'amber' },
                  { k: 'QA6: Family engagement survey', v: 'Completed', status: 'green' },
                ]}
              />
            ),
          },
          {
            title: 'Child Safety Incident Tracker',
            description:
              'Structured mandatory reporting workflows that adapt to your state or territory. ACECQA notification timelines built in, with full investigation and resolution tracking.',
            details: [
              'State-specific mandatory reporting workflows',
              'ACECQA notification timeline tracking',
              'Investigation management with evidence attachment',
              'Resolution and corrective action documentation',
            ],
            visual: (
              <div className="p-5 space-y-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Incident Pipeline</div>
                {['Incident Reported', 'Mandatory Report Filed', 'Investigation Complete', 'ACECQA Notified', 'Resolved'].map((stage, i) => (
                  <div key={stage} className="flex items-center gap-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                      i < 4 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/[0.06] text-slate-500 border border-white/[0.08]'
                    }`}>
                      {i + 1}
                    </div>
                    <span className={`text-xs ${i < 4 ? 'text-white' : 'text-slate-500'}`}>{stage}</span>
                    {i < 4 && <span className="text-[10px] text-emerald-500 ml-auto">Complete</span>}
                  </div>
                ))}
              </div>
            ),
          },
          {
            title: 'Assessment Visit Readiness',
            description:
              'One-click evidence pack export organised by quality area. When the assessor arrives, your evidence is ready — structured, complete, and linked to each NQS element.',
            details: [
              'One-click export organised by quality area',
              'Evidence completeness scoring before export',
              'PDF evidence pack with table of contents per quality area',
              'Gap analysis showing missing evidence per element',
            ],
            visual: (
              <FeatureVisual
                label="Assessment Evidence Pack"
                rows={[
                  { k: 'QA1: Educational program', v: '98% complete', status: 'green' },
                  { k: 'QA2: Health and safety', v: '94% complete', status: 'green' },
                  { k: 'QA4: Staffing arrangements', v: '82% complete', status: 'amber' },
                  { k: 'QA7: Governance and leadership', v: '96% complete', status: 'green' },
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
            persona: 'Multi-service childcare provider, 5 centres across metro and regional',
            need: 'Centralised NQF compliance tracking across all services with consistent evidence quality',
            delivers: 'Pre-built NQF framework, educator credential alerts, one-click evidence packs per service for assessment visits',
          },
          {
            persona: 'Family day care scheme coordinator, 40+ educators',
            need: 'Educator credential management across a distributed workforce with no central office',
            delivers: 'Automated WWC and first aid expiry alerts, self-assessment tools for educators, QIP tracking per educator',
          },
          {
            persona: 'Community kindergarten committee, volunteer-run governance',
            need: 'Simple compliance tracking for a small service with limited admin capacity',
            delivers: 'Pre-built quality area dashboards, volunteer WWC tracking, QIP builder with guided templates',
          },
        ]}
        regulatoryBodies={[
          { name: 'ACECQA', icon: <Shield className="h-4 w-4" /> },
          { name: 'State Regulatory Authorities', icon: <Users className="h-4 w-4" /> },
          { name: 'OAIC', icon: <FileCheck className="h-4 w-4" /> },
        ]}
      />

      <VisualDivider />

      <IndustryCTA industry="Childcare" />

      <VisualDivider />

      <IndustryFAQ
        industry="Childcare"
        faqs={[
          {
            question: 'Does FormaOS cover all 7 NQF quality areas?',
            answer:
              'Yes. All 7 quality areas are pre-built with element-level tracking aligned to the National Quality Standard. Each quality area includes self-assessment workflows, evidence linkage, and completion scoring so your service can demonstrate compliance at any time.',
          },
          {
            question: 'How does FormaOS track educator credentials?',
            answer:
              'FormaOS maintains a centralised credential register for every educator. Working with Children checks, first aid and CPR certificates, anaphylaxis training, and qualifications (Certificate III, Diploma, Degree) are all tracked with RAG status indicators and configurable expiry alerts at 90, 60, and 30 days.',
          },
          {
            question: 'Can FormaOS help build and maintain our Quality Improvement Plan?',
            answer:
              'Yes. The QIP Builder provides a structured template aligned to NQF quality areas. You create improvement actions linked to specific quality areas, assign owners and due dates, attach evidence of progress, and track completion — keeping your QIP current and assessment-ready at all times.',
          },
          {
            question: 'How does FormaOS handle mandatory reporting by state?',
            answer:
              'FormaOS provides state-specific mandatory reporting workflows that guide staff through the correct reporting process for their jurisdiction. Each incident is tracked through its lifecycle — from initial report to authority notification to investigation to resolution — with ACECQA notification timelines built in.',
          },
          {
            question: 'Can FormaOS help us prepare for assessment and rating visits?',
            answer:
              'FormaOS maintains continuous assessment readiness. Evidence is collected and organised by quality area as part of daily operations. When an assessment visit is notified, you can generate a structured evidence pack per quality area with one click — including gap analysis showing any missing evidence per element.',
          },
          {
            question: 'Does FormaOS track Working with Children checks for volunteers?',
            answer:
              'Yes. FormaOS tracks WWC checks for all personnel including educators, volunteers, students on placement, and visiting professionals. Each jurisdiction has different screening requirements — FormaOS maps these automatically and alerts you to expiring or missing checks.',
          },
          {
            question: 'Is our data stored in Australia?',
            answer:
              'Yes. FormaOS is AU-hosted by default. All service data, educator records, child information, and compliance evidence remain on Australian infrastructure. Your data never leaves Australia, supporting your obligations under the Australian Privacy Principles for handling children\'s personal information.',
          },
        ]}
      />
    </MarketingPageShell>
  );
}

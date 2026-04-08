'use client';

import {
  AlertTriangle,
  FileWarning,
  Clock,
  LayoutDashboard,
  Settings,
  RefreshCw,
  Shield,
  Scale,
  Landmark,
} from 'lucide-react';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { VisualDivider } from '@/components/motion';
import { IndustryHero } from '@/components/marketing/industry/IndustryHero';
import { PainPointsGrid } from '@/components/marketing/industry/PainPointsGrid';
import { FrameworkCoverage } from '@/components/marketing/industry/FrameworkCoverage';
import { HowItWorks } from '@/components/marketing/industry/HowItWorks';
import { IndustryFeatures } from '@/components/marketing/industry/IndustryFeatures';
import { SocialProof } from '@/components/marketing/industry/SocialProof';
import { IndustryCTA } from '@/components/marketing/industry/IndustryCTA';
import { IndustryFAQ } from '@/components/marketing/industry/IndustryFAQ';

/* ------------------------------------------------------------------ */
/*  Feature visual helper                                              */
/* ------------------------------------------------------------------ */

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
              {r.status && <span className={`h-2 w-2 rounded-full ${r.status === 'green' ? 'bg-emerald-500' : r.status === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard visual for hero                                          */
/* ------------------------------------------------------------------ */

function ObligationsRegisterVisual() {
  const rows = [
    { obligation: 'General conduct obligations', ref: 's912A(1)(a)', owner: 'Head of Compliance', status: 'mapped', due: '30 Jun 2026' },
    { obligation: 'Financial resource requirements', ref: 's912A(1)(d)', owner: 'CFO', status: 'mapped', due: '31 Mar 2026' },
    { obligation: 'Breach reporting — s912D', ref: 's912D', owner: 'Compliance Manager', status: 'amber', due: '15 Apr 2026' },
    { obligation: 'AML/CTF Program — Part A', ref: 'AML/CTF Act s81', owner: 'MLRO', status: 'mapped', due: '30 Sep 2026' },
    { obligation: 'CPS 230 — Critical operations', ref: 'CPS 230.28', owner: 'COO', status: 'unmapped', due: '01 Jul 2026' },
    { obligation: 'IDR procedures', ref: 'RG 271.73', owner: 'Complaints Officer', status: 'mapped', due: '30 Jun 2026' },
  ];

  const statusStyles: Record<string, { dot: string; label: string }> = {
    mapped: { dot: 'bg-emerald-500', label: 'Mapped' },
    amber: { dot: 'bg-amber-500', label: 'At Risk' },
    unmapped: { dot: 'bg-red-500', label: 'Unmapped' },
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Obligations Register</span>
        <span className="text-[10px] text-slate-500">6 of 312 obligations shown</span>
      </div>
      {/* Column headings */}
      <div className="grid grid-cols-[1fr_90px_120px_80px_90px] gap-2 px-5 py-2 border-b border-white/[0.04] text-[10px] text-slate-500 uppercase tracking-wider">
        <span>Obligation</span>
        <span>Ref</span>
        <span>Owner</span>
        <span>Status</span>
        <span>Due</span>
      </div>
      {/* Rows */}
      {rows.map((r) => (
        <div
          key={r.ref}
          className="grid grid-cols-[1fr_90px_120px_80px_90px] gap-2 px-5 py-2.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
        >
          <span className="text-xs text-white truncate">{r.obligation}</span>
          <span className="text-[10px] text-slate-500 font-mono">{r.ref}</span>
          <span className="text-[10px] text-slate-400 truncate">{r.owner}</span>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${statusStyles[r.status].dot}`} />
            <span className="text-[10px] text-slate-400">{statusStyles[r.status].label}</span>
          </div>
          <span className="text-[10px] text-slate-500">{r.due}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main content                                                       */
/* ------------------------------------------------------------------ */

export default function FinancialServicesContent() {
  return (
    <MarketingPageShell>
      {/* ---- Hero ---- */}
      <IndustryHero
        eyebrow="ASIC + APRA + AUSTRAC Ready"
        headline={
          <>
            Your AFS Licence Obligations.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Governed.
            </span>
          </>
        }
        subheadline="ASIC s912A obligations, APRA CPS 230 operational risk requirements, and AUSTRAC AML/CTF programme duties — mapped to named owners with immutable evidence chains. FormaOS turns every licence condition into a governed workflow so nothing falls through the cracks."
        primaryCta={{ label: 'Start Free Trial', href: '/signup' }}
        secondaryCta={{ label: 'Book a Demo', href: '/contact' }}
        trustSignals={[
          'AU-hosted infrastructure',
          '14-day free trial',
          'No credit card required',
          'ASIC-ready audit trail',
        ]}
        dashboardVisual={<ObligationsRegisterVisual />}
      />

      <VisualDivider />

      {/* ---- Pain Points ---- */}
      <PainPointsGrid
        headline="Why financial services compliance keeps you up at night"
        subheadline="AFS licensees juggle overlapping regulators, shifting obligations, and board scrutiny — with tooling that was never built for the job."
        painPoints={[
          {
            icon: <AlertTriangle className="h-5 w-5" />,
            title: 'AFS licence conditions not mapped to operational obligations',
            description:
              'Licence conditions sit in legal documents while day-to-day operations run independently. Gaps between what your licence requires and what your team actually does remain invisible until an ASIC review surfaces them.',
          },
          {
            icon: <FileWarning className="h-5 w-5" />,
            title: 'Breach register not maintained — s912D self-reporting missed',
            description:
              'Without a centralised breach register, reportable situations under s912D are identified late or not at all. Self-reporting obligations carry strict timeframes, and missed deadlines compound regulatory risk.',
          },
          {
            icon: <Clock className="h-5 w-5" />,
            title: 'AUSTRAC AML/CTF annual compliance report deadlines missed',
            description:
              'The annual compliance report to AUSTRAC requires evidence of programme effectiveness across the year. Assembling that evidence manually from scattered systems creates last-minute scrambles and incomplete submissions.',
          },
          {
            icon: <LayoutDashboard className="h-5 w-5" />,
            title: 'Board unable to demonstrate oversight of compliance programme',
            description:
              'Directors need to evidence active oversight of the compliance programme. Without structured board reporting, there is no documented trail showing the board received, questioned, and acted on compliance information.',
          },
          {
            icon: <Settings className="h-5 w-5" />,
            title: 'APRA CPS 230 operational risk framework not operationalised',
            description:
              'CPS 230 requires identification of critical operations, tolerance settings, and business continuity testing. Many organisations have the policy but lack the operational systems to track and evidence compliance.',
          },
          {
            icon: <RefreshCw className="h-5 w-5" />,
            title: 'Regulatory change management done manually with no tracking',
            description:
              'When ASIC, APRA, or AUSTRAC issue new guidance or legislative instruments, changes are tracked via email threads and ad-hoc spreadsheets. There is no systematic way to assess impact, assign owners, or verify implementation.',
          },
        ]}
      />

      <VisualDivider />

      {/* ---- Framework Coverage ---- */}
      <FrameworkCoverage
        headline="Obligation coverage across every financial services regulator"
        description="Pre-built frameworks map your ASIC, APRA, AUSTRAC, and AFCA obligations out of the box. Each obligation links to an owner, evidence requirement, and review cycle."
        frameworks={[
          {
            name: 'ASIC AFS Licence — s912A Obligations',
            body: 'Australian Securities and Investments Commission',
            obligationCount: '300+',
            areas: [
              'General conduct obligations',
              'Financial resource requirements',
              'Organisational competence',
              'Risk management systems',
              'Dispute resolution (IDR/EDR)',
              'Breach reporting and self-reporting',
              'Client money and property handling',
              'Disclosure and conduct obligations',
            ],
          },
          {
            name: 'APRA CPS 230 — Operational Risk Management',
            body: 'Australian Prudential Regulation Authority',
            obligationCount: '150+',
            areas: [
              'Critical operations identification',
              'Tolerance levels and settings',
              'Business continuity planning',
              'Third-party risk management',
              'Scenario analysis and testing',
              'Board and senior management oversight',
            ],
          },
          {
            name: 'AUSTRAC AML/CTF Programme Requirements',
            body: 'Australian Transaction Reports and Analysis Centre',
            obligationCount: '120+',
            areas: [
              'Part A — Customer identification',
              'Part B — Customer due diligence',
              'Ongoing customer due diligence',
              'Suspicious matter reporting',
              'Threshold transaction reporting',
              'Annual compliance report',
            ],
          },
          {
            name: 'AFCA Membership Obligations',
            body: 'Australian Financial Complaints Authority',
            obligationCount: '60+',
            areas: [
              'Internal dispute resolution procedures',
              'AFCA notification requirements',
              'Complaint handling timeframes',
              'Systemic issue identification',
            ],
          },
          {
            name: 'ASIC Regulatory Guides 104, 132, 259',
            body: 'Australian Securities and Investments Commission',
            obligationCount: '200+',
            areas: [
              'RG 104 — AFS licence conditions',
              'RG 132 — Managed investment scheme compliance plans',
              'RG 259 — Risk management systems for responsible entities',
              'Cross-guide compliance mapping',
              'Guidance implementation tracking',
            ],
          },
        ]}
      />

      <VisualDivider />

      {/* ---- How It Works ---- */}
      <HowItWorks />

      <VisualDivider />

      {/* ---- Features ---- */}
      <IndustryFeatures
        headline="Purpose-built for AFS licensees"
        subheadline="Every feature is designed around the obligations, registers, and reporting that Australian financial services organisations actually need."
        features={[
          {
            title: 'Obligations Register',
            description:
              'Every ASIC, APRA, and AUSTRAC obligation mapped to licence conditions with regulation references, named owners, evidence requirements, and review schedules.',
            details: [
              'Pre-loaded obligation sets for AFS licence conditions',
              'Regulation reference linked to each obligation (e.g. s912A(1)(a))',
              'Named owner assignment with escalation paths',
              'RAG status tracking — mapped, at risk, unmapped, breached',
              'Scheduled review cycles with automated reminders',
            ],
            visual: (
              <FeatureVisual
                label="Obligations Register"
                rows={[
                  { k: 'General conduct — s912A(1)(a)', v: 'Head of Compliance', status: 'green' },
                  { k: 'Financial resources — s912A(1)(d)', v: 'CFO', status: 'green' },
                  { k: 'Breach reporting — s912D', v: 'Compliance Mgr', status: 'amber' },
                  { k: 'CPS 230 — Critical operations', v: 'COO', status: 'red' },
                ]}
              />
            ),
          },
          {
            title: 'Breach Register',
            description:
              'Centralised register for reportable situations under s912D with self-reporting workflow, days-since-detection counter, and immutable audit trail.',
            details: [
              's912D reportable situation classification',
              'Days-since-detection counter with regulatory deadline alerts',
              'Self-reporting workflow — draft, review, lodge, confirm',
              'Root cause analysis and remediation tracking',
              'Immutable evidence chain from detection to resolution',
            ],
            visual: (
              <FeatureVisual
                label="Breach Register"
                rows={[
                  { k: 'BR-2026-041 — Client money shortfall', v: '12 days', status: 'red' },
                  { k: 'BR-2026-038 — Disclosure failure', v: '28 days', status: 'amber' },
                  { k: 'BR-2026-035 — Training lapse', v: 'Resolved', status: 'green' },
                  { k: 'BR-2026-029 — SOA deficiency', v: 'Resolved', status: 'green' },
                ]}
              />
            ),
          },
          {
            title: 'Board Reporting Pack',
            description:
              'One-click PDF generation with RAG compliance status, open breach summary, upcoming regulatory deadlines, and attestation-ready formatting for directors.',
            details: [
              'RAG status dashboard across all obligation categories',
              'Open breaches with days outstanding and severity',
              'Upcoming regulatory deadlines — next 30/60/90 days',
              'Compliance programme effectiveness metrics',
              'Director attestation and sign-off workflow',
            ],
            visual: (
              <FeatureVisual
                label="Board Reporting Pack"
                rows={[
                  { k: 'Overall compliance posture', v: '94%', status: 'green' },
                  { k: 'Open breaches', v: '2 active', status: 'amber' },
                  { k: 'Overdue obligations', v: '0', status: 'green' },
                  { k: 'Next regulatory deadline', v: '15 Apr 2026', status: 'amber' },
                ]}
              />
            ),
          },
          {
            title: 'AML/CTF Programme Tracking',
            description:
              'Map AUSTRAC AML/CTF programme obligations across Part A and Part B, track annual compliance report requirements, and monitor suspicious matter reporting.',
            details: [
              'Part A and Part B obligation coverage dashboard',
              'Customer identification procedure tracking',
              'Ongoing customer due diligence monitoring',
              'Annual compliance report deadline tracker with evidence assembly',
              'Suspicious matter and threshold transaction reporting log',
            ],
            visual: (
              <FeatureVisual
                label="AML/CTF Programme"
                rows={[
                  { k: 'Part A — Customer ID', v: '100% covered', status: 'green' },
                  { k: 'Part B — CDD procedures', v: '96% covered', status: 'green' },
                  { k: 'Annual report', v: 'Due 30 Sep', status: 'amber' },
                  { k: 'SMR log', v: '3 pending', status: 'amber' },
                ]}
              />
            ),
          },
          {
            title: 'AFCA Dispute Register',
            description:
              'Track complaints from intake through resolution with AFCA notification workflow, resolution timelines, and systemic issue identification.',
            details: [
              'Complaint intake with categorisation and severity',
              'Internal dispute resolution (IDR) timeframe tracking',
              'AFCA escalation and notification workflow',
              'Resolution timeline monitoring against regulatory requirements',
              'Systemic issue identification and reporting',
            ],
            visual: (
              <FeatureVisual
                label="AFCA Dispute Register"
                rows={[
                  { k: 'DR-2026-118 — Fee dispute', v: 'IDR — Day 14', status: 'green' },
                  { k: 'DR-2026-112 — Advice complaint', v: 'AFCA escalated', status: 'red' },
                  { k: 'DR-2026-105 — Service delay', v: 'Resolved', status: 'green' },
                  { k: 'DR-2026-099 — Disclosure query', v: 'Resolved', status: 'green' },
                ]}
              />
            ),
          },
        ]}
      />

      <VisualDivider />

      {/* ---- Social Proof ---- */}
      <SocialProof
        metricsBanner={[
          '95+ routes',
          '206+ tables with RLS',
          'AU-hosted by default',
          'SOC 2 in progress',
        ]}
        trustCards={[
          {
            persona: 'Boutique AFS Licensee',
            need: 'Map all s912A obligations to named owners and maintain a breach register without hiring a dedicated compliance team.',
            delivers:
              'Pre-loaded obligation register with RAG tracking, automated breach workflow, and board-ready reporting — run by a team of three.',
          },
          {
            persona: 'Non-bank Credit Provider',
            need: 'Demonstrate AUSTRAC AML/CTF programme compliance and prepare the annual compliance report without months of evidence gathering.',
            delivers:
              'Continuous evidence capture across AML/CTF obligations with one-click annual report assembly and AUSTRAC-aligned audit trail.',
          },
          {
            persona: 'Wealth Management Firm',
            need: 'Provide directors with structured compliance oversight across ASIC, APRA, and AFCA obligations for board meetings.',
            delivers:
              'Unified board reporting pack covering all three regulators, open breaches, upcoming deadlines, and attestation workflow.',
          },
        ]}
        regulatoryBodies={[
          { name: 'ASIC', icon: <Scale className="h-6 w-6" /> },
          { name: 'APRA', icon: <Shield className="h-6 w-6" /> },
          { name: 'AUSTRAC', icon: <Landmark className="h-6 w-6" /> },
        ]}
      />

      <VisualDivider />

      {/* ---- CTA ---- */}
      <IndustryCTA industry="Financial Services" />

      <VisualDivider />

      {/* ---- FAQ ---- */}
      <IndustryFAQ
        industry="Financial Services"
        faqs={[
          {
            question: 'Which ASIC Regulatory Guides does FormaOS cover?',
            answer:
              'FormaOS includes pre-built obligation sets for key Regulatory Guides including RG 104 (AFS licence conditions), RG 132 (managed investment scheme compliance plans), and RG 259 (risk management systems for responsible entities). Obligations from each guide are mapped to named owners with evidence requirements and review schedules.',
          },
          {
            question: 'How does FormaOS handle AUSTRAC AML/CTF programme requirements?',
            answer:
              'FormaOS maps the full AUSTRAC AML/CTF programme structure — Part A (customer identification) and Part B (customer due diligence) — to operational workflows. The platform tracks ongoing CDD obligations, suspicious matter reporting, threshold transaction reporting, and assembles evidence for the annual compliance report to AUSTRAC.',
          },
          {
            question: 'Can FormaOS manage s912D breach reporting?',
            answer:
              'Yes. The breach register includes a dedicated s912D workflow covering reportable situation classification, days-since-detection counters, self-reporting deadline alerts, root cause analysis, and remediation tracking. Every step is recorded with an immutable audit trail for regulatory review.',
          },
          {
            question: 'Does FormaOS support APRA CPS 230 operational risk requirements?',
            answer:
              'FormaOS includes a CPS 230 obligation framework covering critical operations identification, tolerance settings, business continuity planning, third-party risk management, and scenario testing. Each obligation is assigned to an owner with evidence requirements and scheduled review cycles.',
          },
          {
            question: 'What does the board reporting pack include?',
            answer:
              'The board reporting pack generates a one-click PDF containing RAG compliance status across all obligation categories, open breach summaries with days outstanding, upcoming regulatory deadlines for the next 30, 60, and 90 days, and compliance programme effectiveness metrics. Directors can sign off with a structured attestation workflow.',
          },
          {
            question: 'How does FormaOS handle AFCA dispute tracking?',
            answer:
              'FormaOS provides a dedicated dispute register with complaint intake, categorisation, IDR timeframe tracking, and AFCA escalation workflows. The platform monitors resolution timelines against regulatory requirements and identifies systemic issues for proactive reporting.',
          },
          {
            question: 'Is data hosted in Australia?',
            answer:
              'Yes. FormaOS is hosted on Australian infrastructure by default. All data — including obligation registers, breach records, evidence files, and audit logs — remains within Australian data centres. This meets data sovereignty requirements for regulated financial services organisations.',
          },
        ]}
      />
    </MarketingPageShell>
  );
}

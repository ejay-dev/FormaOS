'use client';

import { RelatedIndustries } from '@/components/marketing/RelatedIndustries';
import { SectionMedia } from '@/components/marketing/SectionMedia';
import {
  compliancePlanHref,
  demoHref,
  PUBLIC_CTA_LABELS,
} from '@/lib/marketing/cta';
import { Shield, Scale, Landmark, Monitor, FileText, Bell } from 'lucide-react';
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
import {
  IndustryHero,
  IndustryFeatures,
  SocialProof,
  IndustryCTA,
  IndustryFAQ,
  InteractiveDashboard,
  BeforeAfterSection,
  FrameworkExplorer,
  HeroStatsBar,
  CompareTable,
  SeeItInAction,
  DemoDashboardContent,
  DemoAuditExport,
  DemoNotificationTimeline,
} from '@/components/marketing/industry';

/* ------------------------------------------------------------------ */
/*  Feature visual helper                                              */
/* ------------------------------------------------------------------ */

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
                  className={`h-2 w-2 rounded-full ${r.status === 'green' ? 'bg-success' : r.status === 'amber' ? 'bg-warning' : 'bg-destructive'}`}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Interactive Dashboard visual for hero                               */
/* ------------------------------------------------------------------ */

function ObligationsRegisterVisual() {
  return (
    <InteractiveDashboard
      title="AFS Licence Obligations"
      subtitle="Obligations Register"
      industry="Financial Services"
      tabs={[
        { id: 'all', label: 'All Obligations', count: 312 },
        { id: 'breaches', label: 'Breach Register', count: 2 },
        { id: 'board', label: 'Board Pack', count: 1 },
      ]}
      statusCounts={[
        { label: 'Mapped', count: 4, color: 'green' },
        { label: 'At Risk', count: 1, color: 'amber' },
        { label: 'Unmapped', count: 1, color: 'red' },
      ]}
      columns={[
        { key: 'obligation', label: 'Obligation' },
        { key: 'ref', label: 'Ref', hideOnMobile: true },
        { key: 'status', label: 'Status' },
        { key: 'due', label: 'Due', hideOnMobile: true },
      ]}
      rows={[
        {
          id: 'o1',
          status: 'green',
          cells: {
            obligation: 'General conduct obligations',
            ref: 's912A(1)(a)',
            status: 'Mapped',
            due: '30 Jun 2026',
          },
          expandedContent: {
            label: 'Obligation Details',
            items: [
              { key: 'Owner', value: 'Head of Compliance' },
              { key: 'Regulator', value: 'ASIC' },
              { key: 'Evidence Count', value: '12 documents attached' },
              { key: 'Last Reviewed', value: '15 Mar 2026' },
            ],
          },
        },
        {
          id: 'o2',
          status: 'green',
          cells: {
            obligation: 'Financial resource requirements',
            ref: 's912A(1)(d)',
            status: 'Mapped',
            due: '31 Mar 2026',
          },
          expandedContent: {
            label: 'Obligation Details',
            items: [
              { key: 'Owner', value: 'CFO' },
              { key: 'Regulator', value: 'ASIC' },
              { key: 'Evidence Count', value: '8 documents attached' },
              { key: 'Last Reviewed', value: '01 Mar 2026' },
            ],
          },
        },
        {
          id: 'o3',
          status: 'amber',
          cells: {
            obligation: 'Breach reporting (s912D)',
            ref: 's912D',
            status: 'At Risk',
            due: '15 Apr 2026',
          },
          expandedContent: {
            label: 'Obligation details: review',
            items: [
              { key: 'Owner', value: 'Compliance Manager' },
              { key: 'Issue', value: 'Self-report deadline approaching' },
              { key: 'Days Since Detection', value: '18 days' },
              { key: 'Action', value: 'Report being prepared for lodgement' },
            ],
          },
        },
        {
          id: 'o4',
          status: 'green',
          cells: {
            obligation: 'AML/CTF Program, Part A',
            ref: 'AML/CTF Act s81',
            status: 'Mapped',
            due: '30 Sep 2026',
          },
          expandedContent: {
            label: 'Obligation Details',
            items: [
              { key: 'Owner', value: 'MLRO' },
              { key: 'Regulator', value: 'AUSTRAC' },
              { key: 'Annual Report Due', value: '30 Sep 2026' },
              { key: 'Program Review', value: 'Completed Feb 2026' },
            ],
          },
        },
        {
          id: 'o5',
          status: 'red',
          cells: {
            obligation: 'CPS 230, Critical operations',
            ref: 'CPS 230.28',
            status: 'Unmapped',
            due: '01 Jul 2026',
          },
          expandedContent: {
            label: 'Obligation details: action required',
            items: [
              { key: 'Owner', value: 'COO (unassigned)' },
              { key: 'Regulator', value: 'APRA' },
              { key: 'Gap', value: 'No operational risk framework documented' },
              { key: 'Deadline', value: 'CPS 230 enforcement from 1 Jul 2025' },
            ],
          },
        },
        {
          id: 'o6',
          status: 'green',
          cells: {
            obligation: 'IDR procedures',
            ref: 'RG 271.73',
            status: 'Mapped',
            due: '30 Jun 2026',
          },
          expandedContent: {
            label: 'Obligation Details',
            items: [
              { key: 'Owner', value: 'Complaints Officer' },
              { key: 'Regulator', value: 'ASIC' },
              { key: 'AFCA Membership', value: 'Active, Member #12345' },
              { key: 'Last Reviewed', value: '20 Feb 2026' },
            ],
          },
        },
      ]}
      notifications={[
        {
          message: 's912D breach report deadline in 6 days',
          time: '3 hours ago',
          type: 'alert',
        },
        {
          message: 'CPS 230 critical operations, unmapped obligation',
          time: '1 day ago',
          type: 'alert',
        },
        {
          message: 'AUSTRAC annual report on track',
          time: '1 week ago',
          type: 'success',
        },
      ]}
      exportLabel="Board Pack"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Main content                                                       */
/* ------------------------------------------------------------------ */

export default function FinancialServicesContent() {
  return (
    <MarketingPageShell>
      {/* ---- Hero ---- */}
      <div className="relative isolate overflow-hidden">
        <SectionMedia
          src="/marketing-media/use-case-financial-services.jpg"
          objectPosition="50% 35%"
          opacity={0.5}
          scrim="center"
        />
        <IndustryHero
          headline={
            <>
              Thirty days from the
              <br />
              moment you <span className="mk-accent">knew</span>
            </>
          }
          subheadline="A reportable situation is due to ASIC within 30 days of the reasonable grounds test. FormaOS keeps the register, the clock and the evidence together."
          primaryCta={{
            label: PUBLIC_CTA_LABELS.compliancePlan,
            href: compliancePlanHref('financial_services_compliance'),
          }}
          secondaryCta={{
            label: PUBLIC_CTA_LABELS.bookDemo,
            href: demoHref('financial_services_compliance'),
          }}
          trustSignals={[
            'AU-hosted infrastructure',
            'Assessment-led onboarding',
            'Compliance plan scoped by framework',
            'ASIC-ready audit trail',
          ]}
          dashboardVisual={<ObligationsRegisterVisual />}
          statsBar={
            <HeroStatsBar
              stats={[
                '300+ ASIC obligations mapped',
                's912D breach tracking',
                'Board reporting automated',
                'AU-hosted',
              ]}
            />
          }
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ---- Pain Points ---- */}
      <BeforeAfterSection
        headline="Where the 30-day clock is usually lost"
        subheadline="Not in the lodgement. In the weeks before anyone agreed the situation was reportable."
        without={[
          'Breach register not maintained, s912D self-reporting deadlines missed or detected late',
          'No record of when reasonable grounds were formed, so the clock cannot be evidenced afterwards',
          'AFS licence conditions not mapped to operational obligations, gaps invisible until ASIC review',
          'Board unable to demonstrate active oversight, no structured compliance reporting to directors',
        ]}
        withFormaOS={[
          'Centralised breach register with s912D workflow, days-since-detection counter, and deadline alerts',
          'Detection, classification and sign-off timestamped, so the clock is defensible on review',
          'Every licence condition mapped to named owners with evidence requirements and review schedules',
          'One-click board reporting pack with RAG status, open breaches, and attestation workflow',
        ]}
      />

      <CompareTable
        headline="Compared with spreadsheets and legacy GRC tools"
        description="Legacy GRC holds a register. It rarely holds the evidence, the owner and the clock against the same obligation."
        col2Label="Legacy GRC Tools"
        rows={[
          {
            feature: 'ASIC obligation register pre-built',
            spreadsheets: 'no',
            genericGrc: 'partial',
            formaos: 'yes',
          },
          {
            feature: 's912D breach register',
            spreadsheets: 'no',
            genericGrc: 'partial',
            formaos: 'yes',
          },
          {
            feature: 'Board reporting pack',
            spreadsheets: 'no',
            genericGrc: 'partial',
            formaos: 'yes',
          },
          {
            feature: 'APRA CPS 230 tracking',
            spreadsheets: 'no',
            genericGrc: 'no',
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
            feature: 'AUSTRAC AML/CTF tracking',
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

      {/* ---- Framework Coverage ---- */}
      <FrameworkExplorer
        headline="Obligation coverage across every financial services regulator"
        description="Pre-built frameworks map your ASIC, APRA, AUSTRAC, and AFCA obligations out of the box. Each obligation links to an owner, evidence requirement, and review cycle."
        frameworks={[
          {
            id: 'asic-afs',
            name: 'ASIC AFS licence: s912A obligations',
            body: 'Australian Securities and Investments Commission',
            updated: '2025-11-15',
            obligationCount: '300+',
            requirements: [
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
            id: 'apra-cps230',
            name: 'APRA CPS 230: operational risk management',
            body: 'Australian Prudential Regulation Authority',
            updated: '2025-12-01',
            obligationCount: '150+',
            requirements: [
              'Critical operations identification',
              'Tolerance levels and settings',
              'Business continuity planning',
              'Third-party risk management',
              'Scenario analysis and testing',
              'Board and senior management oversight',
            ],
          },
          {
            id: 'austrac',
            name: 'AUSTRAC AML/CTF Programme Requirements',
            body: 'Australian Transaction Reports and Analysis Centre',
            updated: '2026-01-10',
            obligationCount: '120+',
            requirements: [
              'Part A, Customer identification',
              'Part B, Customer due diligence',
              'Ongoing customer due diligence',
              'Suspicious matter reporting',
              'Threshold transaction reporting',
              'Annual compliance report',
            ],
          },
          {
            id: 'afca',
            name: 'AFCA Membership Obligations',
            body: 'Australian Financial Complaints Authority',
            updated: '2025-09-20',
            obligationCount: '60+',
            requirements: [
              'Internal dispute resolution procedures',
              'AFCA notification requirements',
              'Complaint handling timeframes',
              'Systemic issue identification',
            ],
          },
          {
            id: 'asic-rg',
            name: 'ASIC Regulatory Guides 104, 132, 259',
            body: 'Australian Securities and Investments Commission',
            updated: '2025-10-05',
            obligationCount: '200+',
            requirements: [
              'RG 104, AFS licence conditions',
              'RG 132, Managed investment scheme compliance plans',
              'RG 259, Risk management systems for responsible entities',
              'Cross-guide compliance mapping',
              'Guidance implementation tracking',
            ],
          },
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ---- Features ---- */}
      <IndustryFeatures
        headline="The registers a licensee is asked to produce"
        subheadline="Obligations, breaches, board reporting, AML/CTF and disputes, each with a named owner and an evidence trail."
        features={[
          {
            title: 'Obligations Register',
            description:
              'Every ASIC, APRA, and AUSTRAC obligation mapped to licence conditions with regulation references, named owners, evidence requirements, and review schedules.',
            details: [
              'Pre-loaded obligation sets for AFS licence conditions',
              'Regulation reference linked to each obligation (e.g. s912A(1)(a))',
              'Named owner assignment with escalation paths',
              'RAG status tracking, mapped, at risk, unmapped, breached',
              'Scheduled review cycles with automated reminders',
            ],
            visual: (
              <FeatureVisual
                label="Obligations Register"
                rows={[
                  {
                    k: 'General conduct, s912A(1)(a)',
                    v: 'Head of Compliance',
                    status: 'green',
                  },
                  {
                    k: 'Financial resources, s912A(1)(d)',
                    v: 'CFO',
                    status: 'green',
                  },
                  {
                    k: 'Breach reporting, s912D',
                    v: 'Compliance Mgr',
                    status: 'amber',
                  },
                  {
                    k: 'CPS 230, Critical operations',
                    v: 'COO',
                    status: 'red',
                  },
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
              'Self-reporting workflow, draft, review, lodge, confirm',
              'Root cause analysis and remediation tracking',
              'Immutable evidence chain from detection to resolution',
            ],
            visual: (
              <FeatureVisual
                label="Breach Register"
                rows={[
                  {
                    k: 'BR-2026-041, Client money shortfall',
                    v: '12 days',
                    status: 'red',
                  },
                  {
                    k: 'BR-2026-038, Disclosure failure',
                    v: '28 days',
                    status: 'amber',
                  },
                  {
                    k: 'BR-2026-035, Training lapse',
                    v: 'Resolved',
                    status: 'green',
                  },
                  {
                    k: 'BR-2026-029, SOA deficiency',
                    v: 'Resolved',
                    status: 'green',
                  },
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
              'Upcoming regulatory deadlines, next 30/60/90 days',
              'Compliance programme effectiveness metrics',
              'Director attestation and sign-off workflow',
            ],
            visual: (
              <FeatureVisual
                label="Board Reporting Pack"
                rows={[
                  {
                    k: 'Overall compliance posture',
                    v: '94%',
                    status: 'green',
                  },
                  { k: 'Open breaches', v: '2 active', status: 'amber' },
                  { k: 'Overdue obligations', v: '0', status: 'green' },
                  {
                    k: 'Next regulatory deadline',
                    v: '15 Apr 2026',
                    status: 'amber',
                  },
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
                  {
                    k: 'Part A, Customer ID',
                    v: '100% covered',
                    status: 'green',
                  },
                  {
                    k: 'Part B, CDD procedures',
                    v: '96% covered',
                    status: 'green',
                  },
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
                  {
                    k: 'DR-2026-118, Fee dispute',
                    v: 'IDR, Day 14',
                    status: 'green',
                  },
                  {
                    k: 'DR-2026-112, Advice complaint',
                    v: 'AFCA escalated',
                    status: 'red',
                  },
                  {
                    k: 'DR-2026-105, Service delay',
                    v: 'Resolved',
                    status: 'green',
                  },
                  {
                    k: 'DR-2026-099, Disclosure query',
                    v: 'Resolved',
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

      {/* ---- See It In Action ---- */}
      <SeeItInAction
        tabs={[
          {
            id: 'breaches',
            label: 'Breach Timeline',
            icon: <Bell className="h-4 w-4" />,
            content: (
              <DemoNotificationTimeline
                steps={[
                  {
                    time: 'T+0:00',
                    label:
                      'Reportable situation detected, s912D workflow initiated',
                    status: 'complete',
                  },
                  {
                    time: 'T+1:00',
                    label: 'Breach classification completed, severity assessed',
                    status: 'complete',
                  },
                  {
                    time: 'T+24:00',
                    label: 'Investigation commenced, root cause analysis',
                    status: 'complete',
                  },
                  {
                    time: 'T+48:00',
                    label: 'Compliance Officer review and sign-off',
                    status: 'active',
                  },
                  {
                    time: 'T+20d',
                    label: 'ASIC self-report lodged within 30-day window',
                    status: 'pending',
                  },
                  {
                    time: 'T+60d',
                    label: 'Remediation verified, breach register closed',
                    status: 'pending',
                  },
                ]}
              />
            ),
          },
          {
            id: 'dashboard',
            label: 'Obligations Dashboard',
            icon: <Monitor className="h-4 w-4" />,
            content: (
              <DemoDashboardContent
                title="Financial Services Compliance Overview"
                rows={[
                  {
                    label: 'ASIC AFS, s912A Obligations',
                    value: '97%',
                    status: 'green',
                  },
                  {
                    label: 'APRA CPS 230, Operational Risk',
                    value: '94%',
                    status: 'green',
                  },
                  {
                    label: 'AUSTRAC AML/CTF Programme',
                    value: '100%',
                    status: 'green',
                  },
                  {
                    label: 'AFCA, Dispute Register',
                    value: '96%',
                    status: 'green',
                  },
                  {
                    label: 'Breach Register, s912D',
                    value: '2 active',
                    status: 'amber',
                  },
                  {
                    label: 'Board Pack, Next Due',
                    value: '15 days',
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
                    name: 'ASIC AFS Licence Obligations',
                    score: '97%',
                    items: 300,
                  },
                  {
                    name: 'APRA CPS 230, Operational Risk',
                    score: '94%',
                    items: 150,
                  },
                  {
                    name: 'AUSTRAC AML/CTF Programme',
                    score: '100%',
                    items: 120,
                  },
                  {
                    name: 'AFCA Membership Obligations',
                    score: '96%',
                    items: 60,
                  },
                  { name: 'ASIC Regulatory Guides', score: '95%', items: 200 },
                ]}
              />
            ),
          },
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ---- Social Proof ---- */}
      <SocialProof
        metricsBanner={[
          'ASIC, APRA, AUSTRAC and AFCA obligations pre-built',
          's912D breach workflow with days-since-detection',
          'AU-hosted by default, data never leaves Australia',
          'Immutable, timestamped evidence chain',
        ]}
        trustCards={[
          {
            persona: 'A boutique AFS licensee',
            need: 'Map all s912A obligations to named owners and maintain a breach register without hiring a dedicated compliance team.',
            delivers:
              'Pre-loaded obligation register with RAG tracking, automated breach workflow, and board-ready reporting, run by a team of three.',
          },
          {
            persona: 'A non-bank credit provider',
            need: 'Demonstrate AUSTRAC AML/CTF programme compliance and prepare the annual compliance report without months of evidence gathering.',
            delivers:
              'Continuous evidence capture across AML/CTF obligations with one-click annual report assembly and AUSTRAC-aligned audit trail.',
          },
          {
            persona: 'A wealth management firm',
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ---- CTA ---- */}
      <div className="relative isolate overflow-hidden">
        <IndustryCTA
          industry="Financial Services"
          urgencyCallout="ASIC surveillance reviews don't announce themselves. Can you demonstrate your obligation coverage right now?"
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

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
            question:
              'How does FormaOS handle AUSTRAC AML/CTF programme requirements?',
            answer:
              'FormaOS maps the full AUSTRAC AML/CTF programme structure, Part A (customer identification) and Part B (customer due diligence), to operational workflows. The platform tracks ongoing CDD obligations, suspicious matter reporting, threshold transaction reporting, and assembles evidence for the annual compliance report to AUSTRAC.',
          },
          {
            question: 'Can FormaOS manage s912D breach reporting?',
            answer:
              'Yes. The breach register includes a dedicated s912D workflow covering reportable situation classification, days-since-detection counters, self-reporting deadline alerts, root cause analysis, and remediation tracking. Every step is recorded with an immutable audit trail for regulatory review.',
          },
          {
            question:
              'Does FormaOS support APRA CPS 230 operational risk requirements?',
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
              'Yes. FormaOS is hosted on Australian infrastructure by default. All data, including obligation registers, breach records, evidence files, and audit logs, remains within Australian data centres. This meets data sovereignty requirements for regulated financial services organisations.',
          },
          {
            question: 'How long does it take to get set up?',
            answer:
              'Most AFS licensees are live within a day. You can import existing obligation spreadsheets or start with our pre-built ASIC, APRA, AUSTRAC, and AFCA framework packs. Assign owners, upload existing evidence, and your compliance programme is operational, no multi-month implementation project required.',
          },
        ]}
      />
      <RelatedIndustries currentSlug="financial-services-compliance" />
    </MarketingPageShell>
  );
}

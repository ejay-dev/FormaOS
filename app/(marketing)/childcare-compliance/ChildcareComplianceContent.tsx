'use client';

import { RelatedIndustries } from '@/components/marketing/RelatedIndustries';
import {
  Bell,
  Shield,
  Users,
  FileCheck,
  Monitor,
  FileText,
} from 'lucide-react';
import {
  IndustryHero,
  BeforeAfterSection,
  FrameworkExplorer,
  VerticalTimeline,
  HeroStatsBar,
  CompareTable,
  SeeItInAction,
  DemoDashboardContent,
  DemoAuditExport,
  DemoNotificationTimeline,
  IndustryFeatures,
  SocialProof,
  IndustryCTA,
  IndustryFAQ,
  InteractiveDashboard,
} from '@/components/marketing/industry';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { VisualDivider } from '@/components/motion';

/* ── Interactive NQF Dashboard visual ────────────────── */

function NQFDashboardVisual() {
  return (
    <InteractiveDashboard
      title="NQF Quality Area Readiness"
      subtitle="ACECQA Compliance Dashboard"
      industry="Childcare"
      tabs={[
        { id: 'areas', label: 'Quality Areas', count: 7 },
        { id: 'educators', label: 'Educator Credentials', count: 12 },
        { id: 'qip', label: 'QIP Actions', count: 5 },
      ]}
      statusCounts={[
        { label: 'On Track', count: 6, color: 'green' },
        { label: 'Attention', count: 1, color: 'amber' },
      ]}
      columns={[
        { key: 'area', label: 'Quality Area' },
        { key: 'elements', label: 'Elements', hideOnMobile: true },
        { key: 'status', label: 'Status' },
        { key: 'score', label: 'Score', hideOnMobile: true },
      ]}
      rows={[
        {
          id: 'qa1',
          status: 'green',
          cells: {
            area: 'QA1 - Educational program',
            elements: '3 of 3',
            status: 'Meeting',
            score: '92%',
          },
          expandedContent: {
            label: 'QA1 Detail',
            items: [
              { key: 'Element 1.1', value: 'Program - Meeting NQS' },
              { key: 'Element 1.2', value: 'Practice - Meeting NQS' },
              { key: 'Element 1.3', value: 'Assessment - Meeting NQS' },
              { key: 'Evidence Count', value: '14 documents attached' },
            ],
          },
        },
        {
          id: 'qa2',
          status: 'green',
          cells: {
            area: "QA2 - Children's health & safety",
            elements: '3 of 3',
            status: 'Meeting',
            score: '88%',
          },
          expandedContent: {
            label: 'QA2 Detail',
            items: [
              { key: 'Element 2.1', value: 'Health - Meeting NQS' },
              { key: 'Element 2.2', value: 'Safety - Meeting NQS' },
              { key: 'Incident Reports', value: '0 open incidents' },
              { key: 'Evidence Count', value: '22 documents attached' },
            ],
          },
        },
        {
          id: 'qa3',
          status: 'green',
          cells: {
            area: 'QA3 - Physical environment',
            elements: '3 of 3',
            status: 'Meeting',
            score: '95%',
          },
          expandedContent: {
            label: 'QA3 Detail',
            items: [
              { key: 'Element 3.1', value: 'Design - Meeting NQS' },
              { key: 'Element 3.2', value: 'Use - Exceeding NQS' },
              { key: 'Last Inspection', value: '12 Feb 2026' },
              { key: 'Evidence Count', value: '8 documents attached' },
            ],
          },
        },
        {
          id: 'qa4',
          status: 'amber',
          cells: {
            area: 'QA4 - Staffing arrangements',
            elements: '2 of 3',
            status: 'Working Towards',
            score: '78%',
          },
          expandedContent: {
            label: 'QA4 Detail - NEEDS ATTENTION',
            items: [
              { key: 'Element 4.1', value: 'Organisation - Meeting NQS' },
              {
                key: 'Element 4.2',
                value: 'Professionalism - Working Towards',
              },
              { key: 'Gap', value: '2 educators with expired first aid' },
              {
                key: 'Action',
                value: 'Renewal bookings confirmed for next week',
              },
            ],
          },
        },
        {
          id: 'qa5',
          status: 'green',
          cells: {
            area: 'QA5 - Relationships with children',
            elements: '2 of 2',
            status: 'Exceeding',
            score: '100%',
          },
          expandedContent: {
            label: 'QA5 Detail',
            items: [
              { key: 'Element 5.1', value: 'Relationships - Exceeding NQS' },
              { key: 'Element 5.2', value: 'Transitions - Exceeding NQS' },
              { key: 'Self-Assessment', value: 'Completed Mar 2026' },
              { key: 'Evidence Count', value: '11 documents attached' },
            ],
          },
        },
        {
          id: 'qa6',
          status: 'green',
          cells: {
            area: 'QA6 - Collaborative partnerships',
            elements: '3 of 3',
            status: 'Meeting',
            score: '85%',
          },
          expandedContent: {
            label: 'QA6 Detail',
            items: [
              { key: 'Element 6.1', value: 'Families - Meeting NQS' },
              { key: 'Element 6.2', value: 'Community - Meeting NQS' },
              { key: 'Partnerships', value: '4 active community partnerships' },
              { key: 'Evidence Count', value: '9 documents attached' },
            ],
          },
        },
        {
          id: 'qa7',
          status: 'green',
          cells: {
            area: 'QA7 - Governance & leadership',
            elements: '3 of 3',
            status: 'Meeting',
            score: '90%',
          },
          expandedContent: {
            label: 'QA7 Detail',
            items: [
              { key: 'Element 7.1', value: 'Governance - Meeting NQS' },
              { key: 'Element 7.2', value: 'Leadership - Meeting NQS' },
              { key: 'QIP Status', value: 'Updated Mar 2026' },
              { key: 'Evidence Count', value: '16 documents attached' },
            ],
          },
        },
      ]}
      notifications={[
        {
          message: 'QA4: 2 educators with expired first aid certificates',
          time: '4 hours ago',
          type: 'alert',
        },
        {
          message: 'QIP updated - all improvement actions on track',
          time: '2 days ago',
          type: 'success',
        },
        {
          message: 'Assessment visit eligible window opens next month',
          time: '1 week ago',
          type: 'info',
        },
      ]}
      exportLabel="Export Evidence"
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

export default function ChildcareComplianceContent() {
  return (
    <MarketingPageShell>
      <IndustryHero
        accent="emerald-cyan"
        statsBar={
          <HeroStatsBar
            stats={[
              '7 NQF quality areas mapped',
              'Educator credential tracking',
              'QIP builder built in',
              'AU-hosted',
            ]}
          />
        }
        eyebrow="NQF + ACECQA Aligned"
        headline={
          <>
            NQF Assessment Ready.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Every Day.
            </span>
          </>
        }
        subheadline="NQF visits arrive with 48 hours notice. FormaOS keeps educator credentials, QIPs, and evidence organised - so you demonstrate quality, not scramble."
        primaryCta={{ label: 'Start Free Trial', href: '/auth/signup' }}
        secondaryCta={{ label: 'See Childcare Demo', href: '/contact' }}
        trustSignals={[
          'AU-hosted by default',
          '14-day free trial',
          'No credit card required',
          'ACECQA NQF aligned',
        ]}
        dashboardVisual={<NQFDashboardVisual />}
        jurisdictionBadges={[
          { label: 'NQF Quality Standards' },
          { label: 'ACECQA Assessment' },
          { label: 'ECEC Sector' },
        ]}
        socialProof="Trusted by childcare providers running multi-service operations"
      />

      <VisualDivider />

      <BeforeAfterSection
        headline="The Childcare Compliance Gap"
        subheadline="The difference between scrambling and being assessment-ready."
        without={[
          'NQF assessment arrives - staff scramble to gather evidence across shared drives, filing cabinets, and email threads',
          'Educator WWC cards and first aid certificates expire without anyone noticing until the assessor checks',
          'Quality Improvement Plan lives in a dusty Word document - last updated six months ago',
          'Child safety incidents documented inconsistently - state-specific mandatory reporting requirements missed',
        ]}
        withFormaOS={[
          'Every piece of evidence is already linked to its quality area element - generate a structured evidence pack with one click',
          'Automated 90/60/30-day alerts for every credential - RAG dashboard shows the entire team at a glance',
          'Living QIP with tracked improvement actions, linked evidence, named owners, and continuous progress updates',
          'State-adapted mandatory reporting workflows guide staff step-by-step - every incident tracked to resolution with full audit trail',
        ]}
      />

      <VisualDivider />

      <CompareTable
        headline="FormaOS vs. the old way"
        description="See how an integrated NQF compliance platform compares to the tools most services are still using."
        rows={[
          {
            feature: 'QA element-level evidence mapping',
            spreadsheets: 'no',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'Educator credential expiry alerts',
            spreadsheets: 'no',
            genericGrc: 'partial',
            formaos: 'yes',
          },
          {
            feature: 'Pre-built NQF 7 quality areas',
            spreadsheets: 'no',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'QIP builder with improvement tracking',
            spreadsheets: 'partial',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'State-specific mandatory reporting',
            spreadsheets: 'no',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'One-click assessment evidence pack',
            spreadsheets: 'no',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'WWC check tracking for volunteers',
            spreadsheets: 'partial',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'Self-assessment workflow per QA',
            spreadsheets: 'no',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'Rating predictor by quality area',
            spreadsheets: 'no',
            genericGrc: 'no',
            formaos: 'yes',
          },
          {
            feature: 'AU-hosted with data sovereignty',
            spreadsheets: 'partial',
            genericGrc: 'partial',
            formaos: 'yes',
          },
        ]}
      />

      <VisualDivider />

      <FrameworkExplorer
        headline="Every Childcare Framework. Pre-Built."
        description="FormaOS ships with every major childcare regulatory framework pre-loaded. Your obligations are mapped from day one - no manual setup required."
        frameworks={[
          {
            id: 'acecqa-nqf',
            name: 'ACECQA National Quality Framework',
            body: 'ACECQA',
            updated: '2025-12-01',
            obligationCount: '300+',
            categories: [
              { name: 'QA1: Educational program and practice', pct: 96 },
              { name: "QA2: Children's health and safety", pct: 94 },
              { name: 'QA3: Physical environment', pct: 98 },
              { name: 'QA4: Staffing arrangements', pct: 88 },
              { name: 'QA5: Relationships with children', pct: 100 },
              { name: 'QA6: Collaborative partnerships', pct: 92 },
              { name: 'QA7: Governance and leadership', pct: 95 },
            ],
            requirements: [
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
            id: 'nqs',
            name: 'National Quality Standard',
            body: 'ACECQA',
            updated: '2025-11-15',
            obligationCount: '200+',
            categories: [
              { name: '18 standards across 7 quality areas', pct: 95 },
              { name: 'Element-level requirements for each standard', pct: 93 },
              { name: 'Exceeding themes', pct: 90 },
              { name: 'Assessment and rating descriptors', pct: 97 },
            ],
            requirements: [
              '18 standards across 7 quality areas',
              'Element-level requirements for each standard',
              'Exceeding themes: practice is embedded, informed by critical reflection, shaped by meaningful engagement',
              'Assessment and rating descriptors',
            ],
          },
          {
            id: 'child-protection',
            name: 'Child Protection Legislation',
            body: 'State and Territory Governments',
            updated: '2026-01-10',
            obligationCount: '100+',
            categories: [
              { name: 'Mandatory reporting obligations', pct: 98 },
              { name: 'Reportable conduct schemes', pct: 94 },
              { name: 'Child-safe organisation standards', pct: 96 },
              { name: 'Record-keeping requirements', pct: 100 },
            ],
            requirements: [
              'Mandatory reporting obligations by state and territory',
              'Reportable conduct schemes',
              'Child-safe organisation standards',
              'Record-keeping requirements for incidents and disclosures',
            ],
          },
          {
            id: 'wwc',
            name: 'Working with Children Check Requirements',
            body: 'State and Territory Screening Agencies',
            updated: '2025-09-20',
            obligationCount: '40+',
            categories: [
              { name: 'WWC check requirements by jurisdiction', pct: 100 },
              { name: 'Volunteer and student screening', pct: 96 },
              { name: 'Ongoing validity and renewal tracking', pct: 98 },
              { name: 'Notification obligations', pct: 94 },
            ],
            requirements: [
              'WWC check requirements by jurisdiction',
              'Volunteer and student placement screening',
              'Ongoing validity and renewal tracking',
              'Notification obligations for adverse findings',
            ],
          },
          {
            id: 'eca-ethics',
            name: 'Early Childhood Australia Code of Ethics',
            body: 'Early Childhood Australia',
            updated: '2025-10-05',
            obligationCount: '30+',
            categories: [
              { name: 'Responsibilities to children', pct: 100 },
              { name: 'Responsibilities to families', pct: 97 },
              { name: 'Responsibilities to colleagues', pct: 95 },
              { name: 'Responsibilities to communities', pct: 93 },
            ],
            requirements: [
              'Ethical responsibilities to children',
              'Ethical responsibilities to families',
              'Ethical responsibilities to colleagues',
              'Ethical responsibilities to communities and society',
            ],
          },
        ]}
      />

      <VisualDivider />

      {/* ---- How It Works ---- */}
      <VerticalTimeline
        steps={[
          {
            number: '01',
            title: 'Set up your service and quality areas',
            description:
              'Select your service type (long day care, family day care, OSHC, preschool). FormaOS loads all 7 NQF quality areas with element-level requirements, self-assessment prompts, and evidence templates - ready to populate.',
            gradient:
              'from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 text-emerald-300',
            visual: (
              <FeatureVisual
                label="Quality Area Setup"
                rows={[
                  {
                    k: 'QA1: Educational program',
                    v: 'Loaded',
                    status: 'green',
                  },
                  { k: 'QA2: Health and safety', v: 'Loaded', status: 'green' },
                  {
                    k: 'QA3: Physical environment',
                    v: 'Loaded',
                    status: 'green',
                  },
                  { k: 'QA4–7: All remaining', v: 'Loaded', status: 'green' },
                ]}
              />
            ),
          },
          {
            number: '02',
            title: 'Add educators and link credentials',
            description:
              'Enter your educators and link their WWC checks, first aid certificates, qualifications, and anaphylaxis training. RAG alerts trigger automatically at 90, 60, and 30 days before expiry.',
            gradient:
              'from-cyan-500/20 to-emerald-500/20 border-cyan-500/30 text-cyan-300',
            visual: (
              <FeatureVisual
                label="Educator Credentials"
                rows={[
                  {
                    k: 'Emma Wilson - WWC',
                    v: 'Valid to Nov 2027',
                    status: 'green',
                  },
                  {
                    k: 'Priya Sharma - First Aid',
                    v: 'Expiring May 2026',
                    status: 'amber',
                  },
                  {
                    k: 'Liam Chen - Diploma ECEC',
                    v: 'Verified',
                    status: 'green',
                  },
                  {
                    k: 'Sarah Nguyen - Anaphylaxis',
                    v: 'Expired',
                    status: 'red',
                  },
                ]}
              />
            ),
          },
          {
            number: '03',
            title: 'Collect evidence and stay assessment-ready',
            description:
              'Attach evidence to each quality area element as part of daily operations. When an assessment visit is notified, generate a structured evidence pack per quality area - complete with gap analysis - in one click.',
            gradient:
              'from-violet-500/20 to-emerald-500/20 border-violet-500/30 text-violet-300',
            visual: (
              <FeatureVisual
                label="Assessment Evidence"
                rows={[
                  {
                    k: 'QA1: Educational program',
                    v: '98% complete',
                    status: 'green',
                  },
                  {
                    k: 'QA2: Health and safety',
                    v: '94% complete',
                    status: 'green',
                  },
                  { k: 'QA4: Staffing', v: '82% complete', status: 'amber' },
                  { k: 'Evidence pack', v: 'Ready to export', status: 'green' },
                ]}
              />
            ),
          },
        ]}
      />

      <VisualDivider />

      <IndustryFeatures
        headline="Purpose-Built for Childcare Services"
        subheadline="Every feature designed around real childcare compliance workflows - not generic task management."
        features={[
          {
            title: 'Educator Credentials Table',
            description:
              "See every educator's credential status at a glance. WWC cards, first aid certificates, qualifications, and anaphylaxis training - all tracked with RAG status and expiry countdown alerts.",
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
                  {
                    k: 'Emma Wilson - WWC Check',
                    v: 'Valid to Nov 2027',
                    status: 'green',
                  },
                  {
                    k: 'Priya Sharma - First Aid',
                    v: 'Expiring May 2026',
                    status: 'amber',
                  },
                  {
                    k: 'Liam Chen - Diploma ECEC',
                    v: 'Verified',
                    status: 'green',
                  },
                  {
                    k: 'Sarah Nguyen - Anaphylaxis',
                    v: 'Expired Mar 2026',
                    status: 'red',
                  },
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
                  {
                    k: 'QA1: Educational program',
                    v: '92% - Meeting',
                    status: 'green',
                  },
                  {
                    k: 'QA2: Health and safety',
                    v: '88% - Meeting',
                    status: 'green',
                  },
                  {
                    k: 'QA4: Staffing arrangements',
                    v: '78% - Review',
                    status: 'amber',
                  },
                  {
                    k: 'QA5: Relationships',
                    v: '100% - Exceeding',
                    status: 'green',
                  },
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
                label="QIP - Active Improvements"
                rows={[
                  {
                    k: 'QA1: Update curriculum documentation',
                    v: 'In Progress',
                    status: 'amber',
                  },
                  {
                    k: 'QA3: Outdoor learning space plan',
                    v: 'Completed',
                    status: 'green',
                  },
                  {
                    k: 'QA4: Staff-to-child ratio review',
                    v: 'In Progress',
                    status: 'amber',
                  },
                  {
                    k: 'QA6: Family engagement survey',
                    v: 'Completed',
                    status: 'green',
                  },
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
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Incident Pipeline
                </div>
                {[
                  'Incident Reported',
                  'Mandatory Report Filed',
                  'Investigation Complete',
                  'ACECQA Notified',
                  'Resolved',
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
            title: 'Assessment Visit Readiness',
            description:
              'One-click evidence pack export organised by quality area. When the assessor arrives, your evidence is ready - structured, complete, and linked to each NQS element.',
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
                  {
                    k: 'QA1: Educational program',
                    v: '98% complete',
                    status: 'green',
                  },
                  {
                    k: 'QA2: Health and safety',
                    v: '94% complete',
                    status: 'green',
                  },
                  {
                    k: 'QA4: Staffing arrangements',
                    v: '82% complete',
                    status: 'amber',
                  },
                  {
                    k: 'QA7: Governance and leadership',
                    v: '96% complete',
                    status: 'green',
                  },
                ]}
              />
            ),
          },
        ]}
      />

      <VisualDivider />

      {/* ---- See It In Action ---- */}
      <SeeItInAction
        tabs={[
          {
            id: 'dashboard',
            label: 'Quality Areas Dashboard',
            icon: <Monitor className="h-4 w-4" />,
            content: (
              <DemoDashboardContent
                title="NQF Quality Area Compliance"
                rows={[
                  {
                    label: 'QA1 - Educational program and practice',
                    value: '92%',
                    status: 'green',
                  },
                  {
                    label: "QA2 - Children's health and safety",
                    value: '88%',
                    status: 'green',
                  },
                  {
                    label: 'QA3 - Physical environment',
                    value: '95%',
                    status: 'green',
                  },
                  {
                    label: 'QA4 - Staffing arrangements',
                    value: '78%',
                    status: 'amber',
                  },
                  {
                    label: 'QA5 - Relationships with children',
                    value: '100%',
                    status: 'green',
                  },
                  {
                    label: 'QA6 - Collaborative partnerships',
                    value: '85%',
                    status: 'green',
                  },
                ]}
              />
            ),
          },
          {
            id: 'audit',
            label: 'Evidence Pack Export',
            icon: <FileText className="h-4 w-4" />,
            content: (
              <DemoAuditExport
                sections={[
                  {
                    name: 'QA1 - Educational program',
                    score: '98%',
                    items: 14,
                  },
                  { name: 'QA2 - Health and safety', score: '94%', items: 22 },
                  {
                    name: 'QA3 - Physical environment',
                    score: '96%',
                    items: 8,
                  },
                  {
                    name: 'QA4 - Staffing arrangements',
                    score: '82%',
                    items: 18,
                  },
                  {
                    name: 'Educator Credential Register',
                    score: '90%',
                    items: 48,
                  },
                ]}
              />
            ),
          },
          {
            id: 'alerts',
            label: 'Credential Alerts',
            icon: <Bell className="h-4 w-4" />,
            content: (
              <DemoNotificationTimeline
                steps={[
                  {
                    time: 'Today',
                    label: 'Sarah Nguyen - Anaphylaxis training expired',
                    status: 'complete',
                  },
                  {
                    time: '7 days',
                    label: 'Priya Sharma - First Aid expiring 15 May',
                    status: 'active',
                  },
                  {
                    time: '30 days',
                    label: 'QA4 review - staffing ratio documentation due',
                    status: 'pending',
                  },
                  {
                    time: '60 days',
                    label: 'QIP six-month progress review',
                    status: 'pending',
                  },
                  {
                    time: '90 days',
                    label: 'Liam Chen - WWC renewal window opens',
                    status: 'pending',
                  },
                  {
                    time: 'Ongoing',
                    label: 'Self-assessment cycle - next QA due for reflection',
                    status: 'pending',
                  },
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
          '206+ tables with row-level security',
          'AU-hosted by default - data never leaves Australia',
          'Zero evidence gaps at assessment - continuous capture',
          'SOC 2 compliance in progress',
        ]}
        trustCards={[
          {
            persona:
              'Multi-service childcare provider, 5 centres across metro and regional',
            need: 'Centralised NQF compliance tracking across all services with consistent evidence quality',
            delivers:
              'Pre-built NQF framework, educator credential alerts, one-click evidence packs per service for assessment visits',
          },
          {
            persona: 'Family day care scheme coordinator, 40+ educators',
            need: 'Educator credential management across a distributed workforce with no central office',
            delivers:
              'Automated WWC and first aid expiry alerts, self-assessment tools for educators, QIP tracking per educator',
          },
          {
            persona:
              'Community kindergarten committee, volunteer-run governance',
            need: 'Simple compliance tracking for a small service with limited admin capacity',
            delivers:
              'Pre-built quality area dashboards, volunteer WWC tracking, QIP builder with guided templates',
          },
        ]}
        regulatoryBodies={[
          { name: 'ACECQA', icon: <Shield className="h-4 w-4" /> },
          {
            name: 'State Regulatory Authorities',
            icon: <Users className="h-4 w-4" />,
          },
          { name: 'OAIC', icon: <FileCheck className="h-4 w-4" /> },
        ]}
      />

      <VisualDivider />

      <IndustryCTA
        industry="Childcare"
        urgencyCallout="NQF assessment visits can arrive with 48 hours notice. Are your quality area evidence packs current?"
      />

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
            question:
              'Can FormaOS help build and maintain our Quality Improvement Plan?',
            answer:
              'Yes. The QIP Builder provides a structured template aligned to NQF quality areas. You create improvement actions linked to specific quality areas, assign owners and due dates, attach evidence of progress, and track completion - keeping your QIP current and assessment-ready at all times.',
          },
          {
            question: 'How does FormaOS handle mandatory reporting by state?',
            answer:
              'FormaOS provides state-specific mandatory reporting workflows that guide staff through the correct reporting process for their jurisdiction. Each incident is tracked through its lifecycle - from initial report to authority notification to investigation to resolution - with ACECQA notification timelines built in.',
          },
          {
            question:
              'Can FormaOS help us prepare for assessment and rating visits?',
            answer:
              'FormaOS maintains continuous assessment readiness. Evidence is collected and organised by quality area as part of daily operations. When an assessment visit is notified, you can generate a structured evidence pack per quality area with one click - including gap analysis showing any missing evidence per element.',
          },
          {
            question:
              'Does FormaOS track Working with Children checks for volunteers?',
            answer:
              'Yes. FormaOS tracks WWC checks for all personnel including educators, volunteers, students on placement, and visiting professionals. Each jurisdiction has different screening requirements - FormaOS maps these automatically and alerts you to expiring or missing checks.',
          },
          {
            question: 'Is our data stored in Australia?',
            answer:
              "Yes. FormaOS is AU-hosted by default. All service data, educator records, child information, and compliance evidence remain on Australian infrastructure. Your data never leaves Australia, supporting your obligations under the Australian Privacy Principles for handling children's personal information.",
          },
          {
            question: 'How long does it take to get set up?',
            answer:
              'Most services are assessment-ready within a day. Select your service type and FormaOS loads all 7 quality areas with element-level requirements. Add your educators, link their credentials, and start attaching evidence. No multi-week implementation - your compliance programme is live on day one.',
          },
        ]}
      />
      <RelatedIndustries currentSlug="childcare-compliance" />
    </MarketingPageShell>
  );
}

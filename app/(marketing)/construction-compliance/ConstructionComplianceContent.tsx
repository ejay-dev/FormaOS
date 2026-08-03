'use client';

import { RelatedIndustries } from '@/components/marketing/RelatedIndustries';
import { SectionMedia } from '@/components/marketing/SectionMedia';
import {
  compliancePlanHref,
  demoHref,
  PUBLIC_CTA_LABELS,
} from '@/lib/marketing/cta';
import {
  Shield,
  HardHat,
  Building2,
  Monitor,
  FileText,
  Bell,
} from 'lucide-react';
import {
  IndustryHero,
  BeforeAfterSection,
  FrameworkExplorer,
  HeroStatsBar,
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

/* ── Interactive Dashboard visual ────────────────────── */

function ConstructionDashboardVisual() {
  return (
    <InteractiveDashboard
      title="Active Project Dashboard"
      subtitle="Multi-Site WHS Compliance"
      industry="Construction"
      tabs={[
        { id: 'sites', label: 'All Sites', count: 5 },
        { id: 'swms', label: 'SWMS Register', count: 51 },
        { id: 'incidents', label: 'Incidents', count: 3 },
      ]}
      statusCounts={[
        { label: 'Compliant', count: 3, color: 'green' },
        { label: 'Review', count: 1, color: 'amber' },
        { label: 'Action', count: 1, color: 'red' },
      ]}
      columns={[
        { key: 'site', label: 'Site' },
        { key: 'swms', label: 'SWMS', hideOnMobile: true },
        { key: 'status', label: 'Status' },
        { key: 'contractors', label: 'Contractors', hideOnMobile: true },
      ]}
      rows={[
        {
          id: 's1',
          status: 'green',
          cells: {
            site: 'CBD Tower, Lvl 14',
            swms: '12 active',
            status: 'Compliant',
            contractors: '34',
          },
          expandedContent: {
            label: 'Site Details',
            items: [
              { key: 'Project Manager', value: 'Tom Richards' },
              { key: 'WHS Score', value: '98%' },
              { key: 'Open Incidents', value: '0' },
              { key: 'Last Inspection', value: '02 Apr 2026' },
            ],
          },
        },
        {
          id: 's2',
          status: 'amber',
          cells: {
            site: 'Westfield Extension',
            swms: '8 active',
            status: 'Review',
            contractors: '22',
          },
          expandedContent: {
            label: 'Site details: review needed',
            items: [
              { key: 'Project Manager', value: 'Sarah Kim' },
              { key: 'WHS Score', value: '84%' },
              { key: 'Open Incidents', value: '1 under investigation' },
              { key: 'Issue', value: 'SWMS-019 expired, renewal pending' },
            ],
          },
        },
        {
          id: 's3',
          status: 'green',
          cells: {
            site: 'Harbour Bridge Maint.',
            swms: '6 active',
            status: 'Compliant',
            contractors: '15',
          },
          expandedContent: {
            label: 'Site Details',
            items: [
              { key: 'Project Manager', value: 'David Chen' },
              { key: 'WHS Score', value: '96%' },
              { key: 'Open Incidents', value: '0' },
              { key: 'Last Inspection', value: '28 Mar 2026' },
            ],
          },
        },
        {
          id: 's4',
          status: 'red',
          cells: {
            site: 'Olympic Park Stage 3',
            swms: '15 active',
            status: 'Action',
            contractors: '48',
          },
          expandedContent: {
            label: 'Site details: action required',
            items: [
              { key: 'Project Manager', value: "Mike O'Sullivan" },
              { key: 'WHS Score', value: '72%' },
              { key: 'Open Incidents', value: '2, 1 notifiable' },
              {
                key: 'Critical Issue',
                value: 'SafeWork notification due in 18hrs',
              },
            ],
          },
        },
        {
          id: 's5',
          status: 'green',
          cells: {
            site: 'Airport Terminal 2',
            swms: '10 active',
            status: 'Compliant',
            contractors: '29',
          },
          expandedContent: {
            label: 'Site Details',
            items: [
              { key: 'Project Manager', value: 'Alex Nguyen' },
              { key: 'WHS Score', value: '94%' },
              { key: 'Open Incidents', value: '0' },
              { key: 'Last Inspection', value: '05 Apr 2026' },
            ],
          },
        },
      ]}
      notifications={[
        {
          message: 'Olympic Park, SafeWork notification due in 18hrs',
          time: '1 hour ago',
          type: 'alert',
        },
        {
          message: 'Westfield, SWMS-019 expired, renewal pending',
          time: '6 hours ago',
          type: 'alert',
        },
        {
          message: 'CBD Tower, site inspection passed',
          time: '2 days ago',
          type: 'success',
        },
      ]}
      exportLabel="Export Report"
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

export default function ConstructionComplianceContent() {
  return (
    <MarketingPageShell>
      <div className="relative isolate overflow-hidden">
        <SectionMedia
          src="/marketing-media/construction-compliance.jpg"
          objectPosition="50% 35%"
          opacity={0.5}
          scrim="center"
        />
        <IndustryHero
          statsBar={
            <HeroStatsBar
              stats={[
                'Multi-site compliance',
                'SafeWork notification in 48hr',
                'Contractor verification automated',
                'AU-hosted',
              ]}
            />
          }
          headline={
            <>
              The notification chain
              <br />
              starts <span className="mk-accent">immediately</span>
            </>
          }
          subheadline="A notifiable incident starts a preservation duty, a notification and an investigation at once. FormaOS runs that chain across every site."
          primaryCta={{
            label: PUBLIC_CTA_LABELS.compliancePlan,
            href: compliancePlanHref('construction_compliance'),
          }}
          secondaryCta={{
            label: 'See Construction Demo',
            href: demoHref('construction_compliance'),
          }}
          trustSignals={[
            'AU-hosted by default',
            'Assessment-led onboarding',
            'Compliance plan scoped by framework',
            'SafeWork notification ready',
          ]}
          dashboardVisual={<ConstructionDashboardVisual />}
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <BeforeAfterSection
        headline="What happens in the hour after a notifiable incident"
        subheadline="Site preservation, regulator notification and investigation all start at once, usually while the site is still stopped."
        without={[
          "Notifiable WHS incident happens, the notification deadline is tracked in someone's head",
          'Site preservation obligations remembered late, the scene is disturbed before the regulator arrives',
          'Subcontractors are on site without valid inductions or licences, you carry the liability',
          'SafeWork inspector arrives unannounced, current SWMS are spread across spreadsheets, emails, and filing cabinets',
        ]}
        withFormaOS={[
          'Incident pipeline with a countdown timer and a structured SafeWork notification workflow, no missed deadlines',
          'Site preservation checklist triggered at classification, with timestamps against each step',
          'Contractor verification pipeline checks inductions, licences, and insurance before site access, with automatic expiry alerts',
          'Every SWMS is version-controlled, signed off, and exportable by site, hand the inspector a structured evidence pack',
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <FrameworkExplorer
        headline="The duties behind that chain, already mapped"
        description="Model WHS Act duties, the Codes of Practice you actually work to, state notification rules, and the high-risk work licences your crew holds."
        frameworks={[
          {
            id: 'model-whs',
            name: 'Model WHS Act Obligations',
            body: 'Safe Work Australia',
            updated: '2025-12-01',
            obligationCount: '250+',
            requirements: [
              'Primary duty of care (PCBU obligations)',
              'Worker consultation, representation, and participation',
              'Workplace entry by WHS entry permit holders',
              'Notifiable incident reporting and site preservation',
              'Health and safety representative powers',
              'Issue resolution procedures',
            ],
          },
          {
            id: 'codes-of-practice',
            name: 'SafeWork Australia Codes of Practice',
            body: 'Safe Work Australia',
            updated: '2025-11-15',
            obligationCount: '300+',
            requirements: [
              'Construction work, managing risks',
              'Demolition work',
              'Excavation work',
              'Managing the risk of falls at workplaces',
              'Welding processes',
              'Managing risks of hazardous chemicals',
            ],
          },
          {
            id: 'state-whs',
            name: 'State-Specific WHS Regulations',
            body: 'SafeWork NSW, WorkSafe VIC, WHS QLD, SafeWork SA',
            updated: '2026-01-10',
            obligationCount: '200+',
            requirements: [
              'SafeWork NSW construction notification requirements',
              'WorkSafe VIC high-risk construction work',
              'WHS QLD principal contractor obligations',
              'SafeWork SA asbestos management requirements',
              'State-specific licensing and registration',
            ],
          },
          {
            id: 'contractor-mgmt',
            name: 'Contractor Management Obligations',
            body: 'Model WHS Regulations',
            updated: '2025-09-20',
            obligationCount: '100+',
            requirements: [
              'Principal contractor duties',
              'WHS management plan requirements',
              'Subcontractor induction and verification',
              'Signage and site access control',
              'Safe Work Method Statement (SWMS) requirements',
            ],
          },
          {
            id: 'hrw-licences',
            name: 'High-Risk Work Licence Requirements',
            body: 'Safe Work Australia / State regulators',
            updated: '2025-10-05',
            obligationCount: '80+',
            requirements: [
              'Crane and hoist operation licences',
              'Scaffolding work licences',
              'Rigging work licences',
              'Forklift operation licences',
              'Dogging and pressure equipment licences',
            ],
          },
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <IndustryFeatures
        headline="SWMS, contractors, licences and incidents, per site"
        subheadline="The four registers a principal contractor is asked for, kept per project rather than reassembled after an incident."
        features={[
          {
            title: 'SWMS Register',
            description:
              'Every Safe Work Method Statement tracked per project and site. Version control ensures workers always reference the current SWMS. Sign-off tracking proves worker acknowledgement.',
            details: [
              'SWMS per project/site with version history',
              'Worker sign-off tracking with timestamps',
              'Expiry and review date alerting',
              'Bulk export for SafeWork inspection',
            ],
            visual: (
              <FeatureVisual
                label="SWMS Register, CBD Tower Lvl 14"
                rows={[
                  {
                    k: 'SWMS-042: Working at Heights',
                    v: 'v3, Current',
                    status: 'green',
                  },
                  {
                    k: 'SWMS-041: Concrete Pouring',
                    v: 'v2, Current',
                    status: 'green',
                  },
                  {
                    k: 'SWMS-039: Demolition Phase B',
                    v: 'v1, Review Due',
                    status: 'amber',
                  },
                  {
                    k: 'SWMS-038: Electrical Rough-in',
                    v: 'v2, Expired',
                    status: 'red',
                  },
                ]}
              />
            ),
          },
          {
            title: 'Contractor Induction Tracker',
            description:
              'Know who is qualified and who is not, before they step on site. Verify inductions, licences, and insurance for every subcontractor across every project.',
            details: [
              'Verified vs unverified contractors per site',
              'Licence and insurance expiry tracking',
              'Site-specific induction completion records',
              'Automatic alerts when credentials expire',
            ],
            visual: (
              <FeatureVisual
                label="Contractor Verification, Westfield Extension"
                rows={[
                  {
                    k: 'Murray Electrical Pty Ltd',
                    v: 'Fully Verified',
                    status: 'green',
                  },
                  {
                    k: 'Pacific Plumbing',
                    v: 'Insurance Expiring',
                    status: 'amber',
                  },
                  { k: 'Skyline Scaffolding', v: 'Verified', status: 'green' },
                  {
                    k: 'Delta Demolition',
                    v: 'Licence Expired',
                    status: 'red',
                  },
                ]}
              />
            ),
          },
          {
            title: 'Multi-Site Compliance Dashboard',
            description:
              'See compliance status across all active construction sites in a single view. Incident counts, SWMS currency, contractor verification rates, per project, at a glance.',
            details: [
              'Compliance score per active site',
              'Incident count and severity tracking',
              'SWMS currency percentage per project',
              'Contractor verification rate per site',
            ],
            visual: (
              <FeatureVisual
                label="Portfolio Compliance Overview"
                rows={[
                  { k: 'CBD Tower', v: '98% compliant', status: 'green' },
                  {
                    k: 'Westfield Extension',
                    v: '84% compliant',
                    status: 'amber',
                  },
                  {
                    k: 'Harbour Bridge Maint.',
                    v: '96% compliant',
                    status: 'green',
                  },
                  {
                    k: 'Olympic Park Stage 3',
                    v: '72% compliant',
                    status: 'red',
                  },
                ]}
              />
            ),
          },
          {
            title: 'WHS Incident Pipeline',
            description:
              'Structured incident management with SafeWork notification timers. Every notifiable incident tracked from report through investigation to corrective action and closure.',
            details: [
              'SafeWork 48-hour notification countdown',
              'Site preservation requirements tracking',
              'Investigation workflow with evidence attachment',
              'Corrective action register with due dates',
            ],
            visual: (
              <div className="p-5 space-y-3">
                <div className="text-xs font-medium text-slate-400">
                  Incident pipeline
                </div>
                {[
                  'Reported',
                  'SafeWork Notified',
                  'Under Investigation',
                  'Corrective Action',
                  'Closed',
                ].map((stage, i) => (
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
                ))}
              </div>
            ),
          },
          {
            title: 'High-Risk Work Licence Register',
            description:
              'Track every high-risk work licence across your workforce. Crane operators, scaffolders, riggers, forklift operators, every licence type, expiry date, and work classification recorded.',
            details: [
              'Licence type and class tracking',
              'Expiry date with countdown alerts',
              'Work classification mapping',
              'Bulk verification and export',
            ],
            visual: (
              <FeatureVisual
                label="High-Risk Work Licences"
                rows={[
                  {
                    k: 'Tom Harris, Crane (C6)',
                    v: 'Valid to Dec 2027',
                    status: 'green',
                  },
                  {
                    k: 'Sam Lee, Scaffolding (SB)',
                    v: 'Expiring Jun 2026',
                    status: 'amber',
                  },
                  {
                    k: 'Alex Dunn, Rigging (RB)',
                    v: 'Valid to Mar 2028',
                    status: 'green',
                  },
                  {
                    k: 'Chris Ward, Forklift (LF)',
                    v: 'Expired Jan 2026',
                    status: 'red',
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
            id: 'incidents',
            label: 'Incident Timeline',
            icon: <Bell className="h-4 w-4" />,
            content: (
              <DemoNotificationTimeline
                steps={[
                  {
                    time: 'T+0:00',
                    label:
                      'Notifiable incident, fall from height at Olympic Park',
                    status: 'complete',
                  },
                  {
                    time: 'T+0:15',
                    label: 'Site preservation activated, area cordoned',
                    status: 'complete',
                  },
                  {
                    time: 'T+1:00',
                    label:
                      'SafeWork notification prepared, 48hr countdown started',
                    status: 'complete',
                  },
                  {
                    time: 'T+18:00',
                    label: 'SafeWork notification lodged',
                    status: 'active',
                  },
                  {
                    time: 'T+48:00',
                    label:
                      'Investigation commenced, witness statements collected',
                    status: 'pending',
                  },
                  {
                    time: 'T+14d',
                    label: 'Corrective action plan drafted and assigned',
                    status: 'pending',
                  },
                ]}
              />
            ),
          },
          {
            id: 'dashboard',
            label: 'Site Compliance Dashboard',
            icon: <Monitor className="h-4 w-4" />,
            content: (
              <DemoDashboardContent
                title="Multi-Site WHS Compliance"
                rows={[
                  {
                    label: 'CBD Tower, Lvl 14',
                    value: '98%',
                    status: 'green',
                  },
                  {
                    label: 'Westfield Extension',
                    value: '84%',
                    status: 'amber',
                  },
                  {
                    label: 'Harbour Bridge Maint.',
                    value: '96%',
                    status: 'green',
                  },
                  {
                    label: 'Olympic Park Stage 3',
                    value: '72%',
                    status: 'red',
                  },
                  {
                    label: 'Airport Terminal 2',
                    value: '94%',
                    status: 'green',
                  },
                  {
                    label: 'SWMS Currency, All Sites',
                    value: '91%',
                    status: 'green',
                  },
                ]}
              />
            ),
          },
          {
            id: 'audit',
            label: 'SafeWork Audit Export',
            icon: <FileText className="h-4 w-4" />,
            content: (
              <DemoAuditExport
                sections={[
                  {
                    name: 'SWMS Register, All Sites',
                    score: '91%',
                    items: 51,
                  },
                  { name: 'Contractor Verification', score: '94%', items: 148 },
                  { name: 'Incident Register', score: '100%', items: 3 },
                  { name: 'High-Risk Work Licences', score: '96%', items: 62 },
                  { name: 'WHS Management Plans', score: '98%', items: 5 },
                ]}
              />
            ),
          },
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <SocialProof
        metricsBanner={[
          'Notifiable incident timers built in',
          'SWMS version history with worker sign-off',
          'AU-hosted by default, data never leaves Australia',
          'Immutable, timestamped evidence chain',
        ]}
        trustCards={[
          {
            persona: 'A builder running a dozen active sites',
            need: 'SWMS currency and contractor verification across all projects from a single dashboard',
            delivers:
              'Multi-site compliance dashboard, automated SWMS review alerts, contractor verification pipeline with expiry tracking',
          },
          {
            persona: 'A civil contractor on government infrastructure',
            need: 'SafeWork notification workflows with audit trail for government contract compliance',
            delivers:
              'Incident pipeline with 48-hour notification timer, immutable audit trail, exportable compliance evidence packs',
          },
          {
            persona: 'A specialist subcontractor doing high-risk work',
            need: 'High-risk work licence tracking across several licence classes and a large crew',
            delivers:
              'Centralised licence register, automatic expiry alerts at 90/60/30 days, bulk verification export',
          },
        ]}
        regulatoryBodies={[
          { name: 'Safe Work Australia', icon: <Shield className="h-4 w-4" /> },
          { name: 'SafeWork NSW', icon: <HardHat className="h-4 w-4" /> },
          { name: 'WorkSafe VIC', icon: <Building2 className="h-4 w-4" /> },
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <IndustryFAQ
        industry="Construction"
        faqs={[
          {
            question: 'Does FormaOS track SWMS per project and site?',
            answer:
              'Yes. FormaOS maintains a SWMS register per project and site with full version control. Every SWMS has a version history, worker sign-off tracking, and review date alerting so your Safe Work Method Statements are always current.',
          },
          {
            question: 'Can FormaOS handle multi-site compliance?',
            answer:
              'FormaOS provides a multi-site compliance dashboard showing compliance status, incident counts, SWMS currency, and contractor verification rates across all your active construction sites. Principal contractors can see portfolio-wide compliance at a glance.',
          },
          {
            question:
              'How does FormaOS handle SafeWork incident notifications?',
            answer:
              'FormaOS tracks notifiable incidents with a 48-hour notification countdown timer. The incident pipeline moves from Reported → SafeWork Notified → Under Investigation → Corrective Action → Closed, with evidence attachment and audit trail at every stage.',
          },
          {
            question: 'Does FormaOS track contractor inductions and licences?',
            answer:
              'Yes. FormaOS verifies contractor inductions, licences, and insurance per site. You can see verified vs unverified contractors at any project, with automatic alerts when credentials are approaching expiry.',
          },
          {
            question: 'Can I track high-risk work licences for my crew?',
            answer:
              'FormaOS maintains a high-risk work licence register covering crane operation, scaffolding, rigging, forklift, dogging, and pressure equipment licences. Each licence record includes type, class, expiry date, and work classification with countdown alerts.',
          },
          {
            question: 'Does FormaOS cover state-specific WHS regulations?',
            answer:
              "Yes. FormaOS includes state-specific WHS regulations for SafeWork NSW, WorkSafe VIC, Workplace Health and Safety QLD, SafeWork SA, and other state regulators. Each state's specific notification, licensing, and registration requirements are mapped.",
          },
          {
            question: 'Is my data stored in Australia?',
            answer:
              'Yes. FormaOS is AU-hosted by default. All project data, incident records, contractor information, and compliance evidence remain on Australian infrastructure. Your data never leaves Australia.',
          },
          {
            question: 'How long does it take to get set up?',
            answer:
              'Most builders are inspection-ready within a day. Add your active sites, upload existing SWMS, and enter your contractors. FormaOS creates versioned SWMS registers, contractor verification pipelines, and multi-site dashboards immediately, no multi-week implementation required.',
          },
        ]}
      />
      <div className="relative isolate overflow-hidden">
        <IndustryCTA
          industry="Construction"
          urgencyCallout="SafeWork inspections don't announce themselves. Is your SWMS register current right now?"
        />
      </div>

      <RelatedIndustries currentSlug="construction-compliance" />
    </MarketingPageShell>
  );
}

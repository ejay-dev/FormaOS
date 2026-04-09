'use client';

import {
  AlertTriangle,
  Clock,
  FileWarning,
  ShieldAlert,
  Users,
  MapPin,
  Shield,
  HardHat,
  Wrench,
  ClipboardCheck,
  Building2,
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
  InteractiveDashboard,
} from '@/components/marketing/industry';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { VisualDivider } from '@/components/motion';

/* ── Interactive Dashboard visual ────────────────────── */

function ConstructionDashboardVisual() {
  return (
    <InteractiveDashboard
      title="Active Project Dashboard"
      subtitle="Multi-Site WHS Compliance"
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
            site: 'CBD Tower — Lvl 14',
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
            label: 'Site Details — REVIEW NEEDED',
            items: [
              { key: 'Project Manager', value: 'Sarah Kim' },
              { key: 'WHS Score', value: '84%' },
              { key: 'Open Incidents', value: '1 under investigation' },
              { key: 'Issue', value: 'SWMS-019 expired — renewal pending' },
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
            label: 'Site Details — ACTION REQUIRED',
            items: [
              { key: 'Project Manager', value: "Mike O'Sullivan" },
              { key: 'WHS Score', value: '72%' },
              { key: 'Open Incidents', value: '2 — 1 notifiable' },
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
          message: 'Olympic Park — SafeWork notification due in 18hrs',
          time: '1 hour ago',
          type: 'alert',
        },
        {
          message: 'Westfield — SWMS-019 expired, renewal pending',
          time: '6 hours ago',
          type: 'alert',
        },
        {
          message: 'CBD Tower — site inspection passed',
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

export default function ConstructionComplianceContent() {
  return (
    <MarketingPageShell>
      <IndustryHero
        eyebrow="SafeWork + WHS Act Compliance"
        headline={
          <>
            SafeWork Inspection?
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              You&apos;re Already Prepared.
            </span>
          </>
        }
        subheadline="SafeWork inspectors arrive unannounced. FormaOS keeps SWMS current, inductions verified, and incidents tracked across every site."
        primaryCta={{ label: 'Start Free Trial', href: '/auth/signup' }}
        secondaryCta={{ label: 'See Construction Demo', href: '/contact' }}
        trustSignals={[
          'AU-hosted by default',
          '14-day free trial',
          'No credit card required',
          'SafeWork notification ready',
        ]}
        dashboardVisual={<ConstructionDashboardVisual />}
      />

      <VisualDivider />

      <PainPointsGrid
        headline="The WHS Compliance Reality"
        subheadline="Construction compliance is high-stakes, multi-site, and relentless. These are the gaps that lead to enforcement action."
        painPoints={[
          {
            icon: <AlertTriangle className="h-5 w-5" />,
            title: 'SafeWork unannounced site inspection — SWMS not current',
            description:
              'SafeWork NSW, SafeWork SA, and WorkSafe VIC conduct unannounced inspections. Outdated Safe Work Method Statements mean immediate prohibition notices.',
          },
          {
            icon: <Users className="h-5 w-5" />,
            title:
              'Contractor inductions not verified — unqualified workers on site',
            description:
              'Subcontractors arrive without valid inductions. Without a centralised register, principal contractors carry liability for unverified workers.',
          },
          {
            icon: <Clock className="h-5 w-5" />,
            title: 'WHS incident not notified to SafeWork within 48 hours',
            description:
              'Notifiable incidents must be reported to the WHS regulator immediately. Serious injuries and dangerous incidents have strict 48-hour preservation and notification windows.',
          },
          {
            icon: <MapPin className="h-5 w-5" />,
            title: 'Multi-site compliance impossible to track across projects',
            description:
              'Principal contractors managing 5, 10, or 20 active sites cannot maintain compliance visibility with spreadsheets. Gaps emerge between projects unseen.',
          },
          {
            icon: <FileWarning className="h-5 w-5" />,
            title: 'Subcontractor licence verification done manually',
            description:
              'High-risk work licences, contractor licences, and insurance certificates expire without notice. Manual verification via spreadsheet is unreliable at scale.',
          },
          {
            icon: <ShieldAlert className="h-5 w-5" />,
            title: 'WHS management system not documented to Code of Practice',
            description:
              'SafeWork Australia Codes of Practice require documented WHS management systems. Without structured evidence, duty holders cannot demonstrate compliance.',
          },
        ]}
      />

      <VisualDivider />

      <FrameworkCoverage
        headline="Every Construction WHS Framework. Pre-Built."
        description="FormaOS ships with Australian WHS frameworks pre-loaded. State-specific regulations, Codes of Practice, and high-risk work requirements — mapped and ready."
        frameworks={[
          {
            name: 'Model WHS Act Obligations',
            body: 'Safe Work Australia',
            obligationCount: '250+',
            areas: [
              'Primary duty of care (PCBU obligations)',
              'Worker consultation, representation, and participation',
              'Workplace entry by WHS entry permit holders',
              'Notifiable incident reporting and site preservation',
              'Health and safety representative powers',
              'Issue resolution procedures',
            ],
          },
          {
            name: 'SafeWork Australia Codes of Practice',
            body: 'Safe Work Australia',
            obligationCount: '300+',
            areas: [
              'Construction work — managing risks',
              'Demolition work',
              'Excavation work',
              'Managing the risk of falls at workplaces',
              'Welding processes',
              'Managing risks of hazardous chemicals',
            ],
          },
          {
            name: 'State-Specific WHS Regulations',
            body: 'SafeWork NSW, WorkSafe VIC, Workplace Health and Safety QLD, SafeWork SA',
            obligationCount: '200+',
            areas: [
              'SafeWork NSW construction notification requirements',
              'WorkSafe VIC high-risk construction work',
              'WHS QLD principal contractor obligations',
              'SafeWork SA asbestos management requirements',
              'State-specific licensing and registration',
            ],
          },
          {
            name: 'Contractor Management Obligations',
            body: 'Model WHS Regulations',
            obligationCount: '100+',
            areas: [
              'Principal contractor duties',
              'WHS management plan requirements',
              'Subcontractor induction and verification',
              'Signage and site access control',
              'Safe Work Method Statement (SWMS) requirements',
            ],
          },
          {
            name: 'High-Risk Work Licence Requirements',
            body: 'Safe Work Australia / State regulators',
            obligationCount: '80+',
            areas: [
              'Crane and hoist operation licences',
              'Scaffolding work licences',
              'Rigging work licences',
              'Forklift operation licences',
              'Dogging and pressure equipment licences',
            ],
          },
        ]}
      />

      <VisualDivider />

      <HowItWorks />

      <VisualDivider />

      <IndustryFeatures
        headline="Purpose-Built for Construction"
        subheadline="Every feature designed around real construction WHS workflows — not retrofitted office compliance tools."
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
                label="SWMS Register — CBD Tower Lvl 14"
                rows={[
                  {
                    k: 'SWMS-042: Working at Heights',
                    v: 'v3 — Current',
                    status: 'green',
                  },
                  {
                    k: 'SWMS-041: Concrete Pouring',
                    v: 'v2 — Current',
                    status: 'green',
                  },
                  {
                    k: 'SWMS-039: Demolition Phase B',
                    v: 'v1 — Review Due',
                    status: 'amber',
                  },
                  {
                    k: 'SWMS-038: Electrical Rough-in',
                    v: 'v2 — Expired',
                    status: 'red',
                  },
                ]}
              />
            ),
          },
          {
            title: 'Contractor Induction Tracker',
            description:
              'Know who is qualified and who is not — before they step on site. Verify inductions, licences, and insurance for every subcontractor across every project.',
            details: [
              'Verified vs unverified contractors per site',
              'Licence and insurance expiry tracking',
              'Site-specific induction completion records',
              'Automatic alerts when credentials expire',
            ],
            visual: (
              <FeatureVisual
                label="Contractor Verification — Westfield Extension"
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
              'See compliance status across all active construction sites in a single view. Incident counts, SWMS currency, contractor verification rates — per project, at a glance.',
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
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Incident Pipeline
                </div>
                {[
                  'Reported',
                  'SafeWork Notified',
                  'Under Investigation',
                  'Corrective Action',
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
            title: 'High-Risk Work Licence Register',
            description:
              'Track every high-risk work licence across your workforce. Crane operators, scaffolders, riggers, forklift operators — every licence type, expiry date, and work classification recorded.',
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
                    k: 'Tom Harris — Crane (C6)',
                    v: 'Valid to Dec 2027',
                    status: 'green',
                  },
                  {
                    k: 'Sam Lee — Scaffolding (SB)',
                    v: 'Expiring Jun 2026',
                    status: 'amber',
                  },
                  {
                    k: 'Alex Dunn — Rigging (RB)',
                    v: 'Valid to Mar 2028',
                    status: 'green',
                  },
                  {
                    k: 'Chris Ward — Forklift (LF)',
                    v: 'Expired Jan 2026',
                    status: 'red',
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
          '95+ routes',
          '206+ tables with RLS',
          'AU-hosted by default',
          'SOC 2 in progress',
        ]}
        trustCards={[
          {
            persona: 'Tier 1 Builder, 12 active sites',
            need: 'SWMS currency and contractor verification across all projects from a single dashboard',
            delivers:
              'Multi-site compliance dashboard, automated SWMS review alerts, contractor verification pipeline with expiry tracking',
          },
          {
            persona: 'Civil Contractor, government infrastructure',
            need: 'SafeWork notification workflows with audit trail for government contract compliance',
            delivers:
              'Incident pipeline with 48-hour notification timer, immutable audit trail, exportable compliance evidence packs',
          },
          {
            persona: 'Specialist Subcontractor, high-risk work',
            need: 'High-risk work licence tracking for 60+ crew across 5 licence classes',
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

      <VisualDivider />

      <IndustryCTA industry="Construction" />

      <VisualDivider />

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
        ]}
      />
    </MarketingPageShell>
  );
}

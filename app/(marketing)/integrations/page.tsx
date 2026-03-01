import type { Metadata } from 'next';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';

export const dynamic = 'force-static';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'Integrations — FormaOS',
  description:
    'FormaOS integrates with your existing tools — Jira, Slack, Microsoft Teams, GitHub, Zapier, AWS, Azure, and more — to embed compliance into the workflows your team already uses.',
  alternates: { canonical: `${siteUrl}/integrations` },
  openGraph: {
    title: 'Integrations | FormaOS',
    description: 'Connect FormaOS with Jira, Slack, Microsoft Teams, GitHub, Zapier, AWS, Azure, and more.',
    type: 'website',
    url: `${siteUrl}/integrations`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Integrations | FormaOS',
    description: 'Connect FormaOS with Jira, Slack, Microsoft Teams, GitHub, Zapier, AWS, Azure, and more.',
  },
};

type IntegrationStatus = 'live' | 'beta' | 'coming-soon';

interface Integration {
  name: string;
  category: string;
  description: string;
  complianceUseCase: string;
  status: IntegrationStatus;
  initials: string;
  color: string;
}

const INTEGRATIONS: Integration[] = [
  // Project & Task Management
  {
    name: 'Jira',
    category: 'Task Management',
    description: 'Sync compliance tasks bidirectionally with Jira issues. Control owners work in their existing workflow — task status, evidence links, and deadlines stay in sync.',
    complianceUseCase: 'SOC 2 CC8 change management evidence',
    status: 'live',
    initials: 'Ji',
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    name: 'Linear',
    category: 'Task Management',
    description: 'Push compliance action items to Linear with full context. Status updates sync back automatically with timestamps for audit trail.',
    complianceUseCase: 'ISO 27001 A.12.1.2 change management',
    status: 'live',
    initials: 'Li',
    color: 'bg-violet-500/20 text-violet-400',
  },
  {
    name: 'Asana',
    category: 'Task Management',
    description: 'Create compliance tasks in Asana projects with linked evidence requirements, deadlines, and owner assignment.',
    complianceUseCase: 'Control ownership and task accountability',
    status: 'beta',
    initials: 'As',
    color: 'bg-rose-500/20 text-rose-400',
  },
  // Communication
  {
    name: 'Slack',
    category: 'Communication',
    description: 'Receive compliance alerts, deadline reminders, evidence review requests, and audit event notifications in Slack channels.',
    complianceUseCase: 'Real-time escalation and deadline alerts',
    status: 'live',
    initials: 'Sl',
    color: 'bg-green-500/20 text-green-400',
  },
  {
    name: 'Microsoft Teams',
    category: 'Communication',
    description: 'Post compliance status updates, control review reminders, and audit notifications directly in Teams channels.',
    complianceUseCase: 'Cross-team compliance communication',
    status: 'live',
    initials: 'MT',
    color: 'bg-indigo-500/20 text-indigo-400',
  },
  // Identity & SSO
  {
    name: 'Okta',
    category: 'Identity & SSO',
    description: 'SAML 2.0 SSO with Okta. Provision and deprovision users automatically via SCIM. MFA policy enforcement supported.',
    complianceUseCase: 'ISO 27001 A.9 access control evidence',
    status: 'live',
    initials: 'Ok',
    color: 'bg-cyan-500/20 text-cyan-400',
  },
  {
    name: 'Microsoft Entra ID',
    category: 'Identity & SSO',
    description: 'Azure Active Directory integration for enterprise SSO, user provisioning via SCIM, and conditional access evidence.',
    complianceUseCase: 'SOC 2 CC6 logical access controls',
    status: 'live',
    initials: 'ME',
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    name: 'Google Workspace',
    category: 'Identity & SSO',
    description: 'Google SSO and directory sync for Google Workspace organisations. OAuth on all plans, SAML 2.0 on Enterprise.',
    complianceUseCase: 'Identity governance and access management',
    status: 'live',
    initials: 'GW',
    color: 'bg-emerald-500/20 text-emerald-400',
  },
  // Development & Code
  {
    name: 'GitHub',
    category: 'Development',
    description: 'Pull evidence from GitHub repositories — commit logs, PR approval records, branch protection rules, and code review history.',
    complianceUseCase: 'SOC 2 CC8.1 change management evidence',
    status: 'beta',
    initials: 'GH',
    color: 'bg-slate-500/20 text-slate-300',
  },
  // Cloud & Infrastructure
  {
    name: 'AWS',
    category: 'Cloud & Infrastructure',
    description: 'Pull CloudTrail logs, IAM configuration snapshots, and S3 access controls as compliance evidence artifacts.',
    complianceUseCase: 'ISO 27001 A.9 + SOC 2 CC6 access control',
    status: 'beta',
    initials: 'AW',
    color: 'bg-orange-500/20 text-orange-400',
  },
  {
    name: 'Microsoft Azure',
    category: 'Cloud & Infrastructure',
    description: 'Collect Azure AD activity logs, resource compliance state, and Security Center findings as evidence.',
    complianceUseCase: 'APRA CPS 234 information security evidence',
    status: 'beta',
    initials: 'Az',
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    name: 'Google Cloud Platform',
    category: 'Cloud & Infrastructure',
    description: 'Import Cloud Audit Logs, IAM policy snapshots, and organization policy evidence for framework mapping.',
    complianceUseCase: 'Essential Eight access control evidence',
    status: 'coming-soon',
    initials: 'GC',
    color: 'bg-red-500/20 text-red-400',
  },
  // Automation
  {
    name: 'Zapier',
    category: 'Automation',
    description: 'Connect FormaOS to 5,000+ apps via Zapier. Trigger actions, create compliance tasks, and sync evidence automatically.',
    complianceUseCase: 'Cross-platform workflow automation',
    status: 'live',
    initials: 'Za',
    color: 'bg-orange-500/20 text-orange-400',
  },
  {
    name: 'Make (Integromat)',
    category: 'Automation',
    description: 'Build complex compliance automation workflows connecting FormaOS to your operational toolchain with conditional logic.',
    complianceUseCase: 'Multi-step evidence collection workflows',
    status: 'beta',
    initials: 'Mk',
    color: 'bg-purple-500/20 text-purple-400',
  },
  // Storage & Evidence
  {
    name: 'Google Drive',
    category: 'Storage & Evidence',
    description: 'Link Google Drive files directly as evidence artifacts. Version history and access timestamps preserved for audit trail.',
    complianceUseCase: 'Evidence chain-of-custody documentation',
    status: 'live',
    initials: 'GD',
    color: 'bg-yellow-500/20 text-yellow-400',
  },
  {
    name: 'SharePoint',
    category: 'Storage & Evidence',
    description: 'Pull policy documents and evidence files from SharePoint libraries with version tracking and access control metadata.',
    complianceUseCase: 'Policy version management evidence',
    status: 'coming-soon',
    initials: 'SP',
    color: 'bg-teal-500/20 text-teal-400',
  },
  // ITSM & Operations
  {
    name: 'ServiceNow',
    category: 'ITSM & Operations',
    description: 'Sync incident records, change requests, and CMDB snapshots for ISO 27001 and SOC 2 change management controls.',
    complianceUseCase: 'ISO 27001 A.12 operations security evidence',
    status: 'coming-soon',
    initials: 'SN',
    color: 'bg-green-500/20 text-green-400',
  },
  {
    name: 'PagerDuty',
    category: 'ITSM & Operations',
    description: 'Pull incident response timelines, escalation records, and on-call evidence for availability and incident controls.',
    complianceUseCase: 'SOC 2 A1 availability evidence',
    status: 'coming-soon',
    initials: 'PD',
    color: 'bg-emerald-500/20 text-emerald-400',
  },
  // Vulnerability & Security
  {
    name: 'Qualys',
    category: 'Vulnerability & Security',
    description: 'Import vulnerability scan results, remediation timelines, and patch compliance evidence for security frameworks.',
    complianceUseCase: 'Essential Eight patching controls',
    status: 'coming-soon',
    initials: 'Ql',
    color: 'bg-red-500/20 text-red-400',
  },
  {
    name: 'CrowdStrike',
    category: 'Vulnerability & Security',
    description: 'Collect endpoint protection status, threat detection logs, and response evidence for security control mapping.',
    complianceUseCase: 'Essential Eight application control',
    status: 'coming-soon',
    initials: 'CS',
    color: 'bg-rose-500/20 text-rose-400',
  },
  // HR & Workforce
  {
    name: 'Employment Hero',
    category: 'HR & Workforce',
    description: 'Sync employee records, compliance training completion, and worker credentials for NDIS Worker Screening and AHPRA tracking.',
    complianceUseCase: 'NDIS Worker Screening Check evidence',
    status: 'coming-soon',
    initials: 'EH',
    color: 'bg-rose-500/20 text-rose-400',
  },
  {
    name: 'Deputy',
    category: 'HR & Workforce',
    description: 'Shift scheduling and workforce compliance data for NDIS and aged care — credential-to-shift validation evidence.',
    complianceUseCase: 'Credential-to-role mapping evidence',
    status: 'coming-soon',
    initials: 'Dp',
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    name: 'BambooHR',
    category: 'HR & Workforce',
    description: 'Employee onboarding, training completion, and credential expiry data for workforce compliance governance.',
    complianceUseCase: 'SOC 2 CC1.4 competency evidence',
    status: 'coming-soon',
    initials: 'BH',
    color: 'bg-green-500/20 text-green-400',
  },
  {
    name: 'MYOB',
    category: 'HR & Workforce',
    description: 'Payroll and workforce data integration for regulated workforce compliance evidence and WHS induction tracking.',
    complianceUseCase: 'WHS workforce compliance evidence',
    status: 'coming-soon',
    initials: 'MY',
    color: 'bg-amber-500/20 text-amber-400',
  },
];

const CATEGORIES = Array.from(new Set(INTEGRATIONS.map((i) => i.category)));

const STATUS_LABELS: Record<IntegrationStatus, { label: string; className: string }> = {
  live: { label: 'Live', className: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  beta: { label: 'Beta', className: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  'coming-soon': { label: 'Coming soon', className: 'bg-slate-400/10 text-slate-400 border-slate-400/20' },
};

export default function IntegrationsPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="Integrations"
        description="Embed compliance into the tools your team already uses. FormaOS integrates with Jira, Slack, Microsoft Teams, Okta, Azure AD, AWS, GitHub, and 5,000+ apps via Zapier — so compliance evidence is captured where work happens, not reconstructed after the fact."
        topColor="cyan"
        bottomColor="blue"
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Integration architecture overview */}
        <div className="mb-16 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8">
          <h2 className="text-lg font-bold text-white mb-4">How Integrations Work</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-3xl">
            FormaOS integrations capture compliance evidence from your existing tools and feed it into the evidence vault with full chain-of-custody metadata. Every integration record includes the source system, timestamp, actor identity, and the control or framework requirement it satisfies.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-2">Evidence Pull</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Read-only data collection from connected systems. FormaOS pulls evidence artifacts (logs, approvals, configurations) and stores them as immutable compliance records with source metadata.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-2">Webhook Push</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time event notifications from external tools. When a Jira ticket closes, a PR merges, or a training completes, FormaOS receives the event and records it against the relevant control.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-2">REST API</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                FormaOS exposes a REST API for custom integrations. Query audit logs, compliance status, evidence records, and tasks programmatically. Webhook endpoints provide real-time event subscriptions.
              </p>
            </div>
          </div>
        </div>

        {/* Integration count summary */}
        <div className="mb-12 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {INTEGRATIONS.filter((i) => i.status === 'live').length} Live
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            {INTEGRATIONS.filter((i) => i.status === 'beta').length} Beta
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            {INTEGRATIONS.filter((i) => i.status === 'coming-soon').length} Coming Soon
          </span>
          <span className="text-slate-600">|</span>
          <span>{INTEGRATIONS.length} total integrations across {CATEGORIES.length} categories</span>
        </div>

        {/* Category groups */}
        {CATEGORIES.map((category) => {
          const items = INTEGRATIONS.filter((i) => i.category === category);
          return (
            <section key={category} className="mb-14">
              <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {category}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((integration) => {
                  const statusProps = STATUS_LABELS[integration.status];
                  return (
                    <div
                      key={integration.name}
                      className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.04]"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${integration.color}`}>
                          {integration.initials}
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusProps.className}`}
                        >
                          {statusProps.label}
                        </span>
                      </div>
                      <h3 className="mb-1.5 text-sm font-bold text-white">{integration.name}</h3>
                      <p className="text-xs leading-relaxed text-slate-400 mb-3">{integration.description}</p>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-teal-400/60">
                        {integration.complianceUseCase}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Request an integration CTA */}
        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-10 text-center">
          <h3 className="text-lg font-bold text-white">Don&apos;t see your tool?</h3>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            We prioritise integrations based on customer requests. Tell us which tool matters to your compliance workflow and which framework control it serves.
          </p>
          <a
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-400 ring-1 ring-cyan-500/20 transition hover:bg-cyan-500/20"
          >
            Request an integration →
          </a>
        </div>
      </div>
    </MarketingPageShell>
  );
}

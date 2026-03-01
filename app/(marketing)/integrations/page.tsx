import type { Metadata } from 'next';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';

export const dynamic = 'force-static';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'Integrations — FormaOS',
  description:
    'FormaOS integrates with your existing tools — Jira, Slack, Microsoft Teams, GitHub, Zapier, and more — to embed compliance into the workflows your team already uses.',
  alternates: { canonical: `${siteUrl}/integrations` },
  openGraph: {
    title: 'Integrations | FormaOS',
    description: 'Connect FormaOS with Jira, Slack, Microsoft Teams, GitHub, Zapier, and more.',
    type: 'website',
    url: `${siteUrl}/integrations`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Integrations | FormaOS',
    description: 'Connect FormaOS with Jira, Slack, Microsoft Teams, GitHub, Zapier, and more.',
  },
};

type IntegrationStatus = 'live' | 'beta' | 'coming-soon';

interface Integration {
  name: string;
  category: string;
  description: string;
  status: IntegrationStatus;
  initials: string;
  color: string;
}

const INTEGRATIONS: Integration[] = [
  // Project & Task Management
  {
    name: 'Jira',
    category: 'Task Management',
    description: 'Sync compliance tasks bidirectionally with Jira issues. Control owners work in their existing workflow.',
    status: 'live',
    initials: 'Ji',
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    name: 'Linear',
    category: 'Task Management',
    description: 'Push compliance action items to Linear with full context. Status updates sync back automatically.',
    status: 'live',
    initials: 'Li',
    color: 'bg-violet-500/20 text-violet-400',
  },
  {
    name: 'Asana',
    category: 'Task Management',
    description: 'Create compliance tasks in Asana projects with linked evidence requirements and deadlines.',
    status: 'beta',
    initials: 'As',
    color: 'bg-rose-500/20 text-rose-400',
  },
  // Communication
  {
    name: 'Slack',
    category: 'Communication',
    description: 'Receive compliance alerts, deadline reminders, and audit event notifications in Slack channels.',
    status: 'live',
    initials: 'Sl',
    color: 'bg-green-500/20 text-green-400',
  },
  {
    name: 'Microsoft Teams',
    category: 'Communication',
    description: 'Post compliance status updates and receive audit notifications directly in Teams channels.',
    status: 'live',
    initials: 'MT',
    color: 'bg-indigo-500/20 text-indigo-400',
  },
  // Identity & SSO
  {
    name: 'Okta',
    category: 'Identity & SSO',
    description: 'SAML 2.0 SSO with Okta. Provision and deprovision users automatically via SCIM.',
    status: 'live',
    initials: 'Ok',
    color: 'bg-cyan-500/20 text-cyan-400',
  },
  {
    name: 'Microsoft Entra ID',
    category: 'Identity & SSO',
    description: 'Azure Active Directory integration for enterprise SSO and user provisioning.',
    status: 'live',
    initials: 'ME',
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    name: 'Google Workspace',
    category: 'Identity & SSO',
    description: 'Google SSO and directory sync for Google Workspace organisations.',
    status: 'live',
    initials: 'GW',
    color: 'bg-emerald-500/20 text-emerald-400',
  },
  // Development & Code
  {
    name: 'GitHub',
    category: 'Development',
    description: 'Pull evidence from GitHub repositories — commit logs, PR approvals, and branch protection rules.',
    status: 'beta',
    initials: 'GH',
    color: 'bg-slate-500/20 text-slate-300',
  },
  // Automation
  {
    name: 'Zapier',
    category: 'Automation',
    description: 'Connect FormaOS to 5,000+ apps via Zapier. Trigger actions, create tasks, and sync evidence.',
    status: 'live',
    initials: 'Za',
    color: 'bg-orange-500/20 text-orange-400',
  },
  {
    name: 'Make (Integromat)',
    category: 'Automation',
    description: 'Build complex compliance automation workflows connecting FormaOS to your operational toolchain.',
    status: 'beta',
    initials: 'Mk',
    color: 'bg-purple-500/20 text-purple-400',
  },
  // Storage & Evidence
  {
    name: 'Google Drive',
    category: 'Storage',
    description: 'Link Google Drive files directly as evidence artifacts. Access audit-ready with timestamps.',
    status: 'live',
    initials: 'GD',
    color: 'bg-yellow-500/20 text-yellow-400',
  },
  {
    name: 'SharePoint',
    category: 'Storage',
    description: 'Pull policy documents and evidence files from SharePoint libraries with version tracking.',
    status: 'coming-soon',
    initials: 'SP',
    color: 'bg-teal-500/20 text-teal-400',
  },
  // HRIS
  {
    name: 'Employment Hero',
    category: 'HR & Workforce',
    description: 'Sync employee records, compliance training completion, and worker credentials automatically.',
    status: 'coming-soon',
    initials: 'EH',
    color: 'bg-rose-500/20 text-rose-400',
  },
  {
    name: 'MYOB',
    category: 'HR & Workforce',
    description: 'Payroll and workforce data integration for regulated workforce compliance evidence.',
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
        description="Embed compliance into the tools your team already uses. FormaOS integrates with Jira, Slack, Microsoft Teams, Okta, Azure AD, GitHub, and 5,000+ apps via Zapier — so compliance evidence is captured where work happens, not reconstructed after the fact."
        topColor="cyan"
        bottomColor="blue"
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
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
                      <p className="text-xs leading-relaxed text-slate-400">{integration.description}</p>
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
            We prioritise integrations based on customer requests. Tell us which tool matters to your compliance workflow.
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

'use client';

import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';

type RoadmapStatus = 'shipped' | 'in-progress' | 'planned' | 'exploring';

interface RoadmapItem {
  title: string;
  description: string;
  status: RoadmapStatus;
  quarter?: string;
  category: string;
}

const STATUS_CONFIG: Record<
  RoadmapStatus,
  { label: string; dot: string; badge: string }
> = {
  shipped: {
    label: 'Shipped',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  },
  'in-progress': {
    label: 'In Progress',
    dot: 'bg-blue-400',
    badge: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  },
  planned: {
    label: 'Planned',
    dot: 'bg-amber-400',
    badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  },
  exploring: {
    label: 'Exploring',
    dot: 'bg-slate-400',
    badge: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
  },
};

const ROADMAP_ITEMS: RoadmapItem[] = [
  // Recently Shipped
  {
    title: 'SCIM 2.0 Provisioning',
    description:
      'RFC 7644 compliant SCIM server for automated user and group provisioning from Okta, Entra ID, and other identity providers.',
    status: 'shipped',
    quarter: 'Q1 2026',
    category: 'Identity & Security',
  },
  {
    title: 'Jira & Linear Integration',
    description:
      'Bidirectional sync of compliance tasks with Jira and Linear. Status, deadlines, and evidence links stay in sync.',
    status: 'shipped',
    quarter: 'Q1 2026',
    category: 'Integrations',
  },
  {
    title: 'Google Drive Evidence Linking',
    description:
      'Link Google Drive files directly as compliance evidence with chain-of-custody metadata and version tracking.',
    status: 'shipped',
    quarter: 'Q1 2026',
    category: 'Integrations',
  },
  {
    title: 'SHA-256 Evidence Checksums',
    description:
      'Client-side SHA-256 hash computed before upload and stored alongside every evidence artifact for tamper detection.',
    status: 'shipped',
    quarter: 'Q1 2026',
    category: 'Compliance Core',
  },
  {
    title: 'Scheduled Compliance Checks',
    description:
      'Automated compliance posture checks running every 6 hours: expiring credentials, overdue tasks, evidence gaps, and score updates.',
    status: 'shipped',
    quarter: 'Q1 2026',
    category: 'Compliance Core',
  },
  {
    title: 'Platform Features Page',
    description:
      'New marketing page showcasing 18 core features across compliance, workflow, security, and collaboration categories.',
    status: 'shipped',
    quarter: 'Q1 2026',
    category: 'Marketing & Docs',
  },

  // In Progress
  {
    title: 'US Data Residency',
    description:
      'Dedicated Supabase instance in US East for organisations requiring US-based data storage. Infrastructure configuration in progress.',
    status: 'in-progress',
    quarter: 'Q2 2026',
    category: 'Infrastructure',
  },
  {
    title: 'EU Data Residency',
    description:
      'EU-based data storage for GDPR-first organisations. Supabase instance in eu-west region with automatic routing.',
    status: 'in-progress',
    quarter: 'Q2 2026',
    category: 'Infrastructure',
  },
  {
    title: 'GitHub Evidence Pull',
    description:
      'Automated pulling of commit logs, PR approvals, branch protection configs, and code review history as SOC 2 CC8 evidence.',
    status: 'in-progress',
    quarter: 'Q2 2026',
    category: 'Integrations',
  },
  {
    title: 'AWS CloudTrail Integration',
    description:
      'Pull IAM configuration snapshots, S3 access controls, and CloudTrail logs as compliance evidence artifacts.',
    status: 'in-progress',
    quarter: 'Q2 2026',
    category: 'Integrations',
  },

  // Planned
  {
    title: 'First Penetration Test',
    description:
      'Formal third-party penetration test and remediation cycle. Automated OWASP scanning is already live; this adds external validation.',
    status: 'planned',
    quarter: 'Q2 2026',
    category: 'Security',
  },
  {
    title: 'SOC 2 Type II Certification',
    description:
      'Pursue SOC 2 Type II certification for FormaOS itself, starting with the observation period after completing pen test.',
    status: 'planned',
    quarter: 'Q3 2026',
    category: 'Security',
  },
  {
    title: 'Additional Framework Packs',
    description:
      'Expand from 7 frameworks to 10+. Candidates include APRA CPS 234, Essential Eight maturity model, and NIST 800-53.',
    status: 'planned',
    quarter: 'Q3 2026',
    category: 'Compliance Core',
  },
  {
    title: 'HRIS Connectors',
    description:
      'Native connectors to Employment Hero, BambooHR, Deputy, and MYOB for workforce credential and training compliance tracking.',
    status: 'planned',
    quarter: 'Q3 2026',
    category: 'Integrations',
  },
  {
    title: 'ServiceNow Integration',
    description:
      'Sync incident records, change requests, and CMDB snapshots for ISO 27001 and SOC 2 change management controls.',
    status: 'planned',
    quarter: 'Q3 2026',
    category: 'Integrations',
  },
  {
    title: 'SharePoint Evidence Linking',
    description:
      'Pull policy documents and evidence files from SharePoint libraries with version tracking and access control metadata.',
    status: 'planned',
    quarter: 'Q3 2026',
    category: 'Integrations',
  },
  {
    title: 'Azure Security Center Integration',
    description:
      'Collect Azure AD logs, resource compliance state, and Security Center findings as real-time compliance evidence.',
    status: 'planned',
    quarter: 'Q3 2026',
    category: 'Integrations',
  },
  {
    title: 'Google Cloud Platform Integration',
    description:
      'Import Cloud Audit Logs, IAM policy snapshots, and organisation policy evidence for framework mapping.',
    status: 'planned',
    quarter: 'Q4 2026',
    category: 'Integrations',
  },

  // Exploring
  {
    title: 'AI-Assisted Evidence Mapping',
    description:
      'Automatically suggest which evidence artifacts satisfy which control requirements using LLM-based matching.',
    status: 'exploring',
    category: 'Compliance Core',
  },
  {
    title: 'Continuous Monitoring Dashboard',
    description:
      'Real-time dashboard showing live compliance posture across all frameworks with drift detection and alerting.',
    status: 'exploring',
    category: 'Compliance Core',
  },
  {
    title: 'Multi-Tenant Auditor Portal',
    description:
      'Read-only auditor portal with scoped access to evidence, control mappings, and audit logs — no full account needed.',
    status: 'exploring',
    category: 'Compliance Core',
  },
  {
    title: 'Mobile App',
    description:
      'Native iOS and Android app for evidence capture (photo, document scan), task management, and compliance alerts on the go.',
    status: 'exploring',
    category: 'Platform',
  },
];

const CATEGORIES = Array.from(new Set(ROADMAP_ITEMS.map((i) => i.category)));

export default function RoadmapPageContent() {
  const statusOrder: RoadmapStatus[] = [
    'shipped',
    'in-progress',
    'planned',
    'exploring',
  ];

  return (
    <MarketingPageShell>
      <CompactHero
        title="Product Roadmap"
        description="What we've shipped, what we're building, and where we're headed. Transparent product planning for compliance teams."
        topColor="violet"
        bottomColor="blue"
      />

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Status legend */}
        <div className="mb-12 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          {statusOrder.map((status) => {
            const config = STATUS_CONFIG[status];
            return (
              <span key={status} className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${config.dot}`}
                />
                {config.label} (
                {ROADMAP_ITEMS.filter((i) => i.status === status).length})
              </span>
            );
          })}
        </div>

        {/* Last updated */}
        <p className="mb-12 text-xs text-slate-500">
          Last updated: March 2026. This roadmap reflects our current plans and
          is subject to change. Have a feature request?{' '}
          <a
            href="mailto:support@formaos.com"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Let us know
          </a>
          .
        </p>

        {/* Roadmap by status */}
        {statusOrder.map((status) => {
          const items = ROADMAP_ITEMS.filter((i) => i.status === status);
          if (items.length === 0) return null;
          const config = STATUS_CONFIG[status];

          return (
            <section key={status} className="mb-14">
              <div className="mb-6 flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${config.dot}`}
                />
                <h2 className="text-base font-bold text-white">
                  {config.label}
                </h2>
                <span className="text-xs text-slate-500">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-white">
                        {item.title}
                      </h3>
                      {item.quarter && (
                        <span className="shrink-0 text-[10px] text-slate-500 font-mono">
                          {item.quarter}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${config.badge}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Transparency note */}
        <div className="mt-16 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 text-center">
          <h2 className="text-sm font-bold text-white mb-3">
            Our Commitment to Transparency
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mx-auto">
            We only advertise features that exist and work today. This roadmap
            shows what&apos;s coming so you can plan your compliance programme
            with confidence. Items in &quot;Exploring&quot; are ideas we&apos;re
            evaluating — not commitments. If a feature matters to your
            organisation,{' '}
            <a
              href="mailto:support@formaos.com"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              tell us
            </a>{' '}
            and it will influence our priorities.
          </p>
        </div>

        {/* Categories summary */}
        <div className="mt-12 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const count = ROADMAP_ITEMS.filter(
              (i) => i.category === cat,
            ).length;
            return (
              <div
                key={cat}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center"
              >
                <div className="text-xs font-semibold text-slate-300">
                  {cat}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {count} item{count !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MarketingPageShell>
  );
}

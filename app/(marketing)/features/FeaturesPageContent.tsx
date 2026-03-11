'use client';

import {
  Shield,
  FileCheck,
  Bell,
  Users,
  Search,
  MessageSquare,
  Activity,
  BarChart3,
  Layers,
  Command,
  HelpCircle,
  Zap,
  Globe,
  Lock,
  ClipboardCheck,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

/* ─── Section Data ──────────────────────────────────────── */

interface PlatformFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  category: string;
}

const features: PlatformFeature[] = [
  // Compliance Core
  {
    icon: Layers,
    title: '7 Pre-Built Framework Packs',
    description:
      'ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS, NIST CSF, and CIS Controls — each with mapped controls, evidence requirements, and audit-ready reporting.',
    category: 'Compliance Core',
  },
  {
    icon: Shield,
    title: 'Compliance Gate Enforcement',
    description:
      'Critical actions are blocked when required controls are unresolved or evidence is missing. Accountability is enforced by the system before work proceeds.',
    category: 'Compliance Core',
  },
  {
    icon: ClipboardCheck,
    title: 'Compliance Scoring Engine',
    description:
      'Real-time compliance posture scoring with historical trending. Scheduled checks run every 6 hours to detect drift, expiring credentials, and evidence gaps.',
    category: 'Compliance Core',
  },
  {
    icon: FileCheck,
    title: 'Evidence Vault with SHA-256 Verification',
    description:
      'Upload, version, and verify compliance evidence with SHA-256 checksums. Every artifact gets tamper-evident chain-of-custody from upload through audit.',
    category: 'Compliance Core',
  },

  // Workflow & Operations
  {
    icon: Workflow,
    title: 'Workflow Automation',
    description:
      'Configure automated triggers for task creation, notifications, escalations, and evidence collection. 12+ trigger types across compliance events.',
    category: 'Workflow & Operations',
  },
  {
    icon: Zap,
    title: 'Bulk Operations',
    description:
      'Manage controls, evidence, tasks, and user provisioning in bulk. Assign, update, or archive across your entire compliance program in one action.',
    category: 'Workflow & Operations',
  },
  {
    icon: Activity,
    title: 'Incident Management',
    description:
      'Full incident lifecycle: report, investigate, assign corrective actions, and close with evidence. Every step audit-logged with timestamps and ownership.',
    category: 'Workflow & Operations',
  },
  {
    icon: Users,
    title: 'Care Plans & Participant Management',
    description:
      'NDIS and healthcare-specific: manage participant care plans, visits, progress notes, and service delivery logs with compliance evidence at every step.',
    category: 'Workflow & Operations',
  },

  // Identity & Security
  {
    icon: Lock,
    title: 'SAML 2.0 SSO & SCIM Provisioning',
    description:
      'Enterprise identity governance with Okta, Azure AD, and Google Workspace. SCIM 2.0 for automated user lifecycle management — onboarding, role changes, and offboarding.',
    category: 'Identity & Security',
  },
  {
    icon: Globe,
    title: 'Data Residency Controls',
    description:
      'AU-hosted by default with configurable data residency preferences. Infrastructure-ready for US and EU regions as your international regulatory requirements grow.',
    category: 'Identity & Security',
  },
  {
    icon: Shield,
    title: 'Immutable Audit Trail',
    description:
      'Every action logged with full context — who, what, when, and why. Append-only, tamper-evident records that satisfy regulatory requirements and auditor scrutiny.',
    category: 'Identity & Security',
  },
  {
    icon: BarChart3,
    title: 'Risk Heatmap',
    description:
      'Visual risk posture across your compliance program. Identify concentrations of overdue controls, evidence gaps, and credential expirations at a glance.',
    category: 'Identity & Security',
  },

  // Collaboration & UX
  {
    icon: MessageSquare,
    title: 'Inline Comments & Collaboration',
    description:
      'Comment on controls, evidence, tasks, and incidents directly. Threaded discussions with @mentions keep compliance conversations in context.',
    category: 'Collaboration & UX',
  },
  {
    icon: Bell,
    title: 'Notification Center',
    description:
      'Centralized notification hub for task assignments, evidence reviews, credential expirations, and compliance alerts. Plus Slack and Teams integrations.',
    category: 'Collaboration & UX',
  },
  {
    icon: Command,
    title: 'Command Palette',
    description:
      'Power-user navigation: jump to any control, task, evidence, or setting instantly. Keyboard-first workflow for operators who live in the platform daily.',
    category: 'Collaboration & UX',
  },
  {
    icon: Search,
    title: 'Global Search',
    description:
      'Search across controls, evidence, tasks, incidents, and audit logs from one place. Filter by framework, status, assignee, or date range.',
    category: 'Collaboration & UX',
  },
  {
    icon: HelpCircle,
    title: 'Contextual Help Assistant',
    description:
      'In-app guidance and documentation surfaced where you need it. New users get onboarding walkthroughs; experienced users get contextual tips.',
    category: 'Collaboration & UX',
  },
  {
    icon: Activity,
    title: 'Real-Time Collaboration',
    description:
      'Live presence indicators, real-time updates, and synchronized views. See who is working on what, with changes reflected instantly across the team.',
    category: 'Collaboration & UX',
  },
];

const categories = [
  'Compliance Core',
  'Workflow & Operations',
  'Identity & Security',
  'Collaboration & UX',
];

const categoryDescriptions: Record<string, string> = {
  'Compliance Core':
    'Framework coverage, control enforcement, evidence management, and posture scoring.',
  'Workflow & Operations':
    'Automate compliance workflows, manage incidents, and handle bulk operations.',
  'Identity & Security':
    'Enterprise SSO, audit trails, data residency, and risk visualization.',
  'Collaboration & UX':
    'Comments, notifications, search, and power-user tools for daily operators.',
};

/* ─── Component ─────────────────────────────────────────── */

export default function FeaturesPageContent() {
  return (
    <div className="relative min-h-screen bg-[#09090b] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-28 text-center sm:pt-36">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400">
            <Layers className="h-3.5 w-3.5" />
            Platform Overview
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Everything inside{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              FormaOS
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            18 core features across compliance operations, workflow automation,
            enterprise security, and team collaboration — built for regulated
            organizations that need defensible, auditable compliance.
          </p>
        </div>
      </section>

      {/* Feature Grid by Category */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        {categories.map((category) => (
          <div key={category} className="mb-20 last:mb-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {category}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {categoryDescriptions[category]}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
              {features
                .filter((f) => f.category === category)
                .map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.04]"
                    >
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                        <Icon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h3 className="mb-2 text-base font-semibold text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 bg-gradient-to-b from-transparent to-emerald-500/5">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            See it all in action
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
            Start a 14-day free trial — no credit card required. Every feature
            listed above is available from day one.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au'}/auth/signup`}
              className="rounded-xl bg-emerald-500 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Start Free Trial
            </a>
            <a
              href="/product"
              className="rounded-xl border border-white/10 px-8 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/5"
            >
              Explore Product
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

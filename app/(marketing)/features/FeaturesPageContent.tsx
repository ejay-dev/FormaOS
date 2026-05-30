'use client';

import { useRef, useState, useMemo } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useInView,
} from 'framer-motion';
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
  ChevronRight,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Eye,
  Database,
  Server,
  Key,
  Fingerprint,
  Clock,
  AlertTriangle,
  TrendingUp,
  GitBranch,
  Monitor,
  Bot,
  ShieldCheck,
  LayoutDashboard,
  FileText,
  Store,
  Network,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { SectionMedia } from '@/components/marketing/SectionMedia';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import {
  compliancePlanHref,
  PUBLIC_CTA_LABELS,
  salesHref,
} from '@/lib/marketing/cta';

/* ─── Easing ────────────────────────────────────────────── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─── Section Headers ─────────────────────────────────────────
   Centred-minimal and editorial left-aligned header treatments.
   Sections alternate so the page reads as composed editorial rather
   than one repeated eyebrow-pill template.
   ──────────────────────────────────────────────────────────── */

function CenteredHeader({
  label,
  title,
  emphasis,
  description,
  className = 'mb-14',
}: {
  label: string;
  title: string;
  emphasis: string;
  description: string;
  className?: string;
}) {
  return (
    <ScrollReveal
      variant="depthScale"
      range={[0, 0.3]}
      className={`text-center ${className}`}
    >
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
        {title} <span className="text-slate-400">{emphasis}</span>
      </h2>
      <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
        {description}
      </p>
    </ScrollReveal>
  );
}

function EditorialHeader({
  label,
  title,
  emphasis,
  description,
  className = 'mb-14',
}: {
  label: string;
  title: string;
  emphasis: string;
  description: string;
  className?: string;
}) {
  return (
    <ScrollReveal
      variant="fadeUp"
      range={[0, 0.3]}
      className={`grid gap-x-10 gap-y-6 border-b border-white/[0.06] pb-10 lg:grid-cols-12 lg:items-end ${className}`}
    >
      <div className="lg:col-span-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="h-px w-8 bg-white/25" />
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {label}
          </span>
        </div>
        <h2 className="text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
          {title} <span className="text-slate-400">{emphasis}</span>
        </h2>
      </div>
      <div className="lg:col-span-5">
        <p className="max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
          {description}
        </p>
      </div>
    </ScrollReveal>
  );
}

/* ─── Feature Data ──────────────────────────────────────── */

interface PlatformFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  longDescription: string;
  category: string;
  highlight?: string;
  capabilities: string[];
}

const features: PlatformFeature[] = [
  {
    icon: Layers,
    title: '8 Pre-Built Framework Packs',
    description:
      'SOC 2 TSC, ISO 27001:2022, NIST CSF 2.0, CIS v8, HIPAA, GDPR, PCI DSS 4.0, and NDIS Practice Standards — each with mapped controls and evaluator coverage in lib/compliance/evaluators/register.ts.',
    longDescription:
      'Each Framework Pack ships with pre-mapped controls, evidence templates, and an evaluator implementation. 252 total controls across the 8 packs — 102 auto-evaluate against your live data, 150 require human attestation. Controls are mapped cross-framework (40+ seeded mappings) so evidence collected for ISO 27001 cascades credit to overlapping SOC 2 and HIPAA requirements.',
    category: 'Compliance Core',
    highlight: 'Most popular',
    capabilities: [
      'Pre-mapped control libraries per framework',
      'Cross-framework evidence mapping',
      'Automated gap analysis & scoring',
      'Quarterly standard updates',
    ],
  },
  {
    icon: Shield,
    title: 'Compliance Gate Enforcement',
    description:
      'Critical actions are blocked when required controls are unresolved or evidence is missing. Accountability is enforced by the system before work proceeds.',
    longDescription:
      'Compliance Gates are configurable enforcement points that prevent progress when prerequisites are unmet. Unlike advisory warnings, gates are structural - they block deployment, approval, and sign-off workflows until evidence is verified and controls are resolved. Gates integrate with your CI/CD pipeline, approval workflows, and audit preparation processes.',
    category: 'Compliance Core',
    capabilities: [
      'Configurable enforcement rules',
      'CI/CD pipeline integration',
      'Block-on-fail for critical controls',
      'Audit-ready gate logs',
    ],
  },
  {
    icon: ClipboardCheck,
    title: 'Compliance Scoring Engine',
    description:
      'Real-time compliance posture scoring with historical trending. Scheduled checks run daily to detect drift, expiring credentials, and evidence gaps.',
    longDescription:
      'The scoring engine continuously evaluates your compliance posture across all active frameworks. Scores are broken down by framework, category, and individual control - with drill-down from aggregate score to specific failing checks. Historical trending shows improvement trajectories, and automated alerts fire when scores drop below configurable thresholds.',
    category: 'Compliance Core',
    capabilities: [
      'Real-time posture scoring',
      'Historical trend analysis',
      'Threshold-based alerting',
      'Per-framework breakdowns',
    ],
  },
  {
    icon: FileCheck,
    title: 'Evidence Vault with SHA-256',
    description:
      'Upload, version, and verify compliance evidence with SHA-256 checksums. Every artifact gets tamper-evident chain-of-custody from upload through audit.',
    longDescription:
      'The Evidence Vault provides immutable, versioned storage for all compliance artifacts. Every file receives a SHA-256 hash at upload, with cryptographic verification at every access point. Chain-of-custody tracking records who uploaded, reviewed, approved, and exported each piece of evidence - creating a tamper-evident audit trail that satisfies the most rigorous regulatory requirements.',
    category: 'Compliance Core',
    highlight: 'Enterprise-grade',
    capabilities: [
      'SHA-256 at-rest verification',
      'Version history with diff',
      'Chain-of-custody tracking',
      'Bulk evidence export',
    ],
  },
  {
    icon: Workflow,
    title: 'Workflow Automation',
    description:
      'Configure automated triggers for task creation, notifications, escalations, and evidence collection. 12+ trigger types across compliance events.',
    longDescription:
      'Build automation rules using a visual workflow builder with 12+ trigger types including control status changes, evidence expiry, credential renewal dates, and compliance score thresholds. Actions include task assignment, stakeholder notifications, escalation chains, and automated evidence collection from connected integrations.',
    category: 'Workflow & Operations',
    capabilities: [
      '12+ event trigger types',
      'Visual workflow builder',
      'Multi-step escalation chains',
      'Conditional branching logic',
    ],
  },
  {
    icon: Zap,
    title: 'Bulk Operations',
    description:
      'Manage controls, evidence, tasks, and user provisioning in bulk. Assign, update, or archive across your entire compliance program in one action.',
    longDescription:
      'Perform mass operations across your compliance program without tedious one-by-one updates. Bulk assign controls to owners, update evidence status across frameworks, provision users with role templates, and archive completed audit cycles - all with full audit trail preservation and rollback capability.',
    category: 'Workflow & Operations',
    capabilities: [
      'Multi-select across entities',
      'Template-based bulk provisioning',
      'Rollback capability',
      'Operation audit logging',
    ],
  },
  {
    icon: Activity,
    title: 'Incident Management',
    description:
      'Full incident lifecycle: report, investigate, assign corrective actions, and close with evidence.',
    longDescription:
      'Manage the complete incident lifecycle from initial report through investigation, root cause analysis, corrective action assignment, and closure with evidence. Every step is audit-logged with timestamps, ownership, and linked compliance impact. Incidents automatically escalate based on severity and response time SLAs.',
    category: 'Workflow & Operations',
    capabilities: [
      'Severity-based auto-escalation',
      'Root cause analysis templates',
      'Corrective action tracking',
      'Compliance impact linking',
    ],
  },
  {
    icon: Users,
    title: 'Care Plans & Participant Management',
    description:
      'NDIS and healthcare-specific: manage participant care plans, visits, progress notes, and service delivery logs.',
    longDescription:
      'Purpose-built for NDIS providers and healthcare organizations managing regulated care delivery. Track participant care plans with goal-linked progress notes, visit scheduling with compliance-verified check-in/check-out, and service delivery logs that satisfy NDIS Quality & Safeguards Commission audit requirements.',
    category: 'Workflow & Operations',
    capabilities: [
      'Goal-linked progress tracking',
      'Visit scheduling & verification',
      'NDIS audit-ready reporting',
      'Billing reconciliation support',
    ],
  },
  {
    icon: Lock,
    title: 'SAML 2.0 SSO & Identity Lifecycle Controls',
    description:
      'Enterprise identity governance with Okta, Azure AD, and Google Workspace, plus deployment planning for centralized access control requirements.',
    longDescription:
      'Enterprise identity governance supporting SAML 2.0 single sign-on with Okta, Azure Active Directory, Google Workspace, and any SAML 2.0-compliant identity provider. Additional provisioning, onboarding, team-transfer, and offboarding requirements are reviewed during enterprise deployment so identity controls match the operating model.',
    category: 'Identity & Security',
    highlight: 'Enterprise',
    capabilities: [
      'SAML 2.0 with any IdP',
      'Centralized identity planning',
      'JIT user provisioning',
      'Role-based access control',
    ],
  },
  {
    icon: Globe,
    title: 'Data Residency Controls',
    description:
      'AU-hosted by default with configurable data residency preferences. Infrastructure-ready for US and EU regions.',
    longDescription:
      'All data is hosted in Australia by default with infrastructure ready for US and EU data residency as regulatory requirements expand. Data residency controls ensure that compliance evidence, audit trails, and user data remain within jurisdictional boundaries - critical for organizations subject to data sovereignty requirements under GDPR, Privacy Act 1988, and sector-specific regulations.',
    category: 'Identity & Security',
    capabilities: [
      'AU-default data hosting',
      'US/EU region ready',
      'Jurisdictional data isolation',
      'Sovereignty compliance reporting',
    ],
  },
  {
    icon: Eye,
    title: 'Immutable Audit Trail',
    description:
      'Every action logged with full context - who, what, when, and why. Append-only, tamper-evident records.',
    longDescription:
      'The audit trail captures every significant action with full context: the actor, the action, the timestamp, the affected entity, and the justification. Records are append-only and cryptographically linked to prevent tampering. Audit trails are exportable in formats that satisfy regulatory inquiry requirements, with configurable retention policies and automated archival.',
    category: 'Identity & Security',
    capabilities: [
      'Append-only immutability',
      'Cryptographic record linking',
      'Configurable retention policies',
      'Regulatory export formats',
    ],
  },
  {
    icon: BarChart3,
    title: 'Risk Heatmap',
    description:
      'Visual risk posture across your compliance program. Identify concentrations of overdue controls and evidence gaps at a glance.',
    longDescription:
      'The Risk Heatmap provides a visual overlay of your entire compliance program, color-coding controls by risk level based on overdue status, evidence freshness, ownership gaps, and historical failure rates. Drill down from program-wide view to framework, category, and individual control levels. Export heatmap snapshots for board reporting and regulatory submissions.',
    category: 'Identity & Security',
    capabilities: [
      'Multi-dimensional risk scoring',
      'Framework-level drill-down',
      'Board-ready export snapshots',
      'Historical trend overlays',
    ],
  },
  {
    icon: MessageSquare,
    title: 'Inline Comments & Collaboration',
    description:
      'Comment on controls, evidence, tasks, and incidents directly. Threaded discussions with @mentions.',
    longDescription:
      'Collaborate in context with inline comments attached directly to controls, evidence items, tasks, and incidents. Threaded conversations keep discussions organized, @mentions notify relevant stakeholders, and comment history becomes part of the permanent audit record. Rich text support includes code blocks, checklists, and file attachments.',
    category: 'Collaboration & UX',
    capabilities: [
      'Threaded conversations',
      '@mention notifications',
      'Rich text with attachments',
      'Audit-trail integration',
    ],
  },
  {
    icon: Bell,
    title: 'Notification Center',
    description:
      'Centralized hub for task assignments, evidence reviews, credential expirations, and compliance alerts.',
    longDescription:
      'A centralized notification hub that aggregates alerts across your compliance program. Configure notification preferences by type, urgency, and channel - with support for in-app, email, Slack, and Microsoft Teams delivery. Smart batching prevents notification fatigue while ensuring critical alerts receive immediate attention.',
    category: 'Collaboration & UX',
    capabilities: [
      'Multi-channel delivery',
      'Smart alert batching',
      'Urgency-based prioritization',
      'Slack & Teams integration',
    ],
  },
  {
    icon: Command,
    title: 'Command Palette',
    description:
      'Power-user navigation: jump to any control, task, evidence, or setting instantly. Keyboard-first workflow.',
    longDescription:
      'The Command Palette provides instant access to any entity in your compliance program. Type to search controls, tasks, evidence, incidents, users, and settings - with fuzzy matching and recent history. Keyboard shortcuts for common actions let power users navigate the entire platform without touching a mouse.',
    category: 'Collaboration & UX',
    capabilities: [
      'Fuzzy entity search',
      'Keyboard shortcut system',
      'Recent history recall',
      'Action commands (create, assign, review)',
    ],
  },
  {
    icon: Search,
    title: 'Global Search',
    description:
      'Search across controls, evidence, tasks, incidents, and audit logs. Filter by framework, status, or assignee.',
    longDescription:
      'Full-text search across every entity type in FormaOS with faceted filtering by framework, status, assignee, date range, and entity type. Search results include context snippets showing why each result matched, with inline actions to navigate directly to the matching record. Saved searches can be pinned for quick access.',
    category: 'Collaboration & UX',
    capabilities: [
      'Full-text cross-entity search',
      'Faceted filtering',
      'Context snippet highlighting',
      'Saved & pinned searches',
    ],
  },
  {
    icon: HelpCircle,
    title: 'Contextual Help Assistant',
    description:
      'In-app guidance and documentation surfaced where you need it. Onboarding walkthroughs and contextual tips.',
    longDescription:
      'The contextual help system surfaces relevant documentation, tips, and walkthroughs based on your current location and action within FormaOS. New users receive guided onboarding that walks through platform setup, first framework activation, and team invitation. Experienced users get contextual tooltips and keyboard shortcut reminders.',
    category: 'Collaboration & UX',
    capabilities: [
      'Location-aware help surfacing',
      'Guided onboarding flows',
      'Interactive walkthroughs',
      'Shortcut discovery prompts',
    ],
  },
  {
    icon: Monitor,
    title: 'Real-Time Collaboration',
    description:
      'Live presence indicators, real-time updates, and synchronized views across the team.',
    longDescription:
      'See who is working on what with live presence indicators on controls, evidence, and tasks. Changes sync in real-time across all connected sessions - no refresh required. Conflict resolution ensures simultaneous edits merge gracefully, with visual indicators showing when a control or evidence item is being edited by a teammate.',
    category: 'Collaboration & UX',
    capabilities: [
      'Live presence indicators',
      'Real-time sync across sessions',
      'Conflict resolution',
      'Simultaneous editing support',
    ],
  },
  {
    icon: Bot,
    title: 'Compliance Q&A assistant',
    description:
      'General-purpose AI Q&A for compliance questions, policy drafting, and prompt-template workflows. Surface-level org context only — not grounded in your live policies, evidence, or controls.',
    longDescription:
      'A stateless AI Q&A wrapper trained for compliance vocabulary. Useful for "how is GDPR Article 32 typically implemented?" or "draft a vendor risk policy starter" — not for "what does my current control evidence show?" Surface-level org context (industry, team size) is passed in; live policies, controls, and evidence are NOT used as grounding. Real retrieval-augmented chat against your evidence vault is on the roadmap but not shipping today.',
    category: 'AI & Certification',
    highlight: 'General-purpose · not RAG',
    capabilities: [
      'Streaming Q&A chat',
      'Policy drafting prompt templates',
      'Conversation history',
      'No org-data grounding (yet)',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'SOC 2 readiness + report generator',
    description:
      '61 SOC 2 Trust Service Criteria controls mapped, automated evaluators for ~28 of them, milestone tracking through audit readiness, and a downloadable report.',
    longDescription:
      'SOC 2 Type II readiness across all 61 Trust Service Criteria (CC, A, C, PI, P) per lib/compliance/evaluators/register.ts. ~28 controls auto-evaluate against your live data (MFA coverage, audit-log freshness, policy cadence, etc.); the remaining ~33 require human attestation. Milestone tracker at /app/compliance/soc2 guides framework enablement → evidence collection → readiness report. Score weights are not fixed marketing percentages — they reflect the actual count of passing vs. failing evaluators in each TSC category.',
    category: 'AI & Certification',
    highlight: 'Shipping',
    capabilities: [
      '61 SOC 2 TSC controls mapped',
      '~28 auto-evaluated against live data',
      'Milestone tracker for readiness',
      'Downloadable readiness report',
    ],
  },
  {
    icon: Network,
    title: 'Framework Cross-Mapping',
    description:
      'Map controls across frameworks with strength scoring. 40+ pre-loaded cross-mappings seeded between ISO 27001, SOC 2, HIPAA, and NIST CSF.',
    longDescription:
      'Framework Cross-Mapping manages the relationships between controls across compliance frameworks. Each mapping carries a strength label — exact, partial, or related — so teams can judge overlap quality. 40+ cross-mappings are seeded by migration 20260403003 covering ISO 27001, SOC 2, HIPAA, and NIST CSF, and the engine walks both forward and reverse relationships so a satisfied control on one framework can cascade credit to its mapped peers on others.',
    category: 'Compliance Core',
    highlight: 'Shipping',
    capabilities: [
      'Strength-labelled mappings (exact / partial / related)',
      '40+ pre-loaded cross-framework maps',
      'Bi-directional relationship walk',
      'De-duplicated evidence credit',
    ],
  },
  {
    icon: FileText,
    title: 'Policy Lifecycle Management',
    description:
      'End-to-end policy lifecycle from draft through approval, publication, and retirement with version history and stakeholder review workflows.',
    longDescription:
      'Manage the complete lifecycle of compliance policies: draft, review, approval, publish, and retirement. Every policy version is tracked with full diff comparison. Stakeholder review workflows ensure proper sign-off before publication. Scheduled review reminders prevent policy staleness. Acknowledgment tracking confirms staff awareness with evidence suitable for audit.',
    category: 'Workflow & Operations',
    highlight: 'New in v3.1',
    capabilities: [
      'Draft-to-retirement lifecycle',
      'Version history with visual diff',
      'Stakeholder review workflows',
      'Acknowledgment tracking with evidence',
    ],
  },
  {
    icon: LayoutDashboard,
    title: 'Custom Dashboard Builder',
    description:
      'Build personalised compliance dashboards with 15 widget types, drag-and-drop layout, and shared views for teams and leadership.',
    longDescription:
      'The Custom Dashboard Builder lets users create personalised compliance views using 15 widget types including compliance scores, task boards, evidence timelines, framework coverage gauges, risk heatmaps, and activity feeds. Drag-and-drop layout with configurable widget sizes. Save multiple dashboard layouts and share them across teams. Default dashboards can be set per organization for consistent executive reporting.',
    category: 'Collaboration & UX',
    highlight: 'New in v3.1',
    capabilities: [
      '15 drag-and-drop widget types',
      'Configurable layout and sizing',
      'Shareable dashboard views',
      'Organization-default dashboards',
    ],
  },
  {
    icon: Store,
    title: 'Integration Marketplace',
    description:
      'Browse and install 20+ connectors across productivity, cloud, identity, security, and HRIS categories with one-click setup.',
    longDescription:
      'The Integration Marketplace provides a categorised catalog of 20+ connectors that extend FormaOS into your existing tool ecosystem. Categories include Productivity (Slack, Teams, Jira), Cloud (AWS, Azure, GCP), Identity (Okta, Azure AD), Security (Qualys, Tenable), and HRIS (BambooHR, Workday). One-click installation with guided configuration wizards. Integration health monitoring with automatic reconnection and status dashboards.',
    category: 'Workflow & Operations',
    highlight: 'New in v3.1',
    capabilities: [
      '20+ categorised connectors',
      'One-click install with setup wizard',
      'Integration health monitoring',
      'Automatic reconnection and alerts',
    ],
  },
  {
    icon: Sparkles,
    title: 'REST API v1',
    description:
      'Full REST API with 20+ endpoints, bearer API keys with scoped permissions, cursor pagination, rate limiting, and OpenAPI 3.1 specification.',
    longDescription:
      'The v1 REST API gives developers programmatic access to the full FormaOS platform. 20+ endpoints cover organizations, tasks, evidence, compliance data, reports, frameworks, controls, notifications, integrations, and search. Bearer API keys with fos_ prefix support scoped permissions per key. Cursor-based pagination, per-key rate limiting with headers, and a generated OpenAPI 3.1 specification enable SDK generation and custom integrations.',
    category: 'AI & Certification',
    highlight: 'New in v3.0',
    capabilities: [
      '20+ scoped API endpoints',
      'Bearer API key authentication',
      'Cursor pagination & rate limiting',
      'OpenAPI 3.1 specification',
    ],
  },
];

const categories = [
  'Compliance Core',
  'Workflow & Operations',
  'Identity & Security',
  'Collaboration & UX',
  'AI & Certification',
] as const;

type CategoryName = (typeof categories)[number];

interface CategoryConfig {
  description: string;
  gradient: string;
  accent: string;
  accentRgb: string;
  icon: LucideIcon;
  dotColor: string;
  bgGlow: string;
  borderHover: string;
  iconBg: string;
  iconBorder: string;
  textColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

const categoryMeta: Record<CategoryName, CategoryConfig> = {
  'Compliance Core': {
    description:
      'Framework coverage, control enforcement, evidence management, and posture scoring - the operational backbone of your compliance program.',
    gradient: 'from-white/[0.12] via-white/[0.04] to-transparent',
    accent: 'slate',
    accentRgb: '203,213,225',
    icon: Shield,
    dotColor: 'bg-slate-300',
    bgGlow: 'bg-white/[0.04]',
    borderHover: 'hover:border-white/20',
    iconBg: 'bg-white/[0.06]',
    iconBorder: 'border-white/10',
    textColor: 'text-slate-200',
    badgeBg: 'bg-white/[0.06]',
    badgeBorder: 'border-white/10',
    badgeText: 'text-slate-300',
  },
  'Workflow & Operations': {
    description:
      'Automation, incident management, bulk operations, and care delivery workflows that eliminate manual compliance overhead.',
    gradient: 'from-white/[0.12] via-white/[0.04] to-transparent',
    accent: 'slate',
    accentRgb: '148,163,184',
    icon: Workflow,
    dotColor: 'bg-slate-400',
    bgGlow: 'bg-white/[0.04]',
    borderHover: 'hover:border-white/20',
    iconBg: 'bg-white/[0.06]',
    iconBorder: 'border-white/10',
    textColor: 'text-slate-300',
    badgeBg: 'bg-white/[0.06]',
    badgeBorder: 'border-white/10',
    badgeText: 'text-slate-300',
  },
  'Identity & Security': {
    description:
      'Enterprise identity governance, data residency, immutable audit trails, and risk visualization for regulated environments.',
    gradient: 'from-white/[0.12] via-white/[0.04] to-transparent',
    accent: 'zinc',
    accentRgb: '161,161,170',
    icon: Lock,
    dotColor: 'bg-zinc-400',
    bgGlow: 'bg-white/[0.04]',
    borderHover: 'hover:border-white/20',
    iconBg: 'bg-white/[0.06]',
    iconBorder: 'border-white/10',
    textColor: 'text-zinc-300',
    badgeBg: 'bg-white/[0.06]',
    badgeBorder: 'border-white/10',
    badgeText: 'text-zinc-300',
  },
  'Collaboration & UX': {
    description:
      'Real-time collaboration, intelligent search, contextual help, and keyboard-first workflows for compliance teams.',
    gradient: 'from-white/[0.12] via-white/[0.04] to-transparent',
    accent: 'zinc',
    accentRgb: '113,113,122',
    icon: MessageSquare,
    dotColor: 'bg-zinc-500',
    bgGlow: 'bg-white/[0.04]',
    borderHover: 'hover:border-white/20',
    iconBg: 'bg-white/[0.06]',
    iconBorder: 'border-white/10',
    textColor: 'text-slate-300',
    badgeBg: 'bg-white/[0.06]',
    badgeBorder: 'border-white/10',
    badgeText: 'text-slate-300',
  },
  'AI & Certification': {
    description:
      'AI-powered compliance intelligence and automated self-certification engines that accelerate audit readiness.',
    gradient: 'from-white/[0.12] via-white/[0.04] to-transparent',
    accent: 'slate',
    accentRgb: '203,213,225',
    icon: Bot,
    dotColor: 'bg-slate-300',
    bgGlow: 'bg-white/[0.04]',
    borderHover: 'hover:border-white/20',
    iconBg: 'bg-white/[0.06]',
    iconBorder: 'border-white/10',
    textColor: 'text-slate-200',
    badgeBg: 'bg-white/[0.06]',
    badgeBorder: 'border-white/10',
    badgeText: 'text-slate-300',
  },
};

/* ─── Comparison Data ───────────────────────────────────── */

const comparisonItems = [
  {
    legacy: 'Spreadsheet-based control tracking',
    formaos: 'Structured control libraries with framework mapping',
    icon: ClipboardCheck,
  },
  {
    legacy: 'Evidence stored in shared drives',
    formaos: 'SHA-256 verified Evidence Vault with chain-of-custody',
    icon: FileCheck,
  },
  {
    legacy: 'Manual audit preparation over weeks',
    formaos: 'Mapped audit packet export without rebuilding evidence manually',
    icon: Clock,
  },
  {
    legacy: 'No enforcement of compliance workflows',
    formaos: 'Compliance Gates block progress until requirements met',
    icon: Shield,
  },
  {
    legacy: 'Disconnected identity management',
    formaos: 'SAML 2.0 SSO + centralized access controls',
    icon: Key,
  },
  {
    legacy: 'Reactive risk discovery during audits',
    formaos: 'Continuous risk scoring with real-time heatmap',
    icon: AlertTriangle,
  },
  {
    legacy: 'No clear ownership or accountability',
    formaos: 'Named control owners with escalation chains',
    icon: Users,
  },
  {
    legacy: 'Point-in-time compliance snapshots',
    formaos: 'Continuous compliance with daily automated checks',
    icon: TrendingUp,
  },
];

/* ─── Architecture Layers ───────────────────────────────── */

const architectureLayers = [
  {
    label: 'Frontend Gating',
    detail:
      'React compliance gates with real-time validation. Controls render-blocked UI when prerequisites are unmet.',
    icon: Monitor,
    accent: 'slate',
    accentRgb: '203,213,225',
  },
  {
    label: 'API Guards',
    detail:
      'Server-side middleware enforcing permission checks, rate limiting, and compliance state validation on every request.',
    icon: Server,
    accent: 'slate',
    accentRgb: '148,163,184',
  },
  {
    label: 'Business Logic',
    detail:
      'Workflow engine processing automation rules, scoring calculations, and cross-framework evidence mapping.',
    icon: GitBranch,
    accent: 'zinc',
    accentRgb: '113,113,122',
  },
  {
    label: 'Database RLS',
    detail:
      'Row-Level Security policies ensure tenant isolation at the database layer. Every query is scoped by organization.',
    icon: Database,
    accent: 'zinc',
    accentRgb: '161,161,170',
  },
  {
    label: 'Environment Isolation',
    detail:
      'Infrastructure-level tenant isolation with dedicated encryption keys and configurable data residency.',
    icon: Key,
    accent: 'slate',
    accentRgb: '148,163,184',
  },
];

/* ─── Stats ─────────────────────────────────────────────── */

const platformStats = [
  { value: '23', label: 'Platform Features', suffix: '' },
  { value: '7', label: 'Framework Packs', suffix: '+' },
  { value: '12', label: 'Automation Triggers', suffix: '+' },
  { value: '5', label: 'Security Layers', suffix: '' },
  { value: 'AU', label: 'Default Hosting Region', suffix: '' },
  { value: 'Audit', label: 'Evidence Export', suffix: '-ready' },
];

/* ─── Animated Counter ──────────────────────────────────── */

function AnimatedStat({
  value,
  label,
  suffix,
  delay,
}: {
  value: string;
  label: string;
  suffix: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: EASE_OUT_EXPO }}
      className="text-center px-2"
    >
      <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1">
        {value}
        <span className="text-slate-400">{suffix}</span>
      </div>
      <div className="text-xs sm:text-sm text-slate-400 font-medium">
        {label}
      </div>
    </motion.div>
  );
}

/* ─── Feature Card ──────────────────────────────────────── */

function FeatureCard({
  feature,
  index,
  categoryConfig,
}: {
  feature: PlatformFeature;
  index: number;
  categoryConfig: CategoryConfig;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: EASE_OUT_EXPO,
      }}
      className="group relative"
    >
      <div
        className={`relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-7
          transition-all duration-300 cursor-pointer
          hover:bg-white/[0.04] ${categoryConfig.borderHover}
          hover:shadow-[0_0_40px_rgba(${categoryConfig.accentRgb},0.06)]`}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        {/* Hover glow underlay */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, rgba(${categoryConfig.accentRgb}, 0.08), transparent 70%)`,
          }}
        />

        {/* Header row */}
        <div className="relative flex items-start gap-4 mb-4">
          <div
            className={`shrink-0 w-11 h-11 rounded-xl border ${categoryConfig.iconBorder} ${categoryConfig.iconBg}
              flex items-center justify-center transition-all duration-300
              group-hover:shadow-[0_0_20px_rgba(${categoryConfig.accentRgb},0.15)]`}
          >
            <Icon className={`w-5 h-5 ${categoryConfig.textColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-base font-semibold text-white leading-snug">
                {feature.title}
              </h3>
              {feature.highlight && (
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                    border ${categoryConfig.badgeBorder} ${categoryConfig.badgeBg} ${categoryConfig.badgeText}`}
                >
                  {feature.highlight}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {feature.description}
            </p>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="shrink-0 mt-1"
          >
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </motion.div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-white/[0.06]">
                <p className="text-sm text-slate-300 leading-relaxed mb-5">
                  {feature.longDescription}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {feature.capabilities.map((cap, ci) => (
                    <motion.div
                      key={cap}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: ci * 0.06,
                        duration: 0.4,
                        ease: EASE_OUT_EXPO,
                      }}
                      className="flex items-start gap-2"
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${categoryConfig.textColor}`}
                      />
                      <span className="text-xs text-slate-300">{cap}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Category Navigation ───────────────────────────────── */

function CategoryNav({
  activeCategory,
  onSelect,
}: {
  activeCategory: CategoryName | null;
  onSelect: (cat: CategoryName | null) => void;
}) {
  return (
    <ScrollReveal variant="fadeUp" range={[0, 0.3]}>
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        <button
          onClick={() => onSelect(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border
            ${
              activeCategory === null
                ? 'bg-white/[0.08] border-white/[0.15] text-white'
                : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
        >
          All Features
          <span className="ml-1.5 text-xs text-slate-500">
            {features.length}
          </span>
        </button>
        {categories.map((cat) => {
          const meta = categoryMeta[cat];
          const count = features.filter((f) => f.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border flex items-center gap-2
                ${
                  activeCategory === cat
                    ? `bg-white/[0.08] border-white/[0.15] text-white shadow-[0_0_20px_rgba(${meta.accentRgb},0.1)]`
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
              {cat}
              <span className="text-xs text-slate-500">{count}</span>
            </button>
          );
        })}
      </div>
    </ScrollReveal>
  );
}

/* ─── Category Section ──────────────────────────────────── */

function CategorySection({
  category,
  categoryFeatures,
}: {
  category: CategoryName;
  categoryFeatures: PlatformFeature[];
}) {
  const config = categoryMeta[category];
  const CategoryIcon = config.icon;

  return (
    <section className="mb-20">
      <ScrollReveal variant="fadeUp" range={[0, 0.3]}>
        <div className="flex items-center gap-4 mb-3">
          <div
            className={`w-10 h-10 rounded-xl border ${config.iconBorder} ${config.iconBg}
              flex items-center justify-center`}
          >
            <CategoryIcon className={`w-5 h-5 ${config.textColor}`} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {category}
            </h2>
          </div>
        </div>
        <p className="text-sm text-slate-400 max-w-2xl mb-8 leading-relaxed">
          {config.description}
        </p>
        <div
          className="h-px mb-8"
          style={{
            background: `linear-gradient(to right, rgba(${config.accentRgb}, 0.3), transparent 60%)`,
          }}
        />
      </ScrollReveal>

      <div className="grid gap-4 sm:grid-cols-2">
        {categoryFeatures.map((feature, i) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            index={i}
            categoryConfig={config}
          />
        ))}
      </div>
    </section>
  );
}

/* ─── Architecture Diagram ──────────────────────────────── */

function ArchitectureSection() {
  return (
    <DeferredSection minHeight={500}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <CenteredHeader
            label="Platform Architecture"
            title="Five layers of"
            emphasis="defense in depth"
            description="Every request traverses five independent security and compliance verification layers. No single point of failure. No bypass path."
          />

          <SectionChoreography
            pattern="cascade"
            stagger={0.08}
            className="relative"
          >
            <div className="absolute left-8 sm:left-12 top-0 bottom-0 w-px bg-gradient-to-b from-white/25 via-white/10 to-white/25" />

            <div className="space-y-4">
              {architectureLayers.map((layer, i) => {
                const LayerIcon = layer.icon;
                return (
                  <div key={layer.label} className="relative pl-20 sm:pl-28">
                    <div
                      className="absolute left-6 sm:left-10 top-6 w-4 h-4 rounded-full border-2 z-10"
                      style={{
                        borderColor: `rgba(${layer.accentRgb}, 0.6)`,
                        backgroundColor: `rgba(${layer.accentRgb}, 0.15)`,
                        boxShadow: `0 0 12px rgba(${layer.accentRgb}, 0.2)`,
                      }}
                    />

                    <div
                      className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6
                        hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                      style={{ marginLeft: `${i * 12}px` }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center"
                          style={{
                            borderColor: `rgba(${layer.accentRgb}, 0.2)`,
                            backgroundColor: `rgba(${layer.accentRgb}, 0.08)`,
                          }}
                        >
                          <LayerIcon
                            className="w-5 h-5"
                            style={{
                              color: `rgba(${layer.accentRgb}, 1)`,
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1.5">
                            <span
                              className="text-xs font-bold uppercase tracking-wider"
                              style={{
                                color: `rgba(${layer.accentRgb}, 0.7)`,
                              }}
                            >
                              Layer {i + 1}
                            </span>
                            <h3 className="text-base font-semibold text-white">
                              {layer.label}
                            </h3>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {layer.detail}
                          </p>
                        </div>
                      </div>

                      <div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: `radial-gradient(ellipse at 0% 50%, rgba(${layer.accentRgb}, 0.06), transparent 60%)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionChoreography>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Comparison Section ────────────────────────────────── */

function ComparisonSection() {
  return (
    <DeferredSection minHeight={420}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <EditorialHeader
            label="Built Different"
            title="Legacy compliance vs"
            emphasis="FormaOS"
            description="See the structural difference between managing compliance in spreadsheets and operating it as infrastructure."
            className="mb-12"
          />

          <div className="hidden sm:grid grid-cols-[1fr,auto,1fr] gap-4 mb-6 px-2">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider text-center">
              Legacy Approach
            </div>
            <div className="w-px" />
            <div className="text-sm font-semibold text-slate-300 uppercase tracking-wider text-center">
              FormaOS
            </div>
          </div>

          <SectionChoreography pattern="cascade" stagger={0.06}>
            <div className="space-y-3">
              {comparisonItems.map((item, i) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={i}
                    className="group grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-3 sm:gap-4 items-center
                      rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5
                      hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-red-500/10 border border-red-400/20 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-400/70" />
                      </div>
                      <span className="text-sm text-slate-400 line-through decoration-slate-600">
                        {item.legacy}
                      </span>
                    </div>

                    <div className="hidden sm:flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center">
                        <ItemIcon className="w-4 h-4 text-slate-300" />
                      </div>
                      <span className="text-sm text-white font-medium">
                        {item.formaos}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionChoreography>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Stats Bar ─────────────────────────────────────────── */

function StatsSection() {
  return (
    <DeferredSection minHeight={200}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-10">
            <ScrollReveal
              variant="fadeUp"
              range={[0, 0.3]}
              className="text-center mb-10"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                The platform at a glance
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Numbers that reflect the depth and breadth of FormaOS as a
                compliance operating system.
              </p>
            </ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {platformStats.map((stat, i) => (
                <AnimatedStat
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                  suffix={stat.suffix}
                  delay={i * 0.08}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Feature Catalog Index ──────────────────────────────
   Audit row #28 (LOW): /features advertises "25 features across 5
   categories" but the detailed feature grid lives behind a
   DeferredSection IntersectionObserver, so the individual feature
   names never reach the initial SSR HTML. Crawlers and skim-readers
   see only the category counts. This index renders the same data
   server-side first paint, grouped by category, using native
   <details> so a sighted user can collapse what they don't need
   while keeping every feature title in the DOM for SEO. */

function FeatureCatalogIndex() {
  return (
    <section className="mk-section relative">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 lg:p-7">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-white">
              Feature catalog —{' '}
              <span className="text-slate-400">
                {features.length} features across {categories.length} categories
              </span>
            </h2>
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Skim · click a category to expand
            </span>
          </div>
          <div className="space-y-2.5">
            {categories.map((cat) => {
              const meta = categoryMeta[cat];
              const items = features.filter((f) => f.category === cat);
              return (
                <details
                  key={cat}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.015] open:bg-white/[0.025]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-slate-300 transition hover:text-white">
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`}
                        aria-hidden="true"
                      />
                      <span className="font-medium">{cat}</span>
                      <span className="text-xs text-slate-500">
                        · {items.length} features
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-slate-500 transition group-open:rotate-90"
                    >
                      ›
                    </span>
                  </summary>
                  <ul className="border-t border-white/[0.04] px-4 py-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((f) => (
                      <li
                        key={f.title}
                        className="text-[13px] leading-snug text-slate-400"
                      >
                        {f.title}
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Framework Coverage Grid ───────────────────────────── */

const frameworks = [
  {
    name: 'ISO 27001',
    controls: '114',
    status: 'Full Coverage',
    description:
      'Information security management system with Annex A controls.',
    badge: 'Popular',
  },
  {
    name: 'SOC 2',
    controls: '64',
    status: 'Full Coverage',
    description:
      'Trust Services Criteria across security, availability, and processing integrity.',
    badge: 'Popular',
  },
  {
    name: 'GDPR',
    controls: '45',
    status: 'Full Coverage',
    description:
      'EU General Data Protection Regulation compliance with Article mapping.',
  },
  {
    name: 'HIPAA',
    controls: '72',
    status: 'Full Coverage',
    description:
      'Healthcare data protection with Administrative, Physical, and Technical safeguards.',
  },
  {
    name: 'PCI-DSS',
    controls: '78',
    status: 'Full Coverage',
    description:
      'Payment card industry data security standard for cardholder data protection.',
  },
  {
    name: 'NIST CSF',
    controls: '108',
    status: 'Full Coverage',
    description:
      'Cybersecurity framework covering Identify, Protect, Detect, Respond, Recover.',
  },
  {
    name: 'CIS Controls',
    controls: '153',
    status: 'Full Coverage',
    description:
      'Center for Internet Security prioritized security best practices.',
  },
];

function FrameworkCoverageSection() {
  return (
    <DeferredSection minHeight={500}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <CenteredHeader
            label="Framework Packs"
            title="Pre-built compliance"
            emphasis="framework libraries"
            description="Each framework ships with mapped controls, evidence templates, and cross-framework overlap detection. Activate in one click."
          />

          <SectionChoreography
            pattern="stagger-wave"
            stagger={0.05}
            className="space-y-3"
          >
            {frameworks.map((fw) => (
              <div
                key={fw.name}
                className="group grid grid-cols-1 sm:grid-cols-[1fr,auto,auto] gap-3 sm:gap-6 items-center
                  rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6
                  hover:bg-white/[0.04] hover:border-white/15 transition-all duration-300
                  hover:shadow-[0_0_30px_rgba(255,255,255,0.04)]"
              >
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl border border-white/10 bg-white/[0.06] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-slate-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        {fw.name}
                      </h3>
                      {fw.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.06] text-slate-300">
                          {fw.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {fw.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Controls:</span>
                  <span className="text-white font-semibold">
                    {fw.controls}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-300" />
                  <span className="text-sm text-slate-300 font-medium">
                    {fw.status}
                  </span>
                </div>
              </div>
            ))}
          </SectionChoreography>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Capability Deep-Dive Tabs ─────────────────────────── */

const capabilityTabs = [
  {
    id: 'evidence',
    label: 'Evidence Management',
    icon: FileCheck,
    accent: 'slate',
    accentRgb: '203,213,225',
    heading: 'Tamper-evident evidence at every step',
    description:
      'From upload to audit export, every piece of compliance evidence is versioned, hashed, and tracked with full chain-of-custody.',
    details: [
      {
        label: 'Upload & Hash',
        text: 'SHA-256 checksum generated at upload. Every subsequent access is verified against the original hash.',
      },
      {
        label: 'Version Control',
        text: 'Full version history with diff comparison. See exactly what changed between evidence revisions.',
      },
      {
        label: 'Chain of Custody',
        text: 'Immutable record of who uploaded, reviewed, approved, and exported each evidence artifact.',
      },
      {
        label: 'Audit Export',
        text: 'One-click export of framework-mapped evidence bundles in auditor-ready format with verification metadata.',
      },
      {
        label: 'Expiry Tracking',
        text: 'Automated alerts when evidence approaches expiration dates. Schedule re-collection workflows automatically.',
      },
      {
        label: 'Bulk Operations',
        text: 'Upload, tag, assign, and organize evidence in bulk across multiple frameworks and controls.',
      },
    ],
  },
  {
    id: 'automation',
    label: 'Automation Engine',
    icon: Workflow,
    accent: 'slate',
    accentRgb: '148,163,184',
    heading: 'Compliance workflows that run themselves',
    description:
      'Configure event-driven automation rules that create tasks, send notifications, and escalate issues without manual intervention.',
    details: [
      {
        label: 'Event Triggers',
        text: '12+ trigger types: control status change, evidence expiry, score threshold, credential renewal, and more.',
      },
      {
        label: 'Conditional Logic',
        text: 'Branch automation paths based on entity state, assignee, framework, severity, and custom attributes.',
      },
      {
        label: 'Action Library',
        text: 'Task creation, stakeholder notifications, Slack/Teams alerts, email digests, and escalation chains.',
      },
      {
        label: 'Scheduling',
        text: 'Cron-based scheduling for periodic evidence collection, compliance checks, and report generation.',
      },
      {
        label: 'Audit Trail',
        text: 'Every automation execution is logged with trigger context, actions taken, and outcomes recorded.',
      },
      {
        label: 'Templates',
        text: 'Pre-built automation templates for common compliance workflows. Clone and customize in minutes.',
      },
    ],
  },
  {
    id: 'identity',
    label: 'Identity & Access',
    icon: Fingerprint,
    accent: 'zinc',
    accentRgb: '161,161,170',
    heading: 'Enterprise identity governance built in',
    description:
      'SAML 2.0 SSO, role-based access control, and deployment planning for organizations that require centralized identity management.',
    details: [
      {
        label: 'SAML 2.0 SSO',
        text: 'Single sign-on with Okta, Azure AD, Google Workspace, and any SAML 2.0-compliant identity provider.',
      },
      {
        label: 'Identity Lifecycle',
        text: 'Provisioning, role-change, and deprovisioning requirements are reviewed during deployment so access controls match your identity model.',
      },
      {
        label: 'JIT Provisioning',
        text: 'Just-In-Time user creation on first login. Users get correct roles and permissions automatically.',
      },
      {
        label: 'RBAC',
        text: 'Granular role-based access control with per-framework, per-entity permissions and custom role definitions.',
      },
      {
        label: 'Session Management',
        text: 'Configurable session timeouts, concurrent session limits, and forced re-authentication policies.',
      },
      {
        label: 'Access Reviews',
        text: 'Periodic access certification campaigns to verify users retain only the permissions they need.',
      },
    ],
  },
  {
    id: 'scoring',
    label: 'Scoring & Analytics',
    icon: TrendingUp,
    accent: 'zinc',
    accentRgb: '113,113,122',
    heading: 'Continuous compliance intelligence',
    description:
      'Real-time posture scoring, trend analysis, and risk visualization that gives leadership actionable compliance insights.',
    details: [
      {
        label: 'Posture Score',
        text: 'Real-time aggregate compliance score calculated across all active frameworks with weighted scoring.',
      },
      {
        label: 'Trend Analysis',
        text: 'Historical score tracking with improvement trajectories and regression detection over configurable periods.',
      },
      {
        label: 'Risk Heatmap',
        text: 'Visual overlay showing risk concentrations by framework, category, and control with drill-down capability.',
      },
      {
        label: 'Board Reports',
        text: 'One-click compliance reports formatted for board presentation with executive summary and trend charts.',
      },
      {
        label: 'Threshold Alerts',
        text: 'Automated notifications when scores drop below configurable thresholds by framework or category.',
      },
      {
        label: 'Peer Benchmarks',
        text: 'Anonymous benchmarking against organizations of similar size and industry for compliance maturity comparison.',
      },
    ],
  },
];

function CapabilityDeepDive() {
  const [activeTab, setActiveTab] = useState(0);
  const tab = capabilityTabs[activeTab];
  const TabIcon = tab.icon;

  return (
    <DeferredSection minHeight={420}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <EditorialHeader
            label="Deep Dive"
            title="Explore core"
            emphasis="capabilities"
            description="Four pillars of the FormaOS platform, each engineered for depth, auditability, and operational control."
            className="mb-12"
          />

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {capabilityTabs.map((t, i) => {
              const TIcon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border
                    ${
                      activeTab === i
                        ? `bg-white/[0.08] border-white/[0.15] text-white shadow-[0_0_24px_rgba(${t.accentRgb},0.12)]`
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                >
                  <TIcon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 lg:p-10"
            >
              <div className="flex items-start gap-4 mb-8">
                <div
                  className="shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center"
                  style={{
                    borderColor: `rgba(${tab.accentRgb}, 0.2)`,
                    backgroundColor: `rgba(${tab.accentRgb}, 0.08)`,
                  }}
                >
                  <TabIcon
                    className="w-6 h-6"
                    style={{ color: `rgba(${tab.accentRgb}, 1)` }}
                  />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {tab.heading}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                    {tab.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tab.details.map((detail, di) => (
                  <motion.div
                    key={detail.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: di * 0.06,
                      duration: 0.4,
                      ease: EASE_OUT_EXPO,
                    }}
                    className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4
                      hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2
                        className="w-3.5 h-3.5"
                        style={{
                          color: `rgba(${tab.accentRgb}, 0.8)`,
                        }}
                      />
                      <h4 className="text-sm font-semibold text-white">
                        {detail.label}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {detail.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Platform Workflow Visual ───────────────────────────── */

const workflowSteps = [
  {
    step: '01',
    title: 'Activate Frameworks',
    description:
      'Select your applicable compliance frameworks. Controls, evidence requirements, and scoring weights are pre-configured.',
    accentRgb: '203,213,225',
    icon: Layers,
  },
  {
    step: '02',
    title: 'Assign Control Owners',
    description:
      'Every control gets a named owner with clear responsibility, review cadence, and escalation path.',
    accentRgb: '113,113,122',
    icon: Users,
  },
  {
    step: '03',
    title: 'Collect & Verify Evidence',
    description:
      'Upload evidence with SHA-256 verification, automated expiry tracking, and cross-framework mapping.',
    accentRgb: '113,113,122',
    icon: FileCheck,
  },
  {
    step: '04',
    title: 'Automate Workflows',
    description:
      'Configure triggers for task creation, notifications, and escalations. Compliance runs on autopilot.',
    accentRgb: '161,161,170',
    icon: Workflow,
  },
  {
    step: '05',
    title: 'Monitor & Score',
    description:
      'Continuous posture scoring with daily checks, drift detection, and real-time risk heatmap visualization.',
    accentRgb: '148,163,184',
    icon: BarChart3,
  },
  {
    step: '06',
    title: 'Export Audit Packets',
    description:
      'Export framework-mapped evidence bundles with verification metadata and reviewer-ready context.',
    accentRgb: '203,213,225',
    icon: ExternalLink,
  },
];

function PlatformWorkflowSection() {
  return (
    <DeferredSection minHeight={500}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <CenteredHeader
            label="How It Works"
            title="From activation to"
            emphasis="audit-ready"
            description="Six steps to transform compliance from manual overhead into a continuously operating system with verifiable evidence."
          />

          <SectionChoreography pattern="cascade" stagger={0.08}>
            <div className="relative">
              <div className="absolute left-[2.75rem] sm:left-1/2 sm:-translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-white/25 via-white/10 to-white/25" />

              <div className="space-y-6">
                {workflowSteps.map((step, i) => {
                  const StepIcon = step.icon;
                  const isEven = i % 2 === 0;
                  return (
                    <div
                      key={step.step}
                      className={`relative flex items-start gap-6 ${
                        isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'
                      }`}
                    >
                      <div
                        className="absolute left-[2.75rem] sm:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 z-10"
                        style={{
                          borderColor: `rgba(${step.accentRgb}, 0.6)`,
                          backgroundColor: `rgba(${step.accentRgb}, 0.15)`,
                          boxShadow: `0 0 14px rgba(${step.accentRgb}, 0.2)`,
                        }}
                      />

                      <div
                        className={`ml-20 sm:ml-0 sm:w-[calc(50%-2rem)] ${
                          isEven ? '' : 'sm:ml-auto'
                        }`}
                      >
                        <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300">
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className="shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center"
                              style={{
                                borderColor: `rgba(${step.accentRgb}, 0.2)`,
                                backgroundColor: `rgba(${step.accentRgb}, 0.08)`,
                              }}
                            >
                              <StepIcon
                                className="w-5 h-5"
                                style={{
                                  color: `rgba(${step.accentRgb}, 1)`,
                                }}
                              />
                            </div>
                            <div>
                              <span
                                className="text-xs font-bold uppercase tracking-wider"
                                style={{
                                  color: `rgba(${step.accentRgb}, 0.6)`,
                                }}
                              >
                                Step {step.step}
                              </span>
                              <h3 className="text-base font-semibold text-white mt-0.5">
                                {step.title}
                              </h3>
                            </div>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionChoreography>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Enterprise CTA ────────────────────────────────────── */

function EnterpriseCTA() {
  return (
    <DeferredSection minHeight={350}>
      <section className="mk-section relative isolate overflow-hidden">
        <SectionMedia
          src="/marketing-media/product.jpg"
          objectPosition="50% 40%"
          opacity={0.6}
          scrim="center"
        />
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="relative rounded-3xl border border-white/[0.06] bg-slate-950/60 overflow-hidden">
            <div className="relative p-8 sm:p-12 lg:p-16 text-center">
              <ScrollReveal variant="depthScale" range={[0, 0.3]}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Compliance Plan
                </p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Ready to operate compliance{' '}
                  <span className="text-slate-400">
                    as infrastructure?
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10">
                  See how FormaOS replaces spreadsheet-based compliance with a
                  structured operating system built for regulated teams.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={compliancePlanHref('features_final')}
                    className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      bg-foreground
                      text-background font-semibold text-sm
                      shadow-lg
                      hover:shadow-xl
                      transition-all duration-300"
                  >
                    {PUBLIC_CTA_LABELS.compliancePlan}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/enterprise"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      border border-white/[0.12] bg-white/[0.04]
                      text-white font-semibold text-sm
                      hover:bg-white/[0.08] hover:border-white/[0.2]
                      transition-all duration-300"
                  >
                    Enterprise Options
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-slate-500">
                  {[
                    'SOC 2-aligned workflows',
                    'Privacy review support',
                    'Enterprise review support',
                    'Assessment-led onboarding',
                  ].map((signal) => (
                    <div key={signal} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-slate-400/60" />
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Hero ──────────────────────────────────────────────── */

function FeaturesHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 60]);

  return (
    <section
      ref={heroRef}
      className="relative isolate min-h-[90vh] flex items-center justify-center overflow-hidden"
    >
      <SectionMedia
        src="/marketing-media/features.jpg"
        objectPosition="50% 35%"
        opacity={0.85}
        scrim="center"
      />
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8 py-32 sm:py-40 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="mb-8 flex items-center justify-center gap-4"
        >
          <span className="hidden h-px w-10 bg-white/20 sm:block" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:text-xs">
            Platform Features
          </span>
          <span className="hidden h-px w-10 bg-white/20 sm:block" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6"
        >
          Compliance infrastructure
          <br />
          <span className="text-slate-400">
            engineered for accountability
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          25 features across compliance, workflow, identity, collaboration,
          and AI — built for regulated teams that need provable control over
          every obligation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link
            href={compliancePlanHref('features_secondary_final')}
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
              bg-foreground
              text-background font-semibold text-sm
              shadow-lg
              hover:shadow-xl
              transition-all duration-300"
          >
            {PUBLIC_CTA_LABELS.compliancePlan}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={salesHref('features_secondary_final')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
              border border-white/[0.12] bg-white/[0.04]
              text-white font-semibold text-sm
              hover:bg-white/[0.08] hover:border-white/[0.2]
              transition-all duration-300"
          >
            {PUBLIC_CTA_LABELS.talkToSales}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE_OUT_EXPO }}
          className="flex flex-wrap justify-center gap-3"
        >
          {categories.map((cat) => {
            const meta = categoryMeta[cat];
            const count = features.filter((f) => f.category === cat).length;
            return (
              <div
                key={cat}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-400"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`} />
                {cat}
                <span className="text-slate-600">{count}</span>
              </div>
            );
          })}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-canvas-900 to-transparent pointer-events-none" />
    </section>
  );
}

/* ─── Main Component ────────────────────────────────────── */

export default function FeaturesPageContent() {
  const [activeCategory, setActiveCategory] = useState<CategoryName | null>(
    null,
  );

  const filteredCategories = useMemo(() => {
    if (activeCategory) return [activeCategory];
    return [...categories];
  }, [activeCategory]);

  return (
    <MarketingPageShell>
      <FeaturesHero />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <StatsSection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/*
        Server-rendered feature catalog (audit #28). Lives outside
        DeferredSection so every feature title is in the initial SSR
        HTML — crawlers index the names, sighted users get a quick
        skimmable list before the heavy interactive grid mounts.
      */}
      <FeatureCatalogIndex />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Feature Grid */}
      <DeferredSection minHeight={560}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-6"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Every feature, built for{' '}
                <span className="text-slate-400">
                  regulated teams
                </span>
              </h2>
              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
                25 platform features across five categories — each designed to
                close the gap between compliance obligations and operational
                execution.
              </p>
            </ScrollReveal>

            <CategoryNav
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory ?? 'all'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              >
                {filteredCategories.map((cat) => (
                  <CategorySection
                    key={cat}
                    category={cat}
                    categoryFeatures={features.filter(
                      (f) => f.category === cat,
                    )}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <FrameworkCoverageSection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <CapabilityDeepDive />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <ArchitectureSection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <PlatformWorkflowSection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <ComparisonSection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <EnterpriseCTA />
    </MarketingPageShell>
  );
}

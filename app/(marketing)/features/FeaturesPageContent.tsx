'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useInView,
  useReducedMotion,
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
  Eye,
  Database,
  Server,
  Key,
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
  demoHref,
  PUBLIC_CTA_LABELS,
} from '@/lib/marketing/cta';
import {
  AUTOMATED_EVALUATOR_COUNT,
  CLAIM_PHRASES,
  DISTINCT_FRAMEWORK_NAMES,
  EVALUATOR_COUNT,
  FRAMEWORK_CONTROL_COUNT,
  FRAMEWORK_PACK_COUNT,
  FRAMEWORK_PACKS,
  getPackClaim,
  getPackShortName,
  MANUAL_ATTESTATION_COUNT,
} from '@/lib/marketing/claims';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';

const stickyPlanHref = compliancePlanHref('features_sticky');

/** Mobile-only thumb-reachable primary CTA (shown below md, post-hero). */
function MobileStickyPlanCta() {
  const reduce = useReducedMotion();
  const { trackCtaClick } = useMarketingTelemetry();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={reduce ? false : { y: '110%' }}
          animate={{ y: 0 }}
          exit={reduce ? undefined : { y: '110%' }}
          transition={{ duration: reduce ? 0 : 0.3, ease: EASE_OUT_EXPO }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-marketing-bg px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 md:hidden"
        >
          <Link
            href={stickyPlanHref}
            onClick={() =>
              trackCtaClick({
                surface: 'features',
                section: 'sticky_cta',
                location: 'mobile_sticky',
                ctaLabel: PUBLIC_CTA_LABELS.compliancePlan,
                ctaHref: stickyPlanHref,
                variant: 'primary',
              })
            }
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-[15px] font-semibold text-zinc-900 transition active:bg-zinc-100"
          >
            {PUBLIC_CTA_LABELS.compliancePlan}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ─── Easing ────────────────────────────────────────────── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─── Section Headers ─────────────────────────────────────────
   Two treatments, centred and left-bar, neither carrying a label
   above the headline. The headline states the claim on its own.
   ──────────────────────────────────────────────────────────── */

function CenteredHeader({
  title,
  emphasis,
  description,
  className = 'mb-14',
}: {
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
      <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title} <span className="text-zinc-400">{emphasis}</span>
      </h2>
      <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">
        {description}
      </p>
    </ScrollReveal>
  );
}

function BarHeader({
  title,
  emphasis,
  description,
  className = 'mb-14',
}: {
  title: string;
  emphasis: string;
  description: string;
  className?: string;
}) {
  return (
    <ScrollReveal
      variant="slideUp"
      range={[0, 0.3]}
      className={`flex items-start gap-5 ${className}`}
    >
      <span className="mt-1.5 hidden h-14 w-px flex-shrink-0 bg-gradient-to-b from-white/35 to-transparent sm:block" />
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title} <span className="text-zinc-400">{emphasis}</span>
        </h2>
        <p className="mt-4 text-base leading-7 text-zinc-400">{description}</p>
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

/* SOC 2 numbers come from the pack itself. When a pack is missing the copy
   drops the number rather than printing a stale one. */
const soc2Tsc = getPackClaim('soc2-tsc');

const soc2Summary = soc2Tsc
  ? `${soc2Tsc.controlCount} SOC 2 Trust Services Criteria controls mapped, ${soc2Tsc.automatedEvaluatorCount} of them evaluated automatically against your live data`
  : 'SOC 2 Trust Services Criteria controls mapped, with automatic evaluation wherever a live signal exists';

const soc2Capabilities = soc2Tsc
  ? [
      `${soc2Tsc.controlCount} SOC 2 TSC controls mapped`,
      `${soc2Tsc.automatedEvaluatorCount} auto-evaluated against live data`,
    ]
  : ['SOC 2 TSC controls mapped', 'Auto-evaluated against live data'];

const features: PlatformFeature[] = [
  {
    icon: Layers,
    title: `${FRAMEWORK_PACK_COUNT} Pre-Built Framework Packs`,
    description: `${CLAIM_PHRASES.frameworks} across ${FRAMEWORK_PACK_COUNT} installable packs: ${DISTINCT_FRAMEWORK_NAMES.join(', ')}. Every evaluator is registered in code, so a security reviewer can check the coverage instead of taking our word for it.`,
    longDescription: `Each framework pack ships with pre-mapped controls, evidence templates, and an evaluator implementation. ${CLAIM_PHRASES.coverageSentence} Controls are mapped across frameworks, so evidence collected for ISO 27001 cascades credit to overlapping SOC 2 and HIPAA requirements.`,
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
      'Compliance Gates are configurable enforcement points that prevent progress when prerequisites are unmet. Unlike advisory warnings, gates are structural. They block deployment, approval, and sign-off workflows until evidence is verified and controls are resolved. Gates integrate with your CI/CD pipeline, approval workflows, and audit preparation processes.',
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
      'The scoring engine continuously evaluates your compliance posture across all active frameworks. Scores are broken down by framework, category, and individual control, with drill-down from aggregate score to specific failing checks. Historical trending shows improvement trajectories, and automated alerts fire when scores drop below configurable thresholds.',
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
      'The Evidence Vault provides immutable, versioned storage for all compliance artifacts. Every file receives a SHA-256 hash at upload, with cryptographic verification at every access point. Chain-of-custody tracking records who uploaded, reviewed, approved, and exported each piece of evidence, creating a tamper-evident audit trail that satisfies the most rigorous regulatory requirements.',
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
      'Perform mass operations across your compliance program without tedious one-by-one updates. Bulk assign controls to owners, update evidence status across frameworks, provision users with role templates, and archive completed audit cycles, all with full audit trail preservation and rollback capability.',
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
      'All data is hosted in Australia by default with infrastructure ready for US and EU data residency as regulatory requirements expand. Data residency controls ensure that compliance evidence, audit trails, and user data remain within jurisdictional boundaries, critical for organizations subject to data sovereignty requirements under GDPR, Privacy Act 1988, and sector-specific regulations.',
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
      'Every action logged with full context: who, what, when, and why. Append-only, tamper-evident records.',
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
      'A centralized notification hub that aggregates alerts across your compliance program. Configure notification preferences by type, urgency, and channel, with support for in-app, email, Slack, and Microsoft Teams delivery. Smart batching prevents notification fatigue while ensuring critical alerts receive immediate attention.',
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
      'The Command Palette provides instant access to any entity in your compliance program. Type to search controls, tasks, evidence, incidents, users, and settings, with fuzzy matching and recent history. Keyboard shortcuts for common actions let power users navigate the entire platform without touching a mouse.',
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
      'See who is working on what with live presence indicators on controls, evidence, and tasks. Changes sync in real-time across all connected sessions, no refresh required. Conflict resolution ensures simultaneous edits merge gracefully, with visual indicators showing when a control or evidence item is being edited by a teammate.',
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
      'General-purpose AI Q&A for compliance questions, policy drafting, and prompt-template workflows. Surface-level org context only, not grounded in your live policies, evidence, or controls.',
    longDescription:
      'A stateless AI Q&A wrapper trained for compliance vocabulary. Useful for "how is GDPR Article 32 typically implemented?" or "draft a vendor risk policy starter", not for "what does my current control evidence show?" Surface-level org context (industry, team size) is passed in; live policies, controls, and evidence are NOT used as grounding. Real retrieval-augmented chat against your evidence vault is on the roadmap but not shipping today.',
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
    description: `${soc2Summary}, milestone tracking through audit readiness, and a downloadable report.`,
    longDescription: `SOC 2 Type II readiness across the Trust Services Criteria (CC, A, C, PI, P). ${
      soc2Tsc
        ? `${soc2Tsc.automatedEvaluatorCount} controls auto-evaluate against your live data (MFA coverage, audit-log freshness, policy cadence, and similar signals); the remaining ${soc2Tsc.manualAttestationCount} are tracked as human attestations.`
        : 'Controls auto-evaluate against your live data wherever a signal exists; the rest are tracked as human attestations.'
    } A milestone tracker in the app guides you from framework enablement through evidence collection to a readiness report. Score weights are not fixed marketing percentages. They reflect the actual count of passing and failing evaluators in each TSC category.`,
    category: 'AI & Certification',
    highlight: 'Shipping',
    capabilities: [
      ...soc2Capabilities,
      'Milestone tracker for readiness',
      'Downloadable readiness report',
    ],
  },
  {
    icon: Network,
    title: 'Framework Cross-Mapping',
    description:
      'Map controls across frameworks with strength scoring. 40+ cross-mappings ship pre-loaded between ISO 27001, SOC 2, HIPAA, and NIST CSF.',
    longDescription:
      'Framework Cross-Mapping manages the relationships between controls across compliance frameworks. Each mapping carries a strength label (exact, partial, or related) so teams can judge overlap quality. 40+ cross-mappings ship pre-loaded across ISO 27001, SOC 2, HIPAA, and NIST CSF, and the engine walks both forward and reverse relationships so a satisfied control on one framework can cascade credit to its mapped peers on others.',
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

/* Exported so the route metadata quotes the catalog rather than a copy of it. */
export const FEATURE_COUNT = features.length;

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
  icon: LucideIcon;
  dotColor: string;
}

const categoryMeta: Record<CategoryName, CategoryConfig> = {
  'Compliance Core': {
    description:
      'Framework coverage, control enforcement, evidence management, and posture scoring: the operational backbone of your compliance programme.',
    icon: Shield,
    dotColor: 'bg-zinc-300',
  },
  'Workflow & Operations': {
    description:
      'Automation, incident management, bulk operations, and care delivery workflows that remove manual compliance overhead.',
    icon: Workflow,
    dotColor: 'bg-zinc-400',
  },
  'Identity & Security': {
    description:
      'Enterprise identity governance, data residency, immutable audit trails, and risk visualisation for regulated environments.',
    icon: Lock,
    dotColor: 'bg-zinc-400',
  },
  'Collaboration & UX': {
    description:
      'Real-time collaboration, intelligent search, contextual help, and keyboard-first workflows for compliance teams.',
    icon: MessageSquare,
    dotColor: 'bg-zinc-500',
  },
  'AI & Certification': {
    description:
      'Compliance intelligence and self-certification engines that shorten the path to audit readiness.',
    icon: Bot,
    dotColor: 'bg-zinc-300',
  },
};

/* ─── Architecture Layers ───────────────────────────────── */

const architectureLayers = [
  {
    label: 'Frontend Gating',
    detail:
      'React compliance gates with real-time validation. Controls render-blocked UI when prerequisites are unmet.',
    icon: Monitor,
  },
  {
    label: 'API Guards',
    detail:
      'Server-side middleware enforcing permission checks, rate limiting, and compliance state validation on every request.',
    icon: Server,
  },
  {
    label: 'Business Logic',
    detail:
      'Workflow engine processing automation rules, scoring calculations, and cross-framework evidence mapping.',
    icon: GitBranch,
  },
  {
    label: 'Database RLS',
    detail:
      'Row-Level Security policies ensure tenant isolation at the database layer. Every query is scoped by organization.',
    icon: Database,
  },
  {
    label: 'Environment Isolation',
    detail:
      'Infrastructure-level tenant isolation with dedicated encryption keys and configurable data residency.',
    icon: Key,
  },
];

/* ─── Stats ─────────────────────────────────────────────── */

/* Every tile is a count the reader can check: the last two sum to the
   evaluator total, which is why they are labelled separately from controls. */
const platformStats = [
  { value: String(features.length), label: 'Platform features', suffix: '' },
  { value: String(FRAMEWORK_PACK_COUNT), label: 'Framework packs', suffix: '' },
  {
    value: String(FRAMEWORK_CONTROL_COUNT),
    label: 'Mapped controls',
    suffix: '',
  },
  { value: String(EVALUATOR_COUNT), label: 'Control evaluators', suffix: '' },
  {
    value: String(AUTOMATED_EVALUATOR_COUNT),
    label: 'Checked automatically',
    suffix: '',
  },
  {
    value: String(MANUAL_ATTESTATION_COUNT),
    label: 'Tracked as attestations',
    suffix: '',
  },
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
        <span className="text-zinc-400">{suffix}</span>
      </div>
      <div className="text-xs sm:text-sm text-zinc-400 font-medium">
        {label}
      </div>
    </motion.div>
  );
}

/* ─── Architecture Diagram ──────────────────────────────── */

function ArchitectureSection() {
  return (
    <DeferredSection minHeight={500}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <CenteredHeader
            title="Five layers of"
            emphasis="defence in depth"
            description="Every request traverses five independent security and compliance verification layers. No single point of failure. No bypass path."
          />

          <SectionChoreography
            pattern="cascade"
            stagger={0.08}
            className="relative"
          >
            {/* The rule carries the order; the layers are not numbered. */}
            <div className="absolute left-8 sm:left-12 top-0 bottom-0 w-px bg-gradient-to-b from-white/25 via-white/10 to-white/25" />

            <div className="space-y-4">
              {architectureLayers.map((layer, i) => {
                const LayerIcon = layer.icon;
                return (
                  <div key={layer.label} className="relative pl-20 sm:pl-28">
                    <div className="absolute left-6 sm:left-10 top-6 z-10 h-4 w-4 rounded-full border-2 border-white/40 bg-white/10" />

                    <div
                      className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6
                        hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                      style={{ marginLeft: `${i * 12}px` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                          <LayerIcon className="h-5 w-5 text-zinc-300" />
                        </div>
                        <div>
                          <h3 className="mb-1.5 text-base font-semibold text-white">
                            {layer.label}
                          </h3>
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            {layer.detail}
                          </p>
                        </div>
                      </div>
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
              <p className="text-sm text-zinc-400 max-w-lg mx-auto">
                Every number here is generated from the shipping code, so it
                stays true as the packs change.
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
              Feature catalog{' '}
              <span className="text-zinc-400">
                · {features.length} features across {categories.length}{' '}
                categories
              </span>
            </h2>
            <span className="text-xs text-zinc-500">
              Click a category to expand
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
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-zinc-300 transition hover:text-white">
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`}
                        aria-hidden="true"
                      />
                      <span className="font-medium">{cat}</span>
                      <span className="text-xs text-zinc-500">
                        · {items.length} features
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-zinc-500 transition group-open:rotate-90"
                    >
                      ›
                    </span>
                  </summary>
                  <ul className="border-t border-white/[0.04] px-4 py-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((f) => (
                      <li
                        key={f.title}
                        className="text-[13px] leading-snug text-zinc-400"
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

/* Blurbs only. Names and counts come from the packs themselves, so this grid
   can never disagree with the total quoted above it. */
const packBlurbs: Record<string, string> = {
  'iso27001-2022':
    'Information security management with the full Annex A control set.',
  'soc2-tsc':
    'Trust Services Criteria across security, availability, confidentiality, processing integrity, and privacy.',
  soc2: 'A shorter SOC 2 starting point for teams beginning readiness work.',
  'financial-services-au':
    'Australian financial services obligations, including ASIC and AUSTRAC duties.',
  'cis-controls':
    'Prioritised security practices from the Center for Internet Security.',
  'nist-csf':
    'Govern, identify, protect, detect, respond, and recover, mapped control by control.',
  'mental-health-au':
    'National Standards for Mental Health Services, for Australian providers.',
  'pci-dss': 'Cardholder data protection for organisations that take payments.',
  gdpr: 'EU personal data obligations with article-level mapping.',
  hipaa:
    'Administrative, physical, and technical safeguards under the Security Rule.',
  ndis: 'NDIS Practice Standards core module, for registered Australian providers.',
};

const frameworks = FRAMEWORK_PACKS.map((pack) => ({
  slug: pack.slug,
  name: getPackShortName(pack.slug),
  controls: pack.controlCount,
  automated: pack.automatedEvaluatorCount,
  description: packBlurbs[pack.slug] ?? pack.name,
}));

function FrameworkCoverageSection() {
  return (
    <DeferredSection minHeight={500}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <BarHeader
            title="Pre-built compliance"
            emphasis="framework libraries"
            description={`${CLAIM_PHRASES.coverageSentence} Each pack ships with mapped controls, evidence templates, and cross-framework overlap detection.`}
          />

          <SectionChoreography
            pattern="stagger-wave"
            stagger={0.05}
            className="space-y-3"
          >
            {frameworks.map((fw) => (
              <div
                key={fw.slug}
                className="group grid grid-cols-1 sm:grid-cols-[1fr,auto,auto] gap-3 sm:gap-6 items-center
                  rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6
                  hover:bg-white/[0.04] hover:border-white/15 transition-all duration-300
                  hover:shadow-[0_0_30px_rgba(255,255,255,0.04)]"
              >
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl border border-white/10 bg-white/[0.06] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-zinc-200" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {fw.name}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {fw.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="text-zinc-500">Controls</span>
                  <span className="text-white font-semibold">
                    {fw.controls}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="text-zinc-500">Checked automatically</span>
                  <span className="text-white font-semibold">
                    {fw.automated}
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
          <div className="relative rounded-3xl border border-white/[0.06] bg-black/50 overflow-hidden">
            <div className="relative p-8 sm:p-12 lg:p-16 text-center">
              <ScrollReveal variant="depthScale" range={[0, 0.3]}>
                <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Ready to operate compliance{' '}
                  <span className="text-zinc-400">as infrastructure?</span>
                </h2>
                <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto mb-10">
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
                    href={demoHref('features_final')}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      border border-white/[0.12] bg-white/[0.04]
                      text-white font-semibold text-sm
                      hover:bg-white/[0.08] hover:border-white/[0.2]
                      transition-all duration-300"
                  >
                    {PUBLIC_CTA_LABELS.bookDemo}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <p className="mt-6 text-sm text-zinc-400">
                  Buying for a larger organisation?{' '}
                  <Link
                    href="/enterprise"
                    className="font-semibold text-white underline-offset-4 hover:underline"
                  >
                    See the enterprise evaluation path
                  </Link>
                  .
                </p>

                <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-zinc-500">
                  {[
                    'SOC 2-aligned workflows',
                    'Privacy review support',
                    'Enterprise review support',
                    'Assessment-led onboarding',
                  ].map((signal) => (
                    <div key={signal} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-zinc-400/60" />
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
      className="relative isolate flex min-h-[80vh] items-center justify-center overflow-hidden sm:min-h-[90vh]"
    >
      <SectionMedia
        src="/marketing-media/features.jpg"
        objectPosition="50% 35%"
        opacity={0.85}
        scrim="center"
      />
      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8 py-20 sm:py-40 text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6"
        >
          Compliance infrastructure
          <br />
          <span className="mk-accent">engineered</span> for accountability
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="text-base sm:text-lg lg:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {features.length} features across compliance, workflow, identity,
          collaboration, and AI, built for regulated teams that need provable
          control over every obligation.
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
            href={demoHref('features_hero')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
              border border-white/[0.12] bg-white/[0.04]
              text-white font-semibold text-sm
              hover:bg-white/[0.08] hover:border-white/[0.2]
              transition-all duration-300"
          >
            {PUBLIC_CTA_LABELS.bookDemo}
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-zinc-400"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`} />
                {cat}
                <span className="text-zinc-600">{count}</span>
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

/* ─── Feature System Map ───────────────────────────────────
   Reframes the 25 features as one connected operating loop rather than
   25 isolated cards. Each subsystem node is selectable; the panel shows
   that subsystem's real features + its place in the loop. */

/* The depth that used to sit in a separate four-tab deep-dive section. It is
   the same claim set, attached to the subsystem it belongs to, so the map is
   the one place the platform is explained. Subsystems without a depth list
   simply do not render one. */
const SUBSYSTEM_DEPTH: Partial<
  Record<CategoryName, { label: string; text: string }[]>
> = {
  'Compliance Core': [
    {
      label: 'Upload and hash',
      text: 'SHA-256 checksum generated at upload. Every later access is verified against the original hash.',
    },
    {
      label: 'Chain of custody',
      text: 'Immutable record of who uploaded, reviewed, approved, and exported each evidence artifact.',
    },
    {
      label: 'Audit export',
      text: 'Framework-mapped evidence bundles export in auditor-ready format with verification metadata.',
    },
    {
      label: 'Expiry tracking',
      text: 'Alerts fire as evidence approaches its expiry date, and re-collection work is scheduled automatically.',
    },
  ],
  'Workflow & Operations': [
    {
      label: 'Event triggers',
      text: 'Control status change, evidence expiry, score threshold and credential renewal all start work.',
    },
    {
      label: 'Conditional logic',
      text: 'Automation paths branch on entity state, assignee, framework, severity, and custom attributes.',
    },
    {
      label: 'Scheduling',
      text: 'Cron-based scheduling for periodic evidence collection, compliance checks, and reporting.',
    },
    {
      label: 'Execution trail',
      text: 'Every automation run is logged with its trigger context, the actions taken, and the outcome.',
    },
  ],
  'Identity & Security': [
    {
      label: 'SAML 2.0 SSO',
      text: 'Single sign-on with Okta, Azure AD, Google Workspace, and any SAML 2.0-compliant provider.',
    },
    {
      label: 'Just-in-time provisioning',
      text: 'Users are created on first login with the roles and permissions their group already implies.',
    },
    {
      label: 'Role-based access',
      text: 'Per-framework, per-entity permissions with custom role definitions.',
    },
    {
      label: 'Session policy',
      text: 'Configurable timeouts, concurrent session limits, and forced re-authentication.',
    },
  ],
  'AI & Certification': [
    {
      label: 'Posture score',
      text: 'Aggregate compliance score calculated across every active framework with weighted scoring.',
    },
    {
      label: 'Trend analysis',
      text: 'Historical score tracking with improvement trajectories and regression detection.',
    },
    {
      label: 'Threshold alerts',
      text: 'Notifications when a score drops below a configured threshold, by framework or category.',
    },
    {
      label: 'Board reporting',
      text: 'Compliance reports formatted for board presentation, generated from live data.',
    },
  ],
};

const SYSTEM_FLOW: Record<CategoryName, string> = {
  'Compliance Core': 'The spine: frameworks, controls, evidence, and posture.',
  'Workflow & Operations': 'Turns controls into owned, scheduled, audit-logged work.',
  'Identity & Security': 'Gates every action and seals the record.',
  'Collaboration & UX': 'Surfaces the work to the people who actually do it.',
  'AI & Certification': 'Augments the loop and proves it to auditors.',
};

function FeatureSystemMap() {
  const [active, setActive] = useState(0);
  const subsystems = categories.map((name) => ({
    name,
    meta: categoryMeta[name],
    items: features.filter((f) => f.category === name),
    role: SYSTEM_FLOW[name],
  }));
  const sel = subsystems[active];
  const SelIcon = sel.meta.icon;
  const depth = SUBSYSTEM_DEPTH[sel.name];
  const prevIdx = (active + subsystems.length - 1) % subsystems.length;
  const nextIdx = (active + 1) % subsystems.length;

  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_45%_at_50%_0%,rgba(255,255,255,0.03),transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {features.length} features, one operating loop.
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-400">
            Not {features.length} disconnected tools. Each subsystem feeds the
            next: obligations become controlled work, gated by identity,
            surfaced to your team, and proven to auditors. Select a node to
            trace it.
          </p>
        </div>

        {/* Subsystem loop */}
        <div
          role="tablist"
          aria-label="Subsystems"
          className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-stretch sm:justify-center sm:gap-0"
        >
          {subsystems.map((s, i) => {
            const Icon = s.meta.icon;
            const on = i === active;
            return (
              <Fragment key={s.name}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(i)}
                  className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors duration-200 sm:flex-col sm:items-center sm:gap-1.5 sm:text-center ${
                    on
                      ? 'border-white/30 bg-white/[0.06]'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16]'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                      on ? 'border-white/25 bg-white/[0.08]' : 'border-white/[0.08] bg-white/[0.04]'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${on ? 'text-white' : 'text-zinc-400'}`} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-[13px] font-semibold leading-tight ${
                        on ? 'text-white' : 'text-zinc-300'
                      }`}
                    >
                      {s.name}
                    </span>
                    <span className="text-[11px] text-zinc-500">{s.items.length} features</span>
                  </span>
                </button>
                {i < subsystems.length - 1 ? (
                  <span aria-hidden="true" className="hidden shrink-0 items-center px-1.5 text-zinc-600 sm:flex">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                ) : null}
              </Fragment>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs text-zinc-500">
          The loop closes: AI &amp; Certification feeds back into Compliance
          Core.
        </p>

        {/* Detail panel */}
        <motion.div
          key={sel.name}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
          className="mt-8 grid gap-x-10 gap-y-6 rounded-2xl border border-white/[0.1] bg-white/[0.02] p-7 lg:grid-cols-[0.9fr_1.1fr] lg:p-9"
        >
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05]">
                <SelIcon className="h-5 w-5 text-zinc-200" />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold tracking-tight text-white">
                  {sel.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  {sel.items.length} features
                </p>
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-7 text-white/90">{sel.role}</p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{sel.meta.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActive(prevIdx)}
                className="rounded-full border border-white/[0.1] bg-white/[0.02] px-3 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/[0.2] hover:text-white"
              >
                ← receives from {subsystems[prevIdx].name}
              </button>
              <button
                type="button"
                onClick={() => setActive(nextIdx)}
                className="rounded-full border border-white/[0.1] bg-white/[0.02] px-3 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/[0.2] hover:text-white"
              >
                feeds {subsystems[nextIdx].name} →
              </button>
            </div>
          </div>

          <div>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sel.items.map((f) => {
                const FIcon = f.icon;
                return (
                  <li
                    key={f.title}
                    className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
                  >
                    <FIcon
                      className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
                      aria-hidden="true"
                    />
                    <span className="text-[13px] leading-snug text-zinc-200">
                      {f.title}
                    </span>
                  </li>
                );
              })}
            </ul>

            {depth ? (
              <dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-white/[0.07] pt-5 sm:grid-cols-2">
                {depth.map((item) => (
                  <div key={item.label}>
                    <dt className="text-[13px] font-semibold text-white">
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-xs leading-5 text-zinc-400">
                      {item.text}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function FeaturesPageContent() {
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

      {/* The one interactive representation of the catalogue: every feature,
          its subsystem, and the depth behind it, in a single panel. */}
      <DeferredSection minHeight={620}>
        <FeatureSystemMap />
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Server-rendered so every feature title is in the initial HTML for
          crawlers and no-JS visitors. */}
      <FeatureCatalogIndex />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <FrameworkCoverageSection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <ArchitectureSection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <EnterpriseCTA />

      <MobileStickyPlanCta />
    </MarketingPageShell>
  );
}

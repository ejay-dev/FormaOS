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
  Settings,
  Monitor,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { brand } from '@/config/brand';

/* ─── Easing ────────────────────────────────────────────── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
    title: '7 Pre-Built Framework Packs',
    description:
      'ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS, NIST CSF, and CIS Controls — each with mapped controls, evidence requirements, and audit-ready reporting.',
    longDescription:
      'Each Framework Pack ships with pre-mapped controls, evidence templates, test procedures, and automated gap analysis. Controls are mapped cross-framework so evidence collected for ISO 27001 automatically satisfies overlapping SOC 2 requirements. Framework Packs receive quarterly updates as standards evolve, and custom framework support is available for regulated industries with unique requirements.',
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
      'Compliance Gates are configurable enforcement points that prevent progress when prerequisites are unmet. Unlike advisory warnings, gates are structural — they block deployment, approval, and sign-off workflows until evidence is verified and controls are resolved. Gates integrate with your CI/CD pipeline, approval workflows, and audit preparation processes.',
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
      'The scoring engine continuously evaluates your compliance posture across all active frameworks. Scores are broken down by framework, category, and individual control — with drill-down from aggregate score to specific failing checks. Historical trending shows improvement trajectories, and automated alerts fire when scores drop below configurable thresholds.',
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
      'The Evidence Vault provides immutable, versioned storage for all compliance artifacts. Every file receives a SHA-256 hash at upload, with cryptographic verification at every access point. Chain-of-custody tracking records who uploaded, reviewed, approved, and exported each piece of evidence — creating a tamper-evident audit trail that satisfies the most rigorous regulatory requirements.',
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
      'Perform mass operations across your compliance program without tedious one-by-one updates. Bulk assign controls to owners, update evidence status across frameworks, provision users with role templates, and archive completed audit cycles — all with full audit trail preservation and rollback capability.',
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
    title: 'SAML 2.0 SSO & SCIM Provisioning',
    description:
      'Enterprise identity governance with Okta, Azure AD, and Google Workspace. SCIM 2.0 for automated user lifecycle management.',
    longDescription:
      'Enterprise identity governance supporting SAML 2.0 single sign-on with Okta, Azure Active Directory, Google Workspace, and any SAML 2.0-compliant identity provider. SCIM 2.0 provisioning automates user lifecycle management — onboarding, role changes, team transfers, and offboarding — with real-time sync and JIT (Just-In-Time) provisioning.',
    category: 'Identity & Security',
    highlight: 'Enterprise',
    capabilities: [
      'SAML 2.0 with any IdP',
      'SCIM 2.0 auto-provisioning',
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
      'All data is hosted in Australia by default with infrastructure ready for US and EU data residency as regulatory requirements expand. Data residency controls ensure that compliance evidence, audit trails, and user data remain within jurisdictional boundaries — critical for organizations subject to data sovereignty requirements under GDPR, Privacy Act 1988, and sector-specific regulations.',
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
      'Every action logged with full context — who, what, when, and why. Append-only, tamper-evident records.',
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
      'A centralized notification hub that aggregates alerts across your compliance program. Configure notification preferences by type, urgency, and channel — with support for in-app, email, Slack, and Microsoft Teams delivery. Smart batching prevents notification fatigue while ensuring critical alerts receive immediate attention.',
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
      'The Command Palette provides instant access to any entity in your compliance program. Type to search controls, tasks, evidence, incidents, users, and settings — with fuzzy matching and recent history. Keyboard shortcuts for common actions let power users navigate the entire platform without touching a mouse.',
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
      'See who is working on what with live presence indicators on controls, evidence, and tasks. Changes sync in real-time across all connected sessions — no refresh required. Conflict resolution ensures simultaneous edits merge gracefully, with visual indicators showing when a control or evidence item is being edited by a teammate.',
    category: 'Collaboration & UX',
    capabilities: [
      'Live presence indicators',
      'Real-time sync across sessions',
      'Conflict resolution',
      'Simultaneous editing support',
    ],
  },
];

const categories = [
  'Compliance Core',
  'Workflow & Operations',
  'Identity & Security',
  'Collaboration & UX',
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
      'Framework coverage, control enforcement, evidence management, and posture scoring — the operational backbone of your compliance program.',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    accent: 'emerald',
    accentRgb: '52,211,153',
    icon: Shield,
    dotColor: 'bg-emerald-400',
    bgGlow: 'bg-emerald-500/[0.04]',
    borderHover: 'hover:border-emerald-400/20',
    iconBg: 'bg-emerald-500/10',
    iconBorder: 'border-emerald-400/20',
    textColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-400/20',
    badgeText: 'text-emerald-400',
  },
  'Workflow & Operations': {
    description:
      'Automation, incident management, bulk operations, and care delivery workflows that eliminate manual compliance overhead.',
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    accent: 'cyan',
    accentRgb: '34,211,238',
    icon: Workflow,
    dotColor: 'bg-cyan-400',
    bgGlow: 'bg-cyan-500/[0.04]',
    borderHover: 'hover:border-cyan-400/20',
    iconBg: 'bg-cyan-500/10',
    iconBorder: 'border-cyan-400/20',
    textColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-400/20',
    badgeText: 'text-cyan-400',
  },
  'Identity & Security': {
    description:
      'Enterprise identity governance, data residency, immutable audit trails, and risk visualization for regulated environments.',
    gradient: 'from-violet-500/20 via-violet-500/5 to-transparent',
    accent: 'violet',
    accentRgb: '139,92,246',
    icon: Lock,
    dotColor: 'bg-violet-400',
    bgGlow: 'bg-violet-500/[0.04]',
    borderHover: 'hover:border-violet-400/20',
    iconBg: 'bg-violet-500/10',
    iconBorder: 'border-violet-400/20',
    textColor: 'text-violet-400',
    badgeBg: 'bg-violet-500/10',
    badgeBorder: 'border-violet-400/20',
    badgeText: 'text-violet-400',
  },
  'Collaboration & UX': {
    description:
      'Real-time collaboration, intelligent search, contextual help, and keyboard-first workflows for compliance teams.',
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
    accent: 'blue',
    accentRgb: '59,130,246',
    icon: MessageSquare,
    dotColor: 'bg-blue-400',
    bgGlow: 'bg-blue-500/[0.04]',
    borderHover: 'hover:border-blue-400/20',
    iconBg: 'bg-blue-500/10',
    iconBorder: 'border-blue-400/20',
    textColor: 'text-blue-400',
    badgeBg: 'bg-blue-500/10',
    badgeBorder: 'border-blue-400/20',
    badgeText: 'text-blue-400',
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
    formaos: 'One-click audit packet export in under 2 minutes',
    icon: Clock,
  },
  {
    legacy: 'No enforcement of compliance workflows',
    formaos: 'Compliance Gates block progress until requirements met',
    icon: Shield,
  },
  {
    legacy: 'Disconnected identity management',
    formaos: 'SAML 2.0 SSO + SCIM 2.0 automated provisioning',
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
    accent: 'emerald',
    accentRgb: '52,211,153',
  },
  {
    label: 'API Guards',
    detail:
      'Server-side middleware enforcing permission checks, rate limiting, and compliance state validation on every request.',
    icon: Server,
    accent: 'cyan',
    accentRgb: '34,211,238',
  },
  {
    label: 'Business Logic',
    detail:
      'Workflow engine processing automation rules, scoring calculations, and cross-framework evidence mapping.',
    icon: GitBranch,
    accent: 'blue',
    accentRgb: '59,130,246',
  },
  {
    label: 'Database RLS',
    detail:
      'Row-Level Security policies ensure tenant isolation at the database layer. Every query is scoped by organization.',
    icon: Database,
    accent: 'violet',
    accentRgb: '139,92,246',
  },
  {
    label: 'Environment Isolation',
    detail:
      'Infrastructure-level tenant isolation with dedicated encryption keys and configurable data residency.',
    icon: Key,
    accent: 'rose',
    accentRgb: '251,113,133',
  },
];

/* ─── Stats ─────────────────────────────────────────────── */

const platformStats = [
  { value: '18', label: 'Platform Features', suffix: '' },
  { value: '7', label: 'Framework Packs', suffix: '+' },
  { value: '12', label: 'Automation Triggers', suffix: '+' },
  { value: '5', label: 'Security Layers', suffix: '' },
  { value: '99.9', label: 'Uptime SLA', suffix: '%' },
  { value: '<2', label: 'Min Audit Export', suffix: 'min' },
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
        <span className="text-emerald-400">{suffix}</span>
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
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 mb-6">
              <Server className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                Platform Architecture
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Five layers of{' '}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                defense in depth
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
              Every request traverses five independent security and compliance
              verification layers. No single point of failure. No bypass path.
            </p>
          </ScrollReveal>

          <SectionChoreography
            pattern="cascade"
            stagger={0.08}
            className="relative"
          >
            <div className="absolute left-8 sm:left-12 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-400/40 via-violet-400/20 to-rose-400/40" />

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
    <DeferredSection minHeight={600}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Built Different
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Legacy compliance vs{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                FormaOS
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
              See the structural difference between managing compliance in
              spreadsheets and operating it as infrastructure.
            </p>
          </ScrollReveal>

          <div className="hidden sm:grid grid-cols-[1fr,auto,1fr] gap-4 mb-6 px-2">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider text-center">
              Legacy Approach
            </div>
            <div className="w-px" />
            <div className="text-sm font-semibold text-emerald-400/70 uppercase tracking-wider text-center">
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
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
                        <ItemIcon className="w-4 h-4 text-emerald-400" />
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
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 mb-6">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Framework Packs
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Pre-built compliance{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                framework libraries
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
              Each framework ships with mapped controls, evidence templates, and
              cross-framework overlap detection. Activate in one click.
            </p>
          </ScrollReveal>

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
                  hover:bg-white/[0.04] hover:border-emerald-400/15 transition-all duration-300
                  hover:shadow-[0_0_30px_rgba(52,211,153,0.05)]"
              >
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl border border-emerald-400/20 bg-emerald-500/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        {fw.name}
                      </h3>
                      {fw.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-400">
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
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-medium">
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
    accent: 'emerald',
    accentRgb: '52,211,153',
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
    accent: 'cyan',
    accentRgb: '34,211,238',
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
    accent: 'violet',
    accentRgb: '139,92,246',
    heading: 'Enterprise identity governance built in',
    description:
      'SAML 2.0 SSO, SCIM provisioning, and role-based access control for organizations that require centralized identity management.',
    details: [
      {
        label: 'SAML 2.0 SSO',
        text: 'Single sign-on with Okta, Azure AD, Google Workspace, and any SAML 2.0-compliant identity provider.',
      },
      {
        label: 'SCIM 2.0',
        text: 'Automated user provisioning, role updates, and deprovisioning synced from your identity provider in real-time.',
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
    accent: 'blue',
    accentRgb: '59,130,246',
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
    <DeferredSection minHeight={600}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 mb-6">
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Deep Dive
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Explore core{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                capabilities
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
              Four pillars of the FormaOS platform, each engineered for depth,
              auditability, and operational control.
            </p>
          </ScrollReveal>

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
    accentRgb: '52,211,153',
    icon: Layers,
  },
  {
    step: '02',
    title: 'Assign Control Owners',
    description:
      'Every control gets a named owner with clear responsibility, review cadence, and escalation path.',
    accentRgb: '34,211,238',
    icon: Users,
  },
  {
    step: '03',
    title: 'Collect & Verify Evidence',
    description:
      'Upload evidence with SHA-256 verification, automated expiry tracking, and cross-framework mapping.',
    accentRgb: '59,130,246',
    icon: FileCheck,
  },
  {
    step: '04',
    title: 'Automate Workflows',
    description:
      'Configure triggers for task creation, notifications, and escalations. Compliance runs on autopilot.',
    accentRgb: '139,92,246',
    icon: Workflow,
  },
  {
    step: '05',
    title: 'Monitor & Score',
    description:
      'Continuous posture scoring with daily checks, drift detection, and real-time risk heatmap visualization.',
    accentRgb: '251,113,133',
    icon: BarChart3,
  },
  {
    step: '06',
    title: 'Export Audit Packets',
    description:
      'One-click export of framework-mapped evidence bundles with verification metadata. Audit-ready in under 2 minutes.',
    accentRgb: '245,158,11',
    icon: ExternalLink,
  },
];

function PlatformWorkflowSection() {
  return (
    <DeferredSection minHeight={500}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 mb-6">
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                How It Works
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              From activation to{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                audit-ready
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
              Six steps to transform compliance from manual overhead into a
              continuously operating system with verifiable evidence.
            </p>
          </ScrollReveal>

          <SectionChoreography pattern="cascade" stagger={0.08}>
            <div className="relative">
              <div className="absolute left-[2.75rem] sm:left-1/2 sm:-translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-emerald-400/30 via-blue-400/20 to-amber-400/30" />

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
      <section className="mk-section relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.08), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(34,211,238,0.06), transparent 50%)',
              }}
            />

            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-emerald-400/30"
                  style={{
                    left: `${12 + ((i * 76) % 80)}%`,
                    top: `${8 + ((i * 53) % 85)}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.6, 0.2],
                  }}
                  transition={{
                    duration: 4 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.4,
                  }}
                />
              ))}
            </div>

            <div className="relative p-8 sm:p-12 lg:p-16 text-center">
              <ScrollReveal variant="depthScale" range={[0, 0.3]}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Get Started
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Ready to operate compliance{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                    as infrastructure?
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10">
                  See how FormaOS replaces spreadsheet-based compliance with a
                  structured operating system built for regulated teams.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={brand.seo.appUrl}
                    className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      bg-gradient-to-r from-emerald-500 to-teal-500
                      text-white font-semibold text-sm
                      shadow-lg shadow-emerald-500/20
                      hover:shadow-xl hover:shadow-emerald-500/30
                      transition-all duration-300"
                  >
                    Start Free Trial
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
                    'SOC 2 Ready',
                    'GDPR Compliant',
                    '99.9% SLA',
                    'No Credit Card Required',
                  ].map((signal) => (
                    <div key={signal} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400/50" />
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
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{ background: 'rgba(52,211,153,0.12)' }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.12, 0.18, 0.12],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: 'rgba(34,211,238,0.10)' }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.16, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
        />
        <motion.div
          className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: 'rgba(139,92,246,0.06)' }}
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.06, 0.1, 0.06],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 6,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: '72px 72px',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
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
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Platform Features
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6"
        >
          Compliance infrastructure
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
            engineered for accountability
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          18 features across compliance, automation, security, and collaboration
          — built for regulated teams that need provable control over every
          obligation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link
            href={brand.seo.appUrl}
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
              bg-gradient-to-r from-emerald-500 to-teal-500
              text-white font-semibold text-sm
              shadow-lg shadow-emerald-500/20
              hover:shadow-xl hover:shadow-emerald-500/30
              transition-all duration-300"
          >
            Start Free Trial
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
            Enterprise Overview
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

      <VisualDivider gradient />

      <StatsSection />

      <VisualDivider />

      {/* Feature Grid */}
      <DeferredSection minHeight={800}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-6"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Every feature, built for{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                  regulated teams
                </span>
              </h2>
              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
                18 platform features across four categories — each designed to
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

      <VisualDivider />

      <FrameworkCoverageSection />

      <VisualDivider />

      <CapabilityDeepDive />

      <VisualDivider />

      <ArchitectureSection />

      <VisualDivider />

      <PlatformWorkflowSection />

      <VisualDivider />

      <ComparisonSection />

      <VisualDivider />

      <EnterpriseCTA />
    </MarketingPageShell>
  );
}

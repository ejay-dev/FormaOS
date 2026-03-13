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
  Rocket,
  Bug,
  Sparkles,
  Shield,
  Zap,
  Globe,
  Lock,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Star,
  Calendar,
  Tag,
  Eye,
  Command,
  Layers,
  Workflow,
  Bell,
  GitBranch,
  GitCommit,
  GitMerge,
  Package,
  Milestone,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { brand } from '@/config/brand';

/* ─── Easing ──────────────────────────────────────────────── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─── Tag Types ───────────────────────────────────────────── */

type ChangeTag =
  | 'feature'
  | 'improvement'
  | 'security'
  | 'fix'
  | 'enterprise'
  | 'integration';

interface TagConfig {
  label: string;
  icon: LucideIcon;
  colorRgb: string;
  bg: string;
  border: string;
  text: string;
}

const TAG_CONFIG: Record<ChangeTag, TagConfig> = {
  feature: {
    label: 'Feature',
    icon: Sparkles,
    colorRgb: '52,211,153',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/20',
    text: 'text-emerald-400',
  },
  improvement: {
    label: 'Improvement',
    icon: Zap,
    colorRgb: '34,211,238',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-400/20',
    text: 'text-cyan-400',
  },
  security: {
    label: 'Security',
    icon: Shield,
    colorRgb: '139,92,246',
    bg: 'bg-violet-500/10',
    border: 'border-violet-400/20',
    text: 'text-violet-400',
  },
  fix: {
    label: 'Fix',
    icon: Bug,
    colorRgb: '245,158,11',
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/20',
    text: 'text-amber-400',
  },
  enterprise: {
    label: 'Enterprise',
    icon: Lock,
    colorRgb: '251,113,133',
    bg: 'bg-rose-500/10',
    border: 'border-rose-400/20',
    text: 'text-rose-400',
  },
  integration: {
    label: 'Integration',
    icon: Globe,
    colorRgb: '59,130,246',
    bg: 'bg-blue-500/10',
    border: 'border-blue-400/20',
    text: 'text-blue-400',
  },
};

const ALL_TAGS: ChangeTag[] = [
  'feature',
  'improvement',
  'security',
  'fix',
  'enterprise',
  'integration',
];

/* ─── Changelog Data ──────────────────────────────────────── */

interface ChangelogChange {
  text: string;
  tag: ChangeTag;
  detail?: string;
}

interface ChangelogRelease {
  version: string;
  codename: string;
  date: string;
  summary: string;
  isMajor: boolean;
  changes: ChangelogChange[];
}

const releases: ChangelogRelease[] = [
  {
    version: 'v2.1.0',
    codename: 'Aurora',
    date: '2026-03-08',
    summary:
      'Command palette 2.0, real-time collaboration, and 3 new integrations.',
    isMajor: false,
    changes: [
      {
        text: 'Command palette with fuzzy search across all entities',
        tag: 'feature',
        detail:
          'Search controls, evidence, tasks, incidents, and settings from a single keyboard shortcut. Results ranked by relevance with inline preview.',
      },
      {
        text: 'Real-time collaboration with live presence indicators',
        tag: 'feature',
        detail:
          'See who is editing what in real-time. Conflict resolution handles simultaneous edits gracefully with visual merge indicators.',
      },
      {
        text: 'Jira Cloud integration for compliance task sync',
        tag: 'integration',
        detail:
          'Bi-directional sync between FormaOS tasks and Jira issues. Status changes propagate automatically with field mapping configuration.',
      },
      {
        text: 'ServiceNow CMDB connector for asset inventory',
        tag: 'integration',
        detail:
          'Pull CMDB configuration items into FormaOS for automated asset-to-control mapping and compliance scope management.',
      },
      {
        text: 'PagerDuty integration for incident escalation',
        tag: 'integration',
        detail:
          'Trigger PagerDuty incidents from FormaOS compliance alerts. Escalation policies and on-call schedules honored automatically.',
      },
      {
        text: 'Improved notification batching to reduce alert fatigue',
        tag: 'improvement',
        detail:
          'Smart grouping algorithm batches related notifications by entity and timeframe. Configurable quiet hours and priority overrides.',
      },
      {
        text: 'Fixed rare race condition in concurrent evidence uploads',
        tag: 'fix',
        detail:
          'Resolved edge case where simultaneous uploads to the same control could result in version history inconsistency.',
      },
      {
        text: 'Session management improvements for SSO users',
        tag: 'security',
        detail:
          'Added configurable session timeout enforcement for SAML-authenticated sessions with forced re-authentication support.',
      },
    ],
  },
  {
    version: 'v2.0.0',
    codename: 'Sovereign',
    date: '2026-02-15',
    summary:
      'Major release: SCIM 2.0, compliance gates, risk heatmap, and workflow automation.',
    isMajor: true,
    changes: [
      {
        text: 'SCIM 2.0 automated user lifecycle provisioning',
        tag: 'enterprise',
        detail:
          'Full SCIM 2.0 support for Okta, Azure AD, and OneLogin. Automated user creation, role assignment, team membership, and deprovisioning synced from your identity provider.',
      },
      {
        text: 'Compliance Gate enforcement engine',
        tag: 'feature',
        detail:
          'Configurable enforcement points that structurally block progress when compliance prerequisites are unmet. Gates integrate with approval workflows, CI/CD pipelines, and audit preparation processes.',
      },
      {
        text: 'Visual risk heatmap with drill-down capability',
        tag: 'feature',
        detail:
          'Interactive heatmap showing risk concentrations across frameworks, categories, and individual controls. Color-coded by overdue status, evidence freshness, and ownership gaps.',
      },
      {
        text: 'Workflow automation with 12+ trigger types',
        tag: 'feature',
        detail:
          'Visual workflow builder supporting event-driven automation with conditional branching, multi-step escalation chains, and scheduled execution.',
      },
      {
        text: 'Cross-framework evidence mapping and overlap detection',
        tag: 'feature',
        detail:
          'Evidence collected for one framework automatically satisfies overlapping requirements in other active frameworks. Reduces duplicate evidence collection by up to 60%.',
      },
      {
        text: 'Board-ready compliance report generator',
        tag: 'enterprise',
        detail:
          'One-click generation of executive compliance reports with posture scores, trend analysis, risk highlights, and framework-specific summaries formatted for board presentation.',
      },
      {
        text: 'HIPAA framework pack with 72 pre-mapped controls',
        tag: 'feature',
        detail:
          'Complete HIPAA coverage including Administrative, Physical, and Technical safeguards with evidence templates and audit checklist.',
      },
      {
        text: 'Enhanced row-level security with per-organization isolation',
        tag: 'security',
        detail:
          'Database-level tenant isolation using PostgreSQL Row-Level Security policies. Every query is scoped by organization with no bypass path.',
      },
      {
        text: 'Bulk operations across controls, evidence, and tasks',
        tag: 'improvement',
        detail:
          'Multi-select and batch update capabilities for mass assignment, status changes, and archival operations with full audit trail preservation.',
      },
      {
        text: 'Historical compliance score trending with regression detection',
        tag: 'improvement',
        detail:
          'Track compliance posture over time with configurable trend windows. Automated alerts when scores drop below historical baselines.',
      },
    ],
  },
  {
    version: 'v1.9.0',
    codename: 'Meridian',
    date: '2026-01-20',
    summary:
      'PCI-DSS framework, incident management, and evidence version control.',
    isMajor: false,
    changes: [
      {
        text: 'PCI-DSS v4.0 framework pack with 78 controls',
        tag: 'feature',
        detail:
          'Complete PCI-DSS v4.0 coverage with self-assessment questionnaire mapping, compensating controls support, and ROC evidence templates.',
      },
      {
        text: 'Full incident lifecycle management',
        tag: 'feature',
        detail:
          'Report, investigate, assign corrective actions, and close incidents with evidence. Severity-based auto-escalation with configurable SLA timers.',
      },
      {
        text: 'Evidence version control with diff comparison',
        tag: 'feature',
        detail:
          'Full version history for every evidence artifact with visual diff between revisions. See exactly what changed and who made the change.',
      },
      {
        text: 'Azure AD SSO support via SAML 2.0',
        tag: 'enterprise',
        detail:
          'Native Azure Active Directory integration with group-based role mapping and conditional access policy support.',
      },
      {
        text: 'Framework-specific export templates',
        tag: 'improvement',
        detail:
          'Export audit packets in framework-required formats. ISO 27001 SOA, SOC 2 Type II evidence bundles, GDPR DPIA templates.',
      },
      {
        text: 'Fixed evidence checksum verification on large file uploads',
        tag: 'fix',
        detail:
          'Resolved issue where SHA-256 verification could timeout on files larger than 500MB. Switched to streaming hash computation.',
      },
      {
        text: 'Improved API rate limiting for enterprise endpoints',
        tag: 'security',
        detail:
          'Graduated rate limiting with burst allowance for enterprise API consumers. Per-organization quotas with configurable limits.',
      },
    ],
  },
  {
    version: 'v1.8.0',
    codename: 'Bastion',
    date: '2025-12-10',
    summary:
      'NIST CSF framework, automation templates, and data residency controls.',
    isMajor: false,
    changes: [
      {
        text: 'NIST Cybersecurity Framework pack with 108 controls',
        tag: 'feature',
        detail:
          'Complete NIST CSF coverage across Identify, Protect, Detect, Respond, and Recover functions with implementation tier mapping.',
      },
      {
        text: 'Pre-built automation workflow templates',
        tag: 'feature',
        detail:
          'Library of automation templates for common compliance workflows: evidence collection reminders, control review cadences, and expiry alerts.',
      },
      {
        text: 'Data residency preference configuration',
        tag: 'enterprise',
        detail:
          'Configure preferred data residency region. AU-default with infrastructure ready for US and EU deployments as regulatory requirements expand.',
      },
      {
        text: 'Enhanced role-based access control with custom roles',
        tag: 'security',
        detail:
          'Define custom roles with granular per-framework, per-entity permissions. Role templates for common compliance team structures.',
      },
      {
        text: 'Contextual help system with guided onboarding',
        tag: 'improvement',
        detail:
          'Location-aware help widget surfaces relevant documentation and walkthroughs. New user onboarding flow covers platform setup, framework activation, and team invitation.',
      },
      {
        text: 'Fixed timezone handling in compliance score calculations',
        tag: 'fix',
        detail:
          'Resolved edge case where daily compliance checks could run at inconsistent times for organizations spanning multiple time zones.',
      },
    ],
  },
  {
    version: 'v1.7.0',
    codename: 'Vector',
    date: '2025-11-05',
    summary:
      'CIS Controls framework, Slack integration, and compliance scoring engine.',
    isMajor: false,
    changes: [
      {
        text: 'CIS Controls v8 framework pack with 153 controls',
        tag: 'feature',
        detail:
          'Complete CIS Controls v8 coverage with Implementation Group (IG1/IG2/IG3) filtering and prioritization based on organizational maturity.',
      },
      {
        text: 'Slack integration for compliance notifications',
        tag: 'integration',
        detail:
          'Deliver compliance alerts, task assignments, and review requests to Slack channels. Configurable per-channel routing with thread support.',
      },
      {
        text: 'Continuous compliance scoring engine',
        tag: 'feature',
        detail:
          'Real-time posture scoring with daily automated checks. Scores broken down by framework, category, and individual control with threshold-based alerting.',
      },
      {
        text: 'Microsoft Teams connector',
        tag: 'integration',
        detail:
          'Send compliance notifications and alerts to Teams channels. Adaptive card format with inline action buttons for quick response.',
      },
      {
        text: 'Evidence expiry tracking with automated reminders',
        tag: 'improvement',
        detail:
          'Configure expiration dates on evidence artifacts. Automated reminder chains fire at 30, 14, 7, and 1 day before expiry.',
      },
      {
        text: 'Improved search indexing for faster global search',
        tag: 'improvement',
        detail:
          'Rebuilt search index with trigram matching for sub-200ms results across all entity types. Saved search support with pinned queries.',
      },
      {
        text: 'Fixed pagination in audit trail export',
        tag: 'fix',
        detail:
          'Resolved issue where audit trail exports exceeding 10,000 records could produce incomplete CSV files. Switched to streaming export.',
      },
    ],
  },
  {
    version: 'v1.6.0',
    codename: 'Prism',
    date: '2025-10-01',
    summary:
      'GDPR framework, notification center, and task management overhaul.',
    isMajor: false,
    changes: [
      {
        text: 'GDPR framework pack with Article-mapped controls',
        tag: 'feature',
        detail:
          'Complete GDPR coverage with Article-level control mapping, DPIA templates, data processing activity records, and consent management evidence templates.',
      },
      {
        text: 'Centralized notification center with multi-channel delivery',
        tag: 'feature',
        detail:
          'Unified notification hub aggregating alerts across the compliance program. In-app, email, Slack, and Teams delivery with smart batching.',
      },
      {
        text: 'Task management overhaul with priority and due dates',
        tag: 'improvement',
        detail:
          'Redesigned task system with priority levels, due date tracking, assignee management, and Kanban board view for compliance workflows.',
      },
      {
        text: 'Google Workspace SSO integration',
        tag: 'enterprise',
        detail:
          'SAML 2.0 single sign-on with Google Workspace. Automatic role mapping based on Google Groups membership.',
      },
      {
        text: 'Evidence bulk upload with drag-and-drop',
        tag: 'improvement',
        detail:
          'Upload multiple evidence files simultaneously with drag-and-drop. Auto-detection of file types and suggested control mapping.',
      },
      {
        text: 'Fixed control assignment notifications not firing for bulk operations',
        tag: 'fix',
        detail:
          'Resolved issue where bulk control assignment did not trigger individual notification delivery to newly assigned owners.',
      },
    ],
  },
  {
    version: 'v1.5.0',
    codename: 'Aegis',
    date: '2025-08-20',
    summary:
      'SOC 2 framework, evidence vault with SHA-256, and immutable audit trail.',
    isMajor: true,
    changes: [
      {
        text: 'SOC 2 Trust Services Criteria framework pack',
        tag: 'feature',
        detail:
          'Complete SOC 2 coverage across Security, Availability, Processing Integrity, Confidentiality, and Privacy criteria with 64 pre-mapped controls.',
      },
      {
        text: 'Evidence Vault with SHA-256 cryptographic verification',
        tag: 'feature',
        detail:
          'Immutable evidence storage with SHA-256 hash at upload, verification at every access, full version history, and chain-of-custody tracking.',
      },
      {
        text: 'Immutable audit trail with cryptographic linking',
        tag: 'security',
        detail:
          'Append-only audit trail with cryptographically linked records. Every action logged with actor, event, entity, timestamp, and justification.',
      },
      {
        text: 'Okta SAML 2.0 SSO integration',
        tag: 'enterprise',
        detail:
          'Enterprise single sign-on via Okta with JIT (Just-In-Time) user provisioning and attribute-based role assignment.',
      },
      {
        text: 'Compliance posture dashboard with framework breakdown',
        tag: 'feature',
        detail:
          'Executive dashboard showing aggregate compliance posture with per-framework breakdown, recent activity feed, and overdue item highlights.',
      },
      {
        text: 'One-click audit packet export',
        tag: 'improvement',
        detail:
          'Export framework-mapped evidence bundles with verification metadata, control mapping index, and evidence completeness report.',
      },
      {
        text: 'Fixed role permission inheritance in nested team structures',
        tag: 'fix',
        detail:
          'Resolved issue where permissions defined at parent team level were not correctly inherited by members of nested sub-teams.',
      },
    ],
  },
  {
    version: 'v1.4.0',
    codename: 'Cipher',
    date: '2025-07-10',
    summary:
      'Inline comments, global search, and care plan management for NDIS providers.',
    isMajor: false,
    changes: [
      {
        text: 'Inline comments with threaded discussions and @mentions',
        tag: 'feature',
        detail:
          'Comment directly on controls, evidence, tasks, and incidents. Threaded conversations with @mention notifications and rich text support.',
      },
      {
        text: 'Global search across all entity types',
        tag: 'feature',
        detail:
          'Full-text search across controls, evidence, tasks, incidents, and audit logs with faceted filtering and context snippet highlighting.',
      },
      {
        text: 'NDIS care plan and participant management',
        tag: 'feature',
        detail:
          'Purpose-built for NDIS providers: participant care plans, goal-linked progress notes, visit scheduling with compliance-verified check-in/check-out.',
      },
      {
        text: 'Care delivery service logs for audit compliance',
        tag: 'feature',
        detail:
          'Service delivery logging that satisfies NDIS Quality & Safeguards Commission audit requirements with billing reconciliation support.',
      },
      {
        text: 'Enhanced control assignment workflow',
        tag: 'improvement',
        detail:
          'Streamlined control ownership assignment with team-based allocation, workload visibility, and suggested assignments based on expertise.',
      },
      {
        text: 'Fixed evidence download resumption on interrupted connections',
        tag: 'fix',
        detail:
          'Implemented range-request support for evidence downloads enabling resume on network interruption for large files.',
      },
    ],
  },
  {
    version: 'v1.3.0',
    codename: 'Sentinel',
    date: '2025-06-01',
    summary:
      'Automation engine, webhook integrations, and framework cross-mapping.',
    isMajor: false,
    changes: [
      {
        text: 'Event-driven automation engine with visual workflow builder',
        tag: 'feature',
        detail:
          'Build automation rules with drag-and-drop. 8 initial trigger types including control status change, evidence expiry, and score threshold.',
      },
      {
        text: 'Webhook integration framework for external systems',
        tag: 'integration',
        detail:
          'Inbound and outbound webhook support for connecting FormaOS with external tools. Configurable payload templates and retry policies.',
      },
      {
        text: 'Cross-framework control mapping visualization',
        tag: 'feature',
        detail:
          'Interactive visualization showing control overlap between active frameworks. Identify shared evidence requirements to reduce compliance workload.',
      },
      {
        text: 'Evidence tagging and categorization system',
        tag: 'improvement',
        detail:
          'Tag evidence artifacts with custom labels for organization. Category-based filtering in evidence vault for faster discovery.',
      },
      {
        text: 'Fixed CSV import handling for non-UTF8 encoded files',
        tag: 'fix',
        detail:
          'Added automatic character encoding detection for CSV imports. Supports UTF-8, UTF-16, ISO-8859-1, and Windows-1252 encodings.',
      },
    ],
  },
  {
    version: 'v1.2.0',
    codename: 'Keystone',
    date: '2025-04-15',
    summary:
      'Team management, role-based access, and compliance dashboard v1.',
    isMajor: false,
    changes: [
      {
        text: 'Team management with organizational hierarchy',
        tag: 'feature',
        detail:
          'Create teams, sub-teams, and organizational units. Assign team-level permissions and compliance responsibilities.',
      },
      {
        text: 'Role-based access control with 5 predefined roles',
        tag: 'security',
        detail:
          'Admin, Compliance Manager, Auditor (read-only), Team Lead, and Member roles with granular permission matrices.',
      },
      {
        text: 'Compliance posture dashboard v1',
        tag: 'feature',
        detail:
          'Initial compliance dashboard showing framework activation status, control completion percentages, and recent activity feed.',
      },
      {
        text: 'Email notification preferences',
        tag: 'improvement',
        detail:
          'Configure per-notification-type email preferences. Digest mode batches non-urgent notifications into daily or weekly summaries.',
      },
      {
        text: 'Fixed control status transitions allowing invalid state changes',
        tag: 'fix',
        detail:
          'Enforced valid state machine transitions for control lifecycle. Prevented direct jump from Draft to Completed without Review.',
      },
    ],
  },
  {
    version: 'v1.1.0',
    codename: 'Foundation',
    date: '2025-03-01',
    summary:
      'Evidence upload system, control library, and basic task management.',
    isMajor: false,
    changes: [
      {
        text: 'Evidence upload with file type validation',
        tag: 'feature',
        detail:
          'Upload compliance evidence with supported file type validation. PDF, DOCX, XLSX, CSV, PNG, JPG, and MP4 support with 100MB size limit.',
      },
      {
        text: 'Control library with custom control creation',
        tag: 'feature',
        detail:
          'Create custom controls with description, category, evidence requirements, and review cadence configuration.',
      },
      {
        text: 'Basic task management with status tracking',
        tag: 'feature',
        detail:
          'Create tasks linked to controls and evidence. Track status across To Do, In Progress, Review, and Done stages.',
      },
      {
        text: 'User invitation and onboarding flow',
        tag: 'improvement',
        detail:
          'Email-based user invitation with guided onboarding. New users receive platform overview, role explanation, and first-task guidance.',
      },
      {
        text: 'Fixed authentication token refresh race condition',
        tag: 'fix',
        detail:
          'Resolved issue where concurrent requests during token refresh could result in temporary authentication failures.',
      },
    ],
  },
  {
    version: 'v1.0.0',
    codename: 'Genesis',
    date: '2025-01-15',
    summary:
      'Initial launch with ISO 27001 framework pack and core compliance platform.',
    isMajor: true,
    changes: [
      {
        text: 'ISO 27001:2022 framework pack with 114 Annex A controls',
        tag: 'feature',
        detail:
          'Complete ISO 27001:2022 coverage including all 93 Annex A controls organized by the 4 control themes: Organizational, People, Physical, and Technological.',
      },
      {
        text: 'Multi-tenant platform architecture',
        tag: 'feature',
        detail:
          'Secure multi-tenant architecture with organization-level data isolation, workspace management, and the foundation for enterprise features.',
      },
      {
        text: 'User authentication with email/password and magic links',
        tag: 'security',
        detail:
          'Secure authentication system supporting email/password and passwordless magic link login with rate limiting and brute-force protection.',
      },
      {
        text: 'Organization and workspace creation',
        tag: 'feature',
        detail:
          'Create organizations with workspace isolation. Invite team members, configure workspace settings, and activate compliance frameworks.',
      },
      {
        text: 'Control management with status lifecycle',
        tag: 'feature',
        detail:
          'Full control lifecycle management: Draft, Active, Under Review, Compliant, Non-Compliant, and Archived states with transition validation.',
      },
      {
        text: 'Basic evidence attachment to controls',
        tag: 'feature',
        detail:
          'Attach evidence files to controls as proof of compliance implementation. Initial support for PDF and document formats.',
      },
    ],
  },
];

/* ─── Computed Stats ──────────────────────────────────────── */

const totalChanges = releases.reduce((sum, r) => sum + r.changes.length, 0);
const totalFeatures = releases.reduce(
  (sum, r) => sum + r.changes.filter((c) => c.tag === 'feature').length,
  0,
);
const totalFixes = releases.reduce(
  (sum, r) => sum + r.changes.filter((c) => c.tag === 'fix').length,
  0,
);
const majorReleases = releases.filter((r) => r.isMajor).length;

const changelogStats = [
  { value: String(releases.length), label: 'Releases Shipped', suffix: '' },
  { value: String(totalChanges), label: 'Total Changes', suffix: '+' },
  { value: String(totalFeatures), label: 'Features Added', suffix: '' },
  { value: String(majorReleases), label: 'Major Releases', suffix: '' },
  { value: String(totalFixes), label: 'Bugs Fixed', suffix: '' },
  { value: '14', label: 'Months Active', suffix: '' },
];

/* ─── Animated Stat ───────────────────────────────────────── */

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

/* ─── Tag Badge ───────────────────────────────────────────── */

function TagBadge({ tag }: { tag: ChangeTag }) {
  const config = TAG_CONFIG[tag];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.bg} ${config.border} ${config.text}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
}

/* ─── Change Item ─────────────────────────────────────────── */

function ChangeItem({
  change,
  index,
}: {
  change: ChangelogChange;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = TAG_CONFIG[change.tag];
  const itemClassName = `rounded-xl border border-white/[0.06] bg-white/[0.02] p-4
          transition-all duration-300
          hover:bg-white/[0.04] hover:border-white/[0.1]
          hover:shadow-[0_0_30px_rgba(${config.colorRgb},0.04)]`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: EASE_OUT_EXPO }}
      className="group"
    >
      {change.detail ? (
        <button
          type="button"
          className={`${itemClassName} w-full cursor-pointer text-left`}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: `rgba(${config.colorRgb}, 0.8)` }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-sm text-white font-medium leading-snug">
                  {change.text}
                </span>
                <TagBadge tag={change.tag} />
              </div>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="shrink-0 mt-0.5"
            >
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </motion.div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                className="overflow-hidden"
              >
                <div className="pt-3 pl-4 border-t border-white/[0.04] mt-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {change.detail}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      ) : (
        <div className={itemClassName}>
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: `rgba(${config.colorRgb}, 0.8)` }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-sm text-white font-medium leading-snug">
                  {change.text}
                </span>
                <TagBadge tag={change.tag} />
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Release Card ────────────────────────────────────────── */

function ReleaseCard({
  release,
  index,
  isLatest,
}: {
  release: ChangelogRelease;
  index: number;
  isLatest: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleChanges = showAll ? release.changes : release.changes.slice(0, 5);
  const hasMore = release.changes.length > 5;

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    release.changes.forEach((c) => {
      counts[c.tag] = (counts[c.tag] || 0) + 1;
    });
    return counts;
  }, [release.changes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: EASE_OUT_EXPO }}
      className="relative"
    >
      {/* Timeline connector dot */}
      <div
        className={`absolute -left-[2.3rem] sm:-left-[2.8rem] top-8 w-4 h-4 rounded-full border-2 z-10
          ${
            release.isMajor
              ? 'border-emerald-400/60 bg-emerald-500/20 shadow-[0_0_14px_rgba(52,211,153,0.3)]'
              : 'border-white/20 bg-white/5'
          }`}
      />

      <div
        className={`group rounded-2xl border bg-white/[0.02] overflow-hidden transition-all duration-400
          ${
            release.isMajor
              ? 'border-emerald-400/15 hover:border-emerald-400/25 hover:shadow-[0_0_50px_rgba(52,211,153,0.06)]'
              : 'border-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_40px_rgba(255,255,255,0.02)]'
          }`}
      >
        {/* Major release glow */}
        {release.isMajor && (
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background:
                'radial-gradient(ellipse at 0% 0%, rgba(52,211,153,0.08), transparent 50%)',
            }}
          />
        )}

        {/* Header */}
        <div className="relative p-5 sm:p-6 border-b border-white/[0.04]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center
                  ${
                    release.isMajor
                      ? 'border-emerald-400/20 bg-emerald-500/10'
                      : 'border-white/[0.08] bg-white/[0.04]'
                  }`}
              >
                {release.isMajor ? (
                  <Rocket
                    className={`w-5 h-5 ${release.isMajor ? 'text-emerald-400' : 'text-slate-400'}`}
                  />
                ) : (
                  <Package className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {release.version}
                  </h3>
                  <span className="text-sm text-slate-500 font-medium">
                    {release.codename}
                  </span>
                  {isLatest && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-400/20 bg-emerald-500/10 text-emerald-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                      Latest
                    </span>
                  )}
                  {release.isMajor && !isLatest && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-violet-400/20 bg-violet-500/10 text-violet-400">
                      <Star className="w-2.5 h-2.5" />
                      Major
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  {release.summary}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <time dateTime={release.date}>
                {new Date(release.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          </div>

          {/* Tag summary strip */}
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(tagCounts).map(([tag, count]) => {
              const tc = TAG_CONFIG[tag as ChangeTag];
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${tc.bg} ${tc.border} ${tc.text}`}
                >
                  {tc.label}: {count}
                </span>
              );
            })}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-500 border border-white/[0.06] bg-white/[0.02]">
              {release.changes.length} changes total
            </span>
          </div>
        </div>

        {/* Changes list */}
        <div className="relative p-5 sm:p-6 space-y-2">
          {visibleChanges.map((change, ci) => (
            <ChangeItem key={ci} change={change} index={ci} />
          ))}

          {hasMore && (
            <motion.button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                border border-white/[0.06] bg-white/[0.02] text-sm text-slate-400
                hover:text-white hover:bg-white/[0.04] hover:border-white/[0.1]
                transition-all duration-300"
            >
              {showAll ? (
                <>
                  Show less
                  <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                </>
              ) : (
                <>
                  Show {release.changes.length - 5} more changes
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Year Divider ────────────────────────────────────────── */

function YearDivider({ year }: { year: string }) {
  return (
    <div className="relative flex items-center gap-4 py-4">
      <div className="absolute -left-[2.3rem] sm:-left-[2.8rem] w-4 h-4 rounded-full border-2 border-violet-400/40 bg-violet-500/15 z-10 flex items-center justify-center">
        <Star className="w-2 h-2 text-violet-400" />
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-violet-400/30 via-violet-400/10 to-transparent" />
      <span className="text-sm font-bold text-violet-400/70 uppercase tracking-wider">
        {year}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-violet-400/30 via-violet-400/10 to-transparent" />
    </div>
  );
}

/* ─── Filter Bar ──────────────────────────────────────────── */

function FilterBar({
  activeTag,
  onSelect,
  searchQuery,
  onSearch,
}: {
  activeTag: ChangeTag | null;
  onSelect: (tag: ChangeTag | null) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
}) {
  return (
    <ScrollReveal variant="fadeUp" range={[0, 0.3]}>
      <div className="space-y-4 mb-12">
        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Command className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search changes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03]
              text-sm text-white placeholder:text-slate-500
              focus:outline-none focus:border-emerald-400/30 focus:ring-1 focus:ring-emerald-400/20
              transition-all duration-300"
          />
        </div>

        {/* Tag filters */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => onSelect(null)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 border
              ${
                activeTag === null
                  ? 'bg-white/[0.08] border-white/[0.15] text-white'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            All Changes
          </button>
          {ALL_TAGS.map((tag) => {
            const config = TAG_CONFIG[tag];
            const Icon = config.icon;
            const count = releases.reduce(
              (sum, r) => sum + r.changes.filter((c) => c.tag === tag).length,
              0,
            );
            return (
              <button
                key={tag}
                onClick={() => onSelect(tag)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 border
                  ${
                    activeTag === tag
                      ? `bg-white/[0.08] border-white/[0.15] text-white shadow-[0_0_20px_rgba(${config.colorRgb},0.1)]`
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
              >
                <Icon className="w-3 h-3" />
                {config.label}
                <span className="text-slate-500">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ─── Release Timeline Visual ─────────────────────────────── */

function ReleaseTimelineVisual() {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const releasesByMonth = useMemo(() => {
    const map: Record<string, { count: number; versions: string[]; hasMajor: boolean }> = {};
    releases.forEach((r) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!map[key]) map[key] = { count: 0, versions: [], hasMajor: false };
      map[key].count++;
      map[key].versions.push(r.version);
      if (r.isMajor) map[key].hasMajor = true;
    });
    return map;
  }, []);

  const timelineMonths = useMemo(() => {
    const result: { key: string; month: string; year: string; data: typeof releasesByMonth[string] | null }[] = [];
    for (let y = 2025; y <= 2026; y++) {
      for (let m = y === 2025 ? 0 : 0; m < (y === 2026 ? 3 : 12); m++) {
        const key = `${y}-${String(m).padStart(2, '0')}`;
        result.push({
          key,
          month: months[m],
          year: String(y),
          data: releasesByMonth[key] || null,
        });
      }
    }
    return result;
  }, [releasesByMonth]);

  return (
    <DeferredSection minHeight={200}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 mb-6">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Release Cadence
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Shipping{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                every month
              </span>
            </h2>
            <p className="text-base text-slate-400 max-w-xl mx-auto">
              Consistent delivery cadence with monthly releases, quarterly major versions, and continuous security patches.
            </p>
          </ScrollReveal>

          <SectionChoreography pattern="stagger-wave" stagger={0.03}>
            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-15 gap-1.5 sm:gap-2">
              {timelineMonths.map((tm, i) => (
                <motion.div
                  key={tm.key}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.02, duration: 0.3 }}
                >
                  <div
                    className={`relative h-16 sm:h-20 rounded-lg border flex items-end justify-center pb-1 transition-all duration-300
                      ${
                        tm.data
                          ? tm.data.hasMajor
                            ? 'border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/15'
                            : 'border-cyan-400/20 bg-cyan-500/5 hover:bg-cyan-500/10'
                          : 'border-white/[0.04] bg-white/[0.01]'
                      }`}
                  >
                    {tm.data && (
                      <div className="absolute inset-x-0 top-2 flex flex-col items-center gap-0.5">
                        {tm.data.versions.map((v) => (
                          <span
                            key={v}
                            className={`text-[8px] font-bold ${tm.data!.hasMajor ? 'text-emerald-400' : 'text-cyan-400/70'}`}
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    {tm.month}
                  </span>
                  {(parseInt(tm.key.split('-')[1]) === 0) && (
                    <span className="text-[8px] text-slate-600 block">
                      {tm.year}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </SectionChoreography>

          <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-emerald-400/30 bg-emerald-500/10" />
              Major release
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-cyan-400/20 bg-cyan-500/5" />
              Minor release
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-white/[0.04] bg-white/[0.01]" />
              No release
            </div>
          </div>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Tag Breakdown Section ───────────────────────────────── */

function TagBreakdownSection() {
  const tagBreakdown = useMemo(() => {
    return ALL_TAGS.map((tag) => {
      const config = TAG_CONFIG[tag];
      const count = releases.reduce(
        (sum, r) => sum + r.changes.filter((c) => c.tag === tag).length,
        0,
      );
      return { tag, config, count };
    }).sort((a, b) => b.count - a.count);
  }, []);

  const maxCount = Math.max(...tagBreakdown.map((t) => t.count));

  return (
    <DeferredSection minHeight={300}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 mb-6">
              <Tag className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                By Category
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Change{' '}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                breakdown
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Distribution of changes across categories — reflecting our focus
              on features, security, and enterprise capabilities.
            </p>
          </ScrollReveal>

          <SectionChoreography pattern="cascade" stagger={0.06}>
            <div className="space-y-3">
              {tagBreakdown.map((item) => {
                const Icon = item.config.icon;
                const pct = Math.round((item.count / totalChanges) * 100);
                return (
                  <div
                    key={item.tag}
                    className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4
                      hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg border ${item.config.border} ${item.config.bg} flex items-center justify-center`}
                        >
                          <Icon className={`w-4 h-4 ${item.config.text}`} />
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {item.config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          {item.count}
                        </span>
                        <span className="text-xs text-slate-500">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: `rgba(${item.config.colorRgb}, 0.5)`,
                        }}
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${(item.count / maxCount) * 100}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.8,
                          ease: EASE_OUT_EXPO,
                          delay: 0.2,
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

/* ─── Version History Table ───────────────────────────────── */

function VersionHistoryTable() {
  return (
    <DeferredSection minHeight={400}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 mb-6">
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Version History
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Complete{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                release history
              </span>
            </h2>
          </ScrollReveal>

          <SectionChoreography pattern="cascade" stagger={0.04}>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr,auto,auto,auto] gap-4 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Version
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">
                  Date
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Changes
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">
                  Type
                </span>
              </div>

              {/* Table rows */}
              {releases.map((release, i) => (
                <div
                  key={release.version}
                  className={`group grid grid-cols-[1fr,auto,auto,auto] gap-4 px-5 py-3.5 items-center
                    transition-all duration-200 hover:bg-white/[0.03]
                    ${i < releases.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {release.version}
                    </span>
                    <span className="text-xs text-slate-500">
                      {release.codename}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {new Date(release.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-sm text-white font-medium text-center">
                    {release.changes.length}
                  </span>
                  <span className="hidden sm:block">
                    {release.isMajor ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-400/20 bg-emerald-500/10 text-emerald-400">
                        <Rocket className="w-2.5 h-2.5" />
                        Major
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/[0.08] bg-white/[0.03] text-slate-400">
                        <Package className="w-2.5 h-2.5" />
                        Minor
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </SectionChoreography>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Notable Milestones ──────────────────────────────────── */

const milestones = [
  {
    icon: Rocket,
    title: 'Platform Launch',
    date: 'January 2025',
    description:
      'FormaOS v1.0.0 Genesis launched with ISO 27001 framework pack and core compliance infrastructure.',
    accentRgb: '52,211,153',
  },
  {
    icon: Shield,
    title: 'Evidence Vault Shipped',
    date: 'August 2025',
    description:
      'SHA-256 cryptographic evidence verification with immutable chain-of-custody and version control.',
    accentRgb: '139,92,246',
  },
  {
    icon: Layers,
    title: '7 Framework Packs',
    date: 'January 2026',
    description:
      'Full coverage across ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS, NIST CSF, and CIS Controls.',
    accentRgb: '34,211,238',
  },
  {
    icon: Lock,
    title: 'Enterprise SSO & SCIM',
    date: 'February 2026',
    description:
      'SAML 2.0 SSO with Okta, Azure AD, and Google Workspace plus SCIM 2.0 automated provisioning.',
    accentRgb: '251,113,133',
  },
  {
    icon: Workflow,
    title: 'Automation Engine',
    date: 'February 2026',
    description:
      'Event-driven workflow automation with 12+ trigger types, conditional branching, and scheduled execution.',
    accentRgb: '59,130,246',
  },
  {
    icon: Eye,
    title: 'Real-Time Collaboration',
    date: 'March 2026',
    description:
      'Live presence indicators, real-time sync, and conflict resolution for team-based compliance work.',
    accentRgb: '245,158,11',
  },
];

function MilestonesSection() {
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
              <Milestone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Key Milestones
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              The journey from{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Genesis to Aurora
              </span>
            </h2>
            <p className="text-base text-slate-400 max-w-xl mx-auto">
              14 months of continuous development — from single-framework launch
              to enterprise compliance operating system.
            </p>
          </ScrollReveal>

          <SectionChoreography pattern="cascade" stagger={0.08}>
            <div className="relative">
              {/* Timeline spine */}
              <div className="absolute left-8 sm:left-1/2 sm:-translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-emerald-400/40 via-blue-400/20 to-amber-400/30" />

              <div className="space-y-6">
                {milestones.map((ms, i) => {
                  const MsIcon = ms.icon;
                  const isEven = i % 2 === 0;
                  return (
                    <div
                      key={ms.title}
                      className={`relative flex items-start gap-6 ${
                        isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'
                      }`}
                    >
                      <div
                        className="absolute left-8 sm:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 z-10"
                        style={{
                          borderColor: `rgba(${ms.accentRgb}, 0.6)`,
                          backgroundColor: `rgba(${ms.accentRgb}, 0.15)`,
                          boxShadow: `0 0 14px rgba(${ms.accentRgb}, 0.2)`,
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
                                borderColor: `rgba(${ms.accentRgb}, 0.2)`,
                                backgroundColor: `rgba(${ms.accentRgb}, 0.08)`,
                              }}
                            >
                              <MsIcon
                                className="w-5 h-5"
                                style={{ color: `rgba(${ms.accentRgb}, 1)` }}
                              />
                            </div>
                            <div>
                              <span
                                className="text-xs font-bold uppercase tracking-wider"
                                style={{ color: `rgba(${ms.accentRgb}, 0.6)` }}
                              >
                                {ms.date}
                              </span>
                              <h3 className="text-base font-semibold text-white mt-0.5">
                                {ms.title}
                              </h3>
                            </div>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {ms.description}
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

/* ─── Stats Section ───────────────────────────────────────── */

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
                Development velocity
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                14 months of continuous shipping — features, fixes, and enterprise capabilities delivered every month.
              </p>
            </ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {changelogStats.map((stat, i) => (
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

/* ─── Subscribe CTA ───────────────────────────────────────── */

function SubscribeCTA() {
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
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Stay Updated
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Never miss a{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                    release
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10">
                  Get notified when we ship new features, framework packs, and
                  platform improvements. No spam — just releases.
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
                    href="/features"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      border border-white/[0.12] bg-white/[0.04]
                      text-white font-semibold text-sm
                      hover:bg-white/[0.08] hover:border-white/[0.2]
                      transition-all duration-300"
                  >
                    Explore Features
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-slate-500">
                  {[
                    `${releases.length} releases shipped`,
                    `${totalChanges}+ changes delivered`,
                    'Monthly release cadence',
                    '14 months of development',
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

/* ─── Hero ────────────────────────────────────────────────── */

function ChangelogHero() {
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
          style={{ background: 'rgba(139,92,246,0.10)' }}
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
          style={{ background: 'rgba(34,211,238,0.06)' }}
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
          <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Changelog
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6"
        >
          Every change,
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
            shipped transparently
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {releases.length} releases, {totalChanges}+ changes, and 14 months of
          continuous development. See exactly what we shipped and when.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="flex flex-wrap justify-center gap-4 mb-10"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-400/15 bg-emerald-500/5 text-sm text-emerald-400">
            <GitMerge className="w-4 h-4" />
            Latest: {releases[0].version} {releases[0].codename}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-slate-400">
            <Calendar className="w-4 h-4" />
            {new Date(releases[0].date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE_OUT_EXPO }}
          className="flex flex-wrap justify-center gap-3"
        >
          {ALL_TAGS.map((tag) => {
            const config = TAG_CONFIG[tag];
            const Icon = config.icon;
            const count = releases.reduce(
              (sum, r) =>
                sum + r.changes.filter((c) => c.tag === tag).length,
              0,
            );
            return (
              <div
                key={tag}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-400"
              >
                <Icon className={`w-3 h-3 ${config.text}`} />
                {config.label}
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

/* ─── Main Component ──────────────────────────────────────── */

export default function ChangelogPageContent() {
  const [activeTag, setActiveTag] = useState<ChangeTag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReleases = useMemo(() => {
    let result = releases;

    if (activeTag) {
      result = result
        .map((r) => ({
          ...r,
          changes: r.changes.filter((c) => c.tag === activeTag),
        }))
        .filter((r) => r.changes.length > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result
        .map((r) => ({
          ...r,
          changes: r.changes.filter(
            (c) =>
              c.text.toLowerCase().includes(q) ||
              c.detail?.toLowerCase().includes(q),
          ),
        }))
        .filter(
          (r) =>
            r.changes.length > 0 ||
            r.version.toLowerCase().includes(q) ||
            r.codename.toLowerCase().includes(q),
        );
    }

    return result;
  }, [activeTag, searchQuery]);

  // Group releases by year for year dividers
  const releasesWithYears = useMemo(() => {
    const items: { type: 'year'; year: string }[] | { type: 'release'; release: ChangelogRelease; index: number }[] = [];
    const result: Array<
      | { type: 'year'; year: string }
      | { type: 'release'; release: ChangelogRelease; index: number }
    > = [];
    let lastYear = '';

    filteredReleases.forEach((release, i) => {
      const year = release.date.split('-')[0];
      if (year !== lastYear) {
        result.push({ type: 'year', year });
        lastYear = year;
      }
      result.push({ type: 'release', release, index: i });
    });

    return result;
  }, [filteredReleases]);

  return (
    <MarketingPageShell>
      <ChangelogHero />

      <VisualDivider gradient />

      <StatsSection />

      <VisualDivider />

      <ReleaseTimelineVisual />

      <VisualDivider />

      {/* Release Timeline */}
      <DeferredSection minHeight={800}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-6"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Release{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                  timeline
                </span>
              </h2>
              <p className="text-base text-slate-400 max-w-xl mx-auto">
                Every version, every change, with full details. Filter by
                category or search for specific changes.
              </p>
            </ScrollReveal>

            <FilterBar
              activeTag={activeTag}
              onSelect={setActiveTag}
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
            />

            {/* Timeline spine */}
            <div className="relative pl-8 sm:pl-10">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-400/30 via-white/10 to-violet-400/20" />

              <div className="space-y-6">
                {releasesWithYears.map((item, i) => {
                  if (item.type === 'year') {
                    return <YearDivider key={`year-${item.year}`} year={item.year} />;
                  }
                  return (
                    <ReleaseCard
                      key={item.release.version}
                      release={item.release}
                      index={item.index}
                      isLatest={item.index === 0 && !activeTag && !searchQuery}
                    />
                  );
                })}
              </div>

              {filteredReleases.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-sm text-slate-500">
                    No releases match your current filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      <TagBreakdownSection />

      <VisualDivider />

      <VersionHistoryTable />

      <VisualDivider />

      <MilestonesSection />

      <VisualDivider />

      <SubscribeCTA />
    </MarketingPageShell>
  );
}

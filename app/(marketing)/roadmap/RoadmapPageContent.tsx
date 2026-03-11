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
  Loader2,
  Calendar,
  Compass,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Shield,
  Globe,
  Link2,
  Server,
  Brain,
  Smartphone,
  Users,
  FileSearch,
  Zap,
  Eye,
  Clock,
  Target,
  Share2,
  BarChart3,
  Lock,
  Layers,
  Workflow,
  Bell,
  MessageSquare,
  GitBranch,
  Star,
  Map,
  Flag,
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

/* ─── Status Types ────────────────────────────────────────── */

type RoadmapStatus = 'shipped' | 'in-progress' | 'planned' | 'exploring';

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  colorRgb: string;
  bg: string;
  border: string;
  text: string;
  dotColor: string;
  description: string;
}

const STATUS_CONFIG: Record<RoadmapStatus, StatusConfig> = {
  shipped: {
    label: 'Shipped',
    icon: CheckCircle2,
    colorRgb: '52,211,153',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/20',
    text: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    description: 'Live in production and available to all users.',
  },
  'in-progress': {
    label: 'In Progress',
    icon: Loader2,
    colorRgb: '34,211,238',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-400/20',
    text: 'text-cyan-400',
    dotColor: 'bg-cyan-400',
    description: 'Actively under development with a target release date.',
  },
  planned: {
    label: 'Planned',
    icon: Calendar,
    colorRgb: '139,92,246',
    bg: 'bg-violet-500/10',
    border: 'border-violet-400/20',
    text: 'text-violet-400',
    dotColor: 'bg-violet-400',
    description: 'Scoped and scheduled for an upcoming development cycle.',
  },
  exploring: {
    label: 'Exploring',
    icon: Compass,
    colorRgb: '245,158,11',
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/20',
    text: 'text-amber-400',
    dotColor: 'bg-amber-400',
    description: 'Under evaluation based on customer demand and feasibility.',
  },
};

const ALL_STATUSES: RoadmapStatus[] = [
  'shipped',
  'in-progress',
  'planned',
  'exploring',
];

/* ─── Category Config ─────────────────────────────────────── */

type RoadmapCategory =
  | 'Compliance'
  | 'Security'
  | 'Integrations'
  | 'Platform'
  | 'Reporting'
  | 'Automation'
  | 'Collaboration';

interface CategoryConfig {
  icon: LucideIcon;
  colorRgb: string;
  bg: string;
  border: string;
  text: string;
}

const CATEGORY_CONFIG: Record<RoadmapCategory, CategoryConfig> = {
  Compliance: {
    icon: Shield,
    colorRgb: '52,211,153',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/20',
    text: 'text-emerald-400',
  },
  Security: {
    icon: Lock,
    colorRgb: '251,113,133',
    bg: 'bg-rose-500/10',
    border: 'border-rose-400/20',
    text: 'text-rose-400',
  },
  Integrations: {
    icon: Link2,
    colorRgb: '59,130,246',
    bg: 'bg-blue-500/10',
    border: 'border-blue-400/20',
    text: 'text-blue-400',
  },
  Platform: {
    icon: Layers,
    colorRgb: '34,211,238',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-400/20',
    text: 'text-cyan-400',
  },
  Reporting: {
    icon: BarChart3,
    colorRgb: '139,92,246',
    bg: 'bg-violet-500/10',
    border: 'border-violet-400/20',
    text: 'text-violet-400',
  },
  Automation: {
    icon: Workflow,
    colorRgb: '245,158,11',
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/20',
    text: 'text-amber-400',
  },
  Collaboration: {
    icon: MessageSquare,
    colorRgb: '59,130,246',
    bg: 'bg-blue-500/10',
    border: 'border-blue-400/20',
    text: 'text-blue-400',
  },
};

/* ─── Roadmap Data ────────────────────────────────────────── */

interface RoadmapItem {
  title: string;
  description: string;
  longDescription: string;
  status: RoadmapStatus;
  category: RoadmapCategory;
  quarter: string;
  impact: 'high' | 'medium';
  capabilities?: string[];
}

const roadmapItems: RoadmapItem[] = [
  {
    title: 'Multi-Region Data Residency',
    description:
      'Deploy compliance data to US, EU, and APAC regions with full jurisdictional isolation.',
    longDescription:
      'Infrastructure-level data residency supporting US-East, EU-West, and APAC-Sydney regions. Each region operates with independent encryption keys, isolated database clusters, and region-specific backup policies. Organizations can configure per-workspace residency preferences to satisfy GDPR, Privacy Act 1988, and sector-specific data sovereignty requirements.',
    status: 'in-progress',
    category: 'Security',
    quarter: 'Q1 2026',
    impact: 'high',
    capabilities: [
      'US, EU, and APAC region support',
      'Per-workspace residency configuration',
      'Independent encryption keys per region',
      'Region-specific backup policies',
    ],
  },
  {
    title: 'AI-Assisted Control Mapping',
    description:
      'Machine learning model suggesting control mappings across frameworks based on semantic similarity.',
    longDescription:
      'A fine-tuned language model that analyzes control descriptions across frameworks and suggests evidence mapping relationships. Reduces manual mapping effort by 70% for organizations activating new frameworks. Suggestions include confidence scores and human-review workflows to maintain audit integrity. The model trains on anonymized, aggregated mapping patterns across the FormaOS customer base.',
    status: 'in-progress',
    category: 'Compliance',
    quarter: 'Q1 2026',
    impact: 'high',
    capabilities: [
      'Semantic similarity scoring',
      'Cross-framework evidence suggestions',
      'Confidence-scored recommendations',
      'Human-in-the-loop review workflow',
    ],
  },
  {
    title: 'Mobile Companion App',
    description:
      'iOS and Android app for evidence capture, task management, and compliance alerts on the go.',
    longDescription:
      'Native mobile application for compliance teams working in the field. Camera-based evidence capture with automatic SHA-256 hashing, offline task management with sync-on-connect, push notification support for compliance alerts, and biometric authentication for secure access. Designed for NDIS care workers, facility auditors, and distributed compliance teams.',
    status: 'in-progress',
    category: 'Platform',
    quarter: 'Q2 2026',
    impact: 'high',
    capabilities: [
      'Camera evidence capture with auto-hashing',
      'Offline task management with sync',
      'Push notifications for alerts',
      'Biometric authentication',
    ],
  },
  {
    title: 'Advanced Reporting Engine',
    description:
      'Custom report builder with drag-and-drop widgets, scheduled delivery, and multi-format export.',
    longDescription:
      'A comprehensive reporting engine that goes beyond pre-built templates. Build custom compliance reports using drag-and-drop widgets: charts, tables, score gauges, evidence lists, and comment threads. Schedule reports for daily, weekly, or monthly delivery to stakeholder distribution lists. Export in PDF, XLSX, CSV, and PowerPoint formats with white-label branding support.',
    status: 'planned',
    category: 'Reporting',
    quarter: 'Q2 2026',
    impact: 'high',
    capabilities: [
      'Drag-and-drop report builder',
      'Scheduled delivery to stakeholders',
      'PDF, XLSX, CSV, PPTX export',
      'White-label branding support',
    ],
  },
  {
    title: 'SAML 2.0 + OIDC Hybrid SSO',
    description:
      'Support both SAML 2.0 and OpenID Connect for maximum identity provider compatibility.',
    longDescription:
      'Extend enterprise SSO beyond SAML 2.0 to include OpenID Connect (OIDC) support. Organizations can configure either protocol based on their identity provider capabilities. OIDC support enables seamless integration with Auth0, Cognito, Keycloak, and cloud-native identity platforms. Hybrid mode allows different authentication flows for different user populations within the same organization.',
    status: 'planned',
    category: 'Security',
    quarter: 'Q2 2026',
    impact: 'medium',
    capabilities: [
      'OpenID Connect protocol support',
      'Auth0, Cognito, Keycloak integration',
      'Hybrid SAML + OIDC per organization',
      'Configurable claim mapping',
    ],
  },
  {
    title: 'Evidence Auto-Collection via API',
    description:
      'Scheduled API pulls from connected tools to automatically collect and update compliance evidence.',
    longDescription:
      'Configure automatic evidence collection from integrated tools on a recurring schedule. Pull configuration snapshots from AWS, Azure, and GCP. Collect access review exports from Okta and Azure AD. Retrieve vulnerability scan reports from Qualys and Tenable. Each collection run produces versioned evidence with SHA-256 verification and links to the source system for traceability.',
    status: 'planned',
    category: 'Automation',
    quarter: 'Q2 2026',
    impact: 'high',
    capabilities: [
      'Scheduled API-based evidence pulls',
      'AWS, Azure, GCP config snapshots',
      'Vulnerability scan report collection',
      'Versioned with SHA-256 verification',
    ],
  },
  {
    title: 'Compliance Copilot (AI Assistant)',
    description:
      'Context-aware AI assistant for compliance guidance, gap analysis, and evidence review.',
    longDescription:
      'An AI assistant embedded within FormaOS that understands your compliance context. Ask natural language questions about control requirements, get gap analysis suggestions, receive evidence review recommendations, and generate first-draft responses to auditor inquiries. The assistant has read-only access to your compliance data and never stores conversation history externally.',
    status: 'planned',
    category: 'Compliance',
    quarter: 'Q3 2026',
    impact: 'high',
    capabilities: [
      'Natural language compliance Q&A',
      'Gap analysis recommendations',
      'Evidence review suggestions',
      'Auditor inquiry draft responses',
    ],
  },
  {
    title: 'Continuous Control Monitoring',
    description:
      'Real-time monitoring of technical controls with automated drift detection and alerting.',
    longDescription:
      'Move from periodic compliance checks to continuous monitoring. Agent-based and agentless monitoring of technical controls: firewall configurations, encryption settings, access control lists, and patch levels. Detect drift from compliant baselines in real-time with automated alerting and remediation playbook suggestions. Integrates with cloud provider APIs for infrastructure-as-code validation.',
    status: 'planned',
    category: 'Compliance',
    quarter: 'Q3 2026',
    impact: 'high',
    capabilities: [
      'Real-time technical control monitoring',
      'Configuration drift detection',
      'Automated remediation playbooks',
      'Cloud infrastructure validation',
    ],
  },
  {
    title: 'Custom Framework Builder',
    description:
      'Create bespoke compliance frameworks with custom controls, evidence mappings, and scoring weights.',
    longDescription:
      'For organizations with regulatory requirements not covered by standard framework packs. Build custom frameworks from scratch or fork existing packs. Define custom control hierarchies, evidence requirements, scoring weights, and review cadences. Custom frameworks participate fully in cross-framework mapping, unified scoring, and audit export capabilities.',
    status: 'planned',
    category: 'Compliance',
    quarter: 'Q3 2026',
    impact: 'medium',
    capabilities: [
      'Custom control hierarchy builder',
      'Configurable scoring weights',
      'Cross-framework mapping support',
      'Fork and extend existing packs',
    ],
  },
  {
    title: 'HRIS Integration Hub',
    description:
      'Connect BambooHR, Workday, and Rippling for automated personnel compliance tracking.',
    longDescription:
      'Bi-directional integration with major HRIS platforms. Automatically sync employee lifecycle events — onboarding, role changes, departures — with compliance control ownership and access review requirements. Map HRIS organizational structures to FormaOS team hierarchies. Track personnel compliance obligations like background check status, training completion, and NDA execution.',
    status: 'exploring',
    category: 'Integrations',
    quarter: 'Q3 2026',
    impact: 'medium',
    capabilities: [
      'BambooHR, Workday, Rippling support',
      'Employee lifecycle sync',
      'Training compliance tracking',
      'Organizational structure mapping',
    ],
  },
  {
    title: 'Multi-Tenant Audit Portal',
    description:
      'Read-only portal for external auditors with time-limited access and scoped visibility.',
    longDescription:
      'Provide external auditors with temporary, read-only access to compliance data through a dedicated portal. Configure visibility scope per auditor: specific frameworks, date ranges, and entity types. Auditors can review evidence, download audit packets, and leave comments — all tracked in the audit trail. Access automatically expires after the configured audit window.',
    status: 'exploring',
    category: 'Platform',
    quarter: 'Q3 2026',
    impact: 'medium',
    capabilities: [
      'Time-limited auditor access',
      'Scoped visibility configuration',
      'In-portal evidence review',
      'Automated access expiration',
    ],
  },
  {
    title: 'Vendor Risk Management',
    description:
      'Assess, monitor, and track third-party vendor compliance posture with questionnaires and evidence collection.',
    longDescription:
      'Extend compliance management beyond your organization to your vendor ecosystem. Send standardized or custom compliance questionnaires to vendors, collect and verify their evidence artifacts, monitor vendor compliance posture over time, and generate vendor risk reports. Integrates with procurement workflows for vendor onboarding compliance gates.',
    status: 'exploring',
    category: 'Compliance',
    quarter: 'Q4 2026',
    impact: 'high',
    capabilities: [
      'Vendor compliance questionnaires',
      'Third-party evidence collection',
      'Vendor risk scoring and monitoring',
      'Procurement compliance gates',
    ],
  },
  {
    title: 'GRC API (Public)',
    description:
      'RESTful API with full CRUD operations, webhooks, and SDK support for custom integrations.',
    longDescription:
      'A comprehensive public API enabling organizations to build custom integrations, automation workflows, and reporting pipelines. Full CRUD operations across all entity types: controls, evidence, tasks, incidents, and audit logs. Webhook subscriptions for real-time event streaming. TypeScript and Python SDKs with code generation from OpenAPI specification. Rate limiting, API key management, and usage analytics included.',
    status: 'exploring',
    category: 'Platform',
    quarter: 'Q4 2026',
    impact: 'high',
    capabilities: [
      'Full CRUD across all entities',
      'Webhook event streaming',
      'TypeScript and Python SDKs',
      'OpenAPI specification',
    ],
  },
  {
    title: 'SOC 2 Type II Automation',
    description:
      'Automated evidence collection for SOC 2 Type II continuous monitoring requirements.',
    longDescription:
      'Purpose-built automation for SOC 2 Type II audit preparation. Continuous evidence collection across the observation period with automated evidence freshness tracking. Generates Type II-specific evidence bundles including operating effectiveness samples, monitoring logs, and control performance metrics over the audit window.',
    status: 'exploring',
    category: 'Automation',
    quarter: 'Q4 2026',
    impact: 'high',
    capabilities: [
      'Continuous observation period tracking',
      'Automated sample collection',
      'Operating effectiveness evidence',
      'Type II evidence bundle export',
    ],
  },
  {
    title: 'Privacy Impact Assessments',
    description:
      'Structured DPIA and PIA workflows with template library and stakeholder review chains.',
    longDescription:
      'Built-in privacy impact assessment workflows supporting GDPR Data Protection Impact Assessments (DPIA) and general Privacy Impact Assessments (PIA). Template library for common processing activities, stakeholder review and approval chains, risk scoring based on data sensitivity and processing scope, and integration with the evidence vault for assessment artifact management.',
    status: 'exploring',
    category: 'Compliance',
    quarter: 'Q4 2026',
    impact: 'medium',
    capabilities: [
      'DPIA and PIA workflow templates',
      'Stakeholder review chains',
      'Risk scoring for data processing',
      'Evidence vault integration',
    ],
  },
  {
    title: 'Real-Time Compliance Dashboard',
    description:
      'Live dashboard with WebSocket-powered updates, customizable widgets, and TV mode.',
    longDescription:
      'A real-time compliance dashboard that updates instantly as compliance state changes. Drag-and-drop widget layout with configurable data sources. TV mode for compliance operations centers with auto-rotating views. Shareable dashboard links with configurable access permissions. WebSocket-powered real-time updates with no manual refresh required.',
    status: 'in-progress',
    category: 'Reporting',
    quarter: 'Q1 2026',
    impact: 'medium',
    capabilities: [
      'WebSocket real-time updates',
      'Drag-and-drop widget layout',
      'TV mode for operations centers',
      'Shareable dashboard links',
    ],
  },
  {
    title: 'GitHub & GitLab Integration',
    description:
      'Pull request compliance checks, code review evidence collection, and SDLC compliance tracking.',
    longDescription:
      'Integrate FormaOS with your software development lifecycle. GitHub and GitLab connectors that surface compliance status in pull request checks, automatically collect code review evidence for security controls, and track SDLC compliance requirements like code scanning, dependency review, and release approval workflows.',
    status: 'planned',
    category: 'Integrations',
    quarter: 'Q2 2026',
    impact: 'medium',
    capabilities: [
      'PR compliance status checks',
      'Code review evidence collection',
      'Dependency scanning integration',
      'Release approval workflow tracking',
    ],
  },
  {
    title: 'Compliance Training Module',
    description:
      'Built-in training management with assignment, tracking, and certification evidence collection.',
    longDescription:
      'Manage compliance training requirements directly within FormaOS. Assign training modules to team members based on role and compliance obligations. Track completion status, generate certificates, and automatically link training evidence to relevant controls. Support for external LMS integration via SCORM and xAPI standards.',
    status: 'exploring',
    category: 'Collaboration',
    quarter: 'Q4 2026',
    impact: 'medium',
    capabilities: [
      'Role-based training assignment',
      'Completion tracking and certificates',
      'SCORM and xAPI LMS integration',
      'Auto-link training to controls',
    ],
  },
  {
    title: 'AWS Config Integration',
    description:
      'Automated compliance monitoring for AWS infrastructure using Config rules and conformance packs.',
    longDescription:
      'Native integration with AWS Config for continuous infrastructure compliance monitoring. Map AWS Config rules to FormaOS controls, automatically collect Config evaluation results as compliance evidence, and trigger alerts when resources fall out of compliance. Support for AWS conformance packs aligned to ISO 27001, SOC 2, and HIPAA frameworks.',
    status: 'planned',
    category: 'Integrations',
    quarter: 'Q3 2026',
    impact: 'high',
    capabilities: [
      'AWS Config rule mapping to controls',
      'Automated evidence collection',
      'Conformance pack alignment',
      'Real-time non-compliance alerts',
    ],
  },
  {
    title: 'Bulk Import & Migration Tools',
    description:
      'CSV/XLSX import wizards for controls, evidence, and organizational data with field mapping.',
    longDescription:
      'Comprehensive data migration tools for organizations transitioning from spreadsheets, other GRC platforms, or custom systems. Interactive field mapping wizards with preview and validation. Support for CSV, XLSX, and JSON import formats. Incremental import support for ongoing data feeds. Rollback capability for imports that need reversal.',
    status: 'shipped',
    category: 'Platform',
    quarter: 'Q1 2026',
    impact: 'medium',
    capabilities: [
      'Interactive field mapping wizard',
      'CSV, XLSX, JSON format support',
      'Preview and validation before import',
      'Import rollback capability',
    ],
  },
  {
    title: 'Audit Readiness Score',
    description:
      'Aggregated audit readiness metric with actionable recommendations and timeline estimates.',
    longDescription:
      'A composite score that evaluates your readiness for an upcoming audit based on evidence completeness, control maturity, open findings, and documentation freshness. Actionable recommendations prioritized by impact show exactly what to address first. Timeline estimates predict how many days of effort remain before achieving audit-ready status.',
    status: 'shipped',
    category: 'Reporting',
    quarter: 'Q1 2026',
    impact: 'high',
    capabilities: [
      'Composite readiness scoring',
      'Prioritized recommendations',
      'Timeline-to-ready estimates',
      'Evidence gap identification',
    ],
  },
  {
    title: 'Notification Rules Engine',
    description:
      'Conditional notification routing with escalation chains, digest batching, and quiet hours.',
    longDescription:
      'Advanced notification rules engine that routes compliance alerts based on configurable conditions. Define escalation chains with time-based triggers — if an alert is not acknowledged within N hours, escalate to the next level. Digest batching groups non-urgent notifications into configurable summary windows. Quiet hours prevent non-critical notifications during off-hours.',
    status: 'shipped',
    category: 'Automation',
    quarter: 'Q1 2026',
    impact: 'medium',
    capabilities: [
      'Conditional routing rules',
      'Time-based escalation chains',
      'Smart digest batching',
      'Quiet hours configuration',
    ],
  },
];

/* ─── Computed Stats ──────────────────────────────────────── */

const shippedCount = roadmapItems.filter(
  (i) => i.status === 'shipped',
).length;
const inProgressCount = roadmapItems.filter(
  (i) => i.status === 'in-progress',
).length;
const plannedCount = roadmapItems.filter(
  (i) => i.status === 'planned',
).length;
const exploringCount = roadmapItems.filter(
  (i) => i.status === 'exploring',
).length;

const roadmapStats = [
  { value: String(roadmapItems.length), label: 'Total Items', suffix: '' },
  { value: String(shippedCount), label: 'Shipped', suffix: '' },
  { value: String(inProgressCount), label: 'In Progress', suffix: '' },
  { value: String(plannedCount), label: 'Planned', suffix: '' },
  { value: String(exploringCount), label: 'Exploring', suffix: '' },
  { value: '4', label: 'Quarters Ahead', suffix: '' },
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

/* ─── Status Badge ────────────────────────────────────────── */

function StatusBadge({
  status,
  size = 'sm',
}: {
  status: RoadmapStatus;
  size?: 'sm' | 'md';
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider border ${config.bg} ${config.border} ${config.text}
        ${size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'}`}
    >
      {status === 'in-progress' ? (
        <Loader2 className={`${size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5'} animate-spin`} />
      ) : (
        <Icon className={`${size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5'}`} />
      )}
      {config.label}
    </span>
  );
}

/* ─── Roadmap Card ────────────────────────────────────────── */

function RoadmapCard({
  item,
  index,
}: {
  item: RoadmapItem;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = STATUS_CONFIG[item.status];
  const catConfig = CATEGORY_CONFIG[item.category];
  const CatIcon = catConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.5,
        delay: index * 0.04,
        ease: EASE_OUT_EXPO,
      }}
      className="group relative"
    >
      <div
        className={`relative rounded-2xl border bg-white/[0.02] p-5 sm:p-6
          transition-all duration-300 cursor-pointer
          hover:bg-white/[0.04]
          ${
            item.status === 'in-progress'
              ? `border-cyan-400/15 hover:border-cyan-400/25 hover:shadow-[0_0_40px_rgba(34,211,238,0.06)]`
              : item.status === 'shipped'
                ? `border-emerald-400/10 hover:border-emerald-400/20 hover:shadow-[0_0_40px_rgba(52,211,153,0.05)]`
                : `border-white/[0.06] hover:border-white/[0.12]`
          }`}
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
        {/* Hover glow */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, rgba(${statusConfig.colorRgb}, 0.06), transparent 70%)`,
          }}
        />

        {/* In-progress pulse ring */}
        {item.status === 'in-progress' && (
          <div className="absolute -top-px -right-px">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400/80" />
            </span>
          </div>
        )}

        {/* Header */}
        <div className="relative flex items-start gap-3 mb-3">
          <div
            className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${catConfig.border} ${catConfig.bg}`}
          >
            <CatIcon className={`w-5 h-5 ${catConfig.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-white leading-snug">
                {item.title}
              </h3>
              <StatusBadge status={item.status} />
              {item.impact === 'high' && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-amber-400/20 bg-amber-500/10 text-amber-400">
                  High Impact
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {item.description}
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

        {/* Meta row */}
        <div className="relative flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {item.quarter}
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full`}
              style={{ backgroundColor: `rgba(${catConfig.colorRgb}, 0.6)` }}
            />
            {item.category}
          </div>
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
              <div className="pt-4 mt-4 border-t border-white/[0.06]">
                <p className="text-sm text-slate-300 leading-relaxed mb-5">
                  {item.longDescription}
                </p>
                {item.capabilities && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {item.capabilities.map((cap, ci) => (
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
                          className="w-3.5 h-3.5 mt-0.5 shrink-0"
                          style={{
                            color: `rgba(${statusConfig.colorRgb}, 0.7)`,
                          }}
                        />
                        <span className="text-xs text-slate-300">{cap}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Status Filter Bar ───────────────────────────────────── */

function StatusFilterBar({
  activeStatus,
  onSelect,
  activeCategory,
  onSelectCategory,
}: {
  activeStatus: RoadmapStatus | null;
  onSelect: (s: RoadmapStatus | null) => void;
  activeCategory: RoadmapCategory | null;
  onSelectCategory: (c: RoadmapCategory | null) => void;
}) {
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_STATUSES.forEach((s) => {
      counts[s] = roadmapItems.filter((i) => i.status === s).length;
    });
    return counts;
  }, []);

  return (
    <ScrollReveal variant="fadeUp" range={[0, 0.3]}>
      <div className="space-y-4 mb-12">
        {/* Status filters */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => onSelect(null)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 border
              ${
                activeStatus === null
                  ? 'bg-white/[0.08] border-white/[0.15] text-white'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            All Items
            <span className="ml-1.5 text-slate-500">
              {roadmapItems.length}
            </span>
          </button>
          {ALL_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            return (
              <button
                key={status}
                onClick={() => onSelect(status)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 border
                  ${
                    activeStatus === status
                      ? `bg-white/[0.08] border-white/[0.15] text-white shadow-[0_0_20px_rgba(${config.colorRgb},0.1)]`
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                {config.label}
                <span className="text-slate-500">{statusCounts[status]}</span>
              </button>
            );
          })}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300 border
              ${
                activeCategory === null
                  ? 'bg-white/[0.06] border-white/[0.12] text-white'
                  : 'bg-white/[0.01] border-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
              }`}
          >
            All Categories
          </button>
          {(Object.keys(CATEGORY_CONFIG) as RoadmapCategory[]).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = config.icon;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300 border
                  ${
                    activeCategory === cat
                      ? `bg-white/[0.06] border-white/[0.12] text-white`
                      : 'bg-white/[0.01] border-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                  }`}
              >
                <Icon className="w-3 h-3" />
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ─── Quarter Timeline Visual ─────────────────────────────── */

function QuarterTimeline() {
  const quarters = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];
  const currentQuarter = 'Q1 2026';

  const quarterData = useMemo(() => {
    return quarters.map((q) => {
      const items = roadmapItems.filter((i) => i.quarter === q);
      const shipped = items.filter((i) => i.status === 'shipped').length;
      const inProgress = items.filter(
        (i) => i.status === 'in-progress',
      ).length;
      const planned = items.filter((i) => i.status === 'planned').length;
      const exploring = items.filter(
        (i) => i.status === 'exploring',
      ).length;
      return { quarter: q, total: items.length, shipped, inProgress, planned, exploring };
    });
  }, []);

  return (
    <DeferredSection minHeight={300}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 mb-6">
              <Map className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Timeline
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Quarterly{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                delivery plan
              </span>
            </h2>
            <p className="text-base text-slate-400 max-w-xl mx-auto">
              Our development roadmap organized by quarter with status
              breakdown for each delivery window.
            </p>
          </ScrollReveal>

          <SectionChoreography pattern="stagger-wave" stagger={0.08}>
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-emerald-400/20 via-cyan-400/20 to-violet-400/20 hidden lg:block" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quarterData.map((qd, i) => {
                  const isCurrent = qd.quarter === currentQuarter;
                  return (
                    <div
                      key={qd.quarter}
                      className={`relative rounded-2xl border p-5 transition-all duration-300
                        ${
                          isCurrent
                            ? 'border-cyan-400/20 bg-cyan-500/[0.04] hover:bg-cyan-500/[0.06] hover:border-cyan-400/30'
                            : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]'
                        }`}
                    >
                      {isCurrent && (
                        <div className="absolute -top-px -right-px">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-50" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400/80" />
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">
                          {qd.quarter}
                        </h3>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-400/20 bg-cyan-500/10">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="text-3xl font-bold text-white mb-4">
                        {qd.total}
                        <span className="text-sm text-slate-500 font-normal ml-1">
                          items
                        </span>
                      </div>

                      <div className="space-y-2">
                        {qd.shipped > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              Shipped
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {qd.shipped}
                            </span>
                          </div>
                        )}
                        {qd.inProgress > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-cyan-400">
                              <span className="w-2 h-2 rounded-full bg-cyan-400" />
                              In Progress
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {qd.inProgress}
                            </span>
                          </div>
                        )}
                        {qd.planned > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-violet-400">
                              <span className="w-2 h-2 rounded-full bg-violet-400" />
                              Planned
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {qd.planned}
                            </span>
                          </div>
                        )}
                        {qd.exploring > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-amber-400">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              Exploring
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {qd.exploring}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4 h-1.5 rounded-full bg-white/[0.04] overflow-hidden flex">
                        {qd.shipped > 0 && (
                          <motion.div
                            className="h-full bg-emerald-400/60"
                            initial={{ width: 0 }}
                            whileInView={{
                              width: `${(qd.shipped / qd.total) * 100}%`,
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                          />
                        )}
                        {qd.inProgress > 0 && (
                          <motion.div
                            className="h-full bg-cyan-400/60"
                            initial={{ width: 0 }}
                            whileInView={{
                              width: `${(qd.inProgress / qd.total) * 100}%`,
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                          />
                        )}
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

/* ─── Category Breakdown ──────────────────────────────────── */

function CategoryBreakdown() {
  const breakdown = useMemo(() => {
    return (Object.keys(CATEGORY_CONFIG) as RoadmapCategory[]).map((cat) => {
      const config = CATEGORY_CONFIG[cat];
      const items = roadmapItems.filter((i) => i.category === cat);
      const shipped = items.filter((i) => i.status === 'shipped').length;
      return {
        category: cat,
        config,
        total: items.length,
        shipped,
      };
    }).filter((b) => b.total > 0).sort((a, b) => b.total - a.total);
  }, []);

  const maxTotal = Math.max(...breakdown.map((b) => b.total));

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
              <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                Investment Areas
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Where we&apos;re{' '}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                investing
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Development effort distributed across categories — reflecting
              customer demand, compliance landscape, and platform maturity.
            </p>
          </ScrollReveal>

          <SectionChoreography pattern="cascade" stagger={0.06}>
            <div className="space-y-3">
              {breakdown.map((item) => {
                const Icon = item.config.icon;
                return (
                  <div
                    key={item.category}
                    className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4
                      hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg border ${item.config.border} ${item.config.bg} flex items-center justify-center`}
                        >
                          <Icon
                            className={`w-4 h-4 ${item.config.text}`}
                          />
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-400">
                          {item.shipped} shipped
                        </span>
                        <span className="text-slate-500">/</span>
                        <span className="text-white font-semibold">
                          {item.total} total
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full flex">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: `rgba(52,211,153, 0.5)`,
                          }}
                          initial={{ width: 0 }}
                          whileInView={{
                            width: `${(item.shipped / maxTotal) * 100}%`,
                          }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.6,
                            ease: EASE_OUT_EXPO,
                          }}
                        />
                        <motion.div
                          className="h-full"
                          style={{
                            backgroundColor: `rgba(${item.config.colorRgb}, 0.3)`,
                          }}
                          initial={{ width: 0 }}
                          whileInView={{
                            width: `${((item.total - item.shipped) / maxTotal) * 100}%`,
                          }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.6,
                            delay: 0.1,
                            ease: EASE_OUT_EXPO,
                          }}
                        />
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

/* ─── Transparency Commitment ─────────────────────────────── */

const transparencyItems = [
  {
    icon: Eye,
    title: 'Public Roadmap',
    description:
      'Our roadmap is publicly visible with real-time status updates. No hidden backlog, no surprise deprecations.',
  },
  {
    icon: MessageSquare,
    title: 'Customer-Driven Priorities',
    description:
      'Feature prioritization is informed by customer requests, audit findings, and compliance landscape changes.',
  },
  {
    icon: Calendar,
    title: 'Monthly Release Cadence',
    description:
      'We ship every month with predictable release windows. Changelogs document every change transparently.',
  },
  {
    icon: Shield,
    title: 'Security-First Development',
    description:
      'Security patches ship within 72 hours of discovery. Every release passes automated security scanning.',
  },
  {
    icon: GitBranch,
    title: 'Semantic Versioning',
    description:
      'We follow SemVer strictly. Breaking changes only in major versions with migration guides and extended support.',
  },
  {
    icon: Bell,
    title: 'Proactive Communication',
    description:
      'Release notes, breaking change warnings, and deprecation notices delivered well in advance via multiple channels.',
  },
];

function TransparencySection() {
  return (
    <DeferredSection minHeight={400}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 mb-6">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Our Commitment
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Built with{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                transparency
              </span>
            </h2>
            <p className="text-base text-slate-400 max-w-xl mx-auto">
              How we plan, build, and ship — openly, predictably, and with
              your compliance requirements driving every decision.
            </p>
          </ScrollReveal>

          <SectionChoreography
            pattern="stagger-wave"
            stagger={0.05}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {transparencyItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6
                    hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl border border-emerald-400/20 bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
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
                Roadmap at a glance
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Where we stand today and what&apos;s coming across the next four
                quarters of development.
              </p>
            </ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {roadmapStats.map((stat, i) => (
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

/* ─── Feature Request CTA ─────────────────────────────────── */

function FeatureRequestCTA() {
  return (
    <DeferredSection minHeight={350}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.08), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.06), transparent 50%)',
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
                    Shape the Product
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Have a feature{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                    request?
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10">
                  Our roadmap is shaped by customer needs. Let us know what
                  would make FormaOS work better for your compliance program.
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
                  <a
                    href="mailto:support@formaos.com?subject=Feature%20Request"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      border border-white/[0.12] bg-white/[0.04]
                      text-white font-semibold text-sm
                      hover:bg-white/[0.08] hover:border-white/[0.2]
                      transition-all duration-300"
                  >
                    Submit Feature Request
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-slate-500">
                  {[
                    'Customer-driven roadmap',
                    'Monthly release cadence',
                    'Public progress tracking',
                    'Transparent development',
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

function RoadmapHero() {
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
          style={{ background: 'rgba(34,211,238,0.12)' }}
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
          style={{ background: 'rgba(52,211,153,0.06)' }}
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
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 mb-8"
        >
          <Map className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            Product Roadmap
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6"
        >
          Where FormaOS is
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            headed next
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {roadmapItems.length} items across {Object.keys(CATEGORY_CONFIG).length} categories.
          See what we&apos;ve shipped, what we&apos;re building, and what&apos;s
          coming next — publicly and transparently.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="flex flex-wrap justify-center gap-3"
        >
          {ALL_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const count = roadmapItems.filter(
              (i) => i.status === status,
            ).length;
            return (
              <div
                key={status}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${config.border} ${config.bg} text-sm`}
              >
                <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                <span className={config.text}>{config.label}</span>
                <span className="text-white font-semibold">{count}</span>
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

export default function RoadmapPageContent() {
  const [activeStatus, setActiveStatus] = useState<RoadmapStatus | null>(null);
  const [activeCategory, setActiveCategory] =
    useState<RoadmapCategory | null>(null);

  const filteredItems = useMemo(() => {
    let result = roadmapItems;
    if (activeStatus) {
      result = result.filter((i) => i.status === activeStatus);
    }
    if (activeCategory) {
      result = result.filter((i) => i.category === activeCategory);
    }
    return result;
  }, [activeStatus, activeCategory]);

  // Group by status for section rendering
  const groupedByStatus = useMemo(() => {
    const groups: { status: RoadmapStatus; items: RoadmapItem[] }[] = [];
    ALL_STATUSES.forEach((status) => {
      const items = filteredItems.filter((i) => i.status === status);
      if (items.length > 0) {
        groups.push({ status, items });
      }
    });
    return groups;
  }, [filteredItems]);

  return (
    <MarketingPageShell>
      <RoadmapHero />

      <VisualDivider gradient />

      <StatsSection />

      <VisualDivider />

      <QuarterTimeline />

      <VisualDivider />

      {/* Roadmap Items */}
      <DeferredSection minHeight={800}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-6"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Everything on{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  the roadmap
                </span>
              </h2>
              <p className="text-base text-slate-400 max-w-xl mx-auto">
                {roadmapItems.length} items across compliance, security,
                integrations, platform, reporting, automation, and
                collaboration.
              </p>
            </ScrollReveal>

            <StatusFilterBar
              activeStatus={activeStatus}
              onSelect={setActiveStatus}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeStatus}-${activeCategory}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              >
                {groupedByStatus.map((group) => {
                  const config = STATUS_CONFIG[group.status];
                  const StatusIcon = config.icon;
                  return (
                    <section key={group.status} className="mb-16">
                      <ScrollReveal variant="fadeUp" range={[0, 0.3]}>
                        <div className="flex items-center gap-3 mb-6">
                          <div
                            className={`w-9 h-9 rounded-xl border ${config.border} ${config.bg} flex items-center justify-center`}
                          >
                            {group.status === 'in-progress' ? (
                              <Loader2
                                className={`w-4 h-4 ${config.text} animate-spin`}
                              />
                            ) : (
                              <StatusIcon
                                className={`w-4 h-4 ${config.text}`}
                              />
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {config.label}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {config.description}
                            </p>
                          </div>
                          <span className="ml-auto text-sm font-semibold text-slate-400">
                            {group.items.length}
                          </span>
                        </div>
                        <div
                          className="h-px mb-6"
                          style={{
                            background: `linear-gradient(to right, rgba(${config.colorRgb}, 0.3), transparent 60%)`,
                          }}
                        />
                      </ScrollReveal>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {group.items.map((item, i) => (
                          <RoadmapCard
                            key={item.title}
                            item={item}
                            index={i}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {filteredItems.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm text-slate-500">
                  No roadmap items match your current filters.
                </p>
              </div>
            )}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      <CategoryBreakdown />

      <VisualDivider />

      <TransparencySection />

      <VisualDivider />

      <FeatureRequestCTA />
    </MarketingPageShell>
  );
}

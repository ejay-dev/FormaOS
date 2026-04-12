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
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Search,
  Link2,
  Zap,
  Shield,
  Lock,
  Cloud,
  MessageSquare,
  GitBranch,
  BarChart3,
  Users,
  Layers,
  Workflow,
  FileText,
  Bell,
  Monitor,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { brand } from '@/config/brand';

/* ─── Easing ──────────────────────────────────────────────── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─── Types ───────────────────────────────────────────────── */

type IntegrationStatus = 'live' | 'beta' | 'coming-soon';

type IntegrationCategory =
  | 'Project Management'
  | 'Communication'
  | 'Cloud Infrastructure'
  | 'Identity & Access'
  | 'Developer Tools'
  | 'HR & People'
  | 'Security'
  | 'Automation'
  | 'Monitoring'
  | 'Document Management';

interface StatusConfig {
  label: string;
  bg: string;
  border: string;
  text: string;
  dotColor: string;
}

const STATUS_CONFIG: Record<IntegrationStatus, StatusConfig> = {
  live: {
    label: 'Live',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/20',
    text: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
  },
  beta: {
    label: 'Beta',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-400/20',
    text: 'text-cyan-400',
    dotColor: 'bg-cyan-400',
  },
  'coming-soon': {
    label: 'Coming Soon',
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/20',
    text: 'text-amber-400',
    dotColor: 'bg-amber-400',
  },
};

interface CategoryConfig {
  icon: LucideIcon;
  colorRgb: string;
}

const CATEGORY_CONFIG: Record<IntegrationCategory, CategoryConfig> = {
  'Project Management': { icon: Layers, colorRgb: '59,130,246' },
  Communication: { icon: MessageSquare, colorRgb: '139,92,246' },
  'Cloud Infrastructure': { icon: Cloud, colorRgb: '34,211,238' },
  'Identity & Access': { icon: Lock, colorRgb: '251,113,133' },
  'Developer Tools': { icon: GitBranch, colorRgb: '52,211,153' },
  'HR & People': { icon: Users, colorRgb: '245,158,11' },
  Security: { icon: Shield, colorRgb: '239,68,68' },
  Automation: { icon: Workflow, colorRgb: '168,85,247' },
  Monitoring: { icon: Monitor, colorRgb: '34,211,238' },
  'Document Management': { icon: FileText, colorRgb: '59,130,246' },
};

interface Integration {
  name: string;
  description: string;
  complianceUseCase: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  initials: string;
  color: string;
  features?: string[];
}

/* ─── Integration Data ────────────────────────────────────── */

const integrations: Integration[] = [
  {
    name: 'Jira',
    description:
      'Sync compliance tasks with Jira issues. Two-way sync for status, assignees, and comments.',
    complianceUseCase:
      'Map compliance controls to Jira epics and track remediation tasks through your existing workflow.',
    category: 'Project Management',
    status: 'live',
    initials: 'JI',
    color: '#0052CC',
    features: [
      'Two-way task sync',
      'Control-to-epic mapping',
      'Status change webhooks',
      'Custom field mapping',
    ],
  },
  {
    name: 'Slack',
    description:
      'Compliance alerts, task notifications, and approval flows directly in Slack channels.',
    complianceUseCase:
      'Real-time compliance alerts in dedicated channels with interactive approval buttons for evidence review.',
    category: 'Communication',
    status: 'live',
    initials: 'SL',
    color: '#4A154B',
    features: [
      'Channel-based alerts',
      'Interactive approvals',
      'Slash commands',
      'Thread-based discussions',
    ],
  },
  {
    name: 'Microsoft Teams',
    description:
      'Compliance notifications, task assignments, and evidence approvals within Teams.',
    complianceUseCase:
      'Embed compliance dashboards in Teams tabs and route approval requests through adaptive cards.',
    category: 'Communication',
    status: 'live',
    initials: 'MT',
    color: '#6264A7',
    features: [
      'Adaptive card approvals',
      'Teams tab integration',
      'Bot-based notifications',
      'Group chat alerts',
    ],
  },
  {
    name: 'GitHub',
    description:
      'Pull request compliance checks, code review evidence, and SDLC compliance tracking.',
    complianceUseCase:
      'Surface compliance status in PR checks and auto-collect code review evidence for security controls.',
    category: 'Developer Tools',
    status: 'live',
    initials: 'GH',
    color: '#24292E',
    features: [
      'PR status checks',
      'Code review evidence',
      'Dependency scanning',
      'Release compliance',
    ],
  },
  {
    name: 'GitLab',
    description:
      'CI/CD pipeline compliance gates, merge request evidence, and security scanning integration.',
    complianceUseCase:
      'Add compliance quality gates to CI/CD pipelines and track merge request approval evidence.',
    category: 'Developer Tools',
    status: 'live',
    initials: 'GL',
    color: '#FC6D26',
    features: [
      'Pipeline compliance gates',
      'MR evidence collection',
      'Security scan reports',
      'Branch protection audit',
    ],
  },
  {
    name: 'AWS',
    description:
      'Monitor AWS Config rules, CloudTrail events, and infrastructure compliance posture.',
    complianceUseCase:
      'Auto-collect AWS Config evaluations as compliance evidence and monitor CloudTrail for security events.',
    category: 'Cloud Infrastructure',
    status: 'live',
    initials: 'AW',
    color: '#FF9900',
    features: [
      'Config rule monitoring',
      'CloudTrail integration',
      'S3 evidence storage',
      'IAM access reviews',
    ],
  },
  {
    name: 'Microsoft Azure',
    description:
      'Azure Policy compliance monitoring, Entra ID integration, and resource governance.',
    complianceUseCase:
      'Pull Azure Policy compliance data and map Azure security controls to compliance frameworks.',
    category: 'Cloud Infrastructure',
    status: 'live',
    initials: 'AZ',
    color: '#0078D4',
    features: [
      'Azure Policy sync',
      'Entra ID integration',
      'Resource compliance',
      'Security Center data',
    ],
  },
  {
    name: 'Google Cloud',
    description:
      'GCP Security Command Center, Cloud Asset Inventory, and organization policy compliance.',
    complianceUseCase:
      'Ingest GCP security findings and asset inventory data for infrastructure compliance evidence.',
    category: 'Cloud Infrastructure',
    status: 'live',
    initials: 'GC',
    color: '#4285F4',
    features: [
      'Security Command Center',
      'Asset inventory sync',
      'Organization policies',
      'IAM analysis',
    ],
  },
  {
    name: 'Okta',
    description:
      'SAML SSO, directory-driven access reviews, and identity governance support through Okta.',
    complianceUseCase:
      'Automate user access reviews by pulling Okta group memberships and application assignments.',
    category: 'Identity & Access',
    status: 'live',
    initials: 'OK',
    color: '#007DC1',
    features: [
      'SAML 2.0 SSO',
      'Directory sync inputs',
      'Access review automation',
      'Group sync',
    ],
  },
  {
    name: 'Microsoft Entra ID',
    description:
      'Azure AD SSO, user provisioning, conditional access integration, and directory sync.',
    complianceUseCase:
      'Leverage conditional access policies as compliance evidence for identity controls.',
    category: 'Identity & Access',
    status: 'live',
    initials: 'ME',
    color: '#0078D4',
    features: [
      'Azure AD SSO',
      'Conditional access sync',
      'Directory integration',
      'MFA policy sync',
    ],
  },
  {
    name: 'Zapier',
    description:
      'Connect FormaOS to 6,000+ apps with custom automation workflows and triggers.',
    complianceUseCase:
      'Build custom compliance workflows: auto-create tasks when findings emerge, sync data to spreadsheets, or trigger alerts.',
    category: 'Automation',
    status: 'live',
    initials: 'ZP',
    color: '#FF4A00',
    features: [
      '6,000+ app connections',
      'Multi-step workflows',
      'Custom triggers',
      'Conditional logic',
    ],
  },
  {
    name: 'Google Workspace',
    description:
      'Google SSO, Drive evidence collection, and Workspace admin policy monitoring.',
    complianceUseCase:
      'Collect Google Drive documents as compliance evidence and monitor Workspace admin policies.',
    category: 'Identity & Access',
    status: 'live',
    initials: 'GW',
    color: '#4285F4',
    features: [
      'Google SSO',
      'Drive evidence import',
      'Admin policy monitoring',
      'Workspace directory sync',
    ],
  },
  {
    name: 'PagerDuty',
    description:
      'Route compliance alerts through PagerDuty incident management with escalation policies.',
    complianceUseCase:
      'Automatically escalate critical compliance findings through PagerDuty on-call schedules.',
    category: 'Monitoring',
    status: 'live',
    initials: 'PD',
    color: '#06AC38',
    features: [
      'Incident creation',
      'Escalation routing',
      'On-call integration',
      'Alert acknowledgment',
    ],
  },
  {
    name: 'BambooHR',
    description:
      'Sync employee lifecycle events for automated personnel compliance tracking.',
    complianceUseCase:
      'Auto-update control ownership when employees join, change roles, or depart the organization.',
    category: 'HR & People',
    status: 'beta',
    initials: 'BH',
    color: '#73C41D',
    features: [
      'Employee lifecycle sync',
      'Role change tracking',
      'Onboarding compliance',
      'Org structure mapping',
    ],
  },
  {
    name: 'Workday',
    description:
      'Enterprise HRIS integration for personnel compliance, training tracking, and organizational data.',
    complianceUseCase:
      'Sync organizational hierarchy and training completion records for personnel compliance controls.',
    category: 'HR & People',
    status: 'beta',
    initials: 'WD',
    color: '#005CB9',
    features: [
      'Org hierarchy sync',
      'Training compliance',
      'Manager approvals',
      'Department mapping',
    ],
  },
  {
    name: 'Datadog',
    description:
      'Pull monitoring metrics and alert history for infrastructure compliance evidence.',
    complianceUseCase:
      'Use Datadog monitoring data as evidence for uptime SLAs and infrastructure availability controls.',
    category: 'Monitoring',
    status: 'beta',
    initials: 'DD',
    color: '#632CA6',
    features: [
      'Metric collection',
      'Alert history sync',
      'SLA evidence',
      'Dashboard snapshots',
    ],
  },
  {
    name: 'Splunk',
    description:
      'SIEM log export, security event correlation, and compliance reporting from Splunk.',
    complianceUseCase:
      'Aggregate security events from Splunk as evidence for monitoring and incident response controls.',
    category: 'Security',
    status: 'beta',
    initials: 'SP',
    color: '#FF375F',
    features: [
      'Log export integration',
      'Security event sync',
      'Compliance dashboards',
      'Alert forwarding',
    ],
  },
  {
    name: 'Qualys',
    description:
      'Automated vulnerability scan report collection and remediation tracking.',
    complianceUseCase:
      'Auto-collect Qualys vulnerability reports as evidence for vulnerability management controls.',
    category: 'Security',
    status: 'beta',
    initials: 'QL',
    color: '#ED2024',
    features: [
      'Scan report collection',
      'Vulnerability tracking',
      'Remediation status',
      'Risk scoring sync',
    ],
  },
  {
    name: 'Confluence',
    description:
      'Sync Confluence pages as policy and procedure evidence with version tracking.',
    complianceUseCase:
      'Link Confluence policy documents directly to controls with automatic version monitoring.',
    category: 'Document Management',
    status: 'live',
    initials: 'CF',
    color: '#172B4D',
    features: [
      'Page sync as evidence',
      'Version monitoring',
      'Space-level linking',
      'Template compliance',
    ],
  },
  {
    name: 'Notion',
    description:
      'Connect Notion databases and pages as compliance evidence sources.',
    complianceUseCase:
      'Map Notion databases to controls and auto-sync document changes for compliance tracking.',
    category: 'Document Management',
    status: 'beta',
    initials: 'NT',
    color: '#000000',
    features: [
      'Database sync',
      'Page evidence linking',
      'Change detection',
      'Workspace integration',
    ],
  },
  {
    name: 'Linear',
    description:
      'Sync compliance tasks with Linear projects and cycles for modern development teams.',
    complianceUseCase:
      'Map remediation tasks to Linear issues and track compliance work alongside product development.',
    category: 'Project Management',
    status: 'live',
    initials: 'LN',
    color: '#5E6AD2',
    features: [
      'Two-way issue sync',
      'Cycle integration',
      'Label-based mapping',
      'Status webhooks',
    ],
  },
  {
    name: 'Asana',
    description:
      'Connect compliance task management with Asana projects and portfolios.',
    complianceUseCase:
      'Create Asana tasks for compliance actions and sync completion status back to FormaOS.',
    category: 'Project Management',
    status: 'coming-soon',
    initials: 'AS',
    color: '#F06A6A',
    features: [
      'Task sync',
      'Portfolio mapping',
      'Timeline integration',
      'Custom fields',
    ],
  },
  {
    name: 'Rippling',
    description:
      'Unified HR, IT, and identity data sync for holistic personnel compliance.',
    complianceUseCase:
      'Centralize employee data from Rippling for comprehensive personnel compliance tracking.',
    category: 'HR & People',
    status: 'coming-soon',
    initials: 'RP',
    color: '#6C3AFF',
    features: [
      'Employee data sync',
      'Device compliance',
      'App access tracking',
      'Policy enforcement',
    ],
  },
  {
    name: 'ServiceNow',
    description:
      'Enterprise ITSM integration for incident, change, and problem management compliance.',
    complianceUseCase:
      'Sync ServiceNow incidents and change records as compliance evidence for ITIL controls.',
    category: 'Automation',
    status: 'coming-soon',
    initials: 'SN',
    color: '#62D84E',
    features: [
      'Incident sync',
      'Change management',
      'CMDB integration',
      'SLA tracking',
    ],
  },
];

/* ─── Architecture Data ───────────────────────────────────── */

interface ArchitectureLayer {
  name: string;
  description: string;
  icon: LucideIcon;
  colorRgb: string;
  details: string[];
}

const architectureLayers: ArchitectureLayer[] = [
  {
    name: 'Webhook & Event Layer',
    description:
      'Real-time event ingestion from integrated tools via webhooks, polling, and change data capture.',
    icon: Zap,
    colorRgb: '52,211,153',
    details: [
      'Webhook signature verification',
      'Event deduplication',
      'At-least-once delivery guarantee',
      'Configurable retry policies',
    ],
  },
  {
    name: 'Data Normalization',
    description:
      'Transform integration-specific data formats into FormaOS canonical schema for unified processing.',
    icon: Workflow,
    colorRgb: '34,211,238',
    details: [
      'Schema mapping engine',
      'Custom field transformers',
      'Data validation pipeline',
      'Format-agnostic ingestion',
    ],
  },
  {
    name: 'Control Mapping Engine',
    description:
      'Automatically link integrated data to compliance controls using configurable mapping rules.',
    icon: Link2,
    colorRgb: '139,92,246',
    details: [
      'Rule-based auto-mapping',
      'Manual mapping overrides',
      'Cross-framework linking',
      'Confidence scoring',
    ],
  },
  {
    name: 'Evidence Pipeline',
    description:
      'Process, hash, version, and store integrated evidence with full chain-of-custody tracking.',
    icon: Shield,
    colorRgb: '59,130,246',
    details: [
      'SHA-256 integrity hashing',
      'Immutable versioning',
      'Source traceability',
      'Automated freshness tracking',
    ],
  },
  {
    name: 'Notification Fabric',
    description:
      'Route integration events to the right stakeholders through configurable alert channels.',
    icon: Bell,
    colorRgb: '245,158,11',
    details: [
      'Multi-channel delivery',
      'Escalation chains',
      'Smart batching',
      'Quiet hours support',
    ],
  },
];

/* ─── Component: Animated Stat ────────────────────────────── */

function AnimatedStat({
  value,
  label,
  suffix,
  delay,
}: {
  value: string;
  label: string;
  suffix?: string;
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
        {suffix && <span className="text-emerald-400">{suffix}</span>}
      </div>
      <div className="text-xs sm:text-sm text-slate-400 font-medium">
        {label}
      </div>
    </motion.div>
  );
}

/* ─── Component: Integration Card ─────────────────────────── */

function IntegrationCard({
  integration,
  index,
}: {
  integration: Integration;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = STATUS_CONFIG[integration.status];
  const catConfig = CATEGORY_CONFIG[integration.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.5,
        delay: index * 0.03,
        ease: EASE_OUT_EXPO,
      }}
      className="group relative"
    >
      <div
        className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5
          transition-all duration-300 cursor-pointer
          hover:bg-white/[0.04] hover:border-white/[0.12]"
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
            background: `radial-gradient(ellipse at 50% 0%, ${integration.color}10, transparent 70%)`,
          }}
        />

        <div className="relative flex items-start gap-3.5">
          {/* Icon */}
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: `${integration.color}20` }}
          >
            <span style={{ color: integration.color }}>
              {integration.initials}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-white">
                {integration.name}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}
                />
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              {integration.description}
            </p>

            {/* Category tag */}
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
              <catConfig.icon className="w-3 h-3" />
              {integration.category}
            </div>
          </div>

          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="shrink-0 mt-1"
          >
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
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
              <div className="pt-4 mt-4 border-t border-white/[0.06]">
                <div className="mb-3">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                    Compliance Use Case
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    {integration.complianceUseCase}
                  </p>
                </div>

                {integration.features && (
                  <div className="grid grid-cols-2 gap-2">
                    {integration.features.map((f, fi) => (
                      <motion.div
                        key={f}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: fi * 0.05, duration: 0.3 }}
                        className="flex items-center gap-1.5"
                      >
                        <CheckCircle2
                          className="w-3 h-3 shrink-0"
                          style={{
                            color: `${integration.color}99`,
                          }}
                        />
                        <span className="text-[11px] text-slate-300">{f}</span>
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

/* ─── Search & Filter Bar ─────────────────────────────────── */

function FilterBar({
  searchQuery,
  onSearch,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
}: {
  searchQuery: string;
  onSearch: (q: string) => void;
  selectedCategory: IntegrationCategory | null;
  onSelectCategory: (c: IntegrationCategory | null) => void;
  selectedStatus: IntegrationStatus | null;
  onSelectStatus: (s: IntegrationStatus | null) => void;
}) {
  const categories = Object.keys(CATEGORY_CONFIG) as IntegrationCategory[];
  const statuses: IntegrationStatus[] = ['live', 'beta', 'coming-soon'];

  return (
    <ScrollReveal variant="fadeUp" range={[0, 0.3]}>
      <div className="space-y-4 mb-12">
        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search integrations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03]
              text-sm text-white placeholder:text-slate-500
              focus:outline-none focus:ring-1 focus:ring-emerald-400/30 focus:border-emerald-400/20
              transition-all duration-300"
          />
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => onSelectStatus(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border
              ${
                selectedStatus === null
                  ? 'bg-white/[0.08] border-white/[0.15] text-white'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            All
            <span className="ml-1 text-slate-500">{integrations.length}</span>
          </button>
          {statuses.map((status) => {
            const config = STATUS_CONFIG[status];
            const count = integrations.filter(
              (i) => i.status === status,
            ).length;
            return (
              <button
                key={status}
                onClick={() => onSelectStatus(status)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border
                  ${
                    selectedStatus === status
                      ? `bg-white/[0.08] border-white/[0.15] text-white`
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}
                />
                {config.label}
                <span className="text-slate-500">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-300 border
              ${
                selectedCategory === null
                  ? 'bg-white/[0.06] border-white/[0.12] text-white'
                  : 'bg-white/[0.01] border-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
              }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = config.icon;
            const count = integrations.filter((i) => i.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-300 border
                  ${
                    selectedCategory === cat
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

/* ─── Architecture Section ────────────────────────────────── */

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
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                How It Works
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Integration{' '}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                architecture
              </span>
            </h2>
            <p className="text-base text-slate-400 max-w-xl mx-auto">
              Five processing layers ensure every integration delivers verified,
              auditable compliance evidence.
            </p>
          </ScrollReveal>

          <div className="relative space-y-3">
            {/* Vertical line */}
            <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-emerald-400/30 via-violet-400/30 to-amber-400/30 hidden sm:block" />

            {architectureLayers.map((layer, i) => {
              const Icon = layer.icon;
              return (
                <ScrollReveal
                  key={layer.name}
                  variant="fadeUp"
                  range={[0, 0.3]}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: i * 0.08,
                      duration: 0.5,
                      ease: EASE_OUT_EXPO,
                    }}
                    className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02]
                      hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                    style={{ marginLeft: `${i * 12}px` }}
                  >
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse at 0% 50%, rgba(${layer.colorRgb}, 0.05), transparent 60%)`,
                      }}
                    />

                    <div className="relative p-5 sm:p-6">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="relative">
                          <div
                            className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                            style={{
                              borderColor: `rgba(${layer.colorRgb}, 0.2)`,
                              backgroundColor: `rgba(${layer.colorRgb}, 0.08)`,
                            }}
                          >
                            <Icon
                              className="w-5 h-5"
                              style={{
                                color: `rgba(${layer.colorRgb}, 0.85)`,
                              }}
                            />
                          </div>
                          <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-canvas-900 border border-white/[0.1] flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {i + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-white mb-1">
                            {layer.name}
                          </h3>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {layer.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:ml-14">
                        {layer.details.map((detail) => (
                          <div key={detail} className="flex items-center gap-2">
                            <CheckCircle2
                              className="w-3 h-3 shrink-0"
                              style={{
                                color: `rgba(${layer.colorRgb}, 0.6)`,
                              }}
                            />
                            <span className="text-xs text-slate-300">
                              {detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Category Breakdown ──────────────────────────────────── */

function CategoryBreakdown() {
  const breakdown = useMemo(() => {
    return (Object.keys(CATEGORY_CONFIG) as IntegrationCategory[])
      .map((cat) => {
        const config = CATEGORY_CONFIG[cat];
        const items = integrations.filter((i) => i.category === cat);
        const live = items.filter((i) => i.status === 'live').length;
        return { category: cat, config, total: items.length, live };
      })
      .filter((b) => b.total > 0)
      .sort((a, b) => b.total - a.total);
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 mb-6">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Coverage
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Integration{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                coverage
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Integrations across categories - embedding compliance into every
              part of your technology stack.
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
                        <Icon
                          className="w-4 h-4"
                          style={{
                            color: `rgba(${item.config.colorRgb}, 0.8)`,
                          }}
                        />
                        <span className="text-sm font-semibold text-white">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-400">
                          {item.live} live
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
                          className="h-full rounded-full bg-emerald-400/50"
                          initial={{ width: 0 }}
                          whileInView={{
                            width: `${(item.live / maxTotal) * 100}%`,
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
                            backgroundColor: `rgba(${item.config.colorRgb}, 0.25)`,
                          }}
                          initial={{ width: 0 }}
                          whileInView={{
                            width: `${((item.total - item.live) / maxTotal) * 100}%`,
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

/* ─── CTA ─────────────────────────────────────────────────── */

function IntegrationsCTA() {
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
                  <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Get Connected
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Don&apos;t see your{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                    tool?
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10">
                  We&apos;re adding new integrations every month based on
                  customer demand. Request an integration or build your own with
                  our API.
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
                    href="mailto:Formaos.team@gmail.com?subject=Integration%20Request"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      border border-white/[0.12] bg-white/[0.04]
                      text-white font-semibold text-sm
                      hover:bg-white/[0.08] hover:border-white/[0.2]
                      transition-all duration-300"
                  >
                    Request Integration
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-slate-500">
                  {[
                    `${integrations.filter((i) => i.status === 'live').length} live integrations`,
                    'Webhook & API support',
                    'Custom integration SDK',
                    'New integrations monthly',
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

function IntegrationsHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 60]);

  const liveCount = integrations.filter((i) => i.status === 'live').length;
  const betaCount = integrations.filter((i) => i.status === 'beta').length;
  const comingSoonCount = integrations.filter(
    (i) => i.status === 'coming-soon',
  ).length;

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
          style={{ background: 'rgba(59,130,246,0.10)' }}
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
          <Link2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Integrations
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6"
        >
          Connect your
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            compliance stack
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {integrations.length} integrations across{' '}
          {Object.keys(CATEGORY_CONFIG).length} categories. Embed compliance
          into the tools your team already uses - from Jira to AWS.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="flex flex-wrap justify-center gap-3"
        >
          {[
            {
              label: 'Live',
              count: liveCount,
              dotColor: 'bg-emerald-400',
              bg: 'bg-emerald-500/10',
              border: 'border-emerald-400/20',
              text: 'text-emerald-400',
            },
            {
              label: 'Beta',
              count: betaCount,
              dotColor: 'bg-cyan-400',
              bg: 'bg-cyan-500/10',
              border: 'border-cyan-400/20',
              text: 'text-cyan-400',
            },
            {
              label: 'Coming Soon',
              count: comingSoonCount,
              dotColor: 'bg-amber-400',
              bg: 'bg-amber-500/10',
              border: 'border-amber-400/20',
              text: 'text-amber-400',
            },
          ].map((badge) => (
            <div
              key={badge.label}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${badge.border} ${badge.bg} text-sm`}
            >
              <span className={`w-2 h-2 rounded-full ${badge.dotColor}`} />
              <span className={badge.text}>{badge.label}</span>
              <span className="text-white font-semibold">{badge.count}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-canvas-900 to-transparent pointer-events-none" />
    </section>
  );
}

/* ─── Main Component ──────────────────────────────────────── */

export default function IntegrationsPageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<IntegrationCategory | null>(null);
  const [selectedStatus, setSelectedStatus] =
    useState<IntegrationStatus | null>(null);

  const filteredIntegrations = useMemo(() => {
    let result = integrations;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q),
      );
    }
    if (selectedCategory) {
      result = result.filter((i) => i.category === selectedCategory);
    }
    if (selectedStatus) {
      result = result.filter((i) => i.status === selectedStatus);
    }
    return result;
  }, [searchQuery, selectedCategory, selectedStatus]);

  // Group by category for display
  const groupedByCategory = useMemo(() => {
    const groups: {
      category: IntegrationCategory;
      items: Integration[];
    }[] = [];
    const seen = new Set<IntegrationCategory>();
    filteredIntegrations.forEach((i) => {
      if (!seen.has(i.category)) {
        seen.add(i.category);
        groups.push({
          category: i.category,
          items: filteredIntegrations.filter(
            (fi) => fi.category === i.category,
          ),
        });
      }
    });
    return groups;
  }, [filteredIntegrations]);

  const liveCount = integrations.filter((i) => i.status === 'live').length;
  const betaCount = integrations.filter((i) => i.status === 'beta').length;

  return (
    <MarketingPageShell>
      <IntegrationsHero />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Stats */}
      <DeferredSection minHeight={160}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                <AnimatedStat
                  value={String(integrations.length)}
                  label="Total Integrations"
                  delay={0}
                />
                <AnimatedStat
                  value={String(liveCount)}
                  label="Live"
                  delay={0.08}
                />
                <AnimatedStat
                  value={String(betaCount)}
                  label="In Beta"
                  delay={0.16}
                />
                <AnimatedStat
                  value={String(
                    Object.keys(CATEGORY_CONFIG).filter((cat) =>
                      integrations.some((i) => i.category === cat),
                    ).length,
                  )}
                  label="Categories"
                  delay={0.24}
                />
                <AnimatedStat value="2-way" label="Data Sync" delay={0.32} />
                <AnimatedStat
                  value="5"
                  label="Architecture Layers"
                  delay={0.4}
                />
              </div>
            </div>
          </div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Integration Catalog */}
      <DeferredSection minHeight={600}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-6"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Integration{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  catalog
                </span>
              </h2>
              <p className="text-base text-slate-400 max-w-xl mx-auto">
                Browse all {integrations.length} integrations by category,
                status, or search for specific tools.
              </p>
            </ScrollReveal>

            <FilterBar
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={`${searchQuery}-${selectedCategory}-${selectedStatus}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              >
                {groupedByCategory.map((group) => {
                  const catConfig = CATEGORY_CONFIG[group.category];
                  const CatIcon = catConfig.icon;
                  return (
                    <section key={group.category} className="mb-12">
                      <ScrollReveal variant="fadeUp" range={[0, 0.3]}>
                        <div className="flex items-center gap-3 mb-4">
                          <CatIcon
                            className="w-4 h-4"
                            style={{
                              color: `rgba(${catConfig.colorRgb}, 0.8)`,
                            }}
                          />
                          <h3 className="text-lg font-bold text-white">
                            {group.category}
                          </h3>
                          <span className="text-xs text-slate-500">
                            {group.items.length}
                          </span>
                        </div>
                        <div
                          className="h-px mb-4"
                          style={{
                            background: `linear-gradient(to right, rgba(${catConfig.colorRgb}, 0.3), transparent 60%)`,
                          }}
                        />
                      </ScrollReveal>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {group.items.map((int, i) => (
                          <IntegrationCard
                            key={int.name}
                            integration={int}
                            index={i}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {filteredIntegrations.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm text-slate-500">
                  No integrations match your current filters.
                </p>
              </div>
            )}
          </div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Architecture */}
      <ArchitectureSection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Category Breakdown */}
      <CategoryBreakdown />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* CTA */}
      <IntegrationsCTA />
    </MarketingPageShell>
  );
}

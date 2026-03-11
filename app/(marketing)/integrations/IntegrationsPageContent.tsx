'use client';

import { useRef, useState, useMemo } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import {
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Puzzle,
  Webhook,
  Code2,
  Download,
  Filter,
  Shield,
  Link2,
  type LucideIcon,
} from 'lucide-react';

/* ─── Types & Config ────────────────────────────────────── */

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

const STATUS_CONFIG: Record<
  IntegrationStatus,
  {
    label: string;
    className: string;
    dotColor: string;
    icon: LucideIcon;
  }
> = {
  live: {
    label: 'Live',
    className: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    dotColor: 'bg-emerald-400',
    icon: CheckCircle2,
  },
  beta: {
    label: 'Beta',
    className: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    dotColor: 'bg-amber-400',
    icon: Sparkles,
  },
  'coming-soon': {
    label: 'Coming soon',
    className: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
    dotColor: 'bg-slate-400',
    icon: Clock,
  },
};

/* ─── Integration Data ──────────────────────────────────── */

const INTEGRATIONS: Integration[] = [
  {
    name: 'Jira',
    category: 'Task Management',
    description:
      'Sync compliance tasks bidirectionally with Jira issues. Control owners work in their existing workflow - task status, evidence links, and deadlines stay in sync.',
    complianceUseCase: 'SOC 2 CC8 change management evidence',
    status: 'live',
    initials: 'Ji',
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    name: 'Linear',
    category: 'Task Management',
    description:
      'Push compliance action items to Linear with full context. Status updates sync back automatically with timestamps for audit trail.',
    complianceUseCase: 'ISO 27001 A.12.1.2 change management',
    status: 'live',
    initials: 'Li',
    color: 'bg-violet-500/20 text-violet-400',
  },
  {
    name: 'Asana',
    category: 'Task Management',
    description:
      'Create compliance tasks in Asana projects with linked evidence requirements, deadlines, and owner assignment.',
    complianceUseCase: 'Control ownership and task accountability',
    status: 'beta',
    initials: 'As',
    color: 'bg-rose-500/20 text-rose-400',
  },
  {
    name: 'Slack',
    category: 'Communication',
    description:
      'Receive compliance alerts, deadline reminders, evidence review requests, and audit event notifications in Slack channels.',
    complianceUseCase: 'Real-time escalation and deadline alerts',
    status: 'live',
    initials: 'Sl',
    color: 'bg-green-500/20 text-green-400',
  },
  {
    name: 'Microsoft Teams',
    category: 'Communication',
    description:
      'Post compliance status updates, control review reminders, and audit notifications directly in Teams channels.',
    complianceUseCase: 'Cross-team compliance communication',
    status: 'live',
    initials: 'MT',
    color: 'bg-indigo-500/20 text-indigo-400',
  },
  {
    name: 'Okta',
    category: 'Identity & SSO',
    description:
      'SAML 2.0 SSO with Okta. MFA policy enforcement supported. SCIM provisioning available on Enterprise plan.',
    complianceUseCase: 'ISO 27001 A.9 access control evidence',
    status: 'live',
    initials: 'Ok',
    color: 'bg-cyan-500/20 text-cyan-400',
  },
  {
    name: 'Microsoft Entra ID',
    category: 'Identity & SSO',
    description:
      'Azure Active Directory integration for enterprise SSO and conditional access evidence. SCIM provisioning available on Enterprise plan.',
    complianceUseCase: 'SOC 2 CC6 logical access controls',
    status: 'live',
    initials: 'ME',
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    name: 'Google Workspace',
    category: 'Identity & SSO',
    description:
      'Google SSO and directory sync for Google Workspace organisations. OAuth on all plans, SAML 2.0 on Enterprise.',
    complianceUseCase: 'Identity governance and access management',
    status: 'live',
    initials: 'GW',
    color: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    name: 'GitHub',
    category: 'Development',
    description:
      'Pull evidence from GitHub repositories - commit logs, PR approval records, branch protection rules, and code review history.',
    complianceUseCase: 'SOC 2 CC8.1 change management evidence',
    status: 'beta',
    initials: 'GH',
    color: 'bg-slate-500/20 text-slate-300',
  },
  {
    name: 'AWS',
    category: 'Cloud & Infrastructure',
    description:
      'Pull CloudTrail logs, IAM configuration snapshots, and S3 access controls as compliance evidence artifacts.',
    complianceUseCase: 'ISO 27001 A.9 + SOC 2 CC6 access control',
    status: 'beta',
    initials: 'AW',
    color: 'bg-orange-500/20 text-orange-400',
  },
  {
    name: 'Microsoft Azure',
    category: 'Cloud & Infrastructure',
    description:
      'Collect Azure AD activity logs, resource compliance state, and Security Center findings as evidence.',
    complianceUseCase: 'APRA CPS 234 information security evidence',
    status: 'beta',
    initials: 'Az',
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    name: 'Google Cloud Platform',
    category: 'Cloud & Infrastructure',
    description:
      'Import Cloud Audit Logs, IAM policy snapshots, and organization policy evidence for framework mapping.',
    complianceUseCase: 'Essential Eight access control evidence',
    status: 'coming-soon',
    initials: 'GC',
    color: 'bg-red-500/20 text-red-400',
  },
  {
    name: 'Zapier',
    category: 'Automation',
    description:
      'Connect FormaOS to 5,000+ apps via Zapier. Trigger actions, create compliance tasks, and sync evidence automatically.',
    complianceUseCase: 'Cross-platform workflow automation',
    status: 'live',
    initials: 'Za',
    color: 'bg-orange-500/20 text-orange-400',
  },
  {
    name: 'Make (Integromat)',
    category: 'Automation',
    description:
      'Build complex compliance automation workflows connecting FormaOS to your operational toolchain with conditional logic.',
    complianceUseCase: 'Multi-step evidence collection workflows',
    status: 'beta',
    initials: 'Mk',
    color: 'bg-purple-500/20 text-purple-400',
  },
  {
    name: 'Google Drive',
    category: 'Storage & Evidence',
    description:
      'Link Google Drive files directly as evidence artifacts. Version history and access timestamps preserved for audit trail.',
    complianceUseCase: 'Evidence chain-of-custody documentation',
    status: 'live',
    initials: 'GD',
    color: 'bg-yellow-500/20 text-yellow-400',
  },
  {
    name: 'SharePoint',
    category: 'Storage & Evidence',
    description:
      'Pull policy documents and evidence files from SharePoint libraries with version tracking and access control metadata.',
    complianceUseCase: 'Policy version management evidence',
    status: 'coming-soon',
    initials: 'SP',
    color: 'bg-teal-500/20 text-teal-400',
  },
  {
    name: 'ServiceNow',
    category: 'ITSM & Operations',
    description:
      'Sync incident records, change requests, and CMDB snapshots for ISO 27001 and SOC 2 change management controls.',
    complianceUseCase: 'ISO 27001 A.12 operations security evidence',
    status: 'coming-soon',
    initials: 'SN',
    color: 'bg-green-500/20 text-green-400',
  },
  {
    name: 'PagerDuty',
    category: 'ITSM & Operations',
    description:
      'Pull incident response timelines, escalation records, and on-call evidence for availability and incident controls.',
    complianceUseCase: 'SOC 2 A1 availability evidence',
    status: 'coming-soon',
    initials: 'PD',
    color: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    name: 'Qualys',
    category: 'Vulnerability & Security',
    description:
      'Import vulnerability scan results, remediation timelines, and patch compliance evidence for security frameworks.',
    complianceUseCase: 'Essential Eight patching controls',
    status: 'coming-soon',
    initials: 'Ql',
    color: 'bg-red-500/20 text-red-400',
  },
  {
    name: 'CrowdStrike',
    category: 'Vulnerability & Security',
    description:
      'Collect endpoint protection status, threat detection logs, and response evidence for security control mapping.',
    complianceUseCase: 'Essential Eight application control',
    status: 'coming-soon',
    initials: 'CS',
    color: 'bg-rose-500/20 text-rose-400',
  },
  {
    name: 'Employment Hero',
    category: 'HR & Workforce',
    description:
      'Sync employee records, compliance training completion, and worker credentials for NDIS Worker Screening and AHPRA tracking.',
    complianceUseCase: 'NDIS Worker Screening Check evidence',
    status: 'coming-soon',
    initials: 'EH',
    color: 'bg-rose-500/20 text-rose-400',
  },
  {
    name: 'Deputy',
    category: 'HR & Workforce',
    description:
      'Shift scheduling and workforce compliance data for NDIS and aged care - credential-to-shift validation evidence.',
    complianceUseCase: 'Credential-to-role mapping evidence',
    status: 'coming-soon',
    initials: 'Dp',
    color: 'bg-blue-500/20 text-blue-400',
  },
  {
    name: 'BambooHR',
    category: 'HR & Workforce',
    description:
      'Employee onboarding, training completion, and credential expiry data for workforce compliance governance.',
    complianceUseCase: 'SOC 2 CC1.4 competency evidence',
    status: 'coming-soon',
    initials: 'BH',
    color: 'bg-green-500/20 text-green-400',
  },
  {
    name: 'MYOB',
    category: 'HR & Workforce',
    description:
      'Payroll and workforce data integration for regulated workforce compliance evidence and WHS induction tracking.',
    complianceUseCase: 'WHS workforce compliance evidence',
    status: 'coming-soon',
    initials: 'MY',
    color: 'bg-amber-500/20 text-amber-400',
  },
];

const CATEGORIES = Array.from(new Set(INTEGRATIONS.map((i) => i.category)));

/* ─── Animated Background ───────────────────────────────── */

function IntegrationsHeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.07] blur-[130px]"
        animate={{
          scale: [1, 1.12, 1],
          x: [0, 35, 0],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -top-20 right-1/3 h-[400px] w-[400px] rounded-full bg-blue-500/[0.06] blur-[110px]"
        animate={{
          scale: [1.1, 1, 1.1],
          x: [0, -30, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-40 left-1/2 -translate-x-1/2 h-[300px] w-[700px] rounded-full bg-violet-500/[0.03] blur-[100px]"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

/* ─── Hero ──────────────────────────────────────────────── */

function IntegrationsHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, -50]);

  return (
    <div ref={heroRef} className="relative overflow-hidden pb-8 pt-24 sm:pt-32">
      <IntegrationsHeroBackground />
      <motion.div
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative mx-auto max-w-4xl px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-xs font-medium text-cyan-400">
            <Puzzle className="h-3.5 w-3.5" />
            {INTEGRATIONS.length} Integrations · {CATEGORIES.length} Categories
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            Integrations
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-2xl text-base text-slate-400 leading-relaxed sm:text-lg"
        >
          Embed compliance into the tools your team already uses. Connect with
          Jira, Slack, Teams, Okta, Azure AD, AWS, GitHub, and 5,000+ apps via
          Zapier.
        </motion.p>
      </motion.div>
    </div>
  );
}

/* ─── Search & Filter Bar ───────────────────────────────── */

function SearchFilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  statusCounts,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: IntegrationStatus | 'all';
  onFilterChange: (f: IntegrationStatus | 'all') => void;
  statusCounts: Record<IntegrationStatus | 'all', number>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mb-12 space-y-4"
    >
      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 backdrop-blur-sm transition-all"
        />
      </div>

      {/* Status filter */}
      <div className="flex items-center justify-center gap-2">
        <Filter className="h-3.5 w-3.5 text-slate-500 mr-1" />
        {(['all', 'live', 'beta', 'coming-soon'] as const).map((status) => {
          const isActive = activeFilter === status;
          const label = status === 'all' ? 'All' : STATUS_CONFIG[status].label;
          return (
            <button
              key={status}
              onClick={() => onFilterChange(status)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-slate-500 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {status !== 'all' && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[status].dotColor}`}
                />
              )}
              {label}
              <span className="text-[10px] opacity-60">
                {statusCounts[status]}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Integration Architecture ──────────────────────────── */

function IntegrationArchitecture() {
  const methods = [
    {
      icon: Download,
      title: 'Evidence Pull',
      description:
        'Read-only data collection from connected systems. FormaOS pulls evidence artifacts (logs, approvals, configurations) and stores them as immutable compliance records with source metadata.',
      color: 'text-teal-400',
      borderColor: 'border-teal-500/20',
      bgColor: 'bg-teal-500/[0.04]',
      glowColor: 'hover:shadow-[0_0_25px_rgba(20,184,166,0.08)]',
    },
    {
      icon: Webhook,
      title: 'Webhook Push',
      description:
        'Real-time event notifications from external tools. When a Jira ticket closes, a PR merges, or a training completes, FormaOS receives the event and records it against the relevant control.',
      color: 'text-blue-400',
      borderColor: 'border-blue-500/20',
      bgColor: 'bg-blue-500/[0.04]',
      glowColor: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.08)]',
    },
    {
      icon: Code2,
      title: 'REST API',
      description:
        'FormaOS exposes a REST API for custom integrations. Query audit logs, compliance status, evidence records, and tasks programmatically. Webhook endpoints provide real-time event subscriptions.',
      color: 'text-violet-400',
      borderColor: 'border-violet-500/20',
      bgColor: 'bg-violet-500/[0.04]',
      glowColor: 'hover:shadow-[0_0_25px_rgba(139,92,246,0.08)]',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-20"
    >
      <div className="flex items-center gap-3 mb-8">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/20"
        >
          <Link2 className="h-5 w-5 text-cyan-400" />
        </motion.div>
        <div>
          <h2 className="text-lg font-bold text-white">
            How Integrations Work
          </h2>
          <p className="text-xs text-slate-500">
            Three methods for connecting your compliance toolchain
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {methods.map((method, index) => {
          const Icon = method.icon;
          return (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`group relative overflow-hidden rounded-2xl border ${method.borderColor} ${method.bgColor} p-6 transition-all duration-500 hover:bg-white/[0.04] ${method.glowColor}`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06] mb-4 transition-all duration-300 group-hover:ring-white/[0.12]`}
              >
                <Icon className={`h-5 w-5 ${method.color}`} />
              </div>
              <h3 className={`text-sm font-bold ${method.color} mb-2`}>
                {method.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {method.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Integration Card ──────────────────────────────────── */

function IntegrationCard({
  integration,
  index,
}: {
  integration: Integration;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const statusProps = STATUS_CONFIG[integration.status];
  const StatusIcon = statusProps.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{
        duration: 0.4,
        delay: index * 0.03,
        ease: [0.22, 1, 0.36, 1],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm transition-all duration-500 hover:border-white/[0.14] hover:bg-white/[0.05] hover:shadow-[0_0_30px_rgba(6,182,212,0.06)]"
    >
      {/* Top gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative p-6">
        {/* Header: Icon + Status */}
        <div className="mb-4 flex items-start justify-between">
          <motion.div
            animate={
              isHovered ? { scale: 1.1, rotate: 3 } : { scale: 1, rotate: 0 }
            }
            transition={{ duration: 0.3 }}
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold ring-1 ring-white/[0.06] transition-all duration-300 group-hover:ring-white/[0.12] ${integration.color}`}
          >
            {integration.initials}
          </motion.div>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusProps.className}`}
          >
            <StatusIcon className="h-3 w-3" />
            {statusProps.label}
          </span>
        </div>

        {/* Name + Description */}
        <h3 className="mb-1.5 text-sm font-bold text-white">
          {integration.name}
        </h3>
        <p className="text-xs leading-relaxed text-slate-400 mb-4 line-clamp-3 group-hover:line-clamp-none transition-all">
          {integration.description}
        </p>

        {/* Compliance use case */}
        <div className="flex items-center gap-2">
          <Shield className="h-3 w-3 text-teal-400/50 shrink-0" />
          <span className="text-[10px] font-medium text-teal-400/60 leading-tight">
            {integration.complianceUseCase}
          </span>
        </div>
      </div>

      {/* Bottom hover reveal */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/[0.01] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </motion.div>
  );
}

/* ─── Category Section ──────────────────────────────────── */

function CategorySection({
  category,
  integrations,
  categoryIndex,
}: {
  category: string;
  integrations: Integration[];
  categoryIndex: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.5,
        delay: categoryIndex * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="mb-16"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent max-w-[40px]" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {category}
        </h2>
        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-600">
          {integrations.length}
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-white/[0.08] to-transparent max-w-[40px]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration, index) => (
          <IntegrationCard
            key={integration.name}
            integration={integration}
            index={index}
          />
        ))}
      </div>
    </motion.section>
  );
}

/* ─── Stats Summary ─────────────────────────────────────── */

function IntegrationStats() {
  const stats = [
    {
      value: INTEGRATIONS.filter((i) => i.status === 'live').length,
      label: 'Live',
      color: 'text-emerald-400',
      description: 'Production-ready',
    },
    {
      value: INTEGRATIONS.filter((i) => i.status === 'beta').length,
      label: 'Beta',
      color: 'text-amber-400',
      description: 'Early access',
    },
    {
      value: INTEGRATIONS.filter((i) => i.status === 'coming-soon').length,
      label: 'Coming Soon',
      color: 'text-slate-400',
      description: 'On the roadmap',
    },
    {
      value: CATEGORIES.length,
      label: 'Categories',
      color: 'text-cyan-400',
      description: 'Integration types',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mb-16 grid grid-cols-2 gap-4 sm:grid-cols-4"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: 0.4 + index * 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
        >
          <div
            className={`text-3xl font-bold ${stat.color} transition-transform duration-300 group-hover:scale-110`}
          >
            {stat.value}
          </div>
          <div className="mt-1 text-xs font-semibold text-white">
            {stat.label}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">
            {stat.description}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── Request CTA ───────────────────────────────────────── */

function RequestIntegrationCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.06] via-blue-500/[0.04] to-violet-500/[0.06] p-10 text-center"
    >
      {/* Floating particles */}
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-cyan-400/20"
          style={{
            top: `${8 + ((i * 13) % 84)}%`,
            left: `${5 + ((i * 14) % 90)}%`,
          }}
          animate={{
            y: [0, -25, 0],
            x: [0, 12, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 5 + i * 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        />
      ))}

      <div className="relative">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/20"
        >
          <Sparkles className="h-6 w-6 text-cyan-400" />
        </motion.div>

        <h3 className="text-xl font-bold text-white mb-3">
          Don&apos;t See Your Tool?
        </h3>
        <p className="mx-auto max-w-md text-sm text-slate-400 mb-8 leading-relaxed">
          We prioritise integrations based on customer requests. Tell us which
          tool matters to your compliance workflow and which framework control
          it serves.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="/contact"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:shadow-cyan-500/30 hover:brightness-110"
          >
            Request an Integration
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
          <a
            href="/roadmap"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-7 py-3 text-sm font-semibold text-slate-300 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
          >
            View Full Roadmap
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ────────────────────────────────────── */

export default function IntegrationsPageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<IntegrationStatus | 'all'>(
    'all',
  );

  const statusCounts = useMemo(() => {
    const result: Record<IntegrationStatus | 'all', number> = {
      all: INTEGRATIONS.length,
      live: INTEGRATIONS.filter((i) => i.status === 'live').length,
      beta: INTEGRATIONS.filter((i) => i.status === 'beta').length,
      'coming-soon': INTEGRATIONS.filter((i) => i.status === 'coming-soon')
        .length,
    };
    return result;
  }, []);

  const filteredIntegrations = useMemo(() => {
    let items = INTEGRATIONS;
    if (activeFilter !== 'all') {
      items = items.filter((i) => i.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.complianceUseCase.toLowerCase().includes(q),
      );
    }
    return items;
  }, [activeFilter, searchQuery]);

  const filteredCategories = useMemo(() => {
    const cats = Array.from(
      new Set(filteredIntegrations.map((i) => i.category)),
    );
    // Maintain original category order
    return CATEGORIES.filter((c) => cats.includes(c));
  }, [filteredIntegrations]);

  return (
    <div className="relative min-h-screen bg-canvas-900">
      <IntegrationsHero />

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          statusCounts={statusCounts}
        />

        <IntegrationStats />

        <IntegrationArchitecture />

        {/* Integration grid by category */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeFilter}-${searchQuery}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {filteredCategories.length === 0 ? (
              <div className="py-20 text-center">
                <Search className="mx-auto h-10 w-10 text-slate-600 mb-4" />
                <p className="text-sm text-slate-500">
                  No integrations match your search. Try a different term or
                  filter.
                </p>
              </div>
            ) : (
              filteredCategories.map((category, catIndex) => {
                const items = filteredIntegrations.filter(
                  (i) => i.category === category,
                );
                return (
                  <CategorySection
                    key={category}
                    category={category}
                    integrations={items}
                    categoryIndex={catIndex}
                  />
                );
              })
            )}
          </motion.div>
        </AnimatePresence>

        <RequestIntegrationCTA />
      </div>
    </div>
  );
}

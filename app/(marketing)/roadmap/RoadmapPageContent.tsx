'use client';

import { useRef, useState, useMemo } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import {
  Rocket,
  Loader2,
  Calendar,
  Compass,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
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
  type LucideIcon,
} from 'lucide-react';

/* ─── Types & Config ────────────────────────────────────── */

type RoadmapStatus = 'shipped' | 'in-progress' | 'planned' | 'exploring';

interface RoadmapItem {
  title: string;
  description: string;
  status: RoadmapStatus;
  quarter?: string;
  category: string;
  icon?: LucideIcon;
}

const STATUS_CONFIG: Record<
  RoadmapStatus,
  {
    label: string;
    icon: LucideIcon;
    dot: string;
    badge: string;
    glow: string;
    gradient: string;
    ringColor: string;
    sectionBg: string;
  }
> = {
  shipped: {
    label: 'Shipped',
    icon: CheckCircle2,
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]',
    gradient: 'from-emerald-500/20 to-emerald-500/0',
    ringColor: 'ring-emerald-400/40',
    sectionBg: 'from-emerald-500/[0.03] to-transparent',
  },
  'in-progress': {
    label: 'In Progress',
    icon: Loader2,
    dot: 'bg-blue-400',
    badge: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    glow: 'shadow-[0_0_20px_rgba(96,165,250,0.15)]',
    gradient: 'from-blue-500/20 to-blue-500/0',
    ringColor: 'ring-blue-400/40',
    sectionBg: 'from-blue-500/[0.03] to-transparent',
  },
  planned: {
    label: 'Planned',
    icon: Calendar,
    dot: 'bg-amber-400',
    badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]',
    gradient: 'from-amber-500/20 to-amber-500/0',
    ringColor: 'ring-amber-400/40',
    sectionBg: 'from-amber-500/[0.03] to-transparent',
  },
  exploring: {
    label: 'Exploring',
    icon: Compass,
    dot: 'bg-slate-400',
    badge: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
    glow: 'shadow-[0_0_20px_rgba(148,163,184,0.1)]',
    gradient: 'from-slate-500/20 to-slate-500/0',
    ringColor: 'ring-slate-400/40',
    sectionBg: 'from-slate-500/[0.03] to-transparent',
  },
};

/* ─── Roadmap Data ──────────────────────────────────────── */

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    title: 'SCIM 2.0 Provisioning',
    description:
      'RFC 7644 compliant SCIM server for automated user and group provisioning from Okta, Entra ID, and other identity providers.',
    status: 'shipped',
    quarter: 'Q1 2026',
    category: 'Identity & Security',
    icon: Users,
  },
  {
    title: 'Jira & Linear Integration',
    description:
      'Bidirectional sync of compliance tasks with Jira and Linear. Status, deadlines, and evidence links stay in sync.',
    status: 'shipped',
    quarter: 'Q1 2026',
    category: 'Integrations',
    icon: Link2,
  },
  {
    title: 'Google Drive Evidence Linking',
    description:
      'Link Google Drive files directly as compliance evidence with chain-of-custody metadata and version tracking.',
    status: 'shipped',
    quarter: 'Q1 2026',
    category: 'Integrations',
    icon: FileSearch,
  },
  {
    title: 'SHA-256 Evidence Checksums',
    description:
      'Client-side SHA-256 hash computed before upload and stored alongside every evidence artifact for tamper detection.',
    status: 'shipped',
    quarter: 'Q1 2026',
    category: 'Compliance Core',
    icon: Shield,
  },
  {
    title: 'Scheduled Compliance Checks',
    description:
      'Automated compliance posture checks running daily: expiring credentials, overdue tasks, evidence gaps, and score updates.',
    status: 'shipped',
    quarter: 'Q1 2026',
    category: 'Compliance Core',
    icon: Clock,
  },
  {
    title: 'Platform Features Page',
    description:
      'New marketing page showcasing 18 core features across compliance, workflow, security, and collaboration categories.',
    status: 'shipped',
    quarter: 'Q1 2026',
    category: 'Marketing & Docs',
    icon: Eye,
  },
  {
    title: 'US Data Residency',
    description:
      'Dedicated Supabase instance in US East for organisations requiring US-based data storage. Infrastructure configuration in progress.',
    status: 'in-progress',
    quarter: 'Q2 2026',
    category: 'Infrastructure',
    icon: Globe,
  },
  {
    title: 'EU Data Residency',
    description:
      'EU-based data storage for GDPR-first organisations. Supabase instance in eu-west region with automatic routing.',
    status: 'in-progress',
    quarter: 'Q2 2026',
    category: 'Infrastructure',
    icon: Globe,
  },
  {
    title: 'GitHub Evidence Pull',
    description:
      'Automated pulling of commit logs, PR approvals, branch protection configs, and code review history as SOC 2 CC8 evidence.',
    status: 'in-progress',
    quarter: 'Q2 2026',
    category: 'Integrations',
    icon: Zap,
  },
  {
    title: 'AWS CloudTrail Integration',
    description:
      'Pull IAM configuration snapshots, S3 access controls, and CloudTrail logs as compliance evidence artifacts.',
    status: 'in-progress',
    quarter: 'Q2 2026',
    category: 'Integrations',
    icon: Server,
  },
  {
    title: 'First Penetration Test',
    description:
      'Formal third-party penetration test and remediation cycle. Automated OWASP scanning is already live; this adds external validation.',
    status: 'planned',
    quarter: 'Q2 2026',
    category: 'Security',
    icon: Shield,
  },
  {
    title: 'SOC 2 Type II Certification',
    description:
      'Pursue SOC 2 Type II certification for FormaOS itself, starting with the observation period after completing pen test.',
    status: 'planned',
    quarter: 'Q3 2026',
    category: 'Security',
    icon: Shield,
  },
  {
    title: 'Additional Framework Packs',
    description:
      'Expand from 7 frameworks to 10+. Candidates include APRA CPS 234, Essential Eight maturity model, and NIST 800-53.',
    status: 'planned',
    quarter: 'Q3 2026',
    category: 'Compliance Core',
    icon: Target,
  },
  {
    title: 'HRIS Connectors',
    description:
      'Native connectors to Employment Hero, BambooHR, Deputy, and MYOB for workforce credential and training compliance tracking.',
    status: 'planned',
    quarter: 'Q3 2026',
    category: 'Integrations',
    icon: Users,
  },
  {
    title: 'ServiceNow Integration',
    description:
      'Sync incident records, change requests, and CMDB snapshots for ISO 27001 and SOC 2 change management controls.',
    status: 'planned',
    quarter: 'Q3 2026',
    category: 'Integrations',
    icon: Server,
  },
  {
    title: 'SharePoint Evidence Linking',
    description:
      'Pull policy documents and evidence files from SharePoint libraries with version tracking and access control metadata.',
    status: 'planned',
    quarter: 'Q3 2026',
    category: 'Integrations',
    icon: FileSearch,
  },
  {
    title: 'Azure Security Center Integration',
    description:
      'Collect Azure AD logs, resource compliance state, and Security Center findings as real-time compliance evidence.',
    status: 'planned',
    quarter: 'Q3 2026',
    category: 'Integrations',
    icon: Server,
  },
  {
    title: 'Google Cloud Platform Integration',
    description:
      'Import Cloud Audit Logs, IAM policy snapshots, and organisation policy evidence for framework mapping.',
    status: 'planned',
    quarter: 'Q4 2026',
    category: 'Integrations',
    icon: Globe,
  },
  {
    title: 'AI-Assisted Evidence Mapping',
    description:
      'Automatically suggest which evidence artifacts satisfy which control requirements using LLM-based matching.',
    status: 'exploring',
    category: 'Compliance Core',
    icon: Brain,
  },
  {
    title: 'Continuous Monitoring Dashboard',
    description:
      'Real-time dashboard showing live compliance posture across all frameworks with drift detection and alerting.',
    status: 'exploring',
    category: 'Compliance Core',
    icon: Eye,
  },
  {
    title: 'Multi-Tenant Auditor Portal',
    description:
      'Read-only auditor portal with scoped access to evidence, control mappings, and audit logs — no full account needed.',
    status: 'exploring',
    category: 'Compliance Core',
    icon: Users,
  },
  {
    title: 'Mobile App',
    description:
      'Native iOS and Android app for evidence capture (photo, document scan), task management, and compliance alerts on the go.',
    status: 'exploring',
    category: 'Platform',
    icon: Smartphone,
  },
];

const STATUS_ORDER: RoadmapStatus[] = [
  'shipped',
  'in-progress',
  'planned',
  'exploring',
];

const CATEGORIES = Array.from(new Set(ROADMAP_ITEMS.map((i) => i.category)));

/* ─── Animated Background ───────────────────────────────── */

function RoadmapHeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary gradient orb */}
      <motion.div
        className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/[0.07] blur-[120px]"
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 30, 0],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Secondary gradient orb */}
      <motion.div
        className="absolute -top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/[0.06] blur-[100px]"
        animate={{
          scale: [1.1, 1, 1.1],
          x: [0, -25, 0],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Cyan accent */}
      <motion.div
        className="absolute top-40 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-cyan-500/[0.04] blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

/* ─── Hero Section ──────────────────────────────────────── */

function RoadmapHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, -60]);

  return (
    <div ref={heroRef} className="relative overflow-hidden pb-8 pt-24 sm:pt-32">
      <RoadmapHeroBackground />
      <motion.div
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative mx-auto max-w-4xl px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-xs font-medium text-violet-400">
            <Rocket className="h-3.5 w-3.5" />
            Updated March 2026
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Product{' '}
          <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Roadmap
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-2xl text-base text-slate-400 leading-relaxed sm:text-lg"
        >
          What we&apos;ve shipped, what we&apos;re building, and where
          we&apos;re headed. Transparent product planning for compliance teams.
        </motion.p>
      </motion.div>
    </div>
  );
}

/* ─── Status Filter Bar ─────────────────────────────────── */

function StatusFilterBar({
  activeStatus,
  onStatusChange,
  counts,
}: {
  activeStatus: RoadmapStatus | 'all';
  onStatusChange: (status: RoadmapStatus | 'all') => void;
  counts: Record<RoadmapStatus | 'all', number>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mb-12 overflow-x-auto"
    >
      <div className="inline-flex items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1.5 backdrop-blur-sm">
        <button
          onClick={() => onStatusChange('all')}
          className={`relative rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-300 ${
            activeStatus === 'all'
              ? 'bg-white/[0.08] text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          All
          <span className="ml-1.5 text-[10px] opacity-60">{counts.all}</span>
        </button>
        {STATUS_ORDER.map((status) => {
          const config = STATUS_CONFIG[status];
          const StatusIcon = config.icon;
          return (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                activeStatus === status
                  ? 'bg-white/[0.08] text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <StatusIcon
                className={`h-3 w-3 ${activeStatus === status ? 'opacity-100' : 'opacity-50'}`}
              />
              {config.label}
              <span className="text-[10px] opacity-60">{counts[status]}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Stats Bar ─────────────────────────────────────────── */

function StatsBar() {
  const stats = [
    {
      label: 'Shipped',
      value: ROADMAP_ITEMS.filter((i) => i.status === 'shipped').length,
      color: 'text-emerald-400',
      description: 'Production-ready',
    },
    {
      label: 'Building',
      value: ROADMAP_ITEMS.filter((i) => i.status === 'in-progress').length,
      color: 'text-blue-400',
      description: 'Active development',
    },
    {
      label: 'Planned',
      value: ROADMAP_ITEMS.filter((i) => i.status === 'planned').length,
      color: 'text-amber-400',
      description: 'Committed timeline',
    },
    {
      label: 'Exploring',
      value: ROADMAP_ITEMS.filter((i) => i.status === 'exploring').length,
      color: 'text-slate-400',
      description: 'Under evaluation',
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

/* ─── Roadmap Card ──────────────────────────────────────── */

function RoadmapCard({ item, index }: { item: RoadmapItem; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = STATUS_CONFIG[item.status];
  const Icon = item.icon ?? Target;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.5,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm transition-all duration-500 hover:border-white/[0.14] hover:bg-white/[0.05] ${config.glow} overflow-hidden`}
    >
      {/* Top gradient accent */}
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${config.gradient} opacity-60`}
      />

      <div className="relative p-6">
        {/* Header row */}
        <div className="flex items-start gap-4 mb-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ${config.ringColor} transition-all duration-300 group-hover:bg-white/[0.08]`}
          >
            <Icon className="h-4.5 w-4.5 text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-bold text-white leading-snug">
                {item.title}
              </h3>
              {item.quarter && (
                <span className="shrink-0 rounded-lg bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-slate-500 ring-1 ring-white/[0.06]">
                  {item.quarter}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.badge}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${config.dot} ${item.status === 'in-progress' ? 'animate-pulse' : ''}`}
                />
                {config.label}
              </span>
              <span className="text-[10px] text-slate-600">
                {item.category}
              </span>
            </div>
          </div>
        </div>

        {/* Description — truncated by default, expandable */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left mt-2"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={isExpanded ? 'expanded' : 'collapsed'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`text-xs text-slate-400 leading-relaxed ${
                !isExpanded ? 'line-clamp-2' : ''
              }`}
            >
              {item.description}
            </motion.p>
          </AnimatePresence>
          {item.description.length > 100 && (
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              />
              {isExpanded ? 'Less' : 'More'}
            </div>
          )}
        </button>
      </div>

      {/* Bottom hover glow */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/[0.01] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </motion.div>
  );
}

/* ─── Timeline Section ──────────────────────────────────── */

function TimelineSection({
  status,
  items,
}: {
  status: RoadmapStatus;
  items: RoadmapItem[];
}) {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-20 relative"
    >
      {/* Section background glow */}
      <div
        className={`absolute -inset-x-4 -inset-y-8 rounded-3xl bg-gradient-to-b ${config.sectionBg} opacity-50 pointer-events-none`}
      />

      {/* Section header */}
      <div className="relative mb-8 flex items-center gap-4">
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
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-2 ${config.ringColor}`}
        >
          <StatusIcon
            className={`h-5 w-5 ${config.dot.replace('bg-', 'text-')}`}
          />
        </motion.div>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            {config.label}
            <span className="rounded-full bg-white/[0.06] px-3 py-0.5 text-xs font-normal text-slate-400">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </h2>
          {status === 'shipped' && (
            <p className="text-xs text-slate-500 mt-1">
              Delivered and available to all customers
            </p>
          )}
          {status === 'in-progress' && (
            <p className="text-xs text-slate-500 mt-1">
              Actively in development with expected delivery dates
            </p>
          )}
          {status === 'planned' && (
            <p className="text-xs text-slate-500 mt-1">
              Committed to the roadmap with target quarters
            </p>
          )}
          {status === 'exploring' && (
            <p className="text-xs text-slate-500 mt-1">
              Under evaluation — not commitments, open to feedback
            </p>
          )}
        </div>
      </div>

      {/* Cards grid */}
      <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <RoadmapCard key={item.title} item={item} index={index} />
        ))}
      </div>
    </motion.section>
  );
}

/* ─── Quarter Timeline Visual ───────────────────────────── */

function QuarterTimelineVisual() {
  const quarters = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];
  const currentQuarter = 'Q1 2026';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mb-20"
    >
      <h2 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-violet-400" />
        Delivery Timeline
      </h2>
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-6 left-0 right-0 h-px bg-gradient-to-r from-violet-500/30 via-blue-500/20 to-transparent" />

        <div className="grid grid-cols-4 gap-4">
          {quarters.map((quarter, index) => {
            const isCurrent = quarter === currentQuarter;
            const count = ROADMAP_ITEMS.filter(
              (i) => i.quarter === quarter,
            ).length;
            const shipped = ROADMAP_ITEMS.filter(
              (i) => i.quarter === quarter && i.status === 'shipped',
            ).length;
            const inProgress = ROADMAP_ITEMS.filter(
              (i) => i.quarter === quarter && i.status === 'in-progress',
            ).length;

            return (
              <motion.div
                key={quarter}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.5 + index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative"
              >
                {/* Node */}
                <div className="mb-4 flex justify-start">
                  <div
                    className={`relative h-3 w-3 rounded-full ${
                      isCurrent
                        ? 'bg-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.5)]'
                        : index < quarters.indexOf(currentQuarter)
                          ? 'bg-emerald-400'
                          : 'bg-white/20'
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-30" />
                    )}
                  </div>
                </div>
                <div
                  className={`rounded-xl border p-4 transition-all ${
                    isCurrent
                      ? 'border-violet-500/30 bg-violet-500/[0.05]'
                      : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                >
                  <div
                    className={`text-xs font-bold ${isCurrent ? 'text-violet-400' : 'text-slate-300'}`}
                  >
                    {quarter}
                    {isCurrent && (
                      <span className="ml-2 text-[9px] font-normal text-violet-400/60 uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">
                    {count}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {shipped > 0 && (
                      <span className="text-emerald-400">
                        {shipped} shipped
                      </span>
                    )}
                    {shipped > 0 && inProgress > 0 && (
                      <span className="text-slate-600"> · </span>
                    )}
                    {inProgress > 0 && (
                      <span className="text-blue-400">{inProgress} active</span>
                    )}
                    {shipped === 0 && inProgress === 0 && (
                      <span>items planned</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Category Breakdown ────────────────────────────────── */

function CategoryBreakdown() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-20"
    >
      <h2 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
        <Target className="h-4 w-4 text-cyan-400" />
        By Category
      </h2>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((cat, index) => {
          const items = ROADMAP_ITEMS.filter((i) => i.category === cat);
          const shipped = items.filter((i) => i.status === 'shipped').length;
          const total = items.length;
          const percentage = Math.round((shipped / total) * 100);

          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="text-xs font-semibold text-white mb-2">{cat}</div>
              {/* Progress bar */}
              <div className="h-1 rounded-full bg-white/[0.06] mb-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${percentage}%` }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {total} item{total !== 1 ? 's' : ''}
                </span>
                <span className="text-[10px] text-emerald-400">
                  {shipped}/{total} shipped
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Transparency Commitment ───────────────────────────── */

function TransparencyCommitment() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-violet-500/[0.04] to-transparent p-10 text-center mb-20"
    >
      {/* Floating particles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-violet-400/30"
          style={{
            top: `${20 + i * 20}%`,
            left: `${15 + i * 22}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        />
      ))}

      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20"
      >
        <Sparkles className="h-6 w-6 text-violet-400" />
      </motion.div>

      <h2 className="text-lg font-bold text-white mb-3">
        Our Commitment to Transparency
      </h2>
      <p className="mx-auto max-w-2xl text-sm text-slate-400 leading-relaxed">
        We only advertise features that exist and work today. This roadmap shows
        what&apos;s coming so you can plan your compliance programme with
        confidence. Items in &quot;Exploring&quot; are ideas we&apos;re
        evaluating — not commitments. If a feature matters to your organisation,{' '}
        <a
          href="mailto:support@formaos.com"
          className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
        >
          tell us
        </a>{' '}
        and it will influence our priorities.
      </p>
    </motion.div>
  );
}

/* ─── Feature Request CTA ───────────────────────────────── */

function FeatureRequestCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.06] via-blue-500/[0.04] to-violet-500/[0.06] p-10 text-center"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.05] to-transparent opacity-50 pointer-events-none" />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-cyan-400/20"
          style={{
            top: `${10 + ((i * 15) % 80)}%`,
            left: `${5 + ((i * 18) % 90)}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 10, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.7,
          }}
        />
      ))}

      <div className="relative">
        <h3 className="text-xl font-bold text-white mb-3">Shape the Roadmap</h3>
        <p className="mx-auto max-w-md text-sm text-slate-400 mb-8 leading-relaxed">
          Feature requests directly influence our priorities. Tell us which
          tool, integration, or capability would accelerate your compliance
          programme.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="mailto:support@formaos.com"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:shadow-cyan-500/30 hover:brightness-110"
          >
            Request a Feature
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-7 py-3 text-sm font-semibold text-slate-300 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
          >
            Talk to the Team
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ────────────────────────────────────── */

export default function RoadmapPageContent() {
  const [activeStatus, setActiveStatus] = useState<RoadmapStatus | 'all'>(
    'all',
  );

  const counts = useMemo(() => {
    const result: Record<RoadmapStatus | 'all', number> = {
      all: ROADMAP_ITEMS.length,
      shipped: ROADMAP_ITEMS.filter((i) => i.status === 'shipped').length,
      'in-progress': ROADMAP_ITEMS.filter((i) => i.status === 'in-progress')
        .length,
      planned: ROADMAP_ITEMS.filter((i) => i.status === 'planned').length,
      exploring: ROADMAP_ITEMS.filter((i) => i.status === 'exploring').length,
    };
    return result;
  }, []);

  const filteredStatuses =
    activeStatus === 'all'
      ? STATUS_ORDER
      : STATUS_ORDER.filter((s) => s === activeStatus);

  return (
    <div className="relative min-h-screen bg-canvas-900">
      <RoadmapHero />

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <StatusFilterBar
          activeStatus={activeStatus}
          onStatusChange={setActiveStatus}
          counts={counts}
        />

        <StatsBar />

        <QuarterTimelineVisual />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStatus}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {filteredStatuses.map((status) => {
              const items = ROADMAP_ITEMS.filter((i) => i.status === status);
              if (items.length === 0) return null;
              return (
                <TimelineSection key={status} status={status} items={items} />
              );
            })}
          </motion.div>
        </AnimatePresence>

        <CategoryBreakdown />

        <TransparencyCommitment />

        <FeatureRequestCTA />

        {/* Last updated footer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 text-center text-xs text-slate-600"
        >
          Last updated: March 2026. This roadmap reflects our current plans and
          is subject to change.
        </motion.p>
      </div>
    </div>
  );
}

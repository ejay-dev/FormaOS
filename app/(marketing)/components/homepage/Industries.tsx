'use client';

import {
  memo,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { duration, easing } from '@/config/motion';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Heart,
  Users,
  TrendingUp,
  GraduationCap,
  Building2,
  Shield,
  FileText,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  Clock,
  Layers,
  BadgeCheck,
  Zap,
  Lock,
  Eye,
} from 'lucide-react';

const signatureEase: [number, number, number, number] = [
  ...easing.signature,
] as [number, number, number, number];

/* ════════════════════════════════════════════════════════════
   Color system
   ════════════════════════════════════════════════════════════ */

type Accent = 'rose' | 'violet' | 'amber' | 'cyan' | 'indigo';

const ACCENT_MAP: Record<
  Accent,
  {
    icon: string;
    bg: string;
    border: string;
    activeBorder: string;
    text: string;
    glow: string;
    glowRgba: string;
    gradient: string;
    statGradient: string;
  }
> = {
  rose: {
    icon: 'text-rose-400',
    bg: 'bg-rose-500/[0.1]',
    border: 'border-rose-400/20',
    activeBorder: 'border-rose-400/30',
    text: 'text-rose-400',
    glow: 'rgba(244,63,94,0.12)',
    glowRgba: 'rgba(244,63,94,0.06)',
    gradient: 'from-rose-500/20 to-rose-500/0',
    statGradient: 'from-rose-400 to-rose-500',
  },
  violet: {
    icon: 'text-violet-400',
    bg: 'bg-violet-500/[0.1]',
    border: 'border-violet-400/20',
    activeBorder: 'border-violet-400/30',
    text: 'text-violet-400',
    glow: 'rgba(139,92,246,0.12)',
    glowRgba: 'rgba(139,92,246,0.06)',
    gradient: 'from-violet-500/20 to-violet-500/0',
    statGradient: 'from-violet-400 to-violet-500',
  },
  amber: {
    icon: 'text-amber-400',
    bg: 'bg-amber-500/[0.1]',
    border: 'border-amber-400/20',
    activeBorder: 'border-amber-400/30',
    text: 'text-amber-400',
    glow: 'rgba(251,191,36,0.12)',
    glowRgba: 'rgba(251,191,36,0.06)',
    gradient: 'from-amber-500/20 to-amber-500/0',
    statGradient: 'from-amber-400 to-amber-500',
  },
  cyan: {
    icon: 'text-cyan-400',
    bg: 'bg-cyan-500/[0.1]',
    border: 'border-cyan-400/20',
    activeBorder: 'border-cyan-400/30',
    text: 'text-cyan-400',
    glow: 'rgba(6,182,212,0.12)',
    glowRgba: 'rgba(6,182,212,0.06)',
    gradient: 'from-cyan-500/20 to-cyan-500/0',
    statGradient: 'from-cyan-400 to-cyan-500',
  },
  indigo: {
    icon: 'text-indigo-400',
    bg: 'bg-indigo-500/[0.1]',
    border: 'border-indigo-400/20',
    activeBorder: 'border-indigo-400/30',
    text: 'text-indigo-400',
    glow: 'rgba(99,102,241,0.12)',
    glowRgba: 'rgba(99,102,241,0.06)',
    gradient: 'from-indigo-500/20 to-indigo-500/0',
    statGradient: 'from-indigo-400 to-indigo-500',
  },
};

/* ════════════════════════════════════════════════════════════
   Data — visual-first: stats, frameworks, short tagline
   ════════════════════════════════════════════════════════════ */

interface StatItem {
  icon: LucideIcon;
  value: string;
  label: string;
}

interface IndustrySolution {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tagline: string;
  accent: Accent;
  frameworks: string[];
  stats: StatItem[];
  capabilities: {
    icon: LucideIcon;
    title: string;
    description: string;
  }[];
  cta: {
    text: string;
    href: string;
  };
}

const industrySolutions: IndustrySolution[] = [
  {
    icon: Heart,
    title: 'Healthcare',
    subtitle: 'HIPAA · RACGP · AHPRA · NSQHS',
    tagline:
      'Patient safety evidence and clinical governance — audit-ready in minutes, not weeks.',
    accent: 'rose',
    frameworks: ['RACGP', 'AHPRA', 'NSQHS', 'HIPAA'],
    stats: [
      { icon: Layers, value: '47', label: 'Controls mapped' },
      { icon: Clock, value: '< 2 days', label: 'Audit prep time' },
      { icon: Eye, value: '100%', label: 'Event coverage' },
      { icon: BadgeCheck, value: '4', label: 'Accreditations' },
    ],
    capabilities: [
      {
        icon: Shield,
        title: 'Clinical Governance',
        description: 'Audit trails for every compliance action and policy acknowledgment',
      },
      {
        icon: FileText,
        title: 'Incident Management',
        description: 'Category-based capture aligned to regulator requirements',
      },
      {
        icon: CheckCircle,
        title: 'Accreditation Ready',
        description: 'Configurable templates for RACGP, AHPRA, and NSQHS',
      },
    ],
    cta: { text: 'Explore Healthcare Solution', href: '/use-cases/healthcare' },
  },
  {
    icon: Users,
    title: 'NDIS Providers',
    subtitle: 'NDIS Practice Standards · Quality & Safeguards Commission',
    tagline:
      'Safeguarding registers, worker screening, and incident timelines — built for Commission audits.',
    accent: 'violet',
    frameworks: ['NDIS Practice Standards', 'Q&S Commission'],
    stats: [
      { icon: Shield, value: '100%', label: 'Safeguard coverage' },
      { icon: Clock, value: '24 hr', label: 'Incident notify' },
      { icon: Layers, value: '38', label: 'Controls mapped' },
      { icon: BadgeCheck, value: '2', label: 'Audit packs' },
    ],
    capabilities: [
      {
        icon: Shield,
        title: 'Safeguarding System',
        description: 'Participant consent tracking with full audit trail',
      },
      {
        icon: FileText,
        title: 'Incident Reporting',
        description: 'Commission-mandated notification timelines built in',
      },
      {
        icon: CheckCircle,
        title: 'Audit Evidence',
        description: 'Evidence bundles structured for NDIS auditor access',
      },
    ],
    cta: { text: 'Explore NDIS Solution', href: '/use-cases/ndis-aged-care' },
  },
  {
    icon: TrendingUp,
    title: 'Financial Services',
    subtitle: 'SOC 2 · ISO 27001 · ASIC · APRA',
    tagline:
      'Multi-framework compliance packs with cross-mapping — one evidence item, multiple frameworks.',
    accent: 'amber',
    frameworks: ['SOC 2', 'ISO 27001', 'PCI-DSS', 'APRA CPS 230'],
    stats: [
      { icon: Layers, value: '4', label: 'Framework packs' },
      { icon: Clock, value: '< 2 days', label: 'Audit prep' },
      { icon: Zap, value: '85%', label: 'Faster collection' },
      { icon: Lock, value: '100%', label: 'Vendor tracked' },
    ],
    capabilities: [
      {
        icon: Shield,
        title: 'Control Monitoring',
        description: 'Gap visibility with APRA/ASIC alignment dashboards',
      },
      {
        icon: FileText,
        title: 'Evidence Automation',
        description: 'Audit-ready export packs for external reviewers',
      },
      {
        icon: CheckCircle,
        title: 'Audit Acceleration',
        description: 'Weeks of prep compressed to under 2 days',
      },
    ],
    cta: {
      text: 'Explore Financial Solution',
      href: '/use-cases/financial-services',
    },
  },
  {
    icon: GraduationCap,
    title: 'Education & Accreditation',
    subtitle: 'TEQSA · ASQA · RTO Standards · VRQA',
    tagline:
      'Academic governance and trainer credentials — evidence organized by standard for instant retrieval.',
    accent: 'cyan',
    frameworks: ['TEQSA', 'ASQA', 'RTO Standards', 'VRQA'],
    stats: [
      { icon: Layers, value: '52', label: 'Standards mapped' },
      { icon: Clock, value: 'Instant', label: 'Evidence retrieval' },
      { icon: BadgeCheck, value: '3', label: 'Registrations' },
      { icon: FileText, value: '100%', label: 'Staff credentials' },
    ],
    capabilities: [
      {
        icon: Shield,
        title: 'Academic Governance',
        description: 'Policy lifecycle with academic board approval trails',
      },
      {
        icon: FileText,
        title: 'RTO Compliance',
        description: 'Training package mapping and learner file audits',
      },
      {
        icon: CheckCircle,
        title: 'Registration Ready',
        description: 'Organized by TEQSA/ASQA standard for site audits',
      },
    ],
    cta: { text: 'Explore Education Solution', href: '/industries' },
  },
  {
    icon: Building2,
    title: 'Government & Public Sector',
    subtitle: 'FOI · ISM · PSPF · Essential Eight',
    tagline:
      'Decision registers, FOI tracking, and Essential Eight maturity — every action documented and defensible.',
    accent: 'indigo',
    frameworks: ['ISM', 'PSPF', 'Essential Eight', 'FOI Act'],
    stats: [
      { icon: Layers, value: '8', label: 'Mitigation strategies' },
      { icon: Shield, value: '100%', label: 'Decision audit' },
      { icon: Lock, value: 'Granular', label: 'Access control' },
      { icon: FileText, value: 'Full', label: 'FOI readiness' },
    ],
    capabilities: [
      {
        icon: Shield,
        title: 'Accountability',
        description: 'Ministerial-ready documentation packages',
      },
      {
        icon: FileText,
        title: 'Information Management',
        description: 'Records classification and disposal tracking per PSPF',
      },
      {
        icon: CheckCircle,
        title: 'Essential Eight',
        description: 'Maturity tracking mapped to each mitigation strategy',
      },
    ],
    cta: {
      text: 'Explore Government Solution',
      href: '/use-cases/government-public-sector',
    },
  },
];

/* ════════════════════════════════════════════════════════════
   StatCard — big visual metric
   ════════════════════════════════════════════════════════════ */

const StatCard = memo(function StatCard({
  stat,
  accent,
  index,
  noMotion,
}: {
  stat: StatItem;
  accent: Accent;
  index: number;
  noMotion: boolean;
}) {
  const a = ACCENT_MAP[accent];
  const Icon = stat.icon;

  return (
    <motion.div
      initial={noMotion ? false : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 + index * 0.06, ease: signatureEase }}
      className={`relative rounded-xl border ${a.border} bg-white/[0.03] p-4 text-center overflow-hidden group`}
    >
      {/* Background accent glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 80%, ${a.glow}, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <div
          className={`inline-flex items-center justify-center rounded-lg ${a.bg} p-1.5 mb-2`}
        >
          <Icon className={`w-3.5 h-3.5 ${a.icon}`} />
        </div>
        <p
          className={`text-xl sm:text-2xl font-bold mb-0.5 bg-clip-text text-transparent bg-gradient-to-b ${a.statGradient}`}
        >
          {stat.value}
        </p>
        <p className="text-[11px] text-slate-500 font-medium">{stat.label}</p>
      </div>
    </motion.div>
  );
});

/* ════════════════════════════════════════════════════════════
   CapabilityCard — compact visual card
   ════════════════════════════════════════════════════════════ */

const CapabilityCard = memo(function CapabilityCard({
  capability,
  accent,
  index,
  noMotion,
}: {
  capability: { icon: LucideIcon; title: string; description: string };
  accent: Accent;
  index: number;
  noMotion: boolean;
}) {
  const a = ACCENT_MAP[accent];
  const CapIcon = capability.icon;
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  const tiltX = hovered && !noMotion ? (mouse.y - 0.5) * -6 : 0;
  const tiltY = hovered && !noMotion ? (mouse.x - 0.5) * 6 : 0;

  return (
    <motion.div
      initial={noMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + index * 0.08 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setMouse({ x: 0.5, y: 0.5 });
      }}
      className="group/cap relative"
      style={{ perspective: '700px' }}
    >
      <div
        className={`relative h-full overflow-hidden rounded-xl border ${a.border} bg-white/[0.03] hover:bg-white/[0.05] transition-colors duration-300 p-4`}
        style={{
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: hovered
            ? 'transform 0.15s ease-out'
            : 'transform 0.4s ease-out',
        }}
      >
        {hovered && !noMotion && (
          <div
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              background: `radial-gradient(250px circle at ${mouse.x * 100}% ${mouse.y * 100}%, ${a.glow}, transparent 70%)`,
            }}
          />
        )}

        <div className="relative z-10">
          <div
            className={`inline-flex items-center justify-center rounded-lg border ${a.border} ${a.bg} p-2 mb-2.5`}
          >
            <CapIcon className={`w-4 h-4 ${a.icon}`} />
          </div>
          <h4 className="text-white text-sm font-semibold mb-1">
            {capability.title}
          </h4>
          <p className="text-slate-500 text-xs leading-relaxed">
            {capability.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

/* ════════════════════════════════════════════════════════════
   AccordionItem
   ════════════════════════════════════════════════════════════ */

const AccordionItem = memo(function AccordionItem({
  solution,
  index,
  isExpanded,
  onToggle,
  isInView,
  noMotion,
}: {
  solution: IndustrySolution;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isInView: boolean;
  noMotion: boolean;
}) {
  const Icon = solution.icon;
  const a = ACCENT_MAP[solution.accent];
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isExpanded) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMouse({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    },
    [isExpanded],
  );

  return (
    <motion.div
      initial={noMotion ? false : { opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: duration.slow,
        delay: 0.15 + index * 0.07,
        ease: signatureEase,
      }}
    >
      {/* Trigger */}
      <button
        onClick={onToggle}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setMouse({ x: 0.5, y: 0.5 });
        }}
        className={`group relative w-full text-left rounded-2xl border overflow-hidden transition-all duration-300 ${
          isExpanded
            ? `bg-white/[0.06] ${a.activeBorder}`
            : `bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.04]`
        }`}
      >
        {isExpanded && (
          <div
            className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${a.gradient}`}
          />
        )}

        {!isExpanded && hovered && !noMotion && (
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background: `radial-gradient(400px circle at ${mouse.x * 100}% ${mouse.y * 100}%, ${a.glowRgba}, transparent 70%)`,
            }}
          />
        )}

        <div className="relative z-10 flex items-center justify-between p-5 lg:p-6">
          <div className="flex items-center gap-4 lg:gap-5">
            <div className="relative">
              <div
                className={`inline-flex items-center justify-center rounded-xl border ${a.border} ${a.bg} p-3 transition-all duration-300 ${
                  isExpanded ? 'scale-110' : ''
                }`}
              >
                <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${a.icon}`} />
              </div>
              {isExpanded && !noMotion && (
                <motion.div
                  className={`absolute inset-0 rounded-xl border ${a.border}`}
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              )}
            </div>
            <div>
              <h3 className="text-base lg:text-xl font-bold text-white mb-0.5">
                {solution.title}
              </h3>
              <p className="text-xs lg:text-sm text-slate-500">
                {solution.subtitle}
              </p>
            </div>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: signatureEase }}
            className={`ml-4 shrink-0 ${a.text}`}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </div>
      </button>

      {/* Expanded panel — visual-first layout */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duration.normal, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-1 relative rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
              {/* Ambient glow */}
              <div
                className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none opacity-30"
                style={{ background: a.glow }}
              />

              <div className="relative z-10 p-5 lg:p-7">
                {/* Row 1: Tagline + framework badges */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
                  <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                    {solution.tagline}
                  </p>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    {solution.frameworks.map((fw) => (
                      <span
                        key={fw}
                        className={`inline-flex items-center rounded-md border ${a.border} ${a.bg} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${a.text}`}
                      >
                        {fw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Row 2: Stats grid — the visual punch */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
                  {solution.stats.map((stat, i) => (
                    <StatCard
                      key={stat.label}
                      stat={stat}
                      accent={solution.accent}
                      index={i}
                      noMotion={noMotion}
                    />
                  ))}
                </div>

                {/* Row 3: Capability cards */}
                <div className="grid md:grid-cols-3 gap-2.5 mb-5">
                  {solution.capabilities.map((capability, i) => (
                    <CapabilityCard
                      key={capability.title}
                      capability={capability}
                      accent={solution.accent}
                      index={i}
                      noMotion={noMotion}
                    />
                  ))}
                </div>

                {/* CTA row */}
                <div className="flex items-center justify-end pt-4 border-t border-white/[0.06]">
                  <Link
                    href={solution.cta.href}
                    className="mk-btn mk-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
                  >
                    {solution.cta.text}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

/* ════════════════════════════════════════════════════════════
   Main Industries section
   ════════════════════════════════════════════════════════════ */

export const Industries = memo(function Industries() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const noMotion = Boolean(useReducedMotion());
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = useCallback(
    (index: number) => {
      setExpandedIndex(expandedIndex === index ? null : index);
    },
    [expandedIndex],
  );

  return (
    <section
      ref={sectionRef}
      className="mk-section home-section home-section--contrast relative overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #020617 0%, #080d20 35%, #0c1129 60%, #020617 100%)',
      }}
    >
      {/* Edge lines */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(251,191,36,0.1) 30%, rgba(251,191,36,0.18) 50%, rgba(251,191,36,0.1) 70%, transparent 95%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(251,191,36,0.06) 50%, transparent 95%)',
        }}
      />

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{ left: '-8%', top: '15%', background: 'rgba(244,63,94,0.04)' }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[130px]"
          style={{
            right: '-5%',
            top: '40%',
            background: 'rgba(139,92,246,0.04)',
          }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{
            left: '25%',
            bottom: '5%',
            background: 'rgba(251,191,36,0.03)',
          }}
          animate={noMotion ? false : { opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(251,191,36,0.4) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Heading */}
        <div className="text-center mb-16 lg:mb-20">
          <motion.div
            initial={noMotion ? false : { opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: duration.slow, ease: signatureEase }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/[0.08] border border-amber-400/20 text-amber-400 text-xs sm:text-sm font-medium">
              <span className="relative flex h-1.5 w-1.5">
                {!noMotion && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                )}
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
              </span>
              Industry Solutions
            </span>
          </motion.div>

          <motion.div
            initial={noMotion ? false : { opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{
              duration: duration.slow,
              delay: 0.05,
              ease: signatureEase,
            }}
            className="relative"
          >
            {!noMotion && (
              <motion.div
                className="absolute -inset-x-16 -inset-y-8 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse 40% 50% at 50% 50%, rgba(251,191,36,0.06), transparent)',
                  filter: 'blur(24px)',
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
            <h2 className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Built for{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
                }}
              >
                high-accountability
              </span>{' '}
              industries
            </h2>
          </motion.div>

          <motion.p
            initial={noMotion ? false : { opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{
              duration: duration.slow,
              delay: 0.1,
              ease: signatureEase,
            }}
            className="text-base md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            When compliance failure means regulatory action, accreditation loss,
            or operational shutdown, FormaOS delivers the evidence
            infrastructure your industry demands.
          </motion.p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {industrySolutions.map((solution, index) => (
            <AccordionItem
              key={solution.title}
              solution={solution}
              index={index}
              isExpanded={expandedIndex === index}
              onToggle={() => toggleExpand(index)}
              isInView={isInView}
              noMotion={noMotion}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={noMotion ? false : { opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{
            duration: duration.slow,
            delay: 0.6,
            ease: signatureEase,
          }}
          className="mt-12 text-center"
        >
          <p className="text-slate-500 mb-5">
            Not sure which solution fits your organization?
          </p>
          <Link
            href="/contact"
            className="mk-btn mk-btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold"
          >
            Talk to a Compliance Expert
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
});

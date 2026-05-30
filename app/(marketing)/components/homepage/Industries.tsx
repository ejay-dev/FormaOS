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
import { SectionMedia } from '@/components/marketing/SectionMedia';
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
   Accent system — monochrome. No per-industry colour identity:
   surfaces stay white/slate so the copy and structure carry it.
   ════════════════════════════════════════════════════════════ */

type Accent = 'rose' | 'violet' | 'amber' | 'cyan' | 'indigo';

const NEUTRAL_ACCENT = {
  icon: 'text-slate-300',
  bg: 'bg-white/[0.05]',
  border: 'border-white/[0.08]',
  activeBorder: 'border-white/20',
  text: 'text-slate-400',
} as const;

const ACCENT_MAP: Record<Accent, typeof NEUTRAL_ACCENT> = {
  rose: NEUTRAL_ACCENT,
  violet: NEUTRAL_ACCENT,
  amber: NEUTRAL_ACCENT,
  cyan: NEUTRAL_ACCENT,
  indigo: NEUTRAL_ACCENT,
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
      { icon: Layers, value: '10', label: 'HIPAA Safeguards' },
      { icon: Clock, value: 'Hash-chained', label: 'Audit log' },
      { icon: Eye, value: 'AU-hosted', label: 'Default region' },
      { icon: BadgeCheck, value: '90/60/30d', label: 'Credential alerts' },
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
    cta: { text: 'Explore Healthcare Solution', href: '/healthcare-compliance' },
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
      { icon: Layers, value: '25', label: 'Practice Standards evaluators' },
      { icon: Clock, value: '24h / 5bd', label: 'SIRS clock encoded' },
      { icon: Shield, value: '5-year', label: 'Worker screening track' },
      { icon: BadgeCheck, value: 'P28.1', label: 'Q&S portal aligned' },
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
    cta: { text: 'Explore NDIS Solution', href: '/ndis-providers' },
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
      { icon: Layers, value: '61', label: 'SOC 2 TSC controls' },
      { icon: Layers, value: '93', label: 'ISO 27001 controls' },
      { icon: Zap, value: 'APRA CPS', label: '230 + 234 templates' },
      { icon: Lock, value: 'Daily', label: 'Sigstore anchor' },
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
      href: '/financial-services-compliance',
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
      { icon: Layers, value: 'TEQSA', label: '+ ASQA templates' },
      { icon: FileText, value: 'Credential', label: 'expiry alerts' },
      { icon: BadgeCheck, value: 'Multi-site', label: 'org hierarchy' },
      { icon: Clock, value: 'Hash-chained', label: 'audit log' },
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
      { icon: Layers, value: '8', label: 'Essential Eight mitigations' },
      { icon: Shield, value: 'Append-only', label: 'Immutable audit log' },
      { icon: Lock, value: 'RBAC', label: '+ row-level isolation' },
      { icon: FileText, value: 'PSPF', label: 'classification model' },
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
      className={`relative rounded-xl border ${a.border} bg-white/[0.03] p-4 text-center overflow-hidden transition-colors duration-300 hover:border-white/20`}
    >
      <div className="relative z-10">
        <div
          className={`inline-flex items-center justify-center rounded-lg ${a.bg} p-1.5 mb-2`}
        >
          <Icon className={`w-3.5 h-3.5 ${a.icon}`} />
        </div>
        <p className="text-xl sm:text-2xl font-bold mb-0.5 text-white">
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
        className={`relative h-full overflow-hidden rounded-xl border ${a.border} bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] transition-colors duration-300 p-4`}
        style={{
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: hovered
            ? 'transform 0.15s ease-out'
            : 'transform 0.4s ease-out',
        }}
      >
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
        className={`group relative w-full text-left rounded-2xl border overflow-hidden transition-all duration-300 ${
          isExpanded
            ? `bg-white/[0.06] ${a.activeBorder}`
            : `bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.04]`
        }`}
      >
        {isExpanded && (
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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
            <div className="mt-1 relative rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
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
                        className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"
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
      className="mk-section home-section home-section--contrast relative isolate overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #020617 0%, #080d20 35%, #0c1129 60%, #020617 100%)',
      }}
    >
      <SectionMedia
        src="/marketing-media/use-case-ndis-aged-care.jpg"
        objectPosition="50% 38%"
        opacity={0.28}
        scrim="center"
      />
      {/* Hairline top seam */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Editorial header — asymmetric, left-aligned. A labelled rule and a
            paired description column replace the centred eyebrow-pill template. */}
        <div className="mb-12 grid gap-x-10 gap-y-6 border-b border-white/[0.06] pb-10 lg:mb-14 lg:grid-cols-12 lg:items-end">
          <motion.div
            initial={noMotion ? false : { opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: duration.slow, ease: signatureEase }}
            className="lg:col-span-7"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-white/25" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Industry Solutions
              </span>
            </div>
            <h2 className="text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
              Built for high-accountability industries
            </h2>
          </motion.div>

          <motion.div
            initial={noMotion ? false : { opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{
              duration: duration.slow,
              delay: 0.08,
              ease: signatureEase,
            }}
            className="lg:col-span-5"
          >
            <p className="max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
              When compliance failure means regulatory action, accreditation
              loss, or operational shutdown, FormaOS delivers the evidence
              infrastructure your industry demands.
            </p>
          </motion.div>
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

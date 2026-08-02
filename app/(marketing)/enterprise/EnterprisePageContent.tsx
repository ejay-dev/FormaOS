'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Globe,
  FileText,
  CheckCircle2,
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronRight,
  Database,
  Key,
  HeartPulse,
  Scale,
  Fingerprint,
  Monitor,
  CloudCog,
  BookOpen,
  UserCheck,
  AlertTriangle,
  GitBranch,
  type LucideIcon,
} from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { SectionMedia } from '@/components/marketing/SectionMedia';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { demoHref, PUBLIC_CTA_LABELS, salesHref } from '@/lib/marketing/cta';
import { getPackClaim } from '@/lib/marketing/claims';

/* ─── Easing ──────────────────────────────────────────────── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─── Section Headers ─────────────────────────────────────────
   Two restrained header treatments, a centred-minimal label and an
   editorial left-aligned label flanked by a hairline rule. Sections
   alternate between them so the page does not read as one repeated
   template.
   ──────────────────────────────────────────────────────────── */

const stickySalesHref = salesHref('enterprise_sticky');

/** Mobile-only thumb-reachable primary CTA (shown below md, post-hero). */
function MobileStickyCta() {
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
          transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0f1c]/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur-md md:hidden"
        >
          <Link
            href={stickySalesHref}
            onClick={() =>
              trackCtaClick({
                surface: 'enterprise',
                section: 'sticky_cta',
                location: 'mobile_sticky',
                ctaLabel: PUBLIC_CTA_LABELS.talkToSales,
                ctaHref: stickySalesHref,
                variant: 'primary',
              })
            }
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-[15px] font-semibold text-slate-900 transition active:bg-slate-100"
          >
            {PUBLIC_CTA_LABELS.talkToSales}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

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
      <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
        {title} <span className="text-slate-400">{emphasis}</span>
      </h2>
      <p className="text-base text-slate-400 max-w-xl mx-auto">{description}</p>
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

/* ─── Trust Badges ────────────────────────────────────────── */

interface TrustBadge {
  icon: LucideIcon;
  label: string;
  detail: string;
  colorRgb: string;
}

const trustBadges: TrustBadge[] = [
  {
    icon: ShieldCheck,
    label: 'Security review ready',
    detail: 'Procurement materials available on request',
    colorRgb: '203,213,225',
  },
  {
    icon: Scale,
    label: 'Audit-ready exports',
    detail: 'Evidence and control context preserved',
    colorRgb: '148,163,184',
  },
  {
    icon: Globe,
    label: 'AU-hosted by default',
    detail: 'Additional residency needs reviewed during procurement',
    colorRgb: '161,161,170',
  },
  {
    icon: HeartPulse,
    label: 'Public status visibility',
    detail: 'Operational updates and uptime checks published',
    colorRgb: '203,213,225',
  },
  {
    icon: Building2,
    label: 'SAML + MFA',
    detail: 'Enterprise identity controls supported',
    colorRgb: '161,161,170',
  },
  {
    icon: Lock,
    label: 'DPA and subprocessor docs',
    detail: 'Available for enterprise review',
    colorRgb: '148,163,184',
  },
];

/* ─── Enterprise Security Architecture ────────────────────── */

interface SecurityLayer {
  name: string;
  icon: LucideIcon;
  description: string;
  controls: string[];
  colorRgb: string;
}

const securityLayers: SecurityLayer[] = [
  {
    name: 'Application Security',
    icon: Monitor,
    description:
      'Security headers, input validation, dependency review, and controlled release practices across the platform.',
    controls: [
      'Content Security Policy (CSP)',
      'Input validation and sanitization',
      'Dependency and vulnerability review',
      'Controlled release and rollback procedures',
    ],
    colorRgb: '203,213,225',
  },
  {
    name: 'Authentication & Identity',
    icon: Fingerprint,
    description:
      'Enterprise identity controls centered on SAML SSO, MFA enforcement, session policy, and audited role changes.',
    controls: [
      'SAML 2.0 SSO',
      'MFA enforcement',
      'Session policy controls',
      'Audited role and access changes',
    ],
    colorRgb: '148,163,184',
  },
  {
    name: 'Data Protection',
    icon: Database,
    description:
      'AES-256 encryption at rest, TLS 1.3 in transit, export controls, and encrypted backup workflows.',
    controls: [
      'AES-256 encryption at rest',
      'TLS 1.3 in transit',
      'Controlled export workflows',
      'Encrypted backup handling',
    ],
    colorRgb: '161,161,170',
  },
  {
    name: 'Infrastructure Security',
    icon: CloudCog,
    description:
      'Enterprise cloud hosting with environment separation, backup procedures, and documented operational recovery planning.',
    controls: [
      'AU-hosted default deployment',
      'Environment separation',
      'Backup and recovery procedures',
      'Operational change controls',
    ],
    colorRgb: '161,161,170',
  },
  {
    name: 'Governance & Logging',
    icon: BookOpen,
    description:
      'Immutable audit logs, exportable evidence history, retention controls, and documented incident handling.',
    controls: [
      'Immutable audit trail',
      'Exportable audit history',
      'Configurable retention controls',
      'Documented incident handling',
    ],
    colorRgb: '203,213,225',
  },
];

/* ─── Enterprise Features ─────────────────────────────────── */

interface EnterpriseFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  longDescription: string;
  highlights: string[];
  colorRgb: string;
}

/* The readiness engine scores against the SOC 2 Trust Services Criteria pack.
   Missing pack drops the number rather than printing a stale one. */
const soc2Tsc = getPackClaim('soc2-tsc');

const enterpriseFeatures: EnterpriseFeature[] = [
  {
    icon: Lock,
    title: 'SAML 2.0 SSO & MFA Enforcement',
    description:
      'Metadata-based SAML 2.0 configuration with major identity providers.',
    longDescription:
      'SAML 2.0 integration ships pre-wired with Microsoft Entra ID and Google Workspace; additional standards-compliant IdPs (Okta, OneLogin, etc.) are supported on request and reviewed during procurement. MFA enforcement and session policies can be applied for higher-assurance deployments.',
    highlights: [
      'Entra ID',
      'Google Workspace',
      'SAML 2.0 (other IdPs on request)',
      'MFA',
      'Session policies',
    ],
    colorRgb: '148,163,184',
  },
  {
    icon: Database,
    title: 'Data Residency Controls',
    description:
      'AU-hosted by default with additional residency requirements reviewed during procurement.',
    longDescription:
      'FormaOS is hosted in Australia by default. For teams with additional data residency requirements, current deployment posture, subprocessor details, and any roadmap or contractual options are reviewed explicitly during procurement rather than implied in public copy.',
    highlights: [
      'AU default hosting',
      'Documented subprocessors',
      'DPA review',
      'Procurement review path',
    ],
    colorRgb: '161,161,170',
  },
  {
    icon: UserCheck,
    title: 'Role-Based Access Control',
    description:
      'Granular permissions with role-based access controls and audit logging.',
    longDescription:
      'FormaOS uses role-based access controls with scoped permissions, immutable audit logging for access changes, and session controls for sensitive actions. Enterprise deployments can review role design and governance posture during implementation.',
    highlights: [
      'Owner/Admin/Auditor roles',
      'Scoped permissions',
      'Permission audit trail',
      'Session controls',
    ],
    colorRgb: '161,161,170',
  },
  {
    icon: FileText,
    title: 'Audit-Ready Artifacts',
    description:
      'Export complete evidence packages formatted for SOC 2, ISO 27001, and NDIS audits.',
    longDescription:
      'Generate audit-ready evidence bundles with one click. Packages include control matrices, evidence artifacts with SHA-256 verification hashes, review timelines, and stakeholder sign-offs. Templates aligned to SOC 2 Type II, ISO 27001 Annex A, NDIS Practice Standards, and custom frameworks.',
    highlights: [
      'SOC 2 bundles',
      'ISO 27001 packages',
      'SHA-256 verification',
      'Chain of custody',
    ],
    colorRgb: '203,213,225',
  },
  {
    icon: GitBranch,
    title: 'Evidence Vault & Version Control',
    description:
      'Immutable evidence storage with versioning, SHA-256 integrity verification, and retention policies.',
    longDescription:
      'Every evidence artifact is versioned with full revision history. SHA-256 integrity hashes computed at upload and verified on access. Configurable retention policies per framework with automated archival. Evidence vault supports bulk export for offline storage and disaster recovery scenarios.',
    highlights: [
      'Immutable versioning',
      'SHA-256 integrity',
      'Configurable retention',
      'Bulk export',
    ],
    colorRgb: '203,213,225',
  },
  {
    icon: ShieldCheck,
    title: 'SOC 2 Readiness Engine',
    description:
      'Automated readiness scoring with weighted domain analysis and one-click certification reports.',
    longDescription: `Evaluate SOC 2 readiness across all five Trust Services Criteria domains with weighted scoring. ${
      soc2Tsc
        ? `${soc2Tsc.controlCount} controls are mapped and ${soc2Tsc.automatedEvaluatorCount} of them are checked automatically against your live data.`
        : 'Mapped controls are checked automatically wherever a live data signal exists.'
    } A gap analyser prioritises remediation actions, milestones track progress from enablement to certification, and report generation packages what an auditor asks for.`,
    highlights: [
      'Weighted domain scoring',
      soc2Tsc
        ? `${soc2Tsc.automatedEvaluatorCount} automated checks`
        : 'Automated checks',
      'Gap remediation',
      'Certification reports',
    ],
    colorRgb: '148,163,184',
  },
];

/* ─── Procurement Checklist ───────────────────────────────── */

interface ProcurementItem {
  question: string;
  answer: string;
  icon: LucideIcon;
}

function EnterpriseResourceLinks({
  onClick,
  section,
}: {
  onClick: ReturnType<typeof useMarketingTelemetry>['trackCtaClick'];
  section: 'hero' | 'final_cta';
}) {
  const links = [
    { href: '/trust', label: 'Visit Trust Center', location: 'trust' },
    { href: '/security', label: 'Review Security', location: 'security' },
    { href: '/pricing', label: 'See Pricing', location: 'pricing' },
  ] as const;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() =>
            onClick({
              surface: 'enterprise',
              section,
              location: link.location,
              ctaLabel: link.label,
              ctaHref: link.href,
              variant: 'resource',
            })
          }
          className="font-medium text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-white"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

const procurementItems: ProcurementItem[] = [
  {
    question: 'Is FormaOS SOC 2 certified?',
    answer:
      'If you require a vendor SOC 2 report, confirm that during procurement. FormaOS supports SOC 2-aligned workflows and audit-ready exports, while vendor assurance artifacts are shared conservatively and only when available.',
    icon: ShieldCheck,
  },
  {
    question: 'Where is our data stored?',
    answer:
      'FormaOS is hosted in Australia by default. If your review requires exact hosting, residency, or subprocessor details, we provide the current deployment posture during procurement and keep roadmap items separate from live commitments.',
    icon: Globe,
  },
  {
    question: 'Do you support SAML SSO?',
    answer:
      'Yes. Enterprise deployments can use SAML 2.0 SSO with major identity providers, plus MFA and session-policy controls. If you need additional provisioning or identity-lifecycle requirements, we confirm those during procurement.',
    icon: Lock,
  },
  {
    question: 'What is your SLA?',
    answer:
      'The public status page provides operational visibility, and enterprise agreements can include defined service commitments, maintenance communication, and escalation expectations. We avoid overstating public SLA mechanics outside signed agreements.',
    icon: HeartPulse,
  },
  {
    question: 'How is data encrypted?',
    answer:
      'FormaOS uses AES-256 encryption at rest and TLS 1.3 in transit. Additional key-management or encryption requirements should be confirmed during procurement so public materials stay aligned with implemented controls.',
    icon: Key,
  },
  {
    question: 'Do you have a Data Processing Agreement?',
    answer:
      'Yes. GDPR-compliant DPA provided with every Enterprise contract. Covers data processing purposes, sub-processors, data subject rights, cross-border transfer mechanisms (SCCs), and breach notification obligations.',
    icon: FileText,
  },
  {
    question: 'What about penetration testing?',
    answer:
      'Vendor assurance and independent assessment artifacts can be shared during buyer review when available and appropriate. We keep public language conservative rather than implying a specific assessor, cadence, or remediation SLA without matching evidence.',
    icon: AlertTriangle,
  },
];

/* ─── SLA Commitments ─────────────────────────────────────── */

/* Only commitments with a real number get the numeral treatment. The rest are
   assurances, and forcing them into a stat tile made them harder to read. */
interface SLAItem {
  metric: string;
  value: string;
  unit: string;
  detail: string;
}

const slaItems: SLAItem[] = [
  {
    metric: 'Status visibility',
    value: '24/7',
    unit: '',
    detail: 'Public uptime checks and operational updates',
  },
  {
    metric: 'Maintenance notice',
    value: '72',
    unit: 'h',
    detail: 'Advance notice target for planned maintenance',
  },
];

const slaAssurances: Array<{ metric: string; detail: string }> = [
  {
    metric: 'Procurement artifacts',
    detail:
      'Data processing agreement, trust packet, subprocessor list, and security review materials',
  },
  {
    metric: 'Priority support',
    detail:
      'A named escalation path for the duration of an active enterprise review',
  },
  {
    metric: 'Data export',
    detail: 'Self-serve audit-ready exports and portability workflows',
  },
  {
    metric: 'Identity controls',
    detail: 'SAML 2.0 single sign-on, MFA enforcement, and session policies',
  },
];

/* ─── Deployment Options ──────────────────────────────────── */

interface DeploymentOption {
  name: string;
  description: string;
  features: string[];
  icon: LucideIcon;
  recommended?: boolean;
  colorRgb: string;
}

/* Only the multi-tenant cloud ships today. Anything beyond it is described as
   a procurement conversation, matching the hedged voice of the FAQ above. */
const deploymentOptions: DeploymentOption[] = [
  {
    name: 'Multi-tenant AU cloud',
    description:
      'How every organisation runs FormaOS today. Shared infrastructure hosted in Australia, with tenant isolation enforced in the database rather than in application code.',
    features: [
      'Row-level tenant isolation enforced in Postgres',
      'Australian hosting by default',
      'Automatic platform updates',
      'Provisioning in minutes',
      'Documented subprocessor list',
    ],
    icon: Globe,
    recommended: true,
    colorRgb: '203,213,225',
  },
  {
    name: 'Dedicated arrangements',
    description:
      'If your review requires stronger separation than the shared platform provides, we scope what is feasible during procurement rather than listing it as shipping.',
    features: [
      'Isolation requirements assessed against current architecture',
      'Residency and retention terms set in the agreement',
      'Update and maintenance windows agreed in writing',
      'Feasibility and timing confirmed before contract',
    ],
    icon: CloudCog,
    colorRgb: '161,161,170',
  },
];

/* ─── Animated Stat ───────────────────────────────────────── */

function AnimatedStat({
  value,
  label,
  unit,
  delay,
}: {
  value: string;
  label: string;
  unit: string;
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
        <span className="text-slate-400 text-xl sm:text-2xl">{unit}</span>
      </div>
      <div className="text-xs sm:text-sm text-slate-400 font-medium">
        {label}
      </div>
    </motion.div>
  );
}

/* ─── Feature Card ────────────────────────────────────────── */

function FeatureCard({
  feature,
  index,
}: {
  feature: EnterpriseFeature;
  index: number;
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
        delay: index * 0.05,
        ease: EASE_OUT_EXPO,
      }}
      className="group relative"
    >
      <div
        className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6
          transition-all duration-300 cursor-pointer
          hover:bg-white/[0.04] hover:border-white/[0.12]
          hover:shadow-[0_0_40px_rgba(0,0,0,0.15)]"
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
            background: `radial-gradient(ellipse at 50% 0%, rgba(${feature.colorRgb}, 0.06), transparent 70%)`,
          }}
        />

        <div className="relative flex items-start gap-4 mb-3">
          <div
            className="shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center"
            style={{
              borderColor: `rgba(${feature.colorRgb}, 0.2)`,
              backgroundColor: `rgba(${feature.colorRgb}, 0.08)`,
            }}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: `rgba(${feature.colorRgb}, 0.85)` }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white leading-snug mb-1">
              {feature.title}
            </h3>
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

        {/* Tags row */}
        <div className="relative flex flex-wrap gap-1.5 mt-3">
          {feature.highlights.slice(0, 3).map((h) => (
            <span
              key={h}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium border"
              style={{
                color: `rgba(${feature.colorRgb}, 0.8)`,
                borderColor: `rgba(${feature.colorRgb}, 0.15)`,
                backgroundColor: `rgba(${feature.colorRgb}, 0.06)`,
              }}
            >
              {h}
            </span>
          ))}
          {feature.highlights.length > 3 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium border border-white/[0.06] bg-white/[0.02] text-slate-500">
              +{feature.highlights.length - 3} more
            </span>
          )}
        </div>

        {/* Expanded */}
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
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {feature.longDescription}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {feature.highlights.map((h, hi) => (
                    <motion.div
                      key={h}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: hi * 0.05, duration: 0.3 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2
                        className="w-3.5 h-3.5 shrink-0"
                        style={{
                          color: `rgba(${feature.colorRgb}, 0.7)`,
                        }}
                      />
                      <span className="text-xs text-slate-300">{h}</span>
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

/* ─── Security Architecture ───────────────────────────────── */

function SecurityArchitecture() {
  return (
    <DeferredSection minHeight={500}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <CenteredHeader
            label="Defense in Depth"
            title="Five-layer"
            emphasis="security architecture"
            description="Every layer independently secured, monitored, and audited, because enterprise compliance demands defense in depth."
          />

          <DefenseFlow />
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Interactive defense-in-depth flow ───────────────────────
   Trace a request through all five gates, or attempt a bypass and watch
   it get stopped at the first one, "no bypass path" demonstrated, not
   asserted. Reuses the securityLayers data. */

type FlowMode = 'idle' | 'trace' | 'bypass';

function DefenseFlow() {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<FlowMode>('idle');
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (mode !== 'trace' || reduce) {
      if (mode === 'trace' && reduce) setStep(securityLayers.length);
      return;
    }
    if (step >= securityLayers.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 620);
    return () => clearTimeout(t);
  }, [mode, step, reduce]);

  const done = mode === 'trace' && step >= securityLayers.length;
  const trace = () => {
    setStep(0);
    setMode('trace');
  };
  const bypass = () => {
    setStep(0);
    setMode('bypass');
  };
  const reset = () => {
    setStep(0);
    setMode('idle');
  };

  const gateState = (i: number): 'passed' | 'active' | 'blocked' | 'skipped' | 'pending' => {
    if (mode === 'bypass') return i === 0 ? 'blocked' : 'skipped';
    if (mode === 'trace') {
      if (i < step) return 'passed';
      if (i === step && !done) return 'active';
      if (done) return 'passed';
      return 'pending';
    }
    return 'pending';
  };

  const status =
    mode === 'idle'
      ? 'Every request must clear all five layers in order. Trace one, or try to skip the gates.'
      : mode === 'bypass'
        ? 'Blocked at Application Security. There is no path around the gates, so the request never reaches your data.'
        : done
          ? 'Request served and sealed to the immutable audit log. Every gate left a record.'
          : `Checking layer ${step + 1} of ${securityLayers.length}: ${securityLayers[Math.min(step, securityLayers.length - 1)].name}…`;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.02]">
      {/* Controls + status */}
      <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={`text-sm leading-relaxed ${
            mode === 'bypass' ? 'text-rose-300' : done ? 'text-emerald-300/90' : 'text-slate-300'
          }`}
        >
          {status}
        </p>
        <div className="flex shrink-0 items-center gap-2 max-sm:w-full">
          <button
            type="button"
            onClick={trace}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.08] max-sm:min-h-[44px] max-sm:flex-1"
          >
            Trace a request
          </button>
          <button
            type="button"
            onClick={bypass}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-rose-400/30 hover:text-rose-300 max-sm:min-h-[44px] max-sm:flex-1"
          >
            Attempt bypass
          </button>
          {mode !== 'idle' ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:text-white max-sm:min-h-[44px] max-sm:flex-1"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {/* Gates */}
      <ol className="relative">
        {/* connecting rail */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-8 left-[2.35rem] top-8 w-px bg-white/[0.08]"
        />
        {securityLayers.map((layer, i) => {
          const Icon = layer.icon;
          const state = gateState(i);
          const tone =
            state === 'passed'
              ? 'border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-400'
              : state === 'active'
                ? 'border-white/40 bg-white/[0.1] text-white'
                : state === 'blocked'
                  ? 'border-rose-400/40 bg-rose-400/[0.08] text-rose-300'
                  : 'border-white/[0.1] bg-white/[0.03] text-slate-400';
          return (
            <li
              key={layer.name}
              className={`relative flex gap-4 px-5 py-4 transition-colors ${
                i > 0 ? 'border-t border-white/[0.05]' : ''
              } ${state === 'skipped' ? 'opacity-40' : ''} ${
                state === 'blocked' ? 'bg-rose-500/[0.04]' : ''
              }`}
            >
              {/* gate node */}
              <div className="relative z-10">
                <motion.span
                  animate={
                    state === 'active' && !reduce
                      ? { scale: [1, 1.12, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.7, repeat: state === 'active' ? Infinity : 0 }}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border ${tone}`}
                >
                  {state === 'passed' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : state === 'blocked' ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </motion.span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-600">
                    L{i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{layer.name}</h3>
                  {state === 'blocked' ? (
                    <span className="rounded bg-rose-400/10 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-300">
                      Blocked
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[13px] leading-relaxed text-slate-400">
                  {layer.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {layer.controls.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"
                    >
                      <span className="h-1 w-1 rounded-full bg-slate-600" />
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Outcome footer */}
      <div className="border-t border-white/[0.08] bg-white/[0.015] px-5 py-3 text-[11px] text-slate-500">
        Five independent layers · no single point of failure · no bypass path.
      </div>
    </div>
  );
}

/* ─── Trust Badges Section ────────────────────────────────── */

function TrustBadgesSection() {
  return (
    <DeferredSection minHeight={250}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <CenteredHeader
            label="Trust & Compliance"
            title="Built for"
            emphasis="enterprise review"
            description="Trust signals that procurement, legal, and security teams expect to verify before signing."
            className="mb-10"
          />

          <SectionChoreography
            pattern="stagger-wave"
            stagger={0.06}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.label}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5
                    hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-9 h-9 rounded-xl border flex items-center justify-center"
                      style={{
                        borderColor: `rgba(${badge.colorRgb}, 0.2)`,
                        backgroundColor: `rgba(${badge.colorRgb}, 0.08)`,
                      }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{
                          color: `rgba(${badge.colorRgb}, 0.85)`,
                        }}
                      />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      {badge.label}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {badge.detail}
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

/* ─── SLA Commitments Section ─────────────────────────────── */

function SLASection() {
  return (
    <DeferredSection minHeight={300}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <EditorialHeader
            label="Service Commitments"
            title="Enterprise"
            emphasis="service commitments"
            description="Operational visibility, structured support paths, and enterprise controls, with specific terms defined during procurement."
            className="mb-12"
          />

          <SectionChoreography
            pattern="stagger-wave"
            stagger={0.06}
            className="grid gap-4 sm:grid-cols-2"
          >
            {slaItems.map((item) => (
              <div
                key={item.metric}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5
                  hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  {item.value}
                  <span className="text-slate-400 text-lg">{item.unit}</span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {item.metric}
                </h3>
                <p className="text-xs text-slate-400">{item.detail}</p>
              </div>
            ))}
          </SectionChoreography>

          <ul className="mt-4 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            {slaAssurances.map((item) => (
              <li
                key={item.metric}
                className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <span className="text-sm font-semibold text-white sm:w-52 sm:shrink-0">
                  {item.metric}
                </span>
                <span className="text-sm leading-relaxed text-slate-400">
                  {item.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Deployment Options Section ──────────────────────────── */

function DeploymentSection() {
  return (
    <DeferredSection minHeight={400}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <CenteredHeader
            label="Deployment Models"
            title="How FormaOS"
            emphasis="is deployed"
            description="One deployment model is live today. Anything beyond it is scoped during procurement, so nothing here commits us to infrastructure we do not run."
          />

          <SectionChoreography
            pattern="cascade"
            stagger={0.08}
            className="grid gap-6 lg:grid-cols-2"
          >
            {deploymentOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.name}
                  className={`group relative rounded-2xl border p-6 sm:p-7
                    transition-all duration-300
                    ${
                      option.recommended
                        ? 'border-white/20 bg-white/[0.04] hover:bg-white/[0.06] hover:border-white/30'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                    }`}
                >
                  {option.recommended && (
                    <div className="absolute -top-3 left-6">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-200 border border-white/20 bg-white/[0.06]">
                        Live today
                      </span>
                    </div>
                  )}

                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 50% 0%, rgba(${option.colorRgb}, 0.05), transparent 70%)`,
                    }}
                  />

                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-xl border flex items-center justify-center mb-5"
                      style={{
                        borderColor: `rgba(${option.colorRgb}, 0.2)`,
                        backgroundColor: `rgba(${option.colorRgb}, 0.08)`,
                      }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{
                          color: `rgba(${option.colorRgb}, 0.85)`,
                        }}
                      />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {option.name}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-5">
                      {option.description}
                    </p>
                    <div className="space-y-2.5">
                      {option.features.map((f) => (
                        <div key={f} className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-3.5 h-3.5 mt-0.5 shrink-0"
                            style={{
                              color: `rgba(${option.colorRgb}, 0.6)`,
                            }}
                          />
                          <span className="text-xs text-slate-300">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </SectionChoreography>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Procurement FAQ ─────────────────────────────────────── */

function ProcurementFAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <DeferredSection minHeight={500}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <EditorialHeader
            label="Procurement Ready"
            title="Security"
            emphasis="questionnaire"
            description="Answers to the questions your procurement, legal, and information security teams need answered before signing."
            className="mb-12"
          />

          <div className="space-y-2.5">
            {procurementItems.map((item, i) => {
              const Icon = item.icon;
              const isExpanded = expandedIndex === i;

              return (
                <ScrollReveal
                  key={item.question}
                  variant="fadeUp"
                  range={[0, 0.3]}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: i * 0.04,
                      duration: 0.4,
                      ease: EASE_OUT_EXPO,
                    }}
                    className="group rounded-xl border border-white/[0.06] bg-white/[0.02]
                      hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                  >
                    <button
                      className="w-full flex items-center gap-3 p-4 text-left"
                      onClick={() => setExpandedIndex(isExpanded ? null : i)}
                    >
                      <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-300" />
                      </div>
                      <span className="flex-1 text-sm font-medium text-white">
                        {item.question}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.3,
                            ease: EASE_OUT_EXPO,
                          }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 ml-11">
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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

/* ─── Enterprise CTA ──────────────────────────────────────── */

function EnterpriseCTA() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <DeferredSection minHeight={350}>
      <section className="mk-section relative isolate overflow-hidden">
        <SectionMedia
          src="/marketing-media/enterprise-proof.jpg"
          objectPosition="50% 40%"
          opacity={0.6}
          scrim="center"
        />
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="relative rounded-3xl border border-white/[0.06] bg-slate-950/60 overflow-hidden">
            <div className="relative p-8 sm:p-12 lg:p-16 text-center">
              <ScrollReveal variant="depthScale" range={[0, 0.3]}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Enterprise Ready
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                  Start your{' '}
                  <span className="text-slate-400">
                    enterprise evaluation
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10">
                  Request the security review packet, run a proof-of-concept, or
                  bring your procurement team into a structured review. We
                  support the process your organization already follows.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={salesHref('enterprise_final')}
                    onClick={() =>
                      trackCtaClick({
                        surface: 'enterprise',
                        section: 'final_cta',
                        location: 'final_primary',
                        ctaLabel: 'Contact Enterprise Sales',
                        ctaHref: salesHref('enterprise_final'),
                        variant: 'primary',
                      })
                    }
                    className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      bg-white text-slate-950 font-semibold text-sm
                      shadow-lg shadow-black/20
                      hover:bg-slate-100 hover:shadow-xl
                      transition-all duration-300"
                  >
                    Contact Enterprise Sales
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href={demoHref('enterprise_final')}
                    onClick={() =>
                      trackCtaClick({
                        surface: 'enterprise',
                        section: 'final_cta',
                        location: 'final_secondary',
                        ctaLabel: PUBLIC_CTA_LABELS.bookDemo,
                        ctaHref: demoHref('enterprise_final'),
                        variant: 'secondary',
                      })
                    }
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

                <EnterpriseResourceLinks
                  onClick={trackCtaClick}
                  section="final_cta"
                />

                <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-slate-500">
                  {[
                    'Audit-ready exports',
                    'AU-hosted by default',
                    'SAML SSO + MFA',
                    'Trust packet available',
                    'Custom enterprise terms',
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

/* ─── Hero ────────────────────────────────────────────────── */

function EnterpriseHero() {
  const { trackCtaClick } = useMarketingTelemetry();
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
        src="/marketing-media/enterprise.jpg"
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
        className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8 py-20 sm:py-40 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="mb-8 flex items-center justify-center gap-4"
        >
          <span className="hidden h-px w-10 bg-white/20 sm:block" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:text-xs">
            Enterprise
          </span>
          <span className="hidden h-px w-10 bg-white/20 sm:block" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6"
        >
          One Evaluation Path from
          <br />
          <span className="text-slate-400">
            Security Review to Rollout
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          SAML SSO, audit-ready evidence exports, and structured procurement
          materials for organizations where compliance is an operational
          requirement, not a checkbox exercise.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href={salesHref('enterprise_hero')}
            onClick={() =>
              trackCtaClick({
                surface: 'enterprise',
                section: 'hero',
                location: 'hero_primary',
                ctaLabel: 'Talk to Enterprise Sales',
                ctaHref: salesHref('enterprise_hero'),
                variant: 'primary',
              })
            }
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
              bg-white text-slate-950 font-semibold text-sm
              shadow-lg shadow-black/20
              hover:bg-slate-100 hover:shadow-xl
              transition-all duration-300"
          >
            {PUBLIC_CTA_LABELS.talkToSales}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={demoHref('enterprise_hero')}
            onClick={() =>
              trackCtaClick({
                surface: 'enterprise',
                section: 'hero',
                location: 'hero_secondary',
                ctaLabel: PUBLIC_CTA_LABELS.bookDemo,
                ctaHref: demoHref('enterprise_hero'),
                variant: 'secondary',
              })
            }
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.36, ease: EASE_OUT_EXPO }}
        >
          <EnterpriseResourceLinks onClick={trackCtaClick} section="hero" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE_OUT_EXPO }}
          className="flex flex-wrap justify-center gap-4 mt-10"
        >
          {trustBadges.slice(0, 4).map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs"
              >
                <Icon
                  className="w-3.5 h-3.5"
                  style={{ color: `rgba(${badge.colorRgb}, 0.7)` }}
                />
                <span className="text-slate-300">{badge.label}</span>
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

export default function EnterprisePageContent() {
  return (
    <MarketingPageShell>
      <EnterpriseHero />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Trust Badges */}
      <TrustBadgesSection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Enterprise Features */}
      <DeferredSection minHeight={560}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <EditorialHeader
              label="Enterprise Capabilities"
              title="Built for"
              emphasis="security teams"
              description="Every feature designed around enterprise security requirements, compliance obligations, and operational excellence."
              className="mb-12"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {enterpriseFeatures.map((feature, i) => (
                <FeatureCard key={feature.title} feature={feature} index={i} />
              ))}
            </div>
          </div>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Security Architecture */}
      <SecurityArchitecture />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* SLA */}
      <SLASection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Deployment Options */}
      <DeploymentSection />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Procurement FAQ */}
      <ProcurementFAQ />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* CTA */}
      <EnterpriseCTA />

      <MobileStickyCta />
    </MarketingPageShell>
  );
}

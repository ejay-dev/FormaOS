'use client';

import { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useInView,
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
  Server,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Shield,
  Database,
  Key,
  HeartPulse,
  Scale,
  Fingerprint,
  Monitor,
  CloudCog,
  BookOpen,
  UserCheck,
  Activity,
  AlertTriangle,
  GitBranch,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { VisualDivider } from '@/components/motion';
import { ShieldRings, HexGrid } from '@/components/marketing/SectionBackgrounds';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { brand } from '@/config/brand';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

/* ─── Easing ──────────────────────────────────────────────── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
    colorRgb: '52,211,153',
  },
  {
    icon: Scale,
    label: 'Audit-ready exports',
    detail: 'Evidence and control context preserved',
    colorRgb: '59,130,246',
  },
  {
    icon: Globe,
    label: 'AU-hosted by default',
    detail: 'Additional residency needs reviewed during procurement',
    colorRgb: '139,92,246',
  },
  {
    icon: HeartPulse,
    label: 'Public status visibility',
    detail: 'Operational updates and uptime checks published',
    colorRgb: '251,113,133',
  },
  {
    icon: Building2,
    label: 'SAML + MFA',
    detail: 'Enterprise identity controls supported',
    colorRgb: '34,211,238',
  },
  {
    icon: Lock,
    label: 'DPA and subprocessor docs',
    detail: 'Available for enterprise review',
    colorRgb: '245,158,11',
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
    colorRgb: '52,211,153',
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
    colorRgb: '139,92,246',
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
    colorRgb: '59,130,246',
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
    colorRgb: '34,211,238',
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
    colorRgb: '245,158,11',
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

const enterpriseFeatures: EnterpriseFeature[] = [
  {
    icon: Lock,
    title: 'SAML 2.0 SSO & MFA Enforcement',
    description:
      'Metadata-based SAML 2.0 configuration with major identity providers.',
    longDescription:
      'SAML 2.0 integration supports major identity providers including Okta, Microsoft Entra ID, and Google Workspace. MFA enforcement and session policies can be applied for higher-assurance deployments, with identity-lifecycle requirements reviewed during procurement.',
    highlights: ['Okta', 'Entra ID', 'Google Workspace', 'MFA', 'Session policies'],
    colorRgb: '139,92,246',
  },
  {
    icon: Database,
    title: 'Data Residency Controls',
    description:
      'AU-hosted by default with additional residency requirements reviewed during procurement.',
    longDescription:
      'FormaOS is hosted in Australia by default. For teams with additional data residency requirements, current deployment posture, subprocessor details, and any roadmap or contractual options are reviewed explicitly during procurement rather than implied in public copy.',
    highlights: ['AU default hosting', 'Documented subprocessors', 'DPA review', 'Procurement review path'],
    colorRgb: '34,211,238',
  },
  {
    icon: UserCheck,
    title: 'Role-Based Access Control',
    description:
      'Granular permissions with role-based access controls and audit logging.',
    longDescription:
      'FormaOS uses role-based access controls with scoped permissions, immutable audit logging for access changes, and session controls for sensitive actions. Enterprise deployments can review role design and governance posture during implementation.',
    highlights: ['Owner/Admin/Auditor roles', 'Scoped permissions', 'Permission audit trail', 'Session controls'],
    colorRgb: '59,130,246',
  },
  {
    icon: FileText,
    title: 'Audit-Ready Artifacts',
    description:
      'Export complete evidence packages formatted for SOC 2, ISO 27001, and NDIS audits.',
    longDescription:
      'Generate audit-ready evidence bundles with one click. Packages include control matrices, evidence artifacts with SHA-256 verification hashes, review timelines, and stakeholder sign-offs. Templates aligned to SOC 2 Type II, ISO 27001 Annex A, NDIS Practice Standards, and custom frameworks.',
    highlights: ['SOC 2 bundles', 'ISO 27001 packages', 'SHA-256 verification', 'Chain of custody'],
    colorRgb: '245,158,11',
  },
  {
    icon: GitBranch,
    title: 'Evidence Vault & Version Control',
    description:
      'Immutable evidence storage with versioning, SHA-256 integrity verification, and retention policies.',
    longDescription:
      'Every evidence artifact is versioned with full revision history. SHA-256 integrity hashes computed at upload and verified on access. Configurable retention policies per framework with automated archival. Evidence vault supports bulk export for offline storage and disaster recovery scenarios.',
    highlights: ['Immutable versioning', 'SHA-256 integrity', 'Configurable retention', 'Bulk export'],
    colorRgb: '52,211,153',
  },
  {
    icon: ShieldCheck,
    title: 'SOC 2 Readiness Engine',
    description:
      'Automated readiness scoring with weighted domain analysis and one-click certification reports.',
    longDescription:
      'Evaluate SOC 2 readiness across all five Trust Service Criteria domains with weighted scoring. Automated evidence checks across 11 controls, a gap analyzer with prioritized remediation actions, milestone tracking from enablement to certification, and one-click report generation that packages everything auditors need.',
    highlights: ['Weighted domain scoring', '11 automated checks', 'Gap remediation', 'Certification reports'],
    colorRgb: '52,211,153',
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

interface SLAItem {
  metric: string;
  value: string;
  unit: string;
  detail: string;
}

const slaItems: SLAItem[] = [
  {
    metric: 'Status Visibility',
    value: '24/7',
    unit: '',
    detail: 'Public uptime checks and operational updates',
  },
  {
    metric: 'Maintenance Notice',
    value: '72',
    unit: 'h',
    detail: 'Advance notice target for planned maintenance',
  },
  {
    metric: 'Procurement Artifacts',
    value: 'DPA',
    unit: '+',
    detail: 'Trust packet, subprocessor, and review materials',
  },
  {
    metric: 'Priority Support',
    value: '1',
    unit: 'path',
    detail: 'Named enterprise escalation path for active reviews',
  },
  {
    metric: 'Data Export',
    value: 'Self',
    unit: '-serve',
    detail: 'Audit-ready exports and portability workflows',
  },
  {
    metric: 'Identity Controls',
    value: 'SAML',
    unit: '+',
    detail: 'Enterprise SSO, MFA, and session controls',
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

const deploymentOptions: DeploymentOption[] = [
  {
    name: 'Multi-Tenant Cloud',
    description:
      'Shared infrastructure with logical tenant isolation. Fastest deployment with automatic updates and zero maintenance overhead.',
    features: [
      'Logical tenant isolation',
      'Automatic platform updates',
      'Shared infrastructure cost efficiency',
      'Instant provisioning',
      'Standard data residency options',
    ],
    icon: Globe,
    colorRgb: '52,211,153',
  },
  {
    name: 'Dedicated Cloud',
    description:
      'Isolated cloud infrastructure with dedicated compute, storage, and network resources for your organization.',
    features: [
      'Dedicated compute & storage',
      'Network-level isolation (VPC)',
      'Custom update schedule',
      'Enhanced performance SLAs',
      'Extended data residency options',
    ],
    icon: CloudCog,
    recommended: true,
    colorRgb: '34,211,238',
  },
  {
    name: 'On-Premise / Private Cloud',
    description:
      'Deploy FormaOS within your own infrastructure. Full control over data, networking, and compliance boundary.',
    features: [
      'Your infrastructure, your rules',
      'Air-gapped deployment support',
      'Custom integration endpoints',
      'Internal PKI certificate support',
      'Full compliance boundary control',
    ],
    icon: Server,
    colorRgb: '139,92,246',
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
        <span className="text-emerald-400 text-xl sm:text-2xl">{unit}</span>
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
        <ShieldRings />
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 mb-6">
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                Defense in Depth
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Five-layer{' '}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                security architecture
              </span>
            </h2>
            <p className="text-base text-slate-400 max-w-xl mx-auto">
              Every layer independently secured, monitored, and audited  - 
              because enterprise compliance demands defense in depth.
            </p>
          </ScrollReveal>

          <div className="relative space-y-3">
            {/* Vertical line */}
            <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-emerald-400/30 via-violet-400/30 to-amber-400/30 hidden sm:block" />

            {securityLayers.map((layer, i) => {
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
                        {layer.controls.map((control, ci) => (
                          <div
                            key={control}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle2
                              className="w-3 h-3 shrink-0"
                              style={{
                                color: `rgba(${layer.colorRgb}, 0.6)`,
                              }}
                            />
                            <span className="text-xs text-slate-300">
                              {control}
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

/* ─── Trust Badges Section ────────────────────────────────── */

function TrustBadgesSection() {
  return (
    <DeferredSection minHeight={250}>
      <section className="mk-section relative">
        <HexGrid />
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 mb-6">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Trust & Compliance
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                enterprise review
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Trust signals that procurement, legal, and security teams
              expect to verify before signing.
            </p>
          </ScrollReveal>

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
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 mb-6">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Service Commitments
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Enterprise{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                service commitments
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Operational visibility, structured support paths, and enterprise
              controls - with specific terms defined during procurement.
            </p>
          </ScrollReveal>

          <SectionChoreography
            pattern="stagger-wave"
            stagger={0.06}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {slaItems.map((item, i) => (
              <div
                key={item.metric}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5
                  hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  {item.value}
                  <span className="text-cyan-400 text-lg">{item.unit}</span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {item.metric}
                </h3>
                <p className="text-xs text-slate-400">{item.detail}</p>
              </div>
            ))}
          </SectionChoreography>
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
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-400/20 bg-blue-500/10 mb-6">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Deployment Models
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Deploy{' '}
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                your way
              </span>
            </h2>
            <p className="text-base text-slate-400 max-w-xl mx-auto">
              Choose the deployment model that matches your security
              requirements, regulatory constraints, and operational preferences.
            </p>
          </ScrollReveal>

          <SectionChoreography
            pattern="cascade"
            stagger={0.08}
            className="grid gap-6 lg:grid-cols-3"
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
                        ? 'border-cyan-400/20 bg-cyan-500/[0.03] hover:bg-cyan-500/[0.06] hover:border-cyan-400/30'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                    }`}
                >
                  {option.recommended && (
                    <div className="absolute -top-3 left-6">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-cyan-400 border border-cyan-400/20 bg-cyan-500/10">
                        Recommended
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
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 mb-6">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Procurement Ready
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Security{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
                questionnaire
              </span>
            </h2>
            <p className="text-base text-slate-400 max-w-xl mx-auto">
              Answers to the questions your procurement, legal, and
              information security teams need answered before signing.
            </p>
          </ScrollReveal>

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
                      onClick={() =>
                        setExpandedIndex(isExpanded ? null : i)
                      }
                    >
                      <div className="w-8 h-8 rounded-lg border border-amber-400/15 bg-amber-500/8 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-amber-400/80" />
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
      <section className="mk-section relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.08), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(52,211,153,0.06), transparent 50%)',
              }}
            />

            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-violet-400/30"
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
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 mb-6">
                  <Building2 className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                    Enterprise Ready
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Start your{' '}
                  <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    enterprise evaluation
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10">
                  Request the security review packet, run a proof-of-concept,
                  or bring your procurement team into a structured review.
                  We support the process your organization already follows.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={`${appBase}/contact?type=enterprise`}
                    onClick={() =>
                      trackCtaClick({
                        surface: 'enterprise',
                        section: 'final_cta',
                        location: 'final_primary',
                        ctaLabel: 'Contact Enterprise Sales',
                        ctaHref: `${appBase}/contact?type=enterprise`,
                        variant: 'primary',
                      })
                    }
                    className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      bg-gradient-to-r from-violet-500 to-blue-500
                      text-white font-semibold text-sm
                      shadow-lg shadow-violet-500/20
                      hover:shadow-xl hover:shadow-violet-500/30
                      transition-all duration-300"
                  >
                    Contact Enterprise Sales
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href={appBase}
                    onClick={() =>
                      trackCtaClick({
                        surface: 'enterprise',
                        section: 'final_cta',
                        location: 'final_secondary',
                        ctaLabel: 'Start Free Trial',
                        ctaHref: appBase,
                        variant: 'secondary',
                      })
                    }
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      border border-white/[0.12] bg-white/[0.04]
                      text-white font-semibold text-sm
                      hover:bg-white/[0.08] hover:border-white/[0.2]
                      transition-all duration-300"
                  >
                    Start Free Trial
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
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{ background: 'rgba(139,92,246,0.12)' }}
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
          style={{ background: 'rgba(52,211,153,0.10)' }}
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
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 mb-8"
        >
          <Building2 className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
            Enterprise
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6"
        >
          One Evaluation Path from
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
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
          requirement - not a checkbox exercise.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href={`${appBase}/contact?type=enterprise`}
            onClick={() =>
              trackCtaClick({
                surface: 'enterprise',
                section: 'hero',
                location: 'hero_primary',
                ctaLabel: 'Talk to Enterprise Sales',
                ctaHref: `${appBase}/contact?type=enterprise`,
                variant: 'primary',
              })
            }
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
              bg-gradient-to-r from-violet-500 to-blue-500
              text-white font-semibold text-sm
              shadow-lg shadow-violet-500/20
              hover:shadow-xl hover:shadow-violet-500/30
              transition-all duration-300"
          >
            Talk to Enterprise Sales
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={appBase}
            onClick={() =>
              trackCtaClick({
                surface: 'enterprise',
                section: 'hero',
                location: 'hero_secondary',
                ctaLabel: 'Start Free Trial',
                ctaHref: appBase,
                variant: 'secondary',
              })
            }
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
              border border-white/[0.12] bg-white/[0.04]
              text-white font-semibold text-sm
              hover:bg-white/[0.08] hover:border-white/[0.2]
              transition-all duration-300"
          >
            Start Free Trial
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

      <VisualDivider gradient />

      {/* Trust Badges */}
      <TrustBadgesSection />

      <VisualDivider />

      {/* Enterprise Features */}
      <DeferredSection minHeight={800}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-14"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 mb-6">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Enterprise Capabilities
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Built for{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  security teams
                </span>
              </h2>
              <p className="text-base text-slate-400 max-w-xl mx-auto">
                Every feature designed around enterprise security requirements,
                compliance obligations, and operational excellence.
              </p>
            </ScrollReveal>

            <div className="grid gap-4 sm:grid-cols-2">
              {enterpriseFeatures.map((feature, i) => (
                <FeatureCard
                  key={feature.title}
                  feature={feature}
                  index={i}
                />
              ))}
            </div>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Security Architecture */}
      <SecurityArchitecture />

      <VisualDivider />

      {/* SLA */}
      <SLASection />

      <VisualDivider />

      {/* Deployment Options */}
      <DeploymentSection />

      <VisualDivider />

      {/* Procurement FAQ */}
      <ProcurementFAQ />

      <VisualDivider />

      {/* CTA */}
      <EnterpriseCTA />
    </MarketingPageShell>
  );
}

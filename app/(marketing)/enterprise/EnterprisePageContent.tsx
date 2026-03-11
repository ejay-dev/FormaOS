'use client';

import { useRef, useState, useMemo } from 'react';
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
  Users,
  FileText,
  CheckCircle2,
  ArrowRight,
  Building2,
  Clock,
  Server,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Shield,
  Zap,
  Eye,
  Database,
  Key,
  Network,
  Settings,
  HeartPulse,
  Scale,
  Fingerprint,
  Monitor,
  CloudCog,
  BookOpen,
  UserCheck,
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  GitBranch,
  Layers,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { brand } from '@/config/brand';

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
    label: 'SOC 2 Type II',
    detail: 'Audited annually by independent assessors',
    colorRgb: '52,211,153',
  },
  {
    icon: Scale,
    label: 'ISO 27001',
    detail: 'Certified information security management',
    colorRgb: '59,130,246',
  },
  {
    icon: Globe,
    label: 'GDPR Compliant',
    detail: 'EU data protection regulation adherence',
    colorRgb: '139,92,246',
  },
  {
    icon: HeartPulse,
    label: 'HIPAA Ready',
    detail: 'Healthcare data handling compliance',
    colorRgb: '251,113,133',
  },
  {
    icon: Building2,
    label: 'NDIS Practice Standards',
    detail: 'Disability services compliance support',
    colorRgb: '34,211,238',
  },
  {
    icon: Lock,
    label: 'Privacy Act 1988',
    detail: 'Australian privacy principles compliance',
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
      'WAF, CSP headers, input sanitization, and automated SAST/DAST scanning on every deployment.',
    controls: [
      'Web Application Firewall (WAF)',
      'Content Security Policy (CSP)',
      'OWASP Top 10 mitigation',
      'Automated vulnerability scanning',
    ],
    colorRgb: '52,211,153',
  },
  {
    name: 'Authentication & Identity',
    icon: Fingerprint,
    description:
      'SAML 2.0, OIDC, SCIM 2.0, MFA enforcement, and session management with configurable policies.',
    controls: [
      'SAML 2.0 / OIDC SSO',
      'SCIM 2.0 provisioning',
      'Hardware MFA (FIDO2)',
      'Session policy management',
    ],
    colorRgb: '139,92,246',
  },
  {
    name: 'Data Protection',
    icon: Database,
    description:
      'AES-256 encryption at rest, TLS 1.3 in transit, field-level encryption for sensitive data.',
    controls: [
      'AES-256 encryption at rest',
      'TLS 1.3 in transit',
      'Field-level encryption',
      'Key rotation automation',
    ],
    colorRgb: '59,130,246',
  },
  {
    name: 'Infrastructure Security',
    icon: CloudCog,
    description:
      'Multi-region isolation, VPC peering, DDoS protection, and immutable infrastructure deployments.',
    controls: [
      'Multi-region data residency',
      'VPC network isolation',
      'DDoS protection (L3/L4/L7)',
      'Immutable deployments',
    ],
    colorRgb: '34,211,238',
  },
  {
    name: 'Governance & Logging',
    icon: BookOpen,
    description:
      'Immutable audit logs, SIEM integration, retention policies, and real-time security alerting.',
    controls: [
      'Immutable audit trail',
      'SIEM integration (Splunk, Datadog)',
      'Configurable log retention',
      'Real-time security alerts',
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
      'Full SAML 2.0 integration with Okta, Microsoft Entra ID (Azure AD), and Google Workspace. MFA enforcement with hardware token support (FIDO2/WebAuthn). Configurable session policies including idle timeout, maximum session duration, and re-authentication triggers for sensitive operations. SCIM 2.0 provisioning for automated user lifecycle management.',
    highlights: ['Okta', 'Entra ID', 'Google Workspace', 'SCIM 2.0', 'FIDO2/WebAuthn'],
    colorRgb: '139,92,246',
  },
  {
    icon: Database,
    title: 'Data Residency Controls',
    description:
      'Choose where your data lives with per-workspace regional configuration.',
    longDescription:
      'Deploy compliance data to US-East, EU-West, or APAC-Sydney regions with full jurisdictional isolation. Each region operates with independent encryption keys, isolated database clusters, and region-specific backup policies. Per-workspace residency configuration lets multi-national organizations distribute data according to local regulations.',
    highlights: ['US/EU/APAC regions', 'Per-workspace config', 'Independent encryption', 'Regional backups'],
    colorRgb: '34,211,238',
  },
  {
    icon: HeartPulse,
    title: '99.9% Uptime SLA',
    description:
      'Contractual uptime guarantee with financial remediation for SLA breaches.',
    longDescription:
      'Enterprise SLA with 99.9% availability commitment backed by financial credits. Transparent incident communication through a dedicated status page. Planned maintenance windows scheduled with 72-hour advance notice during off-peak hours. Redundant infrastructure across multiple availability zones with automatic failover.',
    highlights: ['99.9% SLA', 'Financial credits', '72h maintenance notice', 'Multi-AZ redundancy'],
    colorRgb: '52,211,153',
  },
  {
    icon: UserCheck,
    title: 'Role-Based Access Control',
    description:
      'Granular permissions with custom roles, attribute-based policies, and audit logging.',
    longDescription:
      'Enterprise-grade RBAC with pre-built roles (Owner, Admin, Auditor, Viewer) and custom role builder. Attribute-based access control (ABAC) policies for complex permission requirements. Every permission change logged in the immutable audit trail. IP allowlist restrictions per role for network-level access control.',
    highlights: ['Custom role builder', 'ABAC policies', 'IP allowlisting', 'Permission audit trail'],
    colorRgb: '59,130,246',
  },
  {
    icon: FileText,
    title: 'Audit-Ready Artifacts',
    description:
      'Export complete evidence packages formatted for SOC 2, ISO 27001, and NDIS audits.',
    longDescription:
      'Generate audit-ready evidence bundles with one click. Packages include control matrices, evidence artifacts with SHA-256 verification hashes, review timelines, and stakeholder sign-offs. Templates aligned to SOC 2 Type II, ISO 27001 Annex A, NDIS Practice Standards, and custom frameworks. Evidence chain-of-custody with tamper-proof audit trail.',
    highlights: ['SOC 2 bundles', 'ISO 27001 packages', 'SHA-256 verification', 'Chain of custody'],
    colorRgb: '245,158,11',
  },
  {
    icon: Bell,
    title: 'Advanced Alerting & Escalation',
    description:
      'Conditional notification routing with escalation chains, digest batching, and quiet hours.',
    longDescription:
      'Configure notification rules with multi-level escalation chains. If an alert is not acknowledged within the configured window, it automatically escalates to the next responsible party. Smart digest batching groups non-critical notifications into configurable summary windows. Quiet hours prevent non-urgent notifications during weekends and off-hours.',
    highlights: ['Escalation chains', 'Smart batching', 'Quiet hours', 'PagerDuty integration'],
    colorRgb: '251,113,133',
  },
  {
    icon: GitBranch,
    title: 'Version Control & Evidence Vault',
    description:
      'Immutable evidence storage with versioning, SHA-256 integrity verification, and retention policies.',
    longDescription:
      'Every evidence artifact is versioned with full revision history. SHA-256 integrity hashes computed at upload and verified on access. Configurable retention policies per framework with automated archival. Evidence vault supports bulk export for offline storage and disaster recovery scenarios.',
    highlights: ['Immutable versioning', 'SHA-256 integrity', 'Configurable retention', 'Bulk export'],
    colorRgb: '52,211,153',
  },
  {
    icon: Activity,
    title: 'Real-Time Compliance Monitoring',
    description:
      'Live compliance posture scoring with drift detection and automated remediation suggestions.',
    longDescription:
      'Continuous monitoring of your compliance posture across all active frameworks. Real-time scoring with configurable thresholds and rollback detection. Automated alerts when evidence expires, controls drift from compliant state, or review deadlines approach. Integration with infrastructure-as-code tools for automated configuration compliance.',
    highlights: ['live scoring', 'Drift detection', 'Expiry alerts', 'IaC integration'],
    colorRgb: '34,211,238',
  },
];

/* ─── Procurement Checklist ───────────────────────────────── */

interface ProcurementItem {
  question: string;
  answer: string;
  icon: LucideIcon;
}

const procurementItems: ProcurementItem[] = [
  {
    question: 'Is FormaOS SOC 2 certified?',
    answer:
      'Yes. FormaOS maintains SOC 2 Type II certification with annual re-assessment. Our latest audit report is available under NDA upon request.',
    icon: ShieldCheck,
  },
  {
    question: 'Where is our data stored?',
    answer:
      'Data is stored in your selected region (US-East, EU-West, or APAC-Sydney) with full jurisdictional isolation. Regional encryption keys, isolated clusters, and region-specific backup policies ensure compliance with local regulations.',
    icon: Globe,
  },
  {
    question: 'Do you support SAML SSO?',
    answer:
      'Yes. SAML 2.0 SSO with Okta, Microsoft Entra ID, Google Workspace, and any SAML 2.0 compliant IdP. SCIM 2.0 provisioning, MFA enforcement (including FIDO2 hardware tokens), and configurable session policies included.',
    icon: Lock,
  },
  {
    question: 'What is your SLA?',
    answer:
      '99.9% availability SLA with financial credit remediation. Transparent incident communication via status page. Planned maintenance with 72-hour advance notice during off-peak windows.',
    icon: HeartPulse,
  },
  {
    question: 'How is data encrypted?',
    answer:
      'AES-256 encryption at rest, TLS 1.3 in transit. Field-level encryption for sensitive data. Automated key rotation with configurable schedules. Customer-managed encryption keys (CMEK) available on Enterprise tier.',
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
      'Annual third-party penetration testing by certified CREST/OSCP assessors. Findings remediated within SLA timelines (Critical: 24h, High: 72h, Medium: 30 days). Executive summary available under NDA.',
    icon: AlertTriangle,
  },
  {
    question: 'Can we audit FormaOS?',
    answer:
      'Yes. Enterprise customers may conduct their own security assessment or request our completed security questionnaires (SIG, CAIQ, VSAQ). We support site visits with reasonable advance scheduling.',
    icon: Eye,
  },
  {
    question: 'What happens to our data if we leave?',
    answer:
      'Full data export in standard formats (JSON, CSV) available at any time. Upon contract termination, data is retained for 30 days then permanently deleted with cryptographic verification of destruction.',
    icon: Database,
  },
  {
    question: 'Do you have a business continuity plan?',
    answer:
      'Yes. Documented BCP/DR plan tested semi-annually. RPO < 1 hour, RTO < 4 hours. Multi-AZ redundancy with automated failover. Geo-redundant backups with 90-day retention.',
    icon: Server,
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
    metric: 'Platform Availability',
    value: '99.9',
    unit: '%',
    detail: 'Monthly uptime with financial credit remediation',
  },
  {
    metric: 'API Response Time',
    value: '<200',
    unit: 'ms',
    detail: 'P95 response time for core API endpoints',
  },
  {
    metric: 'Critical Security Fix',
    value: '<24',
    unit: 'h',
    detail: 'Time to patch for critical severity CVEs',
  },
  {
    metric: 'Support Response',
    value: '<4',
    unit: 'h',
    detail: 'Initial response time for Severity 1 issues',
  },
  {
    metric: 'Data Recovery Point',
    value: '<1',
    unit: 'h',
    detail: 'RPO with continuous database replication',
  },
  {
    metric: 'Recovery Time',
    value: '<4',
    unit: 'h',
    detail: 'RTO with automated failover and DR procedures',
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
              Every layer independently secured, monitored, and audited —
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
              Certified for{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                regulated industries
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Independent certifications and compliance programs that
              procurement, legal, and security teams need to see.
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
              Contractual{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                SLA guarantees
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Every commitment backed by measurable targets, transparent
              reporting, and financial remediation for breaches.
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
                  Ready to{' '}
                  <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    get started?
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10">
                  Schedule a security review, request our SOC 2 report, or
                  start a proof-of-concept. Our enterprise team is ready to
                  support your evaluation process.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={`${appBase}/contact?type=enterprise`}
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

                <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-slate-500">
                  {[
                    'SOC 2 Type II Certified',
                    '99.9% Uptime SLA',
                    'Data Residency Controls',
                    'Dedicated Account Manager',
                    'Custom Terms Available',
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
          Compliance at
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            enterprise scale
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          SAML SSO, data residency controls, 99.9% uptime SLA, and
          audit-ready procurement artifacts. Built for organizations where
          compliance isn&apos;t optional.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href={`${appBase}/contact?type=enterprise`}
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

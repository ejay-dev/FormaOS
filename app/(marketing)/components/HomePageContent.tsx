'use client';

import Link from 'next/link';
import {
  ShieldCheck,
  Sparkles,
  Layers,
  Lock,
  Activity,
  ClipboardCheck,
  Zap,
  Target,
  TrendingUp,
  FileCheck,
  Eye,
  BarChart3,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import {
  SectionHeader,
  FeatureCard,
  MetricCard,
  ArchitectureCard,
  ProcessStep,
  NodeWireShowcase,
  GradientMesh,
  SystemBackground,
  GlassCard,
  SectionGlow,
  Reveal,
  Parallax,
  AmbientOrbs,
  EnhancedGlassCard,
  HoverLift,
  ScrollGradient,
  AnimatedLink,
} from '@/components/motion';
import { motion } from 'framer-motion';
import { spacing, radius, depth } from '@/config/motion';

const lifecycle = [
  {
    icon: Target,
    title: 'Model obligations',
    description:
      'Align frameworks, policies, and controls across every site and team.',
  },
  {
    icon: Zap,
    title: 'Execute tasks',
    description:
      'Assign remediation work with owners, deadlines, and evidence requirements.',
  },
  {
    icon: ShieldCheck,
    title: 'Capture evidence',
    description:
      'Store approvals, artifacts, and audit history in a single chain of custody.',
  },
  {
    icon: TrendingUp,
    title: 'Prove readiness',
    description:
      'Generate audit bundles, reports, and compliance posture in minutes.',
  },
];

const industries = [
  {
    icon: Activity,
    title: 'NDIS & disability services',
    description:
      'Track practice standards, provider obligations, and incident reporting.',
  },
  {
    icon: ShieldCheck,
    title: 'Healthcare providers',
    description:
      'Manage credentials, clinical governance, and audit readiness.',
  },
  {
    icon: Layers,
    title: 'Aged care operators',
    description:
      'Keep evidence and policy reviews current across multiple sites.',
  },
  {
    icon: ClipboardCheck,
    title: 'Community services',
    description:
      'Prove service quality and compliance across programs and teams.',
  },
];

const platformArchitecture = {
  'Compliance Engine': [
    'Framework modeling',
    'Control libraries',
    'Risk assessment',
    'Gap analysis',
  ],
  'Task System': [
    'Automated reminders',
    'Assignment routing',
    'Deadline tracking',
    'Remediation management',
  ],
  'Evidence Vault': [
    'Immutable storage',
    'Approval chains',
    'Artifact versioning',
    'Audit trails',
  ],
  'Reporting Engine': [
    'Executive dashboards',
    'Audit export bundles',
    'Posture scoring',
    'Compliance metrics',
  ],
};

const capabilities = [
  'REST API v1 with rate limiting',
  'Workflow automation engine',
  'Incident reporting & investigation',
  'Asset & risk register management',
  'Certificate expiry tracking',
  'Training records management',
  'Patient/client records (Healthcare)',
  'Evidence version control',
  'Multi-organization support',
  'Role-based access control (RBAC)',
  'Immutable audit logs',
  'Performance monitoring',
];

const metrics = [
  {
    icon: ShieldCheck,
    value: '12+',
    label: 'Core Modules',
    trend: 'neutral' as const,
  },
  {
    icon: Target,
    value: '6+',
    label: 'Industry Standards',
    trend: 'neutral' as const,
  },
  {
    icon: Zap,
    value: 'Fast',
    label: 'Audit Export Time',
    trend: 'neutral' as const,
  },
  {
    icon: TrendingUp,
    value: '100%',
    label: 'Audit Trail Coverage',
    trend: 'up' as const,
  },
];

// Enhanced Visual Divider with system theme
function SystemDivider() {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8 }}
      className="relative h-px w-full my-0"
      style={{
        background:
          'linear-gradient(90deg, transparent, rgba(0, 180, 220, 0.3), rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.3), transparent)',
      }}
    >
      {/* Center glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-8 bg-[rgba(0,180,220,0.2)] blur-xl" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-4 bg-[rgba(59,130,246,0.3)] blur-md" />
    </motion.div>
  );
}

export function HomePageContent() {
  return (
    <ScrollGradient className="relative">
      {/* ========================================
          SECTION 1: METRICS (variant: metrics)
          Soft radial glow, micro-particles, glass depth
          ======================================== */}
      <SystemBackground variant="metrics" className={spacing.sectionFull}>
        {/* Ambient atmosphere */}
        <AmbientOrbs intensity="subtle" />
        <SectionGlow color="cyan" intensity="medium" position="center" />

        <div className={`mx-auto max-w-7xl ${spacing.container} relative`}>
          <Reveal variant="fadeInUp" viewport="early">
            <SectionHeader
              badge="Live Platform Metrics"
              badgeIcon={
                <Parallax intensity="subtle" direction="up">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </Parallax>
              }
              title={<>Real-time compliance intelligence</>}
              subtitle="FormaOS tracks compliance posture across your entire organization in real-time"
              alignment="center"
            />
          </Reveal>

          <div
            className={`grid grid-cols-2 lg:grid-cols-4 ${spacing.cardGap.normal} mt-12`}
          >
            {metrics.map((metric, idx) => (
              <Reveal key={metric.label} variant="scaleIn" delay={idx * 0.1}>
                <HoverLift>
                  <div
                    className={`${depth.glass.normal} ${depth.border.subtle} ${radius.card} p-6`}
                  >
                    <MetricCard
                      icon={metric.icon}
                      value={metric.value}
                      label={metric.label}
                      trend={metric.trend}
                      delay={0}
                    />
                  </div>
                </HoverLift>
              </Reveal>
            ))}
          </div>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* ========================================
          SECTION 2: CONNECTED SYSTEM (variant: process)
          Stronger node presence, directional flow
          ======================================== */}
      <SystemBackground variant="process" className={spacing.sectionFull}>
        <AmbientOrbs intensity="normal" />
        <SectionGlow color="blue" intensity="high" position="top" />

        <div className={`mx-auto max-w-7xl ${spacing.container} relative`}>
          <Reveal variant="fadeInUp">
            <SectionHeader
              badge="Connected System"
              badgeIcon={
                <Parallax intensity="subtle" direction="down">
                  <Layers className="h-4 w-4 text-secondary" />
                </Parallax>
              }
              title={
                <>
                  Every module
                  <br />
                  <span className="text-gradient-system">
                    connected and aware
                  </span>
                </>
              }
              subtitle="A compliance operating system where policies, controls, evidence, and audits work as one intelligent network"
              alignment="center"
            />
          </Reveal>

          <Reveal delay={0.3} variant="scaleIn">
            <div className="flex justify-center mt-12">
              <EnhancedGlassCard
                intensity="strong"
                glow
                className="p-6 sm:p-8 lg:p-12 max-w-4xl w-full"
              >
                <div className="py-4 text-center">
                  <div className="text-2xl font-bold mb-4">
                    Connected Compliance System
                  </div>
                  <div className="text-muted-foreground">
                    A connected platform where policies, controls, evidence, and
                    audits work as one intelligent network
                  </div>
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                      <div className="text-sm font-semibold">Policies</div>
                      <div className="text-xs text-muted-foreground">
                        Framework alignment
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                      <div className="text-sm font-semibold">Controls</div>
                      <div className="text-xs text-muted-foreground">
                        Risk mitigation
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                      <div className="text-sm font-semibold">Evidence</div>
                      <div className="text-xs text-muted-foreground">
                        Audit trail
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                      <div className="text-sm font-semibold">Reports</div>
                      <div className="text-xs text-muted-foreground">
                        Compliance posture
                      </div>
                    </div>
                  </div>
                </div>
              </EnhancedGlassCard>
            </div>
          </Reveal>

          <Reveal
            variant="fadeInUp"
            delay={0.6}
            className="text-center mt-8 sm:mt-12"
          >
            <p className="text-foreground/60 text-sm sm:text-base mb-6 max-w-2xl mx-auto">
              Each node represents a core compliance function. Changes flow
              through the system—updating controls triggers evidence
              requirements, which cascade to audit readiness.
            </p>
            <Link
              href="/product"
              className="btn btn-secondary text-sm sm:text-lg px-6 sm:px-10 py-3 sm:py-5 inline-flex items-center gap-2"
            >
              Explore Platform Architecture
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* ========================================
          SECTION 3: LIFECYCLE (variant: info)
          Minimal, calm, subtle breathing motion
          ======================================== */}
      <SystemBackground variant="info" className={spacing.sectionFull}>
        <AmbientOrbs intensity="subtle" />
        <SectionGlow color="purple" intensity="low" position="center" />

        <div className={`mx-auto max-w-6xl ${spacing.container} relative`}>
          <Reveal variant="fadeInUp">
            <SectionHeader
              badge="The Complete System"
              badgeIcon={
                <Parallax intensity="subtle" direction="up">
                  <Sparkles className="h-4 w-4 text-primary" />
                </Parallax>
              }
              title={
                <>
                  Compliance lifecycle,
                  <br />
                  <span className="text-gradient-system">
                    engineered end-to-end
                  </span>
                </>
              }
              subtitle="From framework alignment to audit export—every step connected, traced, and defensible"
              alignment="center"
            />
          </Reveal>

          <div className={`space-y-6 mt-12`}>
            {lifecycle.map((step, idx) => (
              <Reveal key={step.title} variant="fadeInLeft" delay={idx * 0.15}>
                <HoverLift>
                  <div
                    className={`${depth.glass.subtle} ${depth.border.subtle} ${radius.card} p-6`}
                  >
                    <ProcessStep
                      number={idx + 1}
                      title={step.title}
                      description={step.description}
                      icon={step.icon}
                      delay={0}
                      showConnector={idx < lifecycle.length - 1}
                    />
                  </div>
                </HoverLift>
              </Reveal>
            ))}
          </div>

          <Reveal
            variant="fadeInUp"
            delay={0.8}
            className="text-center mt-10 sm:mt-14"
          >
            <Link
              href="/product"
              className="btn btn-primary text-sm sm:text-lg px-6 sm:px-10 py-3 sm:py-5 shadow-premium-lg"
            >
              Explore Platform Architecture
            </Link>
          </Reveal>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* ========================================
          SECTION 4: ARCHITECTURE (variant: process)
          System components with data pathways
          ======================================== */}
      <SystemBackground
        variant="process"
        intensity="high"
        className={spacing.sectionFull}
      >
        <AmbientOrbs intensity="normal" />
        <SectionGlow color="mixed" intensity="medium" position="top" />

        <div className={`mx-auto max-w-7xl ${spacing.container} relative`}>
          <Reveal variant="fadeInUp">
            <SectionHeader
              badge="System Architecture"
              badgeIcon={
                <Parallax intensity="subtle" direction="down">
                  <Layers className="h-4 w-4 text-secondary" />
                </Parallax>
              }
              title={
                <>
                  Built as infrastructure,
                  <br />
                  <span className="text-gradient-system">
                    not a document manager
                  </span>
                </>
              }
              subtitle="FormaOS is a true operating system for compliance—with interconnected modules working as one platform"
              alignment="center"
            />
          </Reveal>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${spacing.cardGap.relaxed} mt-12`}
          >
            {Object.entries(platformArchitecture).map(
              ([title, components], idx) => (
                <Reveal key={title} variant="scaleIn" delay={idx * 0.15}>
                  <HoverLift>
                    <div
                      className={`${depth.glass.normal} ${depth.border.normal} ${radius.card} p-6`}
                    >
                      <ArchitectureCard
                        title={title}
                        components={components}
                        icon={
                          idx === 0
                            ? Target
                            : idx === 1
                              ? Zap
                              : idx === 2
                                ? FileCheck
                                : TrendingUp
                        }
                        delay={0}
                      />
                    </div>
                  </HoverLift>
                </Reveal>
              ),
            )}
          </div>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* ========================================
          SECTION 4.5: PLATFORM CAPABILITIES
          Feature showcase section
          ======================================== */}
      <SystemBackground variant="info" className={spacing.sectionFull}>
        <AmbientOrbs intensity="subtle" />
        <SectionGlow color="blue" intensity="medium" position="center" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <SectionHeader
            badge="Complete Platform"
            title={
              <>
                Everything you need
                <br />
                <span className="text-gradient-system">out of the box</span>
              </>
            }
            subtitle="12+ modules, 6+ standards, REST API, and workflow automation"
            alignment="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {capabilities.map((capability, idx) => (
              <motion.div
                key={capability}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:bg-card transition-colors"
              >
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{capability}</span>
              </motion.div>
            ))}
          </div>

          <Reveal
            variant="fadeInUp"
            delay={0.8}
            className="text-center mt-10 sm:mt-14"
          >
            <Link
              href="/product"
              className="btn btn-primary text-sm sm:text-lg px-6 sm:px-10 py-3 sm:py-5"
            >
              View All Features
            </Link>
          </Reveal>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* ========================================
          SECTION 5: INDUSTRIES (variant: info)
          Calm informational section
          ======================================== */}
      <SystemBackground variant="info" className={spacing.sectionFull}>
        <AmbientOrbs intensity="subtle" />
        <SectionGlow color="blue" intensity="low" position="center" />

        <div className={`mx-auto max-w-7xl ${spacing.container} relative`}>
          <SectionHeader
            badge="Built for Regulated Industries"
            badgeIcon={
              <Parallax intensity="subtle" direction="up">
                <Layers className="h-4 w-4 text-secondary" />
              </Parallax>
            }
            title={
              <>
                Compliance frameworks
                <br />
                <span className="text-gradient-system">
                  that match your obligations
                </span>
              </>
            }
            subtitle="Pre-configured for Australian health, disability, and community services"
            alignment="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {industries.map((industry, idx) => (
              <motion.div
                key={industry.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <FeatureCard
                  icon={industry.icon}
                  title={industry.title}
                  description={industry.description}
                  delay={0}
                  variant="default"
                  accentColor="secondary"
                />
              </motion.div>
            ))}
          </div>

          <Reveal
            variant="fadeInUp"
            delay={0.6}
            className="text-center mt-10 sm:mt-14"
          >
            <Link
              href="/industries"
              className="btn btn-secondary text-sm sm:text-lg px-6 sm:px-10 py-3 sm:py-5"
            >
              Explore All Industries
            </Link>
          </Reveal>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* ========================================
          SECTION 6: SECURITY (variant: metrics)
          Glass effects with soft glow
          ======================================== */}
      <SystemBackground variant="metrics" className={spacing.sectionFull}>
        <AmbientOrbs intensity="normal" />
        <SectionGlow color="purple" intensity="medium" position="center" />

        <div className={`mx-auto max-w-7xl ${spacing.container} relative`}>
          <SectionHeader
            badge="Enterprise Security"
            badgeIcon={
              <Parallax intensity="subtle" direction="down">
                <Lock className="h-4 w-4 text-accent" />
              </Parallax>
            }
            title={
              <>
                Built for
                <br />
                <span className="text-gradient-system">
                  regulated environments
                </span>
              </>
            }
            subtitle="Security architecture designed for organizations that answer to regulators"
            alignment="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Lock,
                title: 'Role-based access',
                description: 'Segregation of duties enforced at every level',
              },
              {
                icon: ShieldCheck,
                title: 'Immutable logs',
                description: 'Evidence traceability for audit defense',
              },
              {
                icon: Layers,
                title: 'Org-scoped isolation',
                description: 'Data isolation for every tenant',
              },
              {
                icon: Activity,
                title: 'Compliance gates',
                description: 'Block unsafe actions automatically',
              },
              {
                icon: Eye,
                title: 'Audit trails',
                description: 'Complete history of all compliance actions',
              },
              {
                icon: FileCheck,
                title: 'Evidence chain',
                description: 'Verifiable custody from creation to export',
              },
            ].map((point, idx) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="card-radial-glow section-metrics"
              >
                <FeatureCard
                  icon={point.icon}
                  title={point.title}
                  description={point.description}
                  delay={0}
                  variant="frosted"
                  accentColor="accent"
                />
              </motion.div>
            ))}
          </div>

          <Reveal
            variant="fadeInUp"
            delay={0.7}
            className="text-center mt-10 sm:mt-14"
          >
            <Link
              href="/security"
              className="btn btn-ghost text-sm sm:text-lg px-6 sm:px-10 py-3 sm:py-5 inline-flex items-center gap-2"
            >
              Security Architecture
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </SystemBackground>

      <SystemDivider />

      {/* ========================================
          SECTION 7: FINAL CTA (variant: process)
          Full visual intensity
          ======================================== */}
      <SystemBackground
        variant="process"
        intensity="high"
        className="py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <Reveal variant="fadeInUp">
            <GlassCard
              variant="intense"
              glow
              glowColor="cyan"
              className="p-8 sm:p-12 lg:p-16 xl:p-20 text-center relative overflow-hidden"
            >
              {/* Shimmer overlay */}
              <div className="absolute inset-0 shimmer pointer-events-none" />

              {/* Gradient mesh overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-50">
                <GradientMesh animate={true} />
              </div>

              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 glass-system rounded-full px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-6 sm:mb-8"
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Start Your Trial
                </motion.div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-display mb-4 sm:mb-6">
                  Ready to operate with
                  <br className="hidden sm:block" />
                  <span className="text-gradient-system-animated">
                    complete governance clarity?
                  </span>
                </h2>

                <p className="text-base sm:text-lg lg:text-xl text-foreground/70 mb-8 sm:mb-12 max-w-3xl mx-auto">
                  Start your 14-day free trial. No credit card required. Full
                  platform access.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <AnimatedLink
                    href="/auth/signup?plan=pro"
                    variant="primary"
                    size="lg"
                    className="shadow-[0_8px_32px_rgba(0,212,251,0.35)] hover:shadow-[0_12px_40px_rgba(0,212,251,0.5)] w-full sm:w-auto text-sm sm:text-lg px-8 sm:px-12 py-4 sm:py-6"
                  >
                    Start Free Trial
                  </AnimatedLink>
                  <AnimatedLink
                    href="/contact"
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto text-sm sm:text-lg px-8 sm:px-12 py-4 sm:py-6"
                  >
                    Request Demo
                  </AnimatedLink>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8 sm:mt-12 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="h-2 w-2 rounded-full bg-primary"
                      animate={{
                        boxShadow: [
                          '0 0 8px rgba(0,180,220,0.5)',
                          '0 0 16px rgba(0,180,220,0.8)',
                          '0 0 8px rgba(0,180,220,0.5)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="h-2 w-2 rounded-full bg-primary"
                      animate={{
                        boxShadow: [
                          '0 0 8px rgba(0,180,220,0.5)',
                          '0 0 16px rgba(0,180,220,0.8)',
                          '0 0 8px rgba(0,180,220,0.5)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="h-2 w-2 rounded-full bg-primary"
                      animate={{
                        boxShadow: [
                          '0 0 8px rgba(0,180,220,0.5)',
                          '0 0 16px rgba(0,180,220,0.8)',
                          '0 0 8px rgba(0,180,220,0.5)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    />
                    <span>Full access</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </SystemBackground>
    </ScrollGradient>
  );
}

'use client';

import { useRef, useState, useMemo } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Server,
  Shield,
  Globe,
  Zap,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Eye,
  BarChart3,
  Bell,
  RefreshCw,
  Database,
  Lock,
  Layers,
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

/* ─── Types (exported for page.tsx) ───────────────────────── */

export interface StatusRow {
  checked_at: string;
  ok: boolean;
  latency_ms: number | null;
  source: string;
}

export interface StatusData {
  rows: StatusRow[];
  uptime7: number;
  uptime24: number;
  latencyAvgMs: number | null;
  latest: StatusRow | null;
  totalChecks7d: number;
  totalChecks24h: number;
  updatedAt: string;
}

/* ─── Infrastructure ──────────────────────────────────────── */

interface InfraComponent {
  name: string;
  description: string;
  icon: LucideIcon;
  colorRgb: string;
  features: string[];
}

const infraComponents: InfraComponent[] = [
  {
    name: 'Platform API',
    description:
      'Core REST API handling all compliance operations, evidence management, and user workflows.',
    icon: Server,
    colorRgb: '52,211,153',
    features: [
      'Auto-scaling compute clusters',
      'Multi-AZ redundancy',
      'P95 latency < 200ms',
      'Rate limiting & circuit breakers',
    ],
  },
  {
    name: 'Authentication Service',
    description:
      'Identity and access management including SAML SSO, MFA, and session management.',
    icon: Lock,
    colorRgb: '139,92,246',
    features: [
      'SAML 2.0 / OIDC integration',
      'Hardware MFA support (FIDO2)',
      'Session policy enforcement',
      'SCIM provisioning',
    ],
  },
  {
    name: 'Data Layer',
    description:
      'Primary database clusters with replication, encryption, and automated backup pipelines.',
    icon: Database,
    colorRgb: '59,130,246',
    features: [
      'AES-256 encryption at rest',
      'Continuous replication (RPO < 1h)',
      'Automated daily backups',
      'Point-in-time recovery',
    ],
  },
  {
    name: 'Evidence Vault',
    description:
      'Immutable evidence storage with SHA-256 integrity verification and versioned access.',
    icon: Shield,
    colorRgb: '34,211,238',
    features: [
      'SHA-256 integrity hashing',
      'Immutable versioning',
      'Geo-redundant storage',
      'Configurable retention',
    ],
  },
  {
    name: 'CDN & Edge Network',
    description:
      'Global content delivery with edge caching, WAF protection, and DDoS mitigation.',
    icon: Globe,
    colorRgb: '245,158,11',
    features: [
      'Global edge locations',
      'DDoS protection (L3/L4/L7)',
      'Web Application Firewall',
      'TLS 1.3 termination',
    ],
  },
  {
    name: 'Background Workers',
    description:
      'Asynchronous job processing for report generation, evidence collection, and notifications.',
    icon: Zap,
    colorRgb: '251,113,133',
    features: [
      'Priority-based job queues',
      'Automatic retry with backoff',
      'Dead letter queue handling',
      'Real-time job monitoring',
    ],
  },
];

/* ─── Animated Stat ───────────────────────────────────────── */

function AnimatedStat({
  value,
  label,
  suffix,
  delay,
  colorClass,
}: {
  value: string;
  label: string;
  suffix?: string;
  delay: number;
  colorClass?: string;
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
        {suffix && (
          <span className={colorClass ?? 'text-emerald-400'}>{suffix}</span>
        )}
      </div>
      <div className="text-xs sm:text-sm text-slate-400 font-medium">
        {label}
      </div>
    </motion.div>
  );
}

/* ─── Status Indicator ────────────────────────────────────── */

function StatusIndicator({
  ok,
  size = 'md',
}: {
  ok: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  if (ok) {
    return (
      <span className="relative flex">
        <span
          className={`animate-ping absolute inline-flex ${sizeClasses[size]} rounded-full bg-emerald-400 opacity-30`}
        />
        <span
          className={`relative inline-flex ${sizeClasses[size]} rounded-full bg-emerald-400`}
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex ${sizeClasses[size]} rounded-full bg-red-400`} />
  );
}

/* ─── Overall Status Banner ───────────────────────────────── */

function OverallStatusBanner({
  data,
}: {
  data: StatusData;
}) {
  const isHealthy = data.uptime7 >= 99;
  const isWarning = data.uptime7 >= 95 && data.uptime7 < 99;

  return (
    <ScrollReveal variant="fadeUp" range={[0, 0.3]}>
      <div
        className={`rounded-2xl border p-6 sm:p-8 text-center
          ${
            isHealthy
              ? 'border-emerald-400/20 bg-emerald-500/[0.04]'
              : isWarning
                ? 'border-amber-400/20 bg-amber-500/[0.04]'
                : 'border-red-400/20 bg-red-500/[0.04]'
          }`}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <StatusIndicator
            ok={isHealthy}
            size="lg"
          />
          <h2
            className={`text-xl sm:text-2xl font-bold
              ${isHealthy ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-red-400'}`}
          >
            {isHealthy
              ? 'All Systems Operational'
              : isWarning
                ? 'Degraded Performance'
                : 'Service Disruption'}
          </h2>
        </div>
        <p className="text-sm text-slate-400">
          {data.latest
            ? `Last checked ${new Date(data.latest.checked_at).toLocaleString()}`
            : 'No recent check data available'}
        </p>
      </div>
    </ScrollReveal>
  );
}

/* ─── Uptime Bar Chart ────────────────────────────────────── */

function UptimeBarChart({ rows }: { rows: StatusRow[] }) {
  // Group rows into hourly buckets for the last 7 days
  const hourlyBuckets = useMemo(() => {
    const now = Date.now();
    const bucketCount = 168; // 7 days × 24 hours
    const bucketSize = 3600000; // 1 hour in ms

    const buckets: { hour: number; total: number; ok: number }[] = [];
    for (let i = 0; i < bucketCount; i++) {
      const start = now - (bucketCount - i) * bucketSize;
      const end = start + bucketSize;
      const inBucket = rows.filter((r) => {
        const t = new Date(r.checked_at).getTime();
        return t >= start && t < end;
      });
      buckets.push({
        hour: i,
        total: inBucket.length,
        ok: inBucket.filter((r) => r.ok).length,
      });
    }
    return buckets;
  }, [rows]);

  // Show last 90 bars for visual density
  const visibleBuckets = hourlyBuckets.slice(-90);

  return (
    <DeferredSection minHeight={200}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 mb-6">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Uptime History
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              90-hour{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                uptime chart
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Each bar represents one hour. Green means all checks passed.
              Red indicates one or more failures.
            </p>
          </ScrollReveal>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-end gap-0.5 h-20 sm:h-24">
              {visibleBuckets.map((bucket, i) => {
                const hasData = bucket.total > 0;
                const allOk = hasData && bucket.ok === bucket.total;
                const hasFailures = hasData && bucket.ok < bucket.total;
                const noData = !hasData;

                return (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-sm min-w-[2px]"
                    initial={{ height: 0 }}
                    whileInView={{ height: hasData ? '100%' : '20%' }}
                    viewport={{ once: true }}
                    transition={{
                      delay: i * 0.005,
                      duration: 0.4,
                      ease: EASE_OUT_EXPO,
                    }}
                    style={{
                      backgroundColor: noData
                        ? 'rgba(255,255,255,0.03)'
                        : allOk
                          ? 'rgba(52,211,153,0.5)'
                          : hasFailures
                            ? 'rgba(248,113,113,0.5)'
                            : 'rgba(255,255,255,0.05)',
                    }}
                    title={
                      hasData
                        ? `${bucket.ok}/${bucket.total} checks passed`
                        : 'No data'
                    }
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-slate-500">
              <span>~90 hours ago</span>
              <span>Now</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-400/50" />
              All checks passed
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-400/50" />
              Failures detected
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-white/[0.03]" />
              No data
            </div>
          </div>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Recent Checks Table ─────────────────────────────────── */

function RecentChecksTable({ rows }: { rows: StatusRow[] }) {
  const [showAll, setShowAll] = useState(false);
  const recentRows = showAll ? rows.slice(0, 100) : rows.slice(0, 20);

  return (
    <DeferredSection minHeight={400}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 mb-6">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Recent Checks
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Latest{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                health checks
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Real-time results from our automated monitoring system.
              Each check verifies endpoint availability and response time.
            </p>
          </ScrollReveal>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/[0.06] text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-1">Status</div>
              <div className="col-span-4">Timestamp</div>
              <div className="col-span-3">Source</div>
              <div className="col-span-2 text-right">Latency</div>
              <div className="col-span-2 text-right">Result</div>
            </div>

            {/* Table rows */}
            {recentRows.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No check data available
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentRows.map((row, i) => (
                  <motion.div
                    key={`${row.checked_at}-${i}`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="grid grid-cols-12 gap-2 px-5 py-3 text-xs hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="col-span-1 flex items-center">
                      {row.ok ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>
                    <div className="col-span-4 text-slate-300 font-mono">
                      {new Date(row.checked_at).toLocaleString()}
                    </div>
                    <div className="col-span-3 text-slate-400">
                      {row.source}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {row.latency_ms !== null ? (
                        <span
                          className={
                            row.latency_ms < 200
                              ? 'text-emerald-400'
                              : row.latency_ms < 500
                                ? 'text-amber-400'
                                : 'text-red-400'
                          }
                        >
                          {row.latency_ms}ms
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>
                    <div className="col-span-2 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${
                            row.ok
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-400/20'
                              : 'text-red-400 bg-red-500/10 border border-red-400/20'
                          }`}
                      >
                        {row.ok ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Show more */}
            {rows.length > 20 && (
              <div className="px-5 py-3 border-t border-white/[0.06] text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                  {showAll
                    ? 'Show fewer'
                    : `Show more (${Math.min(rows.length, 100)} of ${rows.length})`}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Infrastructure Section ──────────────────────────────── */

function InfrastructureSection() {
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
                Infrastructure
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              What powers{' '}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                FormaOS
              </span>
            </h2>
            <p className="text-base text-slate-400 max-w-xl mx-auto">
              A breakdown of our core infrastructure components, each
              independently monitored, scaled, and secured.
            </p>
          </ScrollReveal>

          <SectionChoreography
            pattern="stagger-wave"
            stagger={0.06}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {infraComponents.map((comp) => {
              const Icon = comp.icon;
              return (
                <div
                  key={comp.name}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6
                    hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                >
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 50% 0%, rgba(${comp.colorRgb}, 0.04), transparent 70%)`,
                    }}
                  />

                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-xl border flex items-center justify-center mb-4"
                      style={{
                        borderColor: `rgba(${comp.colorRgb}, 0.2)`,
                        backgroundColor: `rgba(${comp.colorRgb}, 0.08)`,
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: `rgba(${comp.colorRgb}, 0.85)` }}
                      />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">
                      {comp.name}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">
                      {comp.description}
                    </p>
                    <div className="space-y-2">
                      {comp.features.map((f) => (
                        <div key={f} className="flex items-center gap-2">
                          <CheckCircle2
                            className="w-3 h-3 shrink-0"
                            style={{
                              color: `rgba(${comp.colorRgb}, 0.6)`,
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

/* ─── Latency Distribution ────────────────────────────────── */

function LatencyDistribution({ rows }: { rows: StatusRow[] }) {
  const distribution = useMemo(() => {
    const buckets = [
      { label: '< 100ms', min: 0, max: 100, color: 'rgb(52,211,153)', count: 0 },
      { label: '100-200ms', min: 100, max: 200, color: 'rgb(34,211,238)', count: 0 },
      { label: '200-500ms', min: 200, max: 500, color: 'rgb(245,158,11)', count: 0 },
      { label: '500ms-1s', min: 500, max: 1000, color: 'rgb(251,113,133)', count: 0 },
      { label: '> 1s', min: 1000, max: Infinity, color: 'rgb(239,68,68)', count: 0 },
    ];

    const withLatency = rows.filter(
      (r): r is StatusRow & { latency_ms: number } =>
        typeof r.latency_ms === 'number',
    );

    withLatency.forEach((r) => {
      for (const bucket of buckets) {
        if (r.latency_ms >= bucket.min && r.latency_ms < bucket.max) {
          bucket.count++;
          break;
        }
      }
    });

    const maxCount = Math.max(...buckets.map((b) => b.count), 1);
    return buckets.map((b) => ({
      ...b,
      percentage: (b.count / maxCount) * 100,
      total: withLatency.length,
    }));
  }, [rows]);

  return (
    <DeferredSection minHeight={250}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 mb-6">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Performance
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Latency{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
                distribution
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Response time distribution across all health checks in the
              past 7 days.
            </p>
          </ScrollReveal>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="space-y-4">
              {distribution.map((bucket, i) => (
                <div key={bucket.label} className="flex items-center gap-4">
                  <span className="w-20 text-xs text-slate-400 text-right font-mono shrink-0">
                    {bucket.label}
                  </span>
                  <div className="flex-1 h-6 rounded-lg bg-white/[0.03] overflow-hidden">
                    <motion.div
                      className="h-full rounded-lg"
                      style={{ backgroundColor: bucket.color }}
                      initial={{ width: 0 }}
                      whileInView={{
                        width: `${bucket.percentage}%`,
                      }}
                      viewport={{ once: true }}
                      transition={{
                        delay: i * 0.08,
                        duration: 0.6,
                        ease: EASE_OUT_EXPO,
                      }}
                    />
                  </div>
                  <span className="w-16 text-xs text-slate-400 font-mono shrink-0">
                    {bucket.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Incident Response ───────────────────────────────────── */

const incidentCommitments = [
  {
    icon: AlertTriangle,
    title: 'Detection',
    time: '< 5 minutes',
    description:
      'Automated monitoring detects anomalies within 5 minutes through synthetic checks, real-user monitoring, and infrastructure alerting.',
    colorRgb: '251,113,133',
  },
  {
    icon: Bell,
    title: 'Notification',
    time: '< 15 minutes',
    description:
      'Affected customers notified via status page, email, and in-app banner within 15 minutes of incident confirmation.',
    colorRgb: '245,158,11',
  },
  {
    icon: RefreshCw,
    title: 'Mitigation',
    time: '< 60 minutes',
    description:
      'On-call engineering team implements mitigation within 60 minutes. Automated failover handles most scenarios instantly.',
    colorRgb: '34,211,238',
  },
  {
    icon: Eye,
    title: 'Post-Mortem',
    time: '< 72 hours',
    description:
      'Blameless post-mortem published within 72 hours with root cause analysis, timeline, and preventive measures.',
    colorRgb: '52,211,153',
  },
];

function IncidentResponseSection() {
  return (
    <DeferredSection minHeight={300}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <ScrollReveal
            variant="depthScale"
            range={[0, 0.3]}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-rose-400/20 bg-rose-500/10 mb-6">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                Incident Response
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              When things go{' '}
              <span className="bg-gradient-to-r from-rose-400 via-amber-400 to-rose-300 bg-clip-text text-transparent">
                wrong
              </span>
            </h2>
            <p className="text-base text-slate-400 max-w-xl mx-auto">
              Our incident response commitments — transparent, fast, and
              focused on getting you back to normal operations.
            </p>
          </ScrollReveal>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-rose-400/30 via-amber-400/30 to-emerald-400/30 hidden sm:block" />

            <SectionChoreography
              pattern="cascade"
              stagger={0.1}
              className="space-y-4"
            >
              {incidentCommitments.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 sm:ml-14
                      hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                  >
                    {/* Timeline dot */}
                    <div
                      className="absolute -left-[3.25rem] top-7 w-3 h-3 rounded-full border-2 border-canvas-900 hidden sm:block"
                      style={{
                        backgroundColor: `rgba(${item.colorRgb}, 0.8)`,
                      }}
                    />

                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                        style={{
                          borderColor: `rgba(${item.colorRgb}, 0.2)`,
                          backgroundColor: `rgba(${item.colorRgb}, 0.08)`,
                        }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: `rgba(${item.colorRgb}, 0.85)` }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-semibold text-white">
                            {item.title}
                          </h3>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                            style={{
                              color: `rgba(${item.colorRgb}, 0.9)`,
                              borderColor: `rgba(${item.colorRgb}, 0.2)`,
                              backgroundColor: `rgba(${item.colorRgb}, 0.08)`,
                            }}
                          >
                            {item.time}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </SectionChoreography>
          </div>
        </div>
      </section>
    </DeferredSection>
  );
}

/* ─── Subscribe CTA ───────────────────────────────────────── */

function SubscribeCTA() {
  return (
    <DeferredSection minHeight={350}>
      <section className="mk-section relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.08), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(34,211,238,0.06), transparent 50%)',
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
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Stay Informed
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Never miss a{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                    status update
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10">
                  Subscribe to incident notifications and maintenance
                  windows. Get notified via email, Slack, or webhook
                  when something impacts your service.
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
                    Subscribe to Updates
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <a
                    href="mailto:Formaos.team@gmail.com?subject=Status%20Notifications"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                      border border-white/[0.12] bg-white/[0.04]
                      text-white font-semibold text-sm
                      hover:bg-white/[0.08] hover:border-white/[0.2]
                      transition-all duration-300"
                  >
                    Contact Support
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-slate-500">
                  {[
                    'Real-time monitoring',
                    'Automated failover',
                    'Transparent post-mortems',
                    '99.9% uptime SLA',
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

function StatusHero({ data }: { data: StatusData }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 60]);

  const isHealthy = data.uptime7 >= 99;

  return (
    <section
      ref={heroRef}
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{
            background: isHealthy
              ? 'rgba(52,211,153,0.12)'
              : 'rgba(248,113,113,0.12)',
          }}
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
          style={{ background: 'rgba(34,211,238,0.10)' }}
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
          <StatusIndicator ok={isHealthy} size="sm" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            System Status
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6"
        >
          {isHealthy ? (
            <>
              All systems{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                operational
              </span>
            </>
          ) : (
            <>
              System health{' '}
              <span className="bg-gradient-to-r from-amber-400 via-red-400 to-amber-300 bg-clip-text text-transparent">
                monitoring
              </span>
            </>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Real-time platform health, uptime metrics, and infrastructure
          status. Updated every 60 seconds with automated monitoring.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto"
        >
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5">
              {data.uptime7}
              <span className="text-emerald-400 text-sm">%</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
              7-Day Uptime
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5">
              {data.uptime24}
              <span className="text-emerald-400 text-sm">%</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
              24h Uptime
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5">
              {data.latencyAvgMs !== null ? (
                <>
                  {data.latencyAvgMs}
                  <span className="text-cyan-400 text-sm">ms</span>
                </>
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
              Avg Latency
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5">
              {data.totalChecks7d.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
              7-Day Checks
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-canvas-900 to-transparent pointer-events-none" />
    </section>
  );
}

/* ─── Main Component ──────────────────────────────────────── */

export default function StatusPageContent({
  data,
}: {
  data: StatusData;
}) {
  return (
    <MarketingPageShell>
      <StatusHero data={data} />

      <VisualDivider gradient />

      {/* Overall status banner */}
      <section className="mk-section">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <OverallStatusBanner data={data} />
        </div>
      </section>

      <VisualDivider />

      {/* Stats */}
      <DeferredSection minHeight={200}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                <AnimatedStat
                  value={`${data.uptime7}`}
                  suffix="%"
                  label="7-Day Uptime"
                  delay={0}
                />
                <AnimatedStat
                  value={`${data.uptime24}`}
                  suffix="%"
                  label="24h Uptime"
                  delay={0.08}
                />
                <AnimatedStat
                  value={
                    data.latencyAvgMs !== null
                      ? `${data.latencyAvgMs}`
                      : '—'
                  }
                  suffix={data.latencyAvgMs !== null ? 'ms' : ''}
                  label="Avg Latency"
                  delay={0.16}
                  colorClass="text-cyan-400"
                />
                <AnimatedStat
                  value={data.totalChecks7d.toLocaleString()}
                  label="Total Checks (7d)"
                  delay={0.24}
                />
                <AnimatedStat
                  value={data.totalChecks24h.toLocaleString()}
                  label="Total Checks (24h)"
                  delay={0.32}
                />
                <AnimatedStat
                  value={'60'}
                  suffix="s"
                  label="Check Interval"
                  delay={0.4}
                  colorClass="text-violet-400"
                />
              </div>
            </div>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Uptime bar chart */}
      <UptimeBarChart rows={data.rows} />

      <VisualDivider />

      {/* Latency distribution */}
      <LatencyDistribution rows={data.rows} />

      <VisualDivider />

      {/* Recent checks */}
      <RecentChecksTable rows={data.rows} />

      <VisualDivider />

      {/* Infrastructure */}
      <InfrastructureSection />

      <VisualDivider />

      {/* Incident response */}
      <IncidentResponseSection />

      <VisualDivider />

      {/* CTA */}
      <SubscribeCTA />
    </MarketingPageShell>
  );
}

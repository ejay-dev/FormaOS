'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Shield,
  Zap,
  Globe,
  Server,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */

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

/* ─── Animated Background ───────────────────────────────── */

function StatusHeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-40 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.06] blur-[130px]"
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 30, 0],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.05] blur-[100px]"
        animate={{
          scale: [1.1, 1, 1.1],
          x: [0, -25, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
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

function StatusHero({ isOperational }: { isOperational: boolean }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, -50]);

  return (
    <div ref={heroRef} className="relative overflow-hidden pb-8 pt-24 sm:pt-32">
      <StatusHeroBackground />
      <motion.div
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative mx-auto max-w-4xl px-6 text-center"
      >
        {/* Status indicator badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 inline-flex items-center gap-2.5 rounded-full border px-5 py-2"
          style={{
            borderColor: isOperational
              ? 'rgba(52,211,153,0.3)'
              : 'rgba(244,63,94,0.3)',
            backgroundColor: isOperational
              ? 'rgba(52,211,153,0.05)'
              : 'rgba(244,63,94,0.05)',
          }}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                isOperational ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                isOperational ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
          </span>
          <span
            className={`text-sm font-semibold ${
              isOperational ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isOperational ? 'All Systems Operational' : 'Degraded Performance'}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          System{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Status
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-2xl text-base text-slate-400 leading-relaxed sm:text-lg"
        >
          Uptime checks are published from a scheduled health probe. This page
          reports platform availability signals, not contractual SLAs.
        </motion.p>
      </motion.div>
    </div>
  );
}

/* ─── Metric Cards ──────────────────────────────────────── */

function MetricCards({ data }: { data: StatusData }) {
  const metrics = [
    {
      label: 'Current Status',
      value: data.latest
        ? data.latest.ok
          ? 'Operational'
          : 'Degraded'
        : 'No data',
      icon: data.latest?.ok ? CheckCircle2 : XCircle,
      iconColor: data.latest?.ok ? 'text-emerald-400' : 'text-rose-400',
      sublabel: data.latest
        ? new Date(data.latest.checked_at).toLocaleString()
        : 'N/A',
      glow: data.latest?.ok
        ? 'hover:shadow-[0_0_30px_rgba(52,211,153,0.1)]'
        : 'hover:shadow-[0_0_30px_rgba(244,63,94,0.1)]',
    },
    {
      label: 'Uptime (24h)',
      value: `${data.uptime24}%`,
      icon: Shield,
      iconColor:
        data.uptime24 >= 99.9
          ? 'text-emerald-400'
          : data.uptime24 >= 99
            ? 'text-amber-400'
            : 'text-rose-400',
      sublabel: `${data.totalChecks24h} checks`,
      glow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.1)]',
    },
    {
      label: 'Uptime (7d)',
      value: `${data.uptime7}%`,
      icon: TrendingUp,
      iconColor:
        data.uptime7 >= 99.9
          ? 'text-emerald-400'
          : data.uptime7 >= 99
            ? 'text-amber-400'
            : 'text-rose-400',
      sublabel: `${data.totalChecks7d} checks`,
      glow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.1)]',
    },
    {
      label: 'Avg Latency',
      value: data.latencyAvgMs !== null ? `${data.latencyAvgMs}ms` : 'N/A',
      icon: Zap,
      iconColor: 'text-cyan-400',
      sublabel: '7-day average',
      glow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.3 + index * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.04] ${metric.glow}`}
          >
            {/* Top line accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {metric.label}
              </span>
              <Icon
                className={`h-5 w-5 ${metric.iconColor} transition-transform duration-300 group-hover:scale-110`}
              />
            </div>
            <div className="text-2xl font-bold text-white sm:text-3xl">
              {metric.value}
            </div>
            <div className="mt-1 text-xs text-slate-500">{metric.sublabel}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Uptime Bar Visual ─────────────────────────────────── */

function UptimeBarVisual({ rows }: { rows: StatusRow[] }) {
  // Group into 60 most recent time buckets
  const bucketCount = 60;
  const bucketSize = Math.max(1, Math.ceil(rows.length / bucketCount));
  const buckets: { ok: number; total: number }[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const slice = rows.slice(i * bucketSize, (i + 1) * bucketSize);
    if (slice.length === 0) break;
    buckets.push({
      ok: slice.filter((r) => r.ok).length,
      total: slice.length,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mt-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">
            Uptime History (7d)
          </h3>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-emerald-400" /> Operational
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-rose-400" /> Degraded
          </span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-px h-16">
        {buckets.map((bucket, index) => {
          const percentage = bucket.total > 0 ? bucket.ok / bucket.total : 1;
          const isFullyOk = percentage === 1;
          return (
            <motion.div
              key={index}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.3,
                delay: index * 0.01,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`flex-1 rounded-t-sm origin-bottom transition-opacity duration-200 hover:opacity-80 ${
                isFullyOk ? 'bg-emerald-400/60' : 'bg-rose-400/60'
              }`}
              style={{ height: `${Math.max(percentage * 100, 8)}%` }}
              title={`${Math.round(percentage * 100)}% uptime (${bucket.ok}/${bucket.total} checks)`}
            />
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[9px] text-slate-600">
        <span>7 days ago</span>
        <span>Now</span>
      </div>
    </motion.div>
  );
}

/* ─── Recent Checks Table ───────────────────────────────── */

function RecentChecksTable({ rows }: { rows: StatusRow[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mt-12 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06]">
          <Clock className="h-4 w-4 text-cyan-400" />
        </div>
        <h2 className="text-sm font-bold text-white">Recent Checks</h2>
        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-500">
          Last 40
        </span>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {rows.slice(0, 40).map((r, index) => (
          <motion.div
            key={r.checked_at}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.02 }}
            className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-white/[0.02]"
          >
            <div className="flex items-center gap-3">
              {r.ok ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/10">
                  <XCircle className="h-3.5 w-3.5 text-rose-400" />
                </div>
              )}
              <div className="text-sm text-slate-300">
                {new Date(r.checked_at).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {typeof r.latency_ms === 'number' && (
                <span
                  className={`text-xs font-mono ${
                    r.latency_ms < 200
                      ? 'text-emerald-400'
                      : r.latency_ms < 500
                        ? 'text-amber-400'
                        : 'text-rose-400'
                  }`}
                >
                  {r.latency_ms}ms
                </span>
              )}
              <span className="text-[10px] text-slate-600 w-16 text-right">
                {r.source}
              </span>
            </div>
          </motion.div>
        ))}
        {rows.length === 0 && (
          <div className="px-6 py-10 text-center">
            <Server className="mx-auto h-8 w-8 text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">
              No uptime data has been published yet.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Infrastructure Info ───────────────────────────────── */

function InfrastructureInfo() {
  const infra = [
    {
      icon: Globe,
      label: 'Region',
      value: 'AU (ap-southeast-2)',
      description: 'Primary hosting region',
    },
    {
      icon: Server,
      label: 'Platform',
      value: 'Vercel Edge + Supabase',
      description: 'Serverless infrastructure',
    },
    {
      icon: Shield,
      label: 'SLA Target',
      value: '99.9% (Enterprise)',
      description: 'Contractual commitment',
    },
    {
      icon: Clock,
      label: 'Check Frequency',
      value: 'Every 5 minutes',
      description: 'Automated health probes',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mt-12"
    >
      <h2 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
        <Server className="h-4 w-4 text-violet-400" />
        Infrastructure
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {infra.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: index * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {item.label}
                </span>
              </div>
              <div className="text-sm font-semibold text-white">
                {item.value}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {item.description}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Status CTA ────────────────────────────────────────── */

function StatusCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mt-20 relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.05] via-cyan-500/[0.03] to-transparent p-10 text-center"
    >
      {/* Floating particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-emerald-400/20"
          style={{
            top: `${15 + i * 18}%`,
            left: `${10 + i * 20}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        />
      ))}

      <div className="relative">
        <h3 className="text-lg font-bold text-white mb-3">
          Need Help or Reporting an Issue?
        </h3>
        <p className="mx-auto max-w-md text-sm text-slate-400 mb-6 leading-relaxed">
          If you&apos;re experiencing issues, contact our support team.
          Enterprise customers have access to priority P1/P2 escalation paths.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="mailto:support@formaos.com"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:shadow-emerald-500/30 hover:brightness-110"
          >
            Contact Support
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
          <a
            href="/enterprise"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-7 py-3 text-sm font-semibold text-slate-300 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
          >
            Enterprise SLA Details
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ────────────────────────────────────── */

export default function StatusPageContent({ data }: { data: StatusData }) {
  const isOperational = data.latest ? data.latest.ok : true;

  return (
    <div className="relative min-h-screen bg-canvas-900">
      <StatusHero isOperational={isOperational} />

      <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Updated timestamp */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-8 text-xs text-slate-600 text-center"
        >
          Last updated: {data.updatedAt}
        </motion.p>

        <MetricCards data={data} />

        <UptimeBarVisual rows={data.rows} />

        <RecentChecksTable rows={data.rows} />

        <InfrastructureInfo />

        <StatusCTA />
      </div>
    </div>
  );
}

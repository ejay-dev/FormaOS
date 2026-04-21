import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type SystemSectionVariant = 'cyan' | 'emerald' | 'amber' | 'red';
type StatusTone = 'valid' | 'warning' | 'blocked' | 'live' | 'neutral';

const glowByVariant: Record<SystemSectionVariant, string> = {
  cyan:
    'bg-[radial-gradient(circle_at_16%_10%,rgba(45,212,191,0.13),transparent_30%),radial-gradient(circle_at_82%_74%,rgba(20,184,166,0.08),transparent_34%)]',
  emerald:
    'bg-[radial-gradient(circle_at_18%_12%,rgba(52,211,153,0.12),transparent_30%),radial-gradient(circle_at_78%_74%,rgba(45,212,191,0.08),transparent_34%)]',
  amber:
    'bg-[radial-gradient(circle_at_18%_12%,rgba(245,158,11,0.1),transparent_30%),radial-gradient(circle_at_78%_74%,rgba(45,212,191,0.07),transparent_34%)]',
  red:
    'bg-[radial-gradient(circle_at_18%_12%,rgba(248,113,113,0.1),transparent_30%),radial-gradient(circle_at_78%_74%,rgba(45,212,191,0.07),transparent_34%)]',
};

const statusTone: Record<StatusTone, string> = {
  valid: 'border-emerald-300/25 bg-emerald-300/[0.09] text-emerald-100 shadow-[0_0_22px_rgba(52,211,153,0.12)]',
  warning: 'border-amber-300/25 bg-amber-300/[0.09] text-amber-100 shadow-[0_0_22px_rgba(245,158,11,0.11)]',
  blocked: 'border-red-300/30 bg-red-500/[0.1] text-red-100 shadow-[0_0_28px_rgba(248,113,113,0.16)]',
  live: 'border-cyan-300/25 bg-cyan-300/[0.09] text-cyan-100 shadow-[0_0_22px_rgba(45,212,191,0.12)]',
  neutral: 'border-slate-300/15 bg-white/[0.06] text-slate-200',
};

export const systemPanelClass =
  'rounded-2xl border border-white/[0.075] bg-white/[0.035] shadow-[0_18px_56px_rgba(2,6,23,0.34),inset_0_1px_0_rgba(255,255,255,0.045)] backdrop-blur-xl transition duration-300 hover:border-teal-300/20 hover:bg-white/[0.05]';

export const systemPanelCompactClass =
  'rounded-xl border border-white/[0.07] bg-slate-950/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_32px_rgba(2,6,23,0.28)] backdrop-blur-md transition duration-300 hover:border-teal-300/18 hover:bg-slate-900/55';

export function SystemSection({
  children,
  className = '',
  containerClassName = '',
  id,
  variant = 'cyan',
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
  variant?: SystemSectionVariant;
}) {
  return (
    <section id={id} className={`relative isolate overflow-hidden bg-slate-950 py-20 sm:py-24 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#020617_0%,#07111f_48%,#020617_100%)]" />
      <div className={`pointer-events-none absolute inset-0 ${glowByVariant[variant]}`} />
      <div className="mk-security-grid pointer-events-none absolute inset-0 opacity-[0.13] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_74%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className={`relative mx-auto max-w-7xl px-6 lg:px-12 ${containerClassName}`}>
        {children}
      </div>
    </section>
  );
}

export function AccentText({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-cyan-200 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

export function SectionEyebrow({
  children,
  icon: Icon,
  tone = 'live',
}: {
  children: ReactNode;
  icon?: LucideIcon;
  tone?: StatusTone;
}) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone[tone]}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {children}
    </div>
  );
}

export function IconFrame({
  icon: Icon,
  tone = 'live',
  className = '',
}: {
  icon: LucideIcon;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${statusTone[tone]} ${className}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}

export function StatusPill({
  children,
  tone = 'neutral',
  pulse = false,
}: {
  children: ReactNode;
  tone?: StatusTone;
  pulse?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusTone[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        tone === 'blocked'
          ? 'bg-red-300'
          : tone === 'warning'
            ? 'bg-amber-300'
            : tone === 'valid'
              ? 'bg-emerald-300'
              : 'bg-cyan-300'
      } ${pulse ? 'animate-pulse' : ''}`} />
      {children}
    </span>
  );
}

export function SystemFrame({
  children,
  className = '',
  label = 'LIVE SYSTEM',
  status = 'ENFORCING',
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  status?: string;
}) {
  return (
    <div className={`${systemPanelClass} relative overflow-hidden p-3 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.08),transparent_40%)]" />
      <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-slate-950/72">
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-300/80" />
            <span className="h-2 w-2 rounded-full bg-amber-300/80" />
            <span className="h-2 w-2 rounded-full bg-emerald-300/80" />
            <span className="ml-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {label}
            </span>
          </div>
          <StatusPill tone="live">{status}</StatusPill>
        </div>
        {children}
      </div>
    </div>
  );
}

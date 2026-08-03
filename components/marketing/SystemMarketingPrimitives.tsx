import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type SystemSectionVariant = 'cyan' | 'emerald' | 'amber' | 'red';
type StatusTone = 'valid' | 'warning' | 'blocked' | 'live' | 'neutral';

const glowByVariant: Record<SystemSectionVariant, string> = {
  cyan:
    'bg-[radial-gradient(circle_at_16%_10%,rgba(161,161,170,0.13),transparent_30%),radial-gradient(circle_at_82%_74%,rgba(113,113,122,0.08),transparent_34%)]',
  emerald:
    'bg-[radial-gradient(circle_at_18%_12%,rgba(148,163,184,0.12),transparent_30%),radial-gradient(circle_at_78%_74%,rgba(113,113,122,0.08),transparent_34%)]',
  amber:
    'bg-[radial-gradient(circle_at_18%_12%,rgba(245,158,11,0.1),transparent_30%),radial-gradient(circle_at_78%_74%,rgba(113,113,122,0.07),transparent_34%)]',
  red:
    'bg-[radial-gradient(circle_at_18%_12%,rgba(248,113,113,0.1),transparent_30%),radial-gradient(circle_at_78%_74%,rgba(113,113,122,0.07),transparent_34%)]',
};

/* Status colour is reserved for states a reader must act on. "Live" is not
   one of them — it described the product being switched on, which is not
   news — so it resolves to the same neutral as everything else, and the
   glows are gone. */
const statusTone: Record<StatusTone, string> = {
  valid: 'border-emerald-300/25 bg-emerald-300/[0.09] text-emerald-100',
  warning: 'border-amber-300/25 bg-amber-300/[0.09] text-amber-100',
  blocked: 'border-red-300/30 bg-red-500/[0.1] text-red-100',
  live: 'border-white/15 bg-white/[0.06] text-zinc-200',
  neutral: 'border-white/15 bg-white/[0.06] text-zinc-200',
};

export const systemPanelClass =
  'rounded-2xl border border-white/[0.075] bg-white/[0.035] shadow-[0_18px_56px_rgba(6,7,8,0.34),inset_0_1px_0_rgba(255,255,255,0.045)] backdrop-blur-xl transition duration-300 hover:border-white/20 hover:bg-white/[0.05]';

export const systemPanelCompactClass =
  'rounded-xl border border-white/[0.07] bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_32px_rgba(6,7,8,0.28)] backdrop-blur-md transition duration-300 hover:border-white/20 hover:bg-white/[0.05]';

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
    <section id={id} className={`relative isolate overflow-hidden bg-marketing-bg py-20 sm:py-24 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#111213_0%,#16181a_48%,#111213_100%)]" />
      <div className={`pointer-events-none absolute inset-0 ${glowByVariant[variant]}`} />
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
    <span className="text-foreground">
      {children}
    </span>
  );
}

/**
 * A quiet label above a section heading.
 *
 * This used to render a bordered pill in uppercase at 0.18em tracking with
 * an icon — the eyebrow-kicker pattern, repeated above so many headings
 * that the page rhythm became the site's most recognisable feature. It is
 * now a plain line of text: readable when it earns its place, invisible as
 * ornament. The `icon` and `tone` props are accepted and ignored so the
 * dozens of existing call sites keep compiling while they are unwound.
 */
export function SectionEyebrow({
  children,
}: {
  children: ReactNode;
  icon?: LucideIcon;
  tone?: StatusTone;
}) {
  return (
    <p className="text-sm font-medium text-zinc-400">{children}</p>
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

/** `pulse` is accepted and ignored: a pulsing dot on a marketing page
    signals urgency the page cannot back up. */
export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: StatusTone;
  pulse?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusTone[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        tone === 'blocked'
          ? 'bg-red-300'
          : tone === 'warning'
            ? 'bg-amber-300'
            : tone === 'valid'
              ? 'bg-emerald-300'
              : 'bg-zinc-400'
      }`} />
      {children}
    </span>
  );
}

/**
 * A framed panel for a piece of product evidence.
 *
 * The default header was a macOS-style traffic-light row captioned
 * "LIVE SYSTEM / ENFORCING" — window chrome drawn around content that is
 * not a window, which reads as a screenshot of software that does not
 * exist. Callers now pass a real label or none at all.
 */
export function SystemFrame({
  children,
  className = '',
  label = '',
  status = '',
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  status?: string;
}) {
  return (
    <div className={`${systemPanelClass} relative overflow-hidden p-3 ${className}`}>
      <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-black/25">
        {label ? (
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-3">
            <span className="text-sm font-medium text-zinc-300">{label}</span>
            {status ? (
              <span className="text-xs text-zinc-500">{status}</span>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

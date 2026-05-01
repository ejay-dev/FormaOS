'use client';

import Link from 'next/link';
import { useId } from 'react';
import {
  ChevronRight,
  Minus,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
export type TrendDirection = 'up' | 'down' | 'flat';

const tileBg: Record<Tone, string> = {
  blue: 'bg-[hsl(var(--app-primary))]',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500',
};

const tileRing: Record<Tone, string> = {
  blue: 'ring-[hsl(var(--app-primary))]/15',
  emerald: 'ring-emerald-500/15',
  amber: 'ring-amber-500/15',
  rose: 'ring-rose-500/15',
  slate: 'ring-slate-500/15',
};

const directionColor: Record<
  TrendDirection,
  { text: string; stroke: string; icon: LucideIcon }
> = {
  up: {
    text: 'text-emerald-500',
    stroke: 'hsl(142 71% 45%)',
    icon: TrendingUp,
  },
  down: { text: 'text-rose-500', stroke: 'hsl(0 72% 51%)', icon: TrendingDown },
  flat: {
    text: 'text-muted-foreground',
    stroke: 'hsl(var(--app-primary))',
    icon: Minus,
  },
};

const CARD_BASE =
  'rounded-lg border border-border bg-[hsl(var(--card))] transition-all';

const CARD_HOVER =
  'hover:-translate-y-[1px] hover:border-[hsl(var(--app-primary))]/40 hover:shadow-[0_1px_0_rgba(255,255,255,0.04),0_8px_24px_-12px_rgba(0,0,0,0.45)]';

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--app-primary))]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]';

// ---------- Sparkline ----------

interface SparklineProps {
  data: number[];
  direction?: TrendDirection;
  stroke?: string;
  fill?: boolean;
  height?: number;
  className?: string;
  ariaLabel?: string;
}

export function Sparkline({
  data,
  direction = 'flat',
  stroke,
  fill = true,
  height = 40,
  className,
  ariaLabel,
}: SparklineProps) {
  const gradId = useId();

  if (!data || data.length < 2) {
    return (
      <div
        className={cn('w-full', className)}
        style={{ height }}
        aria-hidden
      />
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 120;
  const H = 36;
  const step = W / (data.length - 1);
  const color = stroke ?? directionColor[direction].stroke;

  const coords = data.map((v, i) => ({
    x: i * step,
    y: H - 2 - ((v - min) / range) * (H - 4),
  }));

  const linePath = coords
    .map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');

  const areaPath = `${linePath} L${W.toFixed(2)},${H} L0,${H} Z`;
  const last = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn('w-full overflow-visible', className)}
      style={{ height }}
      role="img"
      aria-label={ariaLabel ?? 'Trend'}
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />
        </>
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={last.x.toFixed(2)}
        cy={last.y.toFixed(2)}
        r={2.25}
        fill={color}
      />
      <circle
        cx={last.x.toFixed(2)}
        cy={last.y.toFixed(2)}
        r={5}
        fill={color}
        opacity={0.15}
      />
    </svg>
  );
}

// ---------- Delta badge ----------

interface DeltaBadgeProps {
  direction: TrendDirection;
  value: string;
  className?: string;
}

export function DeltaBadge({ direction, value, className }: DeltaBadgeProps) {
  const { text, icon: Icon } = directionColor[direction];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
        text,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {value}
    </span>
  );
}

// ---------- StatCardSparkline ----------

interface StatCardSparklineProps {
  label: string;
  value: string | number;
  delta?: { value: string; direction: TrendDirection; context?: string };
  data?: number[];
  href?: string;
  loading?: boolean;
  className?: string;
}

export function StatCardSparkline({
  label,
  value,
  delta,
  data,
  href,
  loading,
  className,
}: StatCardSparklineProps) {
  if (loading) {
    return (
      <div className={cn(CARD_BASE, 'p-4', className)}>
        <div className="h-3 w-20 animate-pulse rounded bg-muted/50" />
        <div className="mt-2 h-7 w-28 animate-pulse rounded bg-muted/50" />
        <div className="mt-3 h-10 w-full animate-pulse rounded bg-muted/30" />
      </div>
    );
  }

  const body = (
    <div
      className={cn(
        CARD_BASE,
        'relative overflow-hidden p-4',
        href && CARD_HOVER,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="col-head truncate">{label}</span>
        {delta && <DeltaBadge direction={delta.direction} value={delta.value} />}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-[26px] font-bold leading-none tabular-nums tracking-tight text-foreground">
          {value}
        </span>
      </div>
      {delta?.context && (
        <div className="mt-1 text-[11px] text-muted-foreground">
          {delta.context}
        </div>
      )}
      {data && data.length > 1 && (
        <div className="mt-3">
          <Sparkline
            data={data}
            direction={delta?.direction ?? 'flat'}
            ariaLabel={`${label} trend`}
          />
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className={cn('block rounded-lg', FOCUS_RING)}>
      {body}
    </Link>
  ) : (
    body
  );
}

// ---------- GaugeCard ----------

interface GaugeCardProps {
  label: string;
  value: number;
  sublabel?: string;
  target?: number;
  footer?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

function gaugeTone(value: number): { stroke: string; text: string } {
  if (value >= 85)
    return { stroke: 'hsl(142 71% 45%)', text: 'text-emerald-500' };
  if (value >= 70)
    return { stroke: 'hsl(38 92% 50%)', text: 'text-amber-500' };
  return { stroke: 'hsl(0 72% 51%)', text: 'text-rose-500' };
}

export function GaugeCard({
  label,
  value,
  sublabel,
  target,
  footer,
  loading,
  className,
}: GaugeCardProps) {
  if (loading) {
    return (
      <div className={cn(CARD_BASE, 'p-4', className)}>
        <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
        <div className="mt-4 h-[140px] w-[140px] animate-pulse rounded-full bg-muted/40" />
      </div>
    );
  }

  const clamped = Math.max(0, Math.min(100, value));
  const r = 58;
  const FULL = 2 * Math.PI * r;
  const ARC = FULL * 0.75; // 270° arc, 90° gap at bottom
  const progress = ARC * (1 - clamped / 100);
  const tone = gaugeTone(clamped);

  const targetTick = (() => {
    if (target == null) return null;
    const t = Math.max(0, Math.min(100, target));
    // Arc spans 270°, starting at 135° (7:30 position) going clockwise to 45° (4:30).
    const angleDeg = 135 + (t / 100) * 270;
    const rad = (angleDeg * Math.PI) / 180;
    const cx = 70 + r * Math.cos(rad);
    const cy = 70 + r * Math.sin(rad);
    return { cx, cy };
  })();

  return (
    <div className={cn(CARD_BASE, 'p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="col-head">{label}</span>
        {sublabel && (
          <span className="text-[11px] font-medium text-muted-foreground">
            {sublabel}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-5">
        <div className="relative h-[140px] w-[140px] shrink-0">
          <svg
            viewBox="0 0 140 140"
            className="h-full w-full"
            aria-hidden
          >
            <g transform="rotate(135 70 70)">
              <circle
                cx={70}
                cy={70}
                r={r}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={10}
                strokeLinecap="round"
                opacity={0.25}
                strokeDasharray={`${ARC} ${FULL}`}
              />
              <circle
                cx={70}
                cy={70}
                r={r}
                fill="none"
                stroke={tone.stroke}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${ARC} ${FULL}`}
                strokeDashoffset={progress}
                style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
              />
            </g>
            {targetTick && (
              <circle
                cx={targetTick.cx}
                cy={targetTick.cy}
                r={2.5}
                fill="hsl(var(--foreground))"
                opacity={0.6}
              />
            )}
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            role="img"
            aria-label={`${label}: ${clamped}%`}
          >
            <span
              className={cn(
                'text-[28px] font-bold leading-none tabular-nums tracking-tight',
                tone.text,
              )}
            >
              {clamped}
              <span className="text-base font-semibold">%</span>
            </span>
            {target != null && (
              <span className="mt-1 text-[10px] text-muted-foreground">
                Target {target}%
              </span>
            )}
          </div>
        </div>
        {footer && <div className="min-w-0 flex-1 text-sm">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- IconTileStat ----------

interface IconTileStatProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  sublabel?: string;
  delta?: { value: string; direction: TrendDirection };
  tone?: Tone;
  href?: string;
  className?: string;
}

export function IconTileStat({
  icon: Icon,
  value,
  label,
  sublabel,
  delta,
  tone = 'blue',
  href,
  className,
}: IconTileStatProps) {
  const body = (
    <div
      className={cn(
        CARD_BASE,
        'flex items-start gap-3 p-4',
        href && CARD_HOVER,
        className,
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white ring-4',
          tileBg[tone],
          tileRing[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="col-head truncate">{label}</div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-xl font-bold tabular-nums leading-tight tracking-tight text-foreground">
            {value}
          </span>
          {delta && (
            <DeltaBadge direction={delta.direction} value={delta.value} />
          )}
        </div>
        {sublabel && (
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className={cn('block rounded-lg', FOCUS_RING)}>
      {body}
    </Link>
  ) : (
    body
  );
}

// ---------- StatTile ----------
// Pure typography-driven stat tile: large number, label, optional caption.
// No icon block, no gradient. Use for hero KPI rows where the number is the point.

const dotByTone: Record<Tone, string> = {
  blue: 'bg-[hsl(var(--app-primary))]',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-400',
};

interface StatTileProps {
  label: string;
  value: string | number;
  caption?: string;
  delta?: { value: string; direction: TrendDirection };
  tone?: Tone;
  href?: string;
  className?: string;
}

export function StatTile({
  label,
  value,
  caption,
  delta,
  tone,
  href,
  className,
}: StatTileProps) {
  const body = (
    <div
      className={cn(
        CARD_BASE,
        'flex flex-col justify-between gap-3 p-4 min-h-[110px]',
        href && CARD_HOVER,
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {tone && (
          <span
            aria-hidden
            className={cn('h-1.5 w-1.5 rounded-full', dotByTone[tone])}
          />
        )}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[32px] font-bold leading-none tabular-nums tracking-tight text-foreground">
          {value}
        </span>
        {delta && (
          <DeltaBadge direction={delta.direction} value={delta.value} />
        )}
      </div>
      {caption && (
        <div className="truncate text-[11px] text-muted-foreground">
          {caption}
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className={cn('block rounded-lg', FOCUS_RING)}>
      {body}
    </Link>
  ) : (
    body
  );
}

// ---------- WelcomeBackHero ----------

interface WelcomeBackHeroProps {
  userEmail?: string;
  organizationName: string;
  summary?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

function greetingFor(now: Date): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function displayName(email?: string): string {
  if (!email) return 'there';
  const local = email.split('@')[0] ?? email;
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  const pretty = cleaned
    .split(' ')
    .filter(Boolean)
    .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ');
  return pretty || 'there';
}

function formatLongDate(now: Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
}

export function WelcomeBackHero({
  userEmail,
  organizationName,
  summary,
  actions,
  className,
}: WelcomeBackHeroProps) {
  const now = new Date();
  const name = displayName(userEmail);
  const greeting = greetingFor(now);
  const dateStr = formatLongDate(now);

  return (
    <div
      className={cn(
        CARD_BASE,
        'relative flex flex-wrap items-center justify-between gap-3 overflow-hidden px-5 py-4',
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-[hsl(var(--app-primary))]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[hsl(var(--app-primary))]/10 to-transparent"
      />
      <div className="relative min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {greeting} · {dateStr}
        </div>
        <div className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          Welcome back, {name}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {organizationName}
          {summary && <span className="mx-1.5 text-border">·</span>}
          {summary && <span className="text-foreground/80">{summary}</span>}
        </div>
      </div>
      {actions && (
        <div className="relative flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

// ---------- PageTitleBar ----------

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageTitleBarProps {
  breadcrumb?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  status?: { label: string; tone: 'success' | 'warning' | 'danger' | 'info' };
  actions?: React.ReactNode;
  className?: string;
}

const statusTone: Record<
  NonNullable<PageTitleBarProps['status']>['tone'],
  string
> = {
  success: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-500 ring-rose-500/20',
  info: 'bg-[hsl(var(--app-primary))]/10 text-[hsl(var(--app-primary))] ring-[hsl(var(--app-primary))]/20',
};

export function PageTitleBar({
  breadcrumb,
  title,
  subtitle,
  status,
  actions,
  className,
}: PageTitleBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3',
        className,
      )}
    >
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {breadcrumb.map((item, idx) => {
              const isLast = idx === breadcrumb.length - 1;
              return (
                <span key={`${item.label}-${idx}`} className="flex items-center gap-1">
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'text-foreground/80' : undefined}>
                      {item.label}
                    </span>
                  )}
                  {!isLast && (
                    <ChevronRight
                      className="h-3 w-3 text-muted-foreground/50"
                      aria-hidden
                    />
                  )}
                </span>
              );
            })}
          </nav>
        )}
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {status && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                statusTone[status.tone],
              )}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-current"
              />
              {status.label}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

import { type CSSProperties, type ElementType, type ReactNode } from 'react';
import Link from 'next/link';
import './dossier.css';

/**
 * Dossier primitives — the pricing page rendered as a stamped, watermarked
 * commercial dossier rather than a webpage. Each section is a "folio" with
 * a file-folder tab, a ghosted watermark behind the content, and stamps /
 * seals / typewriter labels as functional ornament.
 */

/* ── Canvas + containers ─────────────────────────────────────── */

export function DsCanvas({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`ds-page ${className}`} data-ds-canvas="true">
      {children}
    </div>
  );
}

export function DsContainer({
  children,
  width = 'wide',
  className = '',
}: {
  children: ReactNode;
  width?: 'narrow' | 'wide' | 'full';
  className?: string;
}) {
  return (
    <div className={`ds-container ds-container--${width} ${className}`}>
      {children}
    </div>
  );
}

/* ── Folio (a section card on the dossier paper) ─────────────── */

export function DsFolio({
  id,
  tabTone = 'paper',
  tabLabel,
  tight = false,
  watermark,
  watermarkVariant = 'serif',
  className = '',
  children,
}: {
  id?: string;
  tabTone?: 'paper' | 'wax' | 'blue';
  tabLabel?: string;
  tight?: boolean;
  watermark?: string;
  watermarkVariant?: 'serif' | 'type';
  className?: string;
  children: ReactNode;
}) {
  const tabCls =
    tabTone === 'wax'
      ? 'ds-tab ds-tab--wax'
      : tabTone === 'blue'
        ? 'ds-tab ds-tab--blue'
        : 'ds-tab';
  return (
    <section
      id={id}
      className={`ds-folio ${tight ? 'ds-folio--tight' : ''} ${className}`}
    >
      {tabLabel ? <div className={tabCls}>{tabLabel}</div> : null}
      {watermark ? (
        <div
          aria-hidden="true"
          className={`ds-watermark ${watermarkVariant === 'type' ? 'ds-watermark--type' : ''}`}
          style={
            {
              right: '-1rem',
              bottom: '-2rem',
              transform: 'rotate(-2deg)',
            } as CSSProperties
          }
        >
          {watermark}
        </div>
      ) : null}
      <div className="relative">{children}</div>
    </section>
  );
}

/* ── Folio masthead (title block at top of folio) ───────────── */

export function DsFolioHead({
  meta,
  serial,
  strong = false,
  children,
}: {
  meta?: ReactNode;
  serial?: string;
  strong?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`ds-folio__head ${strong ? 'ds-folio__head--strong' : ''}`}>
      <div className="flex flex-wrap items-baseline gap-4">
        {meta ? <span className="ds-meta">{meta}</span> : null}
        {children}
      </div>
      {serial ? (
        <span className="ds-meta">
          <strong>SER.</strong> {serial}
        </span>
      ) : null}
    </div>
  );
}

/* ── Typography ──────────────────────────────────────────────── */

export function DsDisplay({
  as = 'h2',
  size = 'lg',
  className = '',
  children,
}: {
  as?: ElementType;
  size?: 'xl' | 'lg' | 'md';
  className?: string;
  children: ReactNode;
}) {
  const Tag = as;
  return (
    <Tag className={`ds-display ds-display--${size} ${className}`}>
      {children}
    </Tag>
  );
}

export function DsLead({
  dropCap = false,
  className = '',
  children,
}: {
  dropCap?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={`ds-lead ${dropCap ? 'ds-dropcap' : ''} ${className}`}>
      {children}
    </p>
  );
}

export function DsBody({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`ds-body ${className}`}>{children}</div>;
}

export function DsCaption({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <p className={`ds-caption ${className}`}>{children}</p>;
}

export function DsMeta({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <span className={`ds-meta ${className}`}>{children}</span>;
}

/* ── Stamps ──────────────────────────────────────────────────── */

export function DsStamp({
  tone = 'red',
  size = 'sm',
  rotation = 'left',
  className = '',
  children,
}: {
  tone?: 'red' | 'blue' | 'green' | 'ink';
  size?: 'sm' | 'lg' | 'xl';
  rotation?: 'left' | 'right' | 'flat';
  className?: string;
  children: ReactNode;
}) {
  const cls = [
    'ds-stamp',
    `ds-stamp--${tone}`,
    size === 'lg' ? 'ds-stamp--lg' : size === 'xl' ? 'ds-stamp--xl' : '',
    rotation === 'right'
      ? 'ds-stamp--right'
      : rotation === 'flat'
        ? 'ds-stamp--flat'
        : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <span className={cls}>{children}</span>;
}

/* ── Wax seal ────────────────────────────────────────────────── */

export function DsSeal({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`ds-seal ${className}`} style={style}>
      <span>{children}</span>
    </span>
  );
}

/* ── Redacted text ───────────────────────────────────────────── */

export function DsRedacted({ width = '6em' }: { width?: string }) {
  return (
    <span
      className="ds-redacted"
      style={{ width, minWidth: width, display: 'inline-block' } as CSSProperties}
      aria-label="Redacted"
    >
      &nbsp;
    </span>
  );
}

/* ── Perforated rule ─────────────────────────────────────────── */

export function DsPerf({
  strong = false,
  className = '',
}: {
  strong?: boolean;
  className?: string;
}) {
  return <hr className={`ds-perf ${strong ? 'ds-perf--strong' : ''} ${className}`} />;
}

/* ── Form field ──────────────────────────────────────────────── */

export function DsField({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`ds-field ${className}`}>
      <span className="ds-field__label">{label}</span>
      <span className="ds-field__value">{children}</span>
    </div>
  );
}

/* ── Plan card ──────────────────────────────────────────────── */

export function DsPlan({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <article className={`ds-plan ${className}`}>{children}</article>;
}

/* ── Button ──────────────────────────────────────────────────── */

export function DsButton({
  href,
  variant = 'outline',
  className = '',
  onClick,
  testId,
  children,
}: {
  href: string;
  variant?: 'outline' | 'solid' | 'wax';
  className?: string;
  onClick?: () => void;
  testId?: string;
  children: ReactNode;
}) {
  const cls =
    variant === 'solid'
      ? 'ds-btn ds-btn--solid'
      : variant === 'wax'
        ? 'ds-btn ds-btn--wax'
        : 'ds-btn';
  return (
    <Link
      href={href}
      onClick={onClick}
      data-testid={testId}
      className={`${cls} ${className}`}
    >
      {children}
    </Link>
  );
}

/* ── Signature block ─────────────────────────────────────────── */

export function DsSignature({
  who,
  on,
  seal,
}: {
  who: string;
  on: string;
  seal?: ReactNode;
}) {
  return (
    <div className="ds-sig">
      <div>
        <div className="ds-sig__line">SIGNED</div>
        <div className="mt-2 font-serif text-[1.5rem] italic text-[var(--ds-ink)]">
          {who}
        </div>
        <div className="mt-1 ds-meta">{on}</div>
      </div>
      {seal ? <div>{seal}</div> : null}
    </div>
  );
}

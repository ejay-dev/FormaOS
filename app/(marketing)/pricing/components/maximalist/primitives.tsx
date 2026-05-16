import { type CSSProperties, type ElementType, type ReactNode } from 'react';
import Link from 'next/link';
import './maximalist.css';

/**
 * Maximalist primitives — Pentagram-tier art-directed building blocks.
 *
 * Every block can claim its own colour mood (cream / oxblood / mustard /
 * forest / midnight / ink). Typography defaults to Fraunces display with
 * variable-axis settings for character. Imagery is duotone-treated. CTAs
 * are hard-edged with offset-shadow hover. Scoped under `.mx-page`.
 */

type BlockTone =
  | 'cream'
  | 'bone'
  | 'oxblood'
  | 'mustard'
  | 'forest'
  | 'midnight'
  | 'ink';

/* ── Canvas + container ──────────────────────────────────────── */

export function MxCanvas({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-page ${className}`} data-mx-canvas="true">
      {children}
    </div>
  );
}

export function MxContainer({
  children,
  width = 'wide',
  className = '',
}: {
  children: ReactNode;
  width?: 'narrow' | 'wide' | 'full';
  className?: string;
}) {
  return (
    <div className={`mx-container mx-container--${width} ${className}`}>
      {children}
    </div>
  );
}

/* ── Block (full-bleed coloured panel) ───────────────────────── */

export function MxBlock({
  id,
  tone,
  tight = false,
  flushTop = false,
  flushBottom = false,
  rail,
  className = '',
  children,
}: {
  id?: string;
  tone: BlockTone;
  tight?: boolean;
  flushTop?: boolean;
  flushBottom?: boolean;
  rail?: string;
  className?: string;
  children: ReactNode;
}) {
  const cls = [
    'mx-block',
    `mx-block--${tone}`,
    tight ? 'mx-block--tight' : '',
    flushTop ? 'mx-block--flush-top' : '',
    flushBottom ? 'mx-block--flush-bottom' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <section id={id} className={cls}>
      {rail ? (
        <span
          className="mx-rail pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none opacity-60 sm:left-5"
          aria-hidden="true"
        >
          {rail}
        </span>
      ) : null}
      {children}
    </section>
  );
}

/* ── Display headline ─────────────────────────────────────────── */

export function MxDisplay({
  as = 'h2',
  size = 'lg',
  className = '',
  children,
}: {
  as?: ElementType;
  size?: 'xxl' | 'xl' | 'lg' | 'md';
  className?: string;
  children: ReactNode;
}) {
  const Tag = as;
  return (
    <Tag className={`mx-display mx-display--${size} ${className}`}>
      {children}
    </Tag>
  );
}

/* ── Outlined display text (e.g. hero "infrastructure" word) ── */

export function MxOutline({
  thick = false,
  className = '',
  children,
}: {
  thick?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`mx-outline ${thick ? 'mx-outline--thick' : ''} ${className}`}>
      {children}
    </span>
  );
}

/* ── Lead, body, caption ─────────────────────────────────────── */

export function MxLead({
  dropCap = false,
  className = '',
  children,
}: {
  dropCap?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={`mx-lead ${dropCap ? 'mx-dropcap' : ''} ${className}`}>
      {children}
    </p>
  );
}

export function MxBody({
  variant = 'sans',
  className = '',
  children,
}: {
  variant?: 'sans' | 'serif';
  className?: string;
  children: ReactNode;
}) {
  const cls = variant === 'serif' ? 'mx-body-serif' : 'mx-body';
  return <div className={`${cls} ${className}`}>{children}</div>;
}

export function MxCaption({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <p className={`mx-caption ${className}`}>{children}</p>;
}

/* ── Eyebrow (mono caps) / Eyebrow italic (serif) ────────────── */

export function MxEyebrow({
  italic = false,
  className = '',
  children,
}: {
  italic?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={`${italic ? 'mx-eyebrow-italic' : 'mx-eyebrow'} ${className}`}>
      {children}
    </p>
  );
}

/* ── Section number glyph ─────────────────────────────────────── */

export function MxSectionNum({
  num,
  label,
  className = '',
}: {
  num: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline gap-5 ${className}`}>
      <span className="mx-section-num leading-none">§{num}</span>
      {label ? (
        <span className="mx-eyebrow opacity-70">{label}</span>
      ) : null}
    </div>
  );
}

/* ── Pull quote ───────────────────────────────────────────────── */

export function MxPullQuote({
  attribution,
  className = '',
  children,
}: {
  attribution?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <blockquote className={`mx-pullquote ${className}`}>
      <span>“{children}”</span>
      {attribution ? <cite>— {attribution}</cite> : null}
    </blockquote>
  );
}

/* ── Rule ─────────────────────────────────────────────────────── */

export function MxRule({
  bold = false,
  thick = false,
  double = false,
  className = '',
}: {
  bold?: boolean;
  thick?: boolean;
  double?: boolean;
  className?: string;
}) {
  const cls = double
    ? 'mx-rule--double'
    : thick
      ? 'mx-rule mx-rule--thick'
      : bold
        ? 'mx-rule mx-rule--bold'
        : 'mx-rule';
  return <hr className={cls + ' ' + className} />;
}

/* ── Sticker (rotated badge — for "Most popular" etc.) ───────── */

export function MxSticker({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <span className={`mx-sticker ${className}`}>{children}</span>;
}

/* ── Scope bar (inline visualisation) ────────────────────────── */

export function MxScopeBar({
  filled,
  total = 5,
  className = '',
}: {
  filled: number;
  total?: number;
  className?: string;
}) {
  return (
    <span className={`mx-bar ${className}`} aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={i < filled ? 'is-on' : ''} />
      ))}
    </span>
  );
}

/* ── Duotone figure ───────────────────────────────────────────── */

export function MxDuotone({
  src,
  alt,
  tone = 'oxblood',
  aspect = '16 / 9',
  className = '',
  priority = false,
}: {
  src: string;
  alt: string;
  tone?: 'oxblood' | 'mustard' | 'forest' | 'cream' | 'midnight';
  aspect?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`mx-duotone mx-duotone--${tone} ${className}`}
      style={{ aspectRatio: aspect } as CSSProperties}
      aria-hidden={alt === ''}
    >
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
      />
    </span>
  );
}

/* ── Button ───────────────────────────────────────────────────── */

type MxButtonProps = {
  href: string;
  variant?: 'outline' | 'solid' | 'solid-cream' | 'accent';
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  testId?: string;
};

export function MxButton({
  href,
  variant = 'outline',
  children,
  className = '',
  onClick,
  testId,
}: MxButtonProps) {
  const cls =
    variant === 'solid'
      ? 'mx-btn mx-btn--solid'
      : variant === 'solid-cream'
        ? 'mx-btn mx-btn--solid-cream'
        : variant === 'accent'
          ? 'mx-btn mx-btn--accent'
          : 'mx-btn';
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

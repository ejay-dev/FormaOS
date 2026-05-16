import { type ReactNode, type ElementType, type CSSProperties } from 'react';
import Link from 'next/link';
import './editorial.css';

/**
 * Editorial primitives — a small, scoped vocabulary used to build the
 * pricing page in a printed-paper / FT/NYT editorial register.
 *
 * Everything is scoped under `.editorial-page` (applied by EditorialCanvas).
 * No shared marketing primitive is touched; nothing here leaks elsewhere.
 */

/* ── Canvas ────────────────────────────────────────────────────── */

export function EditorialCanvas({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`editorial-page ${className}`} data-editorial-canvas="true">
      {children}
    </div>
  );
}

/* ── Container — max content width inside canvas ──────────────── */

export function EditorialContainer({
  children,
  width = 'narrow',
  className = '',
}: {
  children: ReactNode;
  width?: 'narrow' | 'wide' | 'full';
  className?: string;
}) {
  const widthClass =
    width === 'narrow'
      ? 'max-w-3xl'
      : width === 'wide'
        ? 'max-w-6xl'
        : 'max-w-7xl';
  return (
    <div className={`mx-auto ${widthClass} px-6 sm:px-8 lg:px-10 ${className}`}>
      {children}
    </div>
  );
}

/* ── Masthead ──────────────────────────────────────────────────── */

export function EditorialMasthead({
  edition,
  category = 'Pricing',
}: {
  edition: string;
  category?: string;
}) {
  return (
    <div className="ed-masthead">
      <EditorialContainer width="wide">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="ed-masthead__nameplate">
            FormaOS<span className="opacity-50"> · </span>
            <span className="not-italic font-normal tracking-wide">
              {category}
            </span>
          </p>
          <p className="ed-masthead__edition">{edition}</p>
        </div>
      </EditorialContainer>
    </div>
  );
}

/* ── Section with optional numbering ──────────────────────────── */

export function EditorialSection({
  id,
  num,
  label,
  width = 'wide',
  tight = false,
  className = '',
  children,
}: {
  id?: string;
  num?: string;
  label?: string;
  width?: 'narrow' | 'wide' | 'full';
  tight?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`ed-section ${tight ? 'ed-section--tight' : ''} ${className}`}
    >
      <EditorialContainer width={width}>
        {num || label ? (
          <div className="ed-section__num">
            {num ? (
              <span className="ed-section__num-fig">§ {num}</span>
            ) : null}
            {label ? (
              <span className="ed-section__num-label">{label}</span>
            ) : null}
          </div>
        ) : null}
        {children}
      </EditorialContainer>
    </section>
  );
}

/* ── Headline ──────────────────────────────────────────────────── */

export function EditorialHeadline({
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
    <Tag className={`ed-display ed-display--${size} ${className}`}>
      {children}
    </Tag>
  );
}

/* ── Lead paragraph (optionally drop-capped) ──────────────────── */

export function EditorialLead({
  dropCap = false,
  className = '',
  children,
}: {
  dropCap?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={`ed-lead ${dropCap ? 'ed-dropcap' : ''} ${className}`}>
      {children}
    </p>
  );
}

/* ── Body paragraph(s) ────────────────────────────────────────── */

export function EditorialBody({
  variant = 'sans',
  className = '',
  children,
}: {
  variant?: 'sans' | 'serif';
  className?: string;
  children: ReactNode;
}) {
  const cls = variant === 'serif' ? 'ed-body-serif' : 'ed-body';
  return <div className={`${cls} ${className}`}>{children}</div>;
}

/* ── Caption / dateline ───────────────────────────────────────── */

export function EditorialCaption({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <p className={`ed-caption ${className}`}>{children}</p>;
}

/* ── Pull quote ───────────────────────────────────────────────── */

export function EditorialPullQuote({
  attribution,
  children,
  className = '',
}: {
  attribution?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <blockquote className={`ed-pullquote ${className}`}>
      <span>“{children}”</span>
      {attribution ? (
        <cite className="ed-pullquote__attr not-italic">— {attribution}</cite>
      ) : null}
    </blockquote>
  );
}

/* ── Figure ───────────────────────────────────────────────────── */

export function EditorialFigure({
  src,
  alt,
  label,
  caption,
  aspect = '16 / 9',
  className = '',
  priority = false,
}: {
  src: string;
  alt: string;
  label?: string;
  caption?: string;
  aspect?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure className={`ed-figure ${className}`}>
      <div
        className="overflow-hidden bg-[var(--ed-paper-2)]"
        style={{ aspectRatio: aspect } as CSSProperties}
      >
        {/* Plain <img> rather than next/image — keeps SSR static and matches
            the existing PricingHero pattern. */}
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
      {label || caption ? (
        <figcaption className="ed-figure__cap">
          {label ? <strong>Fig. {label}</strong> : null}
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/* ── Marginalia (gutter notes) ────────────────────────────────── */

export function EditorialMarginalia({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside className={`ed-marginalia ${className}`} role="note">
      {children}
    </aside>
  );
}

/* ── Footnote list ────────────────────────────────────────────── */

export function EditorialFootnotes({
  items,
  className = '',
}: {
  items: ReactNode[];
  className?: string;
}) {
  return (
    <ol className={`ed-footnote space-y-1.5 ${className}`}>
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-2">
          <span className="font-semibold text-[var(--ed-ink)]">
            {idx + 1}.
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

/* ── Buttons ──────────────────────────────────────────────────── */

type EditorialButtonProps = {
  href: string;
  children: ReactNode;
  variant?: 'solid' | 'ghost' | 'accent';
  className?: string;
  onClick?: () => void;
  testId?: string;
};

export function EditorialButton({
  href,
  children,
  variant = 'solid',
  className = '',
  onClick,
  testId,
}: EditorialButtonProps) {
  const cls =
    variant === 'ghost'
      ? 'ed-btn ed-btn--ghost'
      : variant === 'accent'
        ? 'ed-btn ed-btn--accent'
        : 'ed-btn';
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

/* ── Rule ─────────────────────────────────────────────────────── */

export function EditorialRule({
  strong = false,
  double = false,
  className = '',
}: {
  strong?: boolean;
  double?: boolean;
  className?: string;
}) {
  const cls = double
    ? 'ed-rule--double'
    : strong
      ? 'ed-rule ed-rule--strong'
      : 'ed-rule';
  return <hr className={`${cls} ${className}`} />;
}

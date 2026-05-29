import { brand } from '@/config/brand';
import { FoMonogram } from '@/components/brand/FoMonogram';
import { FoWordmark } from '@/components/brand/FoWordmark';

type LogoVariant = 'full' | 'mark' | 'wordmark';

interface LogoProps {
  /** Which variant to render */
  variant?: LogoVariant;
  /** mark: square size in px. wordmark/full: rendered HEIGHT in px (width auto). */
  size?: number;
  /** Additional CSS classes (applied to the wrapper) */
  className?: string;
  /** Override the default alt/title text */
  alt?: string;
  /** Include the "COMPLIANCE, SIMPLIFIED" tagline (wordmark/full). Implied for "full". */
  withTagline?: boolean;
  /* ---- deprecated, retained for API compatibility (no-ops) ---- */
  /** @deprecated wordmark inherits color via currentColor */
  darkBackground?: boolean;
  /** @deprecated the wordmark variant is the text lockup */
  showText?: boolean;
  /** @deprecated */
  textClassName?: string;
  /** @deprecated mark is static */
  animated?: boolean;
}

/**
 * Unified FormaOS logo.
 *
 * The mark inherits color via `currentColor`, so it renders charcoal on light
 * surfaces and white on dark ones — set `text-*` on the wrapper to override.
 *
 * Usage:
 *   <Logo />                              — "FO" monogram (square, default 36px)
 *   <Logo variant="mark" size={28} />     — monogram at 28px
 *   <Logo variant="wordmark" size={28} /> — FORMAOS lockup, 28px tall
 *   <Logo variant="full" size={64} />     — FORMAOS lockup + tagline
 */
export function Logo({
  variant = 'mark',
  size = 36,
  className = '',
  alt,
  withTagline,
}: LogoProps) {
  const altText = alt ?? brand.appName;

  if (variant === 'mark') {
    return (
      <span
        className={`inline-flex text-foreground select-none ${className}`}
        style={{ width: size, height: size }}
      >
        <FoMonogram title={altText} className="h-full w-full shrink-0" />
      </span>
    );
  }

  const showTagline = withTagline ?? variant === 'full';
  return (
    <span
      className={`inline-flex items-center text-foreground select-none ${className}`}
      style={{ height: size }}
    >
      <FoWordmark
        title={altText}
        withTagline={showTagline}
        className="h-full w-auto shrink-0"
      />
    </span>
  );
}

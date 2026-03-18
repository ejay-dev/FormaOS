import { brand } from '@/config/brand';
import { FoShieldMark } from '@/components/brand/FoShieldMark';

type LogoVariant = 'full' | 'mark' | 'wordmark';

interface LogoProps {
  /** Which variant to render */
  variant?: LogoVariant;
  /** Shield size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Override the default alt text */
  alt?: string;
  /** Controls accent tint when optional text is shown. Default: true */
  darkBackground?: boolean;
  /** Show app name text next to the mark (opt-in only) */
  showText?: boolean;
  /** Text size class override */
  textClassName?: string;
  /** Enable subtle mark animation */
  animated?: boolean;
}

/**
 * Unified FormaOS logo component.
 * Shield-only by default to enforce monogram consistency across app + marketing.
 *
 * Usage:
 *   <Logo />                           — FO shield mark (animated)
 *   <Logo variant="mark" size={40} />  — Icon only
 *   <Logo variant="full" showText />   — Optional legacy text lockup
 */
export function Logo({
  variant = 'mark',
  size = 36,
  className = '',
  alt,
  darkBackground = true, // retained for API compatibility
  showText = false,
  textClassName = '',
  animated = true,
}: LogoProps) {
  const altText = alt ?? brand.appName;
  const motionEnabled = animated && size >= 24;
  const renderMark = () => (
    <FoShieldMark
      size={size}
      title={altText}
      animated={motionEnabled}
      className="select-none shrink-0"
    />
  );

  /* ---- Mark only (default) ---- */
  if (variant === 'mark') {
    return <span className={`inline-flex select-none ${className}`}>{renderMark()}</span>;
  }

  /* ---- Legacy wordmark variant now resolves to shield-only ---- */
  if (variant === 'wordmark') {
    return (
      <span className={`inline-flex items-center select-none ${className}`}>
        {renderMark()}
      </span>
    );
  }

  /* ---- Full variant: mark-only unless text is explicitly requested ---- */
  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`}>
      {renderMark()}
      {showText && (
        <span
          className={textClassName || 'text-lg font-semibold tracking-tight'}
        >
          Forma
          <span className={darkBackground ? 'text-primary' : 'text-secondary'}>
            OS
          </span>
        </span>
      )}
    </span>
  );
}

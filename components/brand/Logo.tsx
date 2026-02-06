'use client';

import Image from 'next/image';
import { brand } from '@/config/brand';

type LogoVariant = 'full' | 'mark' | 'wordmark';

interface LogoProps {
  /** Which variant to render */
  variant?: LogoVariant;
  /** Size in pixels (applies to the mark; wordmark scales proportionally) */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Override the default alt text */
  alt?: string;
  /** Use light wordmark (for dark backgrounds). Default: true */
  darkBackground?: boolean;
  /** Show the app name text next to the mark (only for variant="full") */
  showText?: boolean;
  /** Text size class override */
  textClassName?: string;
}

/**
 * Unified FormaOS logo component.
 * Single source of truth for brand rendering across the entire app.
 *
 * @example
 * <Logo />                           // Full logo: mark + "FormaOS" text
 * <Logo variant="mark" size={40} />  // Icon only
 * <Logo variant="wordmark" />        // SVG wordmark (mark + text baked in)
 */
export function Logo({
  variant = 'full',
  size = 32,
  className = '',
  alt,
  darkBackground = true,
  showText = true,
  textClassName = '',
}: LogoProps) {
  const altText = alt ?? brand.appName;

  // Mark only — icon/symbol
  if (variant === 'mark') {
    return (
      <Image
        src={brand.logo.mark}
        alt={altText}
        width={size}
        height={size}
        className={`rounded-lg select-none ${className}`}
        priority
      />
    );
  }

  // Wordmark — SVG with mark + text baked in
  if (variant === 'wordmark') {
    const src = darkBackground
      ? brand.logo.wordmarkDark
      : brand.logo.wordmarkLight;
    // Wordmark SVG is 320×64, so width = size * 5
    return (
      <Image
        src={src}
        alt={altText}
        width={size * 5}
        height={size}
        className={`select-none ${className}`}
        priority
      />
    );
  }

  // Full — mark image + text span (default)
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src={brand.logo.mark}
        alt={altText}
        width={size}
        height={size}
        className="rounded-lg select-none"
        priority
      />
      {showText && (
        <span className={textClassName || 'text-lg font-bold tracking-tight'}>
          {brand.appName}
        </span>
      )}
    </span>
  );
}

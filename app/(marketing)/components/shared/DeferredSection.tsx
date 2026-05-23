import type { CSSProperties, ReactNode } from 'react';

interface DeferredSectionProps {
  children: ReactNode;
  className?: string;
  /** Reserve intrinsic size to keep CLS low while content paints lazily. */
  minHeight?: number;
  /** Retained for backwards compatibility — no longer used. */
  rootMargin?: string;
  /** Retained for backwards compatibility — no longer used. */
  fallback?: ReactNode;
}

export function DeferredSection({
  children,
  className,
  minHeight = 0,
}: DeferredSectionProps) {
  const deferredStyle: CSSProperties = {
    minHeight: minHeight > 0 ? minHeight : undefined,
    contentVisibility: 'auto',
    contain: 'layout style',
    containIntrinsicSize: minHeight > 0 ? `${Math.round(minHeight)}px` : '460px',
    overflow: 'visible',
  };

  return (
    <div
      className={['mk-deferred-section', className].filter(Boolean).join(' ')}
      style={deferredStyle}
    >
      {children}
    </div>
  );
}

export default DeferredSection;

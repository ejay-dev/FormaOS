import type { CSSProperties, ReactNode } from 'react';

/**
 * Layout passthrough. The brutalist hero/manifesto read best instant (no
 * fade-in), and entrance motion was hiding content when the Intersection
 * observer raced on above-the-fold mount. The page's real motion lives in
 * the self-contained islands (ledger count-up, schematic draw-on-scroll).
 * Kept as a named wrapper so call sites stay declarative and we can
 * reintroduce a robust reveal later in one place.
 */
export function Reveal({
  children,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

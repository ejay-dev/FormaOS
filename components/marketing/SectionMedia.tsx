interface SectionMediaProps {
  /** Path under /public, e.g. "/marketing-media/home.jpg" */
  src: string;
  /** CSS object-position for the crop. Default "50% 50%". */
  objectPosition?: string;
  /** Image opacity (0–1). Default 0.22 — subtle behind content. */
  opacity?: number;
  /** Extra classes on the wrapper. */
  className?: string;
}

/**
 * Desaturated photographic backdrop for marketing body sections.
 *
 * Mirrors the hero treatment (low-opacity photo under dark gradient veils) but
 * renders the image grayscale so varied photography stays on-brand monochrome.
 * Sits at -z-10 inside an `isolate` section so it paints above the section's own
 * background but below all content — no per-section z-index rewiring needed.
 */
export function SectionMedia({
  src,
  objectPosition = '50% 50%',
  opacity = 0.22,
  className = '',
}: SectionMediaProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover grayscale"
        style={{ objectPosition, opacity }}
      />
      {/* Legibility veils — keep text crisp, deepen the monochrome */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_75%_at_50%_50%,transparent_35%,rgba(3,7,18,0.7)_100%)]" />
    </div>
  );
}

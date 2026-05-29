type Scrim = 'center' | 'left' | 'right' | 'bottom';

interface SectionMediaProps {
  /** Path under /public, e.g. "/marketing-media/home.jpg" */
  src: string;
  /** CSS object-position for the crop. Default "50% 50%". */
  objectPosition?: string;
  /**
   * How present the photo reads (0–1). Default 0.82 — cinematic.
   * The scrim handles legibility, so this can stay high.
   */
  opacity?: number;
  /** Where the legibility scrim concentrates its darkness. Default "center". */
  scrim?: Scrim;
  /** Extra classes on the wrapper. */
  className?: string;
}

/**
 * Cinematic charcoal-duotone backdrop for marketing body sections.
 *
 * The photo is rendered at high presence and mapped to a charcoal→slate
 * duotone using stacked CSS blend layers (lighten floor + darken ceiling),
 * so any source photography reads as deliberate, on-brand monochrome rather
 * than washed-out greyscale. A directional/centre-weighted scrim keeps text
 * crisp while letting the image breathe toward the edges.
 *
 * Sits at -z-10 inside an `isolate` section so it paints above the section's
 * own background but below all content — no per-section z-index rewiring.
 */

const SCRIM: Record<Scrim, string> = {
  // Dark in the centre column (behind centred headlines), photo revealed at
  // both flanks.
  center:
    'bg-[radial-gradient(ellipse_78%_70%_at_50%_50%,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.62)_52%,rgba(2,6,23,0.28)_100%)]',
  // Dark on the left (left-aligned copy), photo revealed toward the right.
  left: 'bg-gradient-to-r from-slate-950/95 via-slate-950/68 to-slate-950/20',
  // Mirror of left.
  right: 'bg-gradient-to-l from-slate-950/95 via-slate-950/68 to-slate-950/20',
  // Dark at the foot, photo revealed up top.
  bottom: 'bg-gradient-to-t from-slate-950/95 via-slate-950/52 to-slate-950/15',
};

export function SectionMedia({
  src,
  objectPosition = '50% 50%',
  opacity = 0.82,
  scrim = 'center',
  className = '',
}: SectionMediaProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
    >
      {/* Charcoal-duotone group — isolated so the blend modes don't leak onto
          the page behind the section. */}
      <div className="absolute inset-0 isolate" style={{ opacity }}>
        <img
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover grayscale contrast-[1.18] brightness-[1.05]"
          style={{ objectPosition }}
        />
        {/* Shadow floor → charcoal (#1C1E1F brand ink). */}
        <div className="absolute inset-0 bg-[#181a1c] mix-blend-lighten" />
        {/* Highlight ceiling → soft cool slate (keeps it muted, never blown out). */}
        <div className="absolute inset-0 bg-[#c6cedb] mix-blend-darken" />
        {/* Cool ink wash across the midtones for depth. */}
        <div className="absolute inset-0 bg-[#0b1220] opacity-50 mix-blend-soft-light" />
      </div>

      {/* Legibility scrim — keeps copy crisp, directional per `scrim`. */}
      <div className={`absolute inset-0 ${SCRIM[scrim]}`} />
      {/* Grounding: subtle top seam + heavier floor so the band reads as one piece. */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-transparent to-slate-950/85" />
    </div>
  );
}

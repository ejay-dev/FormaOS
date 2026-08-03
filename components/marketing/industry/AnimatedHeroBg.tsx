'use client';

export interface AnimatedHeroBgProps {
  /** Named light temperature: 'neutral' | 'cool' | 'warm'. */
  accent?: string;
}

/* Accent names are kept for the pages that already pass them; the ramps are
   neutral greys so the hero reads as one lit charcoal surface. */
const accentMap: Record<string, string> = {
  neutral: 'rgba(113,113,122,0.08)',
  cool: 'rgba(148,163,184,0.07)',
  warm: 'rgba(168,162,158,0.07)',
  'cyan-blue': 'rgba(113,113,122,0.08)',
  'cyan-violet': 'rgba(113,113,122,0.08)',
  'violet-cyan': 'rgba(113,113,122,0.08)',
  'emerald-cyan': 'rgba(148,163,184,0.08)',
  'amber-orange': 'rgba(168,162,158,0.08)',
};

export function AnimatedHeroBg({ accent = 'neutral' }: AnimatedHeroBgProps) {
  const light = accentMap[accent] ?? accentMap.neutral;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-marketing-bg">
      {/* One overhead light source, not a field of blobs. */}
      <div
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1400px] h-[700px] rounded-full"
        style={{
          background: `radial-gradient(ellipse at center, ${light} 0%, transparent 65%)`,
        }}
      />

      {/* Grain texture */}
      <div
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

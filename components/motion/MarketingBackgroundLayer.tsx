'use client';

import { memo } from 'react';

/**
 * MarketingBackgroundLayer
 * ─────────────────────────
 * Shared fixed-position background for ALL marketing pages.
 * Provides: depth gradient · dot-grid · film grain · vignette · radial bloom.
 * Placed once in the marketing layout — no per-page duplication.
 */
function MarketingBackgroundLayerInner() {
  return (
    <div
      aria-hidden
      className="mk-bg-layer pointer-events-none fixed inset-0 z-0"
    >
      {/* Vertical depth gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1421]/30 to-transparent" />

      {/* Dot-grid pattern (product-page consistency) */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radial bloom — soft center light */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(6,182,212,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Film grain (CSS noise) */}
      <div className="mk-grain absolute inset-0" />

      {/* Vignette — edge darkening */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)',
        }}
      />
    </div>
  );
}

export const MarketingBackgroundLayer = memo(MarketingBackgroundLayerInner);
export default MarketingBackgroundLayer;

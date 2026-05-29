'use client';

import { ProductScrollHero } from '@/app/(marketing)/product/components/ProductScrollHero';
import { SectionMedia } from '@/components/marketing/SectionMedia';

/**
 * ProductHeroSection
 * ──────────────────
 * Critical above-the-fold hero for /product.
 * Kept in its own module so it does not pull interactive demo code.
 */
export function ProductHeroSection() {
  return (
    <div className="relative isolate overflow-hidden">
      <SectionMedia
        src="/marketing-media/product.jpg"
        objectPosition="50% 35%"
        opacity={0.22}
      />
      <ProductScrollHero />
    </div>
  );
}

export { ProductHeroSection as ProductHero };
export { ProductHeroSection as ProductHeroAnimation };

export default ProductHeroSection;

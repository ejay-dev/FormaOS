'use client';

import { ProductScrollHero } from '@/app/(marketing)/product/components/ProductScrollHero';

/**
 * ProductHeroSection
 * ──────────────────
 * Critical above-the-fold hero for /product.
 * Kept in its own module so it does not pull interactive demo code.
 */
export function ProductHeroSection() {
  return <ProductScrollHero />;
}

export { ProductHeroSection as ProductHero };
export { ProductHeroSection as ProductHeroAnimation };

export default ProductHeroSection;

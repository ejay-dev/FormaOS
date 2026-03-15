'use client';

import { memo, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { selectMarketingRouteMedia } from '@/lib/marketing/background-media';

function MarketingRouteBackdropInner() {
  const pathname = usePathname();
  const activeMedia = selectMarketingRouteMedia(pathname);
  const [heroTarget, setHeroTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const nextTarget = document.querySelector<HTMLElement>(
      '#main-content .mk-hero, #main-content section',
    );
    setHeroTarget(nextTarget);
  }, [pathname]);

  if (!activeMedia) return null;

  const overlay = (
    <div
      aria-hidden
      data-route-media={activeMedia.id}
      className={
        heroTarget
          ? 'mk-route-photo-shell mk-route-photo-shell--hero absolute inset-0 z-0'
          : 'mk-route-photo-shell mk-route-photo-shell--page absolute inset-x-0 top-0 z-0'
      }
    >
      <img
        key={activeMedia.imageSrc}
        src={activeMedia.imageSrc}
        alt=""
        className="mk-route-photo-image"
        decoding="async"
        fetchPriority="high"
        style={{ objectPosition: activeMedia.imagePosition }}
      />
      <div className="mk-route-photo-scrim absolute inset-0" />
      <div className="mk-route-photo-fade absolute inset-x-0 bottom-0" />
    </div>
  );

  if (heroTarget) {
    return createPortal(overlay, heroTarget);
  }

  return overlay;
}

export const MarketingRouteBackdrop = memo(MarketingRouteBackdropInner);
export default MarketingRouteBackdrop;

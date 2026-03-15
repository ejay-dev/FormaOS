'use client';

import { memo, useLayoutEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { selectMarketingRouteMedia } from '@/lib/marketing/background-media';

function MarketingRouteBackdropInner() {
  const pathname = usePathname();
  const activeMedia = selectMarketingRouteMedia(pathname);
  const [heroTarget, setHeroTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    let observer: MutationObserver | null = null;
    let rafId = 0;
    let attempts = 0;
    let cancelled = false;

    const resolveTarget = () => {
      const nextTarget = document.querySelector<HTMLElement>(
        '#main-content .mk-hero, #main-content section',
      );

      setHeroTarget((currentTarget) =>
        currentTarget === nextTarget ? currentTarget : nextTarget,
      );

      return Boolean(nextTarget);
    };

    const tick = () => {
      if (cancelled) return;
      if (resolveTarget()) return;

      attempts += 1;
      if (attempts < 120) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    tick();

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      observer = new MutationObserver(() => {
        resolveTarget();
      });

      observer.observe(mainContent, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
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

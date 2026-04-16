'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getSignUpUrl } from '@/lib/urls';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';

const signUpUrl = getSignUpUrl({ plan: 'pro', source: 'mobile_sticky_cta' });

/**
 * MobileStickyCTA
 *
 * Slim bottom bar that appears after the user scrolls past the hero CTA,
 * and hides when the footer comes into view. Only renders on mobile (<md).
 * Uses IntersectionObserver for performant visibility toggling.
 */
export function MobileStickyCTA() {
  const [visible, setVisible] = useState(false);
  const { trackCtaClick } = useMarketingTelemetry();

  useEffect(() => {
    // Find the hero section's CTA area (the first .mk-btn-primary in the hero)
    const heroCta = document.querySelector(
      '.home-hero .mk-btn-primary, .mk-marketing-flow section:first-of-type .mk-btn-primary',
    );
    const footer = document.querySelector('.mk-footer-premium');

    if (!heroCta) return;

    let heroExited = false;
    let footerVisible = false;

    const update = () => setVisible(heroExited && !footerVisible);

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroExited = !entry.isIntersecting;
        update();
      },
      { threshold: 0 },
    );

    const footerObserver = new IntersectionObserver(
      ([entry]) => {
        footerVisible = entry.isIntersecting;
        update();
      },
      { threshold: 0 },
    );

    heroObserver.observe(heroCta);
    if (footer) footerObserver.observe(footer);

    return () => {
      heroObserver.disconnect();
      footerObserver.disconnect();
    };
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      aria-hidden={!visible}
    >
      <div className="px-4 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-3 bg-gradient-to-t from-[rgba(10,15,28,0.98)] via-[rgba(10,15,28,0.95)] to-transparent backdrop-blur-lg">
        <Link
          href={signUpUrl}
          onClick={() =>
            trackCtaClick({
              surface: 'navigation',
              section: 'mobile_sticky_cta',
              location: 'mobile_bottom_bar',
              ctaLabel: 'Start Free Trial',
              ctaHref: signUpUrl,
              variant: 'primary',
            })
          }
          className="mk-btn mk-btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold"
        >
          Start Free Trial
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
